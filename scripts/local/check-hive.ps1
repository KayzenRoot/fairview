# FV-BOOT-001 actual REST smoke; never substitutes fake IDs or synthetic success.
[CmdletBinding()]
param(
    [string]$BaseUrl = 'http://localhost:8000',
    [string]$ProjectRelativePath = 'Fairview',
    [switch]$RequireSemantic,
    [switch]$AllowHeadAdvanceIndex,
    [string]$AuthorizedPriorIndexHead,
    [string]$AuthorizedTargetHead,
    [string]$HiveCheckout,
    [string]$IsolatedDataRoot,
    [string]$ExclusiveWindowReceipt
)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'hive-project-list.ps1')
. (Join-Path $PSScriptRoot 'hive-smoke-assertions.ps1')
. (Join-Path $PSScriptRoot 'hive-window-assertions.ps1')
$script:WindowVerifiedForMutations=$false
$script:PrivateWindowReceipt=$null
if(-not [string]::IsNullOrWhiteSpace($ExclusiveWindowReceipt)) {
    try {
        $privatePath=(Resolve-Path -LiteralPath $ExclusiveWindowReceipt -ErrorAction Stop).Path
        $repo=(Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..\..')).Path
        $normalized=$privatePath.Replace('\','/').ToLowerInvariant()
        $repoNormalized=$repo.Replace('\','/').TrimEnd('/').ToLowerInvariant()
        if($normalized.StartsWith($repoNormalized+'/') -or
            $normalized -eq 'd:/hive' -or $normalized.StartsWith('d:/hive/')) {
            throw 'WINDOW_RECEIPT_MUST_STAY_PRIVATE'
        }
        $script:PrivateWindowReceipt=Get-Content -LiteralPath $privatePath -Raw | ConvertFrom-Json -ErrorAction Stop
    } catch { throw 'WINDOW_PRIVATE_RECEIPT_INVALID' }
}
function Assert-MutationWindow([bool]$ForIndexAdvance) {
    if($script:WindowVerifiedForMutations) { return }
    if([string]::IsNullOrWhiteSpace($ExclusiveWindowReceipt) -or
        [string]::IsNullOrWhiteSpace($HiveCheckout) -or
        [string]::IsNullOrWhiteSpace($IsolatedDataRoot) -or
        $null -eq $script:PrivateWindowReceipt) {
        throw 'MUTATION_EXCLUSIVE_WINDOW_PROOF_REQUIRED'
    }
    $argsDoctor=@('-NoProfile','-NonInteractive','-ExecutionPolicy','Bypass',
        '-File',(Join-Path $PSScriptRoot 'check-hive-isolated.ps1'),
        '-HiveCheckout',$HiveCheckout,'-IsolatedDataRoot',$IsolatedDataRoot,
        '-ApiBaseUrl',$BaseUrl,'-Mode','Verify',
        '-ExclusiveWindowReceipt',$ExclusiveWindowReceipt,'-WindowOnly')
    if($ForIndexAdvance) { $argsDoctor+= '-AllowHeadAdvanceIndex' }
    $old=$ErrorActionPreference
    try {
        $ErrorActionPreference='Continue'
        & powershell.exe @argsDoctor
        $code=$LASTEXITCODE
    } finally { $ErrorActionPreference=$old }
    if($code -ne 0) { throw 'MUTATION_EXCLUSIVE_WINDOW_PROOF_FAILED' }
    $script:WindowVerifiedForMutations=$true
}
function Write-CorpusAttemptJournal([string]$ProjectId,[string]$Head,[string]$IndexRunId,[string]$PriorCorpusRunId) {
    $dir=Split-Path -Path $ExclusiveWindowReceipt -Parent
    $journal=Join-Path $dir ("fv-r8-corpus-"+$ProjectId+"-"+$Head+".once.json")
    $body=@{schema_version=1;project_id=$ProjectId;head=$Head;
        index_run_id=$IndexRunId;prior_corpus_run_id=$PriorCorpusRunId;
        attempted_at_utc=[datetime]::UtcNow.ToString('o')} | ConvertTo-Json -Compress
    $bytes=[System.Text.Encoding]::UTF8.GetBytes($body)
    $stream=$null
    try {
        $stream=[System.IO.File]::Open($journal,
            [System.IO.FileMode]::CreateNew,[System.IO.FileAccess]::Write,[System.IO.FileShare]::None)
        $stream.Write($bytes,0,$bytes.Length)
        $stream.Flush($true)
    } catch [System.IO.IOException] {
        throw 'CORPUS_CORRECTION_ALREADY_ATTEMPTED_OR_JOURNAL_UNAVAILABLE'
    } finally {
        if($null -ne $stream) { $stream.Dispose() }
    }
}
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
    if($AllowHeadAdvanceIndex.IsPresent -and
        ($AuthorizedTargetHead -cnotmatch '^[0-9a-f]{40}$' -or $expectedHead -cne $AuthorizedTargetHead)) {
        throw 'INDEX_TARGET_HEAD_CHANGED'
    }
    $health=Invoke-RestMethod -Uri "$BaseUrl/api/v1/health" -Method Get -TimeoutSec 10
    if ($health.status -ne 'ok') { throw 'HIVE_NOT_HEALTHY' }
    # Windows PowerShell 5.1 converts an empty JSON array (`[]`) to $null.
    # Filter null pipeline output before reading ProjectResponse properties.
    # Windows PowerShell 5.1 can preserve the JSON array as one pipeline item when
    # the REST call is piped directly into Where-Object. Normalize the response first.
    $projectResponse=Invoke-RestMethod -Uri "$BaseUrl/api/v1/projects" -Method Get -TimeoutSec 10
    $projects=Convert-HiveProjectList -Response $projectResponse
    $found=@($projects | Where-Object { $_.relative_path -eq $ProjectRelativePath })
    # FULL provider preflight is READ-ONLY and occurs before ANY registration or inspect POST.
    if ($RequireSemantic) {
        if ($found.Count -ne 1) { throw 'SEMANTIC_PROJECT_NOT_REGISTERED' }
        $preflightId=[string]$found[0].project_id
        $preflightSemantic=Invoke-RestMethod -Uri "$BaseUrl/api/v1/projects/$preflightId/retrieval/semantic" -Method Get -TimeoutSec 10
        if ([string]$preflightSemantic.project_id -ne $preflightId -or
            $preflightSemantic.enabled -ne $true -or $preflightSemantic.configured -ne $true) {
            throw 'SEMANTIC_PROVIDER_NOT_CONFIGURED'
        }
    }
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
    $priorIndexRunId=[string]$index.run_id
    $indexAction=Get-HiveIndexAction -Index $index -ProjectId ([string]$id) -ExpectedHead $expectedHead -AllowAdvance $AllowHeadAdvanceIndex.IsPresent -AuthorizedPriorHead $AuthorizedPriorIndexHead
    if($indexAction -eq 'ADVANCE_ONCE') {
        if($null -eq $script:PrivateWindowReceipt -or
            (Assert-HiveHeadAdvanceReceipt -Receipt $script:PrivateWindowReceipt -ExpectedHead $expectedHead) -cne $AuthorizedPriorIndexHead) {
            throw 'INDEX_HEAD_ADVANCE_NOT_WITNESSED'
        }
        Assert-MutationWindow -ForIndexAdvance $true
        if((Get-LocalFairviewHead) -cne $expectedHead) { throw 'INDEX_TARGET_HEAD_CHANGED' }
        $repo=(Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..\..')).Path
        $previous=$ErrorActionPreference
        try {
            $ErrorActionPreference='Continue'
            & git -C $repo merge-base --is-ancestor ([string]$index.repository_head_sha) $expectedHead 2>$null | Out-Null
            $ancestry=$LASTEXITCODE
        } finally { $ErrorActionPreference=$previous }
        if($ancestry -ne 0) { throw 'INDEX_HEAD_ADVANCE_NOT_PROVEN_ANCESTOR' }
        $index=Post "/api/v1/projects/$id/index"
        if($index.status -ne 'COMPLETED') { throw "REPO_INDEX_$($index.status):$($index.error)" }
        Write-Host '[PASS] one approved descendant incremental index; never automatically retry.'
    } else {
        Write-Host '[PASS] existing exact-HEAD HIVE index reused; no new index POST.'
    }
    Assert-HiveIndexFresh -Index $index -ProjectId ([string]$id) -ExpectedHead $expectedHead
    $status=Invoke-RestMethod -Uri "$BaseUrl/api/v1/projects/$id/retrieval/corpus" -Method Get -TimeoutSec 10
    $authorizedPriorCorpus=if($null -ne $script:PrivateWindowReceipt){[string]$script:PrivateWindowReceipt.prior_corpus_run_id}else{''}
    $action=Get-HiveCorpusAction -Status $status -ProjectId ([string]$id) -IndexRunId ([string]$index.run_id) -PriorIndexRunId $priorIndexRunId -AuthorizedPriorRunId $authorizedPriorCorpus
    if($action -eq 'REUSE') {
        $corpus=$status.latest_run
        Write-Host '[PASS] existing CURRENT corpus reused; no corpus POST.'
    } else {
        # ONE conditional correction ONLY: prior BLOCKED repository_index_stale
        # from the mode-160000 GEF gitlink or an empty initial corpus.
        # Persistent private attempt marker BEFORE the one permitted corpus POST.
        $priorCorpus=Assert-HiveCorpusCorrectionReceipt -Receipt $script:PrivateWindowReceipt -ProjectId ([string]$id) -ExpectedHead $expectedHead -LatestRun $status.latest_run
        Assert-MutationWindow -ForIndexAdvance $false
        if((Get-LocalFairviewHead) -cne $expectedHead) { throw 'CORPUS_TARGET_HEAD_CHANGED' }
        Write-CorpusAttemptJournal -ProjectId ([string]$id) -Head $expectedHead -IndexRunId ([string]$index.run_id) -PriorCorpusRunId $priorCorpus
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
        $semanticAction=Get-HiveSemanticAction -Status $semantic -ProjectId ([string]$id) -CorpusRunId ([string]$corpus.run_id)
        if ($semanticAction -eq 'REUSE') {
            Write-Host '[PASS] current semantic embeddings reused; no provider sync.'
        } else {
            # The helper rejects previous FAILED/BLOCKED attempts and concurrent sync.
            # SEMANTIC_CONCURRENT_SYNC_FORBIDDEN is enforced BEFORE the single POST.
            Assert-MutationWindow -ForIndexAdvance $false
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
