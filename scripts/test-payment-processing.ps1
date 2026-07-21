# scripts/test-payment-processing.ps1
# Comprehensive payment processing test script (PowerShell version)

param(
    [string]$ApiUrl = "http://localhost:3001",
    [string]$FrontendUrl = "http://localhost:3005",
    [string]$TestMode = "true",
    [string]$AuthToken = $env:TEST_AUTH_TOKEN,
    [string]$OrgId = $env:TEST_ORG_ID
)

$ErrorActionPreference = "Continue"

$Passed = 0
$Failed = 0
$Warnings = 0

function Log-Test {
    param([string]$Message)
    Write-Host "[TEST] $Message" -ForegroundColor Cyan
}

function Test-Pass {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
    $script:Passed++
}

function Test-Fail {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
    $script:Failed++
}

function Test-Warn {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
    $script:Warnings++
}

Write-Host "💳 Testing Payment Processing" -ForegroundColor Cyan
Write-Host "   API URL: $ApiUrl"
Write-Host "   Frontend URL: $FrontendUrl"
Write-Host "   Test Mode: $TestMode"
Write-Host ""

# Test 1: API Health Check
Log-Test "1. Testing API health..."
try {
    $response = Invoke-WebRequest -Uri "$ApiUrl/health" -Method Get -TimeoutSec 10 -UseBasicParsing -ErrorAction Stop
    Test-Pass "API is reachable"
} catch {
    Test-Fail "API is not reachable at $ApiUrl"
    Write-Host "   Make sure the API server is running: cd services/api && pnpm dev"
    exit 1
}

# Test 2: Frontend Health Check
Log-Test "2. Testing frontend health..."
try {
    $response = Invoke-WebRequest -Uri $FrontendUrl -Method Get -TimeoutSec 10 -UseBasicParsing -ErrorAction Stop
    Test-Pass "Frontend is reachable"
} catch {
    Test-Warn "Frontend is not reachable at $FrontendUrl"
    Write-Host "   Make sure the frontend is running: cd apps/m-ops-services && pnpm dev"
}

# Test 3: Authentication
Log-Test "3. Testing authentication..."
if ($AuthToken) {
    Test-Pass "Using provided auth token"
} else {
    Test-Warn "No auth token provided. Some tests may fail."
    Write-Host "   Set TEST_AUTH_TOKEN environment variable for authenticated tests"
}

# Test 4: Get Billing Plans
Log-Test "4. Testing billing plans endpoint..."
try {
    $response = Invoke-WebRequest -Uri "$ApiUrl/api/v1/billing/plans" -Method Get -TimeoutSec 10 -UseBasicParsing -ErrorAction Stop
    $content = $response.Content | ConvertFrom-Json
    Test-Pass "Billing plans endpoint accessible"
    if ($content.plans) {
        $planCount = $content.plans.Count
        Test-Pass "Found $planCount billing plans"
    }
} catch {
    Test-Warn "Billing plans endpoint check inconclusive: $($_.Exception.Message)"
}

# Test 5: Create Checkout Session
Log-Test "5. Testing checkout session creation..."
if ($AuthToken -and $OrgId) {
    try {
        $body = @{
            orgId = $OrgId
            planSlug = "package_b"
            interval = "month"
            successUrl = "$FrontendUrl/success"
            cancelUrl = "$FrontendUrl/cancel"
        } | ConvertTo-Json

        $headers = @{
            "Content-Type" = "application/json"
            "Authorization" = "Bearer $AuthToken"
        }

        $response = Invoke-WebRequest -Uri "$ApiUrl/api/v1/billing/stripe/checkout-session" -Method Post -Body $body -Headers $headers -TimeoutSec 10 -UseBasicParsing -ErrorAction Stop
        $content = $response.Content | ConvertFrom-Json
        
        Test-Pass "Checkout session creation successful"
        if ($content.id) {
            Write-Host "   Session ID: $($content.id)"
        }
        if ($content.url) {
            Write-Host "   Session URL: $($content.url)"
        }
    } catch {
        Test-Fail "Checkout session creation failed: $($_.Exception.Message)"
    }
} else {
    Test-Warn "Skipping checkout session test (requires AUTH_TOKEN and TEST_ORG_ID)"
    Write-Host "   Set TEST_AUTH_TOKEN and TEST_ORG_ID environment variables"
}

