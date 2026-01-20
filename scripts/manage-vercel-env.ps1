# scripts/manage-vercel-env.ps1
# Manage Vercel environment variables (PowerShell)

$ErrorActionPreference = "Continue"

function Log-VercelEnv {
    param([string]$Message)
    Write-Host "[VERCEL ENV] $Message" -ForegroundColor Cyan
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

# Check Vercel CLI
$vercelPath = Get-Command vercel -ErrorAction SilentlyContinue
if (-not $vercelPath) {
    Write-Fail "Vercel CLI is not installed"
    Write-Host "Install: npm install -g vercel"
    exit 1
}

# Check Vercel token
if (-not $env:VERCEL_TOKEN) {
    Write-Warn "VERCEL_TOKEN is not set"
    Write-Host "Set it: `$env:VERCEL_TOKEN='your-token'"
    Write-Host "Or login: vercel login"
    
    try {
        $user = & vercel whoami 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Fail "Not logged in to Vercel"
            Write-Host "Login: vercel login"
            exit 1
        }
        Write-Success "Using Vercel login session"
    } catch {
        Write-Fail "Not logged in to Vercel"
        exit 1
    }
} else {
    Write-Success "Using VERCEL_TOKEN"
}

# Applications
$apps = @(
    "m-marketplace",
    "os-admin",
    "os-pm",
    "m-ops-services",
    "m-project-owner",
    "m-architect",
    "m-permits-inspections"
)

# Function to list environment variables
function Get-VercelEnvVars {
    param(
        [string]$App,
        [string]$Environment = "production"
    )
    
    Log-VercelEnv "Listing $Environment environment variables for $App..."
    
    if ($env:VERCEL_TOKEN) {
        & vercel env ls $App --environment=$Environment --token=$env:VERCEL_TOKEN 2>&1
    } else {
        Push-Location "apps/$App"
        & vercel env ls --environment=$Environment 2>&1
        Pop-Location
    }
}

# Function to add environment variable
function Add-VercelEnvVar {
    param(
        [string]$App,
        [string]$VarName,
        [string]$VarValue = "",
        [string]$Environment = "production"
    )
    
    Log-VercelEnv "Adding $VarName to $App ($Environment)..."
    
    if (-not $VarValue) {
        $secureValue = Read-Host "Enter value for $VarName" -AsSecureString
        $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureValue)
        $VarValue = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
    }
    
    if ($env:VERCEL_TOKEN) {
        $VarValue | & vercel env add $VarName $Environment --token=$env:VERCEL_TOKEN 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Added $VarName to $App ($Environment)"
        } else {
            Write-Fail "Failed to add $VarName"
        }
    } else {
        Push-Location "apps/$App"
        $VarValue | & vercel env add $VarName $Environment 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Added $VarName to $App ($Environment)"
        } else {
            Write-Fail "Failed to add $VarName"
        }
        Pop-Location
    }
}

# Function to remove environment variable
function Remove-VercelEnvVar {
    param(
        [string]$App,
        [string]$VarName,
        [string]$Environment = "production"
    )
    
    Log-VercelEnv "Removing $VarName from $App ($Environment)..."
    
    $confirm = Read-Host "Are you sure you want to remove $VarName? (y/N)"
    if ($confirm -ne "y" -and $confirm -ne "Y") {
        Write-Host "Cancelled"
        return
    }
    
    if ($env:VERCEL_TOKEN) {
        & vercel env rm $VarName $Environment --token=$env:VERCEL_TOKEN --yes 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Removed $VarName from $App ($Environment)"
        } else {
            Write-Fail "Failed to remove $VarName"
        }
    } else {
        Push-Location "apps/$App"
        & vercel env rm $VarName $Environment --yes 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Removed $VarName from $App ($Environment)"
        } else {
            Write-Fail "Failed to remove $VarName"
        }
        Pop-Location
    }
}

# Function to pull environment variables
function Pull-VercelEnvVars {
    param(
        [string]$App,
        [string]$Environment = "production"
    )
    
    Log-VercelEnv "Pulling $Environment environment variables for $App..."
    
    if (Test-Path "apps/$App") {
        Push-Location "apps/$App"
        & vercel env pull ".env.$Environment" --environment=$Environment 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Pulled environment variables to .env.$Environment"
        } else {
            Write-Fail "Failed to pull environment variables"
        }
        Pop-Location
    } else {
        Write-Fail "App directory not found: apps/$App"
    }
}

