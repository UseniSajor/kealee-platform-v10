#!/bin/bash
# scripts/setup-vercel-cli.sh
# Setup Vercel CLI and link projects

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[SETUP]${NC} $1"
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

echo "🔧 Vercel CLI Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Step 1: Install Vercel CLI
log "1. Installing Vercel CLI..."
if command -v vercel &> /dev/null; then
    VERCEL_VERSION=$(vercel --version 2>/dev/null || echo "unknown")
    success "Vercel CLI already installed ($VERCEL_VERSION)"
else
    log "   Installing Vercel CLI..."
    if npm install -g vercel@latest; then
        success "Vercel CLI installed successfully"
    else
        fail "Failed to install Vercel CLI"
        exit 1
    fi
fi

# Step 2: Login to Vercel
log "2. Checking Vercel login..."
if vercel whoami &> /dev/null; then
    USER_EMAIL=$(vercel whoami 2>/dev/null || echo "unknown")
    success "Already logged in as: $USER_EMAIL"
else
    warn "Not logged in to Vercel"
    echo "   Please login:"
    echo "   vercel login"
    read -p "Press Enter after logging in, or 'skip' to skip: " SKIP_LOGIN
    if [ "$SKIP_LOGIN" != "skip" ]; then
        if vercel login; then
            success "Logged in to Vercel"
        else
            fail "Failed to login to Vercel"
            exit 1
        fi
    fi
fi

# Step 3: Link projects
echo ""
log "3. Linking projects to Vercel..."
echo ""

APPS=(
    "apps/m-marketplace"
    "apps/os-admin"
    "apps/os-pm"
    "apps/m-ops-services"
    "apps/m-project-owner"
    "apps/m-architect"
    "apps/m-permits-inspections"
)

LINKED=0
SKIPPED=0

for app in "${APPS[@]}"; do
    if [ ! -d "$app" ]; then
        warn "Directory not found: $app"
        continue
    fi
    
    APP_NAME=$(basename "$app")
    log "Linking $APP_NAME..."
    
    cd "$app"
    
    # Check if already linked
    if [ -f ".vercel/project.json" ]; then
        success "$APP_NAME already linked"
        LINKED=$((LINKED + 1))
    else
        echo "   Linking $APP_NAME to Vercel..."
        echo "   (Follow prompts to select/create project)"
        if vercel link; then
            success "$APP_NAME linked successfully"
            LINKED=$((LINKED + 1))
        else
            warn "$APP_NAME linking skipped or failed"
            SKIPPED=$((SKIPPED + 1))
        fi
    fi
    
    cd ../..
    echo ""
done

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Setup Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
success "Vercel CLI: Installed and ready"
success "Projects linked: $LINKED"
if [ $SKIPPED -gt 0 ]; then
    warn "Projects skipped: $SKIPPED"
fi
echo ""
echo "✅ Vercel CLI setup complete!"
echo ""
echo "Next steps:"
echo "  1. Set environment variables: ./scripts/setup-env.sh [app] [environment]"
echo "  2. Deploy to staging: ./scripts/deploy-staging.sh"
echo "  3. Deploy to production: ./scripts/deploy-production.sh"
echo ""
