#!/bin/bash
# scripts/create-staging-db.sh
# Create staging database

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

DB_NAME=${DB_NAME:-"kealee_staging"}
DB_USER=${DB_USER:-"kealee"}
DB_PASSWORD=${DB_PASSWORD:-"kealee_staging"}
DB_HOST=${DB_HOST:-"localhost"}
DB_PORT=${DB_PORT:-"5433"}  # Default to docker-compose port

log() {
    echo -e "${BLUE}[STAGING DB]${NC} $1"
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

echo "🗄️  Creating Staging Database"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   Database: $DB_NAME"
echo "   Host: $DB_HOST"
echo "   Port: $DB_PORT"
echo ""

# Check if psql is available
if ! command -v psql &> /dev/null; then
    fail "psql not found"
    echo "   Install PostgreSQL client tools:"
    echo "   macOS: brew install postgresql"
    echo "   Ubuntu: apt-get install postgresql-client"
    exit 1
fi

# Check if DATABASE_URL is set, otherwise construct it
if [ -z "$DATABASE_URL" ]; then
    DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
    log "Using DATABASE_URL: postgresql://${DB_USER}:***@${DB_HOST}:${DB_PORT}/${DB_NAME}"
else
    log "Using existing DATABASE_URL"
    # Extract DB_NAME from DATABASE_URL if provided
    DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
fi

# Test connection to PostgreSQL server
log "Testing PostgreSQL connection..."
POSTGRES_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/postgres"
if psql "$POSTGRES_URL" -c "SELECT 1;" > /dev/null 2>&1; then
    success "PostgreSQL connection successful"
else
    fail "Cannot connect to PostgreSQL server"
    echo ""
    echo "Make sure PostgreSQL is running:"
    echo "  - Docker: docker-compose up -d postgres"
    echo "  - Local: Check if PostgreSQL service is running"
    echo ""
    echo "Connection details:"
    echo "  Host: $DB_HOST"
    echo "  Port: $DB_PORT"
    echo "  User: $DB_USER"
    echo ""
    echo "Or set DATABASE_URL environment variable:"
    echo "  export DATABASE_URL='postgresql://user:password@host:port/database'"
    exit 1
fi

# Check if database exists
log "Checking if database exists..."
DB_EXISTS=$(psql "$POSTGRES_URL" -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" 2>/dev/null || echo "")

if [ "$DB_EXISTS" = "1" ]; then
    warn "Database '$DB_NAME' already exists"
    read -p "Do you want to drop and recreate it? (type 'yes' to confirm): " RECREATE
    
    if [ "$RECREATE" = "yes" ]; then
        log "Dropping existing database..."
        # Terminate existing connections
        psql "$POSTGRES_URL" -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DB_NAME' AND pid <> pg_backend_pid();" > /dev/null 2>&1 || true
        psql "$POSTGRES_URL" -c "DROP DATABASE IF EXISTS \"$DB_NAME\";" > /dev/null 2>&1
        success "Database dropped"
    else
        log "Keeping existing database"
        success "Staging database ready"
        echo ""
        echo "📋 Next steps:"
        echo "   npm run db:migrate:staging"
        echo "   npm run db:seed (optional)"
        exit 0
    fi
fi

# Create database
log "Creating database '$DB_NAME'..."
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
success "Staging database setup complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Run migrations: npm run db:migrate:staging"
echo "   2. Seed database (optional): npm run db:seed"
echo ""
echo "💡 Tip: Export DATABASE_URL for convenience:"
echo "   export DATABASE_URL=\"$DATABASE_URL\""
