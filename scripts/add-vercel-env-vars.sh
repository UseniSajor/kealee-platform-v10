#!/bin/bash

# Add all environment variables to all Vercel apps
# This script uses Vercel CLI to add environment variables

set -e

echo "🔧 Adding Environment Variables to Vercel Apps"
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Install with: npm i -g vercel"
    exit 1
fi

# Check if logged in
if ! vercel whoami &> /dev/null; then
    echo "❌ Not logged in to Vercel. Run: vercel login"
    exit 1
fi

echo "✅ Vercel CLI ready"
echo ""

# Get user input for sensitive values
echo "📝 Please provide the following values:"
echo ""

read -p "Railway Database URL (postgresql://...): " DATABASE_URL
read -p "Railway API URL (https://api.kealee.com or Railway URL): " API_URL
read -p "Supabase URL (https://xxx.supabase.co): " SUPABASE_URL
read -p "Supabase Anon Key: " SUPABASE_ANON_KEY
read -p "Supabase Service Key (optional, press Enter to skip): " SUPABASE_SERVICE_KEY

echo ""
read -p "Stripe Publishable Key (pk_live_... or pk_test_...): " STRIPE_PUBLISHABLE_KEY
read -p "Stripe Secret Key (sk_live_... or sk_test_...): " STRIPE_SECRET_KEY
read -p "Stripe Webhook Secret (whsec_..., press Enter to skip): " STRIPE_WEBHOOK_SECRET

echo ""
read -p "Google Places API Key (press Enter to skip): " GOOGLE_PLACES_API_KEY
read -p "AWS Access Key ID (press Enter to skip): " AWS_ACCESS_KEY_ID
read -p "AWS Secret Access Key (press Enter to skip): " AWS_SECRET_ACCESS_KEY
read -p "AWS S3 Bucket Name (press Enter to skip): " AWS_S3_BUCKET

echo ""
read -p "Sentry DSN (press Enter to skip): " SENTRY_DSN
read -p "Google Analytics ID (G-..., press Enter to skip): " GA_MEASUREMENT_ID
read -p "Hotjar ID (press Enter to skip): " HOTJAR_ID

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "A La Carte Products (Ops Services)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Add individual/a la carte product Stripe Price IDs"
echo "Enter product name and price ID pairs (press Enter twice to finish)"
echo ""

declare -A ALACARTE_PRODUCTS
while true; do
    read -p "Product name (e.g., 'Permit Tracking', or press Enter to finish): " PRODUCT_NAME
    if [ -z "$PRODUCT_NAME" ]; then
        break
    fi
    
    read -p "Stripe Price ID for '$PRODUCT_NAME' (price_...): " PRICE_ID
    if [ -n "$PRICE_ID" ]; then
        # Convert product name to env var format (uppercase, replace spaces with underscores)
        ENV_VAR_NAME=$(echo "STRIPE_PRICE_$(echo "$PRODUCT_NAME" | tr '[:lower:]' '[:upper:]' | tr -cd '[:alnum:]_')")
        ALACARTE_PRODUCTS["$ENV_VAR_NAME"]="$PRICE_ID"
        echo "  ✅ Added: $ENV_VAR_NAME = $PRICE_ID"
    fi
    echo ""
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Adding environment variables..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Apps list
APPS=(
    "m-marketplace"
    "m-ops-services"
    "m-project-owner"
    "m-permits-inspections"
    "m-architect"
    "os-admin"
    "os-pm"
)

# Function to add env var
add_env_var() {
    local app=$1
    local key=$2
    local value=$3
    local env=${4:-production}  # default to production
    
    if [ -z "$value" ]; then
        echo "  ⏭️  Skipping $key (empty value)"
        return
    fi
    
    echo "  ➕ Adding $key to $app ($env)..."
    echo "$value" | vercel env add "$key" "$env" "$app" --yes 2>/dev/null || {
        echo "  ⚠️  Failed to add $key (may already exist)"
    }
}

