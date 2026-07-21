# scripts/create-staging-db.ps1
# Create staging database (PowerShell version)

param(
    [string]$DbName = "kealee_staging",
    [string]$DbUser = "kealee",
    [string]$DbPassword = "kealee_staging",
    [string]$DbHost = "localhost",
    [string]$DbPort = "5433"
)

$ErrorActionPreference = "Stop"

function Log-StagingDb {
    param([string]$Message)
    Write-Host "[STAGING DB] $Message" -ForegroundColor Cyan
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

Write-Host "🗄️  Creating Staging Database" -ForegroundColor Cyan
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
    Log-StagingDb "Using DATABASE_URL: postgresql://${DbUser}:***@${DbHost}:${DbPort}/${DbName}"
} else {
    Log-StagingDb "Using existing DATABASE_URL"
    # Extract DB_NAME from DATABASE_URL if provided
    $dbUrl = $env:DATABASE_URL
    $DbName = ($dbUrl -split '/')[-1] -split '\?' | Select-Object -First 1
}

# Test connection to PostgreSQL server
Log-StagingDb "Testing PostgreSQL connection..."
$postgresUrl = "postgresql://${DbUser}:${DbPassword}@${DbHost}:${DbPort}/postgres"
try {
    $null = psql $postgresUrl -c "SELECT 1;" 2>&1 | Out-Null
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
    Write-Host ""
    Write-Host "Or set DATABASE_URL environment variable:"
    Write-Host "  `$env:DATABASE_URL = 'postgresql://user:password@host:port/database'"
    exit 1
}

# Check if database exists
Log-StagingDb "Checking if database exists..."
try {
    $dbExists = psql $postgresUrl -tAc "SELECT 1 FROM pg_database WHERE datname='$DbName'" 2>&1 | Out-String | Trim()
    
    if ($dbExists -eq "1") {
        Write-Warn "Database '$DbName' already exists"
        $recreate = Read-Host "Do you want to drop and recreate it? (type 'yes' to confirm)"
        
        if ($recreate -eq "yes") {
            Log-StagingDb "Dropping existing database..."
            # Terminate existing connections
            $null = psql $postgresUrl -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DbName' AND pid <> pg_backend_pid();" 2>&1 | Out-Null
            $null = psql $postgresUrl -c "DROP DATABASE IF EXISTS `"$DbName`";" 2>&1 | Out-Null
            Write-Success "Database dropped"
        } else {
            Log-StagingDb "Keeping existing database"
            Write-Success "Staging database ready"
            Write-Host ""
            Write-Host "📋 Next steps:"
            Write-Host "   npm run db:migrate:staging"
            Write-Host "   npm run db:seed (optional)"
            exit 0
        }
    }
} catch {
    # Database doesn't exist, continue
}

# Create database
Log-StagingDb "Creating database '$DbName'..."
try {
    $null = psql $postgresUrl -c "CREATE DATABASE `"$DbName`";" 2>&1 | Out-Null
    Write-Success "Database created successfully"
} catch {
    Write-Fail "Failed to create database: $($_.Exception.Message)"
    exit 1
}

# Verify database creation
Log-StagingDb "Verifying database..."
try {
    $null = psql $env:DATABASE_URL -c "SELECT current_database();" 2>&1 | Out-Null
    Write-Success "Database verification successful"
} catch {
    Write-Fail "Database verification failed"
    exit 1
}

Write-Host ""
Write-Success "Staging database setup complete!"
Write-Host ""
Write-Host "📋 Next steps:"
Write-Host "   1. Run migrations: npm run db:migrate:staging"
Write-Host "   2. Seed database (optional): npm run db:seed"
Write-Host ""
Write-Host "💡 Tip: Set DATABASE_URL for convenience:"
Write-Host "   `$env:DATABASE_URL = `"$($env:DATABASE_URL)`""
