# FV-BOOT-001 actual REST smoke; never substitutes fake IDs or synthetic success.
[CmdletBinding()]
param(
    [string]$BaseUrl = 'http://localhost:8000',
    [string]$ProjectRelativePath = 'Fairview',
    [switch]$RequireSemantic
)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
function Post([string]$suffix,[object]$data=$null) {
    $parameters=@{Uri="$BaseUrl$suffix";Method='Post';TimeoutSec=90}
    if ($null -ne $data) { $parameters.ContentType='application/json';$parameters.Body=($data | ConvertTo-Json -Depth 6 -Compress) }
    return Invoke-RestMethod @parameters
}
try {
    $health=Invoke-RestMethod -Uri "$BaseUrl/api/v1/health" -Method Get -TimeoutSec 10
    if ($health.status -ne 'ok') { throw 'HIVE_NOT_HEALTHY' }
    # Windows PowerShell 5.1 converts an empty JSON array (`[]`) to $null.
    # Filter null pipeline output before reading ProjectResponse properties.
    $projects=@(Invoke-RestMethod -Uri "$BaseUrl/api/v1/projects" -Method Get -TimeoutSec 10 | Where-Object { $null -ne $_ })
    $found=@($projects | Where-Object { $_.relative_path -eq $ProjectRelativePath })
    if ($found.Count -eq 0) {
        # Automatic discovery may not have fired yet. Safe, idempotent bounded registration.
        try { $null=Post '/api/v1/projects' @{name='Fairview';relative_path=$ProjectRelativePath} }
        catch { if ($_.Exception.Response.StatusCode.value__ -ne 409) { throw } }
        $projects=@(Invoke-RestMethod -Uri "$BaseUrl/api/v1/projects" -Method Get -TimeoutSec 10 | Where-Object { $null -ne $_ })
        $found=@($projects | Where-Object { $_.relative_path -eq $ProjectRelativePath })
    }
    if ($found.Count -ne 1) { throw "FAIRVIEW_REGISTRY_IDENTITY_MISSING_OR_AMBIGUOUS" }
    $project=$found[0]
    if ($project.state -ne 'READY') {
        $project=Post "/api/v1/projects/$($project.project_id)/inspect"
        if ($project.state -ne 'READY') { throw "FAIRVIEW_STATE_$($project.state)" }
    }
    $id=$project.project_id
    $index=Post "/api/v1/projects/$id/index"
    if ($index.status -ne 'COMPLETED') { throw "REPO_INDEX_$($index.status):$($index.error)" }
    $corpus=Post "/api/v1/projects/$id/retrieval/corpus/sync"
    if ($corpus.status -ne 'COMPLETED') { throw "CORPUS_SYNC_$($corpus.status):$($corpus.error)" }
    $query=@{query='Fairview';top_k=3}
    $lexical=Post "/api/v1/projects/$id/retrieval/lexical" $query
    if (@($lexical.results).Count -lt 1) { throw 'LEXICAL_SEARCH_EMPTY' }
    $hybrid=Post "/api/v1/projects/$id/retrieval/hybrid" $query
    if (@($hybrid.results).Count -lt 1) { throw 'HYBRID_SEARCH_EMPTY' }
    Write-Host "[PASS] HIVE health, registry READY, index, corpus, lexical and hybrid queries; project ID $id"
    $semantic=Invoke-RestMethod -Uri "$BaseUrl/api/v1/projects/$id/retrieval/semantic" -Method Get -TimeoutSec 10
    if ($RequireSemantic) {
        if (-not ($semantic.enabled -and $semantic.configured)) { throw 'SEMANTIC_PROVIDER_NOT_CONFIGURED: configure real local/approved embedding provider, then rerun' }
        $sync=Post "/api/v1/projects/$id/retrieval/semantic/sync"
        if ($sync.status -ne 'COMPLETED') { throw "SEMANTIC_SYNC_$($sync.status)" }
        $semantic=Invoke-RestMethod -Uri "$BaseUrl/api/v1/projects/$id/retrieval/semantic" -Method Get -TimeoutSec 10
        if ($semantic.state -ne 'CURRENT') { throw "SEMANTIC_STATE_$($semantic.state)" }
        $result=Post "/api/v1/projects/$id/retrieval/semantic" $query
        if (@($result.results).Count -lt 1) { throw 'SEMANTIC_SEARCH_EMPTY' }
        $hybrid=Post "/api/v1/projects/$id/retrieval/hybrid" $query
        if ($hybrid.semantic_state -ne 'CURRENT') { throw 'HYBRID_SEMANTIC_FALLBACK_ONLY' }
        Write-Host '[PASS] semantic CURRENT plus hybrid semantic contribution'
    } else {
        Write-Host "[INFO] semantic state=$($semantic.state); not asserted without -RequireSemantic"
    }
    exit 0
} catch {
    Write-Error ("[BLOCKED] actual HIVE smoke failed: " + $_.Exception.Message)
    exit 1
}
