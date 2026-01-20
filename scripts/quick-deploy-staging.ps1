# scripts/quick-deploy-staging.ps1
# Quick staging deployment with token support

$ErrorActionPreference = "Continue"

# Check for Vercel token
if ($env:VERCEL_TOKEN) {
    Write-Host "✅ Using Vercel token from environment" -ForegroundColor Green
} else {
    Write-Host "⚠️  No VERCEL_TOKEN found. Attempting login..." -ForegroundColor Yellow
    vercel login
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Vercel login failed" -ForegroundColor Red
        exit 1
    }
}

# Applications to deploy
$apps = @(
    "apps/m-marketplace",
    "apps/os-admin",
    "apps/os-pm",
    "apps/m-ops-services",
    "apps/m-project-owner",
    "apps/m-architect",
    "apps/m-permits-inspections"
)

Write-Host "🚀 Quick Staging Deployment" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

$deployed = 0
$failed = 0

foreach ($app in $apps) {
    if (-not (Test-Path $app)) {
        Write-Host "⏭️  Skipping: $app (not found)" -ForegroundColor Yellow
        continue
    }
    
    $appName = Split-Path $app -Leaf
    Write-Host "[DEPLOY] $appName..." -ForegroundColor Cyan
    
    Push-Location $app
    
    try {
        # Build
        Write-Host "  Building..." -ForegroundColor Gray
        pnpm build 2>&1 | Out-Null
        if ($LASTEXITCODE -ne 0) {
            Write-Host "  ❌ Build failed" -ForegroundColor Red
            $failed++
            Pop-Location
            continue
        }
        
        # Deploy
        Write-Host "  Deploying..." -ForegroundColor Gray
        $deployOutput = vercel --yes --prod=false 2>&1 | Out-String
        
        if ($LASTEXITCODE -eq 0) {
            if ($deployOutput -match 'https://[^\s]*\.vercel\.app') {
                Write-Host "  ✅ Deployed: $($matches[0])" -ForegroundColor Green
            } else {
                Write-Host "  ✅ Deployed successfully" -ForegroundColor Green
            }
            $deployed++
        } else {
            Write-Host "  ❌ Deployment failed" -ForegroundColor Red
            $failed++
        }
    } catch {
        Write-Host "  ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
        $failed++
    }
    
    Pop-Location
    Write-Host ""
}

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "Summary: $deployed deployed, $failed failed" -ForegroundColor Cyan
Write-Host ""
