# scripts/deploy-production.ps1
# Deploy all applications to Vercel production (requires approval) - PowerShell version

param(
    [switch]$Force
)

$ErrorActionPreference = "Continue"

# Counters
$script:Deployed = 0
$script:Failed = 0
$script:Skipped = 0

function Log-Deploy {
    param([string]$Message)
    Write-Host "[DEPLOY] $Message" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
    $script:Deployed++
}

function Write-Fail {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
    $script:Failed++
}

function Write-Warn {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
    $script:Skipped++
}

# Check if Vercel CLI is installed
try {
    $null = Get-Command vercel -ErrorAction Stop
} catch {
    Write-Fail "Vercel CLI not installed"
    Write-Host "   Install with: npm install -g vercel@latest"
    exit 1
}

# Check if logged in to Vercel
try {
    $null = vercel whoami 2>&1 | Out-Null
} catch {
    Write-Fail "Not logged in to Vercel"
    Write-Host "   Login with: vercel login"
    exit 1
}

# Safety check: Require confirmation
Write-Host "🚨 PRODUCTION DEPLOYMENT" -ForegroundColor Red
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Red
Write-Host ""
Write-Host "⚠️  WARNING: This will deploy to PRODUCTION" -ForegroundColor Red
Write-Host ""
Write-Host "Before proceeding, ensure:"
Write-Host "  ✅ All tests pass"
Write-Host "  ✅ Code review completed"
Write-Host "  ✅ Pre-deployment checklist passed"
Write-Host "  ✅ Database migrations applied"
Write-Host "  ✅ Environment variables configured"
Write-Host "  ✅ Backup created"
Write-Host ""

if (-not $Force) {
    $confirm = Read-Host "Are you sure you want to deploy to PRODUCTION? (type 'yes' to confirm)"
    if ($confirm -ne "yes") {
        Write-Host "Deployment cancelled."
        exit 0
    }
}

# Run pre-deployment checklist
Write-Host ""
Write-Host "Running pre-deployment checklist..." -ForegroundColor Cyan
if (Test-Path "scripts/pre-deployment-checklist.ps1") {
    $checklistResult = & "scripts/pre-deployment-checklist.ps1"
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        if (-not $Force) {
            $forceConfirm = Read-Host "Pre-deployment checklist failed. Continue anyway? (type 'force' to continue)"
            if ($forceConfirm -ne "force") {
                Write-Host "Deployment cancelled."
                exit 1
            }
        }
    }
} else {
    Write-Warn "Pre-deployment checklist script not found"
}

# Check current branch
if (Test-Path ".git") {
    $currentBranch = git branch --show-current 2>&1
    if ($currentBranch -and $currentBranch -ne "main" -and $currentBranch -ne "master") {
        Write-Warn "Not on main/master branch (current: $currentBranch)"
        if (-not $Force) {
            $branchConfirm = Read-Host "Continue with production deployment? (type 'yes' to continue)"
            if ($branchConfirm -ne "yes") {
                Write-Host "Deployment cancelled."
                exit 0
            }
        }
    }
}

Write-Host ""
Write-Host "🚀 Deploying All Applications to Production" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

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

# Deploy each application
foreach ($app in $apps) {
    if (-not (Test-Path $app)) {
        Write-Warn "Directory not found: $app"
        continue
    }
    
    $appName = Split-Path $app -Leaf
    Log-Deploy "Deploying $appName to PRODUCTION..."
    
    Push-Location $app
    
    # Check if package.json exists
    if (-not (Test-Path "package.json")) {
        Write-Warn "$appName : package.json not found"
        Pop-Location
        continue
    }
    
    # Check if vercel.json exists
    if (-not (Test-Path "vercel.json")) {
        Write-Warn "$appName : vercel.json not found"
        Pop-Location
        continue
    }
    
    # Build the app first
    Log-Deploy "  Building $appName..."
    try {
        $buildResult = pnpm build 2>&1
        if ($buildResult -match "error|Error|failed") {
            Write-Fail "$appName : Build failed"
            Pop-Location
            continue
        }
    } catch {
        Write-Fail "$appName : Build error: $($_.Exception.Message)"
        Pop-Location
        continue
    }
    
    # Deploy to production
    Log-Deploy "  Deploying $appName to PRODUCTION..."
    try {
        $deployResult = vercel --yes --prod 2>&1
        $deployOutput = $deployResult | Out-String
        
        # Extract deployment URL
        $deploymentUrl = ""
        if ($deployOutput -match 'https://[^\s]*\.vercel\.app|https://[^\s]*\.kealee\.com') {
            $deploymentUrl = $matches[0]
        }
        
        if ($LASTEXITCODE -eq 0) {
            if ($deploymentUrl) {
                Write-Success "$appName deployed to PRODUCTION: $deploymentUrl"
            } else {
                Write-Success "$appName deployed to PRODUCTION (URL not captured)"
            }
        } else {
            Write-Fail "$appName : Production deployment failed"
        }
    } catch {
        Write-Fail "$appName : Deployment error: $($_.Exception.Message)"
    }
    
    Pop-Location
    Write-Host ""
}

# Summary
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "📊 Production Deployment Summary" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "✅ Deployed: $($script:Deployed)" -ForegroundColor Green
Write-Host "❌ Failed: $($script:Failed)" -ForegroundColor Red
Write-Host "⏭️  Skipped: $($script:Skipped)" -ForegroundColor Yellow
Write-Host ""

if ($script:Failed -eq 0) {
    Write-Host "✅ All applications deployed to PRODUCTION successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🔗 View deployments:"
    Write-Host "   https://vercel.com/dashboard"
    Write-Host ""
    Write-Host "📋 Next Steps:"
    Write-Host "   1. Monitor application health"
    Write-Host "   2. Check error tracking (Sentry)"
    Write-Host "   3. Verify critical user flows"
    Write-Host "   4. Monitor performance metrics"
    exit 0
} else {
    Write-Host "❌ Some deployments failed. Review errors above." -ForegroundColor Red
    exit 1
}
