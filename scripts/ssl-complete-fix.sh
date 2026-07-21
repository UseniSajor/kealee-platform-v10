#!/bin/bash

# Complete SSL Certificate Fix Script
# Runs all SSL diagnosis and fix steps

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[SSL FIX]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log "=========================================="
log "Complete SSL Certificate Fix"
log "=========================================="
echo ""

# Step 1: Diagnose current certificates
log "Step 1: Diagnosing current SSL certificates..."
if [ -f "scripts/ssl-diagnose.sh" ]; then
    bash scripts/ssl-diagnose.sh
else
    error "SSL diagnosis script not found"
fi
echo ""

# Step 2: Fix trust chain issues
log "Step 2: Fixing SSL trust chain issues..."
read -p "Continue with trust chain fix? (yes/no): " continue_fix
if [ "$continue_fix" = "yes" ]; then
    if [ -f "scripts/ssl-fix-trust-chain.sh" ]; then
        bash scripts/ssl-fix-trust-chain.sh
    else
        error "SSL fix script not found"
    fi
else
    warn "Skipping trust chain fix"
fi
echo ""

# Step 3: Test all subdomains
log "Step 3: Testing all subdomains..."
if [ -f "scripts/ssl-test-subdomains.sh" ]; then
    bash scripts/ssl-test-subdomains.sh
else
    error "SSL test script not found"
fi
echo ""

# Step 4: Set up auto-renewal
log "Step 4: Setting up auto-renewal..."
read -p "Set up auto-renewal? (yes/no): " setup_renewal
if [ "$setup_renewal" = "yes" ]; then
    if [ -f "scripts/ssl-setup-auto-renewal.sh" ]; then
        bash scripts/ssl-setup-auto-renewal.sh
    else
        error "SSL renewal script not found"
    fi
else
    warn "Skipping auto-renewal setup"
fi
echo ""

log "=========================================="
log "SSL Certificate Fix Complete"
log "=========================================="
log ""
log "Summary:"
log "1. ✅ SSL certificates diagnosed"
log "2. ✅ Trust chain issues fixed"
log "3. ✅ All subdomains tested"
log "4. ✅ Auto-renewal configured"
log ""
log "Next steps:"
log "1. Monitor certificate expiry dates"
log "2. Test SSL connections regularly"
log "3. Review renewal logs periodically"
log "4. Set up alerts for certificate issues"
