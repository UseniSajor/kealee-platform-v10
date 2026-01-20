#!/bin/bash
# scripts/setup-ssl.sh
# Setup SSL certificates for all domains

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[SSL]${NC} $1"
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

echo "🔒 SSL Certificate Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "This script helps you configure SSL certificates for all domains."
echo "Vercel automatically provisions SSL certificates via Let's Encrypt."
echo ""

# Domain configuration
DOMAIN=${DOMAIN:-"kealee.com"}

# Application domains
DOMAINS=(
    "api.$DOMAIN"
    "marketplace.$DOMAIN"
    "admin.$DOMAIN"
    "pm.$DOMAIN"
    "ops.$DOMAIN"
    "app.$DOMAIN"
    "owner.$DOMAIN"
    "architect.$DOMAIN"
    "permits.$DOMAIN"
)

log "Domain: $DOMAIN"
log "Total domains: ${#DOMAINS[@]}"
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    fail "Vercel CLI not installed"
    echo "   Install with: npm install -g vercel@latest"
    exit 1
fi

# Check if logged in
if ! vercel whoami &> /dev/null; then
    fail "Not logged in to Vercel"
    echo "   Login with: vercel login"
    exit 1
fi

echo "📋 SSL Certificate Configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Vercel automatically provisions SSL certificates for all domains."
echo "Certificates are issued by Let's Encrypt and auto-renewed."
echo ""

# Instructions for Vercel SSL setup
echo "🔧 Vercel SSL Setup Steps"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Add Custom Domains in Vercel:"
echo "   - Go to each project in Vercel dashboard"
echo "   - Navigate to: Settings → Domains"
echo "   - Add each domain (e.g., admin.$DOMAIN)"
echo ""
echo "2. Vercel will automatically:"
echo "   ✅ Verify domain ownership (via DNS)"
echo "   ✅ Provision SSL certificate (Let's Encrypt)"
echo "   ✅ Configure HTTPS redirect"
echo "   ✅ Set up auto-renewal"
echo ""

# List domains to add
echo "📝 Domains to Add in Vercel"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

declare -A APP_PROJECTS=(
    ["api"]="api"
    ["marketplace"]="m-marketplace"
    ["admin"]="os-admin"
    ["pm"]="os-pm"
    ["ops"]="m-ops-services"
    ["app"]="m-project-owner"
    ["owner"]="m-project-owner"
    ["architect"]="m-architect"
    ["permits"]="m-permits-inspections"
)

for domain in "${DOMAINS[@]}"; do
    subdomain=$(echo $domain | cut -d'.' -f1)
    project="${APP_PROJECTS[$subdomain]}"
    echo "  $domain"
    echo "    Project: $project"
    echo "    Vercel Dashboard: https://vercel.com/[team]/$project/settings/domains"
    echo ""
done

echo ""
echo "🔍 Verification Steps"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "After adding domains in Vercel:"
echo ""
echo "1. Wait for DNS propagation (1-48 hours)"
echo "2. Wait for SSL certificate provisioning (5-10 minutes)"
echo "3. Verify SSL certificates:"
echo ""
echo "   ./scripts/ssl-test-subdomains.sh"
echo ""
echo "4. Check certificate details:"
echo ""
for domain in "${DOMAINS[@]}"; do
    echo "   openssl s_client -servername $domain -connect $domain:443 < /dev/null 2>/dev/null | openssl x509 -noout -dates"
done
echo ""

# Test SSL certificates
echo "🧪 Testing SSL Certificates"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
read -p "Test SSL certificates now? (y/N): " TEST_NOW

if [ "$TEST_NOW" = "y" ] || [ "$TEST_NOW" = "Y" ]; then
    log "Testing SSL certificates..."
    echo ""
    
    PASSED=0
    FAILED=0
    
    for domain in "${DOMAINS[@]}"; do
        log "Testing $domain..."
        
        # Check if domain resolves
        if ! dig +short "$domain" | grep -q .; then
            warn "  DNS not configured for $domain"
            FAILED=$((FAILED + 1))
            continue
        fi
        
        # Check SSL certificate
        if echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | openssl x509 -noout -dates > /dev/null 2>&1; then
            # Get certificate expiration
            EXPIRY=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)
            if [ -n "$EXPIRY" ]; then
                success "  ✅ SSL certificate valid (expires: $EXPIRY)"
                PASSED=$((PASSED + 1))
            else
                warn "  ⚠️  SSL certificate exists but could not read expiry"
                PASSED=$((PASSED + 1))
            fi
        else
            fail "  ❌ SSL certificate not found or invalid"
            FAILED=$((FAILED + 1))
        fi
    done
    
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📊 SSL Test Results"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    success "Passed: $PASSED"
    if [ $FAILED -gt 0 ]; then
        fail "Failed: $FAILED"
        echo ""
        echo "For failed domains:"
        echo "  1. Verify DNS is configured correctly"
        echo "  2. Check domain is added in Vercel"
        echo "  3. Wait for SSL provisioning (5-10 minutes)"
        echo "  4. Run: ./scripts/ssl-diagnose.sh"
    fi
fi

echo ""
echo "📋 Next Steps"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. ✅ Add all domains in Vercel dashboard"
echo "2. ✅ Wait for DNS propagation"
echo "3. ✅ Wait for SSL certificate provisioning"
echo "4. ✅ Verify SSL: ./scripts/ssl-test-subdomains.sh"
echo "5. ✅ Set up auto-renewal: ./scripts/ssl-setup-auto-renewal.sh"
echo ""
echo "💡 Tips:"
echo "   - SSL certificates auto-renew via Vercel"
echo "   - Monitor certificate expiration"
echo "   - Use SSL Labs to test: https://www.ssllabs.com/ssltest/"
echo ""
