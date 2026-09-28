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
