# scripts/setup-env-local.ps1
# Set up .env.local files for all apps from .env.example templates (PowerShell)

$ErrorActionPreference = "Continue"

function Log-Setup {
    param([string]$Message)
    Write-Host "[SETUP] $Message" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Warn {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

Write-Host "🔧 Setting Up Environment Variables" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

# Apps directory
$appsDir = "apps"
$servicesDir = "services"

# Default database URL
$defaultDbUrl = "postgresql://kealee:kealee_dev@localhost:5433/kealee_development"

# Function to setup env file for an app
function Setup-AppEnv {
    param(
        [string]$AppDir,
        [string]$AppName
    )
    
    $envExample = Join-Path $AppDir ".env.example"
    $envLocal = Join-Path $AppDir ".env.local"
    
    if (-not (Test-Path $envExample)) {
        Write-Warn "No .env.example found for $AppName, skipping..."
        return
    }
    
    if (Test-Path $envLocal) {
        Write-Warn ".env.local already exists for $AppName"
        $overwrite = Read-Host "  Overwrite? (y/N)"
        if ($overwrite -ne "y" -and $overwrite -ne "Y") {
            Log-Setup "Skipping $AppName"
            return
        }
    }
    
    Log-Setup "Setting up $AppName..."
    
    # Copy example to local
    Copy-Item $envExample $envLocal
    
    # Replace default DATABASE_URL if it's the placeholder
    $content = Get-Content $envLocal -Raw
    $content = $content -replace "postgresql://postgres:password@localhost:5432/kealee_development", $defaultDbUrl
    
    # Generate NEXTAUTH_SECRET if it's a placeholder
    if ($content -match "your-secret-key-here") {
        try {
            # Generate random bytes and convert to base64
            $bytes = New-Object byte[] 32
            [System.Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
            $secret = [Convert]::ToBase64String($bytes)
            $content = $content -replace "your-secret-key-here-generate-with-openssl-rand-base64-32", $secret
            Log-Setup "  Generated NEXTAUTH_SECRET"
        } catch {
            Write-Warn "  Could not generate NEXTAUTH_SECRET, please set manually"
        }
    }
    
    Set-Content $envLocal $content
    Write-Success "Created $envLocal"
}

# Setup apps
Log-Setup "Setting up app environment files..."
Get-ChildItem -Path $appsDir -Directory | ForEach-Object {
    Setup-AppEnv $_.FullName $_.Name
}

# Setup services
Log-Setup "Setting up service environment files..."
Get-ChildItem -Path $servicesDir -Directory | ForEach-Object {
    Setup-AppEnv $_.FullName $_.Name
}

Write-Host ""
Write-Success "Environment setup complete!"
Write-Host ""
Write-Host "📋 Next Steps:"
Write-Host "   1. Review and update .env.local files with your actual values"
Write-Host "   2. Set Stripe keys from your Stripe Dashboard"
Write-Host "   3. Set Supabase keys from your Supabase project"
Write-Host "   4. Configure analytics IDs if needed"
Write-Host ""
Write-Host "💡 Tip: Use the same NEXTAUTH_SECRET across all apps for SSO"
