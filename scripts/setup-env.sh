#!/bin/bash
# scripts/setup-env.sh
# Setup environment variables for Vercel projects

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[ENV]${NC} $1"
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

# Check arguments
if [ $# -lt 2 ]; then
    echo "Usage: $0 <app-name> <environment>"
    echo ""
    echo "Examples:"
    echo "  $0 m-marketplace production"
    echo "  $0 os-admin staging"
    echo ""
    echo "Available apps:"
    echo "  - m-marketplace"
    echo "  - os-admin"
    echo "  - os-pm"
    echo "  - m-ops-services"
    echo "  - m-project-owner"
    echo "  - m-architect"
    echo "  - m-permits-inspections"
    echo ""
    echo "Environments:"
    echo "  - production"
    echo "  - preview (staging)"
    echo "  - development"
    exit 1
fi

APP_NAME=$1
ENVIRONMENT=$2

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(production|preview|development)$ ]]; then
    fail "Invalid environment: $ENVIRONMENT"
    echo "   Must be: production, preview, or development"
    exit 1
fi

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

APP_DIR="apps/$APP_NAME"

if [ ! -d "$APP_DIR" ]; then
    fail "Application directory not found: $APP_DIR"
    exit 1
fi

echo "🔐 Setting Environment Variables"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   App: $APP_NAME"
echo "   Environment: $ENVIRONMENT"
echo ""

cd "$APP_DIR"

# Check if project is linked
if [ ! -f ".vercel/project.json" ]; then
    warn "Project not linked to Vercel"
    echo "   Linking project..."
    if vercel link; then
        success "Project linked"
    else
        fail "Failed to link project"
        exit 1
    fi
fi

# Common environment variables
ENV_VARS=(
    "DATABASE_URL"
    "SUPABASE_URL"
    "SUPABASE_ANON_KEY"
    "SUPABASE_SERVICE_ROLE_KEY"
    "STRIPE_SECRET_KEY"
    "STRIPE_WEBHOOK_SECRET"
    "STRIPE_PUBLISHABLE_KEY"
    "SENTRY_DSN"
    "SENTRY_AUTH_TOKEN"
    "NEXT_PUBLIC_API_URL"
    "NEXT_PUBLIC_APP_URL"
    "NODE_ENV"
)

# App-specific variables
case $APP_NAME in
    m-marketplace)
        ENV_VARS+=("NEXT_PUBLIC_MAPBOX_TOKEN")
        ;;
    m-ops-services)
        ENV_VARS+=("STRIPE_PRICE_PACKAGE_A" "STRIPE_PRICE_PACKAGE_B" "STRIPE_PRICE_PACKAGE_C" "STRIPE_PRICE_PACKAGE_D")
        ;;
    m-architect)
        ENV_VARS+=("S3_ACCESS_KEY_ID" "S3_SECRET_ACCESS_KEY" "S3_BUCKET_NAME" "S3_REGION")
        ;;
    m-permits-inspections)
        ENV_VARS+=("NEXT_PUBLIC_MAPBOX_TOKEN")
        ;;
esac

log "Setting environment variables for $APP_NAME ($ENVIRONMENT)..."

SET_COUNT=0
SKIP_COUNT=0
FAIL_COUNT=0

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
        log "  Setting $var..."
        if echo "$VALUE" | vercel env add "$var" "$ENVIRONMENT" 2>&1 | grep -q "error\|Error"; then
            # Check if already exists
            if vercel env ls | grep -q "$var.*$ENVIRONMENT"; then
                warn "  $var already exists, skipping"
                SKIP_COUNT=$((SKIP_COUNT + 1))
            else
                fail "  Failed to set $var"
                FAIL_COUNT=$((FAIL_COUNT + 1))
            fi
        else
            success "  $var set"
            SET_COUNT=$((SET_COUNT + 1))
        fi
    else
        warn "  $var not found, skipping"
        SKIP_COUNT=$((SKIP_COUNT + 1))
    fi
done

cd ../..

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Environment Setup Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
success "Variables set: $SET_COUNT"
if [ $SKIP_COUNT -gt 0 ]; then
    warn "Variables skipped: $SKIP_COUNT"
fi
if [ $FAIL_COUNT -gt 0 ]; then
    fail "Variables failed: $FAIL_COUNT"
fi
echo ""

if [ $FAIL_COUNT -eq 0 ]; then
    echo "✅ Environment setup complete!"
    echo ""
    echo "To verify:"
    echo "  cd $APP_DIR"
    echo "  vercel env ls"
else
    echo "⚠️  Some variables failed to set. Review errors above."
    exit 1
fi
