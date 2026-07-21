# Vercel Deployment Script for Marketplace App
# Run this script from the project root: .\apps\m-marketplace\deploy.ps1

Write-Host "🚀 Kealee Marketplace - Vercel Deployment Script" -ForegroundColor Cyan
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
    } else {
        Write-Host "⚠️  Not logged in. Please run: vercel login" -ForegroundColor Yellow
        Write-Host ""
        $login = Read-Host "Would you like to login now? (y/n)"
        if ($login -eq "y" -or $login -eq "Y") {
            Write-Host "Opening browser for login..." -ForegroundColor Cyan
            vercel login
            if ($LASTEXITCODE -ne 0) {
                Write-Host "❌ Login failed" -ForegroundColor Red
                exit 1
            }
        } else {
            Write-Host "⚠️  Skipping login. Please run 'vercel login' manually before deploying." -ForegroundColor Yellow
            exit 1
        }
    }
} catch {
    Write-Host "⚠️  Authentication check failed. Please run: vercel login" -ForegroundColor Yellow
    $login = Read-Host "Would you like to login now? (y/n)"
    if ($login -eq "y" -or $login -eq "Y") {
        vercel login
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Login failed" -ForegroundColor Red
            exit 1
        }
    } else {
        exit 1
    }
}

Write-Host ""

# Build locally first to catch any errors
Write-Host "🔨 Building locally to verify..." -ForegroundColor Yellow
pnpm build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Local build failed. Please fix errors before deploying." -ForegroundColor Red
    exit 1
}
Write-Host "✅ Local build successful" -ForegroundColor Green
Write-Host ""

# Confirm deployment
Write-Host "📦 Ready to deploy to Vercel production" -ForegroundColor Cyan
Write-Host ""
$confirm = Read-Host "Deploy to production? (y/n)"
if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Host "Deployment cancelled." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "🚀 Deploying to Vercel production..." -ForegroundColor Cyan
Write-Host ""

# Deploy to production
vercel --prod --yes

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Deployment successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Next Steps:" -ForegroundColor Cyan
    Write-Host "1. Go to Vercel Dashboard: https://vercel.com/dashboard" -ForegroundColor White
    Write-Host "2. Select your project" -ForegroundColor White
    Write-Host "3. Go to Settings → Domains" -ForegroundColor White
    Write-Host "4. Add domains: kealee.com and www.kealee.com" -ForegroundColor White
    Write-Host "5. Configure DNS in NameBright with the values Vercel provides" -ForegroundColor White
    Write-Host ""
    Write-Host "📖 For detailed instructions, see: VERCEL_DEPLOY_STEPS.md" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "❌ Deployment failed. Check the error messages above." -ForegroundColor Red
    exit 1
}
