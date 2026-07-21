# scripts/slow-queries.ps1
# Analyze slow database queries (PowerShell)

$ErrorActionPreference = "Continue"

function Log-SlowQueries {
    param([string]$Message)
    Write-Host "[SLOW QUERIES] $Message" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Fail {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

Write-Host "🐌 Slow Database Queries Analysis" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

# Check DATABASE_URL
if (-not $env:DATABASE_URL) {
    Write-Fail "DATABASE_URL is not set"
    Write-Host "Set it: `$env:DATABASE_URL='postgresql://...'"
    exit 1
}

# Check psql
$psqlPath = Get-Command psql -ErrorAction SilentlyContinue
if (-not $psqlPath) {
    Write-Fail "psql is not installed"
    exit 1
}

# Test connection
Log-SlowQueries "Testing database connection..."
try {
    & psql $env:DATABASE_URL -c "SELECT 1;" 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Connected to database"
    } else {
        Write-Fail "Cannot connect to database"
        exit 1
    }
} catch {
    Write-Fail "Cannot connect to database"
    exit 1
}

Write-Host ""
Write-Host "📊 Query Statistics" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

# Check if pg_stat_statements is enabled
Log-SlowQueries "Checking pg_stat_statements extension..."
$extensionCheck = & psql $env:DATABASE_URL -t -c "SELECT count(*) FROM pg_extension WHERE extname = 'pg_stat_statements';" 2>&1
if ($extensionCheck -match "1") {
    Write-Success "pg_stat_statements is enabled"
} else {
    Write-Host "⚠️  pg_stat_statements is not enabled" -ForegroundColor Yellow
    Write-Host "Enable it: CREATE EXTENSION IF NOT EXISTS pg_stat_statements;" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Showing currently running queries instead..." -ForegroundColor Cyan
    Write-Host ""
    & psql $env:DATABASE_URL -c @"
        SELECT 
            pid,
            now() - pg_stat_activity.query_start AS duration,
            state,
            query
        FROM pg_stat_activity
        WHERE state = 'active'
        AND now() - pg_stat_activity.query_start > interval '1 second'
        ORDER BY duration DESC;
"@
    exit 0
}

# Top 10 slowest queries
Write-Host "🔝 Top 10 Slowest Queries (by total time)" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
& psql $env:DATABASE_URL -c @"
    SELECT 
        round(total_exec_time::numeric, 2) AS total_time_ms,
        calls,
        round(mean_exec_time::numeric, 2) AS mean_time_ms,
        round((100 * total_exec_time / sum(total_exec_time) OVER ())::numeric, 2) AS percentage,
        substring(query, 1, 100) AS query_preview
    FROM pg_stat_statements
    ORDER BY total_exec_time DESC
    LIMIT 10;
"@

Write-Host ""
Write-Host "💡 Recommendations" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Review slow queries and optimize"
Write-Host "2. Add indexes for frequently queried columns"
Write-Host "3. Monitor connection count"
Write-Host ""

Write-Success "Analysis complete"
