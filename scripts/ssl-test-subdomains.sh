#!/bin/bash

# SSL Subdomain Testing Script
# Tests SSL certificates for all subdomains

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[TEST]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Domains to test
DOMAINS=(
    "api.kealee.com"
    "marketplace.kealee.com"
    "admin.kealee.com"
    "pm.kealee.com"
    "ops.kealee.com"
    "app.kealee.com"
    "architect.kealee.com"
    "permits.kealee.com"
)

test_ssl_connection() {
    local domain=$1
    local test_name=$2
    
    log "Testing $test_name for $domain..."
    
    # Test HTTPS connection
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "https://$domain" 2>/dev/null || echo "000")
    
    if [ "$HTTP_CODE" = "000" ]; then
        error "  ❌ Cannot connect to $domain"
        return 1
    elif [ "$HTTP_CODE" -ge 200 ] && [ "$HTTP_CODE" -lt 400 ]; then
        log "  ✅ HTTPS connection successful (HTTP $HTTP_CODE)"
    else
        warn "  ⚠️  HTTPS connection returned HTTP $HTTP_CODE"
    fi
    
    # Test SSL certificate
    CERT_CHECK=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" -verify_return_error 2>&1 | grep -c "Verify return code: 0" || echo "0")
    
    if [ "$CERT_CHECK" -gt 0 ]; then
        log "  ✅ SSL certificate is valid"
    else
        error "  ❌ SSL certificate validation failed"
        echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>&1 | grep "Verify return code" || true
        return 1
    fi
    
    # Test certificate chain
    CHAIN_CHECK=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" -showcerts 2>/dev/null | openssl verify -CAfile /etc/ssl/certs/ca-certificates.crt - 2>&1 || echo "ERROR")
    
    if echo "$CHAIN_CHECK" | grep -q "OK"; then
        log "  ✅ Certificate chain is valid"
    else
        error "  ❌ Certificate chain validation failed"
        echo "$CHAIN_CHECK" | head -3
        return 1
    fi
    
    # Test TLS version
    TLS_VERSION=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" -tls1_2 2>/dev/null | grep "Protocol" | awk '{print $3}' || echo "UNKNOWN")
    log "  TLS Version: $TLS_VERSION"
    
    # Test cipher suite
    CIPHER=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | grep "Cipher:" | sed 's/Cipher: //' || echo "UNKNOWN")
    log "  Cipher: $CIPHER"
    
    # Test certificate expiry
    EXPIRY=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | openssl x509 -noout -enddate 2>/dev/null | sed 's/notAfter=//')
    EXPIRY_EPOCH=$(date -d "$EXPIRY" +%s 2>/dev/null || date -j -f "%b %d %H:%M:%S %Y %Z" "$EXPIRY" +%s 2>/dev/null || echo "0")
    CURRENT_EPOCH=$(date +%s)
    DAYS_UNTIL_EXPIRY=$(( (EXPIRY_EPOCH - CURRENT_EPOCH) / 86400 ))
    
    if [ $DAYS_UNTIL_EXPIRY -lt 0 ]; then
        error "  ❌ Certificate EXPIRED"
        return 1
    elif [ $DAYS_UNTIL_EXPIRY -lt 30 ]; then
        warn "  ⚠️  Certificate expires in $DAYS_UNTIL_EXPIRY days"
    else
        log "  ✅ Certificate valid for $DAYS_UNTIL_EXPIRY more days"
    fi
    
    echo ""
    return 0
}

test_all_subdomains() {
    log "=========================================="
    log "SSL Subdomain Testing"
    log "=========================================="
    echo ""
    
    FAILED_TESTS=0
    PASSED_TESTS=0
    
    for domain in "${DOMAINS[@]}"; do
        if test_ssl_connection "$domain" "SSL Certificate"; then
            PASSED_TESTS=$((PASSED_TESTS + 1))
        else
            FAILED_TESTS=$((FAILED_TESTS + 1))
        fi
    done
    
    echo ""
    log "=========================================="
    log "Test Summary"
    log "=========================================="
    log "Passed: $PASSED_TESTS/${#DOMAINS[@]}"
    
    if [ $FAILED_TESTS -gt 0 ]; then
        error "Failed: $FAILED_TESTS/${#DOMAINS[@]}"
        echo ""
        error "❌ Some SSL tests failed"
        echo ""
        log "Next steps:"
        log "1. Review failed tests above"
        log "2. Run SSL fix: npm run ssl:fix"
        log "3. Re-run tests: npm run ssl:test"
        exit 1
    else
        log "Failed: 0/${#DOMAINS[@]}"
        echo ""
        log "✅ All SSL tests passed!"
        exit 0
    fi
}

# Run tests
test_all_subdomains
