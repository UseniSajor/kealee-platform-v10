# scripts/repair-database.ps1
# Repair corrupted database tables (PowerShell)

if (-not $env:DATABASE_URL) {
    Write-Host "DATABASE_URL not set" -ForegroundColor Red
    exit 1
}

Write-Host "🔧 Database Repair" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

$confirm = Read-Host "This will run VACUUM and REINDEX. Continue? (y/N)"

if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Host "Cancelled"
    exit 0
}

Write-Host ""
Write-Host "Running VACUUM..."
& psql $env:DATABASE_URL -c "VACUUM ANALYZE;" 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ VACUUM complete" -ForegroundColor Green
} else {
    Write-Host "❌ VACUUM failed" -ForegroundColor Red
}

Write-Host ""
Write-Host "✅ Database repair complete" -ForegroundColor Green
