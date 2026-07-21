# scripts/restore-database.ps1
# Restore database from backup (PowerShell version)

param(
    [Parameter(Mandatory=$true)]
    [string]$BackupFile
)

$ErrorActionPreference = "Stop"

function Log-Restore {
    param([string]$Message)
    Write-Host "[RESTORE] $Message" -ForegroundColor Cyan
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

# Check if backup file exists
if (-not (Test-Path $BackupFile)) {
    Write-Fail "Backup file not found: $BackupFile"
    Write-Host ""
    Write-Host "Available backups:"
    if (Test-Path "backups") {
        Get-ChildItem -Path "backups" -Filter "*.sql*" | Sort-Object LastWriteTime -Descending | Select-Object -First 5 | ForEach-Object {
            Write-Host "  $($_.FullName)"
        }
    } else {
        Write-Host "  (backups directory not found)"
    }
    exit 1
}

# Check if DATABASE_URL is set
if (-not $env:DATABASE_URL) {
    Write-Fail "DATABASE_URL environment variable is not set"
    Write-Host "   Set it in your .env file or export it:"
    Write-Host "   `$env:DATABASE_URL = 'postgresql://user:password@host:port/database'"
    exit 1
}

# Check if psql is available
try {
    $null = Get-Command psql -ErrorAction Stop
} catch {
    Write-Fail "psql not found"
    Write-Host "   Install PostgreSQL client tools"
    exit 1
}

# Safety check
Write-Host "🚨 DATABASE RESTORE" -ForegroundColor Red
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Red
Write-Host ""
Write-Warn "⚠️  WARNING: This will REPLACE all data in the database!"
Write-Host ""
Write-Host "Backup file: $BackupFile"
$backupSize = (Get-Item $BackupFile).Length / 1MB
Write-Host "Backup size: $([math]::Round($backupSize, 2)) MB"
Write-Host ""
Write-Host "Before proceeding, ensure:"
Write-Host "  ✅ This is the correct backup file"
Write-Host "  ✅ Database is in maintenance mode"
Write-Host "  ✅ All applications are stopped"
Write-Host "  ✅ You have a current backup (if needed)"
Write-Host ""

$confirm = Read-Host "Are you sure you want to restore from this backup? (type 'restore' to confirm)"
if ($confirm -ne "restore") {
    Write-Host "Restore cancelled."
    exit 0
}

# Extract database name
$dbUrl = $env:DATABASE_URL
$dbName = ($dbUrl -split '/')[-1] -split '\?' | Select-Object -First 1
if (-not $dbName) {
    $dbName = "database"
}

Log-Restore "Restoring database: $dbName"
Log-Restore "Backup file: $BackupFile"
Write-Host ""

# Check if backup is compressed
$restoreFile = $BackupFile
if ($BackupFile -match '\.gz$') {
    Write-Warn "Compressed backups require manual decompression in PowerShell"
    Write-Host "   Please decompress the backup file first, or use the bash script"
    exit 1
}

# Test database connection
Log-Restore "Testing database connection..."
try {
    $null = psql $env:DATABASE_URL -c "SELECT 1;" 2>&1 | Out-Null
    Write-Success "Database connection verified"
} catch {
    Write-Fail "Cannot connect to database"
    exit 1
}

# Restore database
Log-Restore "Starting restore..."
$startTime = Get-Date

try {
    Get-Content $restoreFile | psql $env:DATABASE_URL
    Write-Success "Restore completed successfully"
} catch {
    Write-Fail "Restore failed: $($_.Exception.Message)"
    exit 1
}

$endTime = Get-Date
$duration = [math]::Round(($endTime - $startTime).TotalSeconds)

# Verify restore
Log-Restore "Verifying restore..."
try {
    $tableCount = psql $env:DATABASE_URL -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>&1 | Out-String | Trim()
    Write-Success "Restore verified: $tableCount tables found"
} catch {
    Write-Warn "Could not verify restore (may be normal)"
}

Write-Host ""
Write-Host "✅ Database restore completed!" -ForegroundColor Green
Write-Host "   Duration: ${duration}s"
Write-Host ""
Write-Host "📋 Next Steps:"
Write-Host "   1. Verify data integrity"
Write-Host "   2. Run migrations if needed"
Write-Host "   3. Restart applications"
Write-Host "   4. Run smoke tests"
Write-Host ""
