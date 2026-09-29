import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const setup=fs.readFileSync(new URL("../../scripts/local/setup-windows.ps1",import.meta.url),"utf8");
const preflight=fs.readFileSync(new URL("../../scripts/local/verify-checkpoint.ps1",import.meta.url),"utf8");
test("Windows setup requires exact pinned GEF v1.0.0 and Node >=22",()=>{
 for(const marker of ["866fe3af8cccc65c929aaf6a47a924401fa448b3","NODE_22_REQUIRED","GEF_SUBMODULE_UNINITIALIZED","GEF_PIN_MISMATCH","ValidateSet('Doctor','Install')","UNEXPECTED_REPOSITORY_ORIGIN"])assert(setup.includes(marker),marker);
});
test("Doctor is local source-only and Install confines dependencies to pinned GEF",()=>{
 assert(!setup.includes("docker"));
 assert(!setup.includes("pip install"));
 assert(!setup.includes("Remove-Item"));
 assert(!setup.includes("reset --hard"));
 assert(setup.includes("submodule','update','--init','--recursive"));
 assert(setup.includes("npm' @('ci')"));
 assert(setup.includes("scripts/check-sources.mjs"));
 assert(setup.includes("scripts/security-scan.mjs"));
});
test("preflight validates GitHub exact-main CI without destructive synchronization",()=>{
 for(const marker of ["LOCAL_HEAD_DIFFERS_FROM_ORIGIN_MAIN_REFUSE_NO_RESET","GITHUB_API_MAIN_DIFFERS_FROM_LOCAL_REF_RECHECK","NO_SUCCESSFUL_EXACT_MAIN_CI","Public repository security gate","Source Pack and impact-driven harness","Windows PowerShell parser and harness","Pinned GEF release validation","scripts/check-sources.mjs","scripts/security-scan.mjs"])assert(preflight.includes(marker),marker);
 for(const forbidden of ["reset --hard","git clean -fd","checkout -f","issues/1/comments"])assert(!preflight.includes(forbidden),forbidden);
});
