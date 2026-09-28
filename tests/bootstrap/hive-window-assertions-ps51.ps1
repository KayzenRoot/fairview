[CmdletBinding()]
param([Parameter(Mandatory=$true)][string]$HelperPath)
Set-StrictMode -Version Latest
$ErrorActionPreference='Stop'
. (Resolve-Path -LiteralPath $HelperPath).Path
function ExpectBlocked([scriptblock]$Block,[string]$Expected) {
    $saw=$false
    try { & $Block } catch {
        if($_.Exception.Message -ne $Expected) { throw ('UNEXPECTED_WINDOW_ERROR_'+$_.Exception.Message) }
        $saw=$true
    }
    if(-not $saw) { throw ('MISSING_WINDOW_ERROR_'+$Expected) }
}
$api='abc123';$pg='def456';$root='d:/tools/hive-fairview-data'
$now=[datetimeoffset]::UtcNow
$receipt=[pscustomobject]@{
    schema_version=1;compose_project='hive-fairview-dev';api_container_id=$api
    postgres_container_id=$pg;data_root=$root
    operator_confirmed_no_other_writers=$true
    operator_confirmed_exclusive_window=$true
    postgres_restore_verified=$true;postgres_restored_tables=17
    cas_manifest_verified=$true;backup_file='D:/private/backup.zip'
    backup_sha256=('a'*64);created_at_utc=$now.ToString('o')
}
Assert-HiveAutoDiscoveryDisabled -Environment @('HIVE_AUTO_DISCOVERY_ENABLED=false','POSTGRES_DSN=opaque-do-not-log')
ExpectBlocked { Assert-HiveAutoDiscoveryDisabled -Environment @('HIVE_AUTO_DISCOVERY_ENABLED=true') } 'WINDOW_DISCOVERY_STILL_ENABLED'
ExpectBlocked { Assert-HiveAutoDiscoveryDisabled -Environment @('POSTGRES_DSN=opaque') } 'WINDOW_DISCOVERY_FLAG_MISSING_OR_AMBIGUOUS'
ExpectBlocked { Assert-HiveAutoDiscoveryDisabled -Environment @('HIVE_AUTO_DISCOVERY_ENABLED=false','HIVE_AUTO_DISCOVERY_ENABLED=false') } 'WINDOW_DISCOVERY_FLAG_MISSING_OR_AMBIGUOUS'
Assert-HiveWindowReceipt -Receipt $receipt -ApiContainerId $api -PostgresContainerId $pg -CanonicalDataRoot $root -Now $now
ExpectBlocked { Assert-HiveWindowReceipt -Receipt $receipt -ApiContainerId 'other-api' -PostgresContainerId $pg -CanonicalDataRoot $root -Now $now } 'WINDOW_RECEIPT_ISOLATION_IDENTITY_MISMATCH'
$notConsented=[pscustomobject]@{};$receipt.psobject.Properties | ForEach-Object { $notConsented | Add-Member -NotePropertyName $_.Name -NotePropertyValue $_.Value }
$notConsented.operator_confirmed_exclusive_window=$false
ExpectBlocked { Assert-HiveWindowReceipt -Receipt $notConsented -ApiContainerId $api -PostgresContainerId $pg -CanonicalDataRoot $root -Now $now } 'WINDOW_OPERATOR_CONSENT_NOT_PROVEN'
$expired=[pscustomobject]@{};$receipt.psobject.Properties | ForEach-Object { $expired | Add-Member -NotePropertyName $_.Name -NotePropertyValue $_.Value }
$expired.created_at_utc=$now.AddMinutes(-60).ToString('o')
ExpectBlocked { Assert-HiveWindowReceipt -Receipt $expired -ApiContainerId $api -PostgresContainerId $pg -CanonicalDataRoot $root -Now $now } 'WINDOW_RECEIPT_EXPIRED'
$before=[pscustomobject]@{datname='hive';stats_reset='never';other_active='0';tup_inserted='12';tup_updated='35';tup_deleted='0'}
$after=[pscustomobject]@{datname='hive';stats_reset='never';other_active='0';tup_inserted='12';tup_updated='35';tup_deleted='0'}
Assert-HiveDatabaseQuiet -Before $before -After $after
$writes=[pscustomobject]@{datname='hive';stats_reset='never';other_active='0';tup_inserted='12';tup_updated='36';tup_deleted='0'}
ExpectBlocked { Assert-HiveDatabaseQuiet -Before $before -After $writes } 'WINDOW_DB_WRITES_OBSERVED'
$reset=[pscustomobject]@{datname='hive';stats_reset='2026-09-28';other_active='0';tup_inserted='12';tup_updated='35';tup_deleted='0'}
ExpectBlocked { Assert-HiveDatabaseQuiet -Before $before -After $reset } 'WINDOW_DB_STATS_UNTRUSTWORTHY'
$active=[pscustomobject]@{datname='hive';stats_reset='never';other_active='1';tup_inserted='12';tup_updated='35';tup_deleted='0'}
ExpectBlocked { Assert-HiveDatabaseQuiet -Before $before -After $active } 'WINDOW_DB_ACTIVE_SESSIONS'
Write-Output '[PASS] PS51_ISOLATED_WRITER_WINDOW_FAIL_CLOSED'
