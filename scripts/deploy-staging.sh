#!/bin/bash
# scripts/deploy-staging.sh
# Deploy all applications to Vercel staging

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Counters
DEPLOYED=0
FAILED=0
SKIPPED=0

log() {
    echo -e "${BLUE}[DEPLOY]${NC} $1"
}

success() {
    echo -e "${GREEN}✅${NC} $1"
    DEPLOYED=$((DEPLOYED + 1))
}

fail() {
    echo -e "${RED}❌${NC} $1"
    FAILED=$((FAILED + 1))
}

warn() {
    echo -e "${YELLOW}⚠️${NC} $1"
    SKIPPED=$((SKIPPED + 1))
}

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    fail "Vercel CLI not installed"
    echo "   Install with: npm install -g vercel@latest"
    exit 1
fi

# Check if logged in to Vercel
if ! vercel whoami &> /dev/null; then
    fail "Not logged in to Vercel"
    echo "   Login with: vercel login"
    exit 1
fi

echo "🚀 Deploying All Applications to Staging"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Applications to deploy
APPS=(
    "apps/m-marketplace"
    "apps/os-admin"
    "apps/os-pm"
    "apps/m-ops-services"
    "apps/m-project-owner"
    "apps/m-architect"
    "apps/m-permits-inspections"
)

# Deploy each application
for app in "${APPS[@]}"; do
    if [ ! -d "$app" ]; then
        warn "Directory not found: $app"
        continue
    fi
    
    APP_NAME=$(basename "$app")
    log "Deploying $APP_NAME..."
    
    cd "$app"
    
    # Check if package.json exists
    if [ ! -f "package.json" ]; then
        warn "$APP_NAME: package.json not found"
        cd ../..
        continue
    fi
    
    # Check if vercel.json exists
    if [ ! -f "vercel.json" ]; then
        warn "$APP_NAME: vercel.json not found"
        cd ../..
        continue
    fi
    
    # Build the app first
    log "  Building $APP_NAME..."
    if pnpm build 2>&1 | grep -q "error\|Error\|failed"; then
        fail "$APP_NAME: Build failed"
        cd ../..
        continue
    fi
    
    # Deploy to staging
    log "  Deploying $APP_NAME to staging..."
    if vercel --yes --prod=false 2>&1 | tee /tmp/vercel-deploy.log; then
        DEPLOYMENT_URL=$(grep -o 'https://[^ ]*\.vercel\.app' /tmp/vercel-deploy.log | tail -n1 || echo "")
        if [ -n "$DEPLOYMENT_URL" ]; then
            success "$APP_NAME deployed to: $DEPLOYMENT_URL"
        else
            success "$APP_NAME deployed (URL not captured)"
        fi
    else
        fail "$APP_NAME: Deployment failed"
    fi
    
    cd ../..
    echo ""
done

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Deployment Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Deployed:${NC} $DEPLOYED"
echo -e "${RED}❌ Failed:${NC} $FAILED"
echo -e "${YELLOW}⏭️  Skipped:${NC} $SKIPPED"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All applications deployed successfully!${NC}"
    echo ""
    echo "🔗 View deployments:"
    echo "   https://vercel.com/dashboard"
    exit 0
else
    echo -e "${RED}❌ Some deployments failed. Review errors above.${NC}"
    exit 1
fi
