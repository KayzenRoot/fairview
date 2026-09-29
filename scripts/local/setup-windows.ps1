# FairView local Git/Node/GEF development setup. Never install third-party services.
[CmdletBinding()]
param(
    [ValidateSet('Doctor','Install')][string]$Mode='Doctor',
    [string]$ProjectRoot='D:\Projects\Fairview'
)
Set-StrictMode -Version Latest
$ErrorActionPreference='Stop'
$ExpectedGEF='866fe3af8cccc65c929aaf6a47a924401fa448b3'
function Native([string]$Exe,[string[]]$ArgsList) {
    $saved=$ErrorActionPreference
    try { $ErrorActionPreference='Continue'; & $Exe @ArgsList 2>$null; $code=$LASTEXITCODE }
    finally { $ErrorActionPreference=$saved }
    if($code -ne 0) { throw ('COMMAND_FAILED_'+$Exe) }
}
try {
    foreach($exe in @('git','node','npm')) {
        if(-not (Get-Command $exe -ErrorAction SilentlyContinue)) { throw ('REQUIRED_COMMAND_MISSING_'+$exe) }
    }
    $nodeText=(& node --version | Out-String).Trim()
    if($LASTEXITCODE -ne 0 -or $nodeText -notmatch '^v(\d+)\.') { throw 'NODE_VERSION_UNVERIFIED' }
    if([int]$Matches[1] -lt 22) { throw 'NODE_22_REQUIRED' }
    $repo=(Resolve-Path -LiteralPath $ProjectRoot -ErrorAction Stop).Path
    $origin=(& git -C $repo remote get-url origin | Out-String).Trim()
    if($LASTEXITCODE -ne 0 -or $origin -notmatch '(?:^https://github\.com/|^git@github\.com:|^ssh://git@github\.com/)KayzenRoot/fairview(?:\.git)?$') { throw 'UNEXPECTED_REPOSITORY_ORIGIN' }
    if($Mode -eq 'Install') {
        # Initialize only this repository's submodule, not another project or a Docker service.
        Native 'git' @('-C',$repo,'submodule','update','--init','--recursive')
    }
    $gef=Join-Path $repo 'vendor\gef-bootstrap'
    if(-not (Test-Path -LiteralPath (Join-Path $gef 'package.json') -PathType Leaf)) { throw 'GEF_SUBMODULE_UNINITIALIZED' }
    $sha=(& git -C $gef rev-parse HEAD | Out-String).Trim()
    if($LASTEXITCODE -ne 0 -or $sha -cne $ExpectedGEF) { throw 'GEF_PIN_MISMATCH' }
    Write-Host ('[PASS] pinned GEF '+$sha)
    if($Mode -eq 'Install') {
        Push-Location $gef
        try { Native 'npm' @('ci'); Native 'npm' @('run','validate'); Native 'npm' @('audit','--audit-level=high') }
        finally { Pop-Location }
        Push-Location $repo
        try { Native 'node' @('scripts/check-sources.mjs'); Native 'node' @('scripts/security-scan.mjs'); Native 'node' @('scripts/harness.mjs','doctor'); Native 'node' @('scripts/harness.mjs','verify','--all') }
        finally { Pop-Location }
    }
    Write-Host '[PASS] local development baseline: Git + Node22 + pinned GEF + native harness'
    exit 0
} catch {
    Write-Error ('[BLOCKED] '+$_.Exception.Message)
    exit 1
}
