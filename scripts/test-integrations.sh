#!/bin/bash

# Integration Tests Script
# Tests all integrations: API, payments, file uploads, subscriptions, permits

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

API_URL=${API_URL:-http://localhost:3001}
AUTH_TOKEN=${AUTH_TOKEN:-""}

log() {
    echo -e "${GREEN}[TEST]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

test_api_connectivity() {
    log "Testing API connectivity..."
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/health" || echo "000")
    
    if [ "$response" = "200" ]; then
        log "✅ API is accessible"
        return 0
    else
        error "❌ API is not accessible (HTTP $response)"
        return 1
    fi
}

test_file_upload() {
    log "Testing file upload..."
    
    if [ -z "$AUTH_TOKEN" ]; then
        warn "AUTH_TOKEN not set. Skipping file upload test."
        return 0
    fi
    
    # Create test file
    echo "Test file content" > /tmp/test-upload.txt
    
    # Test presigned URL generation
    response=$(curl -s -X POST "$API_URL/files/presigned-url" \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "fileName": "test-upload.txt",
            "mimeType": "text/plain",
            "fileSize": 20
        }')
    
    if echo "$response" | grep -q "uploadUrl"; then
        log "✅ File upload presigned URL generation works"
        rm -f /tmp/test-upload.txt
        return 0
    else
        warn "File upload test failed or not configured"
        rm -f /tmp/test-upload.txt
        return 1
    fi
}

test_payment_flow() {
    log "Testing payment flow..."
    
    if [ -z "$AUTH_TOKEN" ]; then
        warn "AUTH_TOKEN not set. Skipping payment flow test."
        return 0
    fi
    
    # Test payment intent creation
    response=$(curl -s -X POST "$API_URL/payments/intents" \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "amount": 10.00,
            "currency": "usd",
            "description": "Test payment"
        }')
    
    if echo "$response" | grep -q "clientSecret\|paymentIntentId"; then
        log "✅ Payment intent creation works"
        return 0
    else
        warn "Payment flow test failed or not configured"
        return 1
    fi
}

test_subscription_flow() {
    log "Testing subscription flow..."
    
    if [ -z "$AUTH_TOKEN" ]; then
        warn "AUTH_TOKEN not set. Skipping subscription flow test."
        return 0
    fi
    
    # Test subscription listing
    response=$(curl -s -X GET "$API_URL/billing/subscriptions" \
        -H "Authorization: Bearer $AUTH_TOKEN")
    
    if echo "$response" | grep -q "subscriptions\|\[\]"; then
        log "✅ Subscription API is accessible"
        return 0
    else
        warn "Subscription flow test failed or not configured"
        return 1
    fi
}

test_permit_flow() {
    log "Testing permit flow..."
    
    if [ -z "$AUTH_TOKEN" ]; then
        warn "AUTH_TOKEN not set. Skipping permit flow test."
        return 0
    fi
    
    # Test permit listing
    response=$(curl -s -X GET "$API_URL/permits" \
        -H "Authorization: Bearer $AUTH_TOKEN")
    
    if echo "$response" | grep -q "permits\|\[\]"; then
        log "✅ Permit API is accessible"
        return 0
    else
        warn "Permit flow test failed or not configured"
        return 1
    fi
}

# Main execution
log "Starting integration tests..."
echo ""

FAILED_TESTS=0

test_api_connectivity || FAILED_TESTS=$((FAILED_TESTS + 1))
echo ""

test_file_upload || FAILED_TESTS=$((FAILED_TESTS + 1))
echo ""

test_payment_flow || FAILED_TESTS=$((FAILED_TESTS + 1))
echo ""

test_subscription_flow || FAILED_TESTS=$((FAILED_TESTS + 1))
echo ""

test_permit_flow || FAILED_TESTS=$((FAILED_TESTS + 1))
echo ""

# Summary
if [ $FAILED_TESTS -eq 0 ]; then
    log "✅ All integration tests passed!"
    exit 0
else
    error "❌ $FAILED_TESTS integration test(s) failed"
    exit 1
fi
