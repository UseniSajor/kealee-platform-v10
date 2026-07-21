#!/bin/bash
# scripts/test-all-api-endpoints.sh
# Comprehensive API endpoint testing script

set -e

# Configuration
BASE_URL=${BASE_URL:-"http://localhost:3001"}
API_PREFIX=${API_PREFIX:-""}  # Can be "/api/v1" if needed
AUTH_TOKEN=${AUTH_TOKEN:-""}
TEST_RESULTS_DIR=${TEST_RESULTS_DIR:-"test-results"}

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
SKIPPED_TESTS=0

# Create test results directory
mkdir -p "$TEST_RESULTS_DIR"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
TEST_REPORT="$TEST_RESULTS_DIR/api-test-report-$TIMESTAMP.json"
SUMMARY_REPORT="$TEST_RESULTS_DIR/summary-$TIMESTAMP.md"

log() {
    echo -e "${BLUE}[TEST]${NC} $1"
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

# Initialize test results JSON
echo '{"timestamp": "'$(date -Iseconds)'", "base_url": "'$BASE_URL'", "tests": []}' > "$TEST_REPORT"

# Function to run a test
run_test() {
    local endpoint=$1
    local method=$2
    local requires_auth=${3:-false}
    local test_data=${4:-"{}"}
    local test_name="${method} ${endpoint}"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    # Skip if requires auth and no token
    if [ "$requires_auth" = "true" ] && [ -z "$AUTH_TOKEN" ]; then
        warn "Skipping $test_name (requires authentication)"
        SKIPPED_TESTS=$((SKIPPED_TESTS + 1))
        return
    fi
    
    log "Testing: $test_name"
    
    # Replace path parameters with test values
    local test_endpoint="$endpoint"
    test_endpoint=${test_endpoint/\{id\}/test_id_123}
    test_endpoint=${test_endpoint/\{orgId\}/test_org_123}
    test_endpoint=${test_endpoint/\{userId\}/test_user_123}
    test_endpoint=${test_endpoint/\{projectId\}/test_project_123}
    
    local url="$BASE_URL$API_PREFIX$test_endpoint"
    local start_time=$(date +%s%N)
    
    # Build curl command
    local curl_cmd="curl -s -w \"\n%{http_code}\" --max-time 10"
    
    # Add headers
    if [ -n "$AUTH_TOKEN" ]; then
        curl_cmd="$curl_cmd -H \"Authorization: Bearer $AUTH_TOKEN\""
    fi
    curl_cmd="$curl_cmd -H \"Content-Type: application/json\""
    
    # Add method and data
    if [ "$method" = "GET" ]; then
        curl_cmd="$curl_cmd \"$url\""
    elif [ "$method" = "POST" ] || [ "$method" = "PATCH" ] || [ "$method" = "PUT" ]; then
        curl_cmd="$curl_cmd -X $method -d '$test_data' \"$url\""
    elif [ "$method" = "DELETE" ]; then
        curl_cmd="$curl_cmd -X DELETE \"$url\""
    fi
    
    # Execute request
    local response=$(eval $curl_cmd 2>&1 || echo "ERROR\n000")
    local end_time=$(date +%s%N)
    local duration=$((($end_time - $start_time) / 1000000))
    
    # Parse response
    local http_code=$(echo "$response" | tail -n1)
    local body=$(echo "$response" | sed '$d')
    
    # Determine test status
    local status="failed"
    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 400 ]; then
        status="passed"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        success "$test_name: HTTP $http_code (${duration}ms)"
    elif [ "$http_code" -eq 401 ] || [ "$http_code" -eq 403 ]; then
        status="auth_required"
        SKIPPED_TESTS=$((SKIPPED_TESTS + 1))
        warn "$test_name: Authentication required (HTTP $http_code)"
    elif [ "$http_code" -eq 404 ]; then
        status="not_found"
        SKIPPED_TESTS=$((SKIPPED_TESTS + 1))
        warn "$test_name: Not found (HTTP $http_code)"
    elif [ "$http_code" -eq 429 ]; then
        status="rate_limited"
        SKIPPED_TESTS=$((SKIPPED_TESTS + 1))
        warn "$test_name: Rate limited (HTTP $http_code)"
    else
        status="failed"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        fail "$test_name: HTTP $http_code (${duration}ms)"
    fi
    
    # Add to test results (using jq if available, otherwise append manually)
    if command -v jq &> /dev/null; then
        jq --arg name "$test_name" \
           --arg status "$status" \
           --argjson duration "$duration" \
           --argjson code "$http_code" \
           --arg url "$url" \
           --arg body "$body" \
           '.tests += [{
              name: $name,
              status: $status,
              duration_ms: $duration,
              http_code: $code,
              url: $url,
              response_body: $body,
              timestamp: "'$(date -Iseconds)'"
           }]' "$TEST_REPORT" > tmp.json && mv tmp.json "$TEST_REPORT"
    else
        # Fallback: append as JSON manually
        echo "  {\"name\":\"$test_name\",\"status\":\"$status\",\"duration_ms\":$duration,\"http_code\":$http_code,\"url\":\"$url\"}," >> "$TEST_REPORT.tmp"
    fi
    
    # Small delay to avoid rate limiting
    sleep 0.1
}

