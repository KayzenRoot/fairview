# FV-BOOT-001: conservative, repeatable Windows setup. No destructive operations.
[CmdletBinding()]
param(
    [ValidateSet('Doctor','Install')][string]$Mode = 'Doctor',
    [string]$ProjectRoot = 'D:\Projects\Fairview',
    [string]$HiveCheckout = 'D:\Tools\HIVE',
    [string]$HiveData = 'D:\HIVE',
    [string]$ProjectsRoot = 'D:\Projects',
    [switch]$RequireSemantic
)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$ExpectedGEF = '866fe3af8cccc65c929aaf6a47a924401fa448b3'
$ExpectedHive = '52bd3dab54dd4f16264072e198ed1fc23168f7fa'
function Run([string]$exe, [string[]]$arguments) {
    & $exe @arguments
    if ($LASTEXITCODE -ne 0) { throw "$exe failed with exit code $LASTEXITCODE" }
}
function Require-Command([string]$name) {
    if (-not (Get-Command $name -ErrorAction SilentlyContinue)) { throw "REQUIRED_COMMAND_MISSING: $name" }
}
function Pinned-Commit([string]$location,[string]$sha,[string]$label) {
    $actual = (& git -C $location rev-parse HEAD | Out-String).Trim()
    if ($LASTEXITCODE -ne 0 -or $actual -ne $sha) { throw "$label commit mismatch; expected pinned release. Refusing automatic upgrade." }
    Write-Host "[PASS] $label pinned commit $sha"
}
function ApiHealthy {
    try { $health=Invoke-RestMethod -Uri 'http://localhost:8000/api/v1/health' -Method Get -TimeoutSec 5
          return ($health.status -eq 'ok') } catch { return $false }
}
try {
    foreach ($item in @('git','node','npm','python','docker')) { Require-Command $item }
    $v=(& node --version | Out-String).Trim()
    if ($LASTEXITCODE -ne 0 -or [int]($v -replace '^v(\d+).*$', '$1') -lt 22) { throw "NODE_22_REQUIRED" }
    $dockerType=(& docker info --format '{{.OSType}}' | Out-String).Trim()
    if ($LASTEXITCODE -ne 0 -or $dockerType -ne 'linux') { throw "DOCKER_DESKTOP_LINUX_ENGINE_REQUIRED" }
    $repo=(Resolve-Path $ProjectRoot -ErrorAction Stop).Path
    $remote=(& git -C $repo remote get-url origin | Out-String).Trim()
    if ($LASTEXITCODE -ne 0 -or $remote -notmatch '(^|[:/])KayzenRoot/fairview(\.git)?$') { throw "UNEXPECTED_REPOSITORY_ORIGIN" }
    Run 'git' @('-C',$repo,'rev-parse','HEAD')
    if ($Mode -eq 'Install') {
        & powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $repo 'scripts\local\verify-checkpoint.ps1') -ProjectRoot $repo
        if ($LASTEXITCODE -ne 0) { throw 'CHECKPOINT_EXTERNAL_RECEIPT_OR_LOCAL_HEAD_PRECHECK_FAILED' }
    }
    $gef=Join-Path $repo 'vendor\gef-bootstrap'
    if ($Mode -eq 'Doctor') {
        if (-not (Test-Path (Join-Path $gef 'package.json'))) { throw "GEF_SUBMODULE_UNINITIALIZED" }
        Pinned-Commit $gef $ExpectedGEF 'GEF'
        if (-not (Test-Path (Join-Path $HiveCheckout 'VERSION'))) { throw "HIVE_NOT_INSTALLED_LOCALLY" }
        Pinned-Commit $HiveCheckout $ExpectedHive 'HIVE'
        if (-not (ApiHealthy)) { throw "HIVE_HEALTH_NOT_OK" }
        & powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $repo 'scripts\local\check-hive.ps1') -RequireSemantic:$RequireSemantic
        if ($LASTEXITCODE -ne 0) { throw "HIVE_PROJECT_RETRIEVAL_NOT_READY" }
        Write-Host '[PASS] local Fairview + GEF + HIVE doctor'
        exit 0
    }
    # Mode Install; preserve existing checkouts and durable state.
    Run 'git' @('-C',$repo,'submodule','update','--init','--recursive')
    Pinned-Commit $gef $ExpectedGEF 'GEF'
    Push-Location $gef
    try {
        Run 'npm' @('ci')
        Run 'npm' @('run','validate')
        Run 'npm' @('audit','--audit-level=high')
    } finally { Pop-Location }
    Push-Location $repo
    try { Run 'node' @('scripts/check-sources.mjs'); Run 'node' @('scripts/harness.mjs','doctor'); Run 'node' @('scripts/harness.mjs','verify','--all') }
    finally { Pop-Location }
    if (-not (Test-Path $HiveCheckout)) {
        $toolParent=Split-Path -Parent $HiveCheckout
        if (-not (Test-Path $toolParent)) { New-Item -ItemType Directory -Path $toolParent -Force | Out-Null }
        Run 'git' @('clone','--branch','v1.0.3','--depth','1','https://github.com/KayzenRoot/hive.git',$HiveCheckout)
    }
    Pinned-Commit $HiveCheckout $ExpectedHive 'HIVE'
    $expectedProject=(Join-Path $ProjectsRoot 'Fairview')
    if ((Resolve-Path $expectedProject).Path -ne $repo) { throw "PROJECT_ROOT_MUST_BE_IMMEDIATE_CHILD_OF_PROJECTS_ROOT" }
    if (-not (Test-Path $ProjectsRoot)) { throw "PROJECTS_ROOT_MISSING" }
    if (-not (Test-Path $HiveData)) { New-Item -ItemType Directory -Path $HiveData -Force | Out-Null }
    $env:HIVE_PROJECTS_ROOT=$ProjectsRoot.Replace('\','/')
    $env:HIVE_DATA_ROOT=$HiveData.Replace('\','/')
    # Refuse to ignore contradictory existing HIVE .env root config, without printing any secrets.
    $envFile=Join-Path $HiveCheckout '.env'
    if (Test-Path $envFile) {
        foreach ($line in (Get-Content $envFile)) {
            if ($line -match '^\s*(HIVE_DATA_ROOT|HIVE_PROJECTS_ROOT)\s*=\s*(.+)\s*$') {
                $expected=if ($Matches[1] -eq 'HIVE_DATA_ROOT'){$env:HIVE_DATA_ROOT}else{$env:HIVE_PROJECTS_ROOT}
                if ($Matches[2].Trim().Trim('"',"'") -ne $expected) { throw "HIVE_ENV_ROOT_CONFLICT: inspect existing .env; no automatic overwrite" }
            }
        }
    }
    Push-Location $HiveCheckout
    try {
        Run 'python' @('scripts/hive_install.py','doctor')
        if (-not (ApiHealthy)) {
            # Upstream installer correctly refuses nonempty durable state as a new installation.
            if (@(Get-ChildItem -Force $HiveData -ErrorAction Stop).Count -gt 0) { throw "EXISTING_HIVE_DATA_WITH_UNHEALTHY_SERVICE: manual non-destructive recovery required" }
            Run 'python' @('scripts/hive_install.py','install','--yes')
        }
    } finally { Pop-Location }
    if (-not (ApiHealthy)) { throw "HIVE_HEALTH_NOT_OK_AFTER_INSTALL" }
    & powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $repo 'scripts\local\check-hive.ps1') -RequireSemantic:$RequireSemantic
    if ($LASTEXITCODE -ne 0) { throw "HIVE_PROJECT_RETRIEVAL_NOT_READY" }
    Write-Host '[PASS] verified GEF workspace and actual HIVE local REST/index/retrieval'
} catch {
    Write-Error ("[BLOCKED] " + $_.Exception.Message)
    exit 1
}
