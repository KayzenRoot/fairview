# Normalize the top-level array returned by HIVE /api/v1/projects for Windows PowerShell 5.1.
function Convert-HiveProjectList {
    [CmdletBinding()]
    param([AllowNull()][object]$Response)

    $items=New-Object 'System.Collections.Generic.List[object]'
    foreach($item in $Response) {
        if($null -ne $item) { [void]$items.Add($item) }
    }
    return $items.ToArray()
}
