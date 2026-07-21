# scripts/deploy-all.ps1
# PowerShell master deployment script for all Kealee Platform applications

$ErrorActionPreference = "Stop"

function Write-Log {
    param([string]$Message)
    Write-Host "[DEPLOY] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Warn {
    param([string]$Message)
    Write-Host "⚠️ $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

Write-Host "🚀 Kealee Platform - Complete Deployment" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Host ""

# Check prerequisites
Write-Log "Checking prerequisites..."

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Error "Git is not installed"
    exit 1
}

if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
    Write-Warn "Vercel CLI not found. Installing..."
    npm install -g vercel@latest
}

if (-not (Get-Command railway -ErrorAction SilentlyContinue)) {
    Write-Warn "Railway CLI not found. Install from: https://railway.app/cli"
}

Write-Success "Prerequisites checked"

# Git status
Write-Log "Checking git status..."
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Warn "Uncommitted changes detected"
    $commitChanges = Read-Host "Commit changes before deploying? (y/N)"
    if ($commitChanges -eq "y" -or $commitChanges -eq "Y") {
        git add .
        $commitMsg = Read-Host "Commit message"
        if ([string]::IsNullOrWhiteSpace($commitMsg)) {
            $commitMsg = "Deploy: Complete Kealee Platform v10"
        }
        git commit -m $commitMsg
    }
}

# Select deployment target
Write-Host ""
Write-Host "Select deployment target:"
Write-Host "1) Staging (Preview)"
Write-Host "2) Production"
Write-Host "3) Both"
$deployTarget = Read-Host "Choice (1-3)"

# Select apps
Write-Host ""
Write-Host "Select applications to deploy:"
Write-Host "1) All apps"
Write-Host "2) m-project-owner"
Write-Host "3) m-permits-inspections"
Write-Host "4) m-ops-services"
Write-Host "5) m-architect"
Write-Host "6) os-admin"
$appChoice = Read-Host "Choice (1-6)"

$apps = @()
switch ($appChoice) {
    "1" { $apps = @("m-project-owner", "m-permits-inspections", "m-ops-services", "m-architect", "os-admin") }
    "2" { $apps = @("m-project-owner") }
    "3" { $apps = @("m-permits-inspections") }
    "4" { $apps = @("m-ops-services") }
    "5" { $apps = @("m-architect") }
    "6" { $apps = @("os-admin") }
    default {
        Write-Error "Invalid choice"
        exit 1
    }
}

# Pre-deployment checks
Write-Log "Running pre-deployment checklist..."
if (Test-Path "scripts/pre-deployment-checklist.ps1") {
    & "scripts/pre-deployment-checklist.ps1"
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Pre-deployment checks failed"
        exit 1
    }
}

# Deploy to Vercel
if ($deployTarget -eq "1" -or $deployTarget -eq "3") {
    Write-Log "Deploying to Vercel Staging..."
    foreach ($app in $apps) {
        Write-Log "Deploying $app to staging..."
        Push-Location "apps/$app"
        vercel deploy --prebuilt --prod --confirm --token=$env:VERCEL_TOKEN
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Failed to deploy $app"
            Pop-Location
            exit 1
        }
        Pop-Location
        Write-Success "$app deployed to staging"
    }
}

if ($deployTarget -eq "2" -or $deployTarget -eq "3") {
    Write-Log "Deploying to Vercel Production..."
    $confirm = Read-Host "⚠️  Deploy to PRODUCTION? Type 'yes' to confirm"
    if ($confirm -ne "yes") {
        Write-Warn "Production deployment cancelled"
        exit 0
    }

    foreach ($app in $apps) {
        Write-Log "Deploying $app to production..."
        Push-Location "apps/$app"
        vercel deploy --prebuilt --prod --confirm --token=$env:VERCEL_TOKEN
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Failed to deploy $app"
            Pop-Location
            exit 1
        }
        Pop-Location
        Write-Success "$app deployed to production"
    }
}

# Deploy API to Railway
if (Test-Path "services/api") {
    Write-Log "Deploying API to Railway..."
    Push-Location "services/api"
    railway up --detach
    if ($LASTEXITCODE -ne 0) {
        Write-Warn "Railway deployment failed or not configured"
    }
    Pop-Location
}

# Post-deployment verification
Write-Log "Running post-deployment verification..."
Start-Sleep -Seconds 5

foreach ($app in $apps) {
    # Get deployment URL from Vercel
    $deploymentUrl = vercel ls $app --token=$env:VERCEL_TOKEN --json | ConvertFrom-Json | Select-Object -First 1 -ExpandProperty url
    if ($deploymentUrl) {
        Write-Log "Verifying $app at $deploymentUrl..."
        try {
            $response = Invoke-WebRequest -Uri "https://$deploymentUrl" -UseBasicParsing -TimeoutSec 5
            if ($response.StatusCode -eq 200) {
                Write-Success "$app is live at https://$deploymentUrl"
            }
        } catch {
            Write-Warn "$app deployment may not be ready yet"
        }
    }
}

Write-Host ""
Write-Success "Deployment complete!"
Write-Host ""
Write-Host "📊 Deployment Summary:"
Write-Host "   - Apps deployed: $($apps.Count)"
$targetText = if ($deployTarget -eq "1") { "Staging" } elseif ($deployTarget -eq "2") { "Production" } else { "Both" }
Write-Host "   - Target: $targetText"
Write-Host ""
Write-Host "📋 Next Steps:"
Write-Host "   1. Verify deployments in Vercel dashboard"
Write-Host "   2. Run smoke tests"
Write-Host "   3. Check monitoring dashboards"
Write-Host "   4. Review logs for errors"
Write-Host ""
