#!/usr/bin/env node
// Public Fairview zero-secret scanner: full tracked tree (CI) or staged index content (opt-in hook).
// Does not print secrets, only paths and finding categories. This is not a substitute for review.
import fs from "node:fs";
import {spawnSync} from "node:child_process";
import {forbiddenPath,suspiciousContent,workflowHazards,MAX_SCANNED_BYTES} from "./lib/public-safety.mjs";
const staged=process.argv.slice(2).includes("--staged");
if (process.argv.slice(2).some(a=>a!=="--staged")) { console.error("[BLOCKED] UNKNOWN_ARGUMENT");process.exit(2); }
function git(args) {
  const result=spawnSync("git",args,{encoding:null,maxBuffer:8*1024*1024,windowsHide:true});
  if (result.error || result.status!==0 || !Buffer.isBuffer(result.stdout)) {
    throw Error("GIT_COMMAND_FAILED "+args[0]);
  }
  return result.stdout;
}
function entries() {
  const out=git(["ls-files","--stage","-z"]);
  const all=out.toString("utf8").split("\0").filter(Boolean).map(line=>{
    const split=line.indexOf("\t");if(split<0)throw Error("INVALID_INDEX_RECORD");
    const meta=line.slice(0,split).match(/^([0-7]{6}) [0-9a-f]{40,64} [0-3]$/);
    if(!meta)throw Error("INVALID_INDEX_MODE");
    return {name:line.slice(split+1),mode:meta[1]};
  });
  const unique=new Set();
  for(const e of all) {
    if(unique.has(e.name))throw Error("UNMERGED_OR_DUPLICATE_INDEX_ENTRY");
    unique.add(e.name);
  }
  return all;
}
try {
  const tracked=entries(),target=new Set();
  if(staged){
    const changes=git(["diff","--cached","--name-only","--diff-filter=ACMRT","-z","--"]).toString("utf8");
    for(const p of changes.split("\0").filter(Boolean))target.add(p);
  } else for(const e of tracked)target.add(e.name);
  const findings=[];
  for(const e of tracked) {
    const forbidden=forbiddenPath(e.name);
    if(forbidden)findings.push({path:e.name,category:forbidden});
    if(!target.has(e.name) || e.mode==="160000" || forbidden)continue;
    if(e.mode==="120000") {findings.push({path:e.name,category:"UNSCANNED_SYMLINK"});continue;}
    let content;
    if(staged)content=git(["show",":"+e.name]);
    else {
      if(!fs.existsSync(e.name)){findings.push({path:e.name,category:"TRACKED_FILE_MISSING"});continue;}
      const stat=fs.lstatSync(e.name);
      if(!stat.isFile()) {findings.push({path:e.name,category:"UNSCANNED_NONFILE"});continue;}
      if(stat.size>MAX_SCANNED_BYTES) {findings.push({path:e.name,category:"UNSCANNED_LARGE_FILE"});continue;}
      content=fs.readFileSync(e.name);
    }
    if(content.length>MAX_SCANNED_BYTES) {findings.push({path:e.name,category:"UNSCANNED_LARGE_FILE"});continue;}
    if(content.includes(0)) {findings.push({path:e.name,category:"UNSCANNED_BINARY"});continue;}
    const text=content.toString("utf8");
    for(const category of [...suspiciousContent(text),...workflowHazards(e.name,text)])findings.push({path:e.name,category});
  }
  if(findings.length) {
    for(const f of findings) console.error("[BLOCKED] "+f.path+": "+f.category);
    process.exit(1);
  }
  console.log("[PASS] Fairview public-repository "+(staged?"index/staged":"tracked-tree")+" secret/path baseline; content never printed");
} catch(error) {
  console.error("[BLOCKED] SECURITY_SCAN_UNAVAILABLE "+String(error.message).replace(/[^A-Za-z0-9_ -]/g,"").slice(0,100));
  process.exit(1);
}
