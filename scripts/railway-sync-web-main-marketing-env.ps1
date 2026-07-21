# Sync web-main + API + marketing cron env vars to Railway (production).
# Prereq: railway login && railway link (repo root)
#
# Usage:
#   .\scripts\railway-sync-web-main-marketing-env.ps1
#   .\scripts\railway-sync-web-main-marketing-env.ps1 -DryRun
#   .\scripts\railway-sync-web-main-marketing-env.ps1 -Service web-main

param(
  [string]$WebMainService = "web-main",
  [string]$ApiService = "kealee-platform-v10",
  [string[]]$CronServices = @(
    "marketing-cron-lead-scoring",
    "marketing-cron-sequences",
    "marketing-cron-requalify-cold",
    "marketing-cron-parcel-enrichment",
    "marketing-cron-parcel-outreach",
    "marketing-cron-marketing-drip"
  ),
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

function Test-RailwayCliAuth {
  try {
    $null = railway status 2>&1
    return $LASTEXITCODE -eq 0
  } catch {
    return $false
  }
}

function Resolve-RailwayToken {
  foreach ($t in (Get-RailwayTokenCandidatesFromRepo)) {
    $env:RAILWAY_TOKEN = $t
    if (Test-RailwayCliAuth) { return $t }
  }
  $env:RAILWAY_TOKEN = $null
  return $null
}

function Parse-EnvFile([string]$path) {
  $map = @{}
  if (-not (Test-Path $path)) { return $map }
  foreach ($line in Get-Content $path) {
    if ($line -match '^\s*#' -or $line -notmatch '=') { continue }
    $idx = $line.IndexOf('=')
    if ($idx -lt 1) { continue }
    $k = $line.Substring(0, $idx).Trim()
    $v = $line.Substring($idx + 1).Trim().Trim('"')
    if ($v -and $v -notmatch '^(your_|sk-ant-api03-your|re_your|price_xxx|\.\.\.)') {
      $map[$k] = $v
    }
  }
  return $map
}

function Parse-SetEnvPs1([string]$path) {
  $map = @{}
  if (-not (Test-Path $path)) { return $map }
  $content = Get-Content $path -Raw
  [regex]::Matches($content, '"([A-Z0-9_]+)"\s*=\s*"([^"]*)"') | ForEach-Object {
    $map[$_.Groups[1].Value] = $_.Groups[2].Value
  }
  return $map
}

# Defaults for production marketing launch
$vars = [ordered]@{
  NODE_ENV = "production"
  NEXT_PUBLIC_APP_ENV = "production"
  NEXT_PUBLIC_APP_URL = "https://kealee.com"
  NEXT_PUBLIC_API_URL = "https://api.kealee.com"
  INTERNAL_API_URL = "https://api.kealee.com"
  NEXT_PUBLIC_OWNER_PORTAL_URL = "https://owner.kealee.com"
  NEXT_PUBLIC_SITE_URL = "https://kealee.com"
  APP_URL = "https://kealee.com"
  KEALEE_V30_ENABLED = "true"
  NEXT_PUBLIC_KEALEE_V30_ENABLED = "true"
  NEXT_PUBLIC_KEALEE_PHONE_DISPLAY = "(301) 575-8777"
  NEXT_PUBLIC_KEALEE_PHONE_E164 = "+13015758777"
  SUPABASE_AUTH_REDIRECT_URL = "https://kealee.com/auth/callback"
  ALLOW_ANONYMOUS_EDITOR = "true"
  PARCEL_USE_LOCAL_ASSESSOR = "true"
}

$sources = @(
  (Join-Path $repoRoot "set-env-vars.ps1")
  (Join-Path $repoRoot "apps\web-main\railway.env.example")
  (Join-Path $repoRoot "apps\web-main\.env.local")
  (Join-Path $repoRoot "apps\web-main\.env.verify")
  (Join-Path $repoRoot "services\api\.env")
  (Join-Path $repoRoot "services\api\.env.local")
  (Join-Path $repoRoot "railway-env-paste-web-main.txt")
)

foreach ($src in $sources) {
  if (-not (Test-Path $src)) { continue }
  if ($src.EndsWith('.ps1')) {
    foreach ($kv in (Parse-SetEnvPs1 $src).GetEnumerator()) { $vars[$kv.Key] = $kv.Value }
  } else {
    foreach ($kv in (Parse-EnvFile $src).GetEnumerator()) { $vars[$kv.Key] = $kv.Value }
  }
}

# Map SUPABASE_URL -> NEXT_PUBLIC_* when only server keys exist
if (-not $vars['NEXT_PUBLIC_SUPABASE_URL'] -and $vars['SUPABASE_URL']) {
  $vars['NEXT_PUBLIC_SUPABASE_URL'] = $vars['SUPABASE_URL']
}
if (-not $vars['NEXT_PUBLIC_SUPABASE_ANON_KEY'] -and $vars['SUPABASE_ANON_KEY']) {
  $vars['NEXT_PUBLIC_SUPABASE_ANON_KEY'] = $vars['SUPABASE_ANON_KEY']
}

if (-not $vars['CRON_SECRET']) {
  $bytes = New-Object byte[] 32
  [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
  $vars['CRON_SECRET'] = ([BitConverter]::ToString($bytes) -replace '-', '').ToLower()
  Write-Host "Generated new CRON_SECRET (save this in your password manager)" -ForegroundColor Yellow
}

if (-not $vars['KEALEE_OPS_SECRET']) {
  $vars['KEALEE_OPS_SECRET'] = $vars['CRON_SECRET']
}

$token = Resolve-RailwayToken
if (-not $token) {
  Write-Host ""
  Write-Host "Railway CLI not authenticated." -ForegroundColor Red
  Write-Host "1. Run: railway login" -ForegroundColor Yellow
  Write-Host "2. Save token to env-templates/railway-cli.env (see railway-cli.env.example)" -ForegroundColor Yellow
  Write-Host "3. Re-run this script" -ForegroundColor Yellow
  Write-Host ""
  $pastePath = Join-Path $repoRoot "railway-env-paste-web-main.txt"
  $lines = $vars.GetEnumerator() | ForEach-Object { "$($_.Key)=$($_.Value)" }
  $lines | Set-Content -Path $pastePath -Encoding UTF8
  Write-Host "Wrote $($lines.Count) vars to $pastePath for manual Railway paste." -ForegroundColor Cyan
  exit 1
}

Write-Host "Railway authenticated. Syncing $($vars.Count) variables..." -ForegroundColor Green

function Ensure-RailwayLink {
  $status = railway status 2>&1
  if ($LASTEXITCODE -eq 0) { return }
  railway link --project 8187fcf6-9916-49aa-bc75-77407f83d319 --environment ff19d499-942b-4668-9a26-a21ecb20e349 2>&1 | Out-Null
}

Ensure-RailwayLink

function Get-RailwayVarMap([string]$service) {
  $map = @{}
  $raw = railway variable list --service $service --environment $Environment --kv 2>&1
  if ($LASTEXITCODE -ne 0) { return $map }
  foreach ($line in ($raw -split "`n")) {
    if ($line -match '^\s*([A-Z0-9_]+)\s*=\s*(.*)$') {
      $map[$Matches[1]] = $Matches[2].Trim()
    }
  }
  return $map
}

function Set-RailwayVars([string]$service, [hashtable]$toSet) {
  if ($toSet.Count -eq 0) {
    Write-Host "  $service - nothing to add" -ForegroundColor DarkGray
    return
  }
  Write-Host "  $service - setting $($toSet.Count) vars" -ForegroundColor Cyan
  foreach ($kv in $toSet.GetEnumerator()) {
    $display = if ($kv.Key -match 'SECRET|KEY|TOKEN|PASSWORD') { '***' } else { $kv.Value }
    if ($DryRun) {
      Write-Host "    [dry-run] $($kv.Key)=$display"
      continue
    }
    railway variable set "$($kv.Key)=$($kv.Value)" --service $service --environment $Environment --skip-deploys 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
      Write-Host "    failed: $($kv.Key)" -ForegroundColor Red
    }
  }
}

function Sync-Service([string]$service, [string[]]$onlyKeys) {
  $check = railway service status --service $service --environment $Environment 2>&1
  if ($LASTEXITCODE -ne 0) {
    Write-Host "  $service - service not found (create in Railway dashboard)" -ForegroundColor Yellow
    return
  }
  $existing = Get-RailwayVarMap $service
  $toSet = @{}
  foreach ($kv in $vars.GetEnumerator()) {
    if ($onlyKeys -and ($kv.Key -notin $onlyKeys)) { continue }
    if (-not $existing[$kv.Key] -or [string]::IsNullOrWhiteSpace($existing[$kv.Key])) {
      if (-not [string]::IsNullOrWhiteSpace($kv.Value)) { $toSet[$kv.Key] = $kv.Value }
    }
  }
  Set-RailwayVars $service $toSet
}

Write-Host "`n=== web-main ===" -ForegroundColor Yellow
Sync-Service $WebMainService $null

Write-Host "`n=== api (shared secrets) ===" -ForegroundColor Yellow
$apiKeys = @(
  'NODE_ENV', 'DATABASE_URL', 'SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY',
  'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'RESEND_API_KEY', 'ANTHROPIC_API_KEY',
  'CRON_SECRET', 'KEALEE_OPS_SECRET', 'REPLICATE_API_TOKEN', 'OPENAI_API_KEY'
)
Sync-Service $ApiService $apiKeys

Write-Host "`n=== marketing cron services ===" -ForegroundColor Yellow
$cronKeys = @('CRON_SECRET', 'APP_URL', 'NODE_ENV')
foreach ($cronSvc in $CronServices) {
  Sync-Service $cronSvc $cronKeys
}

Write-Host "`nDone. Redeploy web-main to pick up NEXT_PUBLIC_* build-time vars." -ForegroundColor Green
Write-Host "Create 3 cron services in Railway (if missing):" -ForegroundColor Cyan
foreach ($cronSvc in $CronServices) {
  Write-Host "  - $cronSvc -> root: services/$cronSvc -> Settings -> Cron Schedule (from railway.json)" -ForegroundColor White
}
Write-Host "`nRun smoke test: cd apps/web-main && pnpm run test:marketing-e2e" -ForegroundColor Cyan
