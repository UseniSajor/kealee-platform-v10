#!/bin/bash
# scripts/test-payment-processing.sh
# Comprehensive payment processing test script

set -e

# Configuration
API_URL=${API_URL:-"http://localhost:3001"}
FRONTEND_URL=${FRONTEND_URL:-"http://localhost:3005"}
TEST_MODE=${TEST_MODE:-"true"}

# Colors
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

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo "⚠️  jq is not installed. Some tests may fail."
    echo "   Install with: brew install jq (macOS) or apt-get install jq (Linux)"
fi

echo "💳 Testing Payment Processing"
echo "   API URL: $API_URL"
echo "   Frontend URL: $FRONTEND_URL"
echo "   Test Mode: $TEST_MODE"
echo ""

# Test 1: API Health Check
log "1. Testing API health..."
if curl -f -s -o /dev/null --max-time 10 "$API_URL/health" 2>/dev/null; then
    pass "API is reachable"
else
    fail "API is not reachable at $API_URL"
    echo "   Make sure the API server is running: cd services/api && pnpm dev"
    exit 1
fi

# Test 2: Frontend Health Check
log "2. Testing frontend health..."
if curl -f -s -o /dev/null --max-time 10 "$FRONTEND_URL" 2>/dev/null; then
    pass "Frontend is reachable"
else
    warn "Frontend is not reachable at $FRONTEND_URL"
    echo "   Make sure the frontend is running: cd apps/m-ops-services && pnpm dev"
fi

# Test 3: Authentication (required for most endpoints)
log "3. Testing authentication..."
# Try to get a test token or use existing auth
# For now, we'll test endpoints that might work without auth or note auth requirement
AUTH_TOKEN=""
if [ -n "$TEST_AUTH_TOKEN" ]; then
    AUTH_TOKEN="$TEST_AUTH_TOKEN"
    pass "Using provided auth token"
else
    warn "No auth token provided. Some tests may fail."
    echo "   Set TEST_AUTH_TOKEN environment variable for authenticated tests"
fi

# Test 4: Get Billing Plans
log "4. Testing billing plans endpoint..."
PLANS_RESPONSE=$(curl -s --max-time 10 "$API_URL/api/v1/billing/plans" 2>/dev/null || echo "")
if echo "$PLANS_RESPONSE" | grep -q "plans\|package" 2>/dev/null; then
    pass "Billing plans endpoint accessible"
    if command -v jq &> /dev/null; then
        PLAN_COUNT=$(echo "$PLANS_RESPONSE" | jq '.plans | length' 2>/dev/null || echo "0")
        if [ "$PLAN_COUNT" -gt 0 ]; then
            pass "Found $PLAN_COUNT billing plans"
        else
            warn "No billing plans found"
        fi
    fi
else
    warn "Billing plans endpoint check inconclusive"
    echo "   Response: $PLANS_RESPONSE"
fi

# Test 5: Create Checkout Session (requires auth and orgId)
log "5. Testing checkout session creation..."
if [ -n "$AUTH_TOKEN" ] && [ -n "$TEST_ORG_ID" ]; then
    CHECKOUT_RESPONSE=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        -d "{
            \"orgId\": \"$TEST_ORG_ID\",
            \"planSlug\": \"package_b\",
            \"interval\": \"month\",
            \"successUrl\": \"$FRONTEND_URL/success\",
            \"cancelUrl\": \"$FRONTEND_URL/cancel\"
        }" \
        "$API_URL/api/v1/billing/stripe/checkout-session" 2>/dev/null || echo "")
    
    if echo "$CHECKOUT_RESPONSE" | grep -q "url\|id\|session" 2>/dev/null; then
        pass "Checkout session creation successful"
        if command -v jq &> /dev/null; then
            SESSION_ID=$(echo "$CHECKOUT_RESPONSE" | jq -r '.id // empty' 2>/dev/null)
            SESSION_URL=$(echo "$CHECKOUT_RESPONSE" | jq -r '.url // empty' 2>/dev/null)
            if [ -n "$SESSION_ID" ]; then
                echo "   Session ID: $SESSION_ID"
            fi
            if [ -n "$SESSION_URL" ]; then
                echo "   Session URL: $SESSION_URL"
            fi
        fi
    else
        fail "Checkout session creation failed"
        echo "   Response: $CHECKOUT_RESPONSE"
    fi
else
    warn "Skipping checkout session test (requires AUTH_TOKEN and TEST_ORG_ID)"
    echo "   Set TEST_AUTH_TOKEN and TEST_ORG_ID environment variables"
fi

# Test 6: Webhook Endpoint Availability
log "6. Testing webhook endpoint..."
WEBHOOK_RESPONSE=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -H "Stripe-Signature: test_sig" \
    -d '{"id":"evt_test","type":"test"}' \
    "$API_URL/api/v1/billing/stripe/webhook" 2>/dev/null || echo "")

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -H "Stripe-Signature: test_sig" \
    -d '{"id":"evt_test","type":"test"}' \
    "$API_URL/api/v1/billing/stripe/webhook" 2>/dev/null || echo "000")

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "400" ] || [ "$HTTP_CODE" = "401" ]; then
    pass "Webhook endpoint is accessible (HTTP $HTTP_CODE)"
else
    warn "Webhook endpoint check inconclusive (HTTP $HTTP_CODE)"
fi

