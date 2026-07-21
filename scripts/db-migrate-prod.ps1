# scripts/db-migrate-prod.ps1
# Run database migrations on production (PowerShell version)

$ErrorActionPreference = "Stop"

function Log-Migrate {
    param([string]$Message)
    Write-Host "[MIGRATE] $Message" -ForegroundColor Cyan
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

# Safety check
Write-Host "🚨 PRODUCTION DATABASE MIGRATION" -ForegroundColor Red
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Red
Write-Host ""
Write-Warn "⚠️  WARNING: This will run migrations on PRODUCTION database"
Write-Host ""
Write-Host "Before proceeding, ensure:"
Write-Host "  ✅ Database backup created"
Write-Host "  ✅ Migrations tested in staging"
Write-Host "  ✅ All team members notified"
Write-Host "  ✅ Maintenance window scheduled (if needed)"
Write-Host ""

$confirm = Read-Host "Are you sure you want to run migrations on PRODUCTION? (type 'yes' to confirm)"
if ($confirm -ne "yes") {
    Write-Host "Migration cancelled."
    exit 0
}

# Navigate to database package
Push-Location packages/database

# Check if Prisma schema exists
if (-not (Test-Path "prisma/schema.prisma")) {
    Write-Fail "Prisma schema not found: prisma/schema.prisma"
    Pop-Location
    exit 1
}

Log-Migrate "Checking migration status..."
try {
    $migrationStatus = npx prisma migrate status --schema=./prisma/schema.prisma 2>&1
    
    if ($migrationStatus -match "Database schema is up to date") {
        Write-Success "Database schema is already up to date"
        Pop-Location
        exit 0
    }
} catch {
    Write-Warn "Could not check migration status, continuing..."
}

Log-Migrate "Running production migrations..."
try {
    npx prisma migrate deploy --schema=./prisma/schema.prisma
    Write-Success "Production migrations completed successfully"
    
    # Verify
    Log-Migrate "Verifying migration status..."
    $finalStatus = npx prisma migrate status --schema=./prisma/schema.prisma 2>&1
    if ($finalStatus -match "Database schema is up to date") {
        Write-Success "Migration verification passed"
    } else {
        Write-Warn "Migration verification inconclusive"
        Write-Host $finalStatus
    }
    
    Write-Host ""
    Write-Host "✅ Production migrations completed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Next Steps:"
    Write-Host "   1. Verify application connectivity"
    Write-Host "   2. Run smoke tests"
    Write-Host "   3. Monitor database performance"
    Write-Host "   4. Check application logs"
} catch {
    Write-Fail "Production migrations failed"
    Write-Host ""
    Write-Host "🔍 Troubleshooting:"
    Write-Host "   1. Check database connection"
    Write-Host "   2. Review migration files"
    Write-Host "   3. Check database logs"
    Write-Host "   4. Restore from backup if needed"
    Pop-Location
    exit 1
}

Pop-Location