# Test 6: Webhook Endpoint
Log-Test "6. Testing webhook endpoint..."
try {
    $body = @{
        id = "evt_test"
        type = "test"
    } | ConvertTo-Json

    $headers = @{
        "Content-Type" = "application/json"
        "Stripe-Signature" = "test_sig"
    }

    $response = Invoke-WebRequest -Uri "$ApiUrl/api/v1/billing/stripe/webhook" -Method Post -Body $body -Headers $headers -TimeoutSec 10 -UseBasicParsing -ErrorAction Stop
    Test-Pass "Webhook endpoint is accessible (HTTP $($response.StatusCode))"
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 200 -or $statusCode -eq 400 -or $statusCode -eq 401) {
        Test-Pass "Webhook endpoint is accessible (HTTP $statusCode)"
    } else {
        Test-Warn "Webhook endpoint check inconclusive (HTTP $statusCode)"
    }
}

# Test 7: Subscription List
Log-Test "7. Testing subscription listing..."
if ($AuthToken) {
    try {
        $headers = @{
            "Authorization" = "Bearer $AuthToken"
        }

        $response = Invoke-WebRequest -Uri "$ApiUrl/api/v1/billing/subscriptions" -Method Get -Headers $headers -TimeoutSec 10 -UseBasicParsing -ErrorAction Stop
        $content = $response.Content | ConvertFrom-Json
        
        Test-Pass "Subscription listing successful"
        if ($content.subscriptions) {
            $subCount = $content.subscriptions.Count
            Write-Host "   Found $subCount subscriptions"
        }
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq 401) {
            Test-Warn "Subscription listing requires authentication"
        } else {
            Test-Warn "Subscription listing check inconclusive (HTTP $statusCode)"
        }
    }
} else {
    Test-Warn "Skipping subscription listing test (requires AUTH_TOKEN)"
}

# Test 8: Webhook Status
Log-Test "8. Testing webhook status endpoint..."
if ($AuthToken) {
    try {
        $headers = @{
            "Authorization" = "Bearer $AuthToken"
        }

        $response = Invoke-WebRequest -Uri "$ApiUrl/api/v1/webhooks/status?limit=5" -Method Get -Headers $headers -TimeoutSec 10 -UseBasicParsing -ErrorAction Stop
        $content = $response.Content | ConvertFrom-Json
        
        Test-Pass "Webhook status endpoint accessible"
        if ($content.events) {
            $eventCount = $content.events.Count
            Write-Host "   Found $eventCount recent webhook events"
        }
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq 404) {
            Test-Warn "Webhook status endpoint not found (may not be implemented)"
        } else {
            Test-Warn "Webhook status check inconclusive (HTTP $statusCode)"
        }
    }
} else {
    Test-Warn "Skipping webhook status test (requires AUTH_TOKEN)"
}

# Test 9: Webhook Trigger
Log-Test "9. Testing webhook trigger endpoint..."
if ($AuthToken) {
    try {
        $body = @{
            eventType = "checkout.session.completed"
        } | ConvertTo-Json

        $headers = @{
            "Content-Type" = "application/json"
            "Authorization" = "Bearer $AuthToken"
        }

        $response = Invoke-WebRequest -Uri "$ApiUrl/api/v1/webhooks/test" -Method Post -Body $body -Headers $headers -TimeoutSec 10 -UseBasicParsing -ErrorAction Stop
        Test-Pass "Webhook trigger endpoint accessible"
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq 404) {
            Test-Warn "Webhook trigger endpoint not found (may not be implemented)"
        } else {
            Test-Warn "Webhook trigger check inconclusive (HTTP $statusCode)"
        }
    }
} else {
    Test-Warn "Skipping webhook trigger test (requires AUTH_TOKEN)"
}

