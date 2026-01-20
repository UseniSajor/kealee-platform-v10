# scripts/setup-uptime-monitoring.ps1
# Setup uptime monitoring (PowerShell version)

param(
    [string]$Service = "uptimerobot"
)

$ErrorActionPreference = "Continue"

function Log-Uptime {
    param([string]$Message)
    Write-Host "[UPTIME] $Message" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

Write-Host "⏱️  Uptime Monitoring Setup" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "   Service: $Service"
Write-Host ""

$appEndpoints = @{
    "api" = "https://api.kealee.com/health"
    "marketplace" = "https://marketplace.kealee.com"
    "admin" = "https://admin.kealee.com"
    "pm" = "https://pm.kealee.com"
    "ops" = "https://ops.kealee.com"
    "app" = "https://app.kealee.com"
    "owner" = "https://owner.kealee.com"
    "architect" = "https://architect.kealee.com"
    "permits" = "https://permits.kealee.com"
}

$monitoringConfigFile = "uptime-monitoring-config.txt"
Log-Uptime "Generating uptime monitoring configuration: $monitoringConfigFile"

$content = @"
# Uptime Monitoring Configuration for Kealee Platform
# Generated: $(Get-Date)
# Service: $Service

# Setup Instructions:
# 1. Sign up for $Service
# 2. Create monitors for each endpoint below
# 3. Configure alert notifications
# 4. Set up status page (optional)

# Monitoring Endpoints:
"@

foreach ($app in $appEndpoints.Keys) {
    $endpoint = $appEndpoints[$app]
    $content += "`n`n# $app`n"
    $content += "MONITOR_NAME_$($app.ToUpper())=Kealee - $app`n"
    $content += "MONITOR_URL_$($app.ToUpper())=$endpoint`n"
    $content += "MONITOR_TYPE=HTTP(S)`n"
    $content += "MONITOR_INTERVAL=5 minutes`n"
    $content += "ALERT_CONTACTS=...`n"
}

$content | Out-File -FilePath $monitoringConfigFile -Encoding utf8

Write-Success "Monitoring configuration file created: $monitoringConfigFile"

Write-Host ""
Write-Host "📋 Monitoring Endpoints" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

foreach ($app in $appEndpoints.Keys) {
    $endpoint = $appEndpoints[$app]
    Write-Host "  $app"
    Write-Host "    URL: $endpoint"
    Write-Host "    Expected Status: 200"
    Write-Host "    Check Interval: 5 minutes"
    Write-Host ""
}

Write-Host ""
Write-Host "📋 Next Steps" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. ✅ Sign up for $Service"
Write-Host "2. ✅ Create monitors for each endpoint"
Write-Host "3. ✅ Configure alert notifications"
Write-Host "4. ✅ Set up status page (optional)"
Write-Host "5. ✅ Test alerts"
Write-Host ""
Write-Host "📄 Configuration saved to: $monitoringConfigFile"
