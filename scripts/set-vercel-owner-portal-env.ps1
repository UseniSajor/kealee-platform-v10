# Set NEXT_PUBLIC_OWNER_PORTAL_URL on kealee-web-main and kealee-portal-owner (Vercel team kealee)
# Prereq: $env:VERCEL_TOKEN from https://vercel.com/account/tokens

param(
  [string]$PortalUrl = "https://owner.kealee.com",
  [string[]]$Environments = @("production", "preview", "development")
)

$ErrorActionPreference = "Stop"
if (-not $env:VERCEL_TOKEN) {
  Write-Error "Set VERCEL_TOKEN first (do not commit tokens to git)."
}

$teamId = "team_0fysx1qe1pHEgsZ3mMpMQ7mF"
$projects = @(
  @{ name = "kealee-web-main"; id = "prj_RhuCu2Um0yeGa1MOO0OPIWYoEqeA" },
  @{ name = "kealee-portal-owner"; id = "prj_6WZI4qeXe5noLL00iUY6YnfnzLGt" }
)

function Set-VercelEnv($projectId, $key, $value, $target) {
  $body = @{
    key = $key
    value = $value
    type = "plain"
    target = @($target)
  } | ConvertTo-Json
  $uri = "https://api.vercel.com/v10/projects/$projectId/env?teamId=$teamId"
  Invoke-RestMethod -Method POST -Uri $uri -Headers @{ Authorization = "Bearer $env:VERCEL_TOKEN" } -Body $body -ContentType "application/json" | Out-Null
}

foreach ($proj in $projects) {
  Write-Host "Setting NEXT_PUBLIC_OWNER_PORTAL_URL on $($proj.name) ..."
  foreach ($envName in $Environments) {
    try {
      Set-VercelEnv $proj.id "NEXT_PUBLIC_OWNER_PORTAL_URL" $PortalUrl $envName
      Write-Host "  $envName OK"
    } catch {
      Write-Warning "  $envName : $($_.Exception.Message)"
    }
  }
}

Write-Host ""
Write-Host "Redeploy web-main and portal-owner, then fix Supabase redirect URLs:"
Write-Host "  docs/runbooks/owner-portal-auth-redirects.md"
