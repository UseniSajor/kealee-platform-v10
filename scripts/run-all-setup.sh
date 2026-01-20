#!/bin/bash

# Run All Setup Scripts
# Executes all setup scripts in the correct order

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
    exit 1
}

warn() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

log "Starting complete platform setup..."
echo ""

# Check prerequisites
log "Checking prerequisites..."

if ! command -v node &> /dev/null; then
    error "Node.js is not installed"
fi

if ! command -v npm &> /dev/null; then
    error "npm is not installed"
fi

if ! command -v psql &> /dev/null && [ -z "$DATABASE_URL" ]; then
    warn "PostgreSQL client not found. Database setup may fail."
fi

log "Prerequisites check complete"
echo ""

# Step 1: Database Setup
log "Step 1: Setting up database..."
if [ -f "packages/database/sql/00_run_all.sql" ]; then
    if [ -n "$DATABASE_URL" ]; then
        log "Running database setup scripts..."
        cd packages/database/sql
        psql "$DATABASE_URL" -f 00_run_all.sql || warn "Database setup failed or already completed"
        cd ../../..
    else
        warn "DATABASE_URL not set. Skipping database setup."
    fi
else
    warn "Database SQL scripts not found. Skipping database setup."
fi
echo ""

# Step 2: S3/R2 Storage Setup
log "Step 2: Setting up S3/R2 storage..."
if [ -f "scripts/setup-s3-r2-storage.sh" ]; then
    STORAGE_PROVIDER=${STORAGE_PROVIDER:-r2}
    BUCKET_NAME=${BUCKET_NAME:-kealee-uploads}
    
    if [ "$STORAGE_PROVIDER" = "r2" ] && [ -n "$R2_ACCOUNT_ID" ]; then
        log "Setting up Cloudflare R2..."
        bash scripts/setup-s3-r2-storage.sh r2 "$BUCKET_NAME" || warn "R2 setup failed"
    elif [ "$STORAGE_PROVIDER" = "s3" ] && [ -n "$AWS_ACCESS_KEY_ID" ]; then
        log "Setting up AWS S3..."
        bash scripts/setup-s3-r2-storage.sh s3 "$BUCKET_NAME" || warn "S3 setup failed"
    else
        warn "Storage credentials not set. Skipping storage setup."
    fi
else
    warn "Storage setup script not found."
fi
echo ""

# Step 3: Vercel Projects Setup
log "Step 3: Setting up Vercel projects..."
if [ -f "scripts/setup-vercel-projects.sh" ]; then
    if command -v vercel &> /dev/null; then
        log "Setting up Vercel projects..."
        bash scripts/setup-vercel-projects.sh || warn "Vercel setup failed"
    else
        warn "Vercel CLI not installed. Skipping Vercel setup."
    fi
else
    warn "Vercel setup script not found."
fi
echo ""

# Step 4: Environment Variables Setup
log "Step 4: Setting up environment variables..."
if [ -f "scripts/setup-vercel-env-vars.sh" ] && [ -f ".env.production" ]; then
    if command -v vercel &> /dev/null; then
        log "Setting up environment variables..."
        bash scripts/setup-vercel-env-vars.sh .env.production || warn "Environment variables setup failed"
    else
        warn "Vercel CLI not installed. Skipping environment variables setup."
    fi
else
    warn "Environment variables file or script not found. Skipping."
fi
echo ""

# Step 5: Monitoring Setup
log "Step 5: Setting up monitoring..."
if [ -f "scripts/setup-monitoring.sh" ]; then
    log "Running monitoring setup..."
    bash scripts/setup-monitoring.sh || warn "Monitoring setup failed"
else
    warn "Monitoring setup script not found."
fi
echo ""

log "✅ Complete platform setup finished!"
log ""
log "Next steps:"
log "1. Run integration tests: npm run test:integration"
log "2. Test file uploads: npm run test:upload"
log "3. Test API connectivity: npm run test:api"
log "4. Test payment flows: npm run test:payment"
log "5. Deploy to staging: npm run deploy:staging"
