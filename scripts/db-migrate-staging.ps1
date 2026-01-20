# scripts/db-migrate-staging.ps1
# Run database migrations on staging (PowerShell version)

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

# Safety check (less strict than production)
Write-Host "🔧 STAGING DATABASE MIGRATION" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Warn "⚠️  This will run migrations on STAGING database"
Write-Host ""
Write-Host "Before proceeding, ensure:"
Write-Host "  ✅ Migrations tested locally"
Write-Host "  ✅ Staging database backup created (recommended)"
Write-Host ""

$confirm = Read-Host "Continue with staging migration? (type 'yes' to confirm)"
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

Log-Migrate "Running staging migrations..."
try {
    npx prisma migrate deploy --schema=./prisma/schema.prisma
    Write-Success "Staging migrations completed successfully"
    
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
    Write-Host "✅ Staging migrations completed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Next Steps:"
    Write-Host "   1. Verify application connectivity"
    Write-Host "   2. Run staging tests"
    Write-Host "   3. Check application logs"
} catch {
    Write-Fail "Staging migrations failed"
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
