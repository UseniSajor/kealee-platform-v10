#!/bin/bash

# Check Vercel Environment Variables
# This script helps identify missing environment variables for Vercel deployments

set -e

echo "🔍 Checking Vercel Environment Variables..."
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

# Required environment variables
REQUIRED_VARS=(
    "DATABASE_URL"
    "NEXT_PUBLIC_API_URL"
    "SUPABASE_URL"
    "SUPABASE_ANON_KEY"
    "NEXT_PUBLIC_SUPABASE_URL"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
)

# App-specific variables
APP_VARS=(
    "m-marketplace:NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
    "m-marketplace:STRIPE_SECRET_KEY"
    "m-ops-services:STRIPE_SECRET_KEY"
    "m-ops-services:STRIPE_WEBHOOK_SECRET"
    "m-permits-inspections:GOOGLE_PLACES_API_KEY"
    "m-permits-inspections:AWS_ACCESS_KEY_ID"
    "m-permits-inspections:AWS_SECRET_ACCESS_KEY"
    "m-permits-inspections:AWS_S3_BUCKET"
)

APPS=(
    "m-marketplace"
    "m-ops-services"
    "m-project-owner"
    "m-permits-inspections"
    "m-architect"
    "os-admin"
    "os-pm"
)

echo "📋 Checking environment variables for all apps..."
echo ""

for app in "${APPS[@]}"; do
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📦 $app"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # Check required vars
    missing=0
    for var in "${REQUIRED_VARS[@]}"; do
        if vercel env ls "$app" production 2>/dev/null | grep -q "$var"; then
            echo "  ✅ $var"
        else
            echo "  ❌ $var (MISSING)"
            missing=$((missing + 1))
        fi
    done
    
    # Check app-specific vars
    for app_var in "${APP_VARS[@]}"; do
        IFS=':' read -r app_name var_name <<< "$app_var"
        if [ "$app_name" = "$app" ]; then
            if vercel env ls "$app" production 2>/dev/null | grep -q "$var_name"; then
                echo "  ✅ $var_name"
            else
                echo "  ⚠️  $var_name (OPTIONAL)"
            fi
        fi
    done
    
    if [ $missing -eq 0 ]; then
        echo ""
        echo "  ✅ All required variables present"
    else
        echo ""
        echo "  ❌ Missing $missing required variable(s)"
    fi
    
    echo ""
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 Next Steps:"
echo ""
echo "1. Update missing environment variables in Vercel dashboard"
echo "2. Or use: vercel env add <VAR_NAME> <PROJECT>"
echo "3. Redeploy after updating variables"
echo ""
echo "For Railway database URL:"
echo "  - Get from Railway dashboard → PostgreSQL → Connect"
echo "  - Format: postgresql://postgres:password@host:port/railway"
echo ""
echo "For Railway API URL:"
echo "  - Get from Railway dashboard → API Service → Settings → Public URL"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

