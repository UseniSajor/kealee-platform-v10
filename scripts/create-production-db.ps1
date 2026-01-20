# scripts/create-production-db.ps1
# Create production database (PowerShell version)

$ErrorActionPreference = "Stop"

param(
    [string]$DbName = "kealee_production",
    [string]$DbUser = "kealee",
    [string]$DbPassword = "",
    [string]$DbHost = "",
    [string]$DbPort = "5432"
)

function Log-ProdDb {
    param([string]$Message)
    Write-Host "[PROD DB] $Message" -ForegroundColor Cyan
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

Write-Host "🚨 Creating Production Database" -ForegroundColor Red
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Red
Write-Host ""
Write-Warn "⚠️  WARNING: This will create a PRODUCTION database"
Write-Host ""
Write-Host "Before proceeding, ensure:"
Write-Host "  ✅ Production database credentials are secure"
Write-Host "  ✅ Database server is accessible"
Write-Host "  ✅ Backup strategy is in place"
Write-Host "  ✅ All team members are notified"
Write-Host ""

# Check if DATABASE_URL is set
if (-not $env:DATABASE_URL) {
    if (-not $DbHost) {
        Write-Fail "DB_HOST is required for production database"
        Write-Host "   Set it: `$env:DB_HOST = 'your-production-db-host'"
        Write-Host "   Or set DATABASE_URL directly: `$env:DATABASE_URL = 'postgresql://...'"
        exit 1
    }
    
    if (-not $DbPassword) {
        Write-Fail "DB_PASSWORD is required for production database"
        Write-Host "   Set it: `$env:DB_PASSWORD = 'your-secure-password'"
        Write-Host "   Or set DATABASE_URL directly: `$env:DATABASE_URL = 'postgresql://...'"
        exit 1
    }
    
    $env:DATABASE_URL = "postgresql://${DbUser}:${DbPassword}@${DbHost}:${DbPort}/${DbName}"
    Log-ProdDb "Using DATABASE_URL: postgresql://${DbUser}:***@${DbHost}:${DbPort}/${DbName}"
} else {
    Log-ProdDb "Using existing DATABASE_URL"
    $dbUrl = $env:DATABASE_URL
    $DbName = ($dbUrl -split '/')[-1] -split '\?' | Select-Object -First 1
    $DbHost = ($dbUrl -split '@')[1] -split ':' | Select-Object -First 1
}

$confirm = Read-Host "Are you sure you want to create PRODUCTION database? (type 'yes' to confirm)"
if ($confirm -ne "yes") {
    Write-Host "Database creation cancelled."
    exit 0
}

# Check if psql is available
try {
    $null = Get-Command psql -ErrorAction Stop
} catch {
    Write-Fail "psql not found"
    Write-Host "   Install PostgreSQL client tools"
    exit 1
}

# Test connection to PostgreSQL server
Log-ProdDb "Testing PostgreSQL connection..."
$postgresUrl = "postgresql://${DbUser}:${DbPassword}@${DbHost}:${DbPort}/postgres"
try {
    $null = psql $postgresUrl -c "SELECT 1;" 2>&1 | Out-Null
    Write-Success "PostgreSQL connection successful"
} catch {
    Write-Fail "Cannot connect to PostgreSQL server"
    Write-Host ""
    Write-Host "Connection details:"
    Write-Host "  Host: $DbHost"
    Write-Host "  Port: $DbPort"
    Write-Host "  User: $DbUser"
    Write-Host ""
    Write-Host "Verify:"
    Write-Host "  - Database server is accessible"
    Write-Host "  - Network/firewall allows connection"
    Write-Host "  - Credentials are correct"
    exit 1
}

# Check if database exists
Log-ProdDb "Checking if database exists..."
try {
    $dbExists = psql $postgresUrl -tAc "SELECT 1 FROM pg_database WHERE datname='$DbName'" 2>&1 | Out-String | Trim()
    
    if ($dbExists -eq "1") {
        Write-Warn "Database '$DbName' already exists"
        Write-Host ""
        Write-Host "Options:"
        Write-Host "  1. Keep existing database (recommended)"
        Write-Host "  2. Drop and recreate (DANGEROUS - will lose all data)"
        Write-Host ""
        $option = Read-Host "Choose option (1 or 2)"
        
        if ($option -eq "2") {
            Write-Warn "⚠️  DANGER: This will DELETE ALL DATA in the production database!"
            $deleteConfirm = Read-Host "Type 'DELETE PRODUCTION DATA' to confirm"
            
            if ($deleteConfirm -eq "DELETE PRODUCTION DATA") {
                Log-ProdDb "Dropping existing database..."
                # Terminate existing connections
                $null = psql $postgresUrl -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DbName' AND pid <> pg_backend_pid();" 2>&1 | Out-Null
                $null = psql $postgresUrl -c "DROP DATABASE IF EXISTS `"$DbName`";" 2>&1 | Out-Null
                Write-Success "Database dropped"
            } else {
                Log-ProdDb "Database drop cancelled"
                exit 0
            }
        } else {
            Log-ProdDb "Keeping existing database"
            Write-Success "Production database ready"
            Write-Host ""
            Write-Host "📋 Next steps:"
            Write-Host "   npm run db:migrate:prod"
            exit 0
        }
    }
} catch {
    # Database doesn't exist, continue
}

# Create database
Log-ProdDb "Creating production database '$DbName'..."
try {
    $null = psql $postgresUrl -c "CREATE DATABASE `"$DbName`";" 2>&1 | Out-Null
    Write-Success "Database created successfully"
} catch {
    Write-Fail "Failed to create database: $($_.Exception.Message)"
    exit 1
}

# Verify database creation
Log-ProdDb "Verifying database..."
try {
    $null = psql $env:DATABASE_URL -c "SELECT current_database();" 2>&1 | Out-Null
    Write-Success "Database verification successful"
} catch {
    Write-Fail "Database verification failed"
    exit 1
}

Write-Host ""
Write-Success "Production database setup complete!"
Write-Host ""
Write-Host "📋 Next Steps:"
Write-Host "   1. Run migrations: npm run db:migrate:prod"
Write-Host "   2. Create backup: .\scripts\backup-database.ps1"
Write-Host "   3. Verify database connectivity"
Write-Host ""
Write-Host "⚠️  IMPORTANT:"
Write-Host "   - Store DATABASE_URL securely"
Write-Host "   - Set up automated backups"
Write-Host "   - Monitor database performance"
Write-Host "   - Document connection details (securely)"
