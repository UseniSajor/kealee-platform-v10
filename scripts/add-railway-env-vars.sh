#!/bin/bash

# Add all required environment variables to Railway services
# This script uses Railway CLI to add environment variables

set -e

echo "🔧 Adding Environment Variables to Railway Services"
echo ""
echo "⚠️  IMPORTANT: This script will prompt for environment selection"
echo "   Ensure DATABASE_URL is set correctly for each environment"
echo "   Staging: staging-postgres.internal"
echo "   Production: production-postgres.internal"
echo ""

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Install with: npm i -g @railway/cli"
    echo "   Then run: railway login"
    exit 1
fi

# Check if logged in
if ! railway whoami &> /dev/null; then
    echo "❌ Not logged in to Railway. Run: railway login"
    exit 1
fi

echo "✅ Railway CLI ready"
echo ""

# Select environment
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Select Environment:"
echo "  1) Staging"
echo "  2) Production"
echo "  3) Both"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
read -p "Enter choice (1-3): " ENV_CHOICE

ENV_STAGING=""
ENV_PRODUCTION=""

case "$ENV_CHOICE" in
    1)
        ENV_STAGING="--environment staging"
        ;;
    2)
        ENV_PRODUCTION="--environment production"
        ;;
    3)
        ENV_STAGING="--environment staging"
        ENV_PRODUCTION="--environment production"
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""

# Get user input for values
echo "📝 Please provide the following values:"
echo ""

read -p "Database URL (postgresql://...): " DATABASE_URL
read -p "Supabase URL (https://xxx.supabase.co): " SUPABASE_URL
read -p "Supabase Anon Key: " SUPABASE_ANON_KEY
read -p "Supabase Service Key (optional, press Enter to skip): " SUPABASE_SERVICE_KEY

echo ""
read -p "Redis URL (redis://... or rediss://...): " REDIS_URL
read -p "SendGrid API Key: " SENDGRID_API_KEY
read -p "SendGrid From Email (noreply@kealee.com): " SENDGRID_FROM_EMAIL
read -p "Anthropic API Key (Claude): " ANTHROPIC_API_KEY

echo ""
read -p "Stripe Secret Key (sk_live_... or sk_test_...): " STRIPE_SECRET_KEY
read -p "Stripe Webhook Secret (whsec_..., press Enter to skip): " STRIPE_WEBHOOK_SECRET

echo ""
read -p "Stripe Price ID - Package A (price_...): " STRIPE_PRICE_PACKAGE_A
read -p "Stripe Price ID - Package B (price_...): " STRIPE_PRICE_PACKAGE_B
read -p "Stripe Price ID - Package C (price_...): " STRIPE_PRICE_PACKAGE_C
read -p "Stripe Price ID - Package D (price_...): " STRIPE_PRICE_PACKAGE_D

echo ""
read -p "DocuSign Integration Key (optional, press Enter to skip): " DOCUSIGN_INTEGRATION_KEY
read -p "DocuSign User ID (optional, press Enter to skip): " DOCUSIGN_USER_ID
read -p "DocuSign Account ID (optional, press Enter to skip): " DOCUSIGN_ACCOUNT_ID
read -p "DocuSign Private Key (base64, optional, press Enter to skip): " DOCUSIGN_PRIVATE_KEY

echo ""
read -p "AWS Access Key ID (optional, press Enter to skip): " AWS_ACCESS_KEY_ID
read -p "AWS Secret Access Key (optional, press Enter to skip): " AWS_SECRET_ACCESS_KEY
read -p "AWS S3 Bucket (optional, press Enter to skip): " AWS_S3_BUCKET
read -p "AWS Region (us-east-1, optional, press Enter to skip): " AWS_REGION

echo ""
read -p "Sentry DSN (optional, press Enter to skip): " SENTRY_DSN
read -p "CORS Origins (comma-separated, press Enter for default): " CORS_ORIGINS

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
echo "Select Railway service to configure:"
echo "  1) API Service"
echo "  2) Worker Service"
echo "  3) Both Services"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
read -p "Enter choice (1-3): " SERVICE_CHOICE

