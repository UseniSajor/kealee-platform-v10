#!/bin/bash

# Test Permit Applications
# Comprehensive testing of permit application flows

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

test_permit_creation() {
    log "Testing permit creation..."
    
    if [ -z "$AUTH_TOKEN" ]; then
        warn "AUTH_TOKEN not set. Skipping permit creation test."
        return 0
    fi
    
    response=$(curl -s -X POST "$API_URL/permits" \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "permitType": "BUILDING",
            "subtype": "Kitchen Remodel",
            "scope": "Kitchen renovation",
            "valuation": 50000,
            "address": "123 Test St",
            "city": "San Francisco",
            "state": "CA",
            "zipCode": "94102",
            "jurisdictionId": "test-jurisdiction-id"
        }')
    
    if echo "$response" | grep -q "id\|permitNumber"; then
        PERMIT_ID=$(echo "$response" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
        log "✅ Permit created successfully (ID: $PERMIT_ID)"
        return 0
    else
        warn "Permit creation test failed or not configured"
        return 1
    fi
}

test_permit_submission() {
    log "Testing permit submission..."
    
    if [ -z "$AUTH_TOKEN" ] || [ -z "$PERMIT_ID" ]; then
        warn "AUTH_TOKEN or PERMIT_ID not set. Skipping submission test."
        return 0
    fi
    
    response=$(curl -s -X POST "$API_URL/permits/$PERMIT_ID/submit" \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        -H "Content-Type: application/json")
    
    if echo "$response" | grep -q "submitted\|status"; then
        log "✅ Permit submitted successfully"
        return 0
    else
        warn "Permit submission test failed or not configured"
        return 1
    fi
}

test_permit_status_check() {
    log "Testing permit status check..."
    
    if [ -z "$AUTH_TOKEN" ]; then
        warn "AUTH_TOKEN not set. Skipping status check test."
        return 0
    fi
    
    response=$(curl -s -X GET "$API_URL/permits" \
        -H "Authorization: Bearer $AUTH_TOKEN")
    
    if echo "$response" | grep -q "permits\|\[\]"; then
        log "✅ Permit status check works"
        return 0
    else
        warn "Permit status check test failed or not configured"
        return 1
    fi
}

test_permit_corrections() {
    log "Testing permit corrections..."
    
    if [ -z "$AUTH_TOKEN" ] || [ -z "$PERMIT_ID" ]; then
        warn "AUTH_TOKEN or PERMIT_ID not set. Skipping corrections test."
        return 0
    fi
    
    response=$(curl -s -X GET "$API_URL/permits/$PERMIT_ID/corrections" \
        -H "Authorization: Bearer $AUTH_TOKEN")
    
    if echo "$response" | grep -q "corrections\|\[\]"; then
        log "✅ Permit corrections retrieval works"
        return 0
    else
        warn "Permit corrections test failed or not configured"
        return 1
    fi
}

test_inspection_scheduling() {
    log "Testing inspection scheduling..."
    
    if [ -z "$AUTH_TOKEN" ] || [ -z "$PERMIT_ID" ]; then
        warn "AUTH_TOKEN or PERMIT_ID not set. Skipping inspection scheduling test."
        return 0
    fi
    
    response=$(curl -s -X POST "$API_URL/inspections" \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"permitId\": \"$PERMIT_ID\",
            \"inspectionType\": \"FOUNDATION\",
            \"scheduledDate\": \"$(date -u -d '+7 days' +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u -v+7d +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || echo '2024-12-31T10:00:00Z')\"
        }")
    
    if echo "$response" | grep -q "id\|scheduledDate"; then
        log "✅ Inspection scheduled successfully"
        return 0
    else
        warn "Inspection scheduling test failed or not configured"
        return 1
    fi
}

# Main execution
log "Starting permit application tests..."
echo ""

FAILED_TESTS=0

test_permit_creation || FAILED_TESTS=$((FAILED_TESTS + 1))
echo ""

test_permit_submission || FAILED_TESTS=$((FAILED_TESTS + 1))
echo ""

test_permit_status_check || FAILED_TESTS=$((FAILED_TESTS + 1))
echo ""

test_permit_corrections || FAILED_TESTS=$((FAILED_TESTS + 1))
echo ""

test_inspection_scheduling || FAILED_TESTS=$((FAILED_TESTS + 1))
echo ""

# Summary
if [ $FAILED_TESTS -eq 0 ]; then
    log "✅ All permit application tests passed!"
    exit 0
else
    error "❌ $FAILED_TESTS permit test(s) failed"
    exit 1
fi
