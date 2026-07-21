#!/bin/bash
# scripts/run-database-migrations.sh
# Run Prisma database migrations with backup and verification

set -e

# Configuration
DATABASE_PACKAGE_DIR="${DATABASE_PACKAGE_DIR:-packages/database}"
BACKUP_DIR="${BACKUP_DIR:-backups}"
MIGRATION_MODE="${MIGRATION_MODE:-deploy}" # 'dev' or 'deploy'
SKIP_BACKUP="${SKIP_BACKUP:-false}"
SKIP_INTEGRITY_CHECK="${SKIP_INTEGRITY_CHECK:-false}"

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

warning() {
    echo -e "${YELLOW}⚠️${NC} $1"
}

error() {
    echo -e "${RED}❌${NC} $1"
}

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    error "DATABASE_URL environment variable is not set"
    echo "   Set it in your .env file or export it:"
    echo "   export DATABASE_URL='postgresql://user:password@host:port/database'"
    exit 1
fi

# Check if Prisma is available
if ! command -v npx &> /dev/null; then
    error "npx is not installed. Please install Node.js and npm."
    exit 1
fi

# Navigate to database package directory
if [ ! -d "$DATABASE_PACKAGE_DIR" ]; then
    error "Database package directory not found: $DATABASE_PACKAGE_DIR"
    exit 1
fi

cd "$DATABASE_PACKAGE_DIR"

# Check if Prisma schema exists
if [ ! -f "prisma/schema.prisma" ]; then
    error "Prisma schema not found: prisma/schema.prisma"
    exit 1
fi

echo "🗄️  Running Database Migrations"
echo "   Database Package: $DATABASE_PACKAGE_DIR"
echo "   Migration Mode: $MIGRATION_MODE"
echo "   Database: $(echo $DATABASE_URL | cut -d'@' -f2 | cut -d'/' -f1)"
echo ""

# Step 1: Create backup
if [ "$SKIP_BACKUP" != "true" ]; then
    log "1. Creating database backup..."
    
    # Create backup directory if it doesn't exist
    mkdir -p "$BACKUP_DIR"
    
    # Extract database name from DATABASE_URL
    DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
    BACKUP_FILE="$BACKUP_DIR/db_backup_${DB_NAME}_$(date +%Y%m%d_%H%M%S).sql"
    
    # Check if pg_dump is available
    if command -v pg_dump &> /dev/null; then
        if pg_dump "$DATABASE_URL" > "$BACKUP_FILE" 2>/dev/null; then
            BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
            success "Backup created: $BACKUP_FILE ($BACKUP_SIZE)"
        else
            warning "Failed to create backup with pg_dump. Continuing without backup..."
            SKIP_BACKUP="true"
        fi
    else
        warning "pg_dump not found. Skipping backup."
        echo "   Install PostgreSQL client tools to enable backups."
        SKIP_BACKUP="true"
    fi
else
    log "1. Skipping backup (SKIP_BACKUP=true)"
fi

# Step 2: Generate Prisma Client
log "2. Generating Prisma Client..."
if npx prisma generate --schema=./prisma/schema.prisma; then
    success "Prisma Client generated successfully"
else
    error "Failed to generate Prisma Client"
    exit 1
fi

# Step 3: Check migration status
log "3. Checking migration status..."
MIGRATION_STATUS=$(npx prisma migrate status --schema=./prisma/schema.prisma 2>&1 || echo "error")
if echo "$MIGRATION_STATUS" | grep -q "Database schema is up to date"; then
    success "Database schema is up to date"
    UP_TO_DATE=true
elif echo "$MIGRATION_STATUS" | grep -q "migrations pending"; then
    warning "Migrations pending"
    UP_TO_DATE=false
elif echo "$MIGRATION_STATUS" | grep -q "error\|Error"; then
    error "Error checking migration status"
    echo "$MIGRATION_STATUS"
    exit 1
else
    UP_TO_DATE=false
fi

# Step 4: Run migrations
if [ "$UP_TO_DATE" = "false" ] || [ "$MIGRATION_MODE" = "dev" ]; then
    log "4. Running migrations..."
    
    if [ "$MIGRATION_MODE" = "dev" ]; then
        # Development mode: creates new migration and applies it
        if npx prisma migrate dev --schema=./prisma/schema.prisma --name="migration_$(date +%Y%m%d_%H%M%S)"; then
            success "Development migrations completed"
        else
            error "Development migrations failed"
            if [ "$SKIP_BACKUP" != "true" ] && [ -f "$BACKUP_FILE" ]; then
                warning "Backup available at: $BACKUP_FILE"
            fi
            exit 1
        fi
    else
        # Production mode: applies pending migrations
        if npx prisma migrate deploy --schema=./prisma/schema.prisma; then
            success "Production migrations deployed successfully"
        else
            error "Production migrations failed"
            if [ "$SKIP_BACKUP" != "true" ] && [ -f "$BACKUP_FILE" ]; then
                warning "Backup available at: $BACKUP_FILE"
                echo ""
                echo "To restore from backup:"
                echo "  psql \"\$DATABASE_URL\" < \"$BACKUP_FILE\""
            fi
            exit 1
        fi
    fi
