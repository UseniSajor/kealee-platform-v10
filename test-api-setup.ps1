# API Setup Test Script
Write-Host "`n=== Testing Kealee Platform API Setup ===" -ForegroundColor Cyan
Write-Host ""

# Test 1: Health Check
Write-Host "1. Testing Health Endpoint..." -ForegroundColor Yellow
try {
    $healthResponse = Invoke-RestMethod -Uri "http://localhost:3001/health" -Method GET -TimeoutSec 5 -ErrorAction Stop
    Write-Host "   ✓ Health check passed: $($healthResponse.status)" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Health check failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   → Make sure the API server is running: cd services/api && pnpm dev" -ForegroundColor Yellow
    exit 1
}

# Test 2: Test Signup Endpoint (Supabase Auth)
Write-Host "`n2. Testing Supabase Authentication (Signup)..." -ForegroundColor Yellow
$testEmail = "test-$(Get-Date -Format 'yyyyMMddHHmmss')@example.com"
$testPassword = "Test123!@#"
$signupBody = @{
    email = $testEmail
    password = $testPassword
    name = "Test User"
} | ConvertTo-Json

try {
    $signupResponse = Invoke-RestMethod -Uri "http://localhost:3001/auth/signup" -Method POST -Body $signupBody -ContentType "application/json" -TimeoutSec 10 -ErrorAction Stop
    Write-Host "   ✓ Signup successful!" -ForegroundColor Green
    Write-Host "   → User ID: $($signupResponse.user.id)" -ForegroundColor Gray
    Write-Host "   → Email: $($signupResponse.user.email)" -ForegroundColor Gray
    
    # Test 3: Test Login
    Write-Host "`n3. Testing Login..." -ForegroundColor Yellow
    $loginBody = @{
        email = $testEmail
        password = $testPassword
    } | ConvertTo-Json
    
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:3001/auth/login" -Method POST -Body $loginBody -ContentType "application/json" -TimeoutSec 10 -ErrorAction Stop
    Write-Host "   ✓ Login successful!" -ForegroundColor Green
    Write-Host "   → Session token received" -ForegroundColor Gray
    
    # Test 4: Test Auth Me Endpoint
    Write-Host "`n4. Testing /auth/me endpoint..." -ForegroundColor Yellow
    $headers = @{
        "Authorization" = "Bearer $($loginResponse.session.access_token)"
    }
    
    $meResponse = Invoke-RestMethod -Uri "http://localhost:3001/auth/me" -Method GET -Headers $headers -TimeoutSec 10 -ErrorAction Stop
    Write-Host "   ✓ Auth verification successful!" -ForegroundColor Green
    Write-Host "   → User: $($meResponse.user.email)" -ForegroundColor Gray
    
} catch {
    Write-Host "   ✗ Authentication test failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "   → Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Gray
    }
    Write-Host "   → Check Supabase credentials in services/api/.env.local" -ForegroundColor Yellow
}

Write-Host "`n=== Test Complete ===" -ForegroundColor Cyan
Write-Host ""
