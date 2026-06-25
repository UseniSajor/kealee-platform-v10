# Marketing Railway deploy via CLI (v4+)
# Prereq: railway login  OR  RAILWAY_TOKEN in env-templates/railway-cli.env
#
# Usage:
#   .\scripts\railway-marketing-deploy.ps1
#   .\scripts\railway-marketing-deploy.ps1 -SkipRedeploy

param(
  [switch]$SkipRedeploy,
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path $PSScriptRoot -Parent
Set-Location $repoRoot

$ProjectId = "8187fcf6-9916-49aa-bc75-77407f83d319"
$EnvironmentId = "ff19d499-942b-4668-9a26-a21ecb20e349"
$CronServices = @(
  "marketing-cron-lead-scoring",
  "marketing-cron-sequences",
  "marketing-cron-requalify-cold",
  "marketing-cron-parcel-enrichment",
  "marketing-cron-parcel-outreach",
  "marketing-cron-marketing-drip"
)

function Test-RailwayAuth {
  $null = railway whoami 2>&1
  if ($LASTEXITCODE -eq 0) { return $true }
  $null = railway status 2>&1
  return $LASTEXITCODE -eq 0
}

function Load-CliToken {
  $cliEnv = Join-Path $repoRoot "env-templates\railway-cli.env"
  if (-not (Test-Path $cliEnv)) { return $false }
  foreach ($line in Get-Content $cliEnv) {
    if ($line -match '^\s*RAILWAY_TOKEN\s*=\s*(\S+)') {
      $env:RAILWAY_TOKEN = $Matches[1].Trim()
      return (Test-RailwayAuth)
    }
  }
  return $false
}

Write-Host "`n=== Railway marketing deploy ===" -ForegroundColor Cyan

if (-not (Test-RailwayAuth)) {
  if (-not (Load-CliToken)) {
    Write-Host "Not authenticated. Run:  railway login" -ForegroundColor Red
    Write-Host "Or save token to env-templates/railway-cli.env" -ForegroundColor Yellow
    exit 1
  }
}

$who = railway whoami 2>&1
Write-Host "Logged in as: $who" -ForegroundColor Green

Write-Host "`nLinking project graceful-surprise..." -ForegroundColor Yellow
railway link --project $ProjectId --environment $EnvironmentId 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
  Write-Host "railway link failed" -ForegroundColor Red
  exit 1
}

Write-Host "`n=== Sync env vars ===" -ForegroundColor Yellow
$syncArgs = @("-ExecutionPolicy", "Bypass", "-File", (Join-Path $repoRoot "scripts\railway-sync-web-main-marketing-env.ps1"))
if ($DryRun) { $syncArgs += "-DryRun" }
& powershell @syncArgs
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "`n=== Services in production ===" -ForegroundColor Yellow
railway service status --all --environment production 2>&1

Write-Host "`n=== Setup cron services (root dirs + deploy) ===" -ForegroundColor Yellow
$setupArgs = @("scripts\railway-setup-marketing-crons.mjs")
if ($DryRun) { $setupArgs += "--dry-run" }
if ($SkipRedeploy) { $setupArgs += "--skip-deploy" }
node @setupArgs
if ($LASTEXITCODE -ne 0) {
  Write-Host "railway-setup-marketing-crons.mjs failed (auth or API error)" -ForegroundColor Yellow
}

Write-Host "`n=== Cron services check ===" -ForegroundColor Yellow
$statusJson = railway service status --all --environment production --json 2>&1
$existing = @()
if ($LASTEXITCODE -eq 0 -and $statusJson) {
  try {
    $parsed = $statusJson | ConvertFrom-Json
    if ($parsed -is [array]) {
      $existing = $parsed | ForEach-Object { $_.name }
    } elseif ($parsed.services) {
      $existing = $parsed.services | ForEach-Object { $_.name }
    }
  } catch {
  }
}

foreach ($cron in $CronServices) {
  if ($existing -contains $cron) {
    Write-Host "  OK  $cron" -ForegroundColor Green
  } else {
    Write-Host "  MISSING  $cron" -ForegroundColor Yellow
    Write-Host "    Create in Railway dashboard: New Service -> GitHub repo -> root: services/$cron" -ForegroundColor DarkGray
    Write-Host "    Or: railway add --service $cron --repo UseniSajor/kealee-platform-v10" -ForegroundColor DarkGray
    if (-not $DryRun) {
      railway add --service $cron --json 2>&1 | Out-Null
      if ($LASTEXITCODE -eq 0) {
        Write-Host "    Created service shell (set root directory in dashboard)" -ForegroundColor Cyan
      }
    }
  }
}

if (-not $SkipRedeploy) {
  Write-Host "`n=== Redeploy web-main ===" -ForegroundColor Yellow
  if ($DryRun) {
    Write-Host "  [dry-run] railway redeploy --service web-main -y" -ForegroundColor DarkGray
  } else {
    railway redeploy --service web-main -y 2>&1
  }
}

Write-Host "`n=== E2E smoke test ===" -ForegroundColor Yellow
$cronSecret = $null
$kv = railway variable list --service web-main --environment production --kv 2>&1
if ($LASTEXITCODE -eq 0) {
  $m = [regex]::Match(($kv -join "`n"), 'CRON_SECRET=(\S+)')
  if ($m.Success) { $cronSecret = $m.Groups[1].Value }
}
if ($cronSecret) { $env:CRON_SECRET = $cronSecret }
Push-Location (Join-Path $repoRoot "apps\web-main")
pnpm run test:marketing-e2e
$e2eExit = $LASTEXITCODE
Pop-Location

Write-Host "`nDone." -ForegroundColor Green
exit $e2eExit