# Add common variables to all apps
for app in "${APPS[@]}"; do
    echo ""
    echo "📦 Processing $app..."
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # Common variables for all apps
    add_env_var "$app" "DATABASE_URL" "$DATABASE_URL"
    add_env_var "$app" "NEXT_PUBLIC_API_URL" "$API_URL"
    add_env_var "$app" "SUPABASE_URL" "$SUPABASE_URL"
    add_env_var "$app" "SUPABASE_ANON_KEY" "$SUPABASE_ANON_KEY"
    add_env_var "$app" "NEXT_PUBLIC_SUPABASE_URL" "$SUPABASE_URL"
    add_env_var "$app" "NEXT_PUBLIC_SUPABASE_ANON_KEY" "$SUPABASE_ANON_KEY"
    
    if [ -n "$SUPABASE_SERVICE_KEY" ]; then
        add_env_var "$app" "SUPABASE_SERVICE_KEY" "$SUPABASE_SERVICE_KEY"
    fi
    
    # App-specific variables
    case $app in
        "m-marketplace")
            add_env_var "$app" "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" "$STRIPE_PUBLISHABLE_KEY"
            add_env_var "$app" "STRIPE_SECRET_KEY" "$STRIPE_SECRET_KEY"
            add_env_var "$app" "NEXT_PUBLIC_APP_URL" "https://www.kealee.com"
            if [ -n "$GA_MEASUREMENT_ID" ]; then
                add_env_var "$app" "NEXT_PUBLIC_GA_MEASUREMENT_ID" "$GA_MEASUREMENT_ID"
            fi
            if [ -n "$HOTJAR_ID" ]; then
                add_env_var "$app" "NEXT_PUBLIC_HOTJAR_ID" "$HOTJAR_ID"
            fi
            ;;
        "m-ops-services")
            add_env_var "$app" "STRIPE_SECRET_KEY" "$STRIPE_SECRET_KEY"
            add_env_var "$app" "STRIPE_WEBHOOK_SECRET" "$STRIPE_WEBHOOK_SECRET"
            add_env_var "$app" "NEXT_PUBLIC_APP_URL" "https://ops.kealee.com"
            
            # Add a la carte product price IDs
            for key in "${!ALACARTE_PRODUCTS[@]}"; do
                add_env_var "$app" "$key" "${ALACARTE_PRODUCTS[$key]}"
            done
            ;;
        "m-project-owner")
            add_env_var "$app" "NEXT_PUBLIC_APP_URL" "https://app.kealee.com"
            ;;
        "m-permits-inspections")
            add_env_var "$app" "NEXT_PUBLIC_APP_URL" "https://permits.kealee.com"
            if [ -n "$GOOGLE_PLACES_API_KEY" ]; then
                add_env_var "$app" "NEXT_PUBLIC_GOOGLE_PLACES_API_KEY" "$GOOGLE_PLACES_API_KEY"
            fi
            if [ -n "$AWS_ACCESS_KEY_ID" ]; then
                add_env_var "$app" "AWS_ACCESS_KEY_ID" "$AWS_ACCESS_KEY_ID"
            fi
            if [ -n "$AWS_SECRET_ACCESS_KEY" ]; then
                add_env_var "$app" "AWS_SECRET_ACCESS_KEY" "$AWS_SECRET_ACCESS_KEY"
            fi
            if [ -n "$AWS_S3_BUCKET" ]; then
                add_env_var "$app" "AWS_S3_BUCKET" "$AWS_S3_BUCKET"
            fi
            ;;
        "m-architect")
            add_env_var "$app" "NEXT_PUBLIC_APP_URL" "https://architect.kealee.com"
            ;;
        "os-admin")
            add_env_var "$app" "NEXT_PUBLIC_APP_URL" "https://admin.kealee.com"
            ;;
        "os-pm")
            add_env_var "$app" "NEXT_PUBLIC_APP_URL" "https://pm.kealee.com"
            ;;
    esac
    
    # Add Sentry DSN if provided
    if [ -n "$SENTRY_DSN" ]; then
        add_env_var "$app" "NEXT_PUBLIC_SENTRY_DSN" "$SENTRY_DSN"
        add_env_var "$app" "SENTRY_DSN" "$SENTRY_DSN"
    fi
    
    # Add a la carte products to m-ops-services preview environment
    if [ "$app" = "m-ops-services" ]; then
        for key in "${!ALACARTE_PRODUCTS[@]}"; do
            add_env_var "$app" "$key" "${ALACARTE_PRODUCTS[$key]}" "preview"
        done
    fi
    
    # Also add to preview environment
    echo ""
    echo "  📋 Adding to preview environment..."
    add_env_var "$app" "DATABASE_URL" "$DATABASE_URL" "preview"
    add_env_var "$app" "NEXT_PUBLIC_API_URL" "$API_URL" "preview"
    add_env_var "$app" "SUPABASE_URL" "$SUPABASE_URL" "preview"
    add_env_var "$app" "SUPABASE_ANON_KEY" "$SUPABASE_ANON_KEY" "preview"
    add_env_var "$app" "NEXT_PUBLIC_SUPABASE_URL" "$SUPABASE_URL" "preview"
    add_env_var "$app" "NEXT_PUBLIC_SUPABASE_ANON_KEY" "$SUPABASE_ANON_KEY" "preview"
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Environment variables added successfully!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 Next steps:"
echo "  1. Verify variables in Vercel dashboard"
echo "  2. Redeploy all apps"
echo "  3. Check deployment logs for any issues"
echo ""




