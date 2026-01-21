# One-Click Deploy Script for Kealee Platform (PowerShell)
# Usage: .\scripts\deploy.ps1 [staging|production|promote]

param(
    [Parameter(Position=0)]
    [ValidateSet("staging", "production", "promote")]
    [string]$Environment = "staging"
)

Write-Host "🚀 Kealee Platform Deployment" -ForegroundColor Blue
Write-Host "============================" -ForegroundColor Blue
Write-Host ""

# Check if Railway CLI is installed
try {
    railway --version | Out-Null
} catch {
    Write-Host "⚠️  Railway CLI not found. Installing..." -ForegroundColor Yellow
    npm install -g @railway/cli
}

# Check if logged in
try {
    railway whoami | Out-Null
} catch {
    Write-Host "⚠️  Not logged into Railway. Please login:" -ForegroundColor Yellow
    railway login
}

switch ($Environment) {
    "staging" {
        Write-Host "📦 Deploying to STAGING..." -ForegroundColor Green
        railway up --service api-staging --detach
        Write-Host "✅ Staging deployment initiated" -ForegroundColor Green
    }
    "production" {
        Write-Host "🚨 Deploying to PRODUCTION..." -ForegroundColor Red
        $confirm = Read-Host "Are you sure you want to deploy to production? (yes/no)"
        if ($confirm -ne "yes") {
            Write-Host "❌ Deployment cancelled" -ForegroundColor Yellow
            exit 1
        }
        railway up --service api-production --detach
        Write-Host "✅ Production deployment initiated" -ForegroundColor Green
    }
    "promote" {
        Write-Host "⬆️  Promoting STAGING to PRODUCTION..." -ForegroundColor Green
        $confirm = Read-Host "This will promote the latest staging deployment to production. Continue? (yes/no)"
        if ($confirm -ne "yes") {
            Write-Host "❌ Promotion cancelled" -ForegroundColor Yellow
            exit 1
        }
        railway promote --service api-production --from api-staging
        Write-Host "✅ Promotion completed" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "📊 Check deployment status:" -ForegroundColor Blue
Write-Host "railway status --service api-$Environment" -ForegroundColor Gray


