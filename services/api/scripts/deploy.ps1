# PowerShell Deployment Script for API

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "🚀 Deploying API to production..." -ForegroundColor Cyan
Write-Host ""

# Build
Write-Host "📦 Building..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

# Run migrations
Write-Host "🗄️  Running database migrations..." -ForegroundColor Yellow
Set-Location ..\database
pnpm prisma migrate deploy
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Migration failed!" -ForegroundColor Red
    exit 1
}
Set-Location ..\api

# Seed production data (optional - uncomment if needed)
# Write-Host "🌱 Seeding production data..." -ForegroundColor Yellow
# npm run db:seed

# Restart service (Railway handles this automatically)
Write-Host ""
Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Verify health endpoint: curl https://api.kealee.com/health" -ForegroundColor White
Write-Host "  2. Check logs: railway logs" -ForegroundColor White
Write-Host "  3. Monitor: railway status" -ForegroundColor White
Write-Host ""




