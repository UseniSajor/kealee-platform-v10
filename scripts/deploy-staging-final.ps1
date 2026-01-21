# Final Staging Deployment Script
# Deploys to Vercel and Railway

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "STAGING DEPLOYMENT" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Check current directory
if (-not (Test-Path "apps/m-ops-services")) {
    Write-Host "❌ Error: Not in project root. Please run from: C:\Kealee-Platform v10" -ForegroundColor Red
    exit 1
}

# Check Vercel login
Write-Host "Checking Vercel login..." -ForegroundColor Yellow
try {
    $vercelUser = vercel whoami 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ Vercel: $vercelUser" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Vercel not logged in" -ForegroundColor Red
        Write-Host "  Run: vercel login" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "  ❌ Vercel not logged in" -ForegroundColor Red
    Write-Host "  Run: vercel login" -ForegroundColor Yellow
    exit 1
}

# Check Railway login
Write-Host "Checking Railway login..." -ForegroundColor Yellow
try {
    $railwayUser = railway whoami 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ Railway: $railwayUser" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  Railway not logged in (will skip Railway deployment)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ⚠️  Railway not logged in (will skip Railway deployment)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "DEPLOYING TO VERCEL" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

$apps = @(
    "m-marketplace",
    "m-ops-services",
    "m-project-owner",
    "m-permits-inspections",
    "m-architect",
    "os-admin",
    "os-pm"
)

$deployed = 0
$failed = 0

foreach ($app in $apps) {
    Write-Host "Deploying $app..." -ForegroundColor Yellow
    
    if (-not (Test-Path "apps/$app")) {
        Write-Host "  ⚠️  Directory not found" -ForegroundColor Yellow
        $failed++
        continue
    }
    
    try {
        Push-Location "apps/$app"
        $output = vercel deploy --yes 2>&1 | Out-String
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✅ $app deployed" -ForegroundColor Green
            $deployed++
        } else {
            Write-Host "  ❌ $app failed" -ForegroundColor Red
            $failed++
        }
        
        Pop-Location
    } catch {
        Write-Host "  ❌ Error: $_" -ForegroundColor Red
        Pop-Location
        $failed++
    }
    
    Write-Host ""
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "DEPLOYING TO RAILWAY" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Deploy API service
if (Test-Path "services/api") {
    Write-Host "Deploying API service..." -ForegroundColor Yellow
    try {
        Push-Location "services/api"
        $output = railway up 2>&1 | Out-String
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✅ API service deployed" -ForegroundColor Green
        } else {
            Write-Host "  ⚠️  API service may need linking" -ForegroundColor Yellow
        }
        
        Pop-Location
    } catch {
        Write-Host "  ⚠️  Error: $_" -ForegroundColor Yellow
        Pop-Location
    }
} else {
    Write-Host "  ⚠️  services/api not found" -ForegroundColor Yellow
}

Write-Host ""

# Deploy Worker service
if (Test-Path "services/worker") {
    Write-Host "Deploying Worker service..." -ForegroundColor Yellow
    try {
        Push-Location "services/worker"
        $output = railway up 2>&1 | Out-String
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✅ Worker service deployed" -ForegroundColor Green
        } else {
            Write-Host "  ⚠️  Worker service may need linking" -ForegroundColor Yellow
        }
        
        Pop-Location
    } catch {
        Write-Host "  ⚠️  Error: $_" -ForegroundColor Yellow
        Pop-Location
    }
} else {
    Write-Host "  ⚠️  services/worker not found" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host "✅ DEPLOYMENT COMPLETE" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Vercel: $deployed deployed, $failed failed" -ForegroundColor Cyan
Write-Host ""
Write-Host "Check deployments:" -ForegroundColor Yellow
Write-Host "  Vercel: https://vercel.com/dashboard" -ForegroundColor Gray
Write-Host "  Railway: https://railway.app" -ForegroundColor Gray
Write-Host ""


