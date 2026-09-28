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
