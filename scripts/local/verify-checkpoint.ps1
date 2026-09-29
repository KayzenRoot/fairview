# FairView non-destructive exact-main local development preflight.
[CmdletBinding()]
param([string]$ProjectRoot='D:\Projects\Fairview')
Set-StrictMode -Version Latest
$ErrorActionPreference='Stop'
$ApiRoot='https://api.github.com/repos/KayzenRoot/fairview'
$Headers=@{'Accept'='application/vnd.github+json';'User-Agent'='FairView-Source-Preflight'}
$RequiredJobs=@('Public repository security gate','Source Pack and impact-driven harness','Windows PowerShell parser and harness','Pinned GEF release validation')
function RunGit([string[]]$GitArguments) {
    $savedErrorActionPreference=$ErrorActionPreference
    try {
        $ErrorActionPreference='Continue'
        $result=(& git -C $ProjectRoot @GitArguments 2>$null | Out-String).Trim()
        $exitCode=$LASTEXITCODE
    } finally { $ErrorActionPreference=$savedErrorActionPreference }
    if($exitCode -ne 0) { throw ('GIT_PRECHECK_FAILED_'+$GitArguments[0]) }
    return $result
}
function GitHubGet([string]$uri) { return Invoke-RestMethod -Uri $uri -Headers $Headers -Method Get -TimeoutSec 25 }
try {
    $repo=(Resolve-Path -LiteralPath $ProjectRoot -ErrorAction Stop).Path
    foreach($name in @('git','node')){if(-not (Get-Command $name -ErrorAction SilentlyContinue)){throw ('REQUIRED_COMMAND_MISSING_'+$name)}}
    $origin=RunGit @('remote','get-url','origin')
    if($origin -notmatch '(?:^https://github\.com/|^git@github\.com:|^ssh://git@github\.com/)KayzenRoot/fairview(?:\.git)?$'){throw 'UNEXPECTED_ORIGIN_REFUSE'}
    $dirty=RunGit @('status','--porcelain=v1','--untracked-files=all')
    if($dirty){throw 'LOCAL_WORKTREE_NOT_CLEAN_REFUSE'}
    $null=RunGit @('fetch','--prune','origin','main')
    $head=RunGit @('rev-parse','HEAD')
    $remote=RunGit @('rev-parse','refs/remotes/origin/main')
    if($head -ne $remote){throw 'LOCAL_HEAD_DIFFERS_FROM_ORIGIN_MAIN_REFUSE_NO_RESET'}
    $repoInfo=GitHubGet "$ApiRoot"
    if($repoInfo.visibility -ne 'public'){throw 'PUBLIC_DEV_POLICY_CHANGED_RECHECK_AUTH'}
    $branch=GitHubGet "$ApiRoot/git/ref/heads/main"
    if([string]$branch.object.sha -ne $head){throw 'GITHUB_API_MAIN_DIFFERS_FROM_LOCAL_REF_RECHECK'}
    $runs=GitHubGet "$ApiRoot/actions/runs?per_page=30"
    $eligible=@($runs.workflow_runs | Where-Object { $_.head_sha -eq $head -and $_.event -eq 'push' -and $_.status -eq 'completed' -and $_.conclusion -eq 'success' } | Sort-Object created_at -Descending)
    if($eligible.Count -eq 0){throw 'NO_SUCCESSFUL_EXACT_MAIN_CI'}
    $run=$eligible[0]
    $jobs=GitHubGet "$ApiRoot/actions/runs/$($run.id)/jobs?per_page=100"
    foreach($required in $RequiredJobs){
        $matches=@($jobs.jobs | Where-Object { $_.name -eq $required -and $_.conclusion -eq 'success' })
        if($matches.Count -ne 1){throw ('MISSING_REQUIRED_EXACT_MAIN_JOB_'+$required.Replace(' ','_'))}
    }
    Push-Location $repo
    try {
        & node scripts/check-sources.mjs
        if($LASTEXITCODE -ne 0){throw 'SOURCE_PACK_INVALID'}
        & node scripts/security-scan.mjs
        if($LASTEXITCODE -ne 0){throw 'PUBLIC_TREE_SECURITY_GATE_FAILED'}
    } finally { Pop-Location }
    Write-Host "[PASS] LOCAL_DEV_PRECHECK exact main $head / CI $($run.id)"
    Write-Host '[BOUNDARY] Local source readiness only; no independent review, broker eligibility or live trading authorization.'
    exit 0
} catch {
    $code=$_.Exception.Message
    if($code -notmatch '^[A-Z0-9_ -]+$'){$code='SOURCE_PREFLIGHT_FAILED_SEE_PRIVATE_LOGS'}
    Write-Error ('[BLOCKED] '+$code)
    exit 1
}
