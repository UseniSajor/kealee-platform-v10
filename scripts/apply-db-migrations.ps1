# Auto-Apply Database Migrations
# Executes all pending migrations automatically

param(
    [string]$Environment = "dev",
    [switch]$Force = $false
)

Write-Host "🚀 AUTO-AGENT: Applying Database Migrations" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

$databasePath = "packages/database"
if (-not (Test-Path $databasePath)) {
    Write-Host "❌ Database package not found" -ForegroundColor Red
    exit 1
}

Push-Location $databasePath

try {
    # Check DATABASE_URL
    if (-not $env:DATABASE_URL) {
        Write-Host "⚠️  DATABASE_URL not set" -ForegroundColor Yellow
        Write-Host "💡 Set DATABASE_URL environment variable to apply migrations" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Example:" -ForegroundColor Cyan
        Write-Host "  `$env:DATABASE_URL = 'postgresql://user:pass@host:5432/dbname'" -ForegroundColor Cyan
        exit 1
    }

    Write-Host "📊 Checking migration status..." -ForegroundColor Yellow
    $statusOutput = npx prisma migrate status --schema=./prisma/schema.prisma 2>&1
    Write-Host $statusOutput
    Write-Host ""

    # Check if migrations are pending
    if ($statusOutput -match "following migrations have not yet been applied" -or 
        $statusOutput -match "migrations are pending" -or
        $statusOutput -match "Database schema is not in sync") {
        
        Write-Host "🔄 Pending migrations detected - Applying now..." -ForegroundColor Yellow
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        
        if ($Environment -eq "prod" -or $Environment -eq "production") {
            Write-Host "📦 Applying migrations (PRODUCTION MODE)..." -ForegroundColor Red
            $result = npx prisma migrate deploy --schema=./prisma/schema.prisma 2>&1
        } else {
            Write-Host "📦 Applying migrations (DEVELOPMENT MODE)..." -ForegroundColor Green
            $result = npx prisma migrate dev --schema=./prisma/schema.prisma --name="auto_migration_$(Get-Date -Format 'yyyyMMdd_HHmmss')" 2>&1
        }
        
        Write-Host $result
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "✅ Migrations applied successfully!" -ForegroundColor Green
        } else {
            Write-Host ""
            Write-Host "❌ Migration failed" -ForegroundColor Red
            exit 1
        }
    } elseif ($statusOutput -match "Database schema is up to date" -or 
              $statusOutput -match "All migrations have been applied") {
        Write-Host "✅ All migrations already applied!" -ForegroundColor Green
    } else {
        # Try db push if schema is out of sync
        Write-Host "🔄 Schema may be out of sync - Attempting db push..." -ForegroundColor Yellow
        $pushResult = npx prisma db push --schema=./prisma/schema.prisma --accept-data-loss 2>&1
        Write-Host $pushResult
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Schema synchronized!" -ForegroundColor Green
        } else {
            Write-Host "❌ Schema sync failed" -ForegroundColor Red
            exit 1
        }
    }
    
    # Final verification
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    Write-Host "✅ VERIFICATION: Checking final status..." -ForegroundColor Cyan
    $finalStatus = npx prisma migrate status --schema=./prisma/schema.prisma 2>&1
    Write-Host $finalStatus
    
    if ($finalStatus -match "Database schema is up to date" -or 
        $finalStatus -match "All migrations have been applied") {
        Write-Host ""
        Write-Host "✅✅✅ TASK COMPLETE - Database is fully synchronized ✅✅✅" -ForegroundColor Green
        exit 0
    } else {
        Write-Host ""
        Write-Host "⚠️  Schema may still need attention" -ForegroundColor Yellow
        exit 1
    }
    
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
} finally {
    Pop-Location
}

