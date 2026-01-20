#!/bin/bash

# SSL Certificate Testing Script
# Tests SSL certificates for all Kealee subdomains

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

DOMAINS=(
  "api.kealee.com"
  "ops.kealee.com"
  "app.kealee.com"
  "architect.kealee.com"
  "permits.kealee.com"
  "marketplace.kealee.com"
  "staging-marketplace.kealee.com"
  "pm.kealee.com"
  "admin.kealee.com"
)

echo "Testing SSL Certificates for Kealee Subdomains"
echo "=============================================="
echo ""

for domain in "${DOMAINS[@]}"; do
  echo "Testing $domain..."
  
  # Check if domain resolves
  if ! host "$domain" &> /dev/null; then
    echo -e "${RED}  ❌ Domain does not resolve${NC}"
    echo ""
    continue
  fi
  
  # Get certificate expiration
  expiry=$(echo | openssl s_client -connect "$domain:443" -servername "$domain" 2>/dev/null | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)
  
  if [ -z "$expiry" ]; then
    echo -e "${RED}  ❌ Could not retrieve certificate${NC}"
    echo ""
    continue
  fi
  
  # Check if certificate is expired or expiring soon
  expiry_epoch=$(date -d "$expiry" +%s 2>/dev/null || date -j -f "%b %d %H:%M:%S %Y %Z" "$expiry" +%s 2>/dev/null)
  current_epoch=$(date +%s)
  days_until_expiry=$(( ($expiry_epoch - $current_epoch) / 86400 ))
  
  if [ $days_until_expiry -lt 0 ]; then
    echo -e "${RED}  ❌ Certificate EXPIRED${NC}"
    echo "  Expired: $expiry"
  elif [ $days_until_expiry -lt 30 ]; then
    echo -e "${YELLOW}  ⚠️  Certificate expiring soon${NC}"
    echo "  Expires: $expiry ($days_until_expiry days)"
  else
    echo -e "${GREEN}  ✅ Certificate valid${NC}"
    echo "  Expires: $expiry ($days_until_expiry days)"
  fi
  
  # Check certificate chain
  chain_count=$(echo | openssl s_client -connect "$domain:443" -servername "$domain" 2>/dev/null | grep -c "BEGIN CERTIFICATE" || echo "0")
  echo "  Certificate chain: $chain_count certificates"
  
  # Check certificate issuer
  issuer=$(echo | openssl s_client -connect "$domain:443" -servername "$domain" 2>/dev/null | openssl x509 -noout -issuer 2>/dev/null | cut -d= -f2-)
  echo "  Issuer: $issuer"
  
  # Test HTTPS connection
  if curl -sSf "https://$domain" > /dev/null 2>&1; then
    echo -e "${GREEN}  ✅ HTTPS connection successful${NC}"
  else
    echo -e "${RED}  ❌ HTTPS connection failed${NC}"
  fi
  
  echo ""
done

echo "=============================================="
echo "SSL Certificate Test Complete"
echo ""
echo "For detailed analysis, visit:"
echo "https://www.ssllabs.com/ssltest/analyze.html?d=YOUR_DOMAIN"
