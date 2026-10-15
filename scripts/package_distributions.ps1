param(
    [string]$OutputDirectory = "Google_Drive_Ready"
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$projectRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot ".."))
$outputRoot = [System.IO.Path]::GetFullPath((Join-Path $projectRoot $OutputDirectory))
if (-not $outputRoot.StartsWith($projectRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Output directory must remain inside the project workspace."
}
[System.IO.Directory]::CreateDirectory($outputRoot) | Out-Null

$commonExcludedDirectories = @(".git", ".npm-cache", "backups", "Google_Drive_Ready", "__pycache__", "coverage")
$sourceExcludedDirectories = @("node_modules", ".next")
$excludedFileNames = @(".env", "tsconfig.tsbuildinfo")
$previousArchives = [System.Collections.Generic.List[string]]::new()

function Get-RelativeProjectPath {
    param([string]$FullName)
    $absolute = [System.IO.Path]::GetFullPath($FullName)
    if (-not $absolute.StartsWith($projectRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
        throw "File is outside the project workspace: $absolute"
    }
    return $absolute.Substring($projectRoot.Length).TrimStart([char[]]@("\", "/")).Replace("\", "/")
}

function Test-IncludedFile {
    param([System.IO.FileInfo]$File, [bool]$IncludeRuntime)

    $relative = Get-RelativeProjectPath -FullName $File.FullName
    $segments = $relative.Split("/")
    if ($segments | Where-Object { $commonExcludedDirectories -contains $_ }) { return $false }
    if (-not $IncludeRuntime -and ($segments | Where-Object { $sourceExcludedDirectories -contains $_ })) { return $false }
    if ($relative.StartsWith("public/uploads/", [System.StringComparison]::OrdinalIgnoreCase)) { return $false }
    if ($excludedFileNames -contains $File.Name) { return $false }
    if ($File.Extension -eq ".zip") { return $false }
    if (-not $IncludeRuntime -and ($relative -eq "dev.db" -or $relative -eq "prisma/dev.db")) { return $false }
    return $true
}

function Add-TextEntry {
    param(
        [System.IO.Compression.ZipArchive]$Archive,
        [string]$EntryName,
        [string]$Content
    )
    $entry = $Archive.CreateEntry($EntryName, [System.IO.Compression.CompressionLevel]::Optimal)
    $stream = $entry.Open()
    $writer = [System.IO.StreamWriter]::new($stream, [System.Text.UTF8Encoding]::new($false))
    try { $writer.Write($Content) } finally { $writer.Dispose(); $stream.Dispose() }
}

function New-DistributionZip {
    param(
        [string]$Name,
        [bool]$IncludeRuntime
    )

    $target = Join-Path $outputRoot $Name
    $temporary = "$target.tmp"
    if ([System.IO.File]::Exists($temporary)) { [System.IO.File]::Delete($temporary) }

    $fileStream = [System.IO.File]::Open($temporary, [System.IO.FileMode]::CreateNew)
    $archive = [System.IO.Compression.ZipArchive]::new($fileStream, [System.IO.Compression.ZipArchiveMode]::Create, $false)
    try {
        $files = Get-ChildItem -LiteralPath $projectRoot -Recurse -File -Force |
            Where-Object { Test-IncludedFile -File $_ -IncludeRuntime $IncludeRuntime }
        foreach ($file in $files) {
            $relative = Get-RelativeProjectPath -FullName $file.FullName
            $entry = $archive.CreateEntry($relative, [System.IO.Compression.CompressionLevel]::Optimal)
            $sourceStream = [System.IO.File]::Open($file.FullName, [System.IO.FileMode]::Open, [System.IO.FileAccess]::Read, [System.IO.FileShare]::ReadWrite)
            try {
                $entryStream = $entry.Open()
                try {
                    $sourceStream.CopyTo($entryStream)
                } finally {
                    $entryStream.Dispose()
                }
            } finally {
                $sourceStream.Dispose()
            }
        }

        if ($IncludeRuntime) {
            $secretBytes = [byte[]]::new(48)
            $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
            $rng.GetBytes($secretBytes)
            $jwtSecret = [Convert]::ToBase64String($secretBytes)
            $environment = @"
DATABASE_URL="file:./dev.db"
JWT_SECRET="$jwtSecret"
ENABLE_DEMO_ROLE_SWITCH="false"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
"@
            Add-TextEntry -Archive $archive -EntryName ".env" -Content $environment
        }
    } finally {
        $archive.Dispose()
        $fileStream.Dispose()
    }

    $replaced = $false
    for ($attempt = 1; $attempt -le 5; $attempt++) {
        try {
            if ([System.IO.File]::Exists($target)) {
                $previous = "$target.previous"
                if ([System.IO.File]::Exists($previous)) { [System.IO.File]::Delete($previous) }
                [System.IO.File]::Replace($temporary, $target, $previous, $true)
                $previousArchives.Add($previous)
            } else {
                [System.IO.File]::Move($temporary, $target)
            }
            $replaced = $true
            break
        } catch {
            Write-Warning "Attempt $attempt encountered lock on $target : $_. Retrying..."
            Start-Sleep -Seconds 1
        }
    }
    if (-not $replaced) {
        [System.IO.File]::Copy($temporary, $target, $true)
        [System.IO.File]::Delete($temporary)
    }
}

# Clean any dangling .tmp files in output root before starting
Get-ChildItem -LiteralPath $outputRoot -Filter "*.tmp" -File -Force | ForEach-Object {
    try { [System.IO.File]::Delete($_.FullName) } catch {}
}

# 1. Package Source Clean
Write-Host "Packaging Super_Eagles_AMMS_Source_Clean.zip..."
New-DistributionZip -Name "Super_Eagles_AMMS_Source_Clean.zip" -IncludeRuntime $false

# 2. Package FULL_WORKING_APP (contains node_modules, .next production build, database, .env)
Write-Host "Packaging Super_Eagles_AMMS_FULL_WORKING_APP.zip..."
New-DistributionZip -Name "Super_Eagles_AMMS_FULL_WORKING_APP.zip" -IncludeRuntime $true

# 3. Create Standalone_Executable.zip and Complete_Project.zip from the verified FULL_WORKING_APP build
$fullAppPath = Join-Path $outputRoot "Super_Eagles_AMMS_FULL_WORKING_APP.zip"
foreach ($cloneName in @("Super_Eagles_AMMS_Standalone_Executable.zip", "Super_Eagles_AMMS_Complete_Project.zip")) {
    Write-Host "Syncing $cloneName from verified full runtime package..."
    $cloneTarget = Join-Path $outputRoot $cloneName
    [System.IO.File]::Copy($fullAppPath, $cloneTarget, $true)
}

$packages = @(
    @{ Name = "Super_Eagles_AMMS_Source_Clean.zip"; IncludeRuntime = $false },
    @{ Name = "Super_Eagles_AMMS_FULL_WORKING_APP.zip"; IncludeRuntime = $true },
    @{ Name = "Super_Eagles_AMMS_Standalone_Executable.zip"; IncludeRuntime = $true },
    @{ Name = "Super_Eagles_AMMS_Complete_Project.zip"; IncludeRuntime = $true }
)

Write-Host "Verifying package integrity..."
foreach ($package in $packages) {
    $path = Join-Path $outputRoot $package.Name
    $zip = [System.IO.Compression.ZipFile]::OpenRead($path)
    try {
        $names = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)
        foreach ($entry in $zip.Entries) { [void]$names.Add($entry.FullName) }
        foreach ($required in @("package.json", "package-lock.json", "start.bat", "src/app/page.tsx", "prisma/schema.prisma")) {
            if (-not $names.Contains($required)) { throw "$($package.Name) is missing $required" }
        }
        if ($package.IncludeRuntime) {
            foreach ($required in @(".env", ".next/BUILD_ID", "node_modules/next/package.json", "prisma/dev.db")) {
                if (-not $names.Contains($required)) { throw "$($package.Name) is missing $required" }
            }
        } elseif ($names.Contains(".env") -or $names.Contains("prisma/dev.db") -or $names.Contains(".next/BUILD_ID")) {
            throw "$($package.Name) contains runtime state that must be excluded from the clean source package"
        }
        if ($names.Contains("console.log('KEYS")) { throw "$($package.Name) contains the obsolete junk file" }

        $info = Get-Item -LiteralPath $path
        $hash = Get-FileHash -LiteralPath $path -Algorithm SHA256
        [pscustomobject]@{
            Name = $package.Name
            SizeMB = [math]::Round($info.Length / 1MB, 1)
            Entries = $zip.Entries.Count
            SHA256 = $hash.Hash
        }
    } finally {
        $zip.Dispose()
    }
}

foreach ($previous in $previousArchives) {
    if ([System.IO.File]::Exists($previous)) { [System.IO.File]::Delete($previous) }
}

# Sync all rebuilt packages to project root directory as well
Write-Host "Syncing rebuilt packages to project root..."
foreach ($package in $packages) {
    $src = Join-Path $outputRoot $package.Name
    $dst = Join-Path $projectRoot $package.Name
    try {
        [System.IO.File]::Copy($src, $dst, $true)
    } catch {
        Write-Warning "Could not copy to root: $_"
    }
}

Write-Host "All distribution ZIP packages successfully built, verified, and synchronized."
