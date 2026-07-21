# scripts/setup-staging-env.ps1
# Set up staging environment variables for all applications (PowerShell)

$ErrorActionPreference = "Continue"

function Log-Staging {
    param([string]$Message)
    Write-Host "[STAGING] $Message" -ForegroundColor Cyan
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

Write-Host "🔐 Setting Up Staging Environment Variables" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "This will set environment variables for the 'preview' environment"
Write-Host "(Vercel's staging/preview environment)"
Write-Host ""

# Ask if user wants to copy from production
$copyFromProd = Read-Host "Copy environment variables from production? (y/N)"

$environment = "preview"

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

$successCount = 0
$failCount = 0
$skipCount = 0

foreach ($app in $apps) {
    $appDir = "apps\$app"
    
    if (-not (Test-Path $appDir)) {
        Write-Warn "Directory not found: $appDir"
        $skipCount++
        continue
    }
    
    Write-Host ""
    Log-Staging "Setting up $app..."
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    
    Push-Location $appDir
    
    # Check if project is linked
    if (-not (Test-Path ".vercel\project.json")) {
        Write-Warn "Project not linked to Vercel"
        $linkNow = Read-Host "  Link now? (y/N)"
        if ($linkNow -eq "y" -or $linkNow -eq "Y") {
            try {
                vercel link
                Write-Success "Project linked"
            } catch {
                Write-Fail "Failed to link project"
                Pop-Location
                $failCount++
                continue
            }
        } else {
            Write-Warn "Skipping $app (not linked)"
            Pop-Location
            $skipCount++
            continue
        }
    }
    
    # If copying from production, use copy-env-to-staging script
    if ($copyFromProd -eq "y" -or $copyFromProd -eq "Y") {
        Pop-Location
        Log-Staging "Copying production env vars to staging for $app..."
        try {
            & ".\scripts\copy-env-to-staging.ps1" -App $app -Force
            Write-Success "$app : Copied from production"
            $successCount++
        } catch {
            Write-Fail "$app : Failed to copy from production"
            $failCount++
        }
        continue
    }
    
    # Otherwise, set staging-specific variables
    Log-Staging "Setting staging environment variables for $app..."
    
    # Common environment variables
    $envVars = @(
        "DATABASE_URL",
        "NEXTAUTH_URL",
        "NEXTAUTH_SECRET",
        "SUPABASE_URL",
        "SUPABASE_ANON_KEY",
        "SUPABASE_SERVICE_ROLE_KEY",
        "STRIPE_SECRET_KEY",
        "STRIPE_WEBHOOK_SECRET",
        "STRIPE_PUBLISHABLE_KEY",
        "NEXT_PUBLIC_API_URL",
        "NEXT_PUBLIC_SITE_URL",
        "NEXT_PUBLIC_SENTRY_DSN",
        "SENTRY_DSN"
    )
    
    # App-specific variables
    switch ($app) {
        "m-marketplace" {
            $envVars += @("NEXT_PUBLIC_GA_MEASUREMENT_ID", "NEXT_PUBLIC_GTM_ID", "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY")
        }
        "m-ops-services" {
            $envVars += @("STRIPE_PRICE_PACKAGE_A", "STRIPE_PRICE_PACKAGE_B", "STRIPE_PRICE_PACKAGE_C", "STRIPE_PRICE_PACKAGE_D")
        }
        "m-architect" {
            $envVars += @("S3_ACCESS_KEY_ID", "S3_SECRET_ACCESS_KEY", "S3_BUCKET_NAME", "S3_REGION")
        }
        "m-permits-inspections" {
            $envVars += @("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY")
        }
    }
    
    $setCount = 0
    $skipVarCount = 0
    
    foreach ($var in $envVars) {
        # Check if value exists in .env.local or .env
        $value = $null
        
        # Try .env.local first
        if (Test-Path ".env.local") {
            $line = Select-String -Path ".env.local" -Pattern "^$var=" | Select-Object -First 1
            if ($line) {
                $value = ($line.Line -split '=', 2)[1] -replace '^"|"$', '' | Trim()
            }
        }
        
        # Try .env
        if (-not $value -and (Test-Path ".env")) {
            $line = Select-String -Path ".env" -Pattern "^$var=" | Select-Object -First 1
            if ($line) {
                $value = ($line.Line -split '=', 2)[1] -replace '^"|"$', '' | Trim()
            }
        }
        
        # Try environment variable
        if (-not $value) {
            $value = [Environment]::GetEnvironmentVariable($var)
        }
        
        # Try from file
        if (-not $value -and (Test-Path "$($var.ToLower()).txt")) {
            $value = Get-Content "$($var.ToLower()).txt" | Trim()
        }
        
        if ($value) {
            # For staging, modify URLs if needed
            if ($var -match "URL" -and ($value -match "production" -or $value -match "kealee\.com")) {
                $value = $value -replace "production", "staging" -replace "kealee\.com", "staging.kealee.com"
            }
            
            Log-Staging "  Setting $var..."
            try {
                $value | vercel env add $var $environment 2>&1 | Out-Null
                Write-Success "  $var set"
                $setCount++
            } catch {
                # Check if already exists
                $envList = vercel env ls 2>&1
                if ($envList -match "$var.*$environment") {
                    Write-Warn "  $var already exists, skipping"
                    $skipVarCount++
                } else {
                    Write-Fail "  Failed to set $var"
                }
            }
        } else {
            Write-Warn "  $var not found, skipping"
            $skipVarCount++
        }
    }
    
    Pop-Location
    
    if ($setCount -gt 0) {
        Write-Success "$app : $setCount variable(s) set"
        $successCount++
    } else {
        Write-Warn "$app : No variables set (all skipped or failed)"
        $skipCount++
    }
}

# Summary
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "📊 Staging Environment Setup Summary" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Success "Apps configured: $successCount"
if ($skipCount -gt 0) {
    Write-Warn "Apps skipped: $skipCount"
}
if ($failCount -gt 0) {
    Write-Fail "Apps failed: $failCount"
}
Write-Host ""

if ($failCount -eq 0 -and $successCount -gt 0) {
    Write-Host "✅ Staging environment setup complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Next Steps:"
    Write-Host "   1. Verify environment variables:"
    Write-Host "      cd apps\m-marketplace && vercel env ls"
    Write-Host "   2. Deploy to staging:"
    Write-Host "      .\scripts\deploy-staging.ps1"
    Write-Host "   3. Test staging deployment"
    exit 0
} else {
    Write-Host "⚠️  Some applications failed. Review errors above."
    exit 1
}
