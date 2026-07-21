# configure-vercel-env.ps1
# Comprehensive Vercel environment variable configuration script (PowerShell)

Write-Host "⚙️  Configuring Vercel environment variables..." -ForegroundColor Cyan

# Check if Vercel CLI is installed
$vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue
if (-not $vercelInstalled) {
    Write-Host "❌ Vercel CLI not found. Install with: npm install -g vercel" -ForegroundColor Red
    exit 1
}

# Check if logged in
try {
    vercel whoami 2>&1 | Out-Null
} catch {
    Write-Host "⚠️  Not logged in to Vercel. Please login..." -ForegroundColor Yellow
    vercel login
}

# Check for VERCEL_TOKEN
if (-not $env:VERCEL_TOKEN) {
    Write-Host "⚠️  VERCEL_TOKEN not set. Some operations may require manual authentication." -ForegroundColor Yellow
    Write-Host "   Set VERCEL_TOKEN environment variable for automated operations." -ForegroundColor Yellow
}

# Create backups directory
New-Item -ItemType Directory -Force -Path "backups" | Out-Null

# Create environment variable template
Write-Host "📝 Creating environment variable template..." -ForegroundColor Green
@"
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/database
DATABASE_URL_POOLER=postgresql://user:password@localhost:5432/database?pgbouncer=true
DATABASE_URL_PRODUCTION=postgresql://user:password@prod-host:5432/database
DATABASE_URL_STAGING=postgresql://user:password@staging-host:5432/database

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_ACCOUNT_ID=acct_...

# API
API_URL=https://api.kealee.com
NEXT_PUBLIC_API_URL=https://api.kealee.com
NEXT_PUBLIC_APP_URL=https://marketplace.kealee.com

# Authentication
NEXTAUTH_URL=https://marketplace.kealee.com
NEXTAUTH_SECRET=your-nextauth-secret-here
JWT_SECRET=your-jwt-secret-here

# Storage
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key
S3_BUCKET_NAME=kealee-storage
S3_REGION=us-east-1
S3_ENDPOINT=https://s3.us-east-1.amazonaws.com

# Email
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
EMAIL_FROM=noreply@kealee.com

# Monitoring
SENTRY_DSN=https://your-sentry-dsn.ingest.sentry.io/...
NEXT_PUBLIC_SENTRY_DSN=https://your-public-sentry-dsn.ingest.sentry.io/...
LOGROCKET_ID=your-logrocket-id

# Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-...
NEXT_PUBLIC_FB_PIXEL_ID=...
NEXT_PUBLIC_HOTJAR_ID=...

# External Services
DOCUSIGN_INTEGRATION_KEY=your-docusign-key
DOCUSIGN_SECRET_KEY=your-docusign-secret
DOCUSIGN_ACCOUNT_ID=your-docusign-account
DOCUSIGN_USER_ID=your-docusign-user

# Feature Flags
FEATURE_SUBSCRIPTIONS_ENABLED=true
FEATURE_PAYMENTS_ENABLED=true
FEATURE_FILE_UPLOADS_ENABLED=true
FEATURE_ANALYTICS_ENABLED=true
"@ | Out-File -FilePath ".env.template" -Encoding utf8

Write-Host "✅ Template created: .env.template" -ForegroundColor Green

# Apps to configure
$APPS = @(
    "m-marketplace",
    "os-admin",
    "os-pm",
    "m-ops-services",
    "m-project-owner",
    "m-architect",
    "m-permits-inspections"
)

$ENVIRONMENTS = @("production", "preview", "development")

# Load existing .env file if exists
if (Test-Path ".env.local") {
    Write-Host "📂 Loading existing .env.local..." -ForegroundColor Green
    Get-Content ".env.local" | ForEach-Object {
        if ($_ -match '^([^#][^=]+)=(.*)$') {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($name, $value, "Process")
        }
    }
} else {
    Write-Host "⚠️  .env.local not found. Creating from template..." -ForegroundColor Yellow
    Copy-Item ".env.template" ".env.local"
    Write-Host "⚠️  Please edit .env.local with actual values before continuing." -ForegroundColor Yellow
    Read-Host "Press Enter to continue after editing .env.local"
}

