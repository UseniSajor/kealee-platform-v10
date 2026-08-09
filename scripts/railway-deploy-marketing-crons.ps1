# Deploy all marketing cron workers via Railway project token.
# Uses railway up from each service directory (no rootDirectory needed).
#
# Usage:
#   $env:RAILWAY_TOKEN = '<project-token>'
#   .\scripts\railway-deploy-marketing-crons.ps1

param(
  [string]$Environment = "production",
  [string]$AppUrl = "https://kealee.com"
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path $PSScriptRoot -Parent

if (-not $env:RAILWAY_TOKEN) {
  $cliEnv = Join-Path $repoRoot "env-templates\railway-cli.env"
  if (Test-Path $cliEnv) {
    foreach ($line in Get-Content $cliEnv) {
      if ($line -match '^\s*RAILWAY_TOKEN\s*=\s*(\S+)') { $env:RAILWAY_TOKEN = $Matches[1].Trim() }
    }
  }
}

if (-not $env:RAILWAY_TOKEN) {
  Write-Host "Set RAILWAY_TOKEN (project token from Railway dashboard)" -ForegroundColor Red
  exit 1
}

$cronSecret = $null
$kv = railway variable list --service web-main --environment $Environment --kv 2>&1
if ($LASTEXITCODE -eq 0) {
  $m = [regex]::Match(($kv -join "`n"), 'CRON_SECRET=(\S+)')
  if ($m.Success) { $cronSecret = $m.Groups[1].Value }
}
if (-not $cronSecret) {
  Write-Host "Could not read CRON_SECRET from web-main" -ForegroundColor Red
  exit 1
}

$services = @(
  "marketing-cron-lead-scoring",
  "marketing-cron-sequences",
  "marketing-cron-requalify-cold",
  "marketing-cron-parcel-enrichment",
  "marketing-cron-parcel-outreach",
  "marketing-cron-marketing-drip"
)

$ProjectId = "8187fcf6-9916-49aa-bc75-77407f83d319"

foreach ($name in $services) {
  Write-Host "`n=== $name ===" -ForegroundColor Cyan

  $check = railway service status --service $name --environment $Environment 2>&1
  if ($LASTEXITCODE -ne 0 -or ($check -join "`n") -match 'not found|Service not found') {
    Write-Host "  creating via railway up -p $ProjectId ..." -ForegroundColor Yellow
  }

  railway variable set "CRON_SECRET=$cronSecret" --service $name --environment $Environment --skip-deploys 2>&1 | Out-Null
  railway variable set "APP_URL=$AppUrl" --service $name --environment $Environment --skip-deploys 2>&1 | Out-Null
  railway variable set "NODE_ENV=production" --service $name --environment $Environment --skip-deploys 2>&1 | Out-Null
  Write-Host "  env vars synced"

  $dir = Join-Path $repoRoot "services\$name"
  Push-Location $dir
  railway up -p $ProjectId --service $name --environment $Environment -d 2>&1
  $upExit = $LASTEXITCODE
  Pop-Location

  if ($upExit -eq 0) {
    Write-Host "  deployed" -ForegroundColor Green
  } else {
    Write-Host "  deploy failed (exit $upExit)" -ForegroundColor Red
  }
}

Write-Host "`n=== Status ===" -ForegroundColor Yellow
railway service status --all --environment $Environment 2>&1
