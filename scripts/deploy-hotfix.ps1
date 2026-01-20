# scripts/deploy-hotfix.ps1
# Emergency hotfix deployment (bypasses tests and some checks) - PowerShell version

param(
    [string]$App = "",
    [string]$Message = "",
    [switch]$Force
)

$ErrorActionPreference = "Continue"

function Log-Hotfix {
    param([string]$Message)
    Write-Host "[HOTFIX] $Message" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Fail {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Write-Warn {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

# Check if Vercel CLI is installed
try {
    $null = Get-Command vercel -ErrorAction Stop
} catch {
    Write-Fail "Vercel CLI not installed"
    exit 1
}

# Check if logged in to Vercel
try {
    $null = vercel whoami 2>&1 | Out-Null
} catch {
    Write-Fail "Not logged in to Vercel"
    exit 1
}

Write-Host "🚨 EMERGENCY HOTFIX DEPLOYMENT" -ForegroundColor Red
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Red
Write-Host ""
Write-Warn "⚠️  HOTFIX MODE: Tests and some checks are bypassed"
Write-Host ""

# If app specified, deploy only that app
if ($App) {
    $appDir = "apps/$App"
    
    if (-not (Test-Path $appDir)) {
        Write-Fail "Application directory not found: $appDir"
        exit 1
    }
    
    Log-Hotfix "Deploying hotfix to: $App"
    Log-Hotfix "Message: $(if ($Message) { $Message } else { 'Emergency hotfix' })"
    Write-Host ""
    
    Push-Location $appDir
    
    # Quick build check
    Log-Hotfix "Building $App..."
    try {
        $buildResult = pnpm build 2>&1
        if ($buildResult -match "error|Error|failed" -and -not $Force) {
            Write-Fail "Build failed. Use -Force to deploy anyway."
            Pop-Location
            exit 1
        } elseif ($buildResult -match "error|Error|failed") {
            Write-Warn "Build had errors, but continuing with -Force"
        }
    } catch {
        if (-not $Force) {
            Write-Fail "Build error: $($_.Exception.Message). Use -Force to deploy anyway."
            Pop-Location
            exit 1
        } else {
            Write-Warn "Build error, but continuing with -Force"
        }
    }
    
    # Deploy to production
    Log-Hotfix "Deploying $App to PRODUCTION..."
    $deployArgs = @("--yes", "--prod")
    if ($Message) {
        $deployArgs += "--message=$Message"
    }
    
    try {
        $deployResult = & vercel $deployArgs 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Success "$App hotfix deployed to PRODUCTION"
            Write-Host ""
            Write-Host "📋 Post-deployment:"
            Write-Host "   1. Verify the fix works"
            Write-Host "   2. Monitor error tracking"
            Write-Host "   3. Document the hotfix"
            Write-Host "   4. Create proper fix in main branch"
        } else {
            Write-Fail "$App hotfix deployment failed"
            Pop-Location
            exit 1
        }
    } catch {
        Write-Fail "$App hotfix deployment error: $($_.Exception.Message)"
        Pop-Location
        exit 1
    }
    
    Pop-Location
    exit 0
}

# If no app specified, ask which app
Write-Host "Available applications:"
$apps = @(
    "m-marketplace",
    "os-admin",
    "os-pm",
    "m-ops-services",
    "m-project-owner",
    "m-architect",
    "m-permits-inspections"
)

for ($i = 0; $i -lt $apps.Count; $i++) {
    Write-Host "  $($i+1). $($apps[$i])"
}

Write-Host ""
$appNum = Read-Host "Select application number (1-$($apps.Count))"

try {
    $appIndex = [int]$appNum - 1
    if ($appIndex -lt 0 -or $appIndex -ge $apps.Count) {
        Write-Fail "Invalid selection"
        exit 1
    }
    $selectedApp = $apps[$appIndex]
} catch {
    Write-Fail "Invalid selection"
    exit 1
}

$appDir = "apps/$selectedApp"

if (-not (Test-Path $appDir)) {
    Write-Fail "Application directory not found: $appDir"
    exit 1
}

if (-not $Message) {
    $Message = Read-Host "Hotfix message (optional)"
}

Log-Hotfix "Deploying hotfix to: $selectedApp"
Log-Hotfix "Message: $(if ($Message) { $Message } else { 'Emergency hotfix' })"
Write-Host ""

Push-Location $appDir

# Quick build check
Log-Hotfix "Building $selectedApp..."
try {
    $buildResult = pnpm build 2>&1
    if ($buildResult -match "error|Error|failed" -and -not $Force) {
        Write-Fail "Build failed. Use -Force to deploy anyway."
        Pop-Location
        exit 1
    } elseif ($buildResult -match "error|Error|failed") {
        Write-Warn "Build had errors, but continuing with -Force"
    }
} catch {
    if (-not $Force) {
        Write-Fail "Build error: $($_.Exception.Message). Use -Force to deploy anyway."
        Pop-Location
        exit 1
    } else {
        Write-Warn "Build error, but continuing with -Force"
    }
}

# Deploy to production
Log-Hotfix "Deploying $selectedApp to PRODUCTION..."
$deployArgs = @("--yes", "--prod")
if ($Message) {
    $deployArgs += "--message=$Message"
}

try {
    $deployResult = & vercel $deployArgs 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Success "$selectedApp hotfix deployed to PRODUCTION"
        Write-Host ""
        Write-Host "📋 Post-deployment:"
        Write-Host "   1. Verify the fix works"
        Write-Host "   2. Monitor error tracking"
        Write-Host "   3. Document the hotfix"
        Write-Host "   4. Create proper fix in main branch"
    } else {
        Write-Fail "$selectedApp hotfix deployment failed"
        Pop-Location
        exit 1
    }
} catch {
    Write-Fail "$selectedApp hotfix deployment error: $($_.Exception.Message)"
    Pop-Location
    exit 1
}

Pop-Location
