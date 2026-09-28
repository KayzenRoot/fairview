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
$before=[pscustomobject]@{datname='hive';wal_lsn='0/123';stats_reset='never';other_active='0';tup_inserted='12';tup_updated='35';tup_deleted='0'}
$after=[pscustomobject]@{datname='hive';wal_lsn='0/123';stats_reset='never';other_active='0';tup_inserted='12';tup_updated='35';tup_deleted='0'}
Assert-HiveDatabaseQuiet -Before $before -After $after
$writes=[pscustomobject]@{datname='hive';wal_lsn='0/123';stats_reset='never';other_active='0';tup_inserted='12';tup_updated='36';tup_deleted='0'}
ExpectBlocked { Assert-HiveDatabaseQuiet -Before $before -After $writes } 'WINDOW_DB_WRITES_OBSERVED'
$reset=[pscustomobject]@{datname='hive';wal_lsn='0/123';stats_reset='2026-09-28';other_active='0';tup_inserted='12';tup_updated='35';tup_deleted='0'}
ExpectBlocked { Assert-HiveDatabaseQuiet -Before $before -After $reset } 'WINDOW_DB_STATS_UNTRUSTWORTHY'
$active=[pscustomobject]@{datname='hive';wal_lsn='0/123';stats_reset='never';other_active='1';tup_inserted='12';tup_updated='35';tup_deleted='0'}
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

# StrictMode: genuine first corpus has no historical run field (absent, not just explicit null).
$firstCorpusPermit=[pscustomobject]@{operator_authorized_one_corpus_sync=$true;authorized_fairview_project_id=$api;target_fairview_head=$newHead}
$firstPrior=Assert-HiveCorpusCorrectionReceipt -Receipt $firstCorpusPermit -ProjectId $api -ExpectedHead $newHead -LatestRun $null
if(-not [string]::IsNullOrEmpty([string]$firstPrior)){throw 'EXPECTED_MISSING_PRIOR_ID_AS_INITIAL_CORPUS'}
$stableJournalRoot=Join-Path ([System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::CommonApplicationData)) 'Fairview\R8-Attempts'
$realProject='00000000-0000-0000-0000-000000000001'
$journalFromReceiptA=Get-HiveCorpusJournalPath -JournalRoot $stableJournalRoot -ProjectId $realProject -ExpectedHead $newHead
$journalFromReceiptB=Get-HiveCorpusJournalPath -JournalRoot $stableJournalRoot -ProjectId $realProject -ExpectedHead $newHead
if($journalFromReceiptA -cne $journalFromReceiptB){throw 'JOURNAL_ROOT_MUST_NOT_DEPEND_ON_RECEIPT_LOCATION'}
ExpectBlocked { Get-HiveCorpusJournalPath -JournalRoot $stableJournalRoot -ProjectId $realProject -ExpectedHead 'bad' } 'CORPUS_JOURNAL_IDENTITY_INVALID'
Write-Output '[PASS] PS51_INITIAL_CORPUS_OMITTED_PRIOR_AND_STABLE_PRIVATE_JOURNAL'


# Verify all three persistent namespaces and exercise the SAME CreateNew helper used by
# production, but ONLY against a disposable Windows TEMP folder, never host ProgramData.
$semanticRun='00000000-0000-0000-0000-000000000012'
$indexMarker=Get-HiveMutationJournalPath -JournalRoot $stableJournalRoot -ProjectId $realProject -Kind index -GenerationId $newHead
$corpusMarker=Get-HiveMutationJournalPath -JournalRoot $stableJournalRoot -ProjectId $realProject -Kind corpus -GenerationId $newHead
$semanticMarker=Get-HiveMutationJournalPath -JournalRoot $stableJournalRoot -ProjectId $realProject -Kind semantic -GenerationId $semanticRun
if(($indexMarker -ceq $corpusMarker) -or ($indexMarker -ceq $semanticMarker) -or
    ($corpusMarker -ceq $semanticMarker)) { throw 'MUTATION_MARKER_NAMESPACE_COLLISION' }
