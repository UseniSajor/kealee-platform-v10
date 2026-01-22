# Add all environment variables to all Vercel apps (PowerShell)
# This script uses Vercel CLI to add environment variables

Write-Host ""
Write-Host "🔧 Adding Environment Variables to Vercel Apps" -ForegroundColor Cyan
Write-Host ""

# Check if Vercel CLI is installed
try {
    $null = Get-Command vercel -ErrorAction Stop
    Write-Host "✅ Vercel CLI ready" -ForegroundColor Green
} catch {
    Write-Host "❌ Vercel CLI not found. Install with: npm i -g vercel" -ForegroundColor Red
    exit 1
}

# Check if logged in
try {
    $null = vercel whoami 2>&1
} catch {
    Write-Host "❌ Not logged in to Vercel. Run: vercel login" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Get user input for sensitive values
Write-Host "📝 Please provide the following values:" -ForegroundColor Yellow
Write-Host ""

$DATABASE_URL = Read-Host "Railway Database URL (postgresql://...)"
$API_URL = Read-Host "Railway API URL (https://api.kealee.com or Railway URL)"
$SUPABASE_URL = Read-Host "Supabase URL (https://xxx.supabase.co)"
$SUPABASE_ANON_KEY = Read-Host "Supabase Anon Key"
$SUPABASE_SERVICE_KEY = Read-Host "Supabase Service Key (optional, press Enter to skip)"

Write-Host ""
$STRIPE_PUBLISHABLE_KEY = Read-Host "Stripe Publishable Key (pk_live_... or pk_test_...)"
$STRIPE_SECRET_KEY = Read-Host "Stripe Secret Key (sk_live_... or sk_test_...)"
$STRIPE_WEBHOOK_SECRET = Read-Host "Stripe Webhook Secret (whsec_..., press Enter to skip)"

Write-Host ""
$GOOGLE_PLACES_API_KEY = Read-Host "Google Places API Key (press Enter to skip)"
$AWS_ACCESS_KEY_ID = Read-Host "AWS Access Key ID (press Enter to skip)"
$AWS_SECRET_ACCESS_KEY = Read-Host "AWS Secret Access Key (press Enter to skip)"
$AWS_S3_BUCKET = Read-Host "AWS S3 Bucket Name (press Enter to skip)"

Write-Host ""
$SENTRY_DSN = Read-Host "Sentry DSN (press Enter to skip)"
$GA_MEASUREMENT_ID = Read-Host "Google Analytics ID (G-..., press Enter to skip)"
$HOTJAR_ID = Read-Host "Hotjar ID (press Enter to skip)"

Write-Host ""
Write-Host "============================================================" -ForegroundColor Gray
Write-Host "A La Carte Products (Ops Services)" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Gray
Write-Host ""
Write-Host "Add individual/a la carte product Stripe Price IDs" -ForegroundColor Yellow
Write-Host "Enter product name and price ID pairs (press Enter twice to finish)" -ForegroundColor Gray
Write-Host ""

$alacarteProducts = @{}
$addMore = $true
while ($addMore) {
    $productName = Read-Host "Product name (e.g., Permit Tracking, or press Enter to finish"
    if ([string]::IsNullOrWhiteSpace($productName)) {
        $addMore = $false
        break
    }
    
    $priceId = Read-Host "Stripe Price ID for $productName (price_...)"
    if (-not [string]::IsNullOrWhiteSpace($priceId)) {
        # Convert product name to env var format (uppercase, replace spaces with underscores)
        $envVarName = "STRIPE_PRICE_" + ($productName.ToUpper() -replace '[^A-Z0-9]', '_')
        $alacarteProducts[$envVarName] = $priceId
        Write-Host "  Added: $envVarName = $priceId" -ForegroundColor Green
    }
    Write-Host ""
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "Adding environment variables..." -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""

# Apps list
$apps = @(
    "m-marketplace",
    "m-ops-services",
    "m-project-owner",
    "m-permits-inspections",
    "m-architect",
    "os-admin",
    "os-pm"
)

# Function to add env var
function Add-EnvVar {
    param(
        [string]$app,
        [string]$key,
        [string]$value,
        [string]$env = "production"
    )
    
    if ([string]::IsNullOrWhiteSpace($value)) {
        Write-Host "  ⏭️  Skipping $key (empty value)" -ForegroundColor Yellow
        return
    }
    
    Write-Host "  ➕ Adding $key to $app ($env)..." -ForegroundColor Cyan
    try {
        $value | vercel env add $key $env $app --yes 2>&1 | Out-Null
    } catch {
        Write-Host "  ⚠️  Failed to add $key (may already exist)" -ForegroundColor Yellow
    }
}

# Add common variables to all apps
foreach ($app in $apps) {
    Write-Host ""
    Write-Host "📦 Processing $app..." -ForegroundColor Yellow
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    
    # Common variables for all apps
    Add-EnvVar -app $app -key "DATABASE_URL" -value $DATABASE_URL
    Add-EnvVar -app $app -key "NEXT_PUBLIC_API_URL" -value $API_URL
    Add-EnvVar -app $app -key "SUPABASE_URL" -value $SUPABASE_URL
    Add-EnvVar -app $app -key "SUPABASE_ANON_KEY" -value $SUPABASE_ANON_KEY
    Add-EnvVar -app $app -key "NEXT_PUBLIC_SUPABASE_URL" -value $SUPABASE_URL
    Add-EnvVar -app $app -key "NEXT_PUBLIC_SUPABASE_ANON_KEY" -value $SUPABASE_ANON_KEY
    
    if (-not [string]::IsNullOrWhiteSpace($SUPABASE_SERVICE_KEY)) {
        Add-EnvVar -app $app -key "SUPABASE_SERVICE_KEY" -value $SUPABASE_SERVICE_KEY
    }
    
    # App-specific variables
    switch ($app) {
        "m-marketplace" {
            Add-EnvVar -app $app -key "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" -value $STRIPE_PUBLISHABLE_KEY
            Add-EnvVar -app $app -key "STRIPE_SECRET_KEY" -value $STRIPE_SECRET_KEY
            Add-EnvVar -app $app -key "NEXT_PUBLIC_APP_URL" -value "https://www.kealee.com"
            if (-not [string]::IsNullOrWhiteSpace($GA_MEASUREMENT_ID)) {
                Add-EnvVar -app $app -key "NEXT_PUBLIC_GA_MEASUREMENT_ID" -value $GA_MEASUREMENT_ID
            }
            if (-not [string]::IsNullOrWhiteSpace($HOTJAR_ID)) {
                Add-EnvVar -app $app -key "NEXT_PUBLIC_HOTJAR_ID" -value $HOTJAR_ID
            }
        }
        "m-ops-services" {
            Add-EnvVar -app $app -key "STRIPE_SECRET_KEY" -value $STRIPE_SECRET_KEY
            Add-EnvVar -app $app -key "STRIPE_WEBHOOK_SECRET" -value $STRIPE_WEBHOOK_SECRET
            Add-EnvVar -app $app -key "NEXT_PUBLIC_APP_URL" -value "https://ops.kealee.com"
            
            # Add a la carte product price IDs
            foreach ($key in $alacarteProducts.Keys) {
                Add-EnvVar -app $app -key $key -value $alacarteProducts[$key]
            }
        }
        "m-project-owner" {
            Add-EnvVar -app $app -key "NEXT_PUBLIC_APP_URL" -value "https://app.kealee.com"
        }
        "m-permits-inspections" {
            Add-EnvVar -app $app -key "NEXT_PUBLIC_APP_URL" -value "https://permits.kealee.com"
            if (-not [string]::IsNullOrWhiteSpace($GOOGLE_PLACES_API_KEY)) {
                Add-EnvVar -app $app -key "NEXT_PUBLIC_GOOGLE_PLACES_API_KEY" -value $GOOGLE_PLACES_API_KEY
            }
            if (-not [string]::IsNullOrWhiteSpace($AWS_ACCESS_KEY_ID)) {
                Add-EnvVar -app $app -key "AWS_ACCESS_KEY_ID" -value $AWS_ACCESS_KEY_ID
            }
            if (-not [string]::IsNullOrWhiteSpace($AWS_SECRET_ACCESS_KEY)) {
                Add-EnvVar -app $app -key "AWS_SECRET_ACCESS_KEY" -value $AWS_SECRET_ACCESS_KEY
            }
            if (-not [string]::IsNullOrWhiteSpace($AWS_S3_BUCKET)) {
                Add-EnvVar -app $app -key "AWS_S3_BUCKET" -value $AWS_S3_BUCKET
            }
        }
        "m-architect" {
            Add-EnvVar -app $app -key "NEXT_PUBLIC_APP_URL" -value "https://architect.kealee.com"
        }
        "os-admin" {
            Add-EnvVar -app $app -key "NEXT_PUBLIC_APP_URL" -value "https://admin.kealee.com"
        }
        "os-pm" {
            Add-EnvVar -app $app -key "NEXT_PUBLIC_APP_URL" -value "https://pm.kealee.com"
        }
    }
    
    # Add Sentry DSN if provided
    if (-not [string]::IsNullOrWhiteSpace($SENTRY_DSN)) {
        Add-EnvVar -app $app -key "NEXT_PUBLIC_SENTRY_DSN" -value $SENTRY_DSN
        Add-EnvVar -app $app -key "SENTRY_DSN" -value $SENTRY_DSN
    }
    
    # Add a la carte products to m-ops-services preview environment
    if ($app -eq "m-ops-services") {
        foreach ($key in $alacarteProducts.Keys) {
            Add-EnvVar -app $app -key $key -value $alacarteProducts[$key] -env "preview"
        }
    }
    
    # Also add to preview environment
    Write-Host ""
    Write-Host "  📋 Adding to preview environment..." -ForegroundColor Cyan
    Add-EnvVar -app $app -key "DATABASE_URL" -value $DATABASE_URL -env "preview"
    Add-EnvVar -app $app -key "NEXT_PUBLIC_API_URL" -value $API_URL -env "preview"
    Add-EnvVar -app $app -key "SUPABASE_URL" -value $SUPABASE_URL -env "preview"
    Add-EnvVar -app $app -key "SUPABASE_ANON_KEY" -value $SUPABASE_ANON_KEY -env "preview"
    Add-EnvVar -app $app -key "NEXT_PUBLIC_SUPABASE_URL" -value $SUPABASE_URL -env "preview"
    Add-EnvVar -app $app -key "NEXT_PUBLIC_SUPABASE_ANON_KEY" -value $SUPABASE_ANON_KEY -env "preview"
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "✅ Environment variables added successfully!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "  1. Verify variables in Vercel dashboard" -ForegroundColor White
Write-Host "  2. Redeploy all apps" -ForegroundColor White
Write-Host "  3. Check deployment logs for any issues" -ForegroundColor White
Write-Host ""




