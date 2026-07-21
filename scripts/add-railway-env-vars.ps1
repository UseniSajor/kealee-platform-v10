# Add all required environment variables to Railway services (PowerShell)
# This script uses Railway CLI to add environment variables

Write-Host ""
Write-Host "🔧 Adding Environment Variables to Railway Services" -ForegroundColor Cyan
Write-Host ""

# Check if Railway CLI is installed
try {
    $null = Get-Command railway -ErrorAction Stop
    Write-Host "✅ Railway CLI ready" -ForegroundColor Green
} catch {
    Write-Host "❌ Railway CLI not found. Install with: npm i -g @railway/cli" -ForegroundColor Red
    Write-Host "   Then run: railway login" -ForegroundColor Yellow
    exit 1
}

# Check if logged in
try {
    $null = railway whoami 2>&1
} catch {
    Write-Host "❌ Not logged in to Railway. Run: railway login" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Get user input for values
Write-Host "📝 Please provide the following values:" -ForegroundColor Yellow
Write-Host ""

$DATABASE_URL = Read-Host "Database URL (postgresql://...)"
$SUPABASE_URL = Read-Host "Supabase URL (https://xxx.supabase.co)"
$SUPABASE_ANON_KEY = Read-Host "Supabase Anon Key"
$SUPABASE_SERVICE_KEY = Read-Host "Supabase Service Key (optional, press Enter to skip)"

Write-Host ""
$REDIS_URL = Read-Host "Redis URL (redis://... or rediss://...)"
$SENDGRID_API_KEY = Read-Host "SendGrid API Key"
$SENDGRID_FROM_EMAIL = Read-Host "SendGrid From Email (noreply@kealee.com)"
$ANTHROPIC_API_KEY = Read-Host "Anthropic API Key (Claude)"

Write-Host ""
$STRIPE_SECRET_KEY = Read-Host "Stripe Secret Key (sk_live_... or sk_test_...)"
$STRIPE_WEBHOOK_SECRET = Read-Host "Stripe Webhook Secret (whsec_..., press Enter to skip)"

Write-Host ""
Write-Host "Stripe Price IDs for Ops Services Packages:" -ForegroundColor Cyan
$STRIPE_PRICE_PACKAGE_A = Read-Host "Stripe Price ID - Package A (price_...)"
$STRIPE_PRICE_PACKAGE_B = Read-Host "Stripe Price ID - Package B (price_...)"
$STRIPE_PRICE_PACKAGE_C = Read-Host "Stripe Price ID - Package C (price_...)"
$STRIPE_PRICE_PACKAGE_D = Read-Host "Stripe Price ID - Package D (price_...)"

Write-Host ""
$DOCUSIGN_INTEGRATION_KEY = Read-Host "DocuSign Integration Key (optional, press Enter to skip)"
$DOCUSIGN_USER_ID = Read-Host "DocuSign User ID (optional, press Enter to skip)"
$DOCUSIGN_ACCOUNT_ID = Read-Host "DocuSign Account ID (optional, press Enter to skip)"
$DOCUSIGN_PRIVATE_KEY = Read-Host "DocuSign Private Key (base64, optional, press Enter to skip)"

Write-Host ""
$AWS_ACCESS_KEY_ID = Read-Host "AWS Access Key ID (optional, press Enter to skip)"
$AWS_SECRET_ACCESS_KEY = Read-Host "AWS Secret Access Key (optional, press Enter to skip)"
$AWS_S3_BUCKET = Read-Host "AWS S3 Bucket (optional, press Enter to skip)"
$AWS_REGION = Read-Host "AWS Region (us-east-1, optional, press Enter to skip)"

Write-Host ""
$SENTRY_DSN = Read-Host "Sentry DSN (optional, press Enter to skip)"
$CORS_ORIGINS = Read-Host "CORS Origins (comma-separated, press Enter for default)"

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
Write-Host "Select Railway service to configure:" -ForegroundColor Cyan
Write-Host "  1) API Service" -ForegroundColor White
Write-Host "  2) Worker Service" -ForegroundColor White
Write-Host "  3) Both Services" -ForegroundColor White
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
$SERVICE_CHOICE = Read-Host "Enter choice (1-3)"

# Function to add env var
function Add-EnvVar {
    param(
        [string]$service,
        [string]$key,
        [string]$value
    )
    
    if ([string]::IsNullOrWhiteSpace($value)) {
        Write-Host "  ⏭️  Skipping $key (empty value)" -ForegroundColor Yellow
        return
    }
    
    Write-Host "  ➕ Adding $key to $service..." -ForegroundColor Cyan
    try {
        railway variables set "$key=$value" --service $service 2>&1 | Out-Null
    } catch {
        Write-Host "  ⚠️  Failed to add $key (may already exist or service not found)" -ForegroundColor Yellow
    }
}

# Configure API Service
if ($SERVICE_CHOICE -eq "1" -or $SERVICE_CHOICE -eq "3") {
    Write-Host ""
    Write-Host "📦 Configuring API Service..." -ForegroundColor Yellow
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    
    Add-EnvVar -service "api" -key "DATABASE_URL" -value $DATABASE_URL
    Add-EnvVar -service "api" -key "SUPABASE_URL" -value $SUPABASE_URL
    Add-EnvVar -service "api" -key "SUPABASE_ANON_KEY" -value $SUPABASE_ANON_KEY
    
    if (-not [string]::IsNullOrWhiteSpace($SUPABASE_SERVICE_KEY)) {
        Add-EnvVar -service "api" -key "SUPABASE_SERVICE_KEY" -value $SUPABASE_SERVICE_KEY
    }
    
    Add-EnvVar -service "api" -key "PORT" -value "3001"
    
    if (-not [string]::IsNullOrWhiteSpace($CORS_ORIGINS)) {
        Add-EnvVar -service "api" -key "CORS_ORIGINS" -value $CORS_ORIGINS
    }
    
    Add-EnvVar -service "api" -key "STRIPE_SECRET_KEY" -value $STRIPE_SECRET_KEY
    
    if (-not [string]::IsNullOrWhiteSpace($STRIPE_WEBHOOK_SECRET)) {
        Add-EnvVar -service "api" -key "STRIPE_WEBHOOK_SECRET" -value $STRIPE_WEBHOOK_SECRET
    }
    
    # Stripe Price IDs for packages (REQUIRED for ops services)
    Add-EnvVar -service "api" -key "STRIPE_PRICE_PACKAGE_A" -value $STRIPE_PRICE_PACKAGE_A
    Add-EnvVar -service "api" -key "STRIPE_PRICE_PACKAGE_B" -value $STRIPE_PRICE_PACKAGE_B
    Add-EnvVar -service "api" -key "STRIPE_PRICE_PACKAGE_C" -value $STRIPE_PRICE_PACKAGE_C
    Add-EnvVar -service "api" -key "STRIPE_PRICE_PACKAGE_D" -value $STRIPE_PRICE_PACKAGE_D
    
    # A la carte product price IDs
    foreach ($key in $alacarteProducts.Keys) {
        Add-EnvVar -service "api" -key $key -value $alacarteProducts[$key]
    }
    
    # DocuSign
    if (-not [string]::IsNullOrWhiteSpace($DOCUSIGN_INTEGRATION_KEY)) {
        Add-EnvVar -service "api" -key "DOCUSIGN_INTEGRATION_KEY" -value $DOCUSIGN_INTEGRATION_KEY
    }
    if (-not [string]::IsNullOrWhiteSpace($DOCUSIGN_USER_ID)) {
        Add-EnvVar -service "api" -key "DOCUSIGN_USER_ID" -value $DOCUSIGN_USER_ID
    }
    if (-not [string]::IsNullOrWhiteSpace($DOCUSIGN_ACCOUNT_ID)) {
        Add-EnvVar -service "api" -key "DOCUSIGN_ACCOUNT_ID" -value $DOCUSIGN_ACCOUNT_ID
    }
    if (-not [string]::IsNullOrWhiteSpace($DOCUSIGN_PRIVATE_KEY)) {
        Add-EnvVar -service "api" -key "DOCUSIGN_PRIVATE_KEY" -value $DOCUSIGN_PRIVATE_KEY
    }
    
    # AWS S3
    if (-not [string]::IsNullOrWhiteSpace($AWS_ACCESS_KEY_ID)) {
        Add-EnvVar -service "api" -key "AWS_ACCESS_KEY_ID" -value $AWS_ACCESS_KEY_ID
    }
    if (-not [string]::IsNullOrWhiteSpace($AWS_SECRET_ACCESS_KEY)) {
        Add-EnvVar -service "api" -key "AWS_SECRET_ACCESS_KEY" -value $AWS_SECRET_ACCESS_KEY
    }
    if (-not [string]::IsNullOrWhiteSpace($AWS_S3_BUCKET)) {
        Add-EnvVar -service "api" -key "AWS_S3_BUCKET" -value $AWS_S3_BUCKET
    }
    if (-not [string]::IsNullOrWhiteSpace($AWS_REGION)) {
        Add-EnvVar -service "api" -key "AWS_REGION" -value $AWS_REGION
    }
    
    # Sentry
    if (-not [string]::IsNullOrWhiteSpace($SENTRY_DSN)) {
        Add-EnvVar -service "api" -key "SENTRY_DSN" -value $SENTRY_DSN
    }
    
    # Node environment
    Add-EnvVar -service "api" -key "NODE_ENV" -value "production"
}

# Configure Worker Service
if ($SERVICE_CHOICE -eq "2" -or $SERVICE_CHOICE -eq "3") {
    Write-Host ""
    Write-Host "📦 Configuring Worker Service..." -ForegroundColor Yellow
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    
    Add-EnvVar -service "worker" -key "DATABASE_URL" -value $DATABASE_URL
    Add-EnvVar -service "worker" -key "REDIS_URL" -value $REDIS_URL
    Add-EnvVar -service "worker" -key "SENDGRID_API_KEY" -value $SENDGRID_API_KEY
    Add-EnvVar -service "worker" -key "SENDGRID_FROM_EMAIL" -value $SENDGRID_FROM_EMAIL
    Add-EnvVar -service "worker" -key "SENDGRID_FROM_NAME" -value "Kealee Platform"
    Add-EnvVar -service "worker" -key "ANTHROPIC_API_KEY" -value $ANTHROPIC_API_KEY
    
    # Sentry
    if (-not [string]::IsNullOrWhiteSpace($SENTRY_DSN)) {
        Add-EnvVar -service "worker" -key "SENTRY_DSN" -value $SENTRY_DSN
    }
    
    # Node environment
    Add-EnvVar -service "worker" -key "NODE_ENV" -value "production"
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "✅ Environment variables added successfully!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "  1. Verify variables in Railway dashboard" -ForegroundColor White
Write-Host "  2. Redeploy services if needed" -ForegroundColor White
Write-Host "  3. Check service logs for any issues" -ForegroundColor White
Write-Host ""
Write-Host "💡 Note: Service names in Railway may differ." -ForegroundColor Yellow
Write-Host "   If 'api' or 'worker' don't work, use exact service names from Railway dashboard" -ForegroundColor Gray
Write-Host ""