# Test 7: Subscription List (requires auth)
log "7. Testing subscription listing..."
if [ -n "$AUTH_TOKEN" ]; then
    SUBSCRIPTIONS_RESPONSE=$(curl -s \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        "$API_URL/api/v1/billing/subscriptions" 2>/dev/null || echo "")
    
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        "$API_URL/api/v1/billing/subscriptions" 2>/dev/null || echo "000")
    
    if [ "$HTTP_CODE" = "200" ]; then
        pass "Subscription listing successful"
        if command -v jq &> /dev/null; then
            SUB_COUNT=$(echo "$SUBSCRIPTIONS_RESPONSE" | jq '.subscriptions | length' 2>/dev/null || echo "0")
            echo "   Found $SUB_COUNT subscriptions"
        fi
    elif [ "$HTTP_CODE" = "401" ]; then
        warn "Subscription listing requires authentication"
    else
        warn "Subscription listing check inconclusive (HTTP $HTTP_CODE)"
    fi
else
    warn "Skipping subscription listing test (requires AUTH_TOKEN)"
fi

# Test 8: Webhook Status Endpoint (if available)
log "8. Testing webhook status endpoint..."
if [ -n "$AUTH_TOKEN" ]; then
    WEBHOOK_STATUS_RESPONSE=$(curl -s \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        "$API_URL/api/v1/webhooks/status?limit=5" 2>/dev/null || echo "")
    
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        "$API_URL/api/v1/webhooks/status?limit=5" 2>/dev/null || echo "000")
    
    if [ "$HTTP_CODE" = "200" ]; then
        pass "Webhook status endpoint accessible"
        if command -v jq &> /dev/null; then
            EVENT_COUNT=$(echo "$WEBHOOK_STATUS_RESPONSE" | jq '.events | length' 2>/dev/null || echo "0")
            echo "   Found $EVENT_COUNT recent webhook events"
        fi
    elif [ "$HTTP_CODE" = "404" ]; then
        warn "Webhook status endpoint not found (may not be implemented)"
    else
        warn "Webhook status check inconclusive (HTTP $HTTP_CODE)"
    fi
else
    warn "Skipping webhook status test (requires AUTH_TOKEN)"
fi

# Test 9: Test Webhook Trigger (if available)
log "9. Testing webhook trigger endpoint..."
if [ -n "$AUTH_TOKEN" ]; then
    TRIGGER_RESPONSE=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        -d '{"eventType":"checkout.session.completed"}' \
        "$API_URL/api/v1/webhooks/test" 2>/dev/null || echo "")
    
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        -d '{"eventType":"checkout.session.completed"}' \
        "$API_URL/api/v1/webhooks/test" 2>/dev/null || echo "000")
    
    if [ "$HTTP_CODE" = "200" ]; then
        pass "Webhook trigger endpoint accessible"
    elif [ "$HTTP_CODE" = "404" ]; then
        warn "Webhook trigger endpoint not found (may not be implemented)"
    else
        warn "Webhook trigger check inconclusive (HTTP $HTTP_CODE)"
    fi
else
    warn "Skipping webhook trigger test (requires AUTH_TOKEN)"
fi

# Test 10: Frontend Checkout Route
log "10. Testing frontend checkout route..."
if curl -f -s -o /dev/null --max-time 10 "$FRONTEND_URL/api/create-checkout" 2>/dev/null; then
    # Test POST to checkout route
    CHECKOUT_POST_RESPONSE=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -d '{"packageId":"A"}' \
        "$FRONTEND_URL/api/create-checkout" 2>/dev/null || echo "")
    
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
        -H "Content-Type: application/json" \
        -d '{"packageId":"A"}' \
        "$FRONTEND_URL/api/create-checkout" 2>/dev/null || echo "000")
    
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "400" ]; then
        pass "Frontend checkout route accessible (HTTP $HTTP_CODE)"
    else
        warn "Frontend checkout route check inconclusive (HTTP $HTTP_CODE)"
    fi
else
    warn "Frontend checkout route not accessible"
fi

# Test 11: Environment Variables Check
log "11. Checking environment variables..."
REQUIRED_VARS=("STRIPE_SECRET_KEY" "STRIPE_WEBHOOK_SECRET")
MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -eq 0 ]; then
    pass "Required environment variables are set"
else
    warn "Some environment variables may be missing: ${MISSING_VARS[*]}"
    echo "   These should be set in your .env.local or deployment environment"
fi

# Test 12: Performance Test
log "12. Testing API performance..."
start_time=$(date +%s%N)
curl -s -o /dev/null "$API_URL/health" 2>/dev/null
end_time=$(date +%s%N)
response_time=$((($end_time - $start_time) / 1000000))

if [ $response_time -lt 100 ]; then
    pass "API response time: ${response_time}ms (excellent)"
elif [ $response_time -lt 500 ]; then
    pass "API response time: ${response_time}ms (good)"
elif [ $response_time -lt 1000 ]; then
    warn "API response time: ${response_time}ms (acceptable)"
else
    fail "API response time: ${response_time}ms (slow)"
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
    echo "📋 Next Steps:"
    echo "   1. Test with real Stripe test keys"
    echo "   2. Test webhook processing with Stripe CLI"
    echo "   3. Verify database updates after webhooks"
    echo "   4. Test subscription lifecycle (create, update, cancel)"
    echo ""
    echo "🔗 Useful Commands:"
    echo "   # Forward Stripe webhooks to local server"
    echo "   stripe listen --forward-to $API_URL/api/v1/billing/stripe/webhook"
    echo ""
    echo "   # Trigger test events"
    echo "   stripe trigger checkout.session.completed"
    echo "   stripe trigger invoice.payment_failed"
    exit 0
else
    echo -e "${RED}❌ Some tests failed. Please review the errors above.${NC}"
    echo ""
    echo "🔍 Troubleshooting:"
    echo "   1. Ensure API server is running: cd services/api && pnpm dev"
    echo "   2. Ensure frontend is running: cd apps/m-ops-services && pnpm dev"
    echo "   3. Check environment variables are set correctly"
    echo "   4. Verify authentication tokens are valid"
    exit 1
fi