# Function to add env var
add_env_var() {
    local service=$1
    local key=$2
    local value=$3
    local env_flag=$4
    
    if [ -z "$value" ]; then
        echo "  ⏭️  Skipping $key (empty value)"
        return
    fi
    
    echo "  ➕ Adding $key to $service..."
    if [ -n "$env_flag" ]; then
        railway variables set "$key=$value" --service "$service" $env_flag 2>/dev/null || {
            echo "  ⚠️  Failed to add $key (may already exist or service not found)"
        }
    else
        railway variables set "$key=$value" --service "$service" 2>/dev/null || {
            echo "  ⚠️  Failed to add $key (may already exist or service not found)"
        }
    fi
}

# Configure API Service
if [ "$SERVICE_CHOICE" = "1" ] || [ "$SERVICE_CHOICE" = "3" ]; then
    echo ""
    echo "📦 Configuring API Service..."
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # Handle DATABASE_URL separately for each environment
    if [ -n "$ENV_STAGING" ]; then
        echo ""
        echo "Setting up STAGING environment..."
        if [ -z "$DATABASE_URL" ]; then
            warn "DATABASE_URL not provided. You'll need to set it manually."
            warn "Use: postgresql://user:password@staging-postgres.internal:5432/railway"
        else
            # Ensure staging uses staging-postgres.internal
            STAGING_DB_URL=$(echo "$DATABASE_URL" | sed 's/@[^:]*:/@staging-postgres.internal:/')
            add_env_var "api" "DATABASE_URL" "$STAGING_DB_URL" "$ENV_STAGING"
        fi
    fi
    
    if [ -n "$ENV_PRODUCTION" ]; then
        echo ""
        echo "Setting up PRODUCTION environment..."
        if [ -z "$DATABASE_URL" ]; then
            warn "DATABASE_URL not provided. You'll need to set it manually."
            warn "Use: postgresql://user:password@production-postgres.internal:5432/railway"
        else
            # Ensure production uses production-postgres.internal
            PROD_DB_URL=$(echo "$DATABASE_URL" | sed 's/@[^:]*:/@production-postgres.internal:/')
            add_env_var "api" "DATABASE_URL" "$PROD_DB_URL" "$ENV_PRODUCTION"
        fi
    fi
    # Add variables to selected environments
    for env_flag in $ENV_STAGING $ENV_PRODUCTION; do
        if [ -n "$env_flag" ]; then
            add_env_var "api" "SUPABASE_URL" "$SUPABASE_URL" "$env_flag"
            add_env_var "api" "SUPABASE_ANON_KEY" "$SUPABASE_ANON_KEY" "$env_flag"
            
            if [ -n "$SUPABASE_SERVICE_KEY" ]; then
                add_env_var "api" "SUPABASE_SERVICE_KEY" "$SUPABASE_SERVICE_KEY" "$env_flag"
            fi
            
            add_env_var "api" "PORT" "3001" "$env_flag"
            
            if [ -n "$CORS_ORIGINS" ]; then
                add_env_var "api" "CORS_ORIGINS" "$CORS_ORIGINS" "$env_flag"
            fi
            
            add_env_var "api" "STRIPE_SECRET_KEY" "$STRIPE_SECRET_KEY" "$env_flag"
            
            if [ -n "$STRIPE_WEBHOOK_SECRET" ]; then
                add_env_var "api" "STRIPE_WEBHOOK_SECRET" "$STRIPE_WEBHOOK_SECRET" "$env_flag"
            fi
            
            # Stripe Price IDs for packages
            add_env_var "api" "STRIPE_PRICE_PACKAGE_A" "$STRIPE_PRICE_PACKAGE_A" "$env_flag"
            add_env_var "api" "STRIPE_PRICE_PACKAGE_B" "$STRIPE_PRICE_PACKAGE_B" "$env_flag"
            add_env_var "api" "STRIPE_PRICE_PACKAGE_C" "$STRIPE_PRICE_PACKAGE_C" "$env_flag"
            add_env_var "api" "STRIPE_PRICE_PACKAGE_D" "$STRIPE_PRICE_PACKAGE_D" "$env_flag"
            
            # A la carte product price IDs
            for key in "${!ALACARTE_PRODUCTS[@]}"; do
                add_env_var "api" "$key" "${ALACARTE_PRODUCTS[$key]}" "$env_flag"
            done
            
            # DocuSign
            if [ -n "$DOCUSIGN_INTEGRATION_KEY" ]; then
                add_env_var "api" "DOCUSIGN_INTEGRATION_KEY" "$DOCUSIGN_INTEGRATION_KEY" "$env_flag"
            fi
            if [ -n "$DOCUSIGN_USER_ID" ]; then
                add_env_var "api" "DOCUSIGN_USER_ID" "$DOCUSIGN_USER_ID" "$env_flag"
            fi
            if [ -n "$DOCUSIGN_ACCOUNT_ID" ]; then
                add_env_var "api" "DOCUSIGN_ACCOUNT_ID" "$DOCUSIGN_ACCOUNT_ID" "$env_flag"
            fi
            if [ -n "$DOCUSIGN_PRIVATE_KEY" ]; then
                add_env_var "api" "DOCUSIGN_PRIVATE_KEY" "$DOCUSIGN_PRIVATE_KEY" "$env_flag"
            fi
            
            # AWS S3
            if [ -n "$AWS_ACCESS_KEY_ID" ]; then
                add_env_var "api" "AWS_ACCESS_KEY_ID" "$AWS_ACCESS_KEY_ID" "$env_flag"
            fi
            if [ -n "$AWS_SECRET_ACCESS_KEY" ]; then
                add_env_var "api" "AWS_SECRET_ACCESS_KEY" "$AWS_SECRET_ACCESS_KEY" "$env_flag"
            fi
            if [ -n "$AWS_S3_BUCKET" ]; then
                add_env_var "api" "AWS_S3_BUCKET" "$AWS_S3_BUCKET" "$env_flag"
            fi
            if [ -n "$AWS_REGION" ]; then
                add_env_var "api" "AWS_REGION" "$AWS_REGION" "$env_flag"
            fi
            
            # Sentry
            if [ -n "$SENTRY_DSN" ]; then
                add_env_var "api" "SENTRY_DSN" "$SENTRY_DSN" "$env_flag"
            fi
            
            # Node environment
            if [ "$env_flag" = "--environment staging" ]; then
                add_env_var "api" "NODE_ENV" "staging" "$env_flag"
            else
                add_env_var "api" "NODE_ENV" "production" "$env_flag"
            fi
        fi
    done
