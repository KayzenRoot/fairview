import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";
const doc=fs.readFileSync(new URL("../../scripts/local/verify-checkpoint.ps1",import.meta.url),"utf8");
test("preflight checks local clean checkout and API origin/main exact identity, never force resets",()=>{
 for(const word of ["status','--porcelain","fetch','--prune","refs/remotes/origin/main","LOCAL_HEAD_DIFFERS_FROM_ORIGIN_MAIN_REFUSE_NO_RESET","GITHUB_API_MAIN_DIFFERS_FROM_LOCAL_REF_RECHECK"])assert(doc.includes(word));
 for(const forbidden of ["reset --hard","checkout -f","push --force","git clean -fd"])assert(!doc.includes(forbidden));
});
test("external receipt ties only owner's attestation to exact SHA and exact CI run",()=>{
 for(const word of ["FAIRVIEW_CHECKPOINT_RECEIPT_V1 sha=$head ci=$($run.id)","LOCAL_DEV_PRECHECK","audit=OWNER_SELF_AUDIT","user.login -eq 'KayzenRoot'","run.updated_at"])assert(doc.includes(word));
});
test("must observe four successful jobs on exact completed push SHA and run security scan",()=>{
 for(const word of ["Public repository security gate","Source Pack and impact-driven harness","Windows PowerShell parser and harness","Pinned GEF release validation","head_sha -eq $head","conclusion -eq 'success'","node scripts/security-scan.mjs"])assert(doc.includes(word));
});
test("verified local tooling never asserts actual HIVE or trading runtime",()=>{
 assert(doc.includes("NOT an independent audit"));assert(doc.includes("permission to live trade"));
});
