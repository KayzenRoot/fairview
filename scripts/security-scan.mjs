#!/usr/bin/env node
// Fast deterministic baseline only; production high assurance adds dedicated SAST/secret scanning.
import{spawnSync}from"node:child_process";import fs from"node:fs";
const tracked=spawnSync("git",["ls-files","-z"],{encoding:"utf8"});
if(tracked.status!==0)throw Error("GIT_TRACKED_FILE_LIST_FAILED");
const excluded=[".env",".env.production",".env.local","id_rsa","id_ed25519"];
const patterns=[/-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/,/\b(?:sk_live|pk_live)_[A-Za-z0-9]{16,}\b/,/\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/];
let bad=false;
for(const name of tracked.stdout.split("\0").filter(Boolean)){
 if(name.split("/").some(n=>excluded.includes(n))){console.error("[FAIL] SECRET_FILENAME "+name);bad=true;continue}
 if(!fs.existsSync(name)||fs.statSync(name).isDirectory())continue;
 const body=fs.readFileSync(name,"utf8");
 if(patterns.some(re=>re.test(body))){console.error("[FAIL] POSSIBLE_SECRET "+name);bad=true}
}
if(bad)process.exit(1);console.log("[PASS] deterministic tracked-file secret baseline");
