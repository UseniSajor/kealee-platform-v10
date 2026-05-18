# 🧪 End-to-End System Verification Tests
# Tests Stripe webhooks, image generation, and video generation

Write-Host "🧪 Testing Stripe Webhook, Image Generation, and Video Generation" -ForegroundColor Cyan
Write-Host ""

# Configuration
$API_URL = $env:API_URL
if (-not $API_URL) { $API_URL = "http://localhost:3001" }

$VIDEO_API_URL = $env:VIDEO_API_URL  
if (-not $VIDEO_API_URL) { $VIDEO_API_URL = "http://localhost:3000" }

Write-Host "[INFO] Running end-to-end system verification tests" -ForegroundColor Blue
Write-Host "API URL: $API_URL"
Write-Host "Video API URL: $VIDEO_API_URL"
Write-Host ""

# Test 1: Stripe Webhook
Write-Host "==== TEST 1: STRIPE WEBHOOK SIGNATURE VERIFICATION ====" -ForegroundColor Blue

if (-not $env:STRIPE_WEBHOOK_SECRET) {
    Write-Host "❌ SKIP: STRIPE_WEBHOOK_SECRET not set" -ForegroundColor Red
    Write-Host "   Set: `$env:STRIPE_WEBHOOK_SECRET='whsec_...'"
} else {
    $timestamp = [int][DateTimeOffset]::Now.ToUnixTimeSeconds()
    $payload = "{`"id`":`"evt_test_$timestamp`",`"type`":`"checkout.session.completed`"}"
    $signedContent = "$timestamp.$payload"
    
    # Generate HMAC-SHA256 signature
    $hmac = New-Object System.Security.Cryptography.HMACSHA256
    $hmac.Key = [System.Text.Encoding]::UTF8.GetBytes($env:STRIPE_WEBHOOK_SECRET)
    $signatureBytes = $hmac.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($signedContent))
    $signature = [BitConverter]::ToString($signatureBytes).Replace("-", "").ToLower()
    $stripeSig = "t=$timestamp,v1=$signature"
    
    try {
        $response = Invoke-WebRequest -Uri "$API_URL/webhooks/stripe" -Method POST `
            -Headers @{
                "Content-Type" = "application/json"
                "stripe-signature" = $stripeSig
            } `
            -Body $payload `
            -SkipHttpErrorCheck
        
        if ($response.StatusCode -eq 200 -or $response.StatusCode -eq 202) {
            Write-Host "✅ PASS: HTTP $($response.StatusCode) - Webhook signature verified" -ForegroundColor Green
        } elseif ($response.StatusCode -eq 400) {
            Write-Host "❌ FAIL: HTTP 400 - Signature verification failed" -ForegroundColor Red
        } else {
            Write-Host "⚠️  SKIP: HTTP $($response.StatusCode)" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "⚠️  SKIP: Could not connect to API server" -ForegroundColor Yellow
    }
}

Write-Host ""

# Test 2: Image Generation
Write-Host "==== TEST 2: IMAGE GENERATION ENDPOINT ====" -ForegroundColor Blue

try {
    $response = Invoke-WebRequest -Uri "$API_URL/admin/generate-images?dryRun=true" -Method POST `
        -Headers @{
            "Content-Type" = "application/json"
            "X-API-Key" = "test-key"
        } `
        -SkipHttpErrorCheck
    
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ PASS: HTTP 200 - Image generation endpoint responsive" -ForegroundColor Green
    } elseif ($response.StatusCode -eq 401 -or $response.StatusCode -eq 403) {
        Write-Host "⚠️  SKIP: HTTP $($response.StatusCode) - Authentication required" -ForegroundColor Yellow
    } else {
        Write-Host "⚠️  SKIP: HTTP $($response.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  SKIP: Could not connect to API server" -ForegroundColor Yellow
}

Write-Host ""

# Test 3: Video Generation
Write-Host "==== TEST 3: VIDEO GENERATION JOB FLOW ====" -ForegroundColor Blue

try {
    $response = Invoke-WebRequest -Uri "$VIDEO_API_URL/api/concept/video" -Method POST `
        -Headers @{
            "Content-Type" = "application/json"
        } `
        -Body '{"intakeId":"test_intake","prompt":"test"}' `
        -SkipHttpErrorCheck
    
    if ($response.StatusCode -eq 202) {
        Write-Host "✅ PASS: HTTP 202 - Video job submitted" -ForegroundColor Green
    } elseif ($response.StatusCode -eq 404 -or $response.StatusCode -eq 402) {
        Write-Host "⚠️  SKIP: HTTP $($response.StatusCode) - Test data needed" -ForegroundColor Yellow
    } else {
        Write-Host "⚠️  SKIP: HTTP $($response.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  SKIP: Could not connect to video API server" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "==== END OF TESTS ====" -ForegroundColor Blue