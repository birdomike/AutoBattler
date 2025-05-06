# 1) Show & save your folder structure
$rootPath = "C:\Personal\AutoBattler"
$outputDir = "$rootPath\_CombinedForAI"
$hierFile  = "$outputDir\FolderStructure.txt"

function Show-FolderTree {
    param (
        [string]$Path,
        [int]$Indent = 0
    )
    Get-ChildItem -Path $Path -Directory | ForEach-Object {
        $line = (" " * $Indent + "[+] " + $_.Name)
        Write-Output $line
        Show-FolderTree -Path $_.FullName -Indent ($Indent + 4)
    }
    Get-ChildItem -Path $Path -File | ForEach-Object {
        $line = (" " * $Indent + "- " + $_.Name + "  (" + $_.Extension + ")")
        Write-Output $line
    }
}

# ensure output folder exists
New-Item -ItemType Directory -Path $outputDir -Force | Out-Null

# print to console
Write-Host "Folder structure under ${rootPath}:`n" -ForegroundColor Cyan
Show-FolderTree -Path $rootPath

# save to file
Show-FolderTree -Path $rootPath | Out-File -FilePath $hierFile -Encoding UTF8
Write-Host "Saved hierarchy to `"$hierFile`"." -ForegroundColor Yellow

# 2) Prepare exclusion lists
$excludeFiles = @(
    "abilities.json",
    "Base Stat Template.md",
    "Claude - Copy.txt",
    "Development_Plan.md",
    "GeminiSuggestions.md",
    "README.md",
    "Role Base Stat Template.md",
    "Role Based Stat Multipliers.md",
    "Role Chart.md",
    "Type Chart.md",
    "Type Effectiveness Table.md"
)
$excludeExts = @(".png", ".zip", ".html")

# 3) Define your 8 bundles
$groups = @{
    "Changelogs"     = @("$rootPath\Changelogs\*.md")
    "ContextDocs"    = @("$rootPath\Context\*.md")
    "JS_Core"        = @("$rootPath\js\*.js", "$rootPath\js\entities\*.js", "$rootPath\js\utilities\*.js")
    "JS_BattleLogic" = @("$rootPath\js\battle_logic\**\*.js")
    "JS_Managers"    = @("$rootPath\js\managers\*.js")
    "JS_Phaser"      = @("$rootPath\js\phaser\**\*.js")
    "JS_UI"          = @("$rootPath\js\ui\*.js")
    "Data_Examples"  = @("$rootPath\data\*.json", "$rootPath\examples\*.*")
}

# 4) Combiner function
function Combine-Files {
    param(
        [string]$outputFile,
        [string[]]$filePaths
    )
    $buffer = ""
    foreach ($file in $filePaths) {
        $name = Split-Path $file -Leaf
        $ext  = [IO.Path]::GetExtension($file).ToLower()
        if ($excludeFiles -contains $name -or $excludeExts -contains $ext) {
            continue
        }
        $buffer += "`n`n===== FILE: $name =====`n"
        $buffer += Get-Content $file -Raw
    }
    if ($buffer) {
        $buffer | Out-File -FilePath $outputFile -Encoding UTF8
    }
}

# 5) Build each bundle
foreach ($group in $groups.GetEnumerator()) {
    $allFiles = @()
    foreach ($pattern in $group.Value) {
        $allFiles += Get-ChildItem -Path $pattern -Recurse -File | Select-Object -ExpandProperty FullName
    }
    $out = "$outputDir\$($group.Key).txt"
    Combine-Files -outputFile $out -filePaths $allFiles
}

Write-Host "`n✅ Bundles ready in `"$outputDir`" — 9 files total (8 bundles + 1 hierarchy)." -ForegroundColor Green
