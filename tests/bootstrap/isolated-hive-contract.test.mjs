import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";
const code=fs.readFileSync(new URL("../../scripts/local/check-hive-isolated.ps1",import.meta.url),"utf8");
const smoke=fs.readFileSync(new URL("../../scripts/local/check-hive.ps1",import.meta.url),"utf8");
const projectList=fs.readFileSync(new URL("../../scripts/local/hive-project-list.ps1",import.meta.url),"utf8");
const cand=JSON.parse(fs.readFileSync(new URL("../../.integrations/hive-fv-maintenance.lock.json",import.meta.url),"utf8"));
test("candidate lock is separate from immutable official HIVE v1.0.3 pin",()=>{
 const official=JSON.parse(fs.readFileSync(new URL("../../.integrations/hive.lock.json",import.meta.url),"utf8"));
 assert.equal(official.commit,"52bd3dab54dd4f16264072e198ed1fc23168f7fa");
 assert.equal(cand.base_release_commit,official.commit);assert.match(cand.candidate_sha,/^[0-9a-f]{40}$/);
 assert.equal(cand.scope,"ISOLATED_LOCAL_DEV_ONLY");
});
test("isolated doctor checks exact SHA, mount identities, root boundary and port",()=>{
 for(const marker of ["hive-fairview-dev","UNAUTHORIZED_COMPOSE_PROJECT","GLOBAL_HIVE_DATA_ROOT_FORBIDDEN","HIVE_SOURCE_SHA_MISMATCH","PROJECT_MOUNT_NOT_READONLY","COMPOSE_WORKDIR_SOURCE_MISMATCH","API_PORT_NOT_ISOLATED_LOOPBACK","CANDIDATE_HOSTED_PROOFS_INCOMPLETE"])assert(code.includes(marker));
});
test("does not mutate volumes or expose Docker environment",()=>{
 for(const marker of ["Container 'postgres'","Container 'redis'","/workspace/projects","/var/lib/hive","/var/lib/postgresql/data","-BaseUrl","Fairview"])assert(code.includes(marker));
 for(const forbidden of ["Config.Env","down -v","down --volumes","reset --hard","Remove-Item","docker compose up"])assert(!code.includes(forbidden));
});

test("Inspect permits pin-stable read-only preflight before hosted candidate validation while Verify gates candidate",()=>{
 assert(code.includes("$Mode -eq 'Verify' -and"));
 assert(code.includes("$Mode -eq 'Inspect'"));
 assert(code.includes("$lock.base_release_commit"));
 assert(code.includes("$lock.candidate_sha"));
});

test("PowerShell 5.1 switch forwarding omits false switch across both native subprocess boundaries",()=>{
 const child=fs.readFileSync(new URL("../../scripts/local/invoke-hive-smoke.ps1",import.meta.url),"utf8");
 assert(!code.includes("-RequireSemantic:$RequireSemantic"));
 assert(!child.includes("-RequireSemantic:$RequireSemantic"));
 for(const source of [code,child]) {
   assert(source.includes("if($RequireSemantic.IsPresent)"));
   assert(source.includes("'-RequireSemantic'"));
   assert(source.includes("powershell.exe @"));
 }
 assert(child.includes("$LASTEXITCODE"));
 assert(code.includes("$smokeExit=$LASTEXITCODE"));
});

test("PowerShell HIVE project list is normalized before filtering",()=>{
 assert.equal((smoke.match(/Convert-HiveProjectList -Response \$projectResponse/g)||[]).length,2);
 assert(projectList.includes("foreach($item in $Response)"));
 assert(!smoke.includes('Invoke-RestMethod -Uri "$BaseUrl/api/v1/projects" -Method Get -TimeoutSec 10 | Where-Object'));
});
