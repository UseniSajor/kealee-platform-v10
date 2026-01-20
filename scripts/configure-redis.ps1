# scripts/configure-redis.ps1
# Configure Redis performance settings (PowerShell version)

$ErrorActionPreference = "Continue"

param(
    [string]$ConfigFile = "",
    [string]$MaxMemory = "2gb",
    [string]$MaxMemoryPolicy = "allkeys-lru"
)

function Log-Redis {
    param([string]$Message)
    Write-Host "[REDIS] $Message" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Fail {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

Write-Host "⚙️  Redis Performance Configuration" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

# Detect Redis config file
if (-not $ConfigFile) {
    $possiblePaths = @(
        "C:\Program Files\Redis\redis.conf",
        "C:\Redis\redis.conf",
        "$env:ProgramData\Redis\redis.conf"
    )
    
    foreach ($path in $possiblePaths) {
        if (Test-Path $path) {
            $ConfigFile = $path
            break
        }
    }
    
    if (-not $ConfigFile) {
        Write-Fail "Redis configuration file not found"
        $ConfigFile = Read-Host "Enter Redis config file path"
    }
}

if (-not (Test-Path $ConfigFile)) {
    Write-Fail "Configuration file not found: $ConfigFile"
    exit 1
}

Write-Success "Found Redis config: $ConfigFile"

# Backup original config
$backupFile = "${ConfigFile}.backup.$(Get-Date -Format 'yyyyMMdd_HHmmss')"
Log-Redis "Backing up original configuration..."
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
        [string]$Value
    )
    
    $pattern = "^\s*#*\s*$([regex]::Escape($Param))\s+"
    
    if ($configContent -match $pattern) {
        $configContent = $configContent -replace "$pattern.*", "$Param $Value"
        Log-Redis "  Updated: $Param $Value"
    } else {
        $configContent += "`n# Performance tuning - added by configure-redis.ps1`n"
        $configContent += "$Param $Value`n"
        Log-Redis "  Added: $Param $Value"
    }
}

# Update configuration parameters
Log-Redis "Updating configuration parameters..."

Update-Config "maxmemory" $MaxMemory
Update-Config "maxmemory-policy" $MaxMemoryPolicy
Update-Config "save" "900 1"
Update-Config "save" "300 10"
Update-Config "save" "60 10000"
Update-Config "appendonly" "yes"
Update-Config "appendfsync" "everysec"
Update-Config "tcp-keepalive" "300"
Update-Config "timeout" "300"

# Write updated config
Set-Content $ConfigFile $configContent -NoNewline
Write-Success "Configuration updated"

Write-Host ""
Write-Host "📋 Next Steps" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. ✅ Restart Redis service"
Write-Host "2. ✅ Verify settings: redis-cli CONFIG GET maxmemory"
Write-Host "3. ✅ Monitor Redis: redis-cli INFO memory"
Write-Host ""