# Main menu
Write-Host "🔐 Vercel Environment Variables Manager" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "Select action:"
Write-Host "  1) List environment variables"
Write-Host "  2) Add environment variable"
Write-Host "  3) Remove environment variable"
Write-Host "  4) Pull environment variables"
Write-Host "  5) List all apps' variables"
Write-Host ""

$action = Read-Host "Enter choice (1-5)"

switch ($action) {
    "1" {
        Write-Host ""
        Write-Host "Select app:"
        for ($i = 0; $i -lt $apps.Length; $i++) {
            Write-Host "  $($i+1)) $($apps[$i])"
        }
        $appChoice = Read-Host "Enter choice"
        $app = $apps[[int]$appChoice - 1]
        
        Write-Host ""
        Write-Host "Select environment:"
        Write-Host "  1) production"
        Write-Host "  2) preview"
        Write-Host "  3) development"
        $envChoice = Read-Host "Enter choice (1-3)"
        $env = switch ($envChoice) {
            "1" { "production" }
            "2" { "preview" }
            "3" { "development" }
            default { "production" }
        }
        
        Get-VercelEnvVars -App $app -Environment $env
    }
    "2" {
        Write-Host ""
        Write-Host "Select app:"
        for ($i = 0; $i -lt $apps.Length; $i++) {
            Write-Host "  $($i+1)) $($apps[$i])"
        }
        $appChoice = Read-Host "Enter choice"
        $app = $apps[[int]$appChoice - 1]
        
        Write-Host ""
        Write-Host "Select environment:"
        Write-Host "  1) production"
        Write-Host "  2) preview"
        Write-Host "  3) development"
        $envChoice = Read-Host "Enter choice (1-3)"
        $env = switch ($envChoice) {
            "1" { "production" }
            "2" { "preview" }
            "3" { "development" }
            default { "production" }
        }
        
        $varName = Read-Host "Variable name"
        $varValue = Read-Host "Variable value (leave empty to enter securely)" -AsSecureString
        
        if ($varValue) {
            $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($varValue)
            $varValueStr = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
        } else {
            $varValueStr = ""
        }
        
        Add-VercelEnvVar -App $app -VarName $varName -VarValue $varValueStr -Environment $env
    }
    "3" {
        Write-Host ""
        Write-Host "Select app:"
        for ($i = 0; $i -lt $apps.Length; $i++) {
            Write-Host "  $($i+1)) $($apps[$i])"
        }
        $appChoice = Read-Host "Enter choice"
        $app = $apps[[int]$appChoice - 1]
        
        Write-Host ""
        Write-Host "Select environment:"
        Write-Host "  1) production"
        Write-Host "  2) preview"
        Write-Host "  3) development"
        $envChoice = Read-Host "Enter choice (1-3)"
        $env = switch ($envChoice) {
            "1" { "production" }
            "2" { "preview" }
            "3" { "development" }
            default { "production" }
        }
        
        $varName = Read-Host "Variable name to remove"
        
        Remove-VercelEnvVar -App $app -VarName $varName -Environment $env
    }
    "4" {
        Write-Host ""
        Write-Host "Select app:"
        for ($i = 0; $i -lt $apps.Length; $i++) {
            Write-Host "  $($i+1)) $($apps[$i])"
        }
        $appChoice = Read-Host "Enter choice"
        $app = $apps[[int]$appChoice - 1]
        
        Write-Host ""
        Write-Host "Select environment:"
        Write-Host "  1) production"
        Write-Host "  2) preview"
        Write-Host "  3) development"
        $envChoice = Read-Host "Enter choice (1-3)"
        $env = switch ($envChoice) {
            "1" { "production" }
            "2" { "preview" }
            "3" { "development" }
            default { "production" }
        }
        
        Pull-VercelEnvVars -App $app -Environment $env
    }
    "5" {
        Write-Host ""
        Write-Host "Select environment:"
        Write-Host "  1) production"
        Write-Host "  2) preview"
        Write-Host "  3) development"
        $envChoice = Read-Host "Enter choice (1-3)"
        $env = switch ($envChoice) {
            "1" { "production" }
            "2" { "preview" }
            "3" { "development" }
            default { "production" }
        }
        
        Write-Host ""
        foreach ($app in $apps) {
            Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
            Write-Host "📦 $app ($env)" -ForegroundColor Cyan
            Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
            Get-VercelEnvVars -App $app -Environment $env
            Write-Host ""
        }
    }
    default {
        Write-Fail "Invalid choice"
        exit 1
    }
}

Write-Host ""
Write-Success "Operation complete"
