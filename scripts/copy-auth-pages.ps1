# Copy authentication pages to all client-facing apps (PowerShell)

$sourceApp = "apps/m-project-owner"
$apps = @(
  "apps/m-ops-services",
  "apps/m-architect",
  "apps/m-permits-inspections"
)

Write-Host "Copying authentication pages to all apps..." -ForegroundColor Cyan
Write-Host ""

foreach ($app in $apps) {
  if (-not (Test-Path $app)) {
    Write-Host "Skipping $app (not found)" -ForegroundColor Yellow
    continue
  }

  Write-Host "Copying to $app..." -ForegroundColor Gray

  # Create directories
  New-Item -ItemType Directory -Force -Path "$app/app/login" | Out-Null
  New-Item -ItemType Directory -Force -Path "$app/app/signup" | Out-Null
  New-Item -ItemType Directory -Force -Path "$app/app/auth/verify-email" | Out-Null
  New-Item -ItemType Directory -Force -Path "$app/app/auth/forgot-password" | Out-Null
  New-Item -ItemType Directory -Force -Path "$app/app/auth/reset-password" | Out-Null

  # Copy files
  Copy-Item "$sourceApp/app/login/page.tsx" "$app/app/login/page.tsx" -Force
  Copy-Item "$sourceApp/app/signup/page.tsx" "$app/app/signup/page.tsx" -Force
  Copy-Item "$sourceApp/app/auth/verify-email/page.tsx" "$app/app/auth/verify-email/page.tsx" -Force
  Copy-Item "$sourceApp/app/auth/forgot-password/page.tsx" "$app/app/auth/forgot-password/page.tsx" -Force
  Copy-Item "$sourceApp/app/auth/reset-password/page.tsx" "$app/app/auth/reset-password/page.tsx" -Force
  Copy-Item "$sourceApp/middleware.ts" "$app/middleware.ts" -Force

  Write-Host "Copied auth pages to $app" -ForegroundColor Green
}

Write-Host ""
Write-Host "All authentication pages copied!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Update package.json files to include @kealee/auth"
Write-Host "  2. Set environment variables (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)"
Write-Host "  3. Test authentication flows"
