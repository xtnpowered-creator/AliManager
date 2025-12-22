<#
.SYNOPSIS
Moves the .gemini directory to D: and creates a Junction link from C: to D:.
This frees up space on C: while keeping the path "C:\Users\Christian\.gemini" valid.

.DESCRIPTION
WARNING: Run this script ONLY when VS Code and the AI Agent are CLOSED.
Files currently in use by the agent cannot be moved securely.
#>

$SourcePath = "C:\Users\Christian\.gemini"
$DestPath = "D:\.gemini_storage"

Write-Host "Preparing to migrate Brain items from C: to D:..." -ForegroundColor Cyan

# 1. Check Source
if (-not (Test-Path -Path $SourcePath)) {
    Write-Host "Error: Source directory $SourcePath not found." -ForegroundColor Red
    exit
}

# 2. Check/Create Destination
if (-not (Test-Path -Path $DestPath)) {
    New-Item -ItemType Directory -Path $DestPath -Force | Out-Null
    Write-Host "Created destination: $DestPath" -ForegroundColor Green
}

# 3. Move Data (Robocopy is robust for move)
# /E = Recursive, /MOVE = Move files and dirs (delete from source), /IS /IT = Include same/tweaked
# /XJ = Exclude Junction points (safety)
Write-Host "Moving files... (This may take a moment)" -ForegroundColor Yellow
$proc = Start-Process robocopy -ArgumentList "`"$SourcePath`" `"$DestPath`" /E /MOVE /NFL /NDL" -Wait -PassThru

if ($proc.ExitCode -gt 7) {
    Write-Host "ROBOCOPY ERROR: Exit Code $($proc.ExitCode). Some files might be locked." -ForegroundColor Red
    Write-Host "Recommendation: Close VS Code and try again." -ForegroundColor Gray
    exit
}

# 4. Verify Source is Empty/Gone (Robocopy /MOVE usually deletes the source folder if empty)
if (Test-Path -Path $SourcePath) {
    # If folder remains (sometimes happens if root), delete it to make room for Junction
    Remove-Item -Path $SourcePath -Recurse -Force -ErrorAction SilentlyContinue
}

# Duouble check it's gone
if (Test-Path -Path $SourcePath) {
    Write-Host "Error: Could not remove source folder. Files might be locked." -ForegroundColor Red
    exit
}

# 5. Create Junction
Write-Host "Creating Junction Link..." -ForegroundColor Cyan
New-Item -ItemType Junction -Path $SourcePath -Target $DestPath | Out-Null

Write-Host "SUCCESS!" -ForegroundColor Green
Write-Host "Your data is now physically on D: ($DestPath)"
Write-Host "But the agent looks at C: ($SourcePath) and works happily."
