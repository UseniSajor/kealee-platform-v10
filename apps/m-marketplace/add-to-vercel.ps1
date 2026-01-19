# Add Marketplace App to Vercel
# This script will guide you through adding the marketplace app to Vercel

Write-Host "🚀 Adding Marketplace App to Vercel" -ForegroundColor Cyan
Write-Host ""

# Check if Vercel CLI is installed
Write-Host "Checking Vercel CLI..." -ForegroundColor Yellow
try {
    $vercelVersion = vercel --version 2>&1
    Write-Host "✅ Vercel CLI found: $vercelVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Vercel CLI not found. Installing..." -ForegroundColor Red
    npm install -g vercel
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install Vercel CLI" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Vercel CLI installed" -ForegroundColor Green
}

Write-Host ""

# Navigate to marketplace directory
$marketplaceDir = Join-Path $PSScriptRoot "."
Set-Location $marketplaceDir
Write-Host "📁 Working directory: $marketplaceDir" -ForegroundColor Cyan
Write-Host ""

# Check if logged in
Write-Host "Checking Vercel authentication..." -ForegroundColor Yellow
try {
    vercel whoami 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Already logged in to Vercel" -ForegroundColor Green
        $isLoggedIn = $true
    } else {
        $isLoggedIn = $false
    }
} catch {
    $isLoggedIn = $false
}

if (-not $isLoggedIn) {
    Write-Host "⚠️  Not logged in to Vercel" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "You need to log in to Vercel first." -ForegroundColor White
    Write-Host "This will open your browser for authentication." -ForegroundColor White
    Write-Host ""
    $login = Read-Host "Would you like to login now? (y/n)"
    if ($login -eq "y" -or $login -eq "Y") {
        Write-Host ""
        Write-Host "Opening browser for login..." -ForegroundColor Cyan
        vercel login
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Login failed or cancelled" -ForegroundColor Red
            Write-Host ""
            Write-Host "You can login manually later with: vercel login" -ForegroundColor Yellow
            exit 1
        }
        Write-Host "✅ Login successful" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "⚠️  Skipping login. Please run 'vercel login' manually before deploying." -ForegroundColor Yellow
        Write-Host ""
        Write-Host "To continue later:" -ForegroundColor White
        Write-Host "  1. Run: vercel login" -ForegroundColor Cyan
        Write-Host "  2. Run this script again or: vercel --prod" -ForegroundColor Cyan
        exit 0
    }
}

Write-Host ""

# Check if .vercel directory exists (project already linked)
if (Test-Path ".vercel") {
    Write-Host "📦 Project is already linked to Vercel" -ForegroundColor Green
    Write-Host ""
    $redeploy = Read-Host "Would you like to deploy to production? (y/n)"
    if ($redeploy -eq "y" -or $redeploy -eq "Y") {
        Write-Host ""
        Write-Host "🚀 Deploying to production..." -ForegroundColor Cyan
        vercel --prod --yes
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "✅ Deployment successful!" -ForegroundColor Green
        } else {
            Write-Host ""
            Write-Host "❌ Deployment failed" -ForegroundColor Red
            exit 1
        }
    }
} else {
    Write-Host "📦 Setting up new Vercel project..." -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Configuration:" -ForegroundColor White
    Write-Host "  Project Name: kealee-marketplace" -ForegroundColor Gray
    Write-Host "  Root Directory: apps/m-marketplace" -ForegroundColor Gray
    Write-Host "  Framework: Next.js" -ForegroundColor Gray
    Write-Host ""
    
    $deploy = Read-Host "Ready to create project and deploy? (y/n)"
    if ($deploy -ne "y" -and $deploy -ne "Y") {
        Write-Host "Deployment cancelled." -ForegroundColor Yellow
        exit 0
    }

    Write-Host ""
    Write-Host "🚀 Creating project and deploying..." -ForegroundColor Cyan
    Write-Host ""
    Write-Host "When prompted:" -ForegroundColor Yellow
    Write-Host "  - Link to existing project? → No (create new)" -ForegroundColor Gray
    Write-Host "  - Project name: kealee-marketplace" -ForegroundColor Gray
    Write-Host "  - Directory: apps/m-marketplace (or confirm auto-detected)" -ForegroundColor Gray
    Write-Host "  - Override settings? → No (vercel.json is configured)" -ForegroundColor Gray
    Write-Host ""

    # Deploy (will create project on first deploy)
    vercel

    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Project created and deployed!" -ForegroundColor Green
        Write-Host ""
        
        $prodDeploy = Read-Host "Would you like to deploy to production now? (y/n)"
        if ($prodDeploy -eq "y" -or $prodDeploy -eq "Y") {
            Write-Host ""
            Write-Host "🚀 Deploying to production..." -ForegroundColor Cyan
            vercel --prod --yes
            if ($LASTEXITCODE -eq 0) {
                Write-Host ""
                Write-Host "✅ Production deployment successful!" -ForegroundColor Green
            }
        }
        
        Write-Host ""
        Write-Host "📋 Next Steps:" -ForegroundColor Cyan
        Write-Host "1. Go to Vercel Dashboard: https://vercel.com/dashboard" -ForegroundColor White
        Write-Host "2. Select 'kealee-marketplace' project" -ForegroundColor White
        Write-Host "3. Go to Settings → Domains" -ForegroundColor White
        Write-Host "4. Add domains: kealee.com and www.kealee.com" -ForegroundColor White
        Write-Host "5. Configure DNS in NameBright" -ForegroundColor White
        Write-Host ""
        Write-Host "📖 See VERCEL_DEPLOY_STEPS.md for detailed domain setup instructions" -ForegroundColor Cyan
    } else {
        Write-Host ""
        Write-Host "❌ Deployment failed. Check the error messages above." -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "✨ Done!" -ForegroundColor Green