if((Get-HiveMutationJournalPath -JournalRoot $stableJournalRoot -ProjectId $realProject.ToUpperInvariant() -Kind index -GenerationId $newHead) -cne $indexMarker) {
    throw 'MUTATION_JOURNAL_MUST_BE_PROJECT_CASE_INDEPENDENT'
}
ExpectBlocked { Get-HiveMutationJournalPath -JournalRoot $stableJournalRoot -ProjectId $realProject -Kind semantic -GenerationId 'not-a-corpus-run' } 'MUTATION_JOURNAL_IDENTITY_INVALID'
$temporary=Join-Path ([System.IO.Path]::GetTempPath()) ('fairview-r8-journal-fixture-'+[guid]::NewGuid().ToString('N'))
try {
    $null=New-Item -Path $temporary -ItemType Directory -ErrorAction Stop
    $marker=Get-HiveMutationJournalPath -JournalRoot $temporary -ProjectId $realProject -Kind index -GenerationId $newHead
    New-HiveMutationAttemptMarker -JournalPath $marker -JsonBody '{"test":"first-write"}'
    if(-not (Test-Path -LiteralPath $marker -PathType Leaf)) { throw 'MUTATION_JOURNAL_FIRST_WRITE_NOT_DURABLE' }
    ExpectBlocked { New-HiveMutationAttemptMarker -JournalPath $marker -JsonBody '{"test":"second-write"}' } 'MUTATION_ATTEMPT_ALREADY_RESERVED_OR_JOURNAL_UNAVAILABLE'
    if((Get-Content -LiteralPath $marker -Raw) -cne '{"test":"first-write"}') { throw 'MUTATION_JOURNAL_DUPLICATE_OVERWROTE_FIRST' }
} finally {
    if(Test-Path -LiteralPath $temporary) { Remove-Item -LiteralPath $temporary -Recurse -Force }
}
Write-Output '[PASS] PS51_SHARED_MUTATION_JOURNAL_CREATE_NEW_REJECTS_DUPLICATE'


# Inherited guard regressions: offset-free timestamps, DDL/TRUNCATE WAL drift,
# and canonical absolute backup paths must all fail closed.
$offsetless=[pscustomobject]@{}
$receipt.psobject.Properties | ForEach-Object { $offsetless | Add-Member -NotePropertyName $_.Name -NotePropertyValue $_.Value }
$offsetless.created_at_utc=$now.AddMinutes(-1).ToString('yyyy-MM-ddTHH:mm:ss')
ExpectBlocked { Assert-HiveWindowReceipt -Receipt $offsetless -ApiContainerId $api -PostgresContainerId $pg -CanonicalDataRoot $root -Now $now } 'WINDOW_RECEIPT_TIMESTAMP_INVALID'
$walDrift=[pscustomobject]@{datname='hive';wal_lsn='0/124';stats_reset='never';other_active='0';tup_inserted='12';tup_updated='35';tup_deleted='0'}
ExpectBlocked { Assert-HiveDatabaseQuiet -Before $before -After $walDrift } 'WINDOW_DB_WAL_WRITES_OBSERVED'
$walMissing=[pscustomobject]@{datname='hive';stats_reset='never';other_active='0';tup_inserted='12';tup_updated='35';tup_deleted='0'}
ExpectBlocked { Assert-HiveDatabaseQuiet -Before $before -After $walMissing } 'WINDOW_DB_STATS_UNTRUSTWORTHY'

