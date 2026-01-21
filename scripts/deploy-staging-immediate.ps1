# Immediate Staging Deployment Script
# Handles Vercel login and Railway linking

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "STAGING DEPLOYMENT - IMMEDIATE" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Check Vercel login
Write-Host "Checking Vercel login..." -ForegroundColor Yellow
try {
    $vercelUser = vercel whoami 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ Vercel: $vercelUser" -ForegroundColor Green
    }
} catch {
    Write-Host "  ❌ Vercel not logged in" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please run: vercel login" -ForegroundColor Yellow
    Write-Host "Then run this script again." -ForegroundColor Yellow
    exit 1
}

# Check Railway login
Write-Host "Checking Railway login..." -ForegroundColor Yellow
try {
    $railwayUser = railway whoami 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ Railway: $railwayUser" -ForegroundColor Green
    }
} catch {
    Write-Host "  ❌ Railway not logged in" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please run: railway login" -ForegroundColor Yellow
    Write-Host "Then run this script again." -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "DEPLOYING TO VERCEL" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

$vercelApps = @(
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

foreach ($app in $vercelApps) {
    Write-Host "Deploying $app..." -ForegroundColor Yellow
    
    if (-not (Test-Path "apps/$app")) {
        Write-Host "  ⚠️  Directory not found" -ForegroundColor Yellow
        $failed++
        continue
    }
    
    try {
        Push-Location "apps/$app"
        
        # Try to deploy (Vercel will handle linking if needed)
        $output = vercel deploy --yes 2>&1 | Out-String
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✅ $app deployed" -ForegroundColor Green
            $deployed++
        } else {
            Write-Host "  ❌ $app failed" -ForegroundColor Red
            Write-Host "  Output: $($output -split "`n" | Select-Object -First 3)" -ForegroundColor Gray
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
Write-Host "Deploying API service..." -ForegroundColor Yellow
try {
    Push-Location "services/api"
    
    # Check if linked, if not, try to link
    railway status 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  Linking API service..." -ForegroundColor Gray
        railway link 2>&1 | Out-Null
    }
    
    $output = railway up 2>&1 | Out-String
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ API service deployed" -ForegroundColor Green
    } else {
        Write-Host "  ❌ API service failed" -ForegroundColor Red
        Write-Host "  Output: $($output -split "`n" | Select-Object -First 3)" -ForegroundColor Gray
    }
    
    Pop-Location
} catch {
    Write-Host "  ❌ Error: $_" -ForegroundColor Red
    Pop-Location
}

Write-Host ""

# Deploy Worker service
Write-Host "Deploying Worker service..." -ForegroundColor Yellow
try {
    Push-Location "services/worker"
    
    # Check if linked, if not, try to link
    railway status 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  Linking Worker service..." -ForegroundColor Gray
        railway link 2>&1 | Out-Null
    }
    
    $output = railway up 2>&1 | Out-String
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ Worker service deployed" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Worker service failed" -ForegroundColor Red
        Write-Host "  Output: $($output -split "`n" | Select-Object -First 3)" -ForegroundColor Gray
    }
    
    Pop-Location
} catch {
    Write-Host "  ❌ Error: $_" -ForegroundColor Red
    Pop-Location
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host "DEPLOYMENT SUMMARY" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Vercel: $deployed deployed, $failed failed" -ForegroundColor Cyan
Write-Host ""
Write-Host "Check status:" -ForegroundColor Yellow
Write-Host "  Vercel: https://vercel.com/dashboard" -ForegroundColor Gray
Write-Host "  Railway: https://railway.app" -ForegroundColor Gray
Write-Host ""

