# scripts/rollback-deployment.ps1
# Rollback deployment to previous version (PowerShell)

param(
    [string]$App = "",
    [string]$Version = "previous"
)

if (-not $App) {
    Write-Host "Usage: .\scripts\rollback-deployment.ps1 -App <app> [-Version <version>]"
    Write-Host "Example: .\scripts\rollback-deployment.ps1 -App m-marketplace"
    exit 1
}

Write-Host "⏪ Rolling Back Deployment" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "App: $App"
Write-Host "Version: $Version"
Write-Host ""

if (-not $env:VERCEL_TOKEN) {
    Write-Host "VERCEL_TOKEN not set" -ForegroundColor Red
    exit 1
}

# List recent deployments
Write-Host "Recent deployments:"
& vercel list $App --token=$env:VERCEL_TOKEN | Select-Object -First 5

Write-Host ""
$confirm = Read-Host "Confirm rollback? (y/N)"

if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Host "Cancelled"
    exit 0
}

# Get previous deployment URL
$deployments = & vercel list $App --token=$env:VERCEL_TOKEN | Select-Object -First 3
$previous = ($deployments | Select-Object -Skip 1 -First 1) -split '\s+' | Select-Object -Index 1

if ($previous) {
    Write-Host "Rolling back to: $previous"
    & vercel rollback $previous --token=$env:VERCEL_TOKEN
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Rollback complete" -ForegroundColor Green
    } else {
        Write-Host "❌ Rollback failed" -ForegroundColor Red
    }
} else {
    Write-Host "❌ Could not find previous deployment" -ForegroundColor Red
    exit 1
}
