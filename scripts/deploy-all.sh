#!/bin/bash
# scripts/deploy-all.sh
# Master deployment script for all Kealee Platform applications

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[DEPLOY]${NC} $1"
}

success() {
    echo -e "${GREEN}✅${NC} $1"
}

warn() {
    echo -e "${YELLOW}⚠️${NC} $1"
}

error() {
    echo -e "${RED}❌${NC} $1"
}

echo "🚀 Kealee Platform - Complete Deployment"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check prerequisites
log "Checking prerequisites..."

if ! command -v git &> /dev/null; then
    error "Git is not installed"
    exit 1
fi

if ! command -v vercel &> /dev/null; then
    warn "Vercel CLI not found. Installing..."
    npm install -g vercel@latest
fi

if ! command -v railway &> /dev/null; then
    warn "Railway CLI not found. Install from: https://railway.app/cli"
fi

success "Prerequisites checked"

# Git status
log "Checking git status..."
if [ -n "$(git status --porcelain)" ]; then
    warn "Uncommitted changes detected"
    read -p "Commit changes before deploying? (y/N): " COMMIT_CHANGES
    if [ "$COMMIT_CHANGES" = "y" ] || [ "$COMMIT_CHANGES" = "Y" ]; then
        git add .
        read -p "Commit message: " COMMIT_MSG
        git commit -m "${COMMIT_MSG:-Deploy: Complete Kealee Platform v10}"
    fi
fi

# Select deployment target
echo ""
echo "Select deployment target:"
echo "1) Staging (Preview)"
echo "2) Production"
echo "3) Both"
read -p "Choice (1-3): " DEPLOY_TARGET

# Select apps
echo ""
echo "Select applications to deploy:"
echo "1) All apps"
echo "2) m-project-owner"
echo "3) m-permits-inspections"
echo "4) m-ops-services"
echo "5) m-architect"
echo "6) os-admin"
read -p "Choice (1-6): " APP_CHOICE

APPS=()
case $APP_CHOICE in
    1)
        APPS=("m-project-owner" "m-permits-inspections" "m-ops-services" "m-architect" "os-admin")
        ;;
    2) APPS=("m-project-owner") ;;
    3) APPS=("m-permits-inspections") ;;
    4) APPS=("m-ops-services") ;;
    5) APPS=("m-architect") ;;
    6) APPS=("os-admin") ;;
    *)
        error "Invalid choice"
        exit 1
        ;;
esac

# Pre-deployment checks
log "Running pre-deployment checklist..."
if [ -f "scripts/pre-deployment-checklist.sh" ]; then
    bash scripts/pre-deployment-checklist.sh || {
        error "Pre-deployment checks failed"
        exit 1
    }
fi

# Deploy to Vercel
if [ "$DEPLOY_TARGET" = "1" ] || [ "$DEPLOY_TARGET" = "3" ]; then
    log "Deploying to Vercel Staging..."
    for app in "${APPS[@]}"; do
        log "Deploying $app to staging..."
        cd "apps/$app"
        vercel deploy --prebuilt --prod --confirm --token="$VERCEL_TOKEN" || {
            error "Failed to deploy $app"
            cd ../..
            exit 1
        }
        cd ../..
        success "$app deployed to staging"
    done
fi

if [ "$DEPLOY_TARGET" = "2" ] || [ "$DEPLOY_TARGET" = "3" ]; then
    log "Deploying to Vercel Production..."
    read -p "⚠️  Deploy to PRODUCTION? Type 'yes' to confirm: " CONFIRM
    if [ "$CONFIRM" != "yes" ]; then
        warn "Production deployment cancelled"
        exit 0
    fi

    for app in "${APPS[@]}"; do
        log "Deploying $app to production..."
        cd "apps/$app"
        vercel deploy --prebuilt --prod --confirm --token="$VERCEL_TOKEN" || {
            error "Failed to deploy $app"
            cd ../..
            exit 1
        }
        cd ../..
        success "$app deployed to production"
    done
fi

# Deploy API to Railway
if [ -d "services/api" ]; then
    log "Deploying API to Railway..."
    cd services/api
    railway up --detach || {
        warn "Railway deployment failed or not configured"
    }
    cd ../..
fi

# Post-deployment verification
log "Running post-deployment verification..."
sleep 5

for app in "${APPS[@]}"; do
    # Get deployment URL from Vercel
    DEPLOYMENT_URL=$(vercel ls "$app" --token="$VERCEL_TOKEN" --json | jq -r '.[0].url' 2>/dev/null || echo "")
    if [ -n "$DEPLOYMENT_URL" ]; then
        log "Verifying $app at $DEPLOYMENT_URL..."
        if curl -f -s "https://$DEPLOYMENT_URL" > /dev/null; then
            success "$app is live at https://$DEPLOYMENT_URL"
        else
            warn "$app deployment may not be ready yet"
        fi
    fi
done

echo ""
success "Deployment complete!"
echo ""
echo "📊 Deployment Summary:"
echo "   - Apps deployed: ${#APPS[@]}"
echo "   - Target: $([ "$DEPLOY_TARGET" = "1" ] && echo "Staging" || [ "$DEPLOY_TARGET" = "2" ] && echo "Production" || echo "Both")"
echo ""
echo "📋 Next Steps:"
echo "   1. Verify deployments in Vercel dashboard"
echo "   2. Run smoke tests"
echo "   3. Check monitoring dashboards"
echo "   4. Review logs for errors"
echo ""
