#!/bin/bash

# Marketplace Rollback Script
# Usage: ./scripts/rollback.sh [environment] [deployment-id]

set -e

ENVIRONMENT=${1:-production}
DEPLOYMENT_ID=${2}

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

if [ -z "$DEPLOYMENT_ID" ]; then
    # Find the most recent rollback point
    ROLLBACK_FILE=$(ls -t deployments/rollback_${ENVIRONMENT}_*.json 2>/dev/null | head -1)
    
    if [ -z "$ROLLBACK_FILE" ]; then
        error "No rollback point found for environment: $ENVIRONMENT"
    fi
    
    log "Found rollback point: $ROLLBACK_FILE"
    DEPLOYMENT_ID=$(cat "$ROLLBACK_FILE" | grep -o '"deployment_id": "[^"]*' | cut -d'"' -f4)
    
    if [ "$DEPLOYMENT_ID" = "N/A" ]; then
        error "Invalid deployment ID in rollback file"
    fi
fi

log "Rolling back to deployment: $DEPLOYMENT_ID"
log "Environment: $ENVIRONMENT"

# Check Vercel CLI
if ! command -v vercel &> /dev/null; then
    error "Vercel CLI not found. Install with: npm install -g vercel"
fi

# Rollback using Vercel
case $ENVIRONMENT in
    production)
        log "Rolling back production deployment..."
        vercel rollback $DEPLOYMENT_ID --prod --yes --token="$VERCEL_TOKEN"
        ;;
    staging)
        log "Rolling back staging deployment..."
        vercel rollback $DEPLOYMENT_ID --yes --token="$VERCEL_TOKEN"
        ;;
    *)
        error "Unknown environment: $ENVIRONMENT"
        ;;
esac

if [ $? -ne 0 ]; then
    error "Rollback failed"
fi

log "✅ Rollback completed successfully!"
