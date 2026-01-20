# scripts/link-vercel-projects.ps1
# Link all Vercel projects to local directories (PowerShell)

$ErrorActionPreference = "Continue"

function Log-Vercel {
    param([string]$Message)
    Write-Host "[VERCEL] $Message" -ForegroundColor Cyan
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
    Write-Fail "Vercel CLI not found"
    Write-Host "   Install with: npm install -g vercel@latest"
    exit 1
}

# Check if logged in
Log-Vercel "Checking Vercel login status..."
try {
    $user = vercel whoami 2>&1 | Out-String | Trim()
    Write-Success "Already logged in as: $user"
} catch {
    Write-Warn "Not logged in to Vercel"
    Log-Vercel "Logging in to Vercel..."
    try {
        vercel login
        Write-Success "Logged in to Vercel"
    } catch {
        Write-Fail "Failed to login to Vercel"
        exit 1
    }
}

Write-Host ""
Write-Host "🔗 Linking Vercel Projects" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

# Apps to link
$apps = @(
    "m-marketplace",
    "os-admin",
    "os-pm",
    "m-ops-services",
    "m-project-owner",
    "m-architect",
    "m-permits-inspections"
)

$successCount = 0
$failCount = 0
$skipCount = 0

# Link each app
foreach ($app in $apps) {
    $appDir = "apps\$app"
    
    if (-not (Test-Path $appDir)) {
        Write-Warn "Directory not found: $appDir"
        $skipCount++
        continue
    }
    
    Log-Vercel "Linking $app..."
    Push-Location $appDir
    
    # Check if already linked
    $projectJson = ".vercel\project.json"
    if (Test-Path $projectJson) {
        Write-Warn "  Already linked (project.json exists)"
        $relink = Read-Host "  Relink? (y/N)"
        if ($relink -ne "y" -and $relink -ne "Y") {
            Log-Vercel "  Skipping $app"
            Pop-Location
            $skipCount++
            continue
        }
    }
    
    # Link project
    try {
        vercel link
        Write-Success "  Linked $app"
        $successCount++
    } catch {
        Write-Fail "  Failed to link $app"
        $failCount++
    }
    
    Pop-Location
    Write-Host ""
}

# Summary
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

if ($successCount -gt 0) {
    Write-Success "Successfully linked: $successCount project(s)"
}
if ($skipCount -gt 0) {
    Write-Warn "Skipped: $skipCount project(s)"
}
if ($failCount -gt 0) {
    Write-Fail "Failed: $failCount project(s)"
    exit 1
}

Write-Host ""
Write-Success "All projects linked successfully!"
Write-Host ""
Write-Host "📋 Next Steps:"
Write-Host "   1. Verify project links: vercel ls"
Write-Host "   2. Set environment variables: .\scripts\setup-env.ps1"
Write-Host "   3. Deploy to staging: .\scripts\deploy-staging.ps1"
