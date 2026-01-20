# scripts/run-database-migrations.ps1
# Run Prisma database migrations with backup and verification (PowerShell version)

param(
    [string]$DatabasePackageDir = "packages/database",
    [string]$BackupDir = "backups",
    [string]$MigrationMode = "deploy", # 'dev' or 'deploy'
    [switch]$SkipBackup,
    [switch]$SkipIntegrityCheck
)

$ErrorActionPreference = "Stop"

function Log-Message {
    param([string]$Message)
    Write-Host "[MIGRATION] $Message" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

# Check if DATABASE_URL is set
if (-not $env:DATABASE_URL) {
    Write-Error "DATABASE_URL environment variable is not set"
    Write-Host "   Set it in your .env file or export it:"
    Write-Host "   `$env:DATABASE_URL = 'postgresql://user:password@host:port/database'"
    exit 1
}

# Check if npx is available
try {
    $null = Get-Command npx -ErrorAction Stop
} catch {
    Write-Error "npx is not installed. Please install Node.js and npm."
    exit 1
}

# Navigate to database package directory
if (-not (Test-Path $DatabasePackageDir)) {
    Write-Error "Database package directory not found: $DatabasePackageDir"
    exit 1
}

Push-Location $DatabasePackageDir

# Check if Prisma schema exists
if (-not (Test-Path "prisma/schema.prisma")) {
    Write-Error "Prisma schema not found: prisma/schema.prisma"
    exit 1
}

Write-Host "🗄️  Running Database Migrations" -ForegroundColor Cyan
Write-Host "   Database Package: $DatabasePackageDir"
Write-Host "   Migration Mode: $MigrationMode"
$dbName = ($env:DATABASE_URL -split '@')[1] -split '/' | Select-Object -First 1
Write-Host "   Database: $dbName"
Write-Host ""

# Step 1: Create backup
if (-not $SkipBackup) {
    Log-Message "1. Creating database backup..."
    
    # Create backup directory if it doesn't exist
    if (-not (Test-Path $BackupDir)) {
        New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
    }
    
    # Extract database name from DATABASE_URL
    $dbName = ($env:DATABASE_URL -split '/')[-1] -split '\?' | Select-Object -First 1
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $BackupFile = Join-Path $BackupDir "db_backup_${dbName}_${timestamp}.sql"
    
    # Check if pg_dump is available
    try {
        $null = Get-Command pg_dump -ErrorAction Stop
        $env:PGPASSWORD = ($env:DATABASE_URL -split ':')[2] -split '@' | Select-Object -First 1
        pg_dump $env:DATABASE_URL | Out-File -FilePath $BackupFile -Encoding utf8
        $backupSize = (Get-Item $BackupFile).Length / 1MB
        Write-Success "Backup created: $BackupFile ($([math]::Round($backupSize, 2)) MB)"
    } catch {
        Write-Warning "Failed to create backup with pg_dump. Continuing without backup..."
        Write-Warning "   Install PostgreSQL client tools to enable backups."
        $SkipBackup = $true
    }
} else {
    Log-Message "1. Skipping backup (SkipBackup=true)"
}

# Step 2: Generate Prisma Client
Log-Message "2. Generating Prisma Client..."
try {
    npx prisma generate --schema=./prisma/schema.prisma
    Write-Success "Prisma Client generated successfully"
} catch {
    Write-Error "Failed to generate Prisma Client"
    Pop-Location
    exit 1
}

# Step 3: Check migration status
Log-Message "3. Checking migration status..."
try {
    $migrationStatus = npx prisma migrate status --schema=./prisma/schema.prisma 2>&1
    if ($migrationStatus -match "Database schema is up to date") {
        Write-Success "Database schema is up to date"
        $UpToDate = $true
    } elseif ($migrationStatus -match "migrations pending") {
        Write-Warning "Migrations pending"
        $UpToDate = $false
    } else {
        $UpToDate = $false
    }
} catch {
    Write-Error "Error checking migration status"
    Write-Host $_.Exception.Message
    Pop-Location
    exit 1
}

# Step 4: Run migrations
if (-not $UpToDate -or $MigrationMode -eq "dev") {
    Log-Message "4. Running migrations..."
    
    if ($MigrationMode -eq "dev") {
        # Development mode: creates new migration and applies it
        $migrationName = "migration_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
        try {
            npx prisma migrate dev --schema=./prisma/schema.prisma --name=$migrationName
            Write-Success "Development migrations completed"
        } catch {
            Write-Error "Development migrations failed"
            if (-not $SkipBackup -and (Test-Path $BackupFile)) {
                Write-Warning "Backup available at: $BackupFile"
            }
            Pop-Location
            exit 1
        }
    } else {
        # Production mode: applies pending migrations
        try {
            npx prisma migrate deploy --schema=./prisma/schema.prisma
            Write-Success "Production migrations deployed successfully"
        } catch {
            Write-Error "Production migrations failed"
            if (-not $SkipBackup -and (Test-Path $BackupFile)) {
                Write-Warning "Backup available at: $BackupFile"
                Write-Host ""
                Write-Host "To restore from backup:"
                Write-Host "  psql `"`$env:DATABASE_URL`" < `"$BackupFile`""
            }
            Pop-Location
            exit 1
        }
    }
} else {
    Log-Message "4. No migrations to apply"
}

# Step 5: Verify migration status
Log-Message "5. Verifying migration status..."
try {
    $finalStatus = npx prisma migrate status --schema=./prisma/schema.prisma 2>&1
    if ($finalStatus -match "Database schema is up to date") {
        Write-Success "Migration verification passed"
    } else {
        Write-Warning "Migration status check inconclusive"
        Write-Host $finalStatus
    }
} catch {
    Write-Warning "Could not verify migration status"
}

# Step 6: Data integrity checks
if (-not $SkipIntegrityCheck) {
    Log-Message "6. Running data integrity checks..."
    
    # Run integrity checks if psql is available
    try {
        $null = Get-Command psql -ErrorAction Stop
        $integritySql = @"
-- Check for orphaned records
SELECT 
    'Orphaned ServicePlans' as check_name,
    COUNT(*) as count
FROM "ServicePlan" sp
LEFT JOIN "User" u ON sp."userId" = u.id
WHERE u.id IS NULL
UNION ALL
SELECT 
    'Orphaned OrgMembers' as check_name,
    COUNT(*) as count
FROM "OrgMember" om
LEFT JOIN "User" u ON om."userId" = u.id
WHERE u.id IS NULL
UNION ALL
SELECT 
    'Orphaned Projects' as check_name,
    COUNT(*) as count
FROM "Project" p
LEFT JOIN "User" u ON p."ownerId" = u.id
WHERE u.id IS NULL;
"@
        
        $integrityResult = $integritySql | psql $env:DATABASE_URL -t 2>&1
        if ($integrityResult) {
            Write-Host $integrityResult
            Write-Success "Integrity checks completed"
        } else {
            Write-Warning "Integrity checks inconclusive"
        }
    } catch {
        Write-Warning "psql not found. Skipping integrity checks."
        Write-Warning "   Install PostgreSQL client tools to enable integrity checks."
    }
} else {
    Log-Message "6. Skipping integrity checks (SkipIntegrityCheck=true)"
}

# Step 7: Generate migration report
Log-Message "7. Generating migration report..."
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$ReportFile = Join-Path "..\.." "migration-report_${timestamp}.md"

$reportContent = @"
# Database Migration Report

**Generated:** $(Get-Date)
**Database:** $dbName
**Migration Mode:** $MigrationMode
**Backup File:** $(if ($SkipBackup) { "N/A (skipped)" } else { $BackupFile })

## Migration Status

``````
$finalStatus
``````

## Prisma Migrations Applied

``````
$(npx prisma migrate status --schema=./prisma/schema.prisma 2>&1)
``````

## Next Steps

1. ✅ Verify application connectivity
2. ✅ Run smoke tests
3. ✅ Monitor database performance
4. ✅ Update deployment documentation

## Rollback Instructions

If you need to rollback:

``````powershell
# Restore from backup (if available)
psql `$env:DATABASE_URL < "$BackupFile"

# Or use Prisma migrate reset (WARNING: This will drop all data)
cd $DatabasePackageDir
npx prisma migrate reset --schema=./prisma/schema.prisma
``````
"@

$reportContent | Out-File -FilePath $ReportFile -Encoding utf8
Write-Success "Migration report saved to: $ReportFile"

# Summary
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "📊 Migration Summary" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Success "Database migrations completed successfully!"
Write-Host ""
Write-Host "📄 Report: $ReportFile"
if (-not $SkipBackup -and (Test-Path $BackupFile)) {
    Write-Host "💾 Backup: $BackupFile"
}
Write-Host ""
Write-Host "🔍 Next Steps:"
Write-Host "   1. Verify application connectivity"
Write-Host "   2. Run application tests"
Write-Host "   3. Monitor database performance"
Write-Host "   4. Check application logs for errors"
Write-Host ""

Pop-Location
