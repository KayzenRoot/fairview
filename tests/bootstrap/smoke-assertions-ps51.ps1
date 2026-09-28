[CmdletBinding()]
param([Parameter(Mandatory=$true)][string]$HelperPath)
Set-StrictMode -Version Latest
$ErrorActionPreference='Stop'
. (Resolve-Path -LiteralPath $HelperPath).Path

function Expect-HiveFailure([scriptblock]$Case,[string]$Expected) {
    $seen=$false
    try { & $Case } catch {
        if($_.Exception.Message -ne $Expected) {
            throw ('WRONG_FAILURE_EXPECTED_'+$Expected+'_ACTUAL_'+$_.Exception.Message)
        }
        $seen=$true
    }
    if(-not $seen) { throw ('MISSING_EXPECTED_FAILURE_'+$Expected) }
}

$project='00000000-0000-0000-0000-000000000001'
$other='00000000-0000-0000-0000-000000000002'
$run='00000000-0000-0000-0000-000000000003'
$ref='00000000-0000-0000-0000-000000000004'
$hash='a'*64
$otherHash='b'*64
$good=[pscustomobject]@{
    project_id=$project;reference_id=$ref;corpus_run_id=$run
    source_content_sha256=$hash;chunk_content_sha256=$otherHash
    semantic_rank=1;semantic_contribution=0.01
}
$goodResponse=[pscustomobject]@{results=@($good)}
foreach($kind in @('LEXICAL','HYBRID','SEMANTIC')) {
    Assert-HiveResultSet -Response $goodResponse -ProjectId $project -Kind $kind
    $capturedKind=$kind
    Expect-HiveFailure { Assert-HiveResultSet -Response $null -ProjectId $project -Kind $capturedKind } ($kind+'_SEARCH_EMPTY')
    Expect-HiveFailure { Assert-HiveResultSet -Response ([pscustomobject]@{results=$null}) -ProjectId $project -Kind $capturedKind } ($kind+'_SEARCH_EMPTY')
    Expect-HiveFailure { Assert-HiveResultSet -Response ([pscustomobject]@{results=@()}) -ProjectId $project -Kind $capturedKind } ($kind+'_SEARCH_EMPTY')
    Expect-HiveFailure { Assert-HiveResultSet -Response ([pscustomobject]@{results=@($null)}) -ProjectId $project -Kind $capturedKind } ($kind+'_SEARCH_EMPTY')
    $wrong=[pscustomobject]@{project_id=$other;reference_id=$ref;corpus_run_id=$run;source_content_sha256=$hash;chunk_content_sha256=$otherHash}
    Expect-HiveFailure { Assert-HiveResultSet -Response ([pscustomobject]@{results=@($wrong)}) -ProjectId $project -Kind $capturedKind } ($kind+'_RESULT_PROJECT_MISMATCH')
    $missing=[pscustomobject]@{project_id=$project;reference_id=$ref;corpus_run_id=$run;source_content_sha256=$null;chunk_content_sha256=$otherHash}
    Expect-HiveFailure { Assert-HiveResultSet -Response ([pscustomobject]@{results=@($missing)}) -ProjectId $project -Kind $capturedKind } ($kind+'_RESULT_PROVENANCE_MISSING')
}
$genuine=[pscustomobject]@{state='HYBRID';semantic_state='CURRENT';fallback_reason=$null;results=@($good)}
Assert-HiveSemanticContribution -Response $genuine
$noContribution=[pscustomobject]@{project_id=$project;reference_id=$ref;corpus_run_id=$run;source_content_sha256=$hash;chunk_content_sha256=$otherHash;semantic_rank=$null;semantic_contribution=0.0}
$fake=[pscustomobject]@{state='HYBRID';semantic_state='CURRENT';fallback_reason=$null;results=@($noContribution)}
Expect-HiveFailure { Assert-HiveSemanticContribution -Response $fake } 'HYBRID_SEMANTIC_NO_CONTRIBUTION'
$fallback=[pscustomobject]@{state='LEXICAL_FALLBACK_SEMANTIC_UNAVAILABLE';semantic_state='CURRENT';fallback_reason='blocked';results=@($good)}
Expect-HiveFailure { Assert-HiveSemanticContribution -Response $fallback } 'HYBRID_SEMANTIC_FALLBACK_ONLY'
Write-Output '[PASS] PS51_RETRIEVAL_NULL_PROVENANCE_SEMANTIC_CONTRIBUTION'


