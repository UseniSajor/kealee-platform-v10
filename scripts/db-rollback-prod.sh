#!/bin/bash
# scripts/db-rollback-prod.sh
# Rollback last database migration on production

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[ROLLBACK]${NC} $1"
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
    exit 1
fi

# Safety check
echo "🚨 PRODUCTION DATABASE ROLLBACK"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
warn "⚠️  WARNING: This will ROLLBACK the last migration on PRODUCTION"
echo ""
echo "Before proceeding, ensure:"
echo "  ✅ Database backup created"
echo "  ✅ You know which migration to rollback"
echo "  ✅ Application is in maintenance mode"
echo "  ✅ All team members notified"
echo ""
read -p "Are you sure you want to rollback PRODUCTION migration? (type 'yes' to confirm): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Rollback cancelled."
    exit 0
fi

# Navigate to database package
cd packages/database

# Check if Prisma schema exists
if [ ! -f "prisma/schema.prisma" ]; then
    fail "Prisma schema not found"
    exit 1
fi

# Get migration history
log "Checking migration history..."
MIGRATIONS=$(npx prisma migrate status --schema=./prisma/schema.prisma 2>&1 || echo "")

# Note: Prisma doesn't have a direct rollback command
# We need to manually revert the migration
log "Prisma doesn't support automatic rollback."
log "You need to manually revert the migration SQL."
echo ""
echo "To rollback:"
echo "  1. Identify the migration to rollback"
echo "  2. Create a new migration that reverses the changes"
echo "  3. Or restore from backup"
echo ""
echo "Migration status:"
echo "$MIGRATIONS"
echo ""
read -p "Do you want to restore from backup instead? (type 'yes'): " RESTORE

if [ "$RESTORE" = "yes" ]; then
    # Find latest backup
    LATEST_BACKUP=$(ls -t ../../backups/db_backup_*.sql* 2>/dev/null | head -n1)
    
    if [ -z "$LATEST_BACKUP" ]; then
        fail "No backup found in backups/ directory"
        echo ""
        echo "Create a backup first:"
        echo "  ./scripts/backup-database.sh"
        exit 1
    fi
    
    warn "Restoring from backup: $LATEST_BACKUP"
    warn "⚠️  This will REPLACE all data in the database!"
    read -p "Type 'restore' to confirm: " RESTORE_CONFIRM
    
    if [ "$RESTORE_CONFIRM" = "restore" ]; then
        log "Using restore script: ../../scripts/restore-database.sh"
        if [ -f "../../scripts/restore-database.sh" ]; then
            cd ../..
            bash scripts/restore-database.sh "$LATEST_BACKUP"
        elif command -v psql &> /dev/null; then
            log "Restoring database from backup..."
            if [[ "$LATEST_BACKUP" == *.gz ]]; then
                if gunzip -c "$LATEST_BACKUP" | psql "$DATABASE_URL"; then
                    success "Database restored from backup"
                else
                    fail "Database restore failed"
                    exit 1
                fi
            else
                if psql "$DATABASE_URL" < "$LATEST_BACKUP"; then
                    success "Database restored from backup"
                else
                    fail "Database restore failed"
                    exit 1
                fi
            fi
        else
            fail "psql not found. Cannot restore from backup."
            exit 1
        fi
    else
        echo "Restore cancelled."
        exit 0
    fi
else
    warn "Manual rollback required. See Prisma documentation for details."
    echo ""
    echo "To create a rollback migration:"
    echo "  1. Review the migration file to rollback"
    echo "  2. Create a new migration that reverses changes"
    echo "  3. Run: npx prisma migrate dev --name=rollback_<migration_name>"
    exit 0
fi
