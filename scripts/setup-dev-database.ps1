# scripts/setup-dev-database.ps1
# Set up development database (PowerShell version)

param(
    [string]$DbName = "kealee_development",
    [string]$DbUser = "kealee",
    [string]$DbPassword = "kealee_dev",
    [string]$DbHost = "localhost",
    [string]$DbPort = "5433"
)

$ErrorActionPreference = "Stop"

function Log-Setup {
    param([string]$Message)
    Write-Host "[SETUP] $Message" -ForegroundColor Cyan
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

Write-Host "🗄️  Setting Up Development Database" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "   Database: $DbName"
Write-Host "   Host: $DbHost"
Write-Host "   Port: $DbPort"
Write-Host ""

# Check if psql is available
try {
    $null = Get-Command psql -ErrorAction Stop
} catch {
    Write-Fail "psql not found"
    Write-Host "   Install PostgreSQL client tools"
    exit 1
}

# Check if DATABASE_URL is set, otherwise construct it
if (-not $env:DATABASE_URL) {
    $env:DATABASE_URL = "postgresql://${DbUser}:${DbPassword}@${DbHost}:${DbPort}/${DbName}"
    Log-Setup "Using DATABASE_URL: postgresql://${DbUser}:***@${DbHost}:${DbPort}/${DbName}"
} else {
    Log-Setup "Using existing DATABASE_URL"
}

# Test connection to PostgreSQL server
Log-Setup "Testing PostgreSQL connection..."
$testUrl = "postgresql://${DbUser}:${DbPassword}@${DbHost}:${DbPort}/postgres"
try {
    $null = psql $testUrl -c "SELECT 1;" 2>&1 | Out-Null
    Write-Success "PostgreSQL connection successful"
} catch {
    Write-Fail "Cannot connect to PostgreSQL server"
    Write-Host ""
    Write-Host "Make sure PostgreSQL is running:"
    Write-Host "  - Docker: docker-compose up -d postgres"
    Write-Host "  - Local: Check if PostgreSQL service is running"
    Write-Host ""
    Write-Host "Connection details:"
    Write-Host "  Host: $DbHost"
    Write-Host "  Port: $DbPort"
    Write-Host "  User: $DbUser"
    exit 1
}

# Check if database exists
Log-Setup "Checking if database exists..."
try {
    $dbExists = psql $testUrl -tAc "SELECT 1 FROM pg_database WHERE datname='$DbName'" 2>&1 | Out-String | Trim()
    
    if ($dbExists -eq "1") {
        Write-Warn "Database '$DbName' already exists"
        $recreate = Read-Host "Do you want to drop and recreate it? (type 'yes' to confirm)"
        
        if ($recreate -eq "yes") {
            Log-Setup "Dropping existing database..."
            $null = psql $testUrl -c "DROP DATABASE IF EXISTS `"$DbName`";" 2>&1 | Out-Null
            Write-Success "Database dropped"
        } else {
            Log-Setup "Keeping existing database"
            Write-Success "Database setup complete"
            Write-Host ""
            Write-Host "📋 Next steps:"
            Write-Host "   npm run db:migrate:dev"
            Write-Host "   npm run db:seed"
            exit 0
        }
    }
} catch {
    # Database doesn't exist, continue
}

# Create database
Log-Setup "Creating database '$DbName'..."
try {
    $null = psql $testUrl -c "CREATE DATABASE `"$DbName`";" 2>&1 | Out-Null
    Write-Success "Database created successfully"
} catch {
    Write-Fail "Failed to create database: $($_.Exception.Message)"
    exit 1
}

# Verify database creation
Log-Setup "Verifying database..."
try {
    $null = psql $env:DATABASE_URL -c "SELECT current_database();" 2>&1 | Out-Null
    Write-Success "Database verification successful"
} catch {
    Write-Fail "Database verification failed"
    exit 1
}

Write-Host ""
Write-Success "Development database setup complete!"
Write-Host ""
Write-Host "📋 Next steps:"
Write-Host "   1. Run migrations: npm run db:migrate:dev"
Write-Host "   2. Seed database: npm run db:seed"
Write-Host ""
Write-Host "💡 Tip: Set DATABASE_URL for convenience:"
Write-Host "   `$env:DATABASE_URL = `"$($env:DATABASE_URL)`""
