# AUTO-AGENT: Database Migration Status Check
# Verifies if all Prisma schema changes have been applied to the database

Write-Host "AUTO-AGENT: Checking Database Migration Status..." -ForegroundColor Cyan
Write-Host "============================================================"

# Navigate to database package
$databasePath = "packages/database"
if (-not (Test-Path $databasePath)) {
    Write-Host "ERROR: Database package not found: $databasePath" -ForegroundColor Red
    exit 1
}

$originalLocation = Get-Location
Set-Location $databasePath

try {
    $currentPath = Get-Location
    Write-Host "Database Package: $databasePath" -ForegroundColor Green
    Write-Host "Current Directory: $currentPath" -ForegroundColor Gray
    
    $schemaPath = "prisma\schema.prisma"
    if (-not (Test-Path $schemaPath)) {
        Write-Host "ERROR: Schema file not found: $schemaPath" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "Schema File: $schemaPath" -ForegroundColor Green
    
    # Count models and enums in schema
    $schemaContent = Get-Content $schemaPath -Raw -ErrorAction Stop
    if ($schemaContent) {
        $modelMatches = [regex]::Matches($schemaContent, "^\s*model\s+\w+", [System.Text.RegularExpressions.RegexOptions]::Multiline)
        $enumMatches = [regex]::Matches($schemaContent, "^\s*enum\s+\w+", [System.Text.RegularExpressions.RegexOptions]::Multiline)
        $modelCount = $modelMatches.Count
        $enumCount = $enumMatches.Count
    } else {
        $modelCount = 0
        $enumCount = 0
    }
    
    Write-Host "Schema Statistics:" -ForegroundColor Cyan
    Write-Host "  - Models: $modelCount" -ForegroundColor White
    Write-Host "  - Enums: $enumCount" -ForegroundColor White
    
    # List migration files
    $migrationsPath = "prisma\migrations"
    if (Test-Path $migrationsPath) {
        $migrations = Get-ChildItem $migrationsPath -Directory | Where-Object { $_.Name -match "^\d{14}_" } | Sort-Object Name
        Write-Host "  - Migration Files: $($migrations.Count)" -ForegroundColor White
    } else {
        $migrations = @()
        Write-Host "  - Migration Files: 0 (migrations directory not found)" -ForegroundColor Yellow
    }
    Write-Host ""
    
    # Check if DATABASE_URL is set
    if (-not $env:DATABASE_URL) {
        Write-Host "WARNING: DATABASE_URL not set - Cannot check database status" -ForegroundColor Yellow
        Write-Host ""
        if ($migrations.Count -gt 0) {
            Write-Host "Migration Files Found:" -ForegroundColor Cyan
            foreach ($migration in $migrations) {
                Write-Host "  - $($migration.Name)" -ForegroundColor Green
            }
            Write-Host ""
        }
        Write-Host "To check database status, set DATABASE_URL:" -ForegroundColor Yellow
        Write-Host "  `$env:DATABASE_URL = 'postgresql://user:pass@host:5432/dbname'" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "To apply migrations automatically:" -ForegroundColor Yellow
        Write-Host "  powershell -File scripts/apply-db-migrations.ps1" -ForegroundColor Cyan
        exit 0
    }
    
    Write-Host "============================================================"
    Write-Host "Checking Migration Status Against Database..." -ForegroundColor Yellow
    Write-Host "============================================================"
    
    $statusOutput = npx prisma migrate status --schema=./prisma/schema.prisma 2>&1 | Out-String
    Write-Host $statusOutput
    
    Write-Host "============================================================"
    
    # Check if there are pending migrations
    if ($statusOutput -match "following migrations have not yet been applied" -or 
        $statusOutput -match "migrations are pending" -or
        $statusOutput -match "Database schema is not in sync") {
        Write-Host "WARNING: PENDING MIGRATIONS DETECTED" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "AUTO-APPLYING MIGRATIONS..." -ForegroundColor Cyan
        Write-Host ""
        
        # Auto-apply
        $applyScript = "..\..\scripts\apply-db-migrations.ps1"
        if (Test-Path $applyScript) {
            & $applyScript
        } else {
            Write-Host "Run: powershell -File scripts/apply-db-migrations.ps1" -ForegroundColor Cyan
        }
        exit 1
    } elseif ($statusOutput -match "Database schema is up to date" -or 
              $statusOutput -match "All migrations have been applied") {
        Write-Host "SUCCESS: ALL MIGRATIONS APPLIED - DATABASE IS SYNCHRONIZED" -ForegroundColor Green
        Write-Host ""
        Write-Host "Final Status:" -ForegroundColor Cyan
        Write-Host "  - Schema is in sync with database" -ForegroundColor Green
        Write-Host "  - All migrations applied" -ForegroundColor Green
        Write-Host "  - Database ready for use" -ForegroundColor Green
        exit 0
    } else {
        Write-Host "WARNING: Could not determine migration status" -ForegroundColor Yellow
        Write-Host "Check the output above for details" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "ERROR: Error checking migration status:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    if ($_.ScriptStackTrace) {
        Write-Host $_.ScriptStackTrace -ForegroundColor Red
    }
    exit 1
} finally {
    Set-Location $originalLocation
}
