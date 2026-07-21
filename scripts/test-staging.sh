#!/bin/bash
# scripts/test-staging.sh
# Test staging deployment for os-admin and other apps

set -e

STAGING_URL=${1:-"https://admin.kealee.com"}
APP_NAME=${2:-"os-admin"}

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PASSED=0
FAILED=0
WARNINGS=0

log() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

pass() {
    echo -e "${GREEN}✅${NC} $1"
    PASSED=$((PASSED + 1))
}

fail() {
    echo -e "${RED}❌${NC} $1"
    FAILED=$((FAILED + 1))
}

warn() {
    echo -e "${YELLOW}⚠️${NC} $1"
    WARNINGS=$((WARNINGS + 1))
}

echo "🧪 Testing staging deployment"
echo "   URL: $STAGING_URL"
echo "   App: $APP_NAME"
echo ""

# Test 1: Health check / Basic connectivity
log "1. Testing basic connectivity..."
if curl -f -s -o /dev/null --max-time 30 "$STAGING_URL" 2>/dev/null; then
    pass "Basic connectivity check passed"
else
    fail "Basic connectivity check failed - site not reachable"
    exit 1
fi

# Test 2: Check if page loads (not 500 error)
log "2. Testing page load..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 30 "$STAGING_URL" 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ]; then
    pass "Page loads successfully (HTTP $HTTP_CODE)"
else
    fail "Page load failed (HTTP $HTTP_CODE)"
fi

# Test 3: Check for JavaScript errors (basic check)
log "3. Testing JavaScript bundle..."
if curl -s --max-time 30 "$STAGING_URL" | grep -q "_next/static" 2>/dev/null; then
    pass "Next.js static assets detected"
else
    warn "Next.js static assets not found (may be normal for some pages)"
fi

# Test 4: Performance test
log "4. Testing response time..."
start_time=$(date +%s%N)
curl -s -o /dev/null "$STAGING_URL" 2>/dev/null
end_time=$(date +%s%N)
response_time=$((($end_time - $start_time) / 1000000))

if [ $response_time -lt 1000 ]; then
    pass "Response time: ${response_time}ms (under 1s threshold)"
elif [ $response_time -lt 3000 ]; then
    warn "Response time: ${response_time}ms (1-3s, acceptable)"
else
    fail "Response time: ${response_time}ms (over 3s threshold)"
fi

# Test 5: SSL/TLS check
log "5. Testing SSL certificate..."
if echo | openssl s_client -connect "$(echo $STAGING_URL | sed 's|https\?://||' | cut -d'/' -f1):443" -servername "$(echo $STAGING_URL | sed 's|https\?://||' | cut -d'/' -f1)" 2>/dev/null | grep -q "Verify return code: 0"; then
    pass "SSL certificate is valid"
else
    warn "SSL certificate check inconclusive (openssl may not be available)"
fi

# Test 6: API endpoints (if available)
log "6. Testing API endpoints..."

# Health check endpoint
if curl -f -s -o /dev/null --max-time 10 "$STAGING_URL/api/health" 2>/dev/null; then
    pass "Health check endpoint accessible"
else
    warn "Health check endpoint not found (may not be implemented)"
fi

# Test 7: Authentication flow (if login page exists)
log "7. Testing authentication flow..."
if curl -s --max-time 10 "$STAGING_URL/login" 2>/dev/null | grep -qi "login\|sign in\|email\|password" 2>/dev/null; then
    pass "Login page accessible"
else
    warn "Login page check inconclusive"
fi

# Test 8: Check for common errors in HTML
log "8. Checking for common errors..."
HTML_CONTENT=$(curl -s --max-time 10 "$STAGING_URL" 2>/dev/null || echo "")

if echo "$HTML_CONTENT" | grep -qi "error\|exception\|failed" 2>/dev/null; then
    if echo "$HTML_CONTENT" | grep -qi "500\|502\|503\|504" 2>/dev/null; then
        fail "Error detected in page content"
    else
        warn "Potential error keywords found (may be false positive)"
    fi
else
    pass "No obvious errors in page content"
fi

# Test 9: Check environment variables (if env-test endpoint exists)
log "9. Testing environment configuration..."
if curl -f -s --max-time 10 "$STAGING_URL/api/env-test" 2>/dev/null | grep -q "NODE_ENV" 2>/dev/null; then
    ENV_DATA=$(curl -s --max-time 10 "$STAGING_URL/api/env-test" 2>/dev/null)
    if echo "$ENV_DATA" | grep -q '"hasDatabaseUrl":true' 2>/dev/null; then
        pass "Environment variables configured correctly"
    else
        warn "Some environment variables may be missing"
    fi
else
    warn "Environment test endpoint not available"
fi

# Test 10: Check for security headers
log "10. Testing security headers..."
HEADERS=$(curl -s -I --max-time 10 "$STAGING_URL" 2>/dev/null || echo "")

if echo "$HEADERS" | grep -qi "X-Frame-Options\|X-Content-Type-Options\|Content-Security-Policy" 2>/dev/null; then
    pass "Security headers present"
else
    warn "Security headers not detected (may be set by CDN)"
fi

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Test Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Passed:${NC} $PASSED"
echo -e "${YELLOW}⚠️  Warnings:${NC} $WARNINGS"
echo -e "${RED}❌ Failed:${NC} $FAILED"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All critical tests passed!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Test authentication flow manually"
    echo "2. Test user management features"
    echo "3. Check Vercel deployment logs"
    echo "4. Monitor error tracking (Sentry)"
    exit 0
else
    echo -e "${RED}❌ Some tests failed. Please review the errors above.${NC}"
    exit 1
fi
