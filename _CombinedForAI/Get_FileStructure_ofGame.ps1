# Define the root directory
$rootPath = "C:\Personal\AutoBattler"

# Recursive function to walk through directories
function Show-FolderTree {
    param (
        [string]$Path,
        [int]$Indent = 0
    )

    # Get folders first
    Get-ChildItem -Path $Path -Directory | ForEach-Object {
        Write-Output (" " * $Indent + "[+] " + $_.Name)
        Show-FolderTree -Path $_.FullName -Indent ($Indent + 4)
    }

    # Then get files
    Get-ChildItem -Path $Path -File | ForEach-Object {
        $extension = $_.Extension
        Write-Output (" " * $Indent + "- " + $_.Name + "  ($extension)")
    }
}

# Begin listing from root
Write-Host "Folder structure under ${rootPath}:`n" -ForegroundColor Cyan
Show-FolderTree -Path $rootPath
