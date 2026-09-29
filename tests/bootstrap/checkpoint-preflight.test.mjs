import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const doc=fs.readFileSync(new URL("../../scripts/local/verify-checkpoint.ps1",import.meta.url),"utf8");
test("source preflight compares clean local and remote exact main and never forces resets",()=>{
 for(const word of ["status','--porcelain","fetch','--prune","refs/remotes/origin/main","LOCAL_HEAD_DIFFERS_FROM_ORIGIN_MAIN_REFUSE_NO_RESET","GITHUB_API_MAIN_DIFFERS_FROM_LOCAL_REF_RECHECK"])assert(doc.includes(word),word);
 for(const forbidden of ["reset --hard","checkout -f","push --force","git clean -fd"])assert(!doc.includes(forbidden));
});
test("Windows PowerShell 5.1 native Git stderr is handled and original error preference restored",()=>{
 const runGit=doc.match(/function RunGit\([\s\S]*?\n}\nfunction GitHubGet/)?.[0]??"";
 const relaxed=runGit.indexOf("$ErrorActionPreference='Continue'");
 const nativeGit=runGit.indexOf("2>$null | Out-String");
 const restored=runGit.indexOf("$ErrorActionPreference=$savedErrorActionPreference");
 assert(relaxed>=0&&nativeGit>relaxed&&restored>nativeGit);
 assert(runGit.includes("$exitCode=$LASTEXITCODE"));
});
test("exact main CI must show four completed successful jobs",()=>{
 for(const s of ["head_sha -eq $head","conclusion -eq 'success'","Public repository security gate","Source Pack and impact-driven harness","Windows PowerShell parser and harness","Pinned GEF release validation"])assert(doc.includes(s),s);
});
test("local development preflight does not pretend independent production qualification",()=>{
 assert(doc.includes("no independent review"));
 assert(doc.includes("live trading authorization"));
 assert(!doc.includes("issues/1/comments"));
});
