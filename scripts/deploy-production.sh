#!/bin/bash
# scripts/deploy-production.sh
# Deploy all applications to Vercel production (requires approval)

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

# Safety check: Require confirmation
echo "🚨 PRODUCTION DEPLOYMENT"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${RED}⚠️  WARNING: This will deploy to PRODUCTION${NC}"
echo ""
echo "Before proceeding, ensure:"
echo "  ✅ All tests pass"
echo "  ✅ Code review completed"
echo "  ✅ Pre-deployment checklist passed"
echo "  ✅ Database migrations applied"
echo "  ✅ Environment variables configured"
echo "  ✅ Backup created"
echo ""
read -p "Are you sure you want to deploy to PRODUCTION? (type 'yes' to confirm): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Deployment cancelled."
    exit 0
fi

# Run pre-deployment checklist
echo ""
echo "Running pre-deployment checklist..."
if [ -f "scripts/pre-deployment-checklist.sh" ]; then
    if ! ./scripts/pre-deployment-checklist.sh; then
        echo ""
        read -p "Pre-deployment checklist failed. Continue anyway? (type 'force' to continue): " FORCE
        if [ "$FORCE" != "force" ]; then
            echo "Deployment cancelled."
            exit 1
        fi
    fi
else
    warn "Pre-deployment checklist script not found"
fi

# Check current branch
CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "")
if [ -n "$CURRENT_BRANCH" ] && [ "$CURRENT_BRANCH" != "main" ] && [ "$CURRENT_BRANCH" != "master" ]; then
    warn "Not on main/master branch (current: $CURRENT_BRANCH)"
    read -p "Continue with production deployment? (type 'yes' to continue): " BRANCH_CONFIRM
    if [ "$BRANCH_CONFIRM" != "yes" ]; then
        echo "Deployment cancelled."
        exit 0
    fi
fi

echo ""
echo "🚀 Deploying All Applications to Production"
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
    log "Deploying $APP_NAME to PRODUCTION..."
    
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
    
    # Deploy to production
    log "  Deploying $APP_NAME to PRODUCTION..."
    if vercel --yes --prod 2>&1 | tee /tmp/vercel-deploy.log; then
        DEPLOYMENT_URL=$(grep -o 'https://[^ ]*\.vercel\.app\|https://[^ ]*\.kealee\.com' /tmp/vercel-deploy.log | tail -n1 || echo "")
        if [ -n "$DEPLOYMENT_URL" ]; then
            success "$APP_NAME deployed to PRODUCTION: $DEPLOYMENT_URL"
        else
            success "$APP_NAME deployed to PRODUCTION (URL not captured)"
        fi
    else
        fail "$APP_NAME: Production deployment failed"
    fi
    
    cd ../..
    echo ""
done

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Production Deployment Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Deployed:${NC} $DEPLOYED"
echo -e "${RED}❌ Failed:${NC} $FAILED"
echo -e "${YELLOW}⏭️  Skipped:${NC} $SKIPPED"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All applications deployed to PRODUCTION successfully!${NC}"
    echo ""
    echo "🔗 View deployments:"
    echo "   https://vercel.com/dashboard"
    echo ""
    echo "📋 Next Steps:"
    echo "   1. Monitor application health"
    echo "   2. Check error tracking (Sentry)"
    echo "   3. Verify critical user flows"
    echo "   4. Monitor performance metrics"
    exit 0
else
    echo -e "${RED}❌ Some deployments failed. Review errors above.${NC}"
    exit 1
fi
