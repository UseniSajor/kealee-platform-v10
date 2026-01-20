# scripts/setup-sentry.ps1
# Setup Sentry error monitoring (PowerShell version)

param(
    [string]$Env = "production",
    [string]$Org = "",
    [string]$Token = ""
)

$ErrorActionPreference = "Continue"

function Log-Sentry {
    param([string]$Message)
    Write-Host "[SENTRY] $Message" -ForegroundColor Cyan
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

Write-Host "🔍 Sentry Error Monitoring Setup" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "   Environment: $Env"
Write-Host ""

# Application configuration
$appConfig = @{
    "m-marketplace" = "marketplace.kealee.com"
    "os-admin" = "admin.kealee.com"
    "os-pm" = "pm.kealee.com"
    "m-ops-services" = "ops.kealee.com"
    "m-project-owner" = "app.kealee.com"
    "m-architect" = "architect.kealee.com"
    "m-permits-inspections" = "permits.kealee.com"
    "api" = "api.kealee.com"
}

# Generate Sentry configuration
$sentryConfigFile = "sentry-config.txt"
Log-Sentry "Generating Sentry configuration file: $sentryConfigFile"

$content = @"
# Sentry Configuration for Kealee Platform
# Generated: $(Get-Date)
# Environment: $Env

# Setup Instructions:
# 1. Go to https://sentry.io
# 2. Create a new organization (if needed)
# 3. For each app, create a new project
# 4. Get the DSN from each project's Settings → Client Keys (DSN)
# 5. Set environment variables in Vercel/Railway

# Application Projects:
"@

foreach ($app in $appConfig.Keys) {
    $projectName = "kealee-$app"
    $content += "`n`n# $app`n"
    $content += "SENTRY_PROJECT_$($app.ToUpper())=$projectName`n"
    $content += "NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...`n"
    $content += "SENTRY_DSN=https://...@sentry.io/...`n"
    $content += "SENTRY_AUTH_TOKEN=...`n"
    $content += "SENTRY_ORG=$Org`n"
    $content += "SENTRY_PROJECT=$projectName`n"
}

$content | Out-File -FilePath $sentryConfigFile -Encoding utf8

Write-Success "Sentry configuration file created: $sentryConfigFile"

Write-Host ""
Write-Host "📋 Next Steps" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. ✅ Create Sentry projects at https://sentry.io"
Write-Host "2. ✅ Get DSNs from each project"
Write-Host "3. ✅ Set environment variables in Vercel/Railway"
Write-Host "4. ✅ Configure source maps (optional)"
Write-Host "5. ✅ Set up alerts"
Write-Host ""
Write-Host "📄 Configuration saved to: $sentryConfigFile"
