# Vercel Projects Setup Script (PowerShell)
# Sets up all 7 Kealee Platform apps in Vercel

param(
    [string]$Org = "kealee"
)

$ErrorActionPreference = "Stop"

function Write-Log {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$timestamp] $Message" -ForegroundColor Green
}

function Write-Error-Log {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$timestamp] ERROR: $Message" -ForegroundColor Red
    exit 1
}

function Write-Warning-Log {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$timestamp] WARNING: $Message" -ForegroundColor Yellow
}

# Check if Vercel CLI is installed
try {
    $vercelVersion = vercel --version
    Write-Log "Vercel CLI version: $vercelVersion"
} catch {
    Write-Error-Log "Vercel CLI not found. Install with: npm install -g vercel"
}

# Check if logged in
try {
    vercel whoami | Out-Null
} catch {
    Write-Log "Please login to Vercel..."
    vercel login
}

# Apps and their domains
$Apps = @{
    "m-marketplace" = "marketplace.kealee.com"
    "os-admin" = "admin.kealee.com"
    "os-pm" = "pm.kealee.com"
    "m-ops-services" = "ops.kealee.com"
    "m-project-owner" = "app.kealee.com"
    "m-architect" = "architect.kealee.com"
    "m-permits-inspections" = "permits.kealee.com"
}

Write-Log "Setting up Vercel projects for Kealee Platform"
Write-Log "Organization: $Org"
Write-Host ""

# Step 1: Add projects
Write-Log "Step 1: Adding Vercel projects..."
foreach ($app in $Apps.Keys) {
    Write-Log "Adding project: $app"
    
    if (Test-Path "apps\$app") {
        Push-Location "apps\$app"
        
        try {
            vercel link --yes --scope=$Org --project=$app 2>$null
            Write-Log "✅ Project linked: $app"
        } catch {
            Write-Warning-Log "Project may already be linked or link failed: $app"
        }
        
        Pop-Location
    } else {
        Write-Warning-Log "Directory not found: apps\$app"
    }
}

Write-Host ""

# Step 2: Add domains
Write-Log "Step 2: Adding domains..."
foreach ($app in $Apps.Keys) {
    $domain = $Apps[$app]
    Write-Log "Adding domain $domain to $app"
    
    try {
        vercel domains add $domain --scope=$Org 2>$null
        Write-Log "✅ Domain added: $domain"
    } catch {
        Write-Warning-Log "Domain may already exist or add failed: $domain"
    }
}

Write-Host ""

# Step 3: Environment variables info
Write-Log "Step 3: Environment Variables Setup"
Write-Log "Note: Set environment variables manually in Vercel Dashboard or use:"
Write-Log "  vercel env add VARIABLE_NAME production"
Write-Host ""

Write-Log "✅ Vercel projects setup complete!"
Write-Host ""
Write-Log "Next steps:"
Write-Log "1. Set environment variables in Vercel Dashboard"
Write-Log "2. Or use: vercel env add VARIABLE_NAME production"
Write-Log "3. Deploy each app: cd apps\<app> ; vercel --prod"
