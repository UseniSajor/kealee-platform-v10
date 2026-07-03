# Complete deployment setup - gets credentials and runs automation

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                  KEALEE HERO VIDEO DEPLOYMENT SETUP                ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Step 1: Get Replicate token
Write-Host "1️⃣  REPLICATE API TOKEN" -ForegroundColor Green
$replicate = Get-Content apps/web-main/.env.local | Select-String "REPLICATE_API_TOKEN" | ForEach-Object { $_ -replace ".*=", "" }
if ($replicate) {
  Write-Host "   ✅ Found: $($replicate.Substring(0,10))..." -ForegroundColor Green
  $env:REPLICATE_API_TOKEN = $replicate
} else {
  Write-Host "   ❌ Not found in .env.local" -ForegroundColor Red
  exit 1
}

Write-Host ""

# Step 2: Get AWS credentials
Write-Host "2️⃣  AWS CREDENTIALS" -ForegroundColor Green
Write-Host "   Get from: https://console.aws.amazon.com/iam/home#/security_credentials"
Write-Host ""

$aws_key = Read-Host "   Enter AWS_ACCESS_KEY_ID"
$aws_secret = Read-Host "   Enter AWS_SECRET_ACCESS_KEY" -AsSecureString
$aws_secret = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToCoTaskMemUnicode($aws_secret))

$env:AWS_ACCESS_KEY_ID = $aws_key
$env:AWS_SECRET_ACCESS_KEY = $aws_secret

Write-Host "   ✅ AWS credentials set" -ForegroundColor Green
Write-Host ""

# Step 3: Get Railway token
Write-Host "3️⃣  RAILWAY API TOKEN" -ForegroundColor Green
Write-Host "   Get from: https://railway.app/account/tokens"
Write-Host ""

$railway_token = Read-Host "   Enter RAILWAY_TOKEN"
$env:RAILWAY_TOKEN = $railway_token
Write-Host "   ✅ Railway token set" -ForegroundColor Green
Write-Host ""

# Step 4: Get Railway project ID
Write-Host "4️⃣  RAILWAY PROJECT ID" -ForegroundColor Green
Write-Host "   Get from: https://railway.app/project/..."
Write-Host ""

$railway_project = Read-Host "   Enter RAILWAY_PROJECT_ID"
$env:RAILWAY_PROJECT_ID = $railway_project
Write-Host "   ✅ Railway project ID set" -ForegroundColor Green
Write-Host ""

# Step 5: Summary
Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "📋 CREDENTIALS SUMMARY" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "   ✅ Replicate API Token: Set" -ForegroundColor Green
Write-Host "   ✅ AWS Access Key ID: Set" -ForegroundColor Green
Write-Host "   ✅ AWS Secret Access Key: Set" -ForegroundColor Green
Write-Host "   ✅ Railway API Token: Set" -ForegroundColor Green
Write-Host "   ✅ Railway Project ID: Set" -ForegroundColor Green
Write-Host ""

Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🚀 RUNNING COMPLETE DEPLOYMENT" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Run deployment script
node deploy-hero-videos.js

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                    ✅ DEPLOYMENT COMPLETE                          ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
