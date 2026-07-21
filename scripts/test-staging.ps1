# scripts/test-staging.ps1
# Test staging deployment for os-admin and other apps (PowerShell version)

param(
    [string]$StagingUrl = "https://admin.kealee.com",
    [string]$AppName = "os-admin"
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

Write-Host "🧪 Testing staging deployment" -ForegroundColor Cyan
Write-Host "   URL: $StagingUrl"
Write-Host "   App: $AppName"
Write-Host ""

# Test 1: Basic connectivity
Log-Test "1. Testing basic connectivity..."
try {
    $response = Invoke-WebRequest -Uri $StagingUrl -Method Get -TimeoutSec 30 -UseBasicParsing -ErrorAction Stop
    Test-Pass "Basic connectivity check passed"
} catch {
    Test-Fail "Basic connectivity check failed - site not reachable: $($_.Exception.Message)"
    exit 1
}

# Test 2: Check HTTP status
Log-Test "2. Testing page load..."
$statusCode = $response.StatusCode
if ($statusCode -eq 200 -or $statusCode -eq 301 -or $statusCode -eq 302) {
    Test-Pass "Page loads successfully (HTTP $statusCode)"
} else {
    Test-Fail "Page load failed (HTTP $statusCode)"
}

# Test 3: Check for Next.js assets
Log-Test "3. Testing JavaScript bundle..."
if ($response.Content -match "_next/static") {
    Test-Pass "Next.js static assets detected"
} else {
    Test-Warn "Next.js static assets not found (may be normal for some pages)"
}

# Test 4: Performance test
Log-Test "4. Testing response time..."
$startTime = Get-Date
try {
    $perfResponse = Invoke-WebRequest -Uri $StagingUrl -Method Get -TimeoutSec 30 -UseBasicParsing -ErrorAction Stop
    $endTime = Get-Date
    $responseTime = ($endTime - $startTime).TotalMilliseconds
    
    if ($responseTime -lt 1000) {
        Test-Pass "Response time: $([math]::Round($responseTime))ms (under 1s threshold)"
    } elseif ($responseTime -lt 3000) {
        Test-Warn "Response time: $([math]::Round($responseTime))ms (1-3s, acceptable)"
    } else {
        Test-Fail "Response time: $([math]::Round($responseTime))ms (over 3s threshold)"
    }
} catch {
    Test-Warn "Performance test failed: $($_.Exception.Message)"
}

# Test 5: SSL/TLS check
Log-Test "5. Testing SSL certificate..."
try {
    $uri = [System.Uri]$StagingUrl
    $tcpClient = New-Object System.Net.Sockets.TcpClient($uri.Host, 443)
    $sslStream = New-Object System.Net.Security.SslStream($tcpClient.GetStream())
    $sslStream.AuthenticateAsClient($uri.Host)
    $cert = $sslStream.RemoteCertificate
    $tcpClient.Close()
    
    if ($cert) {
        Test-Pass "SSL certificate is valid"
    } else {
        Test-Warn "SSL certificate check inconclusive"
    }
} catch {
    Test-Warn "SSL certificate check failed: $($_.Exception.Message)"
}

# Test 6: API endpoints
Log-Test "6. Testing API endpoints..."
try {
    $healthResponse = Invoke-WebRequest -Uri "$StagingUrl/api/health" -Method Get -TimeoutSec 10 -UseBasicParsing -ErrorAction Stop
    Test-Pass "Health check endpoint accessible"
} catch {
    Test-Warn "Health check endpoint not found (may not be implemented)"
}

# Test 7: Authentication flow
Log-Test "7. Testing authentication flow..."
try {
    $loginResponse = Invoke-WebRequest -Uri "$StagingUrl/login" -Method Get -TimeoutSec 10 -UseBasicParsing -ErrorAction Stop
    if ($loginResponse.Content -match "login|sign in|email|password") {
        Test-Pass "Login page accessible"
    } else {
        Test-Warn "Login page check inconclusive"
    }
} catch {
    Test-Warn "Login page check failed: $($_.Exception.Message)"
}

# Test 8: Check for common errors
Log-Test "8. Checking for common errors..."
$htmlContent = $response.Content
if ($htmlContent -match "error|exception|failed") {
    if ($htmlContent -match "500|502|503|504") {
        Test-Fail "Error detected in page content"
    } else {
        Test-Warn "Potential error keywords found (may be false positive)"
    }
} else {
    Test-Pass "No obvious errors in page content"
}

# Test 9: Environment configuration
Log-Test "9. Testing environment configuration..."
try {
    $envResponse = Invoke-WebRequest -Uri "$StagingUrl/api/env-test" -Method Get -TimeoutSec 10 -UseBasicParsing -ErrorAction Stop
    $envData = $envResponse.Content | ConvertFrom-Json
    if ($envData.hasDatabaseUrl) {
        Test-Pass "Environment variables configured correctly"
    } else {
        Test-Warn "Some environment variables may be missing"
    }
} catch {
    Test-Warn "Environment test endpoint not available"
}

# Test 10: Security headers
Log-Test "10. Testing security headers..."
$headers = $response.Headers
$securityHeaders = @("X-Frame-Options", "X-Content-Type-Options", "Content-Security-Policy")
$foundHeaders = $securityHeaders | Where-Object { $headers[$_] }

if ($foundHeaders) {
    Test-Pass "Security headers present: $($foundHeaders -join ', ')"
} else {
    Test-Warn "Security headers not detected (may be set by CDN)"
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
    Write-Host "Next steps:"
    Write-Host "1. Test authentication flow manually"
    Write-Host "2. Test user management features"
    Write-Host "3. Check Vercel deployment logs"
    Write-Host "4. Monitor error tracking (Sentry)"
    exit 0
} else {
    Write-Host "❌ Some tests failed. Please review the errors above." -ForegroundColor Red
    exit 1
}
