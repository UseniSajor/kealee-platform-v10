# scripts/configure-nginx.ps1
# Configure Nginx reverse proxy for API backend (PowerShell version)

$ErrorActionPreference = "Continue"

param(
    [string]$ConfigDir = "",
    [int]$BackendPort = 3000,
    [string]$ServerName = "api.kealee.com"
)

function Log-Nginx {
    param([string]$Message)
    Write-Host "[NGINX] $Message" -ForegroundColor Cyan
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

Write-Host "⚙️  Nginx Reverse Proxy Configuration" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

# Note: Nginx on Windows is less common
Write-Warn "Nginx on Windows requires manual configuration"
Write-Host ""
Write-Host "For Windows, consider:"
Write-Host "  1. Using IIS with Application Request Routing (ARR)"
Write-Host "  2. Running Nginx in WSL2"
Write-Host "  3. Using Docker with Nginx"
Write-Host ""

# Detect Nginx installation
Log-Nginx "Checking for Nginx..."
$nginxPath = Get-Command nginx -ErrorAction SilentlyContinue

if (-not $nginxPath) {
    Write-Fail "Nginx is not installed or not in PATH"
    Write-Host ""
    Write-Host "For Windows:"
    Write-Host "  1. Install Nginx: https://nginx.org/en/download.html"
    Write-Host "  2. Or use WSL2: wsl --install"
    Write-Host "  3. Or use Docker: docker run -d -p 80:80 nginx"
    exit 1
}

Write-Success "Nginx found: $($nginxPath.Source)"

# Detect config directory
if (-not $ConfigDir) {
    $possiblePaths = @(
        "C:\nginx\conf",
        "C:\Program Files\nginx\conf",
        "$env:ProgramData\nginx\conf"
    )
    
    foreach ($path in $possiblePaths) {
        if (Test-Path $path) {
            $ConfigDir = $path
            break
        }
    }
    
    if (-not $ConfigDir) {
        $ConfigDir = Read-Host "Enter Nginx config directory"
    }
}

if (-not (Test-Path $ConfigDir)) {
    Write-Fail "Configuration directory not found: $ConfigDir"
    exit 1
}

Write-Success "Using config directory: $ConfigDir"

# Create site configuration
$siteConfig = Join-Path $ConfigDir "api.kealee.com.conf"
Log-Nginx "Creating site configuration: $siteConfig"

# Backup existing config
if (Test-Path $siteConfig) {
    $backupFile = "${siteConfig}.backup.$(Get-Date -Format 'yyyyMMdd_HHmmss')"
    Copy-Item $siteConfig $backupFile
    Write-Success "Backup created: $backupFile"
}

# Generate configuration
$configContent = @"
# Nginx configuration for $ServerName
# Generated: $(Get-Date)

upstream api_backend {
    server localhost:$BackendPort;
    keepalive 32;
}

server {
    listen 80;
    server_name $ServerName;
    
    location / {
        proxy_pass http://api_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade `$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host `$host;
        proxy_set_header X-Real-IP `$remote_addr;
        proxy_set_header X-Forwarded-For `$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto `$scheme;
        proxy_cache_bypass `$http_upgrade;
    }
    
    location /health {
        proxy_pass http://api_backend;
        access_log off;
    }
}
"@

$configContent | Out-File -FilePath $siteConfig -Encoding utf8
Write-Success "Configuration file created: $siteConfig"

Write-Host ""
Write-Host "📋 Next Steps" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. ✅ Test configuration:"
Write-Host "   nginx -t"
Write-Host ""
Write-Host "2. ✅ Reload Nginx:"
Write-Host "   nginx -s reload"
Write-Host ""
Write-Host "3. ✅ Test connection:"
Write-Host "   curl http://$ServerName/health"
Write-Host ""
