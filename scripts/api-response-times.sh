#!/bin/bash
# scripts/api-response-times.sh
# Check API response times

set -e

API_URL=${1:-"https://api.kealee.com"}

echo "⏱️  API Response Times"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

ENDPOINTS=(
    "/health"
    "/api/v1/auth/status"
    "/api/v1/users"
)

for endpoint in "${ENDPOINTS[@]}"; do
    URL="${API_URL}${endpoint}"
    echo -n "Testing $endpoint... "
    
    TIME=$(curl -o /dev/null -s -w '%{time_total}' "$URL" 2>/dev/null || echo "0")
    HTTP_CODE=$(curl -o /dev/null -s -w '%{http_code}' "$URL" 2>/dev/null || echo "000")
    
    if [ "$HTTP_CODE" -eq 200 ]; then
        echo "✅ ${TIME}s (HTTP $HTTP_CODE)"
    else
        echo "❌ Failed (HTTP $HTTP_CODE)"
    fi
done

echo ""
echo "Response time thresholds:"
echo "  < 200ms: Excellent"
echo "  < 500ms: Good"
echo "  < 1000ms: Acceptable"
echo "  > 1000ms: Needs optimization"
