# scripts/check-services.ps1
# Quick service status check script (PowerShell)

Write-Host "🔍 Service Status Check" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

# PostgreSQL
Write-Host -NoNewline "PostgreSQL: "
$psqlPath = Get-Command psql -ErrorAction SilentlyContinue
if ($psqlPath) {
    try {
        $result = & psql $env:DATABASE_URL -c "SELECT 1;" 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Running" -ForegroundColor Green
        } else {
            Write-Host "❌ Not Running" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ Not Running" -ForegroundColor Red
    }
} else {
    Write-Host "❌ Not Installed" -ForegroundColor Red
}

# Redis
Write-Host -NoNewline "Redis: "
$redisPath = Get-Command redis-cli -ErrorAction SilentlyContinue
if ($redisPath) {
    try {
        $result = & redis-cli ping 2>&1
        if ($result -eq "PONG") {
            Write-Host "✅ Running" -ForegroundColor Green
        } else {
            Write-Host "❌ Not Running" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ Not Running" -ForegroundColor Red
    }
} else {
    Write-Host "❌ Not Installed" -ForegroundColor Red
}

# API Service
Write-Host -NoNewline "API Service: "
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/health" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
    Write-Host "✅ Running" -ForegroundColor Green
} catch {
    Write-Host "❌ Not Running" -ForegroundColor Red
}

# Environment Variables
Write-Host -NoNewline "DATABASE_URL: "
if ($env:DATABASE_URL) {
    Write-Host "✅ Set" -ForegroundColor Green
} else {
    Write-Host "⚠️  Not Set" -ForegroundColor Yellow
}

# Vercel
Write-Host -NoNewline "Vercel CLI: "
$vercelPath = Get-Command vercel -ErrorAction SilentlyContinue
if ($vercelPath) {
    try {
        $user = & vercel whoami 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Logged in as $user" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Not Logged In" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "⚠️  Not Logged In" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ Not Installed" -ForegroundColor Red
}

Write-Host ""
Write-Host "For detailed troubleshooting: .\scripts\troubleshoot.ps1" -ForegroundColor Cyan