# Freshness fixtures run in the existing real Windows PowerShell 5.1 CI job.
$head='c'*40
$stale='d'*40
$freshProject=[pscustomobject]@{project_id=$project;relative_path='Fairview';state='READY';git_head_sha=$head;repository_accessible=$true;working_tree_clean=$true}
$freshIndex=[pscustomobject]@{project_id=$project;run_id=$run;repository_head_sha=$head;status='COMPLETED'}
$freshCorpus=[pscustomobject]@{project_id=$project;repository_index_run_id=$run;status='COMPLETED'}
Assert-HiveProjectFresh -Project $freshProject -ProjectId $project -RelativePath 'Fairview' -ExpectedHead $head
Assert-HiveIndexFresh -Index $freshIndex -ProjectId $project -ExpectedHead $head
Assert-HiveCorpusFresh -Corpus $freshCorpus -ProjectId $project -IndexRunId $run
Expect-HiveFailure { Assert-HiveProjectFresh -Project $freshProject -ProjectId $project -RelativePath 'Fairview' -ExpectedHead $stale } 'HIVE_PROJECT_HEAD_STALE'
Expect-HiveFailure { Assert-HiveProjectFresh -Project $freshProject -ProjectId $other -RelativePath 'Fairview' -ExpectedHead $head } 'HIVE_PROJECT_IDENTITY_MISMATCH'
$dirty=[pscustomobject]@{project_id=$project;relative_path='Fairview';state='READY';git_head_sha=$head;repository_accessible=$true;working_tree_clean=$false}
Expect-HiveFailure { Assert-HiveProjectFresh -Project $dirty -ProjectId $project -RelativePath 'Fairview' -ExpectedHead $head } 'HIVE_PROJECT_NOT_FRESH_READY'
$wrongIndex=[pscustomobject]@{project_id=$project;run_id=$run;repository_head_sha=$stale;status='COMPLETED'}
Expect-HiveFailure { Assert-HiveIndexFresh -Index $wrongIndex -ProjectId $project -ExpectedHead $head } 'HIVE_INDEX_HEAD_STALE'
Expect-HiveFailure { Assert-HiveIndexFresh -Index $freshIndex -ProjectId $other -ExpectedHead $head } 'HIVE_INDEX_IDENTITY_MISMATCH'
Expect-HiveFailure { Assert-HiveCorpusFresh -Corpus $freshCorpus -ProjectId $other -IndexRunId $run } 'CORPUS_PROJECT_MISMATCH'
Expect-HiveFailure { Assert-HiveCorpusFresh -Corpus $freshCorpus -ProjectId $project -IndexRunId $other } 'CORPUS_INDEX_GENERATION_STALE'
Write-Output '[PASS] PS51_HIVE_PROJECT_INDEX_CORPUS_HEAD_LINEAGE'


# Real Windows PS5.1 anti-retry fixture for exact-HEAD index and corpus decisions.
$goodCorpus=[pscustomobject]@{
    run_id='00000000-0000-0000-0000-000000000008'
    project_id=$project;repository_index_run_id=$run;status='COMPLETED'
    chunk_count=11;repository_reference_count=12
}
$current=[pscustomobject]@{
    project_id=$project;state='CURRENT';latest_run=$goodCorpus
    chunk_count=11;repository_reference_count=12;last_successful_sync='2026-09-28'
}
if((Get-HiveCorpusAction -Status $current -ProjectId $project -IndexRunId $run) -ne 'REUSE') {
    throw 'EXPECTED_CURRENT_CORPUS_REUSE'
}
$oldBlocked=[pscustomobject]@{
    run_id='00000000-0000-0000-0000-000000000009'
    project_id=$project;repository_index_run_id=$run;status='BLOCKED'
    chunk_count=0;repository_reference_count=0;error='repository_index_stale'
}
$blocked=[pscustomobject]@{
    project_id=$project;state='BLOCKED';latest_run=$oldBlocked
    chunk_count=0;repository_reference_count=0;last_successful_sync=$null
}
if((Get-HiveCorpusAction -Status $blocked -ProjectId $project -IndexRunId $run) -ne 'SYNC_ONCE') {
    throw 'EXPECTED_ONLY_ONE_GITLINK_CORRECTION'
}
$empty=[pscustomobject]@{project_id=$project;state='BLOCKED';latest_run=$null;chunk_count=0;repository_reference_count=0;last_successful_sync=$null}
if((Get-HiveCorpusAction -Status $empty -ProjectId $project -IndexRunId $run) -ne 'SYNC_ONCE') {
    throw 'EXPECTED_INITIAL_CORPUS_SYNC'
}
Expect-HiveFailure { Get-HiveCorpusAction -Status $current -ProjectId $project -IndexRunId $other } 'CORPUS_UNSAFE_TO_RETRY_OR_REUSE'
Expect-HiveFailure { Get-HiveCorpusAction -Status $blocked -ProjectId $project -IndexRunId $other } 'CORPUS_UNSAFE_TO_RETRY_OR_REUSE'
$otherError=[pscustomobject]@{project_id=$project;repository_index_run_id=$run;status='BLOCKED';chunk_count=0;repository_reference_count=0;error='database_error'}
$unsafe=[pscustomobject]@{project_id=$project;state='BLOCKED';latest_run=$otherError;chunk_count=0;repository_reference_count=0;last_successful_sync=$null}
Expect-HiveFailure { Get-HiveCorpusAction -Status $unsafe -ProjectId $project -IndexRunId $run } 'CORPUS_UNSAFE_TO_RETRY_OR_REUSE'
$active=[pscustomobject]@{project_id=$project;state='SYNCING';latest_run=$oldBlocked;chunk_count=0;repository_reference_count=0;last_successful_sync=$null}
Expect-HiveFailure { Get-HiveCorpusAction -Status $active -ProjectId $project -IndexRunId $run } 'CORPUS_UNSAFE_TO_RETRY_OR_REUSE'
$wrong=[pscustomobject]@{project_id=$other;state='CURRENT';latest_run=$goodCorpus;chunk_count=11;repository_reference_count=12}
Expect-HiveFailure { Get-HiveCorpusAction -Status $wrong -ProjectId $project -IndexRunId $run } 'CORPUS_STATUS_PROJECT_OR_INDEX_MISMATCH'
Write-Output '[PASS] PS51_EXISTING_INDEX_AND_CORPUS_REUSE_NO_BLIND_RETRY'
