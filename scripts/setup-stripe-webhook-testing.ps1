# setup-stripe-webhook-testing.ps1
# Sets up Stripe webhook testing environment (PowerShell version)

Write-Host "💳 Setting up Stripe webhook testing..." -ForegroundColor Cyan

# 1. Check if Stripe CLI is installed
$stripeInstalled = Get-Command stripe -ErrorAction SilentlyContinue
if (-not $stripeInstalled) {
    Write-Host "⚠️  Stripe CLI not found. Please install it first:" -ForegroundColor Yellow
    Write-Host "   https://stripe.com/docs/stripe-cli" -ForegroundColor Yellow
    Write-Host ""
    $install = Read-Host "Would you like to install it now? (y/N)"
    if ($install -eq "y" -or $install -eq "Y") {
        Write-Host "Installing Stripe CLI..."
        # On Windows, Stripe CLI can be installed via Scoop or downloaded manually
        Write-Host "Please install Stripe CLI manually from: https://github.com/stripe/stripe-cli/releases"
        exit 1
    } else {
        exit 1
    }
}

# 2. Login to Stripe
Write-Host ""
Write-Host "📝 Logging into Stripe..." -ForegroundColor Cyan
Write-Host "   This will open a browser for authentication."
stripe login --interactive

# 3. Get webhook secret from existing endpoint or create new one
Write-Host ""
Write-Host "🔍 Checking for existing webhook endpoints..." -ForegroundColor Cyan
$WEBHOOK_URL = "https://api.kealee.com/billing/stripe/webhook"

# List existing endpoints
try {
    $endpoints = stripe webhook_endpoints list --limit=10 2>&1 | ConvertFrom-Json
    $existingEndpoint = $endpoints.data | Where-Object { $_.url -eq $WEBHOOK_URL } | Select-Object -First 1
    
    if ($existingEndpoint) {
        Write-Host "✅ Webhook endpoint already exists: $WEBHOOK_URL" -ForegroundColor Green
        Write-Host "   Getting webhook secret..." -ForegroundColor Cyan
        
        if ($existingEndpoint.secret) {
            $WEBHOOK_SECRET = $existingEndpoint.secret
        } else {
            Write-Host "⚠️  Could not retrieve webhook secret. Please get it from Stripe Dashboard:" -ForegroundColor Yellow
            Write-Host "   https://dashboard.stripe.com/webhooks" -ForegroundColor Yellow
            Write-Host ""
            $WEBHOOK_SECRET = Read-Host "Enter webhook secret (whsec_...)"
        }
    } else {
        Write-Host "📝 Creating new webhook endpoint..." -ForegroundColor Cyan
        Write-Host "   URL: $WEBHOOK_URL" -ForegroundColor Cyan
        
        # Create webhook endpoint
        $endpointOutput = stripe webhook_endpoints create `
            --url="$WEBHOOK_URL" `
            --description="Production webhooks for Kealee Platform" `
            --enabled-events="checkout.session.completed,customer.subscription.created,customer.subscription.updated,customer.subscription.deleted,invoice.paid,invoice.payment_failed,payment_intent.succeeded,payment_intent.payment_failed" 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            $endpointData = $endpointOutput | ConvertFrom-Json
            if ($endpointData.secret) {
                $WEBHOOK_SECRET = $endpointData.secret
                Write-Host "✅ Webhook endpoint created successfully!" -ForegroundColor Green
            } else {
                Write-Host "⚠️  Webhook endpoint created, but secret not found in output." -ForegroundColor Yellow
                Write-Host "   Please get the secret from Stripe Dashboard:" -ForegroundColor Yellow
                Write-Host "   https://dashboard.stripe.com/webhooks" -ForegroundColor Yellow
                Write-Host ""
                $WEBHOOK_SECRET = Read-Host "Enter webhook secret (whsec_...)"
            }
        } else {
            Write-Host "❌ Failed to create webhook endpoint:" -ForegroundColor Red
            Write-Host $endpointOutput -ForegroundColor Red
            Write-Host ""
            Write-Host "Please create it manually in Stripe Dashboard:" -ForegroundColor Yellow
            Write-Host "   https://dashboard.stripe.com/webhooks" -ForegroundColor Yellow
            Write-Host ""
            $WEBHOOK_SECRET = Read-Host "Enter webhook secret (whsec_...)"
        }
    }
} catch {
    Write-Host "⚠️  Error checking/creating webhook endpoint: $_" -ForegroundColor Yellow
    Write-Host "   Please create it manually in Stripe Dashboard:" -ForegroundColor Yellow
    Write-Host "   https://dashboard.stripe.com/webhooks" -ForegroundColor Yellow
    Write-Host ""
    $WEBHOOK_SECRET = Read-Host "Enter webhook secret (whsec_...)"
}

# 4. Display webhook secret
Write-Host ""
Write-Host "🔑 Webhook Secret:" -ForegroundColor Cyan
Write-Host "   $WEBHOOK_SECRET" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  IMPORTANT: Save this secret securely!" -ForegroundColor Yellow
Write-Host "   Add it to your environment variables:" -ForegroundColor Yellow
Write-Host "   `$env:STRIPE_WEBHOOK_SECRET = `"$WEBHOOK_SECRET`"" -ForegroundColor White
Write-Host ""

# 5. Update environment variables (if VERCEL_TOKEN is set)
if ($env:VERCEL_TOKEN) {
    Write-Host "📝 Updating Vercel environment variables..." -ForegroundColor Cyan
    $apps = @("m-ops-services", "m-project-owner")
    foreach ($app in $apps) {
        Write-Host "   Updating $app..." -ForegroundColor Cyan
        try {
            vercel env add STRIPE_WEBHOOK_SECRET "$WEBHOOK_SECRET" production --token="$env:VERCEL_TOKEN" --yes 2>&1 | Out-Null
            Write-Host "   ✅ Updated $app" -ForegroundColor Green
        } catch {
            Write-Host "   ⚠️  Failed to update $app (may need manual update)" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "ℹ️  VERCEL_TOKEN not set. Skipping Vercel environment variable updates." -ForegroundColor Yellow
    Write-Host "   Update manually in Vercel Dashboard or set VERCEL_TOKEN environment variable." -ForegroundColor Yellow
}

# 6. Summary
Write-Host ""
Write-Host "✅ Stripe webhook testing setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Add STRIPE_WEBHOOK_SECRET to your environment:" -ForegroundColor White
Write-Host "      `$env:STRIPE_WEBHOOK_SECRET = `"$WEBHOOK_SECRET`"" -ForegroundColor Gray
Write-Host ""
Write-Host "   2. For local testing, run:" -ForegroundColor White
Write-Host "      ./scripts/test-stripe-webhooks.sh" -ForegroundColor Gray
Write-Host "      (or use Stripe CLI directly)" -ForegroundColor Gray
Write-Host ""
Write-Host "   3. For production testing, verify webhook endpoint in Stripe Dashboard:" -ForegroundColor White
Write-Host "      https://dashboard.stripe.com/webhooks" -ForegroundColor Gray
Write-Host ""
Write-Host "   4. Monitor webhook deliveries in Stripe Dashboard" -ForegroundColor White
Write-Host ""
