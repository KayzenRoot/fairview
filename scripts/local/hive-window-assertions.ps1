# FV-BOOT-001 R8: pure fail-closed predicates for an isolated HIVE exclusive-writer window.
# No Docker/API/SQL side effects. Real host observation belongs to check-hive-isolated.ps1.
function Assert-HiveAutoDiscoveryDisabled {
    [CmdletBinding()]
    param([AllowNull()][object]$Environment)
    $found=@()
    foreach($entry in $Environment) {
        $line=[string]$entry
        if($line -cmatch '^HIVE_AUTO_DISCOVERY_ENABLED=') { $found+= $line }
    }
    if($found.Count -ne 1) { throw 'WINDOW_DISCOVERY_FLAG_MISSING_OR_AMBIGUOUS' }
    if($found[0] -cne 'HIVE_AUTO_DISCOVERY_ENABLED=false') { throw 'WINDOW_DISCOVERY_STILL_ENABLED' }
}
function Assert-HiveWindowReceipt {
    [CmdletBinding()]
    param([AllowNull()][object]$Receipt,
        [Parameter(Mandatory=$true)][string]$ApiContainerId,
        [Parameter(Mandatory=$true)][string]$PostgresContainerId,
        [Parameter(Mandatory=$true)][string]$CanonicalDataRoot,
        [Parameter(Mandatory=$true)][datetimeoffset]$Now)
    if($null -eq $Receipt -or [int]$Receipt.schema_version -ne 1 -or
        $Receipt.compose_project -cne 'hive-fairview-dev' -or
        [string]$Receipt.api_container_id -cne $ApiContainerId -or
        [string]$Receipt.postgres_container_id -cne $PostgresContainerId -or
        [string]$Receipt.data_root -cne $CanonicalDataRoot) {
        throw 'WINDOW_RECEIPT_ISOLATION_IDENTITY_MISMATCH'
    }
    if(-not ($Receipt.operator_confirmed_no_other_writers -is [bool]) -or
        -not ($Receipt.operator_confirmed_exclusive_window -is [bool]) -or
        $Receipt.operator_confirmed_no_other_writers -ne $true -or
        $Receipt.operator_confirmed_exclusive_window -ne $true) {
        throw 'WINDOW_OPERATOR_CONSENT_NOT_PROVEN'
    }
    if(-not ($Receipt.postgres_restore_verified -is [bool]) -or
        -not ($Receipt.cas_manifest_verified -is [bool]) -or
        $Receipt.postgres_restore_verified -ne $true -or
        [int]$Receipt.postgres_restored_tables -lt 1 -or
        $Receipt.cas_manifest_verified -ne $true) {
        throw 'WINDOW_RESTORABLE_BACKUP_NOT_PROVEN'
    }
    if([string]$Receipt.backup_file -eq '' -or
        [string]$Receipt.backup_sha256 -cnotmatch '^[0-9a-fA-F]{64}$') {
        throw 'WINDOW_BACKUP_DIGEST_INVALID'
    }
    $date=[datetimeoffset]::MinValue
    if(-not [datetimeoffset]::TryParse([string]$Receipt.created_at_utc,[ref]$date)) {
        throw 'WINDOW_RECEIPT_TIMESTAMP_INVALID'
    }
    $minutes=($Now.ToUniversalTime()-$date.ToUniversalTime()).TotalMinutes
    if($minutes -lt -2 -or $minutes -gt 45) { throw 'WINDOW_RECEIPT_EXPIRED' }
}
function Assert-HiveDatabaseQuiet {
    [CmdletBinding()]
    param([AllowNull()][object]$Before,[AllowNull()][object]$After)
    if($null -eq $Before -or $null -eq $After -or
        [string]::IsNullOrWhiteSpace([string]$Before.datname) -or
        [string]$Before.datname -cne [string]$After.datname -or
        [string]::IsNullOrWhiteSpace([string]$Before.stats_reset) -or
        [string]$Before.stats_reset -cne [string]$After.stats_reset) {
        throw 'WINDOW_DB_STATS_UNTRUSTWORTHY'
    }
    if([string]$Before.other_active -cnotmatch '^[0-9]+$' -or
        [string]$After.other_active -cnotmatch '^[0-9]+$') { throw 'WINDOW_DB_STATS_UNTRUSTWORTHY' }
    if([long]$Before.other_active -ne 0 -or [long]$After.other_active -ne 0) {
        throw 'WINDOW_DB_ACTIVE_SESSIONS'
    }
    foreach($name in @('tup_inserted','tup_updated','tup_deleted')) {
        if([string]$Before.$name -cnotmatch '^[0-9]+$' -or
            [string]$After.$name -cnotmatch '^[0-9]+$') {
            throw 'WINDOW_DB_STATS_UNTRUSTWORTHY'
        }
        if([long]$Before.$name -ne [long]$After.$name) {
            throw 'WINDOW_DB_WRITES_OBSERVED'
        }
    }
}


