#!/usr/bin/env node
// Run only after selected tests passed. Generates non-canonical CI artifact bound to actual Git HEAD.
import fs from "node:fs";import path from "node:path";import crypto from"node:crypto";import{spawnSync}from"node:child_process";
import{calculateImpact}from"./lib/impact.mjs";
import{parseGitDiffNameStatusZ}from"./lib/git-diff.mjs";
function git(args){const p=spawnSync("git",args,{encoding:"utf8"});if(p.status!==0)throw Error("GIT_FAILED: "+args[0]);return p.stdout}
const root=process.cwd(),head=git(["rev-parse","HEAD"]).trim(),base=process.env.EVIDENCE_BASE_SHA;
if(!base|| !/^[0-9a-f]{40}$/i.test(base))throw Error("EVIDENCE_BASE_SHA_REQUIRED");
const changed=parseGitDiffNameStatusZ(git(["diff","--name-status","-z","--find-renames","--diff-filter=ACDMRTUXB",base+"..."+head,"--"]));
const registry=JSON.parse(fs.readFileSync("harness/modules.json","utf8")),impact=calculateImpact(registry,changed);
if(impact.unknown.length||impact.planned.length)throw Error("UNVERIFIED_IMPACT");
const src=fs.readFileSync(".engineering/CHECKPOINT.json");
const cp=JSON.parse(src);
const output={schema_version:1,project:"Fairview",work_order:cp.work_order,base_sha:base,head_sha:head,
source_checkpoint_status:cp.status,changed_files:changed,impacted_modules:impact.active,
tests_verified:process.env.EVIDENCE_TESTS_VERIFIED==="1"?["check-sources","security-scan","harness-doctor","affected-module-unit-tests"]:[],
upstream_validation:"separate_geF_job",windows_development_setup:"CHECKED_BY_WINDOWS_CI_NO_EXTERNAL_SERVICES",
source_checkpoint_sha256:crypto.createHash("sha256").update(src).digest("hex"),
generated_at:new Date().toISOString()};
if(!output.tests_verified.length)throw Error("NO_VERIFIED_TEST_PROOF");
fs.mkdirSync(path.join(root,"tmp","evidence"),{recursive:true});
const dest=path.join(root,"tmp","evidence",head+".json");fs.writeFileSync(dest,JSON.stringify(output,null,2)+"\n");
console.log("[PASS] noncanonical exact-head CI Evidence Bundle "+dest);
