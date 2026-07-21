#!/bin/bash
# deploy-os-admin-staging.sh
# Deploy os-admin app to Vercel staging environment

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

APP_NAME="os-admin"
APP_DIR="apps/os-admin"
VERCEL_ORG=${VERCEL_ORG:-kealee}

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

info() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] INFO:${NC} $1"
}

# Step 1: Run linting
log "Step 1: Running linting..."
cd "$APP_DIR"
if pnpm lint; then
    log "✅ Linting passed"
else
    warn "⚠️  Linting found issues (continuing anyway)"
fi
cd ../..

# Step 2: Build application
log "Step 2: Building $APP_NAME..."
cd "$APP_DIR"
if pnpm build; then
    log "✅ Build successful"
else
    error "❌ Build failed"
fi
cd ../..

# Step 3: Check Vercel CLI
if ! command -v vercel &> /dev/null; then
    error "Vercel CLI not found. Install with: npm install -g vercel"
fi

# Check if logged in
if ! vercel whoami &> /dev/null; then
    log "Please login to Vercel..."
    vercel login
fi

# Step 4: Deploy to Vercel staging
log "Step 4: Deploying $APP_NAME to Vercel staging..."
cd "$APP_DIR"

DEPLOYMENT_URL=""
if vercel --scope="$VERCEL_ORG" --yes; then
    # Get deployment URL from vercel output
    DEPLOYMENT_URL=$(vercel ls --scope="$VERCEL_ORG" | grep "$APP_NAME" | head -1 | awk '{print $2}' || echo "")
    log "✅ Deployed $APP_NAME to staging"
    if [ -n "$DEPLOYMENT_URL" ]; then
        log "   Deployment URL: $DEPLOYMENT_URL"
    fi
else
    error "❌ Deployment failed"
fi

cd ../..

# Step 5: Verify deployment
log "Step 5: Verifying deployment..."
if [ -n "$DEPLOYMENT_URL" ]; then
    info "Checking deployment health..."
    sleep 5  # Wait for deployment to be ready
    
    if curl -s -o /dev/null -w "%{http_code}" "$DEPLOYMENT_URL" | grep -q "200\|301\|302"; then
        log "✅ Deployment is live and responding"
    else
        warn "⚠️  Deployment may not be ready yet. Check Vercel Dashboard."
    fi
else
    warn "⚠️  Could not determine deployment URL. Check Vercel Dashboard."
fi

# Summary
log ""
log "✅ Deployment process complete!"
log ""
log "Next steps:"
log "1. Visit Vercel Dashboard: https://vercel.com/$VERCEL_ORG/$APP_NAME"
log "2. Test authentication flow"
log "3. Test user management features"
log "4. Check application logs for errors"
log "5. Verify environment variables are set correctly"
log ""
