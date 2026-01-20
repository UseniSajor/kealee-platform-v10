# scripts/run-api-tests.ps1
# Complete workflow: Start API, get token, run tests, review results (PowerShell version)

param(
    [string]$ApiUrl = "http://localhost:3001",
    [string]$TestEmail = "test@example.com",
    [string]$TestPassword = "test123456",
    [switch]$SkipStart,
    [switch]$SkipAuth
)

$ErrorActionPreference = "Continue"

Write-Host "🚀 API Testing Workflow" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

# Step 1: Start API server
if (-not $SkipStart) {
    Write-Host "1️⃣  Starting API server..." -ForegroundColor Cyan
    
    # Check if API is already running
    try {
        $null = Invoke-WebRequest -Uri "$ApiUrl/health" -Method Get -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop
        Write-Host "✅ API server is already running" -ForegroundColor Green
    } catch {
        Write-Host "   Starting API server in background..." -ForegroundColor Yellow
        Push-Location services/api
        $job = Start-Job -ScriptBlock {
            Set-Location $using:PWD
            pnpm dev
        }
        $ApiJob = $job
        Write-Host "   API server started (Job ID: $($job.Id))"
        
        # Wait for server to be ready
        Write-Host "   Waiting for server to be ready..." -ForegroundColor Yellow
        $maxAttempts = 30
        $attempt = 0
        $ready = $false
        
        while ($attempt -lt $maxAttempts -and -not $ready) {
            Start-Sleep -Seconds 1
            try {
                $null = Invoke-WebRequest -Uri "$ApiUrl/health" -Method Get -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop
                $ready = $true
                Write-Host "✅ API server is ready" -ForegroundColor Green
            } catch {
                $attempt++
            }
        }
        
        if (-not $ready) {
            Write-Host "❌ API server failed to start after $maxAttempts seconds" -ForegroundColor Red
            Stop-Job $job -ErrorAction SilentlyContinue
            Remove-Job $job -ErrorAction SilentlyContinue
            Pop-Location
            exit 1
        }
        
        Pop-Location
    }
} else {
    Write-Host "1️⃣  Skipping API server start (SkipStart=true)" -ForegroundColor Yellow
}

# Step 2: Get authentication token
if (-not $SkipAuth) {
    Write-Host ""
    Write-Host "2️⃣  Getting authentication token..." -ForegroundColor Cyan
    
    try {
        $tokenScript = Join-Path $PSScriptRoot "get-auth-token.ps1"
        $tokenOutput = & $tokenScript -ApiUrl $ApiUrl -Email $TestEmail -Password $TestPassword 2>&1
        
        # Extract token from output
        $tokenLine = $tokenOutput | Select-String "Access Token:" | Select-Object -First 1
        if ($tokenLine) {
            $env:AUTH_TOKEN = ($tokenLine -split "`n" | Select-Object -Last 1).Trim()
            if ($env:AUTH_TOKEN) {
                Write-Host "✅ Authentication token obtained" -ForegroundColor Green
                Write-Host "   Token: $($env:AUTH_TOKEN.Substring(0, [Math]::Min(20, $env:AUTH_TOKEN.Length)))..."
            } else {
                Write-Host "⚠️  Could not extract token from output" -ForegroundColor Yellow
                $env:AUTH_TOKEN = $null
            }
        } else {
            Write-Host "⚠️  Could not get authentication token" -ForegroundColor Yellow
            Write-Host "   Some tests may be skipped"
            $env:AUTH_TOKEN = $null
        }
    } catch {
        Write-Host "⚠️  Could not get authentication token: $($_.Exception.Message)" -ForegroundColor Yellow
        $env:AUTH_TOKEN = $null
    }
} else {
    Write-Host "2️⃣  Skipping authentication (SkipAuth=true)" -ForegroundColor Yellow
    if (-not $env:AUTH_TOKEN) {
        Write-Host "   No AUTH_TOKEN set, some tests will be skipped"
    }
}

# Step 3: Run API tests
Write-Host ""
Write-Host "3️⃣  Running API endpoint tests..." -ForegroundColor Cyan
$env:BASE_URL = $ApiUrl
$testScript = Join-Path $PSScriptRoot "test-all-api-endpoints.ps1"
& $testScript -BaseUrl $ApiUrl
$TestExitCode = $LASTEXITCODE

# Step 4: Review results
Write-Host ""
Write-Host "4️⃣  Test Results Summary" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

# Find latest test report
$testResultsDir = "test-results"
if (Test-Path $testResultsDir) {
    $latestReport = Get-ChildItem -Path $testResultsDir -Filter "api-test-report-*.json" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    $latestSummary = Get-ChildItem -Path $testResultsDir -Filter "summary-*.md" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    
    if ($latestReport) {
        try {
            $results = Get-Content $latestReport.FullName | ConvertFrom-Json
            $total = $results.tests.Count
            $passed = ($results.tests | Where-Object { $_.status -eq "passed" }).Count
            $failed = ($results.tests | Where-Object { $_.status -eq "failed" }).Count
            $successRate = if ($total -gt 0) { [math]::Round(($passed * 100) / $total) } else { 0 }
            
            Write-Host "📊 Results:" -ForegroundColor Cyan
            Write-Host "   Total: $total"
            Write-Host "   Passed: $passed" -ForegroundColor Green
            Write-Host "   Failed: $failed" -ForegroundColor $(if ($failed -gt 0) { "Red" } else { "Green" })
            Write-Host "   Success Rate: ${successRate}%"
            Write-Host ""
            Write-Host "📄 Reports:"
            Write-Host "   Summary: $($latestSummary.FullName)"
            Write-Host "   Detailed: $($latestReport.FullName)"
            
            if ($failed -gt 0) {
                Write-Host ""
                Write-Host "❌ Failed Tests:" -ForegroundColor Red
                $results.tests | Where-Object { $_.status -eq "failed" } | ForEach-Object {
                    Write-Host "   - $($_.name): HTTP $($_.http_code)" -ForegroundColor Red
                }
            }
        } catch {
            Write-Host "📄 Reports available in: $testResultsDir" -ForegroundColor Yellow
            if ($latestSummary) {
                Write-Host "   Summary: $($latestSummary.FullName)"
            }
        }
    } else {
        Write-Host "📄 Reports available in: $testResultsDir" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️  Test results directory not found" -ForegroundColor Yellow
}

# Step 5: Cleanup
if (-not $SkipStart -and $ApiJob) {
    Write-Host ""
    $response = Read-Host "Stop API server? (y/N)"
    if ($response -eq "y" -or $response -eq "Y") {
        Write-Host "   Stopping API server (Job ID: $($ApiJob.Id))..." -ForegroundColor Yellow
        Stop-Job $ApiJob -ErrorAction SilentlyContinue
        Remove-Job $ApiJob -ErrorAction SilentlyContinue
        Write-Host "✅ API server stopped" -ForegroundColor Green
    } else {
        Write-Host "   API server still running (Job ID: $($ApiJob.Id))" -ForegroundColor Yellow
        Write-Host "   To stop manually: Stop-Job $($ApiJob.Id); Remove-Job $($ApiJob.Id)"
    }
}

Write-Host ""
if ($TestExitCode -eq 0) {
    Write-Host "✅ All tests passed!" -ForegroundColor Green
} else {
    Write-Host "❌ Some tests failed. Review reports above." -ForegroundColor Red
}

exit $TestExitCode
