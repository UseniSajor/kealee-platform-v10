#!/bin/bash
# scripts/performance-test.sh
# Performance testing script

set -e

URL=${1:-"https://api.kealee.com"}
REQUESTS=${2:-10}

echo "⚡ Performance Test"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "URL: $URL"
echo "Requests: $REQUESTS"
echo ""

TOTAL_TIME=0
SUCCESS=0
FAILED=0
TIMES=()

for i in $(seq 1 $REQUESTS); do
    TIME=$(curl -o /dev/null -s -w '%{time_total}' "$URL")
    HTTP_CODE=$(curl -o /dev/null -s -w '%{http_code}' "$URL")
    
    if [ "$HTTP_CODE" -eq 200 ]; then
        SUCCESS=$((SUCCESS + 1))
        TOTAL_TIME=$(echo "$TOTAL_TIME + $TIME" | bc)
        TIMES+=($TIME)
        echo "Request $i: ${TIME}s (HTTP $HTTP_CODE)"
    else
        FAILED=$((FAILED + 1))
        echo "Request $i: Failed (HTTP $HTTP_CODE)"
    fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Results"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $SUCCESS -gt 0 ]; then
    AVG_TIME=$(echo "scale=3; $TOTAL_TIME / $SUCCESS" | bc)
    echo "Average response time: ${AVG_TIME}s"
    
    # Calculate min/max
    MIN_TIME=$(printf '%s\n' "${TIMES[@]}" | sort -n | head -1)
    MAX_TIME=$(printf '%s\n' "${TIMES[@]}" | sort -n | tail -1)
    echo "Min response time: ${MIN_TIME}s"
    echo "Max response time: ${MAX_TIME}s"
fi

echo "Successful requests: $SUCCESS/$REQUESTS"
echo "Failed requests: $FAILED/$REQUESTS"
SUCCESS_RATE=$(echo "scale=2; $SUCCESS * 100 / $REQUESTS" | bc)
echo "Success rate: ${SUCCESS_RATE}%"
