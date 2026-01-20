#!/bin/bash
# scripts/backup-database.sh
# Create database backup

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
BACKUP_DIR=${BACKUP_DIR:-"backups"}
BACKUP_TYPE=${BACKUP_TYPE:-"full"}  # full, schema-only, data-only
COMPRESS=${COMPRESS:-"true"}

log() {
    echo -e "${BLUE}[BACKUP]${NC} $1"
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

# Check if pg_dump is available
if ! command -v pg_dump &> /dev/null; then
    fail "pg_dump not found"
    echo "   Install PostgreSQL client tools:"
    echo "   macOS: brew install postgresql"
    echo "   Ubuntu: apt-get install postgresql-client"
    exit 1
fi

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Extract database name from DATABASE_URL
DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
if [ -z "$DB_NAME" ]; then
    DB_NAME="database"
fi

# Generate backup filename
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/db_backup_${DB_NAME}_${TIMESTAMP}.sql"

if [ "$COMPRESS" = "true" ]; then
    BACKUP_FILE="${BACKUP_FILE}.gz"
fi

echo "💾 Creating Database Backup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   Database: $DB_NAME"
echo "   Type: $BACKUP_TYPE"
echo "   Output: $BACKUP_FILE"
echo ""

# Build pg_dump command
DUMP_CMD="pg_dump \"$DATABASE_URL\""

# Add options based on backup type
case $BACKUP_TYPE in
    schema-only)
        DUMP_CMD="$DUMP_CMD --schema-only"
        log "Creating schema-only backup..."
        ;;
    data-only)
        DUMP_CMD="$DUMP_CMD --data-only"
        log "Creating data-only backup..."
        ;;
    full)
        log "Creating full backup..."
        ;;
    *)
        warn "Unknown backup type: $BACKUP_TYPE (using full)"
        ;;
esac

# Add common options
DUMP_CMD="$DUMP_CMD --verbose --no-owner --no-acl"

# Execute backup
log "Starting backup..."
START_TIME=$(date +%s)

if [ "$COMPRESS" = "true" ]; then
    if eval "$DUMP_CMD" | gzip > "$BACKUP_FILE"; then
        success "Backup completed successfully"
    else
        fail "Backup failed"
        rm -f "$BACKUP_FILE"
        exit 1
    fi
else
    if eval "$DUMP_CMD" > "$BACKUP_FILE"; then
        success "Backup completed successfully"
    else
        fail "Backup failed"
        rm -f "$BACKUP_FILE"
        exit 1
    fi
fi

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

# Get backup size
if [ -f "$BACKUP_FILE" ]; then
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    success "Backup file: $BACKUP_FILE"
    success "Backup size: $BACKUP_SIZE"
    success "Duration: ${DURATION}s"
    
    # Verify backup file
    log "Verifying backup file..."
    if [ "$COMPRESS" = "true" ]; then
        if gzip -t "$BACKUP_FILE" 2>/dev/null; then
            success "Backup file is valid (compressed)"
        else
            fail "Backup file is corrupted"
            exit 1
        fi
    else
        if [ -s "$BACKUP_FILE" ]; then
            success "Backup file is valid"
        else
            fail "Backup file is empty or corrupted"
            exit 1
        fi
    fi
    
    # Create backup info file
    INFO_FILE="${BACKUP_FILE}.info"
    cat > "$INFO_FILE" << EOF
Backup Information
==================
Database: $DB_NAME
Type: $BACKUP_TYPE
Created: $(date)
Duration: ${DURATION}s
Size: $BACKUP_SIZE
File: $BACKUP_FILE
DATABASE_URL: $(echo $DATABASE_URL | sed 's/:[^:@]*@/:***@/g')
EOF
    
    success "Backup info saved: $INFO_FILE"
    
    echo ""
    echo "✅ Backup completed successfully!"
    echo ""
    echo "📄 Backup file: $BACKUP_FILE"
    echo "📋 Backup info: $INFO_FILE"
    echo ""
    echo "To restore:"
    echo "  ./scripts/restore-database.sh $BACKUP_FILE"
else
    fail "Backup file not created"
    exit 1
fi
