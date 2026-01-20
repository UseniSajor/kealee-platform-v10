# scripts/health-check.ps1
# Comprehensive health check for all services (PowerShell)

Write-Host "🏥 Comprehensive Health Check" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

# Service Status
Write-Host "📦 Service Status" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

# PostgreSQL
Write-Host "[HEALTH] Checking PostgreSQL..." -ForegroundColor Cyan
$psqlPath = Get-Command psql -ErrorAction SilentlyContinue
if ($psqlPath) {
    try {
        $result = & psql $env:DATABASE_URL -c "SELECT 1;" 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ PostgreSQL: Running" -ForegroundColor Green
        } else {
            Write-Host "❌ PostgreSQL: Not running" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ PostgreSQL: Not running" -ForegroundColor Red
    }
} else {
    Write-Host "⚠️  PostgreSQL: Client not installed" -ForegroundColor Yellow
}

# Redis
Write-Host "[HEALTH] Checking Redis..." -ForegroundColor Cyan
$redisPath = Get-Command redis-cli -ErrorAction SilentlyContinue
if ($redisPath) {
    try {
        $result = & redis-cli ping 2>&1
        if ($result -eq "PONG") {
            Write-Host "✅ Redis: Running" -ForegroundColor Green
        } else {
            Write-Host "❌ Redis: Not running" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ Redis: Not running" -ForegroundColor Red
    }
} else {
    Write-Host "⚠️  Redis: Client not installed" -ForegroundColor Yellow
}

# API Service
Write-Host "[HEALTH] Checking API Service..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/health" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
    Write-Host "✅ API Service: Running" -ForegroundColor Green
} catch {
    Write-Host "❌ API Service: Not running" -ForegroundColor Red
}

Write-Host ""
Write-Host "💾 Disk Space" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Get-PSDrive -PSProvider FileSystem | ForEach-Object {
    $used = [math]::Round(($_.Used / $_.Used + $_.Free) * 100, 2)
    if ($used -gt 80) {
        Write-Host "⚠️  $($_.Name): ${used}% used" -ForegroundColor Yellow
    } else {
        Write-Host "✅ $($_.Name): ${used}% used" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "🧠 Memory Usage" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
$mem = Get-CimInstance Win32_OperatingSystem
$usedPercent = [math]::Round((($mem.TotalVisibleMemorySize - $mem.FreePhysicalMemory) / $mem.TotalVisibleMemorySize) * 100, 2)
Write-Host "Memory usage: ${usedPercent}%" -ForegroundColor $(if ($usedPercent -gt 80) { "Yellow" } else { "Green" })

Write-Host ""
Write-Host "✅ Health check complete" -ForegroundColor Green
