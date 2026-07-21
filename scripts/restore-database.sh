#!/bin/bash
# scripts/restore-database.sh
# Restore database from backup

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[RESTORE]${NC} $1"
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
    echo "Usage: $0 <backup-file>"
    echo ""
    echo "Examples:"
    echo "  $0 backups/db_backup_database_20260115_120000.sql"
    echo "  $0 backups/db_backup_database_20260115_120000.sql.gz"
    echo ""
    echo "Available backups:"
    if [ -d "backups" ]; then
        ls -t backups/*.sql* 2>/dev/null | head -5 || echo "  (no backups found)"
    else
        echo "  (backups directory not found)"
    fi
    exit 1
fi

BACKUP_FILE="$1"

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    fail "Backup file not found: $BACKUP_FILE"
    exit 1
fi

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    fail "DATABASE_URL environment variable is not set"
    echo "   Set it in your .env file or export it:"
    echo "   export DATABASE_URL='postgresql://user:password@host:port/database'"
    exit 1
fi

# Check if psql is available
if ! command -v psql &> /dev/null; then
    fail "psql not found"
    echo "   Install PostgreSQL client tools:"
    echo "   macOS: brew install postgresql"
    echo "   Ubuntu: apt-get install postgresql-client"
    exit 1
fi

# Safety check
echo "🚨 DATABASE RESTORE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
warn "⚠️  WARNING: This will REPLACE all data in the database!"
echo ""
echo "Backup file: $BACKUP_FILE"
BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "Backup size: $BACKUP_SIZE"
echo ""
echo "Before proceeding, ensure:"
echo "  ✅ This is the correct backup file"
echo "  ✅ Database is in maintenance mode"
echo "  ✅ All applications are stopped"
echo "  ✅ You have a current backup (if needed)"
echo ""
read -p "Are you sure you want to restore from this backup? (type 'restore' to confirm): " CONFIRM

if [ "$CONFIRM" != "restore" ]; then
    echo "Restore cancelled."
    exit 0
fi

# Extract database name
DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
if [ -z "$DB_NAME" ]; then
    DB_NAME="database"
fi

log "Restoring database: $DB_NAME"
log "Backup file: $BACKUP_FILE"
echo ""

# Check if backup is compressed
if [[ "$BACKUP_FILE" == *.gz ]]; then
    log "Decompressing backup..."
    DECOMPRESSED_FILE="/tmp/restore_$(basename "$BACKUP_FILE" .gz)"
    gunzip -c "$BACKUP_FILE" > "$DECOMPRESSED_FILE"
    RESTORE_FILE="$DECOMPRESSED_FILE"
else
    RESTORE_FILE="$BACKUP_FILE"
fi

# Test database connection
log "Testing database connection..."
if ! psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1; then
    fail "Cannot connect to database"
    if [[ "$BACKUP_FILE" == *.gz ]]; then
        rm -f "$DECOMPRESSED_FILE"
    fi
    exit 1
fi
success "Database connection verified"

# Restore database
log "Starting restore..."
START_TIME=$(date +%s)

if psql "$DATABASE_URL" < "$RESTORE_FILE" 2>&1 | tee /tmp/restore.log; then
    success "Restore completed successfully"
else
    fail "Restore failed"
    echo ""
    echo "Last 20 lines of restore log:"
    tail -20 /tmp/restore.log
    if [[ "$BACKUP_FILE" == *.gz ]]; then
        rm -f "$DECOMPRESSED_FILE"
    fi
    exit 1
fi

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

# Cleanup
if [[ "$BACKUP_FILE" == *.gz ]]; then
    rm -f "$DECOMPRESSED_FILE"
fi

# Verify restore
log "Verifying restore..."
if psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" > /dev/null 2>&1; then
    TABLE_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | xargs)
    success "Restore verified: $TABLE_COUNT tables found"
else
    warn "Could not verify restore (may be normal)"
fi

echo ""
echo "✅ Database restore completed!"
echo "   Duration: ${DURATION}s"
echo ""
echo "📋 Next Steps:"
echo "   1. Verify data integrity"
echo "   2. Run migrations if needed"
echo "   3. Restart applications"
echo "   4. Run smoke tests"
echo ""
