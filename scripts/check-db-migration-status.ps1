# Check Database Migration Status
# Verifies if all Prisma schema changes have been applied to the database

Write-Host "🔍 Checking Database Migration Status..." -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if DATABASE_URL is set
if (-not $env:DATABASE_URL) {
    Write-Host "⚠️  DATABASE_URL environment variable not set" -ForegroundColor Yellow
    Write-Host "💡 Set DATABASE_URL to check migration status" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "For local dev:"
    Write-Host "  Set DATABASE_URL in packages/database/.env"
    Write-Host ""
    Write-Host "For production:"
    Write-Host "  Set DATABASE_URL in Railway/Railway dashboard"
    exit 1
}

# Navigate to database package
$databasePath = "packages/database"
if (-not (Test-Path $databasePath)) {
    Write-Host "❌ Database package not found: $databasePath" -ForegroundColor Red
    exit 1
}

Push-Location $databasePath

try {
    Write-Host "📦 Database Package: $databasePath" -ForegroundColor Green
    Write-Host ""
    
    # Check migration status
    Write-Host "📊 Checking Migration Status..." -ForegroundColor Yellow
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    $statusOutput = npx prisma migrate status --schema=./prisma/schema.prisma 2>&1
    Write-Host $statusOutput
    
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # Check if there are pending migrations
    if ($statusOutput -match "following migrations have not yet been applied" -or 
        $statusOutput -match "migrations are pending" -or
        $statusOutput -match "Database schema is not in sync") {
        Write-Host "⚠️  PENDING MIGRATIONS DETECTED" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "💡 To apply pending migrations:" -ForegroundColor Yellow
        Write-Host "   Development: pnpm db:migrate" -ForegroundColor Cyan
        Write-Host "   Production:  pnpm db:migrate:deploy" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "   Or from root:" -ForegroundColor Yellow
        Write-Host "   cd packages/database" -ForegroundColor Cyan
        Write-Host "   pnpm prisma migrate deploy" -ForegroundColor Cyan
        exit 1
    } elseif ($statusOutput -match "Database schema is up to date" -or 
              $statusOutput -match "All migrations have been applied") {
        Write-Host "✅ All migrations have been applied!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📋 Migration Summary:" -ForegroundColor Cyan
        Write-Host "  - Schema is in sync with database" -ForegroundColor Green
        Write-Host "  - All migrations applied" -ForegroundColor Green
        exit 0
    } else {
        Write-Host "⚠️  Could not determine migration status" -ForegroundColor Yellow
        Write-Host "💡 Check the output above for details" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "❌ Error checking migration status:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
} finally {
    Pop-Location
}

