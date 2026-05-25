# Verify SUPABASE_SERVICE_ROLE_KEY on kealee-web-main + kealee-portal-owner (Vercel API)
# Prereq: $env:VERCEL_TOKEN from https://vercel.com/account/tokens

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

if (-not $env:VERCEL_TOKEN) {
  Write-Host ""
  Write-Host "VERCEL_TOKEN not set." -ForegroundColor Red
  Write-Host "  1. https://vercel.com/account/tokens" -ForegroundColor Gray
  Write-Host "  2. `$env:VERCEL_TOKEN = 'your_token'" -ForegroundColor Gray
  Write-Host "  3. pnpm run verify:vercel-supabase" -ForegroundColor Gray
  Write-Host ""
  Write-Host "Manual: Vercel -> kealee-web-main -> Settings -> Environment Variables" -ForegroundColor Yellow
  Write-Host "  SUPABASE_SERVICE_ROLE_KEY -> Production + Preview" -ForegroundColor Yellow
  exit 2
}

node scripts/verify-vercel-supabase-service-role.mjs
exit $LASTEXITCODE
