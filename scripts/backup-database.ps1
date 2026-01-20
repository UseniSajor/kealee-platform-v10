# scripts/backup-database.ps1
# Create database backup (PowerShell version)

param(
    [string]$BackupDir = "backups",
    [ValidateSet("full", "schema-only", "data-only")]
    [string]$BackupType = "full",
    [switch]$Compress
)

$ErrorActionPreference = "Stop"

function Log-Backup {
    param([string]$Message)
    Write-Host "[BACKUP] $Message" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Fail {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Write-Warn {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

# Check if DATABASE_URL is set
if (-not $env:DATABASE_URL) {
    Write-Fail "DATABASE_URL environment variable is not set"
    Write-Host "   Set it in your .env file or export it:"
    Write-Host "   `$env:DATABASE_URL = 'postgresql://user:password@host:port/database'"
    exit 1
}

# Check if pg_dump is available
try {
    $null = Get-Command pg_dump -ErrorAction Stop
} catch {
    Write-Fail "pg_dump not found"
    Write-Host "   Install PostgreSQL client tools"
    exit 1
}

# Create backup directory
if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
}

# Extract database name
$dbUrl = $env:DATABASE_URL
$dbName = ($dbUrl -split '/')[-1] -split '\?' | Select-Object -First 1
if (-not $dbName) {
    $dbName = "database"
}

# Generate backup filename
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupFile = Join-Path $BackupDir "db_backup_${dbName}_${timestamp}.sql"

if ($Compress) {
    $backupFile = "${backupFile}.gz"
}

Write-Host "💾 Creating Database Backup" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "   Database: $dbName"
Write-Host "   Type: $BackupType"
Write-Host "   Output: $backupFile"
Write-Host ""

# Build pg_dump command
$dumpArgs = @($env:DATABASE_URL, "--verbose", "--no-owner", "--no-acl")

switch ($BackupType) {
    "schema-only" {
        $dumpArgs += "--schema-only"
        Log-Backup "Creating schema-only backup..."
    }
    "data-only" {
        $dumpArgs += "--data-only"
        Log-Backup "Creating data-only backup..."
    }
    default {
        Log-Backup "Creating full backup..."
    }
}

# Execute backup
Log-Backup "Starting backup..."
$startTime = Get-Date

try {
    if ($Compress) {
        $dumpOutput = & pg_dump $dumpArgs 2>&1
        $dumpOutput | Out-File -FilePath $backupFile -Encoding utf8
        # Note: PowerShell doesn't have built-in gzip, would need 7zip or similar
        Write-Warn "Compression not fully supported in PowerShell version"
    } else {
        & pg_dump $dumpArgs | Out-File -FilePath $backupFile -Encoding utf8
    }
    
    Write-Success "Backup completed successfully"
} catch {
    Write-Fail "Backup failed: $($_.Exception.Message)"
    if (Test-Path $backupFile) {
        Remove-Item $backupFile -Force
    }
    exit 1
}

$endTime = Get-Date
$duration = [math]::Round(($endTime - $startTime).TotalSeconds)

# Get backup size
if (Test-Path $backupFile) {
    $backupSize = (Get-Item $backupFile).Length / 1MB
    Write-Success "Backup file: $backupFile"
    Write-Success "Backup size: $([math]::Round($backupSize, 2)) MB"
    Write-Success "Duration: ${duration}s"
    
    # Verify backup file
    Log-Backup "Verifying backup file..."
    if ((Get-Item $backupFile).Length -gt 0) {
        Write-Success "Backup file is valid"
    } else {
        Write-Fail "Backup file is empty or corrupted"
        exit 1
    }
    
    # Create backup info file
    $infoFile = "${backupFile}.info"
    $infoContent = @"
Backup Information
==================
Database: $dbName
Type: $BackupType
Created: $(Get-Date)
Duration: ${duration}s
Size: $([math]::Round($backupSize, 2)) MB
File: $backupFile
DATABASE_URL: $(($env:DATABASE_URL -replace ':[^:@]*@', ':***@'))
"@
    
    $infoContent | Out-File -FilePath $infoFile -Encoding utf8
    Write-Success "Backup info saved: $infoFile"
    
    Write-Host ""
    Write-Host "✅ Backup completed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📄 Backup file: $backupFile"
    Write-Host "📋 Backup info: $infoFile"
    Write-Host ""
    Write-Host "To restore:"
    Write-Host "  .\scripts\restore-database.ps1 $backupFile"
} else {
    Write-Fail "Backup file not created"
    exit 1
}
