#!/bin/bash
# scripts/link-vercel-projects.sh
# Link all Vercel projects to local directories

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[VERCEL]${NC} $1"
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

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    fail "Vercel CLI not found"
    echo "   Install with: npm install -g vercel@latest"
    exit 1
fi

# Check if logged in
log "Checking Vercel login status..."
if ! vercel whoami &> /dev/null; then
    warn "Not logged in to Vercel"
    log "Logging in to Vercel..."
    if vercel login; then
        success "Logged in to Vercel"
    else
        fail "Failed to login to Vercel"
        exit 1
    fi
else
    USER=$(vercel whoami)
    success "Already logged in as: $USER"
fi

echo ""
echo "🔗 Linking Vercel Projects"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Apps to link
APPS=(
    "m-marketplace"
    "os-admin"
    "os-pm"
    "m-ops-services"
    "m-project-owner"
    "m-architect"
    "m-permits-inspections"
)

SUCCESS_COUNT=0
FAIL_COUNT=0
SKIP_COUNT=0

# Link each app
for APP in "${APPS[@]}"; do
    APP_DIR="apps/$APP"
    
    if [ ! -d "$APP_DIR" ]; then
        warn "Directory not found: $APP_DIR"
        ((SKIP_COUNT++))
        continue
    fi
    
    log "Linking $APP..."
    cd "$APP_DIR"
    
    # Check if already linked
    if [ -f ".vercel/project.json" ]; then
        warn "  Already linked (project.json exists)"
        read -p "  Relink? (y/N): " RELINK
        if [ "$RELINK" != "y" ] && [ "$RELINK" != "Y" ]; then
            log "  Skipping $APP"
            cd ../..
            ((SKIP_COUNT++))
            continue
        fi
    fi
    
    # Link project
    if vercel link; then
        success "  Linked $APP"
        ((SUCCESS_COUNT++))
    else
        fail "  Failed to link $APP"
        ((FAIL_COUNT++))
    fi
    
    cd ../..
    echo ""
done

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
if [ $SUCCESS_COUNT -gt 0 ]; then
    success "Successfully linked: $SUCCESS_COUNT project(s)"
fi
if [ $SKIP_COUNT -gt 0 ]; then
    warn "Skipped: $SKIP_COUNT project(s)"
fi
if [ $FAIL_COUNT -gt 0 ]; then
    fail "Failed: $FAIL_COUNT project(s)"
    exit 1
fi

echo ""
success "All projects linked successfully!"
echo ""
echo "📋 Next Steps:"
echo "   1. Verify project links: vercel ls"
echo "   2. Set environment variables: ./scripts/setup-env.sh"
echo "   3. Deploy to staging: ./scripts/deploy-staging.sh"
