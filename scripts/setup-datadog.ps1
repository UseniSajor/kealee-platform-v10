# scripts/setup-datadog.ps1
# Setup Datadog monitoring (PowerShell version)

$ErrorActionPreference = "Continue"

function Log-Datadog {
    param([string]$Message)
    Write-Host "[DATADOG] $Message" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

Write-Host "📊 Datadog Monitoring Setup" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

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

$datadogConfigFile = "datadog-config.txt"
Log-Datadog "Generating Datadog configuration file: $datadogConfigFile"

$content = @"
# Datadog Configuration for Kealee Platform
# Generated: $(Get-Date)

# Setup Instructions:
# 1. Sign up at https://www.datadoghq.com
# 2. Get API key from: Organization Settings → API Keys
# 3. Install @datadog/nextjs for Next.js apps
# 4. Install dd-trace for API

# Environment Variables:
DATADOG_API_KEY=...
DATADOG_APP_KEY=...
DATADOG_SITE=datadoghq.com
NEXT_PUBLIC_DD_RUM_APPLICATION_ID=...
NEXT_PUBLIC_DD_RUM_CLIENT_TOKEN=...
DD_SERVICE=kealee-platform
DD_ENV=production
DD_VERSION=1.0.0

# Application Configuration:
"@

foreach ($app in $appConfig.Keys) {
    $content += "`n`n# $app`n"
    $content += "DD_SERVICE_$($app.ToUpper())=kealee-$app`n"
    $content += "NEXT_PUBLIC_DD_RUM_APPLICATION_ID_$($app.ToUpper())=...`n"
    $content += "NEXT_PUBLIC_DD_RUM_CLIENT_TOKEN_$($app.ToUpper())=...`n"
}

$content | Out-File -FilePath $datadogConfigFile -Encoding utf8

Write-Success "Datadog configuration file created: $datadogConfigFile"

Write-Host ""
Write-Host "📋 Next Steps" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. ✅ Get Datadog credentials from dashboard"
Write-Host "2. ✅ Install Datadog packages in each app"
Write-Host "3. ✅ Configure Datadog in code"
Write-Host "4. ✅ Set environment variables"
Write-Host "5. ✅ Set up dashboards in Datadog"
Write-Host ""
Write-Host "📄 Configuration saved to: $datadogConfigFile"
