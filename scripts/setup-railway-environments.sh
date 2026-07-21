#!/bin/bash
# scripts/setup-railway-environments.sh
# Comprehensive Railway environment setup with proper staging/production isolation

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[SETUP]${NC} $1"
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

info() {
    echo -e "${CYAN}ℹ️${NC} $1"
}

echo "🚂 Railway Environment Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "This script will help you set up proper environment isolation"
echo "between staging and production in Railway."
echo ""

# Check Railway CLI
if ! command -v railway &> /dev/null; then
    log "Installing Railway CLI..."
    npm i -g @railway/cli
fi

# Check if logged in
if ! railway whoami &> /dev/null; then
    log "Please login to Railway:"
    railway login
fi

# Navigate to API service
cd services/api

# Check if linked to project
if ! railway status &> /dev/null; then
    log "Linking to Railway project..."
    railway link
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Environment Setup Checklist"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Before proceeding, ensure you have:"
echo "  ✅ Created 'staging-postgres' service in staging environment"
echo "  ✅ Created 'production-postgres' service in production environment"
echo "  ✅ Created 'kealee-platform-v10' service in both environments"
echo ""
read -p "Press Enter to continue or Ctrl+C to cancel..."

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 Step 1: Verify Service Structure"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Get project info
PROJECT_INFO=$(railway status 2>/dev/null || echo "")
if [ -z "$PROJECT_INFO" ]; then
    fail "Could not get Railway project info"
    exit 1
fi

info "Current Railway project:"
echo "$PROJECT_INFO"
echo ""

log "Checking available services and environments..."
railway service list 2>/dev/null || warn "Could not list services (may need to check manually)"

echo ""
read -p "Have you verified the service structure? (y/n): " VERIFIED
if [ "$VERIFIED" != "y" ] && [ "$VERIFIED" != "Y" ]; then
    warn "Please set up services in Railway dashboard first:"
    echo "  1. Go to Railway Dashboard"
    echo "  2. Create staging-postgres in staging environment"
    echo "  3. Create production-postgres in production environment"
    echo "  4. Create kealee-platform-v10 in both environments"
    echo ""
    read -p "Press Enter when services are created..."
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 Step 2: Configure DATABASE_URL for Staging"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

log "Getting staging-postgres DATABASE_URL..."
echo "Please go to Railway Dashboard:"
echo "  1. Switch to STAGING environment"
echo "  2. Open 'staging-postgres' service"
echo "  3. Go to Variables tab"
echo "  4. Copy the DATABASE_URL value"
echo ""

read -p "Paste staging-postgres DATABASE_URL: " STAGING_DB_URL_RAW

if [ -z "$STAGING_DB_URL_RAW" ]; then
    fail "DATABASE_URL is required"
    exit 1
fi

# Convert to internal hostname
STAGING_DB_URL=$(echo "$STAGING_DB_URL_RAW" | sed 's/@[^:]*:/@staging-postgres.internal:/')

log "Setting staging DATABASE_URL (using internal hostname)..."
if railway variables set "DATABASE_URL=$STAGING_DB_URL" --environment staging 2>/dev/null; then
    success "Staging DATABASE_URL configured"
else
    warn "Could not set via CLI. Please set manually:"
    echo "  Environment: staging"
    echo "  Service: kealee-platform-v10"
    echo "  Variable: DATABASE_URL"
    echo "  Value: $STAGING_DB_URL"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 Step 3: Configure DATABASE_URL for Production"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

log "Getting production-postgres DATABASE_URL..."
echo "Please go to Railway Dashboard:"
echo "  1. Switch to PRODUCTION environment"
echo "  2. Open 'production-postgres' service"
echo "  3. Go to Variables tab"
echo "  4. Copy the DATABASE_URL value"
echo ""

read -p "Paste production-postgres DATABASE_URL: " PROD_DB_URL_RAW

if [ -z "$PROD_DB_URL_RAW" ]; then
    fail "DATABASE_URL is required"
    exit 1
fi

# Convert to internal hostname
PROD_DB_URL=$(echo "$PROD_DB_URL_RAW" | sed 's/@[^:]*:/@production-postgres.internal:/')

log "Setting production DATABASE_URL (using internal hostname)..."
if railway variables set "DATABASE_URL=$PROD_DB_URL" --environment production 2>/dev/null; then
    success "Production DATABASE_URL configured"
else
    warn "Could not set via CLI. Please set manually:"
    echo "  Environment: production"
    echo "  Service: kealee-platform-v10"
    echo "  Variable: DATABASE_URL"
    echo "  Value: $PROD_DB_URL"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Step 4: Verify Environment Isolation"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cd ../..

log "Running verification script..."
if bash scripts/verify-railway-env-isolation.sh; then
    success "Environment isolation verified!"
else
    warn "Verification found issues. Please fix them before deploying."
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 Step 5: Additional Environment Variables"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "You may need to set additional environment variables:"
echo "  • SUPABASE_URL"
echo "  • SUPABASE_ANON_KEY"
echo "  • STRIPE_SECRET_KEY"
echo "  • Other service-specific variables"
echo ""
echo "Use the following commands or Railway dashboard:"
echo ""
echo "  # For staging:"
echo "  railway variables set KEY=value --environment staging"
echo ""
echo "  # For production:"
echo "  railway variables set KEY=value --environment production"
echo ""
echo "Or use: bash scripts/add-railway-env-vars.sh"
echo ""

read -p "Set additional environment variables now? (y/n): " SET_MORE
if [ "$SET_MORE" = "y" ] || [ "$SET_MORE" = "Y" ]; then
    echo ""
    log "Running environment variable setup script..."
    bash scripts/add-railway-env-vars.sh
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Setup Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
success "Railway environment setup completed!"
echo ""
echo "📋 Next Steps:"
echo "  1. Verify all environment variables in Railway dashboard"
echo "  2. Run: bash scripts/verify-railway-env-isolation.sh"
echo "  3. Test staging deployment"
echo "  4. Test production deployment"
echo "  5. Monitor deployment logs"
echo ""
echo "📚 Documentation:"
echo "  • RAILWAY_ENVIRONMENT_SETUP.md - Complete setup guide"
echo "  • RAILWAY_QUICK_REFERENCE.md - Quick reference"
echo ""

