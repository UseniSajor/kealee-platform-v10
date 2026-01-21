#!/bin/bash
# scripts/verify-railway-env-isolation.sh
# Verify that staging and production environments have separate DATABASE_URL values

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[VERIFY]${NC} $1"
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

echo "🔍 Verifying Railway Environment Isolation"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    fail "Railway CLI not installed"
    echo "   Install with: npm install -g @railway/cli"
    echo ""
    echo "   Or verify manually in Railway dashboard:"
    echo "   1. Go to Railway Dashboard"
    echo "   2. Select your project"
    echo "   3. Switch to 'staging' environment"
    echo "   4. Check kealee-platform-v10 service → Variables → DATABASE_URL"
    echo "   5. Switch to 'production' environment"
    echo "   6. Check kealee-platform-v10 service → Variables → DATABASE_URL"
    echo "   7. Verify they are different and use correct .internal hostnames"
    exit 1
fi

# Check if logged in
if ! railway whoami &> /dev/null; then
    fail "Not logged in to Railway"
    echo "   Login with: railway login"
    exit 1
fi

log "Checking Railway project link..."
cd services/api 2>/dev/null || {
    fail "services/api directory not found"
    echo "   Run this script from the project root"
    exit 1
}

# Check if linked to Railway project
if ! railway status &> /dev/null; then
    warn "Not linked to Railway project"
    echo "   Link with: railway link"
    echo ""
    echo "   Or verify manually in Railway dashboard (see instructions above)"
    exit 1
fi

cd ../..

log "Fetching environment variables..."

# Get staging DATABASE_URL
log "Fetching staging DATABASE_URL..."
STAGING_DB_URL=$(railway variables --environment staging 2>/dev/null | grep -i "DATABASE_URL" | head -n1 | awk -F'=' '{print $2}' | tr -d ' ' || echo "")

# Get production DATABASE_URL
log "Fetching production DATABASE_URL..."
PROD_DB_URL=$(railway variables --environment production 2>/dev/null | grep -i "DATABASE_URL" | head -n1 | awk -F'=' '{print $2}' | tr -d ' ' || echo "")

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Verification Results"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if DATABASE_URL exists for staging
if [ -z "$STAGING_DB_URL" ]; then
    fail "Staging DATABASE_URL not found"
    echo "   Set it in Railway dashboard:"
    echo "   Staging → kealee-platform-v10 → Variables → DATABASE_URL"
else
    success "Staging DATABASE_URL found"
    echo "   Value: ${STAGING_DB_URL:0:50}..."
    
    # Check if staging uses staging-postgres.internal
    if echo "$STAGING_DB_URL" | grep -q "staging-postgres.internal"; then
        success "Staging uses staging-postgres.internal (correct)"
    elif echo "$STAGING_DB_URL" | grep -q "staging"; then
        warn "Staging DATABASE_URL contains 'staging' but not '.internal' hostname"
        echo "   Consider using staging-postgres.internal for better performance"
    else
        warn "Staging DATABASE_URL doesn't contain 'staging' identifier"
        echo "   Verify it points to staging-postgres service"
    fi
fi

echo ""

# Check if DATABASE_URL exists for production
if [ -z "$PROD_DB_URL" ]; then
    fail "Production DATABASE_URL not found"
    echo "   Set it in Railway dashboard:"
    echo "   Production → kealee-platform-v10 → Variables → DATABASE_URL"
else
    success "Production DATABASE_URL found"
    echo "   Value: ${PROD_DB_URL:0:50}..."
    
    # Check if production uses production-postgres.internal
    if echo "$PROD_DB_URL" | grep -q "production-postgres.internal"; then
        success "Production uses production-postgres.internal (correct)"
    elif echo "$PROD_DB_URL" | grep -q "production"; then
        warn "Production DATABASE_URL contains 'production' but not '.internal' hostname"
        echo "   Consider using production-postgres.internal for better performance"
    else
        warn "Production DATABASE_URL doesn't contain 'production' identifier"
        echo "   Verify it points to production-postgres service"
    fi
fi

echo ""

# Check if they are different
if [ -n "$STAGING_DB_URL" ] && [ -n "$PROD_DB_URL" ]; then
    if [ "$STAGING_DB_URL" = "$PROD_DB_URL" ]; then
        fail "CRITICAL: Staging and Production DATABASE_URL are the SAME!"
        echo ""
        echo "   This is a serious security issue!"
        echo "   Staging changes will affect production data."
        echo ""
        echo "   Fix immediately:"
        echo "   1. Go to Railway Dashboard"
        echo "   2. Staging → kealee-platform-v10 → Variables"
        echo "   3. Set DATABASE_URL to staging-postgres.internal"
        echo "   4. Production → kealee-platform-v10 → Variables"
        echo "   5. Set DATABASE_URL to production-postgres.internal"
        exit 1
    else
        success "Staging and Production DATABASE_URL are different (correct)"
    fi
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Final check
ALL_GOOD=true

if [ -z "$STAGING_DB_URL" ]; then
    fail "Staging DATABASE_URL missing"
    ALL_GOOD=false
fi

if [ -z "$PROD_DB_URL" ]; then
    fail "Production DATABASE_URL missing"
    ALL_GOOD=false
fi

if [ -n "$STAGING_DB_URL" ] && [ -n "$PROD_DB_URL" ] && [ "$STAGING_DB_URL" = "$PROD_DB_URL" ]; then
    fail "DATABASE_URL values are identical (CRITICAL)"
    ALL_GOOD=false
fi

if [ "$ALL_GOOD" = true ]; then
    echo ""
    success "✅ Environment isolation verified!"
    echo ""
    echo "Next steps:"
    echo "  • Verify Prisma migrations are configured correctly"
    echo "  • Test database connections"
    echo "  • Monitor deployment logs"
    exit 0
else
    echo ""
    fail "❌ Environment isolation issues found"
    echo ""
    echo "Fix the issues above before deploying."
    exit 1
fi

