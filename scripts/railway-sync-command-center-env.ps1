# Sync Command Center env vars to Railway (command-center service)
# Prereqs: npm i -g @railway/cli && railway login && railway link (repo root or service)

param(
  [string]$Service = "command-center",
  [string]$Environment = "production",
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path $PSScriptRoot -Parent

function Get-RailwayTokenCandidatesFromRepo {
  $candidates = [System.Collections.Generic.List[string]]::new()
  if ($env:RAILWAY_TOKEN) { $candidates.Add($env:RAILWAY_TOKEN) }

  $cliEnv = Join-Path $repoRoot "env-templates\railway-cli.env"
  if (Test-Path $cliEnv) {
    foreach ($line in Get-Content $cliEnv) {
      if ($line -match '^\s*RAILWAY_TOKEN\s*=\s*(\S+)') { $candidates.Add($Matches[1].Trim()) }
    }
  }

  $deployBat = Join-Path $repoRoot "deploy.bat"
  if (Test-Path $deployBat) {
    Select-String -Path $deployBat -Pattern 'RAILWAY_TOKEN=([a-f0-9-]{36})' -AllMatches | ForEach-Object {
      $_.Matches | ForEach-Object { $candidates.Add($_.Groups[1].Value) }
    }
  }

  $railwayTxt = Join-Path $repoRoot "Railway Feb 2026.txt"
  if (Test-Path $railwayTxt) {
    $raw = Get-Content $railwayTxt -Raw
    [regex]::Matches($raw, '[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}') | ForEach-Object {
      $candidates.Add($_.Value)
    }
  }

  return $candidates | Select-Object -Unique
}

function Resolve-RailwayToken {
  foreach ($t in (Get-RailwayTokenCandidatesFromRepo)) {
    $env:RAILWAY_TOKEN = $t
    $null = railway whoami 2>&1
    if ($LASTEXITCODE -eq 0) { return $t }
  }
  $env:RAILWAY_TOKEN = $null
  return $null
}

$varKeys = @(
  "NODE_ENV",
  "NEXT_PUBLIC_API_URL",
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "CRON_SECRET",
  "KEALEE_OPS_SECRET"
)

$sources = @(
  (Join-Path $repoRoot "apps\command-center\.env.local")
  (Join-Path $repoRoot ".env.local")
  (Join-Path $repoRoot "apps\web-main\.env.local")
  (Join-Path $repoRoot "services\api\.env")
  (Join-Path $repoRoot "services\api\.env.local")
  (Join-Path $repoRoot "set-vercel-envs.sh")
  (Join-Path $repoRoot "set-env-vars.ps1")
)

$vars = @{
  NODE_ENV = "production"
  NEXT_PUBLIC_API_URL = "https://api.kealee.com"
  NEXT_PUBLIC_SITE_URL = "https://kealee.com"
}

foreach ($src in $sources) {
  if (-not (Test-Path $src)) { continue }
  foreach ($line in Get-Content $src) {
    if ($line -match '^\s*#' -or [string]::IsNullOrWhiteSpace($line)) { continue }
    if ($line -match '^([A-Z0-9_]+)=(.*)$' -and $varKeys -contains $matches[1]) {
      $val = $matches[2].Trim().Trim('"').Trim("'")
      if ($val) { $vars[$matches[1]] = $val }
    }
    if ($line -match '^([A-Z0-9_]+)\s*=\s*"?([^"]+)"?\s*$' -and $varKeys -contains $matches[1]) {
      $val = $matches[2].Trim()
      if ($val -and -not $vars[$matches[1]]) { $vars[$matches[1]] = $val }
    }
  }
}

if (-not $vars["KEALEE_OPS_SECRET"] -and $vars["CRON_SECRET"]) {
  $vars["KEALEE_OPS_SECRET"] = $vars["CRON_SECRET"]
}

if ($Environment -eq "production") {
  if (-not $vars["NEXT_PUBLIC_API_URL"] -or $vars["NEXT_PUBLIC_API_URL"] -match 'localhost|127\.0\.0\.1') {
    $vars["NEXT_PUBLIC_API_URL"] = "https://api.kealee.com"
  }
  $vars["NODE_ENV"] = "production"
  if (-not $vars["NEXT_PUBLIC_SITE_URL"]) {
    $vars["NEXT_PUBLIC_SITE_URL"] = "https://kealee.com"
  }
}

Write-Host ""
Write-Host "Command Center → Railway ($Service / $Environment)" -ForegroundColor Cyan
Write-Host ""

$missing = @()
foreach ($k in @("NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY", "CRON_SECRET")) {
  if (-not $vars[$k]) { $missing += $k }
}

if ($missing.Count -gt 0) {
  Write-Host "Missing locally (add to apps/command-center/.env.local):" -ForegroundColor Yellow
  $missing | ForEach-Object { Write-Host "  - $_" }
  Write-Host ""
}

foreach ($k in $varKeys) {
  if (-not $vars[$k]) { continue }
  $display = if ($k -match 'SECRET|KEY|TOKEN') { "***" } else { $vars[$k] }
  Write-Host "  $k = $display"
}

if ($DryRun) {
  Write-Host ""
  Write-Host "Dry run - no Railway changes." -ForegroundColor Yellow
  exit 0
}

try {
  $null = Get-Command railway -ErrorAction Stop
} catch {
  Write-Host "Railway CLI not available. Install: npm i -g @railway/cli" -ForegroundColor Red
  exit 1
}

$token = Resolve-RailwayToken
if ($token) {
  Write-Host "Railway token OK (repo: env-templates/railway-cli.env, deploy.bat, Railway Feb 2026.txt)" -ForegroundColor Gray
} else {
  Write-Host "No valid RAILWAY_TOKEN in repo. Add env-templates/railway-cli.env (see railway-cli.env.example)" -ForegroundColor Red
  Write-Host "  New token: https://railway.com/account/tokens" -ForegroundColor Yellow
  exit 1
}

$who = railway whoami 2>&1
Write-Host "Railway: $who" -ForegroundColor Gray

Write-Host ""
Write-Host "Setting variables on Railway..." -ForegroundColor Green

$setArgs = @()
foreach ($k in $varKeys) {
  if ($vars[$k]) { $setArgs += "${k}=$($vars[$k])" }
}

if ($setArgs.Count -eq 0) {
  Write-Host "Nothing to set." -ForegroundColor Yellow
  exit 1
}

& railway variable set @setArgs -s $Service -e $Environment
if ($LASTEXITCODE -ne 0) {
  Write-Host "Failed. Try: cd apps/command-center; railway link" -ForegroundColor Red
  exit $LASTEXITCODE
}

Write-Host ""
Write-Host "Done. Redeploy command-center on Railway to apply." -ForegroundColor Green
Write-Host "Verify: railway variable list -s $Service -e $Environment" -ForegroundColor Gray