# Function to add env var to Vercel
function Add-EnvVar {
    param(
        [string]$App,
        [string]$VarName,
        [string]$VarValue,
        [string]$EnvType
    )
    
    if ([string]::IsNullOrWhiteSpace($VarValue)) {
        Write-Host "  ⚠️  Skipping $VarName (empty value)" -ForegroundColor Yellow
        return
    }
    
    Write-Host "  Setting $VarName for $EnvType..." -ForegroundColor Cyan
    
    if ($env:VERCEL_TOKEN) {
        try {
            $VarValue | vercel env add "$VarName" "$EnvType" --scope="$env:VERCEL_ORG" --yes --token="$env:VERCEL_TOKEN" 2>&1 | Out-Null
        } catch {
            # Try to update if it exists
            try {
                vercel env rm "$VarName" "$EnvType" --scope="$env:VERCEL_ORG" --yes --token="$env:VERCEL_TOKEN" 2>&1 | Out-Null
                $VarValue | vercel env add "$VarName" "$EnvType" --scope="$env:VERCEL_ORG" --yes --token="$env:VERCEL_TOKEN" 2>&1 | Out-Null
            } catch {
                Write-Host "  ⚠️  Failed to set $VarName" -ForegroundColor Yellow
            }
        }
    } else {
        Write-Host "  ⚠️  VERCEL_TOKEN not set. Run manually:" -ForegroundColor Yellow
        Write-Host "     vercel env add $VarName $EnvType" -ForegroundColor Cyan
    }
}

