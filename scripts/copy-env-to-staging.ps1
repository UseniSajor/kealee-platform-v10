# scripts/copy-env-to-staging.ps1
# Copy production environment variables to staging (preview) - PowerShell version

param(
    [string]$App = "",
    [switch]$Force,
    [switch]$DryRun
)

$ErrorActionPreference = "Continue"

# Counters
$script:Copied = 0
$script:Skipped = 0
$script:Failed = 0

function Log-Copy {
    param([string]$Message)
    Write-Host "[COPY] $Message" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
    $script:Copied++
}

function Write-Fail {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
    $script:Failed++
}

function Write-Warn {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
    $script:Skipped++
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

Write-Host "📋 Copy Production Environment Variables to Staging" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
if ($DryRun) {
    Write-Warn "DRY RUN MODE: No changes will be made"
}
Write-Host ""

# Function to copy env vars for an app
function Copy-EnvForApp {
    param([string]$AppName)
    
    $appDir = "apps/$AppName"
    
    if (-not (Test-Path $appDir)) {
        Write-Warn "Directory not found: $appDir"
        return $false
    }
    
    Log-Copy "Processing $AppName..."
    
    Push-Location $appDir
    
    # Check if project is linked
    if (-not (Test-Path ".vercel/project.json")) {
        Write-Warn "$AppName : Project not linked, skipping"
        Pop-Location
        return $false
    }
    
    # Get production environment variables
    Log-Copy "  Fetching production environment variables..."
    try {
        $prodEnv = vercel env ls production 2>&1
    } catch {
        Write-Warn "$AppName : No production environment variables found"
        Pop-Location
        return $false
    }
    
    if (-not $prodEnv) {
        Write-Warn "$AppName : No production environment variables found"
        Pop-Location
        return $false
    }
    
    # Pull production env vars
    if (-not $DryRun) {
        if (Test-Path ".env.production") {
            Remove-Item ".env.production" -Force -ErrorAction SilentlyContinue
        }
        
        try {
            vercel env pull .env.production --environment=production --yes 2>&1 | Out-Null
        } catch {
            Write-Warn "$AppName : Could not pull production environment variables"
            Pop-Location
            return $false
        }
    }
    
    # Get preview env vars to check existing
    $previewEnv = vercel env ls preview 2>&1
    $previewVars = @()
    if ($previewEnv) {
        $previewVars = ($previewEnv | Select-String -Pattern "^\w+" | ForEach-Object { ($_ -split '\s+')[0] })
    }
    
    $varCount = 0
    
    # Parse production env file
    if (Test-Path ".env.production") {
        $envContent = Get-Content ".env.production"
        
        foreach ($line in $envContent) {
            if ($line -match "^([^=]+)=(.*)$") {
                $varName = $matches[1].Trim()
                $varValue = $matches[2].Trim().Trim('"')
                
                if ([string]::IsNullOrWhiteSpace($varName)) {
                    continue
                }
                
                # Check if already exists
                if ($previewVars -contains $varName -and -not $Force) {
                    Write-Warn "  $varName already exists in preview, skipping (use -Force to overwrite)"
                    continue
                }
                
                Log-Copy "  Copying $varName..."
                
                if ($DryRun) {
                    Write-Success "  [DRY RUN] Would copy $varName"
                    $varCount++
                } else {
                    # Remove existing if force
                    if ($Force -and ($previewVars -contains $varName)) {
                        vercel env rm $varName preview --yes 2>&1 | Out-Null
                    }
                    
                    # Set in preview
                    try {
                        $varValue | vercel env add $varName preview --yes 2>&1 | Out-Null
                        Write-Success "  Copied $varName"
                        $varCount++
                    } catch {
                        Write-Fail "  Failed to copy $varName"
                    }
                }
            }
        }
        
        # Cleanup
        if (-not $DryRun) {
            Remove-Item ".env.production" -Force -ErrorAction SilentlyContinue
        }
    } else {
        Write-Warn "$AppName : Could not read production environment variables"
    }
    
    Pop-Location
    
    if ($varCount -gt 0) {
        Write-Success "$AppName : Copied $varCount variables"
        return $true
    } else {
        Write-Warn "$AppName : No variables copied"
        return $false
    }
}

# If app specified, copy only that app
if ($App) {
    Copy-EnvForApp $App | Out-Null
} else {
    # Copy for all apps
    $apps = @(
        "m-marketplace",
        "os-admin",
        "os-pm",
        "m-ops-services",
        "m-project-owner",
        "m-architect",
        "m-permits-inspections"
    )
    
    foreach ($app in $apps) {
        Copy-EnvForApp $app | Out-Null
        Write-Host ""
    }
}

# Summary
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "📊 Copy Summary" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "✅ Variables copied: $($script:Copied)" -ForegroundColor Green
if ($script:Skipped -gt 0) {
    Write-Host "⚠️  Variables skipped: $($script:Skipped)" -ForegroundColor Yellow
}
if ($script:Failed -gt 0) {
    Write-Host "❌ Variables failed: $($script:Failed)" -ForegroundColor Red
}
Write-Host ""

if ($DryRun) {
    Write-Host "ℹ️  This was a dry run. No changes were made." -ForegroundColor Yellow
    Write-Host "   Run without -DryRun to apply changes."
} elseif ($script:Failed -eq 0) {
    Write-Host "✅ Environment variables copied successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "To verify:"
    if ($App) {
        Write-Host "  cd apps/$App"
    } else {
        Write-Host "  cd apps/m-marketplace  # or any app"
    }
    Write-Host "  vercel env ls preview"
} else {
    Write-Host "⚠️  Some variables failed to copy. Review errors above." -ForegroundColor Yellow
    exit 1
}