# Explicit maintenance permission is an exact typed off-Git witness, not inferred from existence.
function Assert-HiveHeadAdvanceReceipt {
    [CmdletBinding()]
    param([AllowNull()][object]$Receipt,
        [Parameter(Mandatory=$true)][string]$ExpectedHead)
    if($null -eq $Receipt -or $ExpectedHead -cnotmatch '^[0-9a-f]{40}$') {
        throw 'WINDOW_HEAD_ADVANCE_NOT_OPERATOR_AUTHORIZED'
    }
    foreach($key in @('operator_authorized_one_head_advance_index','prior_index_head','target_fairview_head')) {
        if($null -eq $Receipt.PSObject.Properties[$key]) {
            throw 'WINDOW_HEAD_ADVANCE_NOT_OPERATOR_AUTHORIZED'
        }
    }
    if(-not ($Receipt.operator_authorized_one_head_advance_index -is [bool]) -or
        $Receipt.operator_authorized_one_head_advance_index -ne $true -or
        [string]$Receipt.prior_index_head -cnotmatch '^[0-9a-f]{40}$' -or
        [string]$Receipt.target_fairview_head -cne $ExpectedHead -or
        [string]$Receipt.prior_index_head -ceq $ExpectedHead) {
        throw 'WINDOW_HEAD_ADVANCE_NOT_OPERATOR_AUTHORIZED'
    }
    return [string]$Receipt.prior_index_head
}

# Private one-shot authorization is tied to the original failed run; not to an error label alone.
function Assert-HiveCorpusCorrectionReceipt {
    [CmdletBinding()]
    param([AllowNull()][object]$Receipt,
        [Parameter(Mandatory=$true)][string]$ProjectId,
        [Parameter(Mandatory=$true)][string]$ExpectedHead,
        [AllowNull()][object]$LatestRun)
    if($null -eq $Receipt -or
        -not ($Receipt.operator_authorized_one_corpus_sync -is [bool]) -or
        $Receipt.operator_authorized_one_corpus_sync -ne $true -or
        [string]$Receipt.authorized_fairview_project_id -cne $ProjectId -or
        $ExpectedHead -cnotmatch '^[0-9a-f]{40}$' -or
        [string]$Receipt.target_fairview_head -cne $ExpectedHead) {
        throw 'CORPUS_CORRECTION_NOT_OPERATOR_AUTHORIZED'
    }
    $prior=''
    if($null -ne $Receipt.PSObject.Properties['prior_corpus_run_id']) {
        $prior=[string]$Receipt.prior_corpus_run_id
    }
    if($null -eq $LatestRun) {
        if(-not [string]::IsNullOrWhiteSpace($prior)) { throw 'CORPUS_PRIOR_RUN_ID_MISMATCH' }
    } elseif($prior -cnotmatch '^[0-9a-fA-F-]{36}$' -or
        [string]$LatestRun.run_id -cne $prior) {
        throw 'CORPUS_PRIOR_RUN_ID_MISMATCH'
    }
    return $prior
}

# One common machine-wide reservation namespace selector; never use receipt folders,
# local profiles, database snapshots, or checkout-relative locations.
function Get-HiveMutationJournalPath {
    [CmdletBinding()]
    param([Parameter(Mandatory=$true)][string]$JournalRoot,
        [Parameter(Mandatory=$true)][string]$ProjectId,
        [Parameter(Mandatory=$true)][ValidateSet('index','corpus','semantic')][string]$Kind,
        [Parameter(Mandatory=$true)][string]$GenerationId)
    if([string]::IsNullOrWhiteSpace($JournalRoot) -or
        $ProjectId -cnotmatch '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$') {
        throw 'MUTATION_JOURNAL_IDENTITY_INVALID'
    }
    if($Kind -eq 'semantic') {
        if($GenerationId -cnotmatch '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$') {
            throw 'MUTATION_JOURNAL_IDENTITY_INVALID'
        }
    } elseif($GenerationId -cnotmatch '^[0-9a-f]{40}$') {
        throw 'MUTATION_JOURNAL_IDENTITY_INVALID'
    }
    return (Join-Path $JournalRoot ("fv-r8-"+$Kind+"-"+$ProjectId.ToLowerInvariant()+"-"+$GenerationId.ToLowerInvariant()+".once.json"))
}

# Actual atomic write, separately testable against Windows TEMP only.
# A failed/partial CreateNew marker is deliberately retained as an attempted write.
function New-HiveMutationAttemptMarker {
    [CmdletBinding()]
    param([Parameter(Mandatory=$true)][string]$JournalPath,
        [Parameter(Mandatory=$true)][string]$JsonBody)
    $bytes=[System.Text.Encoding]::UTF8.GetBytes($JsonBody)
    $stream=$null
    try {
        $stream=[System.IO.File]::Open($JournalPath,
            [System.IO.FileMode]::CreateNew,[System.IO.FileAccess]::Write,[System.IO.FileShare]::None)
        $stream.Write($bytes,0,$bytes.Length)
        $stream.Flush($true)
    } catch {
        throw 'MUTATION_ATTEMPT_ALREADY_RESERVED_OR_JOURNAL_UNAVAILABLE'
    } finally {
        if($null -ne $stream) { $stream.Dispose() }
    }
}

# Backwards-compatible pure selector for existing R8 corpus fixtures.
function Get-HiveCorpusJournalPath {
    [CmdletBinding()]
    param([Parameter(Mandatory=$true)][string]$JournalRoot,
        [Parameter(Mandatory=$true)][string]$ProjectId,
        [Parameter(Mandatory=$true)][string]$ExpectedHead)
    if($ExpectedHead -cnotmatch '^[0-9a-f]{40}$' -or
        $ProjectId -cnotmatch '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' -or
        [string]::IsNullOrWhiteSpace($JournalRoot)) {
        throw 'CORPUS_JOURNAL_IDENTITY_INVALID'
    }
    return (Get-HiveMutationJournalPath -JournalRoot $JournalRoot -ProjectId $ProjectId -Kind corpus -GenerationId $ExpectedHead)
}
