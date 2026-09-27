#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import {spawnSync} from "node:child_process";
import {fileURLToPath} from "node:url";
import {calculateImpact,validateRegistry} from "./lib/impact.mjs";
import {parseGitDiffNameStatusZ} from "./lib/git-diff.mjs";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const args=process.argv.slice(2);
const registry=validateRegistry(JSON.parse(fs.readFileSync(path.join(root,"harness/modules.json"),"utf8")));
const fail=(message,code=1)=>{console.error("[FAIL] "+message);process.exit(code)};
const run=(command,argv,inherit=false)=>spawnSync(command,argv,{cwd:root,encoding:"utf8",stdio:inherit?"inherit":"pipe",shell:false});
function checkDoctor(){
 const required=["AGENTS.md",".gitmodules",".integrations/hive.lock.json",".engineering/SOURCE-HIERARCHY.md",".engineering/CHECKPOINT.md",".engineering/DEFINITION-OF-DONE.md",".engineering/work-orders/FV-BOOT-001.md"];
 for(const f of required) if(!fs.existsSync(path.join(root,f))) fail("MISSING_FILE "+f);
 const hive=JSON.parse(fs.readFileSync(path.join(root,".integrations/hive.lock.json"),"utf8"));
 if(hive.version!=="v1.0.3"||hive.commit!=="52bd3dab54dd4f16264072e198ed1fc23168f7fa") fail("HIVE_PIN_MISMATCH");
 const gitlink=run("git",["ls-tree","HEAD","vendor/gef-bootstrap"]);
 if(gitlink.status!==0||!gitlink.stdout.includes("160000 commit 866fe3af8cccc65c929aaf6a47a924401fa448b3")) fail("GEF_GITLINK_MISMATCH_OR_MISSING");
 if(!fs.existsSync(path.join(root,"vendor/gef-bootstrap/package.json"))) fail("GEF_SUBMODULE_NOT_INITIALIZED: git submodule update --init --recursive");
 console.log("[PASS] doctor sourcepack pins gitlink and initialized GEF checkout");
}
function getFiles(base,head){
 if(!/^[a-fA-F0-9]{40}$/.test(base)|| !/^(HEAD|[a-fA-F0-9]{40})$/.test(head)) fail("INVALID_BASE_HEAD");
 const diff=run("git",["diff","--name-status","-z","--find-renames","--diff-filter=ACDMRTUXB",base+"..."+head,"--"]);
 if(diff.status!==0) fail("GIT_DIFF_FAILED "+(diff.stderr||"").slice(0,240));
 try { return parseGitDiffNameStatusZ(diff.stdout); } catch (error) { fail("GIT_DIFF_PARSE_FAILED "+error.message); }
}
const arg=(name,fallback)=>{const n=args.indexOf(name);return n>=0?args[n+1]:fallback};
function impact(files){
 const result=calculateImpact(registry,files);
 console.log(JSON.stringify(result,null,2));
 if(result.unknown.length) fail("UNKNOWN_FILES_FAIL_CLOSED");
 if(result.planned.length) fail("PLANNED_MODULE_TOUCHED_WITHOUT_TEST_HARNESS: "+result.planned.join(","));
 return result;
}
if(args[0]==="doctor") checkDoctor();
else if(args[0]==="impact"){
 const base=arg("--base"),head=arg("--head","HEAD");if(!base)fail("REQUIRES_EXACT_BASE");
 impact(getFiles(base,head));
}else if(args[0]==="verify"){
 let selected;
 if(args.includes("--all")) selected=registry.modules.filter(m=>m.state==="active").map(m=>m.id);
 else if(args.includes("--changed")){const base=arg("--base");if(!base)fail("REQUIRES_EXACT_BASE");selected=impact(getFiles(base,arg("--head","HEAD"))).active}
 else fail("USE verify --all OR verify --changed --base SHA");
 if(!selected.length) console.log("[PASS] no active module selected; source integrity still required in CI");
 for(const id of selected){
 const mod=registry.modules.find(m=>m.id===id);
 if(!mod?.tests?.length) fail("NO_TESTS_FOR_ACTIVE_MODULE "+id);
 for(const glob of mod.tests){
 if(!glob.endsWith("*.test.mjs"))fail("UNSUPPORTED_TEST_GLOB "+glob);
 const folder=glob.slice(0,glob.indexOf("*"));
 if(!fs.existsSync(path.join(root,folder))||!fs.readdirSync(path.join(root,folder)).some(x=>x.endsWith(".test.mjs")))fail("NO_TEST_FILES "+id);
 const result=run("node",["--test",glob],true);
 if(result.status!==0)fail("MODULE_TEST_FAILED "+id+" "+result.status);
 }
 console.log("[PASS] module "+id);
 }
}else fail("USAGE: doctor | impact --base SHA [--head HEAD] | verify --all | verify --changed --base SHA");