echo "🔧 Testing All API Endpoints"
echo "   Base URL: $BASE_URL"
echo "   API Prefix: $API_PREFIX"
echo "   Auth Token: ${AUTH_TOKEN:0:20}..." 2>/dev/null || echo "   Auth Token: (not set)"
echo ""

# Test health endpoint first
log "Testing health endpoint..."
run_test "/health" "GET" false

# Authentication endpoints
log "Testing authentication endpoints..."
run_test "/auth/signup" "POST" false '{"email":"test@example.com","password":"test123456","name":"Test User"}'
run_test "/auth/login" "POST" false '{"email":"test@example.com","password":"test123456"}'
run_test "/auth/me" "GET" true
run_test "/auth/verify" "POST" false '{"token":"test_token"}'
run_test "/auth/logout" "POST" true

# User endpoints
log "Testing user endpoints..."
run_test "/users" "GET" true
run_test "/users/{id}" "GET" true
run_test "/users/{id}" "PUT" true '{"name":"Updated Name"}'
run_test "/users/{id}/orgs" "GET" true

# Organization endpoints
log "Testing organization endpoints..."
run_test "/orgs" "GET" true
run_test "/orgs" "POST" true '{"name":"Test Org","slug":"test-org"}'
run_test "/orgs/{id}" "GET" true
run_test "/orgs/{id}" "PUT" true '{"name":"Updated Org"}'
run_test "/orgs/{id}/members" "POST" true '{"userId":"test_user_123","role":"MEMBER"}'
run_test "/orgs/{id}/members/{userId}" "DELETE" true
run_test "/orgs/my" "GET" true

# RBAC endpoints
log "Testing RBAC endpoints..."
run_test "/rbac/roles" "GET" false
run_test "/rbac/roles" "POST" true '{"key":"test_role","name":"Test Role"}'
run_test "/rbac/roles/{id}" "GET" false
run_test "/rbac/permissions" "GET" false
run_test "/rbac/permissions" "POST" true '{"key":"test_perm","name":"Test Permission"}'
run_test "/rbac/check" "POST" true '{"userId":"test_user_123","permission":"test_perm"}'

# Entitlement endpoints
log "Testing entitlement endpoints..."
run_test "/entitlements/orgs/{orgId}" "GET" true
run_test "/entitlements/orgs/{orgId}/modules/{moduleKey}/enable" "POST" true
run_test "/entitlements/check" "POST" true '{"orgId":"test_org_123","moduleKey":"test_module"}'

# Event endpoints
log "Testing event endpoints..."
run_test "/events" "GET" true
run_test "/events" "POST" true '{"type":"test_event","data":{"test":true}}'
run_test "/events/{id}" "GET" true

# Audit endpoints
log "Testing audit endpoints..."
run_test "/audit" "GET" true
run_test "/audit" "POST" true '{"action":"TEST_ACTION","entityType":"test","entityId":"test_123"}'

# Billing endpoints
log "Testing billing endpoints..."
run_test "/billing/plans" "GET" false
run_test "/billing/stripe/checkout-session" "POST" true '{"orgId":"test_org_123","planSlug":"package_b","interval":"month","successUrl":"http://localhost:3000/success","cancelUrl":"http://localhost:3000/cancel"}'
run_test "/billing/subscriptions" "GET" true
run_test "/billing/subscriptions/me" "GET" true

# Project endpoints
log "Testing project endpoints..."
run_test "/projects" "GET" true
run_test "/projects" "POST" true '{"name":"Test Project","category":"KITCHEN"}'
run_test "/projects/{id}" "GET" true
run_test "/projects/{id}" "PATCH" true '{"name":"Updated Project"}'
run_test "/projects/{id}" "DELETE" true

# Property endpoints
log "Testing property endpoints..."
run_test "/properties" "GET" true
run_test "/properties" "POST" true '{"address":"123 Test St","orgId":"test_org_123"}'
run_test "/properties/{id}" "GET" true

