# scripts/db-rollback-prod.ps1
# Rollback last database migration on production (PowerShell version)

$ErrorActionPreference = "Continue"

function Log-Rollback {
    param([string]$Message)
    Write-Host "[ROLLBACK] $Message" -ForegroundColor Cyan
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
    exit 1
}

# Safety check
Write-Host "🚨 PRODUCTION DATABASE ROLLBACK" -ForegroundColor Red
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Red
Write-Host ""
Write-Warn "⚠️  WARNING: This will ROLLBACK the last migration on PRODUCTION"
Write-Host ""
Write-Host "Before proceeding, ensure:"
Write-Host "  ✅ Database backup created"
Write-Host "  ✅ You know which migration to rollback"
Write-Host "  ✅ Application is in maintenance mode"
Write-Host "  ✅ All team members notified"
Write-Host ""

$confirm = Read-Host "Are you sure you want to rollback PRODUCTION migration? (type 'yes' to confirm)"
if ($confirm -ne "yes") {
    Write-Host "Rollback cancelled."
    exit 0
}

# Navigate to database package
Push-Location packages/database

# Check if Prisma schema exists
if (-not (Test-Path "prisma/schema.prisma")) {
    Write-Fail "Prisma schema not found"
    Pop-Location
    exit 1
}

# Get migration history
Log-Rollback "Checking migration history..."
$migrations = npx prisma migrate status --schema=./prisma/schema.prisma 2>&1

# Note: Prisma doesn't have a direct rollback command
Log-Rollback "Prisma doesn't support automatic rollback."
Log-Rollback "You need to manually revert the migration SQL."
Write-Host ""
Write-Host "To rollback:"
Write-Host "  1. Identify the migration to rollback"
Write-Host "  2. Create a new migration that reverses the changes"
Write-Host "  3. Or restore from backup"
Write-Host ""
Write-Host "Migration status:"
Write-Host $migrations
Write-Host ""

$restore = Read-Host "Do you want to restore from backup instead? (type 'yes')"

if ($restore -eq "yes") {
    # Find latest backup
    $backupsDir = "..\..\backups"
    if (Test-Path $backupsDir) {
        $latestBackup = Get-ChildItem -Path $backupsDir -Filter "db_backup_*.sql" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
        
        if (-not $latestBackup) {
            Write-Fail "No backup found in backups/ directory"
            Pop-Location
            exit 1
        }
        
        Write-Warn "Restoring from backup: $($latestBackup.FullName)"
        Write-Warn "⚠️  This will REPLACE all data in the database!"
        $restoreConfirm = Read-Host "Type 'restore' to confirm"
        
        if ($restoreConfirm -eq "restore") {
            try {
                $null = Get-Command psql -ErrorAction Stop
                Log-Rollback "Restoring database from backup..."
                Get-Content $latestBackup.FullName | psql $env:DATABASE_URL
                Write-Success "Database restored from backup"
            } catch {
                Write-Fail "psql not found or restore failed. Cannot restore from backup."
                Pop-Location
                exit 1
            }
        } else {
            Write-Host "Restore cancelled."
            Pop-Location
            exit 0
        }
    } else {
        Write-Fail "Backups directory not found"
        Pop-Location
        exit 1
    }
} else {
    Write-Warn "Manual rollback required. See Prisma documentation for details."
    Write-Host ""
    Write-Host "To create a rollback migration:"
    Write-Host "  1. Review the migration file to rollback"
    Write-Host "  2. Create a new migration that reverses changes"
    Write-Host "  3. Run: npx prisma migrate dev --name=rollback_<migration_name>"
    Pop-Location
    exit 0
}

Pop-Location
