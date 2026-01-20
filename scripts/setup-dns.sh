#!/bin/bash
# scripts/setup-dns.sh
# Setup DNS records for all applications

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[DNS]${NC} $1"
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

echo "🌐 DNS Setup for Kealee Platform"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "This script helps you configure DNS records for all applications."
echo "You'll need to manually add these records in your DNS provider."
echo ""

# Domain configuration
DOMAIN=${DOMAIN:-"kealee.com"}
DNS_PROVIDER=${DNS_PROVIDER:-"namebright"}  # namebright, cloudflare, route53, etc.

# Application domains
declare -A APP_DOMAINS=(
    ["api"]="api.kealee.com"
    ["marketplace"]="marketplace.kealee.com"
    ["admin"]="admin.kealee.com"
    ["pm"]="pm.kealee.com"
    ["ops"]="ops.kealee.com"
    ["app"]="app.kealee.com"
    ["owner"]="owner.kealee.com"
    ["architect"]="architect.kealee.com"
    ["permits"]="permits.kealee.com"
)

# Vercel CNAME target (get from Vercel dashboard)
VERCEL_TARGET="cname.vercel-dns.com"

log "Domain: $DOMAIN"
log "DNS Provider: $DNS_PROVIDER"
echo ""

# Display DNS records needed
echo "📋 DNS Records to Configure"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "For each application, add a CNAME record:"
echo ""

for app in "${!APP_DOMAINS[@]}"; do
    domain="${APP_DOMAINS[$app]}"
    echo "  $domain"
    echo "    Type: CNAME"
    echo "    Name: $app"
    echo "    Value: $VERCEL_TARGET"
    echo "    TTL: 3600 (or Auto)"
    echo ""
done

# API domain (usually points to Railway or other backend)
echo "  api.$DOMAIN"
echo "    Type: CNAME"
echo "    Name: api"
echo "    Value: [Your API server CNAME]"
echo "    TTL: 3600 (or Auto)"
echo "    Note: Update with your actual API server CNAME"
echo ""

# Root domain (optional - for main site)
echo "  $DOMAIN (root domain)"
echo "    Type: A or CNAME"
echo "    Name: @"
echo "    Value: [Vercel IP or CNAME]"
echo "    TTL: 3600 (or Auto)"
echo "    Note: Usually handled by Vercel automatically"
echo ""

# Instructions based on DNS provider
case $DNS_PROVIDER in
    namebright)
        echo "📝 NameBright DNS Configuration"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        echo "1. Log in to NameBright: https://www.namebright.com"
        echo "2. Go to: Domains → $DOMAIN → DNS Management"
        echo "3. Click 'Add Record' for each subdomain"
        echo "4. Select 'CNAME' as record type"
        echo "5. Enter subdomain name (e.g., 'api', 'admin', 'pm')"
        echo "6. Enter target: $VERCEL_TARGET"
        echo "7. Set TTL to 3600 or Auto"
        echo "8. Click 'Save'"
        echo ""
        echo "⚠️  DNS propagation can take 24-48 hours"
        echo "   Usually takes effect within 1-2 hours"
        ;;
    cloudflare)
        echo "📝 Cloudflare DNS Configuration"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        echo "1. Log in to Cloudflare: https://dash.cloudflare.com"
        echo "2. Select domain: $DOMAIN"
        echo "3. Go to: DNS → Records"
        echo "4. Click 'Add record' for each subdomain"
        echo "5. Select 'CNAME' as record type"
        echo "6. Enter subdomain name (e.g., 'api', 'admin', 'pm')"
        echo "7. Enter target: $VERCEL_TARGET"
        echo "8. Proxy status: DNS only (gray cloud) or Proxied (orange cloud)"
        echo "9. Click 'Save'"
        echo ""
        echo "⚠️  Cloudflare DNS usually propagates within minutes"
        ;;
    route53)
        echo "📝 AWS Route53 DNS Configuration"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        echo "1. Log in to AWS Console: https://console.aws.amazon.com"
        echo "2. Go to: Route53 → Hosted zones → $DOMAIN"
        echo "3. Click 'Create record' for each subdomain"
        echo "4. Enter subdomain name (e.g., 'api', 'admin', 'pm')"
        echo "5. Select 'CNAME' as record type"
        echo "6. Enter value: $VERCEL_TARGET"
        echo "7. Set TTL to 300 (5 minutes) or 3600 (1 hour)"
        echo "8. Click 'Create records'"
        echo ""
        echo "⚠️  Route53 DNS usually propagates within minutes"
        ;;
    *)
        echo "📝 Generic DNS Configuration"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        echo "1. Log in to your DNS provider"
        echo "2. Navigate to DNS management for $DOMAIN"
        echo "3. Add CNAME records for each subdomain:"
        echo "   - Name: subdomain (e.g., 'api', 'admin')"
        echo "   - Type: CNAME"
        echo "   - Value: $VERCEL_TARGET"
        echo "   - TTL: 3600"
        ;;
esac

echo ""
echo "🔍 Verification"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "After adding DNS records, verify with:"
echo ""
echo "  # Check DNS propagation"
echo "  dig api.$DOMAIN"
echo "  nslookup api.$DOMAIN"
echo ""
echo "  # Test HTTPS (after SSL setup)"
echo "  curl -I https://api.$DOMAIN"
echo ""
echo "  # Check all domains"
echo "  ./scripts/ssl-test-subdomains.sh"
echo ""

# Generate DNS records file
DNS_FILE="dns-records.txt"
log "Generating DNS records file: $DNS_FILE"
cat > "$DNS_FILE" << EOF
# DNS Records for $DOMAIN
# Generated: $(date)
# DNS Provider: $DNS_PROVIDER

# Application Subdomains (CNAME to Vercel)
EOF

for app in "${!APP_DOMAINS[@]}"; do
    domain="${APP_DOMAINS[$app]}"
    echo "$app.$DOMAIN CNAME $VERCEL_TARGET" >> "$DNS_FILE"
done

echo "" >> "$DNS_FILE"
echo "# API Subdomain (CNAME to API server)" >> "$DNS_FILE"
echo "api.$DOMAIN CNAME [YOUR_API_SERVER_CNAME]" >> "$DNS_FILE"

success "DNS records file created: $DNS_FILE"
echo ""
echo "📋 Next Steps:"
echo "   1. Review $DNS_FILE"
echo "   2. Add records in your DNS provider"
echo "   3. Wait for DNS propagation (1-48 hours)"
echo "   4. Configure SSL certificates: ./scripts/setup-ssl.sh"
echo "   5. Verify DNS: dig api.$DOMAIN"
