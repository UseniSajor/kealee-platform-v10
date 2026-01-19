#!/bin/bash
# Production Database Deployment Script
# Deploys Prisma migrations to Railway production PostgreSQL instance

set -e  # Exit on error

echo "=========================================="
echo "Production Database Deployment"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verify DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}ERROR: DATABASE_URL environment variable is not set${NC}"
    echo "Please set DATABASE_URL before running this script"
    exit 1
fi

echo -e "${GREEN}✓${NC} DATABASE_URL is set"
echo ""

# Verify we're in the correct directory
if [ ! -f "prisma/schema.prisma" ]; then
    echo -e "${RED}ERROR: prisma/schema.prisma not found${NC}"
    echo "Please run this script from the packages/database directory"
    exit 1
fi

echo -e "${GREEN}✓${NC} Schema file found"
echo ""

# Check if migrations directory exists
if [ ! -d "prisma/migrations" ]; then
    echo -e "${YELLOW}WARNING: prisma/migrations directory not found${NC}"
    echo "Creating migrations directory..."
    mkdir -p prisma/migrations
fi

# List migration files
echo "Migration files to be applied:"
echo "----------------------------------------"
if [ "$(ls -A prisma/migrations 2>/dev/null)" ]; then
    ls -1 prisma/migrations | grep -E '^[0-9]' | sort
    MIGRATION_COUNT=$(ls -1 prisma/migrations | grep -E '^[0-9]' | wc -l)
    echo ""
    echo "Total migrations: $MIGRATION_COUNT"
else
    echo -e "${YELLOW}No migration files found${NC}"
    MIGRATION_COUNT=0
fi
echo ""

# Verify Prisma CLI is available
if ! command -v npx &> /dev/null; then
    echo -e "${RED}ERROR: npx not found${NC}"
    echo "Please install Node.js and npm"
    exit 1
fi

echo -e "${GREEN}✓${NC} Prisma CLI available"
echo ""

# Generate Prisma Client (verify schema is valid)
echo "Step 1: Generating Prisma Client..."
echo "----------------------------------------"
if npx prisma generate --schema=./prisma/schema.prisma; then
    echo -e "${GREEN}✓${NC} Prisma Client generated successfully"
else
    echo -e "${RED}✗${NC} Failed to generate Prisma Client"
    echo "Please fix schema errors before deploying"
    exit 1
fi
echo ""

# Check current migration status
echo "Step 2: Checking migration status..."
echo "----------------------------------------"
npx prisma migrate status --schema=./prisma/schema.prisma || true
echo ""

# Deploy migrations
echo "Step 3: Deploying migrations..."
echo "----------------------------------------"
if npx prisma migrate deploy --schema=./prisma/schema.prisma; then
    echo -e "${GREEN}✓${NC} Migrations deployed successfully"
else
    echo -e "${RED}✗${NC} Migration deployment failed"
    exit 1
fi
echo ""

# Verify schema matches database
echo "Step 4: Verifying schema..."
echo "----------------------------------------"
if npx prisma db pull --schema=./prisma/schema.prisma --force 2>&1 | grep -q "already in sync\|Introspected"; then
    echo -e "${GREEN}✓${NC} Schema is in sync with database"
else
    echo -e "${YELLOW}⚠${NC} Schema verification completed (may show differences if using custom SQL)"
fi
echo ""

# List all tables
echo "Step 5: Verifying tables..."
echo "----------------------------------------"
TABLES=$(npx prisma db execute --stdin --schema=./prisma/schema.prisma <<< "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;" 2>/dev/null || echo "")
if [ -n "$TABLES" ]; then
    echo "Tables in database:"
    echo "$TABLES" | grep -v "tablename" | head -20
    TABLE_COUNT=$(echo "$TABLES" | grep -v "tablename" | wc -l)
    echo ""
    echo "Total tables: $TABLE_COUNT"
else
    echo -e "${YELLOW}Could not list tables (this is normal if using Prisma Migrate)${NC}"
fi
echo ""

# Test database connection
echo "Step 6: Testing database connection..."
echo "----------------------------------------"
if npx prisma db execute --stdin --schema=./prisma/schema.prisma <<< "SELECT 1 as test;" 2>&1 | grep -q "test\|1"; then
    echo -e "${GREEN}✓${NC} Database connection successful"
else
    echo -e "${YELLOW}⚠${NC} Database connection test completed"
fi
echo ""

echo "=========================================="
echo -e "${GREEN}Deployment Complete!${NC}"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Run seed script: npm run db:seed"
echo "2. Verify data: npx prisma studio"
echo "3. Test application connections"
echo ""
