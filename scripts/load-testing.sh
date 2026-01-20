#!/bin/bash

# Load Testing Script
# Tests system under various load conditions

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

API_URL=${API_URL:-http://localhost:3001}
CONCURRENT_USERS=${CONCURRENT_USERS:-10}
REQUESTS_PER_USER=${REQUESTS_PER_USER:-100}

log() {
    echo -e "${GREEN}[LOAD TEST]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Check if Apache Bench or similar is available
if command -v ab &> /dev/null; then
    LOAD_TEST_TOOL="ab"
elif command -v wrk &> /dev/null; then
    LOAD_TEST_TOOL="wrk"
elif command -v k6 &> /dev/null; then
    LOAD_TEST_TOOL="k6"
else
    warn "No load testing tool found. Install 'ab' (Apache Bench), 'wrk', or 'k6'"
    warn "Creating load test script template..."
    
    cat > scripts/load-test-k6.js <<'EOF'
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 10 },  // Ramp up to 10 users
    { duration: '1m', target: 10 },   // Stay at 10 users
    { duration: '30s', target: 50 },  // Ramp up to 50 users
    { duration: '1m', target: 50 },   // Stay at 50 users
    { duration: '30s', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests should be below 2s
    http_req_failed: ['rate<0.01'],     // Error rate should be less than 1%
  },
};

const API_URL = __ENV.API_URL || 'http://localhost:3001';

export default function () {
  // Test health endpoint
  let res = http.get(`${API_URL}/health`);
  check(res, {
    'health check status is 200': (r) => r.status === 200,
    'health check response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);

  // Test API endpoints
  res = http.get(`${API_URL}/projects`);
  check(res, {
    'projects endpoint status is 200 or 401': (r) => r.status === 200 || r.status === 401,
    'projects response time < 1000ms': (r) => r.timings.duration < 1000,
  });

  sleep(1);
}
EOF
    
    log "Created k6 load test script: scripts/load-test-k6.js"
    log "Install k6: https://k6.io/docs/getting-started/installation/"
    log "Run: k6 run scripts/load-test-k6.js"
    exit 0
fi

log "Starting load tests..."
log "API URL: $API_URL"
log "Concurrent users: $CONCURRENT_USERS"
log "Requests per user: $REQUESTS_PER_USER"
echo ""

# Test 1: Health endpoint
log "Test 1: Health endpoint load test..."
if [ "$LOAD_TEST_TOOL" = "ab" ]; then
    ab -n $((CONCURRENT_USERS * REQUESTS_PER_USER)) -c $CONCURRENT_USERS "$API_URL/health" > /tmp/load-test-health.txt 2>&1 || true
    cat /tmp/load-test-health.txt | grep -E "Requests per second|Time per request|Failed requests" || warn "Load test results not available"
elif [ "$LOAD_TEST_TOOL" = "wrk" ]; then
    wrk -t$CONCURRENT_USERS -c$CONCURRENT_USERS -d30s "$API_URL/health" || warn "Load test failed"
fi
echo ""

# Test 2: API endpoints
log "Test 2: API endpoints load test..."
if [ "$LOAD_TEST_TOOL" = "ab" ]; then
    ab -n $((CONCURRENT_USERS * REQUESTS_PER_USER)) -c $CONCURRENT_USERS "$API_URL/projects" > /tmp/load-test-api.txt 2>&1 || true
    cat /tmp/load-test-api.txt | grep -E "Requests per second|Time per request|Failed requests" || warn "Load test results not available"
elif [ "$LOAD_TEST_TOOL" = "wrk" ]; then
    wrk -t$CONCURRENT_USERS -c$CONCURRENT_USERS -d30s "$API_URL/projects" || warn "Load test failed"
fi
echo ""

log "✅ Load testing complete!"
log ""
log "Results saved to:"
log "- /tmp/load-test-health.txt"
log "- /tmp/load-test-api.txt"
log ""
log "Review results and optimize based on findings."
