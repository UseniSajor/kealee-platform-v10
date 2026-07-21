#!/bin/bash
# scripts/db-create-migration.sh
# Create a new database migration

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[MIGRATION]${NC} $1"
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
if [ $# -lt 1 ]; then
    echo "Usage: $0 <migration-name>"
    echo ""
    echo "Examples:"
    echo "  $0 add_user_table"
    echo "  $0 update_subscription_schema"
    echo "  $0 add_new_feature"
    echo ""
    echo "Or use npm script:"
    echo "  npm run db:create:migration -- --name=add_new_feature"
    exit 1
fi

# Parse migration name
# Handle both direct calls and npm script calls with --
MIGRATION_NAME=""
if [ $# -eq 0 ]; then
    fail "Migration name is required"
    echo ""
    echo "Usage:"
    echo "  $0 <migration-name>"
    echo "  npm run db:create:migration -- add_new_feature"
    exit 1
fi

# Get first non-flag argument
for arg in "$@"; do
    if [[ "$arg" != "--"* ]] && [ -n "$arg" ]; then
        MIGRATION_NAME="$arg"
        break
    fi
done

# If still empty, use first argument
if [ -z "$MIGRATION_NAME" ]; then
    MIGRATION_NAME="$1"
fi

if [ -z "$MIGRATION_NAME" ]; then
    fail "Migration name is required"
    exit 1
fi

# Validate migration name (alphanumeric and underscores)
if [[ ! "$MIGRATION_NAME" =~ ^[a-zA-Z0-9_]+$ ]]; then
    fail "Invalid migration name. Use only letters, numbers, and underscores."
    exit 1
fi

echo "📝 Creating Database Migration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   Migration name: $MIGRATION_NAME"
echo ""

# Navigate to database package
cd packages/database

# Check if Prisma schema exists
if [ ! -f "prisma/schema.prisma" ]; then
    fail "Prisma schema not found: prisma/schema.prisma"
    exit 1
fi

# Check if migrations directory exists
if [ ! -d "prisma/migrations" ]; then
    log "Creating migrations directory..."
    mkdir -p prisma/migrations
fi

log "Creating migration: $MIGRATION_NAME..."

# Create migration (create-only mode)
# Note: --name flag must come after --create-only
if npx prisma migrate dev --create-only --schema=./prisma/schema.prisma --name="$MIGRATION_NAME"; then
    success "Migration created successfully"
    
    # Find the created migration
    LATEST_MIGRATION=$(ls -t prisma/migrations | grep -E "^[0-9]+_$MIGRATION_NAME" | head -n1)
    
    if [ -n "$LATEST_MIGRATION" ]; then
        MIGRATION_PATH="prisma/migrations/$LATEST_MIGRATION"
        MIGRATION_FILE="$MIGRATION_PATH/migration.sql"
        
        if [ -f "$MIGRATION_FILE" ]; then
            echo ""
            echo "📄 Migration file created:"
            echo "   $MIGRATION_FILE"
            echo ""
            echo "📝 Next steps:"
            echo "   1. Review the migration SQL"
            echo "   2. Edit if needed: $MIGRATION_FILE"
            echo "   3. Test locally: npm run db:migrate"
            echo "   4. Apply to production: npm run db:migrate:prod"
            echo ""
            echo "Migration SQL preview:"
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            head -20 "$MIGRATION_FILE" || echo "(File is empty or not readable)"
        else
            warn "Migration directory created but SQL file not found"
        fi
    else
        warn "Could not locate created migration file"
    fi
else
    fail "Failed to create migration"
    exit 1
fi
