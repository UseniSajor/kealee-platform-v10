#!/bin/bash

# Vercel Projects Setup Script
# Sets up all 7 Kealee Platform apps in Vercel

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
    exit 1
}

warn() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    error "Vercel CLI not found. Install with: npm install -g vercel"
fi

# Check if logged in
if ! vercel whoami &> /dev/null; then
    log "Please login to Vercel..."
    vercel login
fi

VERCEL_ORG=${VERCEL_ORG:-kealee}

log "Setting up Vercel projects for Kealee Platform"
log "Organization: $VERCEL_ORG"
echo ""

# Apps and their domains
declare -A APPS=(
    ["m-marketplace"]="marketplace.kealee.com"
    ["os-admin"]="admin.kealee.com"
    ["os-pm"]="pm.kealee.com"
    ["m-ops-services"]="ops.kealee.com"
    ["m-project-owner"]="app.kealee.com"
    ["m-architect"]="architect.kealee.com"
    ["m-permits-inspections"]="permits.kealee.com"
)

# Step 1: Add projects
log "Step 1: Adding Vercel projects..."
for app in "${!APPS[@]}"; do
    log "Adding project: $app"
    
    if [ -d "apps/$app" ]; then
        cd "apps/$app"
        
        # Link project to Vercel
        if vercel link --yes --scope="$VERCEL_ORG" --project="$app" 2>/dev/null; then
            log "✅ Project linked: $app"
        else
            warn "Project may already be linked or link failed"
        fi
        
        cd ../..
    else
        warn "Directory not found: apps/$app"
    fi
done

echo ""

# Step 2: Add domains
log "Step 2: Adding domains..."
for app in "${!APPS[@]}"; do
    domain="${APPS[$app]}"
    log "Adding domain $domain to $app"
    
    if vercel domains add "$domain" --scope="$VERCEL_ORG" 2>/dev/null; then
        log "✅ Domain added: $domain"
    else
        warn "Domain may already exist or add failed: $domain"
    fi
done

echo ""

# Step 3: Set up environment variables
log "Step 3: Setting up environment variables..."
log "Note: This script provides a template. You'll need to add actual values."

# Common environment variables for all apps
COMMON_VARS=(
    "NEXT_PUBLIC_API_URL=https://api.kealee.com"
    "NEXT_PUBLIC_SUPABASE_URL"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    "NEXT_PUBLIC_SENTRY_DSN"
)

# App-specific variables
declare -A APP_SPECIFIC_VARS=(
    ["m-marketplace"]="NEXT_PUBLIC_GA_MEASUREMENT_ID NEXT_PUBLIC_FB_PIXEL_ID NEXT_PUBLIC_GTM_ID"
    ["m-ops-services"]="NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
    ["m-architect"]="NEXT_PUBLIC_S3_BUCKET_NAME"
    ["m-permits-inspections"]="NEXT_PUBLIC_GIS_API_KEY"
)

for app in "${!APPS[@]}"; do
    log "Setting up environment variables for: $app"
    
    # Add common variables
    for var in "${COMMON_VARS[@]}"; do
        if [[ "$var" == *"="* ]]; then
            # Variable with value
            var_name="${var%%=*}"
            var_value="${var#*=}"
            log "  Adding $var_name=$var_value"
            # vercel env add "$var_name" production "$var_value" --scope="$VERCEL_ORG" --yes
        else
            # Variable without value (needs to be set manually)
            log "  ⚠️  Need to set: $var (set manually or provide value)"
        fi
    done
    
    # Add app-specific variables
    if [ -n "${APP_SPECIFIC_VARS[$app]}" ]; then
        for var in ${APP_SPECIFIC_VARS[$app]}; do
            log "  ⚠️  Need to set: $var (app-specific)"
        done
    fi
    
    echo ""
done

log "✅ Vercel projects setup complete!"
log ""
log "Next steps:"
log "1. Set environment variables manually in Vercel Dashboard"
log "2. Or use: vercel env add VARIABLE_NAME production"
log "3. Deploy each app: cd apps/<app> && vercel --prod"