# Webhook endpoints
log "Testing webhook endpoints..."
run_test "/api/v1/webhooks/status" "GET" true
run_test "/api/v1/webhooks/test" "POST" true '{"eventType":"checkout.session.completed"}'
run_test "/billing/stripe/webhook" "POST" false '{"id":"evt_test","type":"test"}'

# PM endpoints
log "Testing PM endpoints..."
run_test "/pm/tasks" "GET" true
run_test "/pm/tasks" "POST" true '{"title":"Test Task","assignedTo":"test_user_123"}'

# Marketplace endpoints
log "Testing marketplace endpoints..."
run_test "/marketplace/profiles" "GET" false
run_test "/marketplace/leads" "GET" true
run_test "/marketplace/leads" "POST" true '{"category":"plumbing","description":"Test lead","location":"Test City"}'

# Permit endpoints
log "Testing permit endpoints..."
run_test "/permits/jurisdictions" "GET" false
run_test "/permits/applications" "GET" true
run_test "/permits/applications" "POST" true '{"projectId":"test_project_123","jurisdictionId":"test_jurisdiction_123"}'

# File endpoints
log "Testing file endpoints..."
run_test "/files" "GET" true
run_test "/files/upload" "POST" true '{"fileName":"test.pdf","fileType":"application/pdf"}'

# Generate summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Test Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Total tests: $TOTAL_TESTS"
echo -e "${GREEN}✅ Passed:${NC} $PASSED_TESTS"
echo -e "${RED}❌ Failed:${NC} $FAILED_TESTS"
echo -e "${YELLOW}⏭️  Skipped:${NC} $SKIPPED_TESTS"

# Calculate success rate
if [ $TOTAL_TESTS -gt 0 ]; then
    SUCCESS_RATE=$((PASSED_TESTS * 100 / TOTAL_TESTS))
    echo "Success rate: ${SUCCESS_RATE}%"
fi

# Calculate average response time (if jq available)
if command -v jq &> /dev/null; then
    AVG_RESPONSE_TIME=$(jq '[.tests[] | select(.duration_ms != null) | .duration_ms] | add / length | floor' "$TEST_REPORT" 2>/dev/null || echo "0")
    echo "Average response time: ${AVG_RESPONSE_TIME}ms"
fi

# Generate markdown summary
cat > "$SUMMARY_REPORT" << EOF
# API Test Report

**Generated:** $(date)
**Base URL:** $BASE_URL
**API Prefix:** $API_PREFIX

## Executive Summary

- **Total Tests:** $TOTAL_TESTS
- **Passed:** $PASSED_TESTS
- **Failed:** $FAILED_TESTS
- **Skipped:** $SKIPPED_TESTS
- **Success Rate:** ${SUCCESS_RATE}%

## Test Results

### Passed Tests
$(if command -v jq &> /dev/null; then
    jq -r '.tests[] | select(.status == "passed") | "- **\(.name)**: HTTP \(.http_code) (\(.duration_ms)ms)"' "$TEST_REPORT" 2>/dev/null || echo "No passed tests"
else
    echo "Install jq for detailed results"
fi)

### Failed Tests
$(if command -v jq &> /dev/null; then
    jq -r '.tests[] | select(.status == "failed") | "- **\(.name)**: HTTP \(.http_code)"' "$TEST_REPORT" 2>/dev/null || echo "No failed tests"
else
    echo "Install jq for detailed results"
fi)

### Authentication Required
$(if command -v jq &> /dev/null; then
    jq -r '.tests[] | select(.status == "auth_required") | "- **\(.name)**"' "$TEST_REPORT" 2>/dev/null || echo "No auth-required tests"
else
    echo "Install jq for detailed results"
fi)

## Performance

$(if command -v jq &> /dev/null; then
    echo "### Slow Endpoints (>1000ms)"
    jq -r '.tests[] | select(.duration_ms > 1000) | "- **\(.name)**: \(.duration_ms)ms"' "$TEST_REPORT" 2>/dev/null || echo "No slow endpoints"
else
    echo "Install jq for performance analysis"
fi)

## Recommendations

1. **Failed Endpoints**: Investigate and fix failed endpoints
2. **Authentication**: Set AUTH_TOKEN environment variable for authenticated tests
3. **Performance**: Optimize endpoints with response time >1000ms
4. **Rate Limiting**: Review rate limiting configuration if many 429 responses

## Full Results

Detailed JSON results available in: \`$TEST_REPORT\`

EOF

echo ""
echo "✅ API endpoint testing completed!"
echo "📄 Summary report: $SUMMARY_REPORT"
echo "📊 Detailed results: $TEST_REPORT"
echo ""

if [ $FAILED_TESTS -gt 0 ]; then
    exit 1
else
    exit 0
fi
