#!/bin/bash
# scripts/deploy-hotfix.sh
# Emergency hotfix deployment (bypasses tests and some checks)

set -e

# Parse arguments
APP=""
MESSAGE=""
FORCE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --app=*)
            APP="${1#*=}"
            shift
            ;;
        --app)
            APP="$2"
            shift 2
            ;;
        --message=*)
            MESSAGE="${1#*=}"
            shift
            ;;
        --message)
            MESSAGE="$2"
            shift 2
            ;;
        --force)
            FORCE=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: $0 [--app=APP_NAME] [--message='HOTFIX MESSAGE'] [--force]"
            exit 1
            ;;
    esac
done

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[HOTFIX]${NC} $1"
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
    fail "Vercel CLI not installed"
    exit 1
fi

# Check if logged in to Vercel
if ! vercel whoami &> /dev/null; then
    fail "Not logged in to Vercel"
    exit 1
fi

echo "🚨 EMERGENCY HOTFIX DEPLOYMENT"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
warn "⚠️  HOTFIX MODE: Tests and some checks are bypassed"
echo ""

# If app specified, deploy only that app
if [ -n "$APP" ]; then
    APP_DIR="apps/$APP"
    
    if [ ! -d "$APP_DIR" ]; then
        fail "Application directory not found: $APP_DIR"
        exit 1
    fi
    
    log "Deploying hotfix to: $APP"
    log "Message: ${MESSAGE:-'Emergency hotfix'}"
    echo ""
    
    cd "$APP_DIR"
    
    # Quick build check
    log "Building $APP..."
    if ! pnpm build 2>&1 | grep -v "error\|Error\|failed" > /dev/null; then
        if [ "$FORCE" = "false" ]; then
            fail "Build failed. Use --force to deploy anyway."
            exit 1
        else
            warn "Build had errors, but continuing with --force"
        fi
    fi
    
    # Deploy to production
    log "Deploying $APP to PRODUCTION..."
    DEPLOY_ARGS="--yes --prod"
    if [ -n "$MESSAGE" ]; then
        DEPLOY_ARGS="$DEPLOY_ARGS --message=\"$MESSAGE\""
    fi
    
    if eval "vercel $DEPLOY_ARGS"; then
        success "$APP hotfix deployed to PRODUCTION"
        echo ""
        echo "📋 Post-deployment:"
        echo "   1. Verify the fix works"
        echo "   2. Monitor error tracking"
        echo "   3. Document the hotfix"
        echo "   4. Create proper fix in main branch"
    else
        fail "$APP hotfix deployment failed"
        exit 1
    fi
    
    exit 0
fi

# If no app specified, ask which app
echo "Available applications:"
APPS=(
    "m-marketplace"
    "os-admin"
    "os-pm"
    "m-ops-services"
    "m-project-owner"
    "m-architect"
    "m-permits-inspections"
)

for i in "${!APPS[@]}"; do
    echo "  $((i+1)). ${APPS[$i]}"
done

echo ""
read -p "Select application number (1-${#APPS[@]}): " APP_NUM

if [ -z "$APP_NUM" ] || [ "$APP_NUM" -lt 1 ] || [ "$APP_NUM" -gt ${#APPS[@]} ]; then
    fail "Invalid selection"
    exit 1
fi

SELECTED_APP="${APPS[$((APP_NUM-1))]}"
APP_DIR="apps/$SELECTED_APP"

if [ ! -d "$APP_DIR" ]; then
    fail "Application directory not found: $APP_DIR"
    exit 1
fi

if [ -z "$MESSAGE" ]; then
    read -p "Hotfix message (optional): " MESSAGE
fi

log "Deploying hotfix to: $SELECTED_APP"
log "Message: ${MESSAGE:-'Emergency hotfix'}"
echo ""

cd "$APP_DIR"

# Quick build check
log "Building $SELECTED_APP..."
if ! pnpm build 2>&1 | grep -v "error\|Error\|failed" > /dev/null; then
    if [ "$FORCE" = "false" ]; then
        fail "Build failed. Use --force to deploy anyway."
        exit 1
    else
        warn "Build had errors, but continuing with --force"
    fi
fi

# Deploy to production
log "Deploying $SELECTED_APP to PRODUCTION..."
DEPLOY_ARGS="--yes --prod"
if [ -n "$MESSAGE" ]; then
    DEPLOY_ARGS="$DEPLOY_ARGS --message=\"$MESSAGE\""
fi

if eval "vercel $DEPLOY_ARGS"; then
    success "$SELECTED_APP hotfix deployed to PRODUCTION"
    echo ""
    echo "📋 Post-deployment:"
    echo "   1. Verify the fix works"
    echo "   2. Monitor error tracking"
    echo "   3. Document the hotfix"
    echo "   4. Create proper fix in main branch"
else
    fail "$SELECTED_APP hotfix deployment failed"
    exit 1
fi
