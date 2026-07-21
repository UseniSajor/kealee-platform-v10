#!/bin/bash

# Vercel Environment Variables Setup Script
# Bulk sets environment variables for all apps

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

VERCEL_ORG=${VERCEL_ORG:-kealee}
ENV_FILE=${1:-.env.production}

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

# Apps list
APPS=(
    "m-marketplace"
    "os-admin"
    "os-pm"
    "m-ops-services"
    "m-project-owner"
    "m-architect"
    "m-permits-inspections"
)

log "Setting up environment variables for all apps"
log "Organization: $VERCEL_ORG"
log "Environment file: $ENV_FILE"
echo ""

# Function to add env var to Vercel
add_env_var() {
    local app=$1
    local var_name=$2
    local var_value=$3
    local env_type=${4:-production}
    
    log "Adding $var_name to $app ($env_type)..."
    
    # Use echo to pipe value to vercel env add
    echo "$var_value" | vercel env add "$var_name" "$env_type" --scope="$VERCEL_ORG" --yes 2>/dev/null || {
        warn "Failed to add $var_name to $app (may already exist)"
    }
}

# Read environment file and add variables
if [ -f "$ENV_FILE" ]; then
    log "Reading environment variables from $ENV_FILE"
    
    while IFS='=' read -r key value || [ -n "$key" ]; do
        # Skip comments and empty lines
        [[ "$key" =~ ^#.*$ ]] && continue
        [[ -z "$key" ]] && continue
        
        # Remove quotes from value
        value=$(echo "$value" | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")
        
        # Add to all apps
        for app in "${APPS[@]}"; do
            add_env_var "$app" "$key" "$value" "production"
            add_env_var "$app" "$key" "$value" "preview"
            add_env_var "$app" "$key" "$value" "development"
        done
    done < "$ENV_FILE"
else
    warn "Environment file not found: $ENV_FILE"
    log "Creating template environment file..."
    
    cat > "$ENV_FILE.template" <<EOF
# Common Environment Variables
# Copy this file to $ENV_FILE and fill in actual values

NEXT_PUBLIC_API_URL=https://api.kealee.com
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...

# Stripe (for m-ops-services)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Analytics (for m-marketplace)
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
NEXT_PUBLIC_FB_PIXEL_ID=XXXXXXXXXX
NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX

# File Storage (for m-architect)
NEXT_PUBLIC_S3_BUCKET_NAME=kealee-uploads
EOF
    
    log "Template created: $ENV_FILE.template"
    log "Copy to $ENV_FILE and fill in values, then run this script again"
fi

log ""
log "✅ Environment variables setup complete!"
log ""
log "To verify, check Vercel Dashboard → Projects → Settings → Environment Variables"
