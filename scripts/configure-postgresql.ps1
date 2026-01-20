# scripts/configure-postgresql.ps1
# Configure PostgreSQL performance settings (PowerShell version)

$ErrorActionPreference = "Continue"

param(
    [string]$ConfigFile = "",
    [string]$DataDir = "",
    [int]$MaxConnections = 200,
    [string]$SharedBuffers = "4GB",
    [string]$EffectiveCacheSize = "12GB",
    [string]$MaintenanceWorkMem = "1GB",
    [double]$CheckpointCompletionTarget = 0.9,
    [string]$WalBuffers = "16MB",
    [int]$DefaultStatisticsTarget = 100
)

function Log-Postgres {
    param([string]$Message)
    Write-Host "[POSTGRES] $Message" -ForegroundColor Cyan
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

Write-Host "⚙️  PostgreSQL Performance Configuration" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

# Detect PostgreSQL config file
if (-not $ConfigFile) {
    $possiblePaths = @(
        "C:\Program Files\PostgreSQL\16\data\postgresql.conf",
        "C:\Program Files\PostgreSQL\15\data\postgresql.conf",
        "C:\Program Files\PostgreSQL\14\data\postgresql.conf",
        "$env:ProgramData\PostgreSQL\16\data\postgresql.conf"
    )
    
    foreach ($path in $possiblePaths) {
        if (Test-Path $path) {
            $ConfigFile = $path
            break
        }
    }
    
    if (-not $ConfigFile) {
        Write-Fail "PostgreSQL configuration file not found"
        Write-Host ""
        Write-Host "Common locations:"
        Write-Host "  - C:\Program Files\PostgreSQL\*\data\postgresql.conf"
        Write-Host "  - C:\ProgramData\PostgreSQL\*\data\postgresql.conf"
        Write-Host ""
        $ConfigFile = Read-Host "Enter PostgreSQL config file path"
    }
}

if (-not (Test-Path $ConfigFile)) {
    Write-Fail "Configuration file not found: $ConfigFile"
    exit 1
}

Write-Success "Found PostgreSQL config: $ConfigFile"

# Backup original config
$backupFile = "${ConfigFile}.backup.$(Get-Date -Format 'yyyyMMdd_HHmmss')"
Log-Postgres "Backing up original configuration..."
try {
    Copy-Item $ConfigFile $backupFile
    Write-Success "Backup created: $backupFile"
} catch {
    Write-Warn "Could not create backup: $($_.Exception.Message)"
}

# Read current config
$configContent = Get-Content $ConfigFile -Raw

# Function to update or add config parameter
function Update-Config {
    param(
        [string]$Param,
        [string]$Value,
        [string]$File
    )
    
    $pattern = "^\s*$([regex]::Escape($Param))\s*="
    
    if ($configContent -match $pattern) {
        # Update existing parameter
        $configContent = $configContent -replace "$pattern.*", "$Param = $Value"
        Log-Postgres "  Updated: $Param = $Value"
    } else {
        # Add new parameter
        $configContent += "`n# Performance tuning - added by configure-postgresql.ps1`n"
        $configContent += "$Param = $Value`n"
        Log-Postgres "  Added: $Param = $Value"
    }
}

# Update configuration parameters
Log-Postgres "Updating configuration parameters..."

Update-Config "max_connections" $MaxConnections
Update-Config "shared_buffers" $SharedBuffers
Update-Config "effective_cache_size" $EffectiveCacheSize
Update-Config "maintenance_work_mem" $MaintenanceWorkMem
Update-Config "checkpoint_completion_target" $CheckpointCompletionTarget
Update-Config "wal_buffers" $WalBuffers
Update-Config "default_statistics_target" $DefaultStatisticsTarget

# Calculate work_mem
$workMemCalc = [math]::Round((12 * 1024) / $MaxConnections)
$workMem = "${workMemCalc}MB"

Update-Config "work_mem" $workMem
Update-Config "random_page_cost" "1.1"
Update-Config "effective_io_concurrency" "200"
Update-Config "min_wal_size" "1GB"
Update-Config "max_wal_size" "4GB"
Update-Config "max_worker_processes" "8"
Update-Config "max_parallel_workers_per_gather" "4"
Update-Config "max_parallel_workers" "8"
Update-Config "max_parallel_maintenance_workers" "4"

# Write updated config
Set-Content $ConfigFile $configContent -NoNewline
Write-Success "Configuration updated"

# Generate configuration summary
$configSummary = "postgresql-config-summary.txt"
Log-Postgres "Generating configuration summary: $configSummary"

$summaryContent = @"
# PostgreSQL Performance Configuration Summary
# Generated: $(Get-Date)
# Config file: $ConfigFile

# Performance Settings Applied:
max_connections = $MaxConnections
shared_buffers = $SharedBuffers
effective_cache_size = $EffectiveCacheSize
maintenance_work_mem = $MaintenanceWorkMem
checkpoint_completion_target = $CheckpointCompletionTarget
wal_buffers = $WalBuffers
default_statistics_target = $DefaultStatisticsTarget
work_mem = $workMem
random_page_cost = 1.1
effective_io_concurrency = 200
min_wal_size = 1GB
max_wal_size = 4GB
max_worker_processes = 8
max_parallel_workers_per_gather = 4
max_parallel_workers = 8
max_parallel_maintenance_workers = 4

# Next Steps:
# 1. Review configuration: $ConfigFile
# 2. Restart PostgreSQL service
# 3. Verify settings: psql -c "SHOW max_connections;"
# 4. Monitor performance after changes
"@

$summaryContent | Out-File -FilePath $configSummary -Encoding utf8
Write-Success "Configuration summary saved: $configSummary"

Write-Host ""
Write-Host "📋 Next Steps" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. ✅ Restart PostgreSQL service:"
Write-Host "   Restart-Service postgresql-x64-16"
Write-Host ""
Write-Host "2. ✅ Verify settings:"
Write-Host "   psql -c `"SHOW max_connections;`""
Write-Host ""
Write-Host "3. ✅ Monitor performance"
Write-Host ""
