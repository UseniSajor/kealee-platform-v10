# scripts/test-all-api-endpoints.ps1
# Comprehensive API endpoint testing script (PowerShell version)

param(
    [string]$BaseUrl = "http://localhost:3001",
    [string]$ApiPrefix = "",
    [string]$AuthToken = $env:AUTH_TOKEN,
    [string]$TestResultsDir = "test-results"
)

$ErrorActionPreference = "Continue"

# Test counters
$script:TotalTests = 0
$script:PassedTests = 0
$script:FailedTests = 0
$script:SkippedTests = 0

# Create test results directory
if (-not (Test-Path $TestResultsDir)) {
    New-Item -ItemType Directory -Path $TestResultsDir -Force | Out-Null
}

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$TestReport = Join-Path $TestResultsDir "api-test-report-$timestamp.json"
$SummaryReport = Join-Path $TestResultsDir "summary-$timestamp.md"

function Log-Test {
    param([string]$Message)
    Write-Host "[TEST] $Message" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Fail {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

# Initialize test results JSON
$testResults = @{
    timestamp = (Get-Date -Format "o")
    base_url = $BaseUrl
    api_prefix = $ApiPrefix
    tests = @()
} | ConvertTo-Json -Depth 10
$testResults | Out-File -FilePath $TestReport -Encoding utf8

# Function to run a test
function Run-Test {
    param(
        [string]$Endpoint,
        [string]$Method,
        [bool]$RequiresAuth = $false,
        [string]$TestData = "{}"
    )
    
    $testName = "$Method $Endpoint"
    $script:TotalTests++
    
    # Skip if requires auth and no token
    if ($RequiresAuth -and -not $AuthToken) {
        Write-Warning "Skipping $testName (requires authentication)"
        $script:SkippedTests++
        return
    }
    
    Log-Test "Testing: $testName"
    
    # Replace path parameters
    $testEndpoint = $Endpoint
    $testEndpoint = $testEndpoint -replace '\{id\}', 'test_id_123'
    $testEndpoint = $testEndpoint -replace '\{orgId\}', 'test_org_123'
    $testEndpoint = $testEndpoint -replace '\{userId\}', 'test_user_123'
    $testEndpoint = $testEndpoint -replace '\{projectId\}', 'test_project_123'
    
    $url = "$BaseUrl$ApiPrefix$testEndpoint"
    $startTime = Get-Date
    
    # Build headers
    $headers = @{
        "Content-Type" = "application/json"
    }
    if ($AuthToken) {
        $headers["Authorization"] = "Bearer $AuthToken"
    }
    
    # Make request
    try {
        $response = $null
        if ($Method -eq "GET") {
            $response = Invoke-WebRequest -Uri $url -Method Get -Headers $headers -TimeoutSec 10 -UseBasicParsing -ErrorAction Stop
        } elseif ($Method -eq "POST" -or $Method -eq "PATCH" -or $Method -eq "PUT") {
            $response = Invoke-WebRequest -Uri $url -Method $Method -Headers $headers -Body $TestData -TimeoutSec 10 -UseBasicParsing -ErrorAction Stop
        } elseif ($Method -eq "DELETE") {
            $response = Invoke-WebRequest -Uri $url -Method Delete -Headers $headers -TimeoutSec 10 -UseBasicParsing -ErrorAction Stop
        }
        
        $endTime = Get-Date
        $duration = [math]::Round(($endTime - $startTime).TotalMilliseconds)
        $httpCode = $response.StatusCode
        $body = $response.Content
        
        # Determine status
        if ($httpCode -ge 200 -and $httpCode -lt 400) {
            $status = "passed"
            $script:PassedTests++
            Write-Success "$testName : HTTP $httpCode (${duration}ms)"
        } elseif ($httpCode -eq 401 -or $httpCode -eq 403) {
            $status = "auth_required"
            $script:SkippedTests++
            Write-Warning "$testName : Authentication required (HTTP $httpCode)"
        } elseif ($httpCode -eq 404) {
            $status = "not_found"
            $script:SkippedTests++
            Write-Warning "$testName : Not found (HTTP $httpCode)"
        } elseif ($httpCode -eq 429) {
            $status = "rate_limited"
            $script:SkippedTests++
            Write-Warning "$testName : Rate limited (HTTP $httpCode)"
        } else {
            $status = "failed"
            $script:FailedTests++
            Write-Fail "$testName : HTTP $httpCode (${duration}ms)"
        }
    } catch {
        $endTime = Get-Date
        $duration = [math]::Round(($endTime - $startTime).TotalMilliseconds)
        $httpCode = $_.Exception.Response.StatusCode.value__
        if (-not $httpCode) { $httpCode = 000 }
        $body = $_.Exception.Message
        $status = "failed"
        $script:FailedTests++
        Write-Fail "$testName : HTTP $httpCode (${duration}ms) - $body"
    }
    
    # Add to test results
    $testResult = @{
        name = $testName
        status = $status
        duration_ms = $duration
        http_code = $httpCode
        url = $url
        response_body = $body
        timestamp = (Get-Date -Format "o")
    }
    
    $results = Get-Content $TestReport | ConvertFrom-Json
    $results.tests += $testResult
    $results | ConvertTo-Json -Depth 10 | Out-File -FilePath $TestReport -Encoding utf8
    
    # Small delay
    Start-Sleep -Milliseconds 100
}

Write-Host "🔧 Testing All API Endpoints" -ForegroundColor Cyan
Write-Host "   Base URL: $BaseUrl"
Write-Host "   API Prefix: $ApiPrefix"
if ($AuthToken) {
    Write-Host "   Auth Token: $($AuthToken.Substring(0, [Math]::Min(20, $AuthToken.Length)))..."
} else {
    Write-Host "   Auth Token: (not set)"
}
Write-Host ""

# Test health endpoint first
Log-Test "Testing health endpoint..."
Run-Test "/health" "GET" $false

# Authentication endpoints
Log-Test "Testing authentication endpoints..."
Run-Test "/auth/signup" "POST" $false '{"email":"test@example.com","password":"test123456","name":"Test User"}'
Run-Test "/auth/login" "POST" $false '{"email":"test@example.com","password":"test123456"}'
Run-Test "/auth/me" "GET" $true
Run-Test "/auth/verify" "POST" $false '{"token":"test_token"}'
Run-Test "/auth/logout" "POST" $true

# User endpoints
Log-Test "Testing user endpoints..."
Run-Test "/users" "GET" $true
Run-Test "/users/{id}" "GET" $true
Run-Test "/users/{id}" "PUT" $true '{"name":"Updated Name"}'
Run-Test "/users/{id}/orgs" "GET" $true

# Organization endpoints
Log-Test "Testing organization endpoints..."
Run-Test "/orgs" "GET" $true
Run-Test "/orgs" "POST" $true '{"name":"Test Org","slug":"test-org"}'
Run-Test "/orgs/{id}" "GET" $true
Run-Test "/orgs/{id}" "PUT" $true '{"name":"Updated Org"}'
Run-Test "/orgs/{id}/members" "POST" $true '{"userId":"test_user_123","role":"MEMBER"}'
Run-Test "/orgs/{id}/members/{userId}" "DELETE" $true
Run-Test "/orgs/my" "GET" $true

# RBAC endpoints
Log-Test "Testing RBAC endpoints..."
Run-Test "/rbac/roles" "GET" $false
Run-Test "/rbac/roles" "POST" $true '{"key":"test_role","name":"Test Role"}'
Run-Test "/rbac/roles/{id}" "GET" $false
Run-Test "/rbac/permissions" "GET" $false
Run-Test "/rbac/permissions" "POST" $true '{"key":"test_perm","name":"Test Permission"}'
Run-Test "/rbac/check" "POST" $true '{"userId":"test_user_123","permission":"test_perm"}'

# Entitlement endpoints
Log-Test "Testing entitlement endpoints..."
Run-Test "/entitlements/orgs/{orgId}" "GET" $true
Run-Test "/entitlements/orgs/{orgId}/modules/{moduleKey}/enable" "POST" $true
Run-Test "/entitlements/check" "POST" $true '{"orgId":"test_org_123","moduleKey":"test_module"}'

# Event endpoints
Log-Test "Testing event endpoints..."
Run-Test "/events" "GET" $true
Run-Test "/events" "POST" $true '{"type":"test_event","data":{"test":true}}'
Run-Test "/events/{id}" "GET" $true

# Audit endpoints
Log-Test "Testing audit endpoints..."
Run-Test "/audit" "GET" $true
Run-Test "/audit" "POST" $true '{"action":"TEST_ACTION","entityType":"test","entityId":"test_123"}'

# Billing endpoints
Log-Test "Testing billing endpoints..."
Run-Test "/billing/plans" "GET" $false
Run-Test "/billing/stripe/checkout-session" "POST" $true '{"orgId":"test_org_123","planSlug":"package_b","interval":"month","successUrl":"http://localhost:3000/success","cancelUrl":"http://localhost:3000/cancel"}'
Run-Test "/billing/subscriptions" "GET" $true
Run-Test "/billing/subscriptions/me" "GET" $true

# Project endpoints
Log-Test "Testing project endpoints..."
Run-Test "/projects" "GET" $true
Run-Test "/projects" "POST" $true '{"name":"Test Project","category":"KITCHEN"}'
Run-Test "/projects/{id}" "GET" $true
Run-Test "/projects/{id}" "PATCH" $true '{"name":"Updated Project"}'
Run-Test "/projects/{id}" "DELETE" $true

# Property endpoints
Log-Test "Testing property endpoints..."
Run-Test "/properties" "GET" $true
Run-Test "/properties" "POST" $true '{"address":"123 Test St","orgId":"test_org_123"}'
Run-Test "/properties/{id}" "GET" $true

# Webhook endpoints
Log-Test "Testing webhook endpoints..."
Run-Test "/api/v1/webhooks/status" "GET" $true
Run-Test "/api/v1/webhooks/test" "POST" $true '{"eventType":"checkout.session.completed"}'
Run-Test "/billing/stripe/webhook" "POST" $false '{"id":"evt_test","type":"test"}'

# PM endpoints
Log-Test "Testing PM endpoints..."
Run-Test "/pm/tasks" "GET" $true
Run-Test "/pm/tasks" "POST" $true '{"title":"Test Task","assignedTo":"test_user_123"}'

# Marketplace endpoints
Log-Test "Testing marketplace endpoints..."
Run-Test "/marketplace/profiles" "GET" $false
Run-Test "/marketplace/leads" "GET" $true
Run-Test "/marketplace/leads" "POST" $true '{"category":"plumbing","description":"Test lead","location":"Test City"}'

# Permit endpoints
Log-Test "Testing permit endpoints..."
Run-Test "/permits/jurisdictions" "GET" $false
Run-Test "/permits/applications" "GET" $true
Run-Test "/permits/applications" "POST" $true '{"projectId":"test_project_123","jurisdictionId":"test_jurisdiction_123"}'

# File endpoints
Log-Test "Testing file endpoints..."
Run-Test "/files" "GET" $true
Run-Test "/files/upload" "POST" $true '{"fileName":"test.pdf","fileType":"application/pdf"}'

# Generate summary
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "📊 Test Summary" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "Total tests: $script:TotalTests"
Write-Host "✅ Passed: $script:PassedTests" -ForegroundColor Green
Write-Host "❌ Failed: $script:FailedTests" -ForegroundColor Red
Write-Host "⏭️  Skipped: $script:SkippedTests" -ForegroundColor Yellow

# Calculate success rate
if ($script:TotalTests -gt 0) {
    $successRate = [math]::Round(($script:PassedTests * 100) / $script:TotalTests)
    Write-Host "Success rate: ${successRate}%"
}

# Calculate average response time
$results = Get-Content $TestReport | ConvertFrom-Json
$avgResponseTime = 0
if ($results.tests.Count -gt 0) {
    $durations = $results.tests | Where-Object { $_.duration_ms } | ForEach-Object { $_.duration_ms }
    if ($durations.Count -gt 0) {
        $avgResponseTime = [math]::Round(($durations | Measure-Object -Average).Average)
    }
}
Write-Host "Average response time: ${avgResponseTime}ms"

# Generate markdown summary
$summaryContent = @"
# API Test Report

**Generated:** $(Get-Date)
**Base URL:** $BaseUrl
**API Prefix:** $ApiPrefix

## Executive Summary

- **Total Tests:** $($script:TotalTests)
- **Passed:** $($script:PassedTests)
- **Failed:** $($script:FailedTests)
- **Skipped:** $($script:SkippedTests)
- **Success Rate:** ${successRate}%

## Test Results

### Passed Tests
$($results.tests | Where-Object { $_.status -eq "passed" } | ForEach-Object { "- **$($_.name)**: HTTP $($_.http_code) ($($_.duration_ms)ms)" } | Out-String)

### Failed Tests
$($results.tests | Where-Object { $_.status -eq "failed" } | ForEach-Object { "- **$($_.name)**: HTTP $($_.http_code)" } | Out-String)

### Authentication Required
$($results.tests | Where-Object { $_.status -eq "auth_required" } | ForEach-Object { "- **$($_.name)**" } | Out-String)

## Performance

### Slow Endpoints (>1000ms)
$($results.tests | Where-Object { $_.duration_ms -gt 1000 } | ForEach-Object { "- **$($_.name)**: $($_.duration_ms)ms" } | Out-String)

## Recommendations

1. **Failed Endpoints**: Investigate and fix failed endpoints
2. **Authentication**: Set AUTH_TOKEN environment variable for authenticated tests
3. **Performance**: Optimize endpoints with response time >1000ms
4. **Rate Limiting**: Review rate limiting configuration if many 429 responses

## Full Results

Detailed JSON results available in: \`$TestReport\`
"@

$summaryContent | Out-File -FilePath $SummaryReport -Encoding utf8

Write-Host ""
Write-Host "✅ API endpoint testing completed!" -ForegroundColor Green
Write-Host "📄 Summary report: $SummaryReport"
Write-Host "📊 Detailed results: $TestReport"
Write-Host ""

if ($script:FailedTests -gt 0) {
    exit 1
} else {
    exit 0
}
