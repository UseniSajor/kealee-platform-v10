#!/bin/bash
# scripts/test-os-admin-staging.sh
# Comprehensive testing script for os-admin staging deployment

set -e

STAGING_URL=${STAGING_URL:-"https://admin.kealee.com"}
API_URL=${API_URL:-"https://api.kealee.com"}

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

echo "🧪 Testing os-admin staging deployment"
echo "   Frontend URL: $STAGING_URL"
echo "   API URL: $API_URL"
echo ""

# Test 1: Frontend connectivity
log "1. Testing frontend connectivity..."
if curl -f -s -o /dev/null --max-time 30 "$STAGING_URL" 2>/dev/null; then
    pass "Frontend is reachable"
else
    fail "Frontend is not reachable"
    exit 1
fi

# Test 2: Frontend page load
log "2. Testing frontend page load..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 30 "$STAGING_URL" 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    pass "Frontend page loads successfully (HTTP $HTTP_CODE)"
elif [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ]; then
    pass "Frontend redirects correctly (HTTP $HTTP_CODE)"
else
    fail "Frontend page load failed (HTTP $HTTP_CODE)"
fi

# Test 3: API connectivity
log "3. Testing API connectivity..."
if curl -f -s -o /dev/null --max-time 30 "$API_URL/health" 2>/dev/null; then
    pass "API is reachable"
else
    warn "API health check failed (may require authentication)"
fi

# Test 4: Login page
log "4. Testing login page..."
if curl -s --max-time 10 "$STAGING_URL/login" 2>/dev/null | grep -qi "login\|sign in\|email\|password" 2>/dev/null; then
    pass "Login page is accessible"
else
    warn "Login page check inconclusive"
fi

# Test 5: Performance
log "5. Testing performance..."
start_time=$(date +%s%N)
curl -s -o /dev/null "$STAGING_URL" 2>/dev/null
end_time=$(date +%s%N)
response_time=$((($end_time - $start_time) / 1000000))

if [ $response_time -lt 1000 ]; then
    pass "Response time: ${response_time}ms (excellent)"
elif [ $response_time -lt 2000 ]; then
    pass "Response time: ${response_time}ms (good)"
elif [ $response_time -lt 3000 ]; then
    warn "Response time: ${response_time}ms (acceptable)"
else
    fail "Response time: ${response_time}ms (slow)"
fi

# Test 6: SSL certificate
log "6. Testing SSL certificate..."
DOMAIN=$(echo $STAGING_URL | sed 's|https\?://||' | cut -d'/' -f1)
if echo | timeout 5 openssl s_client -connect "$DOMAIN:443" -servername "$DOMAIN" 2>/dev/null | grep -q "Verify return code: 0"; then
    pass "SSL certificate is valid"
else
    warn "SSL certificate check inconclusive"
fi

# Test 7: Security headers
log "7. Testing security headers..."
HEADERS=$(curl -s -I --max-time 10 "$STAGING_URL" 2>/dev/null || echo "")
if echo "$HEADERS" | grep -qi "X-Frame-Options\|X-Content-Type-Options" 2>/dev/null; then
    pass "Security headers present"
else
    warn "Security headers not detected (may be set by CDN)"
fi

# Test 8: Check for errors in page
log "8. Checking for errors in page content..."
HTML_CONTENT=$(curl -s --max-time 10 "$STAGING_URL" 2>/dev/null || echo "")
if echo "$HTML_CONTENT" | grep -qi "500\|502\|503\|504\|Internal Server Error" 2>/dev/null; then
    fail "Server error detected in page"
elif echo "$HTML_CONTENT" | grep -qi "error\|exception" 2>/dev/null; then
    warn "Potential error keywords found (may be false positive)"
else
    pass "No obvious errors in page content"
fi

# Test 9: Next.js build artifacts
log "9. Checking Next.js build artifacts..."
if echo "$HTML_CONTENT" | grep -q "_next/static" 2>/dev/null; then
    pass "Next.js static assets detected"
else
    warn "Next.js static assets not found"
fi

# Test 10: Environment variables (if endpoint exists)
log "10. Testing environment configuration..."
if curl -f -s --max-time 10 "$STAGING_URL/api/env-test" 2>/dev/null | grep -q "NODE_ENV" 2>/dev/null; then
    ENV_DATA=$(curl -s --max-time 10 "$STAGING_URL/api/env-test" 2>/dev/null)
    if echo "$ENV_DATA" | grep -q '"hasDatabaseUrl":true' 2>/dev/null; then
        pass "Environment variables configured"
    else
        warn "Some environment variables may be missing"
    fi
else
    warn "Environment test endpoint not available"
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
    echo "📋 Manual Testing Checklist:"
    echo "   [ ] Login with valid credentials"
    echo "   [ ] Access dashboard"
    echo "   [ ] View users list"
    echo "   [ ] Search users"
    echo "   [ ] Update user status"
    echo "   [ ] View organizations"
    echo "   [ ] Check audit logs"
    echo "   [ ] Test RBAC features"
    echo ""
    echo "🔗 URLs to test:"
    echo "   - Login: $STAGING_URL/login"
    echo "   - Dashboard: $STAGING_URL/dashboard"
    echo "   - Users: $STAGING_URL/users"
    echo "   - Organizations: $STAGING_URL/orgs"
    echo ""
    exit 0
else
    echo -e "${RED}❌ Some tests failed. Please review the errors above.${NC}"
    echo ""
    echo "🔍 Troubleshooting:"
    echo "   1. Check Vercel deployment logs"
    echo "   2. Verify environment variables"
    echo "   3. Check API connectivity"
    echo "   4. Review error tracking (Sentry)"
    exit 1
fi
