# 162 Image Generation Execution Script (PowerShell)
# Run this AFTER adding variables to Railway

$ErrorActionPreference = "Stop"

$ADMIN_KEY = "2963f446c99b44278525daff14bc7bac"
$API_URL = "https://arstic-kindness.up.railway.app"

Write-Host ""
Write-Host "KEALEE IMAGE GENERATION EXECUTION" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Step 1: Testing Authentication..." -ForegroundColor Yellow
Write-Host ""

try {
  $headers = @{ "X-API-Key" = $ADMIN_KEY }
  $authTest = Invoke-RestMethod -Uri "${API_URL}/admin/generate-images?dryRun=true" `
    -Method POST `
    -Headers $headers
  
  if ($authTest.message -like "*DRY RUN*") {
    Write-Host "Authentication successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Generation plan:" -ForegroundColor Green
    Write-Host "  Products: $($authTest.plan.productsCount)"
    Write-Host "  Total Images: $($authTest.plan.totalImages)"
    Write-Host "  Estimated Cost: `$$($authTest.plan.estimatedCost)"
    Write-Host ""
  } else {
    Write-Host "Unexpected response" -ForegroundColor Red
    $authTest | ConvertTo-Json | Write-Host
    exit 1
  }
} catch {
  Write-Host "Authentication failed!" -ForegroundColor Red
  Write-Host "Error: $_" -ForegroundColor Red
  Write-Host ""
  Write-Host "Troubleshooting:" -ForegroundColor Yellow
  Write-Host "1. Verify ADMIN_API_KEY in Railway = 2963f446c99b44278525daff14bc7bac"
  Write-Host "2. Wait 3-5 minutes for Railway redeploy"
  Write-Host "3. Check Railway logs for errors"
  exit 1
}

# ─────────────────────────────────────────────────────────────────────────────
# Step 2: Confirm Execution
# ─────────────────────────────────────────────────────────────────────────────

Write-Host "⚠️  ABOUT TO GENERATE 162 IMAGES (Cost: ~`$6.50)" -ForegroundColor Yellow
Write-Host ""
Write-Host "This will:"
Write-Host "  • Generate 27 products × 6 images each"
Write-Host "  • Take 30-45 minutes"
Write-Host "  • Cost approximately `$6.50 in DALL-E 3 credits"
Write-Host ""

$response = Read-Host "Continue? (y/n)"
if ($response -ne 'y' -and $response -ne 'Y') {
  Write-Host "Cancelled." -ForegroundColor Yellow
  exit 0
}

# ─────────────────────────────────────────────────────────────────────────────
# Step 3: Execute Full Generation
# ─────────────────────────────────────────────────────────────────────────────

Write-Host ""
Write-Host "Step 2: Executing image generation..." -ForegroundColor Yellow
Write-Host ""

try {
  $headers = @{ "X-API-Key" = $ADMIN_KEY }
  $execResponse = Invoke-RestMethod -Uri "${API_URL}/admin/generate-images" `
    -Method POST `
    -Headers $headers
  
  if ($execResponse.message -like "*queued*") {
    Write-Host "Image generation queued successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Response:" -ForegroundColor Green
    Write-Host "  Message: $($execResponse.message)"
    Write-Host "  Jobs: $($execResponse.jobs)"
    Write-Host ""
  } else {
    Write-Host "Failed to queue images" -ForegroundColor Red
    $execResponse | ConvertTo-Json | Write-Host
    exit 1
  }
} catch {
  Write-Host "Failed to execute generation" -ForegroundColor Red
  Write-Host "Error: $_" -ForegroundColor Red
  exit 1
}

# ─────────────────────────────────────────────────────────────────────────────
# Step 4: Monitor Progress
# ─────────────────────────────────────────────────────────────────────────────

Write-Host "Step 3: Monitoring progress (updates every 30 seconds)..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Target: 162 images"
Write-Host "Estimated time: 30-45 minutes"
Write-Host ""
Write-Host "Progress:"
Write-Host ""

$startTime = Get-Date
$lastCount = 0
$checkCount = 0

while ($true) {
  $checkCount += 1
  
  try {
    $headers = @{ "X-API-Key" = $ADMIN_KEY }
    $status = Invoke-RestMethod -Uri "${API_URL}/admin/generate-images/status" `
      -Method GET `
      -Headers $headers
    
    $totalImages = $status.totalImages
    
    if ($null -eq $totalImages) {
      Write-Host "Waiting for first images... (check $checkCount)"
    } else {
      $currentTime = Get-Date
      $elapsed = $currentTime - $startTime
      $elapsedMin = [int]$elapsed.TotalMinutes
      
      if ($totalImages -ne $lastCount) {
        Write-Host "  [$($elapsedMin)m] $totalImages/162 images" -ForegroundColor Cyan
        $lastCount = $totalImages
      }
      
      # Check if done
      if ($totalImages -ge 160) {
        Write-Host ""
        Write-Host "IMAGE GENERATION COMPLETE!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Final stats:" -ForegroundColor Green
        Write-Host "  Total Images: $($status.totalImages)"
        Write-Host "  Average per Product: $($status.averageImagesPerProduct)"
        Write-Host "  Completion: $($status.completionPercentage)"
        Write-Host ""
        Write-Host "162 images are now in the database and ready to display!" -ForegroundColor Green
        exit 0
      }
    }
  } catch {
    Write-Host "Error checking status: $_" -ForegroundColor Yellow
  }
  
  # Safety check - don't wait more than 2 hours
  $elapsed = (Get-Date) - $startTime
  if ($elapsed.TotalSeconds -gt 7200) {
    Write-Host ""
    Write-Host "Timeout (2 hours). Generation may still be in progress." -ForegroundColor Yellow
    Write-Host "Check Railway logs or run status command manually."
    exit 0
  }
  
  Start-Sleep -Seconds 30
}
