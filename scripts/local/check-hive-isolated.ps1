# FV-BOOT-001 R6. Read-only Docker/source inspection; Verify calls only Fairview HIVE smoke.
[CmdletBinding()]
param(
    [Parameter(Mandatory=$true)][string]$HiveCheckout,
    [Parameter(Mandatory=$true)][string]$IsolatedDataRoot,
    [Parameter(Mandatory=$true)][uri]$ApiBaseUrl,
    [ValidateSet('Inspect','Verify')][string]$Mode='Inspect',
    [string]$ComposeProject='hive-fairview-dev',
    [switch]$RequireSemantic,
    [switch]$AllowHeadAdvanceIndex,
    [switch]$WindowOnly,
    [string]$ExclusiveWindowReceipt,
    [ValidateRange(120,360)][int]$ObserveSeconds=120
)
Set-StrictMode -Version Latest
$ErrorActionPreference='Stop'
$RepoRoot=(Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..\..')).Path
. (Join-Path $PSScriptRoot 'hive-window-assertions.ps1')
function Native([string]$Exe,[string[]]$NativeArgs) {
    $old=$ErrorActionPreference
    try {
        $ErrorActionPreference='Continue'
        $result=(& $Exe @NativeArgs 2>$null | Out-String).Trim()
        $exit=$LASTEXITCODE
    } finally {
        $ErrorActionPreference=$old
    }
    if($exit -ne 0) {throw 'NATIVE_COMMAND_FAILED'}
    return $result
}
function HostPath([string]$Value) {
    $s=($Value -replace '\\','/').TrimEnd('/').ToLowerInvariant()
    if($s -match '^/(?:run/desktop/mnt/host|host_mnt)/([a-z])/(.+)$') {
        return ($Matches[1]+':/'+$Matches[2])
    }
    return $s
}
function MountCheck([object[]]$Mounts,[string]$Target,[string]$Source,[bool]$ReadOnly) {
    $matching=@($Mounts | Where-Object { $_.Destination -eq $Target })
    if($matching.Count -ne 1) {throw 'MOUNT_MISSING_OR_AMBIGUOUS'}
    $item=$matching[0]
    if($item.Type -ne 'bind') {throw 'EXPECTED_BIND_MOUNT'}
    if((HostPath ([string]$item.Source)) -ne (HostPath $Source)) {throw 'MOUNT_SOURCE_NOT_AUTHORIZED'}
    if($ReadOnly -and $item.RW) {throw 'PROJECT_MOUNT_NOT_READONLY'}
}
function Container([string]$Service) {
    $output=Native 'docker' @('ps','--filter',"label=com.docker.compose.project=$ComposeProject",'--filter',"label=com.docker.compose.service=$Service",'--format','{{.ID}}')
    $ids=@($output -split '[\r\n]+' | Where-Object { $_ })
    if($ids.Count -ne 1) {throw 'ISOLATED_SERVICE_MISSING_OR_AMBIGUOUS'}
    return $ids[0]
}
function Get-HiveDatabaseWriteStats([string]$PostgresContainerId) {
    # Read-only SQL via container-local Unix socket. No credentials or env values printed.
    $sql="SELECT row_to_json(s) FROM (SELECT d.datname, pg_current_wal_lsn()::text AS wal_lsn, d.tup_inserted::text AS tup_inserted, d.tup_updated::text AS tup_updated, d.tup_deleted::text AS tup_deleted, COALESCE(d.stats_reset::text,'never') AS stats_reset, (SELECT count(*) FROM pg_stat_activity a WHERE a.datname=current_database() AND a.pid<>pg_backend_pid() AND a.state='active') AS other_active FROM pg_stat_database d WHERE d.datname=current_database()) s;"
    $command='exec psql -X -qAt -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "'+$sql+'"'
    $raw=Native 'docker' @('exec',$PostgresContainerId,'sh','-c',$command)
    if([string]::IsNullOrWhiteSpace($raw)) { throw 'WINDOW_DB_STATS_UNAVAILABLE' }
    try { $stats=$raw | ConvertFrom-Json -ErrorAction Stop }
    catch { throw 'WINDOW_DB_STATS_UNAVAILABLE' }
    if($null -eq $stats -or [string]::IsNullOrWhiteSpace([string]$stats.datname)) {
        throw 'WINDOW_DB_STATS_UNAVAILABLE'
    }
    return $stats
}
function ContainerMounts([string]$Id) {
    return @((Native 'docker' @('inspect','--format','{{json .Mounts}}',$Id) | ConvertFrom-Json))
}
try {
    if($ComposeProject -ne 'hive-fairview-dev') {throw 'UNAUTHORIZED_COMPOSE_PROJECT'}
    if($WindowOnly.IsPresent -and $Mode -ne 'Verify') {throw 'WINDOW_ONLY_REQUIRES_VERIFY'}
    if($ApiBaseUrl.Scheme -ne 'http' -or $ApiBaseUrl.Host -notin @('localhost','127.0.0.1','::1')) {throw 'API_MUST_BE_LOOPBACK'}
    $source=(Resolve-Path -LiteralPath $HiveCheckout -ErrorAction Stop).Path
    $data=(Resolve-Path -LiteralPath $IsolatedDataRoot -ErrorAction Stop).Path
    $canonicalData=HostPath $data
    if($canonicalData -eq 'd:/hive' -or $canonicalData.StartsWith('d:/hive/')) {throw 'GLOBAL_HIVE_DATA_ROOT_FORBIDDEN'}
    $lock=Get-Content -LiteralPath (Join-Path $RepoRoot '.integrations\hive-fv-maintenance.lock.json') -Raw | ConvertFrom-Json
    if($lock.scope -ne 'ISOLATED_LOCAL_DEV_ONLY') {throw 'UNAUTHORIZED_CANDIDATE_SCOPE'}
    if($Mode -eq 'Verify' -and ($lock.status -ne 'DEV_CANDIDATE_VERIFIED' -or $lock.validation.validate_conclusion -ne 'success' -or $lock.validation.integration_conclusion -ne 'success')) {throw 'CANDIDATE_HOSTED_PROOFS_INCOMPLETE'}
    $origin=Native 'git' @('-C',$source,'remote','get-url','origin')
    if($origin -notmatch '(?:^https://github\.com/|^git@github\.com:|^ssh://git@github\.com/)KayzenRoot/hive(?:\.git)?$') {throw 'UNEXPECTED_HIVE_ORIGIN'}
    $actualSha=Native 'git' @('-C',$source,'rev-parse','HEAD')
    $allowedShas=if($Mode -eq 'Inspect'){@([string]$lock.base_release_commit,[string]$lock.candidate_sha)}else{@([string]$lock.candidate_sha)}
    if($actualSha -notin $allowedShas) {throw 'HIVE_SOURCE_SHA_MISMATCH'}
    if(Native 'git' @('-C',$source,'status','--porcelain=v1','--untracked-files=no')) {throw 'HIVE_SOURCE_DIRTY'}
    if((Native 'docker' @('info','--format','{{.OSType}}')) -ne 'linux') {throw 'DOCKER_LINUX_ENGINE_REQUIRED'}
    $api=Container 'api'
    $apiMounts=ContainerMounts $api
    MountCheck $apiMounts '/workspace/projects' 'D:/Projects' $true
    MountCheck $apiMounts '/var/lib/hive' $data $false
    $labels=Native 'docker' @('inspect','--format','{{json .Config.Labels}}',$api) | ConvertFrom-Json
    $workingDir=[string]$labels.'com.docker.compose.project.working_dir'
    if(-not $workingDir -or (HostPath $workingDir) -ne (HostPath $source)) {throw 'COMPOSE_WORKDIR_SOURCE_MISMATCH'}
    $ports=Native 'docker' @('inspect','--format','{{json .NetworkSettings.Ports}}',$api) | ConvertFrom-Json
    $binding=@($ports.'8000/tcp')
    $matches=@($binding | Where-Object { $_.HostPort -eq [string]$ApiBaseUrl.Port -and $_.HostIp -in @('127.0.0.1','::1') })
    if($matches.Count -ne 1) {throw 'API_PORT_NOT_ISOLATED_LOOPBACK'}
    $pg=Container 'postgres'
    MountCheck (ContainerMounts $pg) '/var/lib/postgresql/data' (Join-Path $data 'postgres') $false
    $redis=Container 'redis'
    MountCheck (ContainerMounts $redis) '/data' (Join-Path $data 'redis') $false
    $health=Invoke-RestMethod -Uri ($ApiBaseUrl.AbsoluteUri.TrimEnd('/')+'/api/v1/health') -Method Get -TimeoutSec 12
    if($health.status -ne 'ok') {throw 'ISOLATED_API_HEALTH_NOT_OK'}
    $image=Native 'docker' @('inspect','--format','{{.Image}}',$api)
    Write-Host ('[PASS] isolated source/mount/API checks image '+$image.Substring(0,16))
    Write-Host '[INFO] Docker build receipt and backup must be independently verified before trusting image provenance.'
    if($Mode -eq 'Verify') {
        # Fail closed before any mutating REST call if the operator-exclusive window is absent.
        if([string]::IsNullOrWhiteSpace($ExclusiveWindowReceipt)) { throw 'WINDOW_RECEIPT_REQUIRED' }
        $receiptPath=(Resolve-Path -LiteralPath $ExclusiveWindowReceipt -ErrorAction Stop).Path
        if((HostPath $receiptPath).StartsWith((HostPath $RepoRoot)+'/')) {
            throw 'WINDOW_RECEIPT_MUST_STAY_OFF_GIT'
        }
        try { $receipt=Get-Content -LiteralPath $receiptPath -Raw | ConvertFrom-Json -ErrorAction Stop }
        catch { throw 'WINDOW_RECEIPT_INVALID' }
        Assert-HiveWindowReceipt -Receipt $receipt -ApiContainerId $api -PostgresContainerId $pg -CanonicalDataRoot $canonicalData -Now ([datetimeoffset]::UtcNow)
        if($AllowHeadAdvanceIndex.IsPresent) {
            $target=Native 'git' @('-C',$RepoRoot,'rev-parse','HEAD')
            $authorizedPriorHead=Assert-HiveHeadAdvanceReceipt -Receipt $receipt -ExpectedHead $target
        }
        # Validate actual absolute archive path and reject reparse links before hashing.
        $trustedBackup=Get-HiveTrustedBackupPath -BackupPath ([string]$receipt.backup_file) -RepoRoot $RepoRoot
        if(-not (Test-Path -LiteralPath $trustedBackup -PathType Leaf)) {
            throw 'WINDOW_BACKUP_FILE_UNAVAILABLE'
        }
        $actualBackupHash=(Get-FileHash -LiteralPath $trustedBackup -Algorithm SHA256).Hash
        if($actualBackupHash -ine [string]$receipt.backup_sha256) {
            throw 'WINDOW_BACKUP_DIGEST_MISMATCH'
        }
        # docker inspect returns the environment only in memory. Never display it.
        $configEnvironment=Native 'docker' @('inspect','--format','{{json .Config.Env}}',$api) | ConvertFrom-Json
        Assert-HiveAutoDiscoveryDisabled -Environment $configEnvironment
        $apiStartedAt=Native 'docker' @('inspect','--format','{{.State.StartedAt}}',$api)
        $postgresStartedAt=Native 'docker' @('inspect','--format','{{.State.StartedAt}}',$pg)
        $before=Get-HiveDatabaseWriteStats $pg
        if([long]$before.other_active -ne 0) { throw 'WINDOW_DB_ACTIVE_SESSIONS' }
        Write-Host '[INFO] Isolated auto-discovery disabled; watching DB write counters in operator-exclusive window.'
        Start-Sleep -Seconds $ObserveSeconds
        if((Container 'api') -ne $api -or (Container 'postgres') -ne $pg) {
            throw 'WINDOW_CONTAINER_ID_DRIFT'
        }
        if((Native 'docker' @('inspect','--format','{{.State.StartedAt}}',$api)) -cne $apiStartedAt -or
            (Native 'docker' @('inspect','--format','{{.State.StartedAt}}',$pg)) -cne $postgresStartedAt) {
            throw 'WINDOW_CONTAINER_RESTARTED'
        }
        $configEnvironment=Native 'docker' @('inspect','--format','{{json .Config.Env}}',$api) | ConvertFrom-Json
        Assert-HiveAutoDiscoveryDisabled -Environment $configEnvironment
        $after=Get-HiveDatabaseWriteStats $pg
        Assert-HiveDatabaseQuiet -Before $before -After $after
        Write-Host '[PASS] Observed 120s+ no database tuple writes; operator exclusivity must remain valid through smoke.'
        if($WindowOnly.IsPresent) {
            Write-Host '[PASS] live window guarded without index/corpus mutation or nested smoke.'
            exit 0
        }
        $smokeArguments=@('-NoProfile','-NonInteractive','-ExecutionPolicy','Bypass','-File',
            (Join-Path $RepoRoot 'scripts\local\invoke-hive-smoke.ps1'),
            '-SmokeScriptPath',(Join-Path $RepoRoot 'scripts\local\check-hive.ps1'),
            '-BaseUrl',$ApiBaseUrl.AbsoluteUri.TrimEnd('/'),
            '-ProjectRelativePath','Fairview',
            '-HiveCheckout',$source,
            '-IsolatedDataRoot',$data,
            '-ExclusiveWindowReceipt',$receiptPath)
        if($RequireSemantic.IsPresent) { $smokeArguments+= '-RequireSemantic' }
        if($AllowHeadAdvanceIndex.IsPresent) { $smokeArguments+= @('-AllowHeadAdvanceIndex','-AuthorizedPriorIndexHead',$authorizedPriorHead,'-AuthorizedTargetHead',$target) }
        $oldPreference=$ErrorActionPreference
        try {
            $ErrorActionPreference='Continue'
            & powershell.exe @smokeArguments
            $smokeExit=$LASTEXITCODE
        } finally {
            $ErrorActionPreference=$oldPreference
        }
        if($smokeExit -ne 0) {throw 'FAIRVIEW_INDEX_OR_RETRIEVAL_FAILED'}
        Write-Host '[PASS] isolated Fairview READY/index/corpus/lexical/hybrid verified by actual smoke.'
    }
    Write-Host '[BOUNDARY] Exclusive writer absence and restore are operator-attested; stats cover only observed window. Semantic CURRENT, MCP and restart remain separate actual-host gates.'
    exit 0
} catch {
    $category=$_.Exception.Message
    if($category -notmatch '^[A-Z0-9_ -]+$') {$category='ISOLATED_HIVE_INSPECTION_FAILED'}
    Write-Error ('[BLOCKED] '+$category)
    exit 1
}
