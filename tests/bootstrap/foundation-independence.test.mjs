import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {execFileSync} from "node:child_process";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"../..");
const withdrawn=String.fromCharCode(72,73,86,69);
const word=new RegExp("\\b"+withdrawn+"\\b","i");
test("withdrawn service is absent from every tracked active path and content",()=>{
 const names=execFileSync("git",["ls-files","-z"],{cwd:root}).toString("utf8").split("\0").filter(Boolean);
 const matches=[];
 for(const name of names){
  const full=path.join(root,name);
  if(!fs.existsSync(full)||fs.statSync(full).isDirectory())continue;
  const content=fs.readFileSync(full,"utf8");
  if(word.test(name)||word.test(content))matches.push(name);
 }
 assert.deepEqual(matches,[],"Obsolete external-service reference returned");
});
test("pinned native GEF and source harness remain",()=>{
 assert(fs.existsSync(path.join(root,".gitmodules")));
 assert(fs.existsSync(path.join(root,"scripts/harness.mjs")));
 assert(fs.existsSync(path.join(root,"scripts/local/setup-windows.ps1")));
 const packageJson=JSON.parse(fs.readFileSync(path.join(root,"package.json"),"utf8"));
 assert(packageJson.scripts.validate.includes("check-sources.mjs"));
});
