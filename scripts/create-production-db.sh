#!/bin/bash
# scripts/create-production-db.sh
# Create production database

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

DB_NAME=${DB_NAME:-"kealee_production"}
DB_USER=${DB_USER:-"kealee"}
DB_PASSWORD=${DB_PASSWORD:-""}  # Must be provided
DB_HOST=${DB_HOST:-""}  # Must be provided
DB_PORT=${DB_PORT:-"5432"}

log() {
    echo -e "${BLUE}[PROD DB]${NC} $1"
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

echo "🚨 Creating Production Database"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
warn "⚠️  WARNING: This will create a PRODUCTION database"
echo ""
echo "Before proceeding, ensure:"
echo "  ✅ Production database credentials are secure"
echo "  ✅ Database server is accessible"
echo "  ✅ Backup strategy is in place"
echo "  ✅ All team members are notified"
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    # Require DB_HOST and DB_PASSWORD for production
    if [ -z "$DB_HOST" ]; then
        fail "DB_HOST is required for production database"
        echo "   Set it: export DB_HOST='your-production-db-host'"
        echo "   Or set DATABASE_URL directly: export DATABASE_URL='postgresql://...'"
        exit 1
    fi
    
    if [ -z "$DB_PASSWORD" ]; then
        fail "DB_PASSWORD is required for production database"
        echo "   Set it: export DB_PASSWORD='your-secure-password'"
        echo "   Or set DATABASE_URL directly: export DATABASE_URL='postgresql://...'"
        exit 1
    fi
    
    DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
    log "Using DATABASE_URL: postgresql://${DB_USER}:***@${DB_HOST}:${DB_PORT}/${DB_NAME}"
else
    log "Using existing DATABASE_URL"
    # Extract components from DATABASE_URL
    DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
    DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\).*/\1/p')
fi

read -p "Are you sure you want to create PRODUCTION database? (type 'yes' to confirm): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Database creation cancelled."
    exit 0
fi

# Check if psql is available
if ! command -v psql &> /dev/null; then
    fail "psql not found"
    echo "   Install PostgreSQL client tools:"
    echo "   macOS: brew install postgresql"
    echo "   Ubuntu: apt-get install postgresql-client"
    exit 1
fi

# Test connection to PostgreSQL server
log "Testing PostgreSQL connection..."
POSTGRES_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/postgres"
if psql "$POSTGRES_URL" -c "SELECT 1;" > /dev/null 2>&1; then
    success "PostgreSQL connection successful"
else
    fail "Cannot connect to PostgreSQL server"
    echo ""
    echo "Connection details:"
    echo "  Host: $DB_HOST"
    echo "  Port: $DB_PORT"
    echo "  User: $DB_USER"
    echo ""
    echo "Verify:"
    echo "  - Database server is accessible"
    echo "  - Network/firewall allows connection"
    echo "  - Credentials are correct"
    exit 1
fi

# Check if database exists
log "Checking if database exists..."
DB_EXISTS=$(psql "$POSTGRES_URL" -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" 2>/dev/null || echo "")

if [ "$DB_EXISTS" = "1" ]; then
    warn "Database '$DB_NAME' already exists"
    echo ""
    echo "Options:"
    echo "  1. Keep existing database (recommended)"
    echo "  2. Drop and recreate (DANGEROUS - will lose all data)"
    echo ""
    read -p "Choose option (1 or 2): " OPTION
    
    if [ "$OPTION" = "2" ]; then
        warn "⚠️  DANGER: This will DELETE ALL DATA in the production database!"
        read -p "Type 'DELETE PRODUCTION DATA' to confirm: " DELETE_CONFIRM
        
        if [ "$DELETE_CONFIRM" = "DELETE PRODUCTION DATA" ]; then
            log "Dropping existing database..."
            # Terminate existing connections
            psql "$POSTGRES_URL" -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DB_NAME' AND pid <> pg_backend_pid();" > /dev/null 2>&1 || true
            psql "$POSTGRES_URL" -c "DROP DATABASE IF EXISTS \"$DB_NAME\";" > /dev/null 2>&1
            success "Database dropped"
        else
            log "Database drop cancelled"
            exit 0
        fi
    else
        log "Keeping existing database"
        success "Production database ready"
        echo ""
        echo "📋 Next steps:"
        echo "   npm run db:migrate:prod"
        exit 0
    fi
fi

# Create database
log "Creating production database '$DB_NAME'..."
if psql "$POSTGRES_URL" -c "CREATE DATABASE \"$DB_NAME\";" > /dev/null 2>&1; then
    success "Database created successfully"
else
    fail "Failed to create database"
    exit 1
fi

# Verify database creation
log "Verifying database..."
if psql "$DATABASE_URL" -c "SELECT current_database();" > /dev/null 2>&1; then
    success "Database verification successful"
else
    fail "Database verification failed"
    exit 1
fi

echo ""
success "Production database setup complete!"
echo ""
echo "📋 Next Steps:"
echo "   1. Run migrations: npm run db:migrate:prod"
echo "   2. Create backup: ./scripts/backup-database.sh"
echo "   3. Verify database connectivity"
echo ""
echo "⚠️  IMPORTANT:"
echo "   - Store DATABASE_URL securely"
echo "   - Set up automated backups"
echo "   - Monitor database performance"
echo "   - Document connection details (securely)"