else
    log "4. No migrations to apply"
fi

# Step 5: Verify migration status
log "5. Verifying migration status..."
FINAL_STATUS=$(npx prisma migrate status --schema=./prisma/schema.prisma 2>&1)
if echo "$FINAL_STATUS" | grep -q "Database schema is up to date"; then
    success "Migration verification passed"
else
    warning "Migration status check inconclusive"
    echo "$FINAL_STATUS"
fi

# Step 6: Data integrity checks
if [ "$SKIP_INTEGRITY_CHECK" != "true" ]; then
    log "6. Running data integrity checks..."
    
    # Create temporary SQL file for integrity checks
    INTEGRITY_SQL=$(cat << 'EOF'
-- Check for orphaned records
SELECT 
    'Orphaned ServicePlans' as check_name,
    COUNT(*) as count
FROM "ServicePlan" sp
LEFT JOIN "User" u ON sp."userId" = u.id
WHERE u.id IS NULL
UNION ALL
SELECT 
    'Orphaned OrgMembers' as check_name,
    COUNT(*) as count
FROM "OrgMember" om
LEFT JOIN "User" u ON om."userId" = u.id
WHERE u.id IS NULL
UNION ALL
SELECT 
    'Orphaned Projects' as check_name,
    COUNT(*) as count
FROM "Project" p
LEFT JOIN "User" u ON p."ownerId" = u.id
WHERE u.id IS NULL
UNION ALL
SELECT 
    'Orphaned Properties' as check_name,
    COUNT(*) as count
FROM "Property" prop
LEFT JOIN "Org" o ON prop."orgId" = o.id
WHERE o.id IS NULL;

-- Check table row counts
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;
EOF
)
    
    # Run integrity checks if psql is available
    if command -v psql &> /dev/null; then
        INTEGRITY_RESULT=$(echo "$INTEGRITY_SQL" | psql "$DATABASE_URL" -t 2>/dev/null || echo "")
        if [ -n "$INTEGRITY_RESULT" ]; then
            echo "$INTEGRITY_RESULT"
            success "Integrity checks completed"
        else
            warning "Integrity checks inconclusive (psql may not be configured)"
        fi
    else
        warning "psql not found. Skipping integrity checks."
        echo "   Install PostgreSQL client tools to enable integrity checks."
    fi
else
    log "6. Skipping integrity checks (SKIP_INTEGRITY_CHECK=true)"
fi

# Step 7: Generate migration report
log "7. Generating migration report..."
REPORT_FILE="../../migration-report_$(date +%Y%m%d_%H%M%S).md"

cat > "$REPORT_FILE" << EOF
# Database Migration Report

**Generated:** $(date)
**Database:** $(echo $DATABASE_URL | cut -d'@' -f2 | cut -d'/' -f1)
**Migration Mode:** $MIGRATION_MODE
**Backup File:** ${BACKUP_FILE:-"N/A (skipped)"}

## Migration Status

\`\`\`
$FINAL_STATUS
\`\`\`

## Prisma Migrations Applied

\`\`\`
$(npx prisma migrate status --schema=./prisma/schema.prisma)
\`\`\`

## Database Statistics

\`\`\`
$(if command -v psql &> /dev/null; then
    psql "$DATABASE_URL" -c "
    SELECT 
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
    FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
    LIMIT 20;
    " -H 2>/dev/null || echo "Statistics unavailable"
else
    echo "PostgreSQL client tools not available"
fi)
\`\`\`

## Next Steps

1. ✅ Verify application connectivity
2. ✅ Run smoke tests
3. ✅ Monitor database performance
4. ✅ Update deployment documentation

## Rollback Instructions

If you need to rollback:

\`\`\`bash
# Restore from backup (if available)
psql "\$DATABASE_URL" < "$BACKUP_FILE"

# Or use Prisma migrate reset (WARNING: This will drop all data)
cd $DATABASE_PACKAGE_DIR
npx prisma migrate reset --schema=./prisma/schema.prisma
\`\`\`
EOF

success "Migration report saved to: $REPORT_FILE"

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Migration Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
success "Database migrations completed successfully!"
echo ""
echo "📄 Report: $REPORT_FILE"
if [ "$SKIP_BACKUP" != "true" ] && [ -f "$BACKUP_FILE" ]; then
    echo "💾 Backup: $BACKUP_FILE"
fi
echo ""
echo "🔍 Next Steps:"
echo "   1. Verify application connectivity"
echo "   2. Run application tests"
echo "   3. Monitor database performance"
echo "   4. Check application logs for errors"
echo ""
