#!/bin/bash
# scripts/deploy-api.sh
# Deploy API to Railway (staging or production)

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[DEPLOY]${NC} $1"
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

# Parse environment argument
ENVIRONMENT="${1:-staging}"

if [ "$ENVIRONMENT" != "staging" ] && [ "$ENVIRONMENT" != "production" ]; then
    fail "Invalid environment: $ENVIRONMENT"
    echo "Usage: bash scripts/deploy-api.sh [staging|production]"
    exit 1
fi

log "Deploying API to Railway ($ENVIRONMENT)..."

cd services/api

# Check Railway CLI
if ! command -v railway &> /dev/null; then
    fail "Railway CLI not installed"
    echo "Install: npm i -g @railway/cli"
    exit 1
fi

# Check if logged in
if ! railway whoami &> /dev/null; then
    log "Please login to Railway:"
    railway login
fi

# Check if linked to project
if ! railway status &> /dev/null; then
    log "Linking to Railway project:"
    railway link
fi

# Verify environment isolation before production
if [ "$ENVIRONMENT" = "production" ]; then
    echo ""
    warn "⚠️  PRODUCTION DEPLOYMENT"
    echo ""
    log "Verifying environment isolation..."
    cd ../..
    if ! bash scripts/verify-railway-env-isolation.sh 2>/dev/null; then
        fail "Environment isolation verification failed!"
        echo ""
        echo "Do not deploy to production until environment isolation is fixed."
        echo "See RAILWAY_ENVIRONMENT_SETUP.md for instructions."
        exit 1
    fi
    cd services/api
    echo ""
fi

# Deploy
log "Deploying to $ENVIRONMENT environment..."
if railway up --detach --environment "$ENVIRONMENT"; then
    success "API deployed successfully to $ENVIRONMENT!"
    echo ""
    echo "Check status: railway status --environment $ENVIRONMENT"
    echo "View logs: railway logs --environment $ENVIRONMENT"
else
    fail "Deployment failed"
    exit 1
fi

cd ../..

