# scripts/setup-env-all.ps1
# Setup environment variables for all applications (PowerShell version)

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("production", "preview", "development")]
    [string]$Environment
)

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

Write-Host "🔐 Setting Environment Variables for All Apps" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "   Environment: $Environment"
Write-Host ""

# Applications
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

foreach ($app in $apps) {
    Write-Host ""
    Log-Setup "Setting up $app..."
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    
    try {
        & "scripts/setup-env.ps1" -AppName $app -Environment $Environment
        if ($LASTEXITCODE -eq 0) {
            Write-Success "$app environment setup complete"
            $successCount++
        } else {
            Write-Fail "$app environment setup failed"
            $failCount++
        }
    } catch {
        Write-Fail "$app environment setup error: $($_.Exception.Message)"
        $failCount++
    }
    
    Write-Host ""
}

# Summary
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "📊 Overall Summary" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Success "Apps configured: $successCount"
if ($failCount -gt 0) {
    Write-Fail "Apps failed: $failCount"
}
Write-Host ""

if ($failCount -eq 0) {
    Write-Host "✅ All applications configured successfully!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "⚠️  Some applications failed. Review errors above." -ForegroundColor Yellow
    exit 1
}
