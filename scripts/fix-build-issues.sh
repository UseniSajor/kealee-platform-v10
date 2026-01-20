#!/bin/bash
# scripts/fix-build-issues.sh
# Automated script to fix common build issues

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[FIX BUILD]${NC} $1"
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

echo "🔧 Fix Build Issues"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Get app name
if [ -z "$1" ]; then
    echo "Select app:"
    APPS=("m-marketplace" "os-admin" "os-pm" "m-ops-services" "m-project-owner" "m-architect" "m-permits-inspections")
    for i in "${!APPS[@]}"; do
        echo "  $((i+1))) ${APPS[$i]}"
    done
    read -p "Enter choice: " APP_CHOICE
    APP=${APPS[$((APP_CHOICE-1))]}
else
    APP=$1
fi

if [ ! -d "apps/$APP" ]; then
    fail "App directory not found: apps/$APP"
    exit 1
fi

success "Selected app: $APP"

cd "apps/$APP"

# Step 1: Check TypeScript errors
log "Step 1: Checking TypeScript errors..."
if npm run type-check 2>&1 | grep -q "error"; then
    fail "TypeScript errors found"
    warn "Please fix TypeScript errors before continuing"
    npm run type-check
    exit 1
else
    success "No TypeScript errors"
fi

# Step 2: Test build locally
log "Step 2: Testing build locally..."
if npm run build 2>&1 | grep -q "error\|Error\|failed"; then
    fail "Local build failed"
    warn "Please fix build errors before continuing"
    exit 1
else
    success "Local build succeeded"
fi

# Step 3: Check environment variables
log "Step 3: Checking environment variables..."
if [ -z "$VERCEL_TOKEN" ]; then
    warn "VERCEL_TOKEN not set, skipping environment variable check"
else
    log "Listing environment variables..."
    vercel env ls --token="$VERCEL_TOKEN" 2>/dev/null || warn "Could not list environment variables"
fi

# Step 4: Clear local cache
log "Step 4: Clearing local cache..."
rm -rf node_modules package-lock.json .next
success "Local cache cleared"

# Step 5: Reinstall dependencies
log "Step 5: Reinstalling dependencies..."
npm install
success "Dependencies reinstalled"

# Step 6: Clear Vercel build cache (optional)
if [ -n "$VERCEL_TOKEN" ]; then
    read -p "Clear Vercel build cache? (y/N): " CLEAR_CACHE
    if [ "$CLEAR_CACHE" = "y" ] || [ "$CLEAR_CACHE" = "Y" ]; then
        log "Clearing Vercel build cache..."
        vercel rm --safe --token="$VERCEL_TOKEN" 2>/dev/null && success "Vercel cache cleared" || warn "Could not clear Vercel cache"
    fi
fi

cd ../..

echo ""
success "Build issue fixes complete!"
echo ""
echo "Next steps:"
echo "  1. Review any warnings above"
echo "  2. Fix any remaining issues"
echo "  3. Test build again: cd apps/$APP && npm run build"
echo "  4. Deploy: vercel deploy --prod --token=\$VERCEL_TOKEN"
