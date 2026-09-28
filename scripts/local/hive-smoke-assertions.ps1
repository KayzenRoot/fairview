# FV-BOOT-001 R8. Fail-closed assertions for actual HIVE REST retrieval responses.
# Dot-source this file from check-hive.ps1; keep predicates separate for real PS 5.1 tests.
function Assert-HiveResultSet {
    [CmdletBinding()]
    param(
        [AllowNull()][object]$Response,
        [Parameter(Mandatory=$true)][string]$ProjectId,
        [Parameter(Mandatory=$true)][ValidateSet('LEXICAL','HYBRID','SEMANTIC')][string]$Kind
    )
    # @( $null ).Count is 1 in Windows PowerShell 5.1: never use it for REST proof.
    if($null -eq $Response -or $null -eq $Response.results) { throw ($Kind+'_SEARCH_EMPTY') }
    $count=0
    foreach($item in $Response.results) {
        if($null -eq $item) { continue }
        $count++
        if([string]$item.project_id -ne $ProjectId) { throw ($Kind+'_RESULT_PROJECT_MISMATCH') }
        if([string]::IsNullOrWhiteSpace([string]$item.reference_id) -or
            [string]::IsNullOrWhiteSpace([string]$item.corpus_run_id) -or
            [string]$item.source_content_sha256 -notmatch '^[0-9a-fA-F]{64}$' -or
            [string]$item.chunk_content_sha256 -notmatch '^[0-9a-fA-F]{64}$') {
            throw ($Kind+'_RESULT_PROVENANCE_MISSING')
        }
    }
    if($count -lt 1) { throw ($Kind+'_SEARCH_EMPTY') }
}

function Assert-HiveSemanticContribution {
    [CmdletBinding()]
    param([AllowNull()][object]$Response)
    if($null -eq $Response -or $Response.state -ne 'HYBRID' -or
        $Response.semantic_state -ne 'CURRENT' -or
        -not [string]::IsNullOrWhiteSpace([string]$Response.fallback_reason)) {
        throw 'HYBRID_SEMANTIC_FALLBACK_ONLY'
    }
    $contributing=$false
    foreach($item in $Response.results) {
        if($null -ne $item -and $null -ne $item.semantic_rank -and
            [int]$item.semantic_rank -gt 0 -and
            $null -ne $item.semantic_contribution -and
            [double]$item.semantic_contribution -gt 0) { $contributing=$true; break }
    }
    if(-not $contributing) { throw 'HYBRID_SEMANTIC_NO_CONTRIBUTION' }
}


# Published HIVE registry/index/corpus types expose exact Git generation and source-run lineage.
function Assert-HiveProjectFresh {
    [CmdletBinding()]
    param([AllowNull()][object]$Project,
        [Parameter(Mandatory=$true)][string]$ProjectId,
        [Parameter(Mandatory=$true)][string]$RelativePath,
        [Parameter(Mandatory=$true)][string]$ExpectedHead)
    if($ExpectedHead -cnotmatch '^[0-9a-f]{40}$') { throw 'LOCAL_GIT_HEAD_INVALID' }
    if($null -eq $Project -or [string]$Project.project_id -ne $ProjectId -or
        [string]$Project.relative_path -cne $RelativePath) { throw 'HIVE_PROJECT_IDENTITY_MISMATCH' }
    if($Project.state -ne 'READY' -or $Project.repository_accessible -ne $true -or
        $Project.working_tree_clean -ne $true) { throw 'HIVE_PROJECT_NOT_FRESH_READY' }
    if([string]$Project.git_head_sha -cne $ExpectedHead) { throw 'HIVE_PROJECT_HEAD_STALE' }
}
function Assert-HiveIndexFresh {
    [CmdletBinding()]
    param([AllowNull()][object]$Index,
        [Parameter(Mandatory=$true)][string]$ProjectId,
        [Parameter(Mandatory=$true)][string]$ExpectedHead)
    if($null -eq $Index -or [string]$Index.project_id -ne $ProjectId -or
        [string]::IsNullOrWhiteSpace([string]$Index.run_id)) { throw 'HIVE_INDEX_IDENTITY_MISMATCH' }
    if($Index.status -ne 'COMPLETED' -or
        [string]$Index.repository_head_sha -cne $ExpectedHead) { throw 'HIVE_INDEX_HEAD_STALE' }
}
function Assert-HiveCorpusFresh {
    [CmdletBinding()]
    param([AllowNull()][object]$Corpus,
        [Parameter(Mandatory=$true)][string]$ProjectId,
        [Parameter(Mandatory=$true)][string]$IndexRunId)
    if($null -eq $Corpus -or [string]$Corpus.project_id -ne $ProjectId) { throw 'CORPUS_PROJECT_MISMATCH' }
    if([string]::IsNullOrWhiteSpace($IndexRunId) -or
        $Corpus.status -ne 'COMPLETED' -or
        [string]$Corpus.repository_index_run_id -cne $IndexRunId) { throw 'CORPUS_INDEX_GENERATION_STALE' }
}


# R8 follow-up: choose a pure, fail-closed read-only corpus action. No hidden index retries.
function Get-HiveCorpusAction {
    [CmdletBinding()]
    param([AllowNull()][object]$Status,
        [Parameter(Mandatory=$true)][string]$ProjectId,
        [Parameter(Mandatory=$true)][string]$IndexRunId)
    if($null -eq $Status -or [string]$Status.project_id -ne $ProjectId -or
        [string]::IsNullOrWhiteSpace($IndexRunId)) {
        throw 'CORPUS_STATUS_PROJECT_OR_INDEX_MISMATCH'
    }
    $latest=$Status.latest_run
    if($Status.state -eq 'CURRENT' -and $null -ne $latest -and
        $latest.status -eq 'COMPLETED' -and
        [string]$latest.project_id -eq $ProjectId -and
        [string]$latest.repository_index_run_id -eq $IndexRunId -and
        [int]$Status.chunk_count -gt 0 -and
        [int]$Status.repository_reference_count -gt 0 -and
        [int]$latest.chunk_count -gt 0 -and
        [int]$latest.repository_reference_count -gt 0) {
        return 'REUSE'
    }
    if($Status.state -eq 'BLOCKED' -and
        $null -eq $Status.last_successful_sync -and
        [int]$Status.chunk_count -eq 0 -and [int]$Status.repository_reference_count -eq 0) {
        if($null -eq $latest) { return 'SYNC_ONCE' }
        if($latest.status -eq 'BLOCKED' -and
            [string]$latest.project_id -eq $ProjectId -and
            [string]$latest.repository_index_run_id -eq $IndexRunId -and
            $latest.error -eq 'repository_index_stale' -and
            [int]$latest.chunk_count -eq 0 -and
            [int]$latest.repository_reference_count -eq 0) { return 'SYNC_ONCE' }
    }
    throw 'CORPUS_UNSAFE_TO_RETRY_OR_REUSE'
}