# Configure each app
foreach ($app in $APPS) {
    Write-Host ""
    Write-Host "📦 Configuring $app..." -ForegroundColor Green
    
    # Check if app exists in Vercel
    if ($env:VERCEL_TOKEN) {
        $projects = vercel projects ls --token="$env:VERCEL_TOKEN" 2>&1
        if ($projects -notmatch $app) {
            Write-Host "  Creating project $app..." -ForegroundColor Yellow
            vercel projects add "$app" --token="$env:VERCEL_TOKEN" 2>&1 | Out-Null
        }
    }
    
    foreach ($env in $ENVIRONMENTS) {
        Write-Host "  Environment: $env" -ForegroundColor Cyan
        
        # Set common environment variables
        $COMMON_VARS = @(
            "NODE_ENV=$env",
            "APP_NAME=$app",
            "APP_ENV=$env",
            "VERCEL_ENV=$env"
        )
        
        # Get git info if available
        if (Get-Command git -ErrorAction SilentlyContinue) {
            try {
                $branch = git rev-parse --abbrev-ref HEAD 2>&1
                $commit = git rev-parse HEAD 2>&1
                $COMMON_VARS += "VERCEL_GIT_COMMIT_REF=$branch"
                $COMMON_VARS += "VERCEL_GIT_COMMIT_SHA=$commit"
            } catch {
                $COMMON_VARS += "VERCEL_GIT_COMMIT_REF=main"
                $COMMON_VARS += "VERCEL_GIT_COMMIT_SHA=unknown"
            }
        }
        
        foreach ($var in $COMMON_VARS) {
            $parts = $var -split '=', 2
            $varName = $parts[0]
            $varValue = $parts[1]
            Add-EnvVar -App $app -VarName $varName -VarValue $varValue -EnvType $env
        }
        
        # Set app-specific variables
        switch ($app) {
            "m-marketplace" {
                $MARKETPLACE_VARS = @(
                    "NEXT_PUBLIC_APP_URL=https://marketplace.kealee.com",
                    "NEXT_PUBLIC_SITE_NAME=Kealee Marketplace"
                )
                if ($env:NEXT_PUBLIC_GA_MEASUREMENT_ID) {
                    $MARKETPLACE_VARS += "NEXT_PUBLIC_GA_MEASUREMENT_ID=$env:NEXT_PUBLIC_GA_MEASUREMENT_ID"
                }
                foreach ($var in $MARKETPLACE_VARS) {
                    $parts = $var -split '=', 2
                    Add-EnvVar -App $app -VarName $parts[0] -VarValue $parts[1] -EnvType $env
                }
            }
            "m-ops-services" {
                $OPS_VARS = @()
                if ($env:STRIPE_SECRET_KEY) { $OPS_VARS += "STRIPE_SECRET_KEY=$env:STRIPE_SECRET_KEY" }
                if ($env:STRIPE_WEBHOOK_SECRET) { $OPS_VARS += "STRIPE_WEBHOOK_SECRET=$env:STRIPE_WEBHOOK_SECRET" }
                if ($env:STRIPE_PUBLISHABLE_KEY) { $OPS_VARS += "STRIPE_PUBLISHABLE_KEY=$env:STRIPE_PUBLISHABLE_KEY" }
                foreach ($var in $OPS_VARS) {
                    $parts = $var -split '=', 2
                    Add-EnvVar -App $app -VarName $parts[0] -VarValue $parts[1] -EnvType $env
                }
            }
            "m-project-owner" {
                $PROJECT_VARS = @()
                if ($env:DOCUSIGN_INTEGRATION_KEY) { $PROJECT_VARS += "DOCUSIGN_INTEGRATION_KEY=$env:DOCUSIGN_INTEGRATION_KEY" }
                if ($env:DOCUSIGN_SECRET_KEY) { $PROJECT_VARS += "DOCUSIGN_SECRET_KEY=$env:DOCUSIGN_SECRET_KEY" }
                if ($env:DOCUSIGN_ACCOUNT_ID) { $PROJECT_VARS += "DOCUSIGN_ACCOUNT_ID=$env:DOCUSIGN_ACCOUNT_ID" }
                foreach ($var in $PROJECT_VARS) {
                    $parts = $var -split '=', 2
                    Add-EnvVar -App $app -VarName $parts[0] -VarValue $parts[1] -EnvType $env
                }
            }
            { $_ -in "m-architect", "m-permits-inspections" } {
                $STORAGE_VARS = @()
                if ($env:S3_ACCESS_KEY_ID) { $STORAGE_VARS += "S3_ACCESS_KEY_ID=$env:S3_ACCESS_KEY_ID" }
                if ($env:S3_SECRET_ACCESS_KEY) { $STORAGE_VARS += "S3_SECRET_ACCESS_KEY=$env:S3_SECRET_ACCESS_KEY" }
                if ($env:S3_BUCKET_NAME) { $STORAGE_VARS += "S3_BUCKET_NAME=$env:S3_BUCKET_NAME" }
                if ($env:S3_REGION) { $STORAGE_VARS += "S3_REGION=$env:S3_REGION" }
                foreach ($var in $STORAGE_VARS) {
                    $parts = $var -split '=', 2
                    Add-EnvVar -App $app -VarName $parts[0] -VarValue $parts[1] -EnvType $env
                }
            }
        }
        
        # Set database URL
        if ($env -eq "production" -and $env:DATABASE_URL_PRODUCTION) {
            Add-EnvVar -App $app -VarName "DATABASE_URL" -VarValue $env:DATABASE_URL_PRODUCTION -EnvType $env
        } elseif ($env -ne "production" -and $env:DATABASE_URL_STAGING) {
            Add-EnvVar -App $app -VarName "DATABASE_URL" -VarValue $env:DATABASE_URL_STAGING -EnvType $env
        } elseif ($env:DATABASE_URL) {
            Add-EnvVar -App $app -VarName "DATABASE_URL" -VarValue $env:DATABASE_URL -EnvType $env
        }
        
        # Set common API URL
        if ($env:NEXT_PUBLIC_API_URL) {
            Add-EnvVar -App $app -VarName "NEXT_PUBLIC_API_URL" -VarValue $env:NEXT_PUBLIC_API_URL -EnvType $env
        }
    }
    
    Write-Host "✅ $app configured" -ForegroundColor Green
}

# Create environment variable backup
Write-Host ""
Write-Host "💾 Creating environment variable backup..." -ForegroundColor Green
foreach ($app in $APPS) {
    if ($env:VERCEL_TOKEN) {
        try {
            $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
            vercel env ls "$app" --token="$env:VERCEL_TOKEN" > "backups/env-$app-$timestamp.txt" 2>&1
        } catch {
            Write-Host "  ⚠️  Failed to backup $app" -ForegroundColor Yellow
        }
    }
}

Write-Host ""
Write-Host "✅ Environment variable configuration complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Verify variables in Vercel Dashboard → Projects → Settings → Environment Variables"
Write-Host "   2. Test your applications"
Write-Host "   3. Review backups in ./backups/ directory"
Write-Host ""
