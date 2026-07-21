#!/bin/bash

# SSL Certificate Diagnosis Script
# Checks current SSL certificates and identifies issues

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[SSL CHECK]${NC} $1"
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

# Domains to check
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

check_certificate() {
    local domain=$1
    log "Checking certificate for $domain..."
    
    # Get certificate details
    CERT_INFO=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | openssl x509 -noout -text 2>/dev/null)
    
    if [ -z "$CERT_INFO" ]; then
        error "  ❌ Cannot retrieve certificate for $domain"
        return 1
    fi
    
    # Extract certificate details
    SUBJECT=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | openssl x509 -noout -subject 2>/dev/null | sed 's/subject=//')
    ISSUER=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | openssl x509 -noout -issuer 2>/dev/null | sed 's/issuer=//')
    EXPIRY=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | openssl x509 -noout -enddate 2>/dev/null | sed 's/notAfter=//')
    VALID_FROM=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | openssl x509 -noout -startdate 2>/dev/null | sed 's/notBefore=//')
    
    # Check expiry
    EXPIRY_EPOCH=$(date -d "$EXPIRY" +%s 2>/dev/null || date -j -f "%b %d %H:%M:%S %Y %Z" "$EXPIRY" +%s 2>/dev/null || echo "0")
    CURRENT_EPOCH=$(date +%s)
    DAYS_UNTIL_EXPIRY=$(( (EXPIRY_EPOCH - CURRENT_EPOCH) / 86400 ))
    
    if [ $DAYS_UNTIL_EXPIRY -lt 0 ]; then
        error "  ❌ Certificate EXPIRED ($EXPIRY)"
    elif [ $DAYS_UNTIL_EXPIRY -lt 30 ]; then
        warn "  ⚠️  Certificate expires in $DAYS_UNTIL_EXPIRY days ($EXPIRY)"
    else
        log "  ✅ Certificate valid until $EXPIRY ($DAYS_UNTIL_EXPIRY days remaining)"
    fi
    
    # Check trust chain
    log "  Checking trust chain..."
    CHAIN_CHECK=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" -showcerts 2>/dev/null | openssl verify -CAfile /etc/ssl/certs/ca-certificates.crt - 2>&1 || echo "ERROR")
    
    if echo "$CHAIN_CHECK" | grep -q "OK"; then
        log "  ✅ Trust chain is valid"
    else
        error "  ❌ Trust chain issue detected"
        echo "$CHAIN_CHECK" | head -5
    fi
    
    # Check certificate chain completeness
    CHAIN_COUNT=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" -showcerts 2>/dev/null | grep -c "BEGIN CERTIFICATE" || echo "0")
    
    if [ "$CHAIN_COUNT" -lt 2 ]; then
        warn "  ⚠️  Certificate chain may be incomplete (only $CHAIN_COUNT certificate(s) found)"
    else
        log "  ✅ Certificate chain complete ($CHAIN_COUNT certificates)"
    fi
    
    # Check for common issues
    SAN=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | openssl x509 -noout -text 2>/dev/null | grep -A1 "Subject Alternative Name" || echo "")
    
    if echo "$SAN" | grep -q "$domain"; then
        log "  ✅ Domain is in Subject Alternative Name"
    else
        warn "  ⚠️  Domain may not be in Subject Alternative Name"
    fi
    
    # Check cipher strength
    CIPHER=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | grep "Cipher:" | sed 's/Cipher: //' || echo "UNKNOWN")
    log "  Cipher: $CIPHER"
    
    echo ""
}

check_all_domains() {
    log "=========================================="
    log "SSL Certificate Diagnosis"
    log "=========================================="
    echo ""
    
    FAILED_DOMAINS=0
    
    for domain in "${DOMAINS[@]}"; do
        if ! check_certificate "$domain"; then
            FAILED_DOMAINS=$((FAILED_DOMAINS + 1))
        fi
    done
    
    echo ""
    log "=========================================="
    log "Summary"
    log "=========================================="
    
    if [ $FAILED_DOMAINS -eq 0 ]; then
        log "✅ All certificates are valid"
    else
        error "❌ $FAILED_DOMAINS domain(s) have certificate issues"
    fi
    
    echo ""
    log "Next steps:"
    log "1. Review certificate issues above"
    log "2. Run SSL fix script: npm run ssl:fix"
    log "3. Test certificates: npm run ssl:test"
}

# Run diagnosis
check_all_domains
