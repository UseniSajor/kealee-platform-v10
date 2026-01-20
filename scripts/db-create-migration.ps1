# scripts/db-create-migration.ps1
# Create a new database migration (PowerShell version)

param(
    [Parameter(Mandatory=$true)]
    [string]$Name
)

$ErrorActionPreference = "Stop"

function Log-Migration {
    param([string]$Message)
    Write-Host "[MIGRATION] $Message" -ForegroundColor Cyan
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

$migrationName = $Name

# Validate migration name
if ($migrationName -notmatch '^[a-zA-Z0-9_]+$') {
    Write-Fail "Invalid migration name. Use only letters, numbers, and underscores."
    exit 1
}

Write-Host "📝 Creating Database Migration" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "   Migration name: $migrationName"
Write-Host ""

# Navigate to database package
Push-Location packages/database

# Check if Prisma schema exists
if (-not (Test-Path "prisma/schema.prisma")) {
    Write-Fail "Prisma schema not found: prisma/schema.prisma"
    Pop-Location
    exit 1
}

# Check if migrations directory exists
if (-not (Test-Path "prisma/migrations")) {
    Log-Migration "Creating migrations directory..."
    New-Item -ItemType Directory -Path "prisma/migrations" -Force | Out-Null
}

Log-Migration "Creating migration: $migrationName..."

try {
    npx prisma migrate dev --create-only --schema=./prisma/schema.prisma --name=$migrationName
    Write-Success "Migration created successfully"
    
    # Find the created migration
    $latestMigration = Get-ChildItem -Path "prisma/migrations" -Directory | 
        Where-Object { $_.Name -match "^[0-9]+_$migrationName" } | 
        Sort-Object Name -Descending | 
        Select-Object -First 1
    
    if ($latestMigration) {
        $migrationPath = $latestMigration.FullName
        $migrationFile = Join-Path $migrationPath "migration.sql"
        
        if (Test-Path $migrationFile) {
            Write-Host ""
            Write-Host "📄 Migration file created:"
            Write-Host "   $migrationFile"
            Write-Host ""
            Write-Host "📝 Next steps:"
            Write-Host "   1. Review the migration SQL"
            Write-Host "   2. Edit if needed: $migrationFile"
            Write-Host "   3. Test locally: npm run db:migrate"
            Write-Host "   4. Apply to production: npm run db:migrate:prod"
            Write-Host ""
            Write-Host "Migration SQL preview:"
            Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
            Get-Content $migrationFile -TotalCount 20
        } else {
            Write-Warn "Migration directory created but SQL file not found"
        }
    } else {
        Write-Warn "Could not locate created migration file"
    }
} catch {
    Write-Fail "Failed to create migration: $($_.Exception.Message)"
    Pop-Location
    exit 1
}

Pop-Location
