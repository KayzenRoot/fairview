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
