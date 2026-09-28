# FV-BOOT-001 R8: no cross-process Boolean string binding of a PowerShell [switch].
[CmdletBinding()]
param(
    [Parameter(Mandatory=$true)][string]$SmokeScriptPath,
    [Parameter(Mandatory=$true)][uri]$BaseUrl,
    [string]$ProjectRelativePath='Fairview',
    [switch]$RequireSemantic,
    [switch]$AllowHeadAdvanceIndex,
    [string]$AuthorizedPriorIndexHead
)
Set-StrictMode -Version Latest
$ErrorActionPreference='Stop'
try {
    $child=(Resolve-Path -LiteralPath $SmokeScriptPath -ErrorAction Stop).Path
    if($BaseUrl.Scheme -ne 'http' -or $BaseUrl.Host -notin @('localhost','127.0.0.1','::1')) {
        throw 'SMOKE_BASE_URL_NOT_LOOPBACK'
    }
    $arguments=@('-NoProfile','-NonInteractive','-ExecutionPolicy','Bypass',
        '-File',$child,'-BaseUrl',$BaseUrl.AbsoluteUri.TrimEnd('/'),
        '-ProjectRelativePath',$ProjectRelativePath)
    # powershell.exe -File parses native CLI arguments as text. An absent [switch]
    # MUST be entirely omitted rather than forwarded as -RequireSemantic:$false.
    if($RequireSemantic.IsPresent) { $arguments+= '-RequireSemantic' }
    if($AllowHeadAdvanceIndex.IsPresent) {
        if($AuthorizedPriorIndexHead -cnotmatch '^[0-9a-f]{40}$') { throw 'INDEX_PRIOR_HEAD_REQUIRED' }
        $arguments+= @('-AllowHeadAdvanceIndex','-AuthorizedPriorIndexHead',$AuthorizedPriorIndexHead)
    }
    $previous=$ErrorActionPreference
    try {
        $ErrorActionPreference='Continue'
        & powershell.exe @arguments
        $childExit=$LASTEXITCODE
    } finally {
        $ErrorActionPreference=$previous
    }
    if($childExit -ne 0) { throw 'FAIRVIEW_SMOKE_CHILD_FAILED' }
    exit 0
} catch {
    $category=$_.Exception.Message
    if($category -notmatch '^[A-Z0-9_]+$') { $category='SMOKE_LAUNCH_FAILED' }
    Write-Error ('[BLOCKED] '+$category)
    exit 1
}
