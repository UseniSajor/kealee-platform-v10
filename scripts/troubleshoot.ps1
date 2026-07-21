# scripts/troubleshoot.ps1
# Comprehensive troubleshooting script for Kealee Platform (PowerShell)

$ErrorActionPreference = "Continue"

function Log-Troubleshoot {
    param([string]$Message)
    Write-Host "[TROUBLESHOOT] $Message" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Fail {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Write-Warn {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor Cyan
}

Write-Host "🔍 Kealee Platform Troubleshooting" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

Write-Host "Select what to troubleshoot:"
Write-Host "  1) PostgreSQL"
Write-Host "  2) Redis"
Write-Host "  3) Vercel Deployments"
Write-Host "  4) Environment Variables"
Write-Host "  5) API Service"
Write-Host "  6) All Services"
Write-Host ""

$choice = Read-Host "Enter choice (1-6)"

# PostgreSQL Troubleshooting
function Check-PostgreSQL {
    Write-Host ""
    Write-Host "🐘 PostgreSQL Troubleshooting" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    
    # Check if psql is available
    $psqlPath = Get-Command psql -ErrorAction SilentlyContinue
    if (-not $psqlPath) {
        Write-Fail "PostgreSQL client (psql) is not installed"
        Write-Info "Install PostgreSQL client or use WSL2"
        return
    }
    Write-Success "PostgreSQL client is installed"
    
    # Check connection string
    Log-Troubleshoot "Checking DATABASE_URL..."
    if (-not $env:DATABASE_URL) {
        Write-Warn "DATABASE_URL is not set"
        Write-Info "Set it: `$env:DATABASE_URL='postgresql://user:pass@host:port/db'"
        
        # Try to load from .env.local
        if (Test-Path ".env.local") {
            Log-Troubleshoot "Loading from .env.local..."
            Get-Content .env.local | ForEach-Object {
                if ($_ -match '^([^#][^=]+)=(.*)$') {
                    [Environment]::SetEnvironmentVariable($matches[1], $matches[2], "Process")
                }
            }
        }
        
        if (-not $env:DATABASE_URL) {
            Write-Fail "DATABASE_URL not found"
            return
        }
    }
    
    Write-Success "DATABASE_URL is set"
    $dbUrlMasked = $env:DATABASE_URL -replace ':[^:@]+@', ':***@'
    Write-Info "Connection string: $dbUrlMasked"
    
    # Test connection
    Log-Troubleshoot "Testing database connection..."
    try {
        $result = & psql $env:DATABASE_URL -c "SELECT 1;" 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Database connection successful"
        } else {
            Write-Fail "Database connection failed"
            Write-Info "Check connection string and network connectivity"
        }
    } catch {
        Write-Fail "Could not test connection: $($_.Exception.Message)"
    }
}

# Redis Troubleshooting
function Check-Redis {
    Write-Host ""
    Write-Host "🔴 Redis Troubleshooting" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    
    # Check if redis-cli is available
    $redisCliPath = Get-Command redis-cli -ErrorAction SilentlyContinue
    if (-not $redisCliPath) {
        Write-Fail "Redis client (redis-cli) is not installed"
        Write-Info "Install Redis or use WSL2/Docker"
        return
    }
    Write-Success "Redis client is installed"
    
    # Check if Redis is running
    Log-Troubleshoot "Checking if Redis is running..."
    try {
        $pingResult = & redis-cli ping 2>&1
        if ($pingResult -eq "PONG") {
            Write-Success "Redis is running and responding"
        } else {
            Write-Fail "Redis is not responding"
            Write-Info "Start Redis or check connection"
        }
    } catch {
        Write-Fail "Could not connect to Redis: $($_.Exception.Message)"
        Write-Info "Start Redis: redis-server"
    }
}

# Vercel Troubleshooting
function Check-Vercel {
    Write-Host ""
    Write-Host "▲ Vercel Troubleshooting" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    
    # Check if Vercel CLI is installed
    $vercelPath = Get-Command vercel -ErrorAction SilentlyContinue
    if (-not $vercelPath) {
        Write-Fail "Vercel CLI is not installed"
        Write-Info "Install: npm install -g vercel"
        return
    }
    Write-Success "Vercel CLI is installed"
    
    # Check if logged in
    Log-Troubleshoot "Checking Vercel authentication..."
    try {
        $user = & vercel whoami 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Logged in as: $user"
        } else {
            Write-Fail "Not logged in to Vercel"
            Write-Info "Login: vercel login"
        }
    } catch {
        Write-Fail "Could not check authentication"
    }
    
    # Check Vercel token
    if (-not $env:VERCEL_TOKEN) {
        Write-Warn "VERCEL_TOKEN is not set"
        Write-Info "Set it: `$env:VERCEL_TOKEN='your-token'"
    } else {
        Write-Success "VERCEL_TOKEN is set"
    }
}

# Environment Variables Troubleshooting
function Check-EnvVars {
    Write-Host ""
    Write-Host "🔐 Environment Variables Troubleshooting" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    
    $requiredVars = @("DATABASE_URL", "NEXTAUTH_SECRET", "NEXTAUTH_URL", "STRIPE_SECRET_KEY")
    $missing = 0
    
    Log-Troubleshoot "Checking required environment variables..."
    foreach ($var in $requiredVars) {
        if (-not (Get-Item "Env:$var" -ErrorAction SilentlyContinue)) {
            Write-Fail "$var is not set"
            $missing++
        } else {
            Write-Success "$var is set"
        }
    }
    
    if ($missing -gt 0) {
        Write-Warn "Missing $missing required environment variable(s)"
    }
    
    # Check .env files
    Log-Troubleshoot "Checking .env files..."
    if (Test-Path ".env.local") {
        Write-Success ".env.local exists"
    } else {
        Write-Warn ".env.local not found"
        Write-Info "Create it: .\scripts\setup-env-local.ps1"
    }
}

# API Service Troubleshooting
function Check-ApiService {
    Write-Host ""
    Write-Host "🚀 API Service Troubleshooting" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    
    if (-not (Test-Path "services/api")) {
        Write-Fail "API service directory not found"
        return
    }
    Write-Success "API service directory exists"
    
    # Check if API is running
    Log-Troubleshoot "Checking if API is running..."
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000/health" -UseBasicParsing -TimeoutSec 2
        if ($response.StatusCode -eq 200) {
            Write-Success "API is running on port 3000"
            Write-Info "Health check: $($response.Content)"
        }
    } catch {
        Write-Fail "API is not running on port 3000"
        Write-Info "Start API: cd services/api && npm run dev"
    }
}

# Run selected checks
switch ($choice) {
    "1" { Check-PostgreSQL }
    "2" { Check-Redis }
    "3" { Check-Vercel }
    "4" { Check-EnvVars }
    "5" { Check-ApiService }
    "6" {
        Check-PostgreSQL
        Check-Redis
        Check-Vercel
        Check-EnvVars
        Check-ApiService
    }
    default {
        Write-Fail "Invalid choice"
        exit 1
    }
}

Write-Host ""
Write-Host "✅ Troubleshooting complete" -ForegroundColor Green
Write-Host ""
