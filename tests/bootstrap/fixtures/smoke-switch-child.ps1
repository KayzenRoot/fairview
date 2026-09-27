[CmdletBinding()]
param([string]$BaseUrl,[string]$ProjectRelativePath,[switch]$RequireSemantic)
Set-StrictMode -Version Latest
$ErrorActionPreference='Stop'
if($BaseUrl -like '*18999*') { exit 7 }
if($ProjectRelativePath -ne 'Fairview') { exit 8 }
if($RequireSemantic.IsPresent) { Write-Output 'SEMANTIC_PRESENT' }
else { Write-Output 'SEMANTIC_ABSENT' }
exit 0
