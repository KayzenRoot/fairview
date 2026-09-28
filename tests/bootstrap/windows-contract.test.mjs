import test from"node:test";import assert from"node:assert/strict";import fs from"node:fs";
const setup=fs.readFileSync(new URL("../../scripts/local/setup-windows.ps1",import.meta.url),"utf8");
const smoke=fs.readFileSync(new URL("../../scripts/local/check-hive.ps1",import.meta.url),"utf8");
const projectList=fs.readFileSync(new URL("../../scripts/local/hive-project-list.ps1",import.meta.url),"utf8");
const assertions=fs.readFileSync(new URL("../../scripts/local/hive-smoke-assertions.ps1",import.meta.url),"utf8");
test("windows pins exact GEF and HIVE and refuses mismatch",()=>{assert.match(setup,/866fe3af8cccc65c929aaf6a47a924401fa448b3/);assert.match(setup,/52bd3dab54dd4f16264072e198ed1fc23168f7fa/);assert.match(setup,/Pinned-Commit/);assert.match(setup,/HIVE_ENV_ROOT_CONFLICT/)});
test("never performs destructive Docker volume wipe",()=>{assert.doesNotMatch(setup,/down\s+--volumes|down\s+-v|Remove-Item.*HiveData/i)});
test("HIVE smoke actually tests READY and retrieval; semantic optional and gated",()=>{for(const s of ["READY","/retrieval/lexical","/retrieval/hybrid","/retrieval/semantic","SEMANTIC_PROVIDER_NOT_CONFIGURED","$project.project_id","INDEX_NOT_VERIFIED_NO_REINDEX_AUTHORIZED"])assert(smoke.includes(s));assert.equal((smoke.match(/Convert-HiveProjectList -Response \$projectResponse/g)||[]).length,2);assert(projectList.includes("foreach($item in $Response)"));assert(!smoke.includes('Invoke-RestMethod -Uri "$BaseUrl/api/v1/projects" -Method Get -TimeoutSec 10 | Where-Object'))});

test("R8 retrieval proofs reject empty arrays and semantic fallback",()=>{for(const s of ["Assert-HiveResultSet -Response $lexical","Assert-HiveResultSet -Response $hybrid","Assert-HiveResultSet -Response $result","Assert-HiveSemanticContribution -Response $hybrid","CORPUS_EMPTY_OR_NO_REPOSITORY_REFERENCES","SEMANTIC_EMBEDDINGS_INCOMPLETE_OR_STALE","strict_semantic=$true"])assert(smoke.includes(s));assert(!smoke.includes("@($lexical.results).Count"));assert(!smoke.includes("@($hybrid.results).Count"));assert(!smoke.includes("@($result.results).Count"));for(const s of ["$null -eq $Response.results","source_content_sha256","chunk_content_sha256","semantic_contribution"])assert(assertions.includes(s))});

test("R8 requires fresh inspected project, index and corpus exact Git lineage",()=>{
    for(const marker of ["Get-LocalFairviewHead","rev-parse HEAD","Assert-HiveProjectFresh -Project $project","Assert-HiveIndexFresh -Index $index","Assert-HiveCorpusFresh -Corpus $corpus"])assert(smoke.includes(marker));
    assert(!smoke.includes("if ($project.state -ne 'READY') {"));
    for(const marker of ["git_head_sha","repository_head_sha","repository_index_run_id","working_tree_clean","HIVE_PROJECT_HEAD_STALE","HIVE_INDEX_HEAD_STALE","CORPUS_INDEX_GENERATION_STALE"])assert(assertions.includes(marker));
    const fixture=fs.readFileSync(new URL("../../tests/bootstrap/smoke-assertions-ps51.ps1",import.meta.url),"utf8");
    assert(fixture.includes("PS51_HIVE_PROJECT_INDEX_CORPUS_HEAD_LINEAGE"));
});

test("R8 reuses existing exact-HEAD index and only corrects known empty gitlink-blocked corpus",()=>{
    const preflight=smoke.indexOf("SEMANTIC_PROVIDER_NOT_CONFIGURED");
    const indexGet=smoke.indexOf('Invoke-RestMethod -Uri "$BaseUrl/api/v1/projects/$id/index/status"');
    const corpusStatus=smoke.indexOf('Invoke-RestMethod -Uri "$BaseUrl/api/v1/projects/$id/retrieval/corpus"');
    const corpusPost=smoke.indexOf('Post "/api/v1/projects/$id/retrieval/corpus/sync"');
    assert(preflight>=0&&indexGet>preflight&&corpusStatus>indexGet&&corpusPost>corpusStatus);
    assert.equal((smoke.match(/Post "\/api\/v1\/projects\/\$id\/index"/g)||[]).length,1);
    assert(smoke.includes("if($indexAction -eq 'ADVANCE_ONCE')"));
    assert(smoke.includes("Get-HiveCorpusAction -Status $status"));
    for(const s of ["CORPUS_UNSAFE_TO_RETRY_OR_REUSE","repository_index_stale","SYNC_ONCE","REUSE"])assert(assertions.includes(s));
    const fixture=fs.readFileSync(new URL("../../tests/bootstrap/smoke-assertions-ps51.ps1",import.meta.url),"utf8");
    assert(fixture.includes("PS51_EXISTING_INDEX_AND_CORPUS_REUSE_NO_BLIND_RETRY"));
    assert(smoke.includes("current semantic embeddings reused"));
    assert(smoke.includes("SEMANTIC_CONCURRENT_SYNC_FORBIDDEN"));
});

