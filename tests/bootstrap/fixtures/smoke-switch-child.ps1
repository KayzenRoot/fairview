[CmdletBinding()]
param([string]$BaseUrl,[string]$ProjectRelativePath,[switch]$RequireSemantic,[switch]$AllowHeadAdvanceIndex,[string]$AuthorizedPriorIndexHead,[string]$AuthorizedTargetHead)
Set-StrictMode -Version Latest
$ErrorActionPreference='Stop'
if($BaseUrl -like '*18999*') { exit 7 }
if($ProjectRelativePath -ne 'Fairview') { exit 8 }
if($AllowHeadAdvanceIndex.IsPresent) {
    if($AuthorizedPriorIndexHead -cnotmatch '^[0-9a-f]{40}$' -or $AuthorizedTargetHead -cnotmatch '^[0-9a-f]{40}$') { exit 9 }
    Write-Output ('ADVANCE_PRESENT:'+$AuthorizedPriorIndexHead+':'+$AuthorizedTargetHead)
} else { Write-Output 'ADVANCE_ABSENT' }
if($RequireSemantic.IsPresent) { Write-Output 'SEMANTIC_PRESENT' }
else { Write-Output 'SEMANTIC_ABSENT' }
exit 0
