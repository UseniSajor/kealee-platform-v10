#!/bin/bash
# scripts/setup-staging-env.sh
# Set up staging environment variables for all applications

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[STAGING]${NC} $1"
}

success() {
    echo -e "${GREEN}✅${NC} $1"
}

fail() {
    echo -e "${RED}❌${NC} $1"
}

warn() {
    echo -e "${YELLOW}⚠️${NC} $1"
}

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    fail "Vercel CLI not installed"
    echo "   Install with: npm install -g vercel@latest"
    exit 1
fi

# Check if logged in
if ! vercel whoami &> /dev/null; then
    fail "Not logged in to Vercel"
    echo "   Login with: vercel login"
    exit 1
fi

echo "🔐 Setting Up Staging Environment Variables"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "This will set environment variables for the 'preview' environment"
echo "(Vercel's staging/preview environment)"
echo ""

# Ask if user wants to copy from production
read -p "Copy environment variables from production? (y/N): " COPY_FROM_PROD

ENVIRONMENT="preview"

# Applications
APPS=(
    "m-marketplace"
    "os-admin"
    "os-pm"
    "m-ops-services"
    "m-project-owner"
    "m-architect"
    "m-permits-inspections"
)

SUCCESS_COUNT=0
FAIL_COUNT=0
SKIP_COUNT=0

for app in "${APPS[@]}"; do
    APP_DIR="apps/$app"
    
    if [ ! -d "$APP_DIR" ]; then
        warn "Directory not found: $APP_DIR"
        SKIP_COUNT=$((SKIP_COUNT + 1))
        continue
    fi
    
    echo ""
    log "Setting up $app..."
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    cd "$APP_DIR"
    
    # Check if project is linked
    if [ ! -f ".vercel/project.json" ]; then
        warn "Project not linked to Vercel"
        read -p "  Link now? (y/N): " LINK_NOW
        if [ "$LINK_NOW" = "y" ] || [ "$LINK_NOW" = "Y" ]; then
            if vercel link; then
                success "Project linked"
            else
                fail "Failed to link project"
                cd ../..
                FAIL_COUNT=$((FAIL_COUNT + 1))
                continue
            fi
        else
            warn "Skipping $app (not linked)"
            cd ../..
            SKIP_COUNT=$((SKIP_COUNT + 1))
            continue
        fi
    fi
    
    # If copying from production, use copy-env-to-staging script
    if [ "$COPY_FROM_PROD" = "y" ] || [ "$COPY_FROM_PROD" = "Y" ]; then
        cd ../..
        log "Copying production env vars to staging for $app..."
        if ./scripts/copy-env-to-staging.sh --app="$app" --force; then
            success "$app: Copied from production"
            SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
        else
            fail "$app: Failed to copy from production"
            FAIL_COUNT=$((FAIL_COUNT + 1))
        fi
        continue
    fi
    
    # Otherwise, set staging-specific variables
    log "Setting staging environment variables for $app..."
    
    # Common environment variables
    ENV_VARS=(
        "DATABASE_URL"
        "NEXTAUTH_URL"
        "NEXTAUTH_SECRET"
        "SUPABASE_URL"
        "SUPABASE_ANON_KEY"
        "SUPABASE_SERVICE_ROLE_KEY"
        "STRIPE_SECRET_KEY"
        "STRIPE_WEBHOOK_SECRET"
        "STRIPE_PUBLISHABLE_KEY"
        "NEXT_PUBLIC_API_URL"
        "NEXT_PUBLIC_SITE_URL"
        "NEXT_PUBLIC_SENTRY_DSN"
        "SENTRY_DSN"
    )
    
    # App-specific variables
    case $app in
        m-marketplace)
            ENV_VARS+=("NEXT_PUBLIC_GA_MEASUREMENT_ID" "NEXT_PUBLIC_GTM_ID" "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY")
            ;;
        m-ops-services)
            ENV_VARS+=("STRIPE_PRICE_PACKAGE_A" "STRIPE_PRICE_PACKAGE_B" "STRIPE_PRICE_PACKAGE_C" "STRIPE_PRICE_PACKAGE_D")
            ;;
        m-architect)
            ENV_VARS+=("S3_ACCESS_KEY_ID" "S3_SECRET_ACCESS_KEY" "S3_BUCKET_NAME" "S3_REGION")
            ;;
        m-permits-inspections)
            ENV_VARS+=("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY")
            ;;
    esac
    
    SET_COUNT=0
    SKIP_VAR_COUNT=0
    
    for var in "${ENV_VARS[@]}"; do
        # Check if value exists in .env.local or .env
        VALUE=""
        
        # Try .env.local first
        if [ -f ".env.local" ] && grep -q "^$var=" .env.local 2>/dev/null; then
            VALUE=$(grep "^$var=" .env.local | cut -d'=' -f2- | sed 's/^"//;s/"$//' | xargs)
        # Try .env
        elif [ -f ".env" ] && grep -q "^$var=" .env 2>/dev/null; then
            VALUE=$(grep "^$var=" .env | cut -d'=' -f2- | sed 's/^"//;s/"$//' | xargs)
        # Try environment variable
        elif [ -n "${!var}" ]; then
            VALUE="${!var}"
        # Try from file
        elif [ -f "${var,,}.txt" ]; then
            VALUE=$(cat "${var,,}.txt" | xargs)
        fi
        
        if [ -n "$VALUE" ]; then
            # For staging, modify URLs if needed
            if [[ "$var" == *"URL"* ]] && [[ "$VALUE" == *"production"* ]] || [[ "$VALUE" == *"kealee.com"* ]]; then
                # Replace production URLs with staging
                VALUE=$(echo "$VALUE" | sed 's/production/staging/g' | sed 's/kealee\.com/staging.kealee.com/g')
            fi
            
            log "  Setting $var..."
            if echo "$VALUE" | vercel env add "$var" "$ENVIRONMENT" 2>&1 | grep -q "error\|Error"; then
                # Check if already exists
                if vercel env ls | grep -q "$var.*$ENVIRONMENT"; then
                    warn "  $var already exists, skipping"
                    SKIP_VAR_COUNT=$((SKIP_VAR_COUNT + 1))
                else
                    fail "  Failed to set $var"
                fi
            else
                success "  $var set"
                SET_COUNT=$((SET_COUNT + 1))
            fi
        else
            warn "  $var not found, skipping"
            SKIP_VAR_COUNT=$((SKIP_VAR_COUNT + 1))
        fi
    done
    
    cd ../..
    
    if [ $SET_COUNT -gt 0 ]; then
        success "$app: $SET_COUNT variable(s) set"
        SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
    else
        warn "$app: No variables set (all skipped or failed)"
        SKIP_COUNT=$((SKIP_COUNT + 1))
    fi
done

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Staging Environment Setup Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
success "Apps configured: $SUCCESS_COUNT"
if [ $SKIP_COUNT -gt 0 ]; then
    warn "Apps skipped: $SKIP_COUNT"
fi
if [ $FAIL_COUNT -gt 0 ]; then
    fail "Apps failed: $FAIL_COUNT"
fi
echo ""

if [ $FAIL_COUNT -eq 0 ] && [ $SUCCESS_COUNT -gt 0 ]; then
    echo "✅ Staging environment setup complete!"
    echo ""
    echo "📋 Next Steps:"
    echo "   1. Verify environment variables:"
    echo "      cd apps/m-marketplace && vercel env ls"
    echo "   2. Deploy to staging:"
    echo "      ./scripts/deploy-staging.sh"
    echo "   3. Test staging deployment"
    exit 0
else
    echo "⚠️  Some applications failed. Review errors above."
    exit 1
fi
