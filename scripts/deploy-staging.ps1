# scripts/deploy-staging.ps1
# Deploy all applications to Vercel staging (PowerShell version)

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

Write-Host "🚀 Deploying All Applications to Staging" -ForegroundColor Cyan
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
    Log-Deploy "Deploying $appName..."
    
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
    
    # Deploy to staging
    Log-Deploy "  Deploying $appName to staging..."
    try {
        $deployResult = vercel --yes --prod=false 2>&1
        $deployOutput = $deployResult | Out-String
        
        # Extract deployment URL
        $deploymentUrl = ""
        if ($deployOutput -match 'https://[^\s]*\.vercel\.app') {
            $deploymentUrl = $matches[0]
        }
        
        if ($LASTEXITCODE -eq 0) {
            if ($deploymentUrl) {
                Write-Success "$appName deployed to: $deploymentUrl"
            } else {
                Write-Success "$appName deployed (URL not captured)"
            }
        } else {
            Write-Fail "$appName : Deployment failed"
        }
    } catch {
        Write-Fail "$appName : Deployment error: $($_.Exception.Message)"
    }
    
    Pop-Location
    Write-Host ""
}

# Summary
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "📊 Deployment Summary" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "✅ Deployed: $($script:Deployed)" -ForegroundColor Green
Write-Host "❌ Failed: $($script:Failed)" -ForegroundColor Red
Write-Host "⏭️  Skipped: $($script:Skipped)" -ForegroundColor Yellow
Write-Host ""

if ($script:Failed -eq 0) {
    Write-Host "✅ All applications deployed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🔗 View deployments:"
    Write-Host "   https://vercel.com/dashboard"
    exit 0
} else {
    Write-Host "❌ Some deployments failed. Review errors above." -ForegroundColor Red
    exit 1
}
