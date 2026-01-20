# scripts/setup-env.ps1
# Setup environment variables for Vercel projects (PowerShell version)

param(
    [Parameter(Mandatory=$true)]
    [string]$AppName,
    
    [Parameter(Mandatory=$true)]
    [ValidateSet("production", "preview", "development")]
    [string]$Environment
)

$ErrorActionPreference = "Continue"

function Log-Env {
    param([string]$Message)
    Write-Host "[ENV] $Message" -ForegroundColor Cyan
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

# Check if Vercel CLI is installed
try {
    $null = Get-Command vercel -ErrorAction Stop
} catch {
    Write-Fail "Vercel CLI not installed"
    Write-Host "   Install with: npm install -g vercel@latest"
    exit 1
}

# Check if logged in
try {
    $null = vercel whoami 2>&1 | Out-Null
} catch {
    Write-Fail "Not logged in to Vercel"
    Write-Host "   Login with: vercel login"
    exit 1
}

$appDir = "apps/$AppName"

if (-not (Test-Path $appDir)) {
    Write-Fail "Application directory not found: $appDir"
    exit 1
}

Write-Host "🔐 Setting Environment Variables" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "   App: $AppName"
Write-Host "   Environment: $Environment"
Write-Host ""

Push-Location $appDir

# Check if project is linked
if (-not (Test-Path ".vercel/project.json")) {
    Write-Warn "Project not linked to Vercel"
    Write-Host "   Linking project..."
    try {
        vercel link
        Write-Success "Project linked"
    } catch {
        Write-Fail "Failed to link project"
        Pop-Location
        exit 1
    }
}

# Common environment variables
$envVars = @(
    "DATABASE_URL",
    "SUPABASE_URL",
    "SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "STRIPE_PUBLISHABLE_KEY",
    "SENTRY_DSN",
    "SENTRY_AUTH_TOKEN",
    "NEXT_PUBLIC_API_URL",
    "NEXT_PUBLIC_APP_URL",
    "NODE_ENV"
)

# App-specific variables
switch ($AppName) {
    "m-marketplace" {
        $envVars += "NEXT_PUBLIC_MAPBOX_TOKEN"
    }
    "m-ops-services" {
        $envVars += @("STRIPE_PRICE_PACKAGE_A", "STRIPE_PRICE_PACKAGE_B", "STRIPE_PRICE_PACKAGE_C", "STRIPE_PRICE_PACKAGE_D")
    }
    "m-architect" {
        $envVars += @("S3_ACCESS_KEY_ID", "S3_SECRET_ACCESS_KEY", "S3_BUCKET_NAME", "S3_REGION")
    }
    "m-permits-inspections" {
        $envVars += "NEXT_PUBLIC_MAPBOX_TOKEN"
    }
}

Log-Env "Setting environment variables for $AppName ($Environment)..."

$setCount = 0
$skipCount = 0
$failCount = 0

foreach ($var in $envVars) {
    $value = $null
    
    # Try .env.local first
    if (Test-Path ".env.local") {
        $line = Select-String -Path ".env.local" -Pattern "^$var=" | Select-Object -First 1
        if ($line) {
            $value = ($line.Line -split '=', 2)[1].Trim('"').Trim()
        }
    }
    
    # Try .env
    if (-not $value -and (Test-Path ".env")) {
        $line = Select-String -Path ".env" -Pattern "^$var=" | Select-Object -First 1
        if ($line) {
            $value = ($line.Line -split '=', 2)[1].Trim('"').Trim()
        }
    }
    
    # Try environment variable
    if (-not $value) {
        $value = [Environment]::GetEnvironmentVariable($var)
    }
    
    # Try from file
    if (-not $value -and (Test-Path "$($var.ToLower()).txt")) {
        $value = Get-Content "$($var.ToLower()).txt" | Out-String | Trim()
    }
    
    if ($value) {
        Log-Env "  Setting $var..."
        try {
            $value | vercel env add $var $Environment 2>&1 | Out-Null
            Write-Success "  $var set"
            $setCount++
        } catch {
            # Check if already exists
            $existing = vercel env ls 2>&1 | Select-String "$var.*$Environment"
            if ($existing) {
                Write-Warn "  $var already exists, skipping"
                $skipCount++
            } else {
                Write-Fail "  Failed to set $var"
                $failCount++
            }
        }
    } else {
        Write-Warn "  $var not found, skipping"
        $skipCount++
    }
}

Pop-Location

# Summary
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "📊 Environment Setup Summary" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Success "Variables set: $setCount"
if ($skipCount -gt 0) {
    Write-Warn "Variables skipped: $skipCount"
}
if ($failCount -gt 0) {
    Write-Fail "Variables failed: $failCount"
}
Write-Host ""

if ($failCount -eq 0) {
    Write-Host "✅ Environment setup complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "To verify:"
    Write-Host "  cd $appDir"
    Write-Host "  vercel env ls"
} else {
    Write-Host "⚠️  Some variables failed to set. Review errors above." -ForegroundColor Yellow
    exit 1
}
