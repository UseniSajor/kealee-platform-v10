#!/bin/bash
# scripts/railway-migrate.sh
# Run Prisma migrations on Railway (staging or production)

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[MIGRATE]${NC} $1"
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

# Parse environment argument
ENVIRONMENT="${1:-staging}"

if [ "$ENVIRONMENT" != "staging" ] && [ "$ENVIRONMENT" != "production" ]; then
    fail "Invalid environment: $ENVIRONMENT"
    echo "Usage: bash scripts/railway-migrate.sh [staging|production]"
    exit 1
fi

echo "🔧 Railway Database Migration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
log "Environment: $ENVIRONMENT"
echo ""

# Check Railway CLI
if ! command -v railway &> /dev/null; then
    fail "Railway CLI not installed"
    echo "Install: npm i -g @railway/cli"
    exit 1
fi

# Check if logged in
if ! railway whoami &> /dev/null; then
    log "Please login to Railway:"
    railway login
fi

cd services/api

# Check if linked to project
if ! railway status &> /dev/null; then
    log "Linking to Railway project:"
    railway link
fi

# Safety check for production
if [ "$ENVIRONMENT" = "production" ]; then
    warn "⚠️  WARNING: This will run migrations on PRODUCTION"
    echo ""
    echo "Before proceeding, ensure:"
    echo "  ✅ Database backup created"
    echo "  ✅ Migrations tested in staging"
    echo "  ✅ All team members notified"
    echo ""
    read -p "Continue with production migration? (type 'yes' to confirm): " CONFIRM
    if [ "$CONFIRM" != "yes" ]; then
        echo "Migration cancelled."
        exit 0
    fi
fi

# Get DATABASE_URL from Railway
log "Fetching DATABASE_URL from Railway..."
DATABASE_URL=$(railway variables --environment "$ENVIRONMENT" 2>/dev/null | grep -i "DATABASE_URL" | head -n1 | awk -F'=' '{print $2}' | tr -d ' ' || echo "")

if [ -z "$DATABASE_URL" ]; then
    fail "DATABASE_URL not found in Railway $ENVIRONMENT environment"
    echo ""
    echo "Set it in Railway dashboard:"
    echo "  $ENVIRONMENT → kealee-platform-v10 → Variables → DATABASE_URL"
    exit 1
fi

# Verify it uses .internal hostname
if [ "$ENVIRONMENT" = "staging" ] && ! echo "$DATABASE_URL" | grep -q "staging-postgres.internal"; then
    warn "DATABASE_URL doesn't use staging-postgres.internal"
    echo "  Current: $(echo "$DATABASE_URL" | sed 's/:[^:]*@/:***@/')"
    echo "  Recommended: Use staging-postgres.internal as hostname"
    read -p "Continue anyway? (y/n): " CONTINUE
    if [ "$CONTINUE" != "y" ] && [ "$CONTINUE" != "Y" ]; then
        exit 0
    fi
fi

if [ "$ENVIRONMENT" = "production" ] && ! echo "$DATABASE_URL" | grep -q "production-postgres.internal"; then
    warn "DATABASE_URL doesn't use production-postgres.internal"
    echo "  Current: $(echo "$DATABASE_URL" | sed 's/:[^:]*@/:***@/')"
    echo "  Recommended: Use production-postgres.internal as hostname"
    read -p "Continue anyway? (y/n): " CONTINUE
    if [ "$CONTINUE" != "y" ] && [ "$CONTINUE" != "Y" ]; then
        exit 0
    fi
fi

# Export DATABASE_URL and run migration
export DATABASE_URL

cd ../../packages/database

log "Running Prisma migrations..."
if pnpm db:migrate:deploy; then
    success "Migrations completed successfully!"
    
    # Verify
    log "Verifying migration status..."
    if pnpm db:migrate:status | grep -q "Database schema is up to date"; then
        success "Migration verification passed"
    else
        warn "Migration verification inconclusive"
        pnpm db:migrate:status
    fi
    
    echo ""
    success "$ENVIRONMENT migrations completed!"
    echo ""
    echo "📋 Next Steps:"
    echo "   1. Verify application connectivity"
    echo "   2. Check application logs"
    echo "   3. Run tests if available"
else
    fail "Migrations failed"
    echo ""
    echo "🔍 Troubleshooting:"
    echo "   1. Check database connection"
    echo "   2. Review migration files"
    echo "   3. Check Railway logs"
    exit 1
fi

cd ../..

