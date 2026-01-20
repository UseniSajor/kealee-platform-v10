#!/bin/bash
# scripts/setup-env-all.sh
# Setup environment variables for all applications

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

# Check arguments
if [ $# -lt 1 ]; then
    echo "Usage: $0 <environment>"
    echo ""
    echo "Examples:"
    echo "  $0 production"
    echo "  $0 preview"
    echo "  $0 development"
    exit 1
fi

ENVIRONMENT=$1

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(production|preview|development)$ ]]; then
    fail "Invalid environment: $ENVIRONMENT"
    echo "   Must be: production, preview, or development"
    exit 1
fi

echo "🔐 Setting Environment Variables for All Apps"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   Environment: $ENVIRONMENT"
echo ""

# Applications
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

for app in "${APPS[@]}"; do
    echo ""
    log "Setting up $app..."
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    if ./scripts/setup-env.sh "$app" "$ENVIRONMENT"; then
        success "$app environment setup complete"
        SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
    else
        fail "$app environment setup failed"
        FAIL_COUNT=$((FAIL_COUNT + 1))
    fi
    
    echo ""
done

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Overall Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
success "Apps configured: $SUCCESS_COUNT"
if [ $FAIL_COUNT -gt 0 ]; then
    fail "Apps failed: $FAIL_COUNT"
fi
echo ""

if [ $FAIL_COUNT -eq 0 ]; then
    echo "✅ All applications configured successfully!"
    exit 0
else
    echo "⚠️  Some applications failed. Review errors above."
    exit 1
fi