test("one-shot descendant advancement is witnessed, ancestral, and forwarded safely",()=>{
 const doctor=fs.readFileSync(new URL("../../scripts/local/check-hive-isolated.ps1",import.meta.url),"utf8");
 const runner=fs.readFileSync(new URL("../../scripts/local/invoke-hive-smoke.ps1",import.meta.url),"utf8");
 for(const code of [smoke,doctor,runner])assert(code.includes("AllowHeadAdvanceIndex"));
 assert(fs.readFileSync(new URL("../../scripts/local/hive-window-assertions.ps1",import.meta.url),"utf8").includes("operator_authorized_one_head_advance_index"));
 assert(fs.readFileSync(new URL("../../scripts/local/hive-window-assertions.ps1",import.meta.url),"utf8").includes("target_fairview_head"));
 assert(fs.readFileSync(new URL("../../scripts/local/hive-window-assertions.ps1",import.meta.url),"utf8").includes("WINDOW_HEAD_ADVANCE_NOT_OPERATOR_AUTHORIZED"));
 assert(smoke.includes("merge-base --is-ancestor"));
 assert(smoke.includes("Get-HiveIndexAction"));
 assert(smoke.includes("PriorIndexRunId $priorIndexRunId"));
 assert.equal((smoke.match(/Post "\/api\/v1\/projects\/\$id\/index"/g)||[]).length,1);
 const ps51=fs.readFileSync(new URL("../../tests/bootstrap/smoke-assertions-ps51.ps1",import.meta.url),"utf8");
 assert(ps51.includes("PS51_EXPLICIT_ONE_SHOT_VERIFIED_MAIN_INDEX_ADVANCE"));
});

test("direct index advance and corpus sync demand a live window and durable one-shot journal",()=>{
 const doctor=fs.readFileSync(new URL("../../scripts/local/check-hive-isolated.ps1",import.meta.url),"utf8");
 const runner=fs.readFileSync(new URL("../../scripts/local/invoke-hive-smoke.ps1",import.meta.url),"utf8");
 for(const marker of ["ExclusiveWindowReceipt","HiveCheckout","IsolatedDataRoot","Assert-MutationWindow -ForIndexAdvance $true","Assert-HiveHeadAdvanceReceipt -Receipt $script:PrivateWindowReceipt","'-WindowOnly'"])assert([smoke,doctor,runner].some(s=>s.includes(marker)),marker);
 assert(doctor.includes("if($WindowOnly.IsPresent)"));
 assert(doctor.indexOf("if($WindowOnly.IsPresent)")<doctor.indexOf("$smokeArguments=@("));
 assert(smoke.includes("Write-CorpusAttemptJournal"));
 assert(smoke.indexOf("Write-CorpusAttemptJournal -ProjectId")<smoke.indexOf('Post "/api/v1/projects/$id/retrieval/corpus/sync"'));
 assert(assertions.includes("AuthorizedPriorRunId"));
 const fixture=fs.readFileSync(new URL("../../tests/bootstrap/smoke-assertions-ps51.ps1",import.meta.url),"utf8");
 assert(fixture.includes("PS51_ONE_SHOT_CORPUS_AND_FIRST_NEW_SEMANTIC_SYNC"));
});

test("corpus journal cannot be relocated by reissuing the receipt",()=>{
 const window=fs.readFileSync(new URL("../../scripts/local/hive-window-assertions.ps1",import.meta.url),"utf8");
 const fixture=fs.readFileSync(new URL("../../tests/bootstrap/hive-window-assertions-ps51.ps1",import.meta.url),"utf8");
 assert(smoke.includes("GetFolderPath("));
 assert(smoke.includes("CommonApplicationData"));
 assert(!smoke.includes("LocalApplicationData"));
 assert(smoke.includes("Get-HiveCorpusJournalPath"));
 assert(!smoke.includes("Split-Path -Path $ExclusiveWindowReceipt -Parent"));
 assert(window.includes("PSObject.Properties['prior_corpus_run_id']"));
 assert(smoke.includes("PSObject.Properties['prior_corpus_run_id']"));
 assert(fixture.includes("PS51_INITIAL_CORPUS_OMITTED_PRIOR_AND_STABLE_PRIVATE_JOURNAL"));
});
