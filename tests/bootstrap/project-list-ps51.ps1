[CmdletBinding()]
param([Parameter(Mandatory=$true)][string]$HelperPath)
Set-StrictMode -Version Latest
$ErrorActionPreference='Stop'
. (Resolve-Path -LiteralPath $HelperPath).Path

# HIVE returns a top-level JSON array; Windows PowerShell 5.1 may not flatten it
# when it is piped directly from Invoke-RestMethod into Where-Object.
$response=ConvertFrom-Json '[{"project_id":"other","relative_path":"Other","state":"READY"},{"project_id":"fairview","relative_path":"Fairview","state":"READY"}]'
$projects=Convert-HiveProjectList -Response $response
$fairview=@($projects | Where-Object { $_.relative_path -eq 'Fairview' })
if(@($projects).Count -ne 2 -or $fairview.Count -ne 1 -or $fairview[0].project_id -ne 'fairview') {
    throw 'PS51_PROJECT_LIST_FLATTEN_REGRESSION'
}

# PowerShell 5.1 converts an empty JSON array to $null; that must remain an empty list.
$empty=ConvertFrom-Json '[]'
$emptyProjects=Convert-HiveProjectList -Response $empty
if(@($emptyProjects).Count -ne 0) { throw 'PS51_EMPTY_PROJECT_LIST_REGRESSION' }
Write-Output '[PASS] PS51_PROJECT_LIST_FLAT_AND_EMPTY'
