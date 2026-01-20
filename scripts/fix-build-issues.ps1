# scripts/fix-build-issues.ps1
# Automated script to fix common build issues (PowerShell)

$ErrorActionPreference = "Continue"

function Log-FixBuild {
    param([string]$Message)
    Write-Host "[FIX BUILD] $Message" -ForegroundColor Cyan
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

Write-Host "🔧 Fix Build Issues" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

# Get app name
$apps = @("m-marketplace", "os-admin", "os-pm", "m-ops-services", "m-project-owner", "m-architect", "m-permits-inspections")

if ($args.Count -eq 0) {
    Write-Host "Select app:"
    for ($i = 0; $i -lt $apps.Length; $i++) {
        Write-Host "  $($i+1)) $($apps[$i])"
    }
    $appChoice = Read-Host "Enter choice"
    $app = $apps[[int]$appChoice - 1]
} else {
    $app = $args[0]
}

if (-not (Test-Path "apps/$app")) {
    Write-Fail "App directory not found: apps/$app"
    exit 1
}

Write-Success "Selected app: $app"

Push-Location "apps/$app"

# Step 1: Check TypeScript errors
Log-FixBuild "Step 1: Checking TypeScript errors..."
$typeCheck = & npm run type-check 2>&1
if ($typeCheck -match "error") {
    Write-Fail "TypeScript errors found"
    Write-Warn "Please fix TypeScript errors before continuing"
    $typeCheck
    Pop-Location
    exit 1
} else {
    Write-Success "No TypeScript errors"
}

# Step 2: Test build locally
Log-FixBuild "Step 2: Testing build locally..."
$build = & npm run build 2>&1
if ($build -match "error|Error|failed") {
    Write-Fail "Local build failed"
    Write-Warn "Please fix build errors before continuing"
    Pop-Location
    exit 1
} else {
    Write-Success "Local build succeeded"
}

# Step 3: Check environment variables
Log-FixBuild "Step 3: Checking environment variables..."
if (-not $env:VERCEL_TOKEN) {
    Write-Warn "VERCEL_TOKEN not set, skipping environment variable check"
} else {
    Log-FixBuild "Listing environment variables..."
    & vercel env ls --token=$env:VERCEL_TOKEN 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Environment variables accessible"
    } else {
        Write-Warn "Could not list environment variables"
    }
}

# Step 4: Clear local cache
Log-FixBuild "Step 4: Clearing local cache..."
Remove-Item -Recurse -Force node_modules, package-lock.json, .next -ErrorAction SilentlyContinue
Write-Success "Local cache cleared"

# Step 5: Reinstall dependencies
Log-FixBuild "Step 5: Reinstalling dependencies..."
& npm install
Write-Success "Dependencies reinstalled"

# Step 6: Clear Vercel build cache (optional)
if ($env:VERCEL_TOKEN) {
    $clearCache = Read-Host "Clear Vercel build cache? (y/N)"
    if ($clearCache -eq "y" -or $clearCache -eq "Y") {
        Log-FixBuild "Clearing Vercel build cache..."
        & vercel rm --safe --token=$env:VERCEL_TOKEN 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Vercel cache cleared"
        } else {
            Write-Warn "Could not clear Vercel cache"
        }
    }
}

Pop-Location

Write-Host ""
Write-Success "Build issue fixes complete!"
Write-Host ""
Write-Host "Next steps:"
Write-Host "  1. Review any warnings above"
Write-Host "  2. Fix any remaining issues"
Write-Host "  3. Test build again: cd apps/$app && npm run build"
Write-Host "  4. Deploy: vercel deploy --prod --token=`$env:VERCEL_TOKEN"