$fixtureRoot=Join-Path ([System.IO.Path]::GetTempPath()) ('fairview-r8-window-backup-'+[guid]::NewGuid().ToString('N'))
try {
    $testRepo=Join-Path $fixtureRoot 'repo'
    $testOutside=Join-Path $fixtureRoot 'outside'
    $null=New-Item -Path $testRepo -ItemType Directory -Force -ErrorAction Stop
    $null=New-Item -Path $testOutside -ItemType Directory -Force -ErrorAction Stop
    $goodBackup=Join-Path $testOutside 'restore.zip'
    $repoBackup=Join-Path $testRepo 'forbidden.zip'
    [System.IO.File]::WriteAllText($goodBackup,'synthetic-nonsecret-fixture')
    [System.IO.File]::WriteAllText($repoBackup,'synthetic-nonsecret-fixture')
    $trusted=Get-HiveTrustedBackupPath -BackupPath $goodBackup -RepoRoot $testRepo
    if($trusted -cne [System.IO.Path]::GetFullPath($goodBackup)) { throw 'EXPECTED_CANONICAL_GOOD_BACKUP' }
    ExpectBlocked { Get-HiveTrustedBackupPath -BackupPath '.\restore.zip' -RepoRoot $testRepo } 'WINDOW_BACKUP_MUST_STAY_OFF_GIT_AND_GLOBAL_HIVE'
    ExpectBlocked { Get-HiveTrustedBackupPath -BackupPath $repoBackup -RepoRoot $testRepo } 'WINDOW_BACKUP_MUST_STAY_OFF_GIT_AND_GLOBAL_HIVE'
    $traversal=Join-Path $testOutside '..\repo\forbidden.zip'
    ExpectBlocked { Get-HiveTrustedBackupPath -BackupPath $traversal -RepoRoot $testRepo } 'WINDOW_BACKUP_MUST_STAY_OFF_GIT_AND_GLOBAL_HIVE'
    # If the runner allows local junction creation, also exercise a linked ancestor.
    $junction=Join-Path $fixtureRoot 'linked-repo'
    $junctionMade=$false
    try {
        $null=New-Item -Path $junction -ItemType Junction -Target $testRepo -ErrorAction Stop
        $junctionMade=$true
    } catch { Write-Output '[INFO] PS51 local junction creation unavailable; static reparse guard still checked.' }
    if($junctionMade) {
        ExpectBlocked { Get-HiveTrustedBackupPath -BackupPath (Join-Path $junction 'forbidden.zip') -RepoRoot $testRepo } 'WINDOW_BACKUP_MUST_STAY_OFF_GIT_AND_GLOBAL_HIVE'
    }
} finally {
    if(Test-Path -LiteralPath $fixtureRoot) { Remove-Item -LiteralPath $fixtureRoot -Recurse -Force }
}
Write-Output '[PASS] PS51_R8_WAL_BACKUP_UTC_GATES'


# Physically trusted machine-wide root: check all EXISTING ancestors BEFORE mkdir.
$rootFixture=Join-Path ([System.IO.Path]::GetTempPath()) ('fairview-r8-root-fixture-'+[guid]::NewGuid().ToString('N'))
try {
    $machine=Join-Path $rootFixture 'machine'
    $repoFixture=Join-Path $rootFixture 'repo'
    $parent=Join-Path $machine 'Fairview'
    $journalRoot=Join-Path $parent 'R8-Attempts'
    $null=New-Item -Path $machine -ItemType Directory -Force -ErrorAction Stop
    $null=New-Item -Path $repoFixture -ItemType Directory -Force -ErrorAction Stop
    $null=New-Item -Path $parent -ItemType Directory -Force -ErrorAction Stop
    $candidate=Assert-HiveTrustedMutationJournalRoot -JournalRoot $journalRoot -MachineRoot $machine -RepoRoot $repoFixture
    if($candidate -cne [System.IO.Path]::GetFullPath($journalRoot)) { throw 'EXPECTED_TRUSTED_ROOT_BEFORE_CREATE' }
    $null=New-Item -Path $journalRoot -ItemType Directory -Force -ErrorAction Stop
    $again=Assert-HiveTrustedMutationJournalRoot -JournalRoot $journalRoot -MachineRoot $machine -RepoRoot $repoFixture
    if($again -cne $candidate) { throw 'EXPECTED_TRUSTED_ROOT_AFTER_CREATE' }
    ExpectBlocked { Assert-HiveTrustedMutationJournalRoot -JournalRoot $journalRoot -MachineRoot $machine -RepoRoot $machine } 'MUTATION_JOURNAL_PRIVATE_ROOT_UNAVAILABLE'
    $junctionMade=$false
    Remove-Item -LiteralPath $journalRoot -Recurse -Force
    try {
        $null=New-Item -Path $journalRoot -ItemType Junction -Target $repoFixture -ErrorAction Stop
        $junctionMade=$true
    } catch {
        Write-Output '[INFO] Windows junction not available on this runner; root ancestor and identity checks still tested.'
    }
    if($junctionMade) {
        ExpectBlocked { Assert-HiveTrustedMutationJournalRoot -JournalRoot $journalRoot -MachineRoot $machine -RepoRoot $repoFixture } 'MUTATION_JOURNAL_PRIVATE_ROOT_UNAVAILABLE'
    }
} finally {
    if(Test-Path -LiteralPath $rootFixture) { Remove-Item -LiteralPath $rootFixture -Recurse -Force }
}
Write-Output '[PASS] PS51_MACHINE_ROOT_LINK_REJECTION'
