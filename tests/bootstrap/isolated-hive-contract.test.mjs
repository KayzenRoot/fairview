import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";
const code=fs.readFileSync(new URL("../../scripts/local/check-hive-isolated.ps1",import.meta.url),"utf8");
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
 for(const forbidden of ["down -v","down --volumes","reset --hard","Remove-Item","docker compose up"])assert(!code.includes(forbidden));
 assert(code.includes("{{json .Config.Env}}")); // read only in memory to check discovery flag
 assert(!code.includes("Write-Host $configEnvironment"));
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

test("Verify rejects writes before smoke unless discovery is off and exclusive window is witnessed",()=>{
 const pure=fs.readFileSync(new URL("../../scripts/local/hive-window-assertions.ps1",import.meta.url),"utf8");
 const fixture=fs.readFileSync(new URL("../../tests/bootstrap/hive-window-assertions-ps51.ps1",import.meta.url),"utf8");
 for(const marker of ["ExclusiveWindowReceipt","WINDOW_RECEIPT_REQUIRED","Assert-HiveWindowReceipt","Assert-HiveAutoDiscoveryDisabled","Get-HiveDatabaseWriteStats","Assert-HiveDatabaseQuiet","Start-Sleep -Seconds $ObserveSeconds","WINDOW_BACKUP_DIGEST_MISMATCH"])assert(code.includes(marker));
 assert(code.indexOf("Assert-HiveDatabaseQuiet -Before $before -After $after")<code.indexOf("$smokeArguments=@("));
 for(const marker of ["WINDOW_DISCOVERY_STILL_ENABLED","WINDOW_OPERATOR_CONSENT_NOT_PROVEN","WINDOW_DB_WRITES_OBSERVED","WINDOW_DB_STATS_UNTRUSTWORTHY"])assert(pure.includes(marker));
 assert(fixture.includes("PS51_ISOLATED_WRITER_WINDOW_FAIL_CLOSED"));
});

test("even an in-place Docker restart and backup archive under public Git are rejected",()=>{assert(code.includes("WINDOW_CONTAINER_RESTARTED"));assert(code.includes("WINDOW_BACKUP_MUST_STAY_OFF_GIT_AND_GLOBAL_HIVE"));assert(code.includes("{{.State.StartedAt}}"));});

test("index main advancement needs exact prior SHA and off-Git explicit operator approval",()=>{
 const runner=fs.readFileSync(new URL("../../scripts/local/invoke-hive-smoke.ps1",import.meta.url),"utf8");
 for(const source of [code,runner]) {
  assert(source.includes("AllowHeadAdvanceIndex"));
  assert(source.includes("prior_index_head")||source.includes("AuthorizedPriorIndexHead"));
  assert(source.includes("if($AllowHeadAdvanceIndex.IsPresent)"));
 }
 assert(fs.readFileSync(new URL("../../scripts/local/hive-window-assertions.ps1",import.meta.url),"utf8").includes("operator_authorized_one_head_advance_index"));
 assert(fs.readFileSync(new URL("../../scripts/local/hive-window-assertions.ps1",import.meta.url),"utf8").includes("target_fairview_head"));
 assert(code.includes("Assert-HiveHeadAdvanceReceipt"));
 assert(fs.readFileSync(new URL("../../scripts/local/hive-window-assertions.ps1",import.meta.url),"utf8").includes("WINDOW_HEAD_ADVANCE_NOT_OPERATOR_AUTHORIZED"));
});

test("window-only direct smoke preflight never invokes a second smoke",()=>{
 assert(code.includes("WINDOW_ONLY_REQUIRES_VERIFY"));
 assert(code.includes("if($WindowOnly.IsPresent)"));
 assert(code.indexOf("if($WindowOnly.IsPresent)")<code.indexOf("$smokeArguments=@("));
 const runner=fs.readFileSync(new URL("../../scripts/local/invoke-hive-smoke.ps1",import.meta.url),"utf8");
 for(const marker of ["'-HiveCheckout'","'-IsolatedDataRoot'","'-ExclusiveWindowReceipt'"]){
   assert(runner.includes(marker)||code.includes(marker),marker);
 }
});

test("R8 rejects stale receipt time and WAL drift, and hashes a trusted archive path",()=>{
 const pure=fs.readFileSync(new URL("../../scripts/local/hive-window-assertions.ps1",import.meta.url),"utf8");
 const fixture=fs.readFileSync(new URL("../../tests/bootstrap/hive-window-assertions-ps51.ps1",import.meta.url),"utf8");
 for(const marker of ["pg_current_wal_lsn()","Get-HiveTrustedBackupPath -BackupPath","$trustedBackup","Get-FileHash -LiteralPath $trustedBackup"])assert(code.includes(marker),marker);
 for(const marker of ["WINDOW_DB_WAL_WRITES_OBSERVED","WINDOW_RECEIPT_TIMESTAMP_INVALID","ReparsePoint","IsPathRooted","GetFullPath"])assert(pure.includes(marker),marker);
 assert(fixture.includes("PS51_R8_WAL_BACKUP_UTC_GATES"));
});