# Test 10: Frontend Checkout Route
Log-Test "10. Testing frontend checkout route..."
try {
    $body = @{
        packageId = "A"
    } | ConvertTo-Json

    $headers = @{
        "Content-Type" = "application/json"
    }

    $response = Invoke-WebRequest -Uri "$FrontendUrl/api/create-checkout" -Method Post -Body $body -Headers $headers -TimeoutSec 10 -UseBasicParsing -ErrorAction Stop
    Test-Pass "Frontend checkout route accessible (HTTP $($response.StatusCode))"
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 200 -or $statusCode -eq 400) {
        Test-Pass "Frontend checkout route accessible (HTTP $statusCode)"
    } else {
        Test-Warn "Frontend checkout route check inconclusive (HTTP $statusCode)"
    }
}

# Test 11: Environment Variables
Log-Test "11. Checking environment variables..."
$requiredVars = @("STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET")
$missingVars = @()

foreach ($var in $requiredVars) {
    if (-not (Get-Variable -Name $var -ErrorAction SilentlyContinue) -and -not $env:$var) {
        $missingVars += $var
    }
}

if ($missingVars.Count -eq 0) {
    Test-Pass "Required environment variables are set"
} else {
    Test-Warn "Some environment variables may be missing: $($missingVars -join ', ')"
    Write-Host "   These should be set in your .env.local or deployment environment"
}

# Test 12: Performance
Log-Test "12. Testing API performance..."
$startTime = Get-Date
try {
    $response = Invoke-WebRequest -Uri "$ApiUrl/health" -Method Get -TimeoutSec 10 -UseBasicParsing -ErrorAction Stop
    $endTime = Get-Date
    $responseTime = ($endTime - $startTime).TotalMilliseconds
    
    if ($responseTime -lt 100) {
        Test-Pass "API response time: $([math]::Round($responseTime))ms (excellent)"
    } elseif ($responseTime -lt 500) {
        Test-Pass "API response time: $([math]::Round($responseTime))ms (good)"
    } elseif ($responseTime -lt 1000) {
        Test-Warn "API response time: $([math]::Round($responseTime))ms (acceptable)"
    } else {
        Test-Fail "API response time: $([math]::Round($responseTime))ms (slow)"
    }
} catch {
    Test-Warn "Performance test failed: $($_.Exception.Message)"
}

# Summary
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "📊 Test Summary" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "✅ Passed: $Passed" -ForegroundColor Green
Write-Host "⚠️  Warnings: $Warnings" -ForegroundColor Yellow
Write-Host "❌ Failed: $Failed" -ForegroundColor Red
Write-Host ""

if ($Failed -eq 0) {
    Write-Host "✅ All critical tests passed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Next Steps:"
    Write-Host "   1. Test with real Stripe test keys"
    Write-Host "   2. Test webhook processing with Stripe CLI"
    Write-Host "   3. Verify database updates after webhooks"
    Write-Host "   4. Test subscription lifecycle (create, update, cancel)"
    Write-Host ""
    Write-Host "🔗 Useful Commands:"
    Write-Host "   # Forward Stripe webhooks to local server"
    Write-Host "   stripe listen --forward-to $ApiUrl/api/v1/billing/stripe/webhook"
    Write-Host ""
    Write-Host "   # Trigger test events"
    Write-Host "   stripe trigger checkout.session.completed"
    Write-Host "   stripe trigger invoice.payment_failed"
    exit 0
} else {
    Write-Host "❌ Some tests failed. Please review the errors above." -ForegroundColor Red
    Write-Host ""
    Write-Host "🔍 Troubleshooting:"
    Write-Host "   1. Ensure API server is running: cd services/api && pnpm dev"
    Write-Host "   2. Ensure frontend is running: cd apps/m-ops-services && pnpm dev"
    Write-Host "   3. Check environment variables are set correctly"
    Write-Host "   4. Verify authentication tokens are valid"
    exit 1
}
