# scripts/setup-vercel-cli.ps1
# Setup Vercel CLI and link projects (PowerShell version)

$ErrorActionPreference = "Continue"

function Log-Setup {
    param([string]$Message)
    Write-Host "[SETUP] $Message" -ForegroundColor Cyan
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

Write-Host "🔧 Vercel CLI Setup" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

# Step 1: Install Vercel CLI
Log-Setup "1. Installing Vercel CLI..."
try {
    $null = Get-Command vercel -ErrorAction Stop
    $vercelVersion = vercel --version 2>&1
    Write-Success "Vercel CLI already installed ($vercelVersion)"
} catch {
    Log-Setup "   Installing Vercel CLI..."
    try {
        npm install -g vercel@latest
        Write-Success "Vercel CLI installed successfully"
    } catch {
        Write-Fail "Failed to install Vercel CLI"
        exit 1
    }
}

# Step 2: Login to Vercel
Log-Setup "2. Checking Vercel login..."
try {
    $userEmail = vercel whoami 2>&1
    Write-Success "Already logged in as: $userEmail"
} catch {
    Write-Warn "Not logged in to Vercel"
    Write-Host "   Please login:"
    Write-Host "   vercel login"
    $skipLogin = Read-Host "Press Enter after logging in, or 'skip' to skip"
    if ($skipLogin -ne "skip") {
        try {
            vercel login
            Write-Success "Logged in to Vercel"
        } catch {
            Write-Fail "Failed to login to Vercel"
            exit 1
        }
    }
}

# Step 3: Link projects
Write-Host ""
Log-Setup "3. Linking projects to Vercel..."
Write-Host ""

$apps = @(
    "apps/m-marketplace",
    "apps/os-admin",
    "apps/os-pm",
    "apps/m-ops-services",
    "apps/m-project-owner",
    "apps/m-architect",
    "apps/m-permits-inspections"
)

$linked = 0
$skipped = 0

foreach ($app in $apps) {
    if (-not (Test-Path $app)) {
        Write-Warn "Directory not found: $app"
        continue
    }
    
    $appName = Split-Path $app -Leaf
    Log-Setup "Linking $appName..."
    
    Push-Location $app
    
    # Check if already linked
    if (Test-Path ".vercel/project.json") {
        Write-Success "$appName already linked"
        $linked++
    } else {
        Write-Host "   Linking $appName to Vercel..."
        Write-Host "   (Follow prompts to select/create project)"
        try {
            vercel link
            Write-Success "$appName linked successfully"
            $linked++
        } catch {
            Write-Warn "$appName linking skipped or failed"
            $skipped++
        }
    }
    
    Pop-Location
    Write-Host ""
}

# Summary
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "📊 Setup Summary" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Success "Vercel CLI: Installed and ready"
Write-Success "Projects linked: $linked"
if ($skipped -gt 0) {
    Write-Warn "Projects skipped: $skipped"
}
Write-Host ""
Write-Host "✅ Vercel CLI setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:"
Write-Host "  1. Set environment variables: .\scripts\setup-env.ps1 [app] [environment]"
Write-Host "  2. Deploy to staging: .\scripts\deploy-staging.ps1"
Write-Host "  3. Deploy to production: .\scripts\deploy-production.ps1"
Write-Host ""
