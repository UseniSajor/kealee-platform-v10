#!/bin/bash
# scripts/run-api-tests.sh
# Complete workflow: Start API, get token, run tests, review results

set -e

API_URL=${API_URL:-"http://localhost:3001"}
TEST_EMAIL=${TEST_EMAIL:-"test@example.com"}
TEST_PASSWORD=${TEST_PASSWORD:-"test123456"}
SKIP_START=${SKIP_START:-"false"}
SKIP_AUTH=${SKIP_AUTH:-"false"}

echo "🚀 API Testing Workflow"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Step 1: Start API server (if not already running)
if [ "$SKIP_START" != "true" ]; then
    echo "1️⃣  Starting API server..."
    
    # Check if API is already running
    if curl -f -s -o /dev/null --max-time 2 "$API_URL/health" 2>/dev/null; then
        echo "✅ API server is already running"
    else
        echo "   Starting API server in background..."
        cd services/api
        pnpm dev > /tmp/api-server.log 2>&1 &
        API_PID=$!
        echo "   API server started (PID: $API_PID)"
        
        # Wait for server to be ready
        echo "   Waiting for server to be ready..."
        for i in {1..30}; do
            if curl -f -s -o /dev/null --max-time 2 "$API_URL/health" 2>/dev/null; then
                echo "✅ API server is ready"
                break
            fi
            if [ $i -eq 30 ]; then
                echo "❌ API server failed to start after 30 seconds"
                echo "   Check logs: tail -f /tmp/api-server.log"
                kill $API_PID 2>/dev/null || true
                exit 1
            fi
            sleep 1
        done
        cd ../..
    fi
else
    echo "1️⃣  Skipping API server start (SKIP_START=true)"
fi

# Step 2: Get authentication token
if [ "$SKIP_AUTH" != "true" ]; then
    echo ""
    echo "2️⃣  Getting authentication token..."
    export AUTH_TOKEN=$(./scripts/get-auth-token.sh 2>/dev/null | grep -A 1 "Access Token:" | tail -n1 | xargs || echo "")
    
    if [ -n "$AUTH_TOKEN" ] && [ "$AUTH_TOKEN" != "null" ]; then
        echo "✅ Authentication token obtained"
        echo "   Token: ${AUTH_TOKEN:0:20}..."
    else
        echo "⚠️  Could not get authentication token"
        echo "   Some tests may be skipped"
        unset AUTH_TOKEN
    fi
else
    echo "2️⃣  Skipping authentication (SKIP_AUTH=true)"
    if [ -z "$AUTH_TOKEN" ]; then
        echo "   No AUTH_TOKEN set, some tests will be skipped"
    fi
fi

# Step 3: Run API tests
echo ""
echo "3️⃣  Running API endpoint tests..."
BASE_URL="$API_URL" ./scripts/test-all-api-endpoints.sh
TEST_EXIT_CODE=$?

# Step 4: Review results
echo ""
echo "4️⃣  Test Results Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Find latest test report
LATEST_REPORT=$(ls -t test-results/api-test-report-*.json 2>/dev/null | head -n1)
LATEST_SUMMARY=$(ls -t test-results/summary-*.md 2>/dev/null | head -n1)

if [ -n "$LATEST_REPORT" ] && command -v jq &> /dev/null; then
    TOTAL=$(jq '.tests | length' "$LATEST_REPORT")
    PASSED=$(jq '[.tests[] | select(.status == "passed")] | length' "$LATEST_REPORT")
    FAILED=$(jq '[.tests[] | select(.status == "failed")] | length' "$LATEST_REPORT")
    SUCCESS_RATE=$((PASSED * 100 / TOTAL))
    
    echo "📊 Results:"
    echo "   Total: $TOTAL"
    echo "   Passed: $PASSED"
    echo "   Failed: $FAILED"
    echo "   Success Rate: ${SUCCESS_RATE}%"
    echo ""
    echo "📄 Reports:"
    echo "   Summary: $LATEST_SUMMARY"
    echo "   Detailed: $LATEST_REPORT"
    
    if [ $FAILED -gt 0 ]; then
        echo ""
        echo "❌ Failed Tests:"
        jq -r '.tests[] | select(.status == "failed") | "   - \(.name): HTTP \(.http_code)"' "$LATEST_REPORT"
    fi
else
    echo "📄 Reports available in: test-results/"
    if [ -n "$LATEST_SUMMARY" ]; then
        echo "   Summary: $LATEST_SUMMARY"
    fi
fi

# Step 5: Cleanup (optional)
if [ "$SKIP_START" != "true" ] && [ -n "$API_PID" ]; then
    echo ""
    read -p "Stop API server? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "   Stopping API server (PID: $API_PID)..."
        kill $API_PID 2>/dev/null || true
        echo "✅ API server stopped"
    else
        echo "   API server still running (PID: $API_PID)"
        echo "   To stop manually: kill $API_PID"
    fi
fi

echo ""
if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo "✅ All tests passed!"
else
    echo "❌ Some tests failed. Review reports above."
fi

exit $TEST_EXIT_CODE
