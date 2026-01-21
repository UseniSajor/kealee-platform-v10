# Deploy to Staging - Vercel and Railway
# Quick deployment script for staging environment

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "DEPLOYING TO STAGING" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Check Vercel CLI
if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Vercel CLI not found. Install with: npm i -g vercel" -ForegroundColor Red
    exit 1
}

# Check Railway CLI
if (-not (Get-Command railway -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Railway CLI not found. Install with: npm i -g @railway/cli" -ForegroundColor Red
    exit 1
}

Write-Host "✅ CLI tools ready" -ForegroundColor Green
Write-Host ""

# Apps to deploy to Vercel
$vercelApps = @(
    "m-marketplace",
    "m-ops-services",
    "m-project-owner",
    "m-permits-inspections",
    "m-architect",
    "os-admin",
    "os-pm"
)

# Deploy to Vercel (Preview/Staging)
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "DEPLOYING TO VERCEL (Preview/Staging)" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""

foreach ($app in $vercelApps) {
    Write-Host "📦 Deploying $app..." -ForegroundColor Cyan
    
    try {
        Push-Location "apps/$app"
        
        # Deploy to preview (staging)
        $result = vercel deploy --prebuilt --yes 2>&1 | Out-String
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✅ $app deployed successfully" -ForegroundColor Green
        } else {
            Write-Host "  ⚠️  $app deployment had issues (check logs)" -ForegroundColor Yellow
            Write-Host "  Output: $result" -ForegroundColor Gray
        }
        
        Pop-Location
    } catch {
        Write-Host "  ❌ Failed to deploy $app : $_" -ForegroundColor Red
        Pop-Location
    }
    
    Write-Host ""
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "DEPLOYING TO RAILWAY (Staging)" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""

# Deploy API service to Railway
Write-Host "📦 Deploying API service..." -ForegroundColor Cyan
try {
    Push-Location "services/api"
    railway up --service api 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ API service deployed successfully" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  API service deployment had issues" -ForegroundColor Yellow
    }
    Pop-Location
} catch {
    Write-Host "  ❌ Failed to deploy API service: $_" -ForegroundColor Red
    Pop-Location
}

Write-Host ""

# Deploy Worker service to Railway
Write-Host "📦 Deploying Worker service..." -ForegroundColor Cyan
try {
    Push-Location "services/worker"
    railway up --service worker 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ Worker service deployed successfully" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  Worker service deployment had issues" -ForegroundColor Yellow
    }
    Pop-Location
} catch {
    Write-Host "  ❌ Failed to deploy Worker service: $_" -ForegroundColor Red
    Pop-Location
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host "✅ STAGING DEPLOYMENT COMPLETE" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Vercel deployments:" -ForegroundColor Cyan
Write-Host "  Check status at: https://vercel.com/ottoway-5abe7e76" -ForegroundColor Gray
Write-Host ""
Write-Host "Railway deployments:" -ForegroundColor Cyan
Write-Host "  Check status at: https://railway.app" -ForegroundColor Gray
Write-Host ""

