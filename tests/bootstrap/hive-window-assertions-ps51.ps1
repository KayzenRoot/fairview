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


# Optional head-advance witness: absent field, false consent, wrong target and valid all verified.
$oldHead='b'*40
$newHead='c'*40
ExpectBlocked { Assert-HiveHeadAdvanceReceipt -Receipt $receipt -ExpectedHead $newHead } 'WINDOW_HEAD_ADVANCE_NOT_OPERATOR_AUTHORIZED'
$advanceReceipt=[pscustomobject]@{operator_authorized_one_head_advance_index=$true;prior_index_head=$oldHead;target_fairview_head=$newHead}
if((Assert-HiveHeadAdvanceReceipt -Receipt $advanceReceipt -ExpectedHead $newHead) -cne $oldHead) {
    throw 'EXPECTED_OPERATOR_AUTHORIZED_PRIOR_HEAD'
}
ExpectBlocked { Assert-HiveHeadAdvanceReceipt -Receipt $advanceReceipt -ExpectedHead $oldHead } 'WINDOW_HEAD_ADVANCE_NOT_OPERATOR_AUTHORIZED'
$rejected=[pscustomobject]@{operator_authorized_one_head_advance_index=$false;prior_index_head=$oldHead;target_fairview_head=$newHead}
ExpectBlocked { Assert-HiveHeadAdvanceReceipt -Receipt $rejected -ExpectedHead $newHead } 'WINDOW_HEAD_ADVANCE_NOT_OPERATOR_AUTHORIZED'
Write-Output '[PASS] PS51_HEAD_ADVANCE_RECEIPT_MISSING_FALSE_WRONG_VALID'


# JSON string values are not valid operator consent, even when text spells True.
$stringConsent=[pscustomobject]@{};$receipt.psobject.Properties | ForEach-Object { $stringConsent | Add-Member -NotePropertyName $_.Name -NotePropertyValue $_.Value }
$stringConsent.operator_confirmed_exclusive_window='True'
ExpectBlocked { Assert-HiveWindowReceipt -Receipt $stringConsent -ApiContainerId $api -PostgresContainerId $pg -CanonicalDataRoot $root -Now $now } 'WINDOW_OPERATOR_CONSENT_NOT_PROVEN'
$stringRestore=[pscustomobject]@{};$receipt.psobject.Properties | ForEach-Object { $stringRestore | Add-Member -NotePropertyName $_.Name -NotePropertyValue $_.Value }
$stringRestore.postgres_restore_verified='True'
ExpectBlocked { Assert-HiveWindowReceipt -Receipt $stringRestore -ApiContainerId $api -PostgresContainerId $pg -CanonicalDataRoot $root -Now $now } 'WINDOW_RESTORABLE_BACKUP_NOT_PROVEN'
$stringAdvance=[pscustomobject]@{operator_authorized_one_head_advance_index='True';prior_index_head=$oldHead;target_fairview_head=$newHead}
ExpectBlocked { Assert-HiveHeadAdvanceReceipt -Receipt $stringAdvance -ExpectedHead $newHead } 'WINDOW_HEAD_ADVANCE_NOT_OPERATOR_AUTHORIZED'
Write-Output '[PASS] PS51_TYPED_OPERATOR_CONSENT_ONLY'

$corpusPermit=[pscustomobject]@{operator_authorized_one_corpus_sync=$true;authorized_fairview_project_id=$api;target_fairview_head=$newHead;prior_corpus_run_id='00000000-0000-0000-0000-000000000001'}
$blockedCorpus=[pscustomobject]@{run_id='00000000-0000-0000-0000-000000000001'}
if((Assert-HiveCorpusCorrectionReceipt -Receipt $corpusPermit -ProjectId $api -ExpectedHead $newHead -LatestRun $blockedCorpus) -cne $blockedCorpus.run_id){throw 'EXPECTED_EXACT_PRIOR_CORPUS_ID'}
$wrongCorpus=[pscustomobject]@{run_id='00000000-0000-0000-0000-000000000002'}
ExpectBlocked { Assert-HiveCorpusCorrectionReceipt -Receipt $corpusPermit -ProjectId $api -ExpectedHead $newHead -LatestRun $wrongCorpus } 'CORPUS_PRIOR_RUN_ID_MISMATCH'
$untypedCorpus=[pscustomobject]@{operator_authorized_one_corpus_sync='True';authorized_fairview_project_id=$api;target_fairview_head=$newHead;prior_corpus_run_id=$blockedCorpus.run_id}
ExpectBlocked { Assert-HiveCorpusCorrectionReceipt -Receipt $untypedCorpus -ProjectId $api -ExpectedHead $newHead -LatestRun $blockedCorpus } 'CORPUS_CORRECTION_NOT_OPERATOR_AUTHORIZED'
Write-Output '[PASS] PS51_TYPED_CORPUS_CORRECTION_PRIOR_RUN_WITNESS'
