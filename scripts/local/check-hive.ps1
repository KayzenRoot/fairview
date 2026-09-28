# FV-BOOT-001 actual REST smoke; never substitutes fake IDs or synthetic success.
[CmdletBinding()]
param(
    [string]$BaseUrl = 'http://localhost:8000',
    [string]$ProjectRelativePath = 'Fairview',
    [switch]$RequireSemantic
)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'hive-project-list.ps1')
. (Join-Path $PSScriptRoot 'hive-smoke-assertions.ps1')
function Get-LocalFairviewHead {
    $repo=(Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..\..')).Path
    $previous=$ErrorActionPreference
    try {
        $ErrorActionPreference='Continue'
        $head=(& git -C $repo rev-parse HEAD 2>$null | Out-String).Trim()
        $code=$LASTEXITCODE
    } finally { $ErrorActionPreference=$previous }
    if($code -ne 0 -or $head -cnotmatch '^[0-9a-f]{40}$') { throw 'FAIRVIEW_LOCAL_GIT_HEAD_UNVERIFIED' }
    return $head
}
function Post([string]$suffix,[object]$data=$null) {
    $parameters=@{Uri="$BaseUrl$suffix";Method='Post';TimeoutSec=90}
    if ($null -ne $data) { $parameters.ContentType='application/json';$parameters.Body=($data | ConvertTo-Json -Depth 6 -Compress) }
    return Invoke-RestMethod @parameters
}
try {
    $expectedHead=Get-LocalFairviewHead
    $health=Invoke-RestMethod -Uri "$BaseUrl/api/v1/health" -Method Get -TimeoutSec 10
    if ($health.status -ne 'ok') { throw 'HIVE_NOT_HEALTHY' }
    # Windows PowerShell 5.1 converts an empty JSON array (`[]`) to $null.
    # Filter null pipeline output before reading ProjectResponse properties.
    # Windows PowerShell 5.1 can preserve the JSON array as one pipeline item when
    # the REST call is piped directly into Where-Object. Normalize the response first.
    $projectResponse=Invoke-RestMethod -Uri "$BaseUrl/api/v1/projects" -Method Get -TimeoutSec 10
    $projects=Convert-HiveProjectList -Response $projectResponse
    $found=@($projects | Where-Object { $_.relative_path -eq $ProjectRelativePath })
    if ($found.Count -eq 0) {
        # Automatic discovery may not have fired yet. Safe, idempotent bounded registration.
        try { $null=Post '/api/v1/projects' @{name='Fairview';relative_path=$ProjectRelativePath} }
        catch { if ($_.Exception.Response.StatusCode.value__ -ne 409) { throw } }
        $projectResponse=Invoke-RestMethod -Uri "$BaseUrl/api/v1/projects" -Method Get -TimeoutSec 10
        $projects=Convert-HiveProjectList -Response $projectResponse
        $found=@($projects | Where-Object { $_.relative_path -eq $ProjectRelativePath })
    }
    if ($found.Count -ne 1) { throw "FAIRVIEW_REGISTRY_IDENTITY_MISSING_OR_AMBIGUOUS" }
    $cachedProject=$found[0]
    # A cached READY row is not enough: inspect the actual mounted Git checkout.
    $project=Post "/api/v1/projects/$($cachedProject.project_id)/inspect"
    Assert-HiveProjectFresh -Project $project -ProjectId ([string]$cachedProject.project_id) -RelativePath $ProjectRelativePath -ExpectedHead $expectedHead
    $id=$project.project_id
    # Fail semantic configuration BEFORE any index/corpus mutation; FULL requires a real provider.
    $semantic=Invoke-RestMethod -Uri "$BaseUrl/api/v1/projects/$id/retrieval/semantic" -Method Get -TimeoutSec 10
    if ($RequireSemantic -and -not ($semantic.enabled -and $semantic.configured)) {
        throw 'SEMANTIC_PROVIDER_NOT_CONFIGURED'
    }
    # A real exact-HEAD index ALREADY EXISTS after the first R8 operator run.
    # A second POST /index is forbidden. A stale/absent run needs an explicit new authority.
    try { $index=Invoke-RestMethod -Uri "$BaseUrl/api/v1/projects/$id/index/status" -Method Get -TimeoutSec 10 }
    catch { throw 'INDEX_NOT_VERIFIED_NO_REINDEX_AUTHORIZED' }
    Assert-HiveIndexFresh -Index $index -ProjectId ([string]$id) -ExpectedHead $expectedHead
    Write-Host '[PASS] existing exact-HEAD HIVE repository index reused; no new index POST.'
    $status=Invoke-RestMethod -Uri "$BaseUrl/api/v1/projects/$id/retrieval/corpus" -Method Get -TimeoutSec 10
    $action=Get-HiveCorpusAction -Status $status -ProjectId ([string]$id) -IndexRunId ([string]$index.run_id)
    if($action -eq 'REUSE') {
        $corpus=$status.latest_run
        Write-Host '[PASS] existing CURRENT corpus reused; no corpus POST.'
    } else {
        # ONE conditional correction ONLY: prior BLOCKED repository_index_stale
        # from the mode-160000 GEF gitlink or an empty initial corpus.
        # The isolated doctor has already verified operator-backed exclusivity.
        $corpus=Post "/api/v1/projects/$id/retrieval/corpus/sync"
        if ($corpus.status -ne 'COMPLETED') { throw "CORPUS_SYNC_$($corpus.status):$($corpus.error)" }
        Write-Host '[PASS] one justified corpus correction completed; never retry automatically.'
    }
    Assert-HiveCorpusFresh -Corpus $corpus -ProjectId ([string]$id) -IndexRunId ([string]$index.run_id)
    if ([int]$corpus.chunk_count -lt 1 -or [int]$corpus.repository_reference_count -lt 1) { throw 'CORPUS_EMPTY_OR_NO_REPOSITORY_REFERENCES' }
    $query=@{query='Fairview';top_k=3}
    $lexical=Post "/api/v1/projects/$id/retrieval/lexical" $query
    Assert-HiveResultSet -Response $lexical -ProjectId ([string]$id) -Kind LEXICAL
    $hybrid=Post "/api/v1/projects/$id/retrieval/hybrid" $query
    Assert-HiveResultSet -Response $hybrid -ProjectId ([string]$id) -Kind HYBRID
    Write-Host "[PASS] HIVE health, registry READY, index, corpus, lexical and hybrid queries; project ID $id"
    $semantic=Invoke-RestMethod -Uri "$BaseUrl/api/v1/projects/$id/retrieval/semantic" -Method Get -TimeoutSec 10
    if ($RequireSemantic) {
        if (-not ($semantic.enabled -and $semantic.configured)) { throw 'SEMANTIC_PROVIDER_NOT_CONFIGURED' }
        if ($semantic.state -eq 'CURRENT' -and
            [string]$semantic.current_corpus_run_id -eq [string]$corpus.run_id -and
            [int]$semantic.embedded_chunk_count -gt 0 -and [int]$semantic.missing_chunk_count -eq 0) {
            Write-Host '[PASS] current semantic embeddings reused; no provider sync.'
        } else {
            if ($semantic.state -eq 'SYNCING' -or ($semantic.latest_run -and $semantic.latest_run.status -eq 'RUNNING')) {
                throw 'SEMANTIC_CONCURRENT_SYNC_FORBIDDEN'
            }
            # Exactly one provider-backed sync within the witnessed operator-exclusive window.
            $sync=Post "/api/v1/projects/$id/retrieval/semantic/sync"
            if ($sync.status -ne 'COMPLETED') { throw "SEMANTIC_SYNC_$($sync.status)" }
            Write-Host '[PASS] one authorized current-corpus semantic sync; no retry.'
        }
        $semantic=Invoke-RestMethod -Uri "$BaseUrl/api/v1/projects/$id/retrieval/semantic" -Method Get -TimeoutSec 10
        if ($semantic.state -ne 'CURRENT') { throw "SEMANTIC_STATE_$($semantic.state)" }
        if ([string]$semantic.current_corpus_run_id -ne [string]$corpus.run_id -or
            [int]$semantic.embedded_chunk_count -lt 1 -or [int]$semantic.missing_chunk_count -ne 0) {
            throw 'SEMANTIC_EMBEDDINGS_INCOMPLETE_OR_STALE'
        }
        $result=Post "/api/v1/projects/$id/retrieval/semantic" $query
        Assert-HiveResultSet -Response $result -ProjectId ([string]$id) -Kind SEMANTIC
        # Strict mode forbids silent fallback, while contribution fields prove real fusion.
        $strictQuery=@{query='Fairview';top_k=20;strict_semantic=$true}
        $hybrid=Post "/api/v1/projects/$id/retrieval/hybrid" $strictQuery
        Assert-HiveResultSet -Response $hybrid -ProjectId ([string]$id) -Kind HYBRID
        Assert-HiveSemanticContribution -Response $hybrid
        Write-Host '[PASS] semantic CURRENT plus hybrid semantic contribution'
    } else {
        Write-Host "[INFO] semantic state=$($semantic.state); not asserted without -RequireSemantic"
    }
    exit 0
} catch {
    Write-Error ("[BLOCKED] actual HIVE smoke failed: " + $_.Exception.Message)
    exit 1
}
