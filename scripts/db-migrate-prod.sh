#!/bin/bash
# scripts/db-migrate-prod.sh
# Run database migrations on production

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

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    fail "DATABASE_URL environment variable is not set"
    echo "   Set it in your .env file or export it:"
    echo "   export DATABASE_URL='postgresql://user:password@host:port/database'"
    exit 1
fi

# Safety check
echo "🚨 PRODUCTION DATABASE MIGRATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
warn "⚠️  WARNING: This will run migrations on PRODUCTION database"
echo ""
echo "Before proceeding, ensure:"
echo "  ✅ Database backup created"
echo "  ✅ Migrations tested in staging"
echo "  ✅ All team members notified"
echo "  ✅ Maintenance window scheduled (if needed)"
echo ""
read -p "Are you sure you want to run migrations on PRODUCTION? (type 'yes' to confirm): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Migration cancelled."
    exit 0
fi

# Navigate to database package
cd packages/database

# Check if Prisma schema exists
if [ ! -f "prisma/schema.prisma" ]; then
    fail "Prisma schema not found: prisma/schema.prisma"
    exit 1
fi

log "Checking migration status..."
MIGRATION_STATUS=$(npx prisma migrate status --schema=./prisma/schema.prisma 2>&1 || echo "error")

if echo "$MIGRATION_STATUS" | grep -q "Database schema is up to date"; then
    success "Database schema is already up to date"
    exit 0
fi

log "Running production migrations..."
if npx prisma migrate deploy --schema=./prisma/schema.prisma; then
    success "Production migrations completed successfully"
    
    # Verify
    log "Verifying migration status..."
    FINAL_STATUS=$(npx prisma migrate status --schema=./prisma/schema.prisma 2>&1)
    if echo "$FINAL_STATUS" | grep -q "Database schema is up to date"; then
        success "Migration verification passed"
    else
        warn "Migration verification inconclusive"
        echo "$FINAL_STATUS"
    fi
    
    echo ""
    echo "✅ Production migrations completed!"
    echo ""
    echo "📋 Next Steps:"
    echo "   1. Verify application connectivity"
    echo "   2. Run smoke tests"
    echo "   3. Monitor database performance"
    echo "   4. Check application logs"
else
    fail "Production migrations failed"
    echo ""
    echo "🔍 Troubleshooting:"
    echo "   1. Check database connection"
    echo "   2. Review migration files"
    echo "   3. Check database logs"
    echo "   4. Restore from backup if needed"
    exit 1
fi
