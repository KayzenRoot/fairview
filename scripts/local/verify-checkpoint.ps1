# FV-BOOT-001 correction: external exact-main checkpoint receipt
[CmdletBinding()]
param([string]$ProjectRoot = 'D:\Projects\Fairview')
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$ApiRoot = 'https://api.github.com/repos/KayzenRoot/fairview'
$Headers = @{'Accept'='application/vnd.github+json';'User-Agent'='Fairview-Checkpoint-Doctor'}
$RequiredJobs = @('Public repository security gate', 'Source Pack and impact-driven harness',
    'Windows PowerShell parser and harness','Pinned GEF release validation')
function RunGit([string[]]$GitArguments) {
    # Windows PowerShell 5.1 promotes native stderr records to terminating errors under Stop.
    # Git writes routine fetch progress to stderr, so relax the preference only around Git.
    $savedErrorActionPreference = $ErrorActionPreference
    try {
        $ErrorActionPreference = 'Continue'
        $result = (& git -C $ProjectRoot @GitArguments 2>$null | Out-String).Trim()
        $exitCode = $LASTEXITCODE
    } finally {
        $ErrorActionPreference = $savedErrorActionPreference
    }
    if ($exitCode -ne 0) { throw ("GIT_PRECHECK_FAILED_" + $GitArguments[0]) }
    return $result
}
function GitHubGet([string]$uri) {
    return Invoke-RestMethod -Uri $uri -Headers $Headers -Method Get -TimeoutSec 25
}
try {
    $resolved = (Resolve-Path -LiteralPath $ProjectRoot -ErrorAction Stop).Path
    if (-not (Get-Command git -ErrorAction SilentlyContinue)) { throw 'GIT_REQUIRED' }
    if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw 'NODE_REQUIRED' }
    $origin = RunGit @('remote','get-url','origin')
    if ($origin -notmatch '(?:^https://github\.com/|^git@github\.com:|^ssh://git@github\.com/)KayzenRoot/fairview(?:\.git)?$') {
        throw 'UNEXPECTED_ORIGIN_REFUSE'
    }
    $dirty = RunGit @('status','--porcelain=v1','--untracked-files=all')
    if ($dirty) { throw 'LOCAL_WORKTREE_NOT_CLEAN_REFUSE' }
    # This only refreshes Git refs. It never resets, checks out, rebases or modifies local files.
    $null = RunGit @('fetch','--prune','origin','main')
    $head = RunGit @('rev-parse','HEAD')
    $remote = RunGit @('rev-parse','refs/remotes/origin/main')
    if ($head -ne $remote) { throw 'LOCAL_HEAD_DIFFERS_FROM_ORIGIN_MAIN_REFUSE_NO_RESET' }
    $repo = GitHubGet "$ApiRoot"
    if ($repo.visibility -ne 'public') { throw 'PUBLIC_DEV_POLICY_CHANGED_RECHECK_AUTH' }
    $branch = GitHubGet "$ApiRoot/git/ref/heads/main"
    $apiSha = [string]$branch.object.sha
    if ($apiSha -ne $head) { throw 'GITHUB_API_MAIN_DIFFERS_FROM_LOCAL_REF_RECHECK' }
    $runs = GitHubGet "$ApiRoot/actions/runs?per_page=30"
    $eligible = @($runs.workflow_runs | Where-Object {
       $_.head_sha -eq $head -and $_.event -eq 'push' -and $_.status -eq 'completed' -and $_.conclusion -eq 'success'
    } | Sort-Object -Property created_at -Descending)
    if ($eligible.Count -eq 0) { throw 'NO_SUCCESSFUL_EXACT_MAIN_CI' }
    $run = $eligible[0]
    $jobs = GitHubGet "$ApiRoot/actions/runs/$($run.id)/jobs?per_page=100"
    foreach ($required in $RequiredJobs) {
       $matches = @($jobs.jobs | Where-Object {$_.name -eq $required -and $_.conclusion -eq 'success'})
       if ($matches.Count -ne 1) { throw ('MISSING_REQUIRED_EXACT_MAIN_JOB_' + $required.Replace(' ','_')) }
    }
    # GitHub issue comments are external attestations and do not change the Git tree.
    # Only the repo owner's specifically formatted comment is eligible.
    $comments = GitHubGet "$ApiRoot/issues/1/comments?per_page=100"
    $marker = "FAIRVIEW_CHECKPOINT_RECEIPT_V1 sha=$head ci=$($run.id) scope=LOCAL_DEV_PRECHECK audit=OWNER_SELF_AUDIT"
    $receipt = @($comments | Where-Object {
        $_.user.login -eq 'KayzenRoot' -and $_.body.Contains($marker) -and
        ([DateTimeOffset]$_.created_at -ge [DateTimeOffset]$run.updated_at)
    })
    if ($receipt.Count -lt 1) { throw 'EXACT_MAIN_EXTERNAL_RECEIPT_MISSING_OR_STALE' }
    # The repo security scanner verifies the tracked working tree. No environment file is emitted.
    Push-Location $resolved
    try {
        & node scripts/security-scan.mjs
        if ($LASTEXITCODE -ne 0) { throw 'PUBLIC_TREE_SECURITY_GATE_FAILED' }
    } finally { Pop-Location }
    Write-Host "[PASS] LOCAL_DEV_PRECHECK exact MAIN SHA $head"
    Write-Host "[PASS] CI four required jobs on run $($run.id); owner external GitHub receipt"
    Write-Host '[BOUNDARY] Local development tooling only: NOT an independent audit, production license, HIVE READY proof or permission to live trade.'
    exit 0
} catch {
    $code = $_.Exception.Message
    if ($code -notmatch '^[A-Z0-9_ -]+$') { $code = 'CHECKPOINT_PREFLIGHT_FAILED_SEE_LOCAL_SECURE_LOGS' }
    Write-Error ("[BLOCKED] " + $code)
    exit 1
}
