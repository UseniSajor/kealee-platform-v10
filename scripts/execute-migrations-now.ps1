# IMMEDIATE MIGRATION EXECUTION SCRIPT
# This script will execute migrations when DATABASE_URL is available

param(
    [string]$DatabaseUrl = $env:DATABASE_URL
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "EXECUTING DATABASE MIGRATIONS NOW" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if (-not $DatabaseUrl) {
    Write-Host "ERROR: DATABASE_URL not provided" -ForegroundColor Red
    Write-Host ""
    Write-Host "Usage:" -ForegroundColor Yellow
    Write-Host "  powershell -File scripts/execute-migrations-now.ps1 -DatabaseUrl 'postgresql://...'" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Or set environment variable:" -ForegroundColor Yellow
    Write-Host "  `$env:DATABASE_URL = 'postgresql://...'" -ForegroundColor Cyan
    Write-Host "  powershell -File scripts/execute-migrations-now.ps1" -ForegroundColor Cyan
    exit 1
}

$env:DATABASE_URL = $DatabaseUrl

Push-Location "packages/database"

try {
    Write-Host "Step 1: Validating schema..." -ForegroundColor Yellow
    npx prisma validate --schema=./prisma/schema.prisma
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Schema validation failed!" -ForegroundColor Red
        exit 1
    }
    Write-Host "✓ Schema is valid" -ForegroundColor Green
    Write-Host ""

    Write-Host "Step 2: Generating Prisma Client..." -ForegroundColor Yellow
    npx prisma generate --schema=./prisma/schema.prisma
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Client generation failed!" -ForegroundColor Red
        exit 1
    }
    Write-Host "✓ Prisma Client generated" -ForegroundColor Green
    Write-Host ""

    Write-Host "Step 3: Checking migration status..." -ForegroundColor Yellow
    $status = npx prisma migrate status --schema=./prisma/schema.prisma 2>&1
    Write-Host $status
    Write-Host ""

    Write-Host "Step 4: APPLYING MIGRATIONS..." -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    npx prisma migrate deploy --schema=./prisma/schema.prisma
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Migration deployment failed!" -ForegroundColor Red
        exit 1
    }
    Write-Host ""

    Write-Host "Step 5: Verifying schema sync..." -ForegroundColor Yellow
    $finalStatus = npx prisma migrate status --schema=./prisma/schema.prisma 2>&1
    Write-Host $finalStatus
    Write-Host ""

    Write-Host "========================================" -ForegroundColor Green
    Write-Host "✅ MIGRATIONS EXECUTED SUCCESSFULLY" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green

} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
} finally {
    Pop-Location
}