fi

# Configure Worker Service
if [ "$SERVICE_CHOICE" = "2" ] || [ "$SERVICE_CHOICE" = "3" ]; then
    echo ""
    echo "📦 Configuring Worker Service..."
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # Add variables to selected environments
    for env_flag in $ENV_STAGING $ENV_PRODUCTION; do
        if [ -n "$env_flag" ]; then
            # Handle DATABASE_URL for worker
            if [ "$env_flag" = "--environment staging" ]; then
                WORKER_DB_URL=$(echo "$DATABASE_URL" | sed 's/@[^:]*:/@staging-postgres.internal:/')
            else
                WORKER_DB_URL=$(echo "$DATABASE_URL" | sed 's/@[^:]*:/@production-postgres.internal:/')
            fi
            add_env_var "worker" "DATABASE_URL" "$WORKER_DB_URL" "$env_flag"
            add_env_var "worker" "REDIS_URL" "$REDIS_URL" "$env_flag"
            add_env_var "worker" "SENDGRID_API_KEY" "$SENDGRID_API_KEY" "$env_flag"
            add_env_var "worker" "SENDGRID_FROM_EMAIL" "$SENDGRID_FROM_EMAIL" "$env_flag"
            add_env_var "worker" "SENDGRID_FROM_NAME" "Kealee Platform" "$env_flag"
            add_env_var "worker" "ANTHROPIC_API_KEY" "$ANTHROPIC_API_KEY" "$env_flag"
            
            # Sentry
            if [ -n "$SENTRY_DSN" ]; then
                add_env_var "worker" "SENTRY_DSN" "$SENTRY_DSN" "$env_flag"
            fi
            
            # Node environment
            if [ "$env_flag" = "--environment staging" ]; then
                add_env_var "worker" "NODE_ENV" "staging" "$env_flag"
            else
                add_env_var "worker" "NODE_ENV" "production" "$env_flag"
            fi
        fi
    done
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Environment variables added successfully!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 Next steps:"
echo "  1. Verify variables in Railway dashboard"
echo "  2. Redeploy services if needed"
echo "  3. Check service logs for any issues"
echo ""
echo "💡 Note: Service names in Railway may differ."
echo "   If 'api' or 'worker' don't work, use exact service names from Railway dashboard"
echo ""

