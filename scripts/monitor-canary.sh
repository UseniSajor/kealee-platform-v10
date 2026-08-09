#!/bin/bash

# Kealee Platform Canary Monitoring Script
# Monitors agentic framework health during 24-hour canary phase

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Helper functions
log_info() { echo -e "${GREEN}✅${NC} $1"; }
log_warn() { echo -e "${YELLOW}⚠️${NC}  $1"; }
log_error() { echo -e "${RED}❌${NC} $1"; }
log_header() { echo -e "\n${BLUE}━━━ $1 ━━━${NC}\n"; }

# Configuration
API_URL="${API_URL:-https://api.kealee.com}"
SENTRY_PROJECT="${SENTRY_PROJECT:-kealee-platform}"
SENTRY_ORG="${SENTRY_ORG:-kealee}"
CHECK_INTERVAL="${CHECK_INTERVAL:-3600}"  # 1 hour in seconds
DURATION="${DURATION:-86400}"  # 24 hours in seconds

# Thresholds
ERROR_RATE_THRESHOLD=1
EXECUTION_DURATION_THRESHOLD=60000  # milliseconds
TOOL_SUCCESS_THRESHOLD=90
QUEUE_SIZE_THRESHOLD=20
FAILED_JOBS_THRESHOLD=5

# Current time tracking
START_TIME=$(date +%s)
LAST_CHECK=0

# Log file
LOG_FILE="canary-monitoring-$(date +%Y%m%d-%H%M%S).log"

log_header "Canary Monitoring Started"
log_info "API: $API_URL"
log_info "Duration: 24 hours"
log_info "Check interval: $(($CHECK_INTERVAL / 60)) minutes"
log_info "Log file: $LOG_FILE"
echo ""

# Function to check health
check_health() {
    local timestamp=$(date "+%Y-%m-%d %H:%M:%S")
    echo "[${timestamp}] Health Check" >> "$LOG_FILE"

    # Get health status
    HEALTH=$(curl -s "$API_URL/api/agentic-bots/health" 2>/dev/null || echo "{}")

    if [ -z "$HEALTH" ] || [ "$HEALTH" == "{}" ]; then
        log_error "Could not reach health endpoint"
        echo "  ERROR: Unreachable" >> "$LOG_FILE"
        return 1
    fi

    # Extract metrics
    STATUS=$(echo "$HEALTH" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
    REDIS=$(echo "$HEALTH" | grep -o '"redisConnection":"[^"]*"' | cut -d'"' -f4)
    DB=$(echo "$HEALTH" | grep -o '"databaseConnection":"[^"]*"' | cut -d'"' -f4)
    WORKERS=$(echo "$HEALTH" | grep -o '"workersRunning":[0-9]*' | grep -o '[0-9]*')
    ACTIVE_JOBS=$(echo "$HEALTH" | grep -o '"totalActiveJobs":[0-9]*' | grep -o '[0-9]*')
    FAILED_JOBS=$(echo "$HEALTH" | grep -o '"totalFailedJobs":[0-9]*' | grep -o '[0-9]*')
    STALLED=$(echo "$HEALTH" | grep -o '"totalStalledJobs":[0-9]*' | grep -o '[0-9]*')

    # Display results
    echo "  Status: $STATUS"
    echo "  Redis: $REDIS | DB: $DB"
    echo "  Workers: $WORKERS | Active: $ACTIVE_JOBS | Failed: $FAILED_JOBS | Stalled: $STALLED"

    # Log to file
    echo "  STATUS=$STATUS REDIS=$REDIS DB=$DB WORKERS=$WORKERS ACTIVE=$ACTIVE_JOBS FAILED=$FAILED_JOBS STALLED=$STALLED" >> "$LOG_FILE"

    # Check thresholds
    if [ "$STATUS" != "healthy" ]; then
        log_warn "Status not healthy: $STATUS"
    fi

    if [ "$REDIS" != "connected" ]; then
        log_error "Redis disconnected!"
    fi

    if [ "$DB" != "connected" ]; then
        log_error "Database disconnected!"
    fi

    if [ "$FAILED_JOBS" -gt "$FAILED_JOBS_THRESHOLD" ]; then
        log_warn "High failed jobs: $FAILED_JOBS"
    fi

    if [ "$ACTIVE_JOBS" -gt "$QUEUE_SIZE_THRESHOLD" ]; then
        log_warn "Queue backlog: $ACTIVE_JOBS jobs"
    fi

    if [ "$STALLED" -gt 0 ]; then
        log_warn "Stalled jobs detected: $STALLED"
    fi
}

# Function to check Sentry
check_sentry() {
    local timestamp=$(date "+%Y-%m-%d %H:%M:%S")
    echo "[${timestamp}] Sentry Check" >> "$LOG_FILE"

    echo "  → Check Sentry dashboard manually:"
    echo "    https://sentry.io/organizations/$SENTRY_ORG/issues/?project=$SENTRY_PROJECT"
    echo ""
    echo "  Look for:"
    echo "    - New errors related to 'agentic'"
    echo "    - Execution duration metrics"
    echo "    - Tool success rates"
    echo ""

    echo "  Sentry check required" >> "$LOG_FILE"
}

# Function to get queue stats
check_stats() {
    local timestamp=$(date "+%Y-%m-%d %H:%M:%S")
    echo "[${timestamp}] Queue Stats" >> "$LOG_FILE"

    STATS=$(curl -s "$API_URL/api/agentic-bots/stats" 2>/dev/null || echo "{}")

    if [ -z "$STATS" ] || [ "$STATS" == "{}" ]; then
        log_warn "Could not get queue stats"
        return 1
    fi

    QUEUE_SIZE=$(echo "$STATS" | grep -o '"queueSize":[0-9]*' | grep -o '[0-9]*')
    ROUTED=$(echo "$STATS" | grep -o '"routed_to_agentic":[0-9]*' | grep -o '[0-9]*')
    ROLLOUT=$(echo "$STATS" | grep -o '"rolloutPercentage":[0-9]*' | grep -o '[0-9]*')

    echo "  Queue Size: $QUEUE_SIZE"
    echo "  Routed (Agentic): $ROUTED"
    echo "  Rollout %: $ROLLOUT%"
    echo ""

    echo "  QUEUE=$QUEUE_SIZE ROUTED=$ROUTED ROLLOUT=$ROLLOUT%" >> "$LOG_FILE"
}

# Main monitoring loop
while [ $(($(date +%s) - START_TIME)) -lt "$DURATION" ]; do
    CURRENT_TIME=$(date +%s)
    ELAPSED=$((CURRENT_TIME - START_TIME))
    HOURS=$((ELAPSED / 3600))
    MINUTES=$(((ELAPSED % 3600) / 60))

    log_header "Canary Monitor - ${HOURS}h ${MINUTES}m elapsed"

    # Run checks
    check_health
    echo ""
    check_stats
    echo ""
    check_sentry
    echo ""

    # Calculate wait time
    NEXT_CHECK=$((CURRENT_TIME + CHECK_INTERVAL))
    WAIT_SECONDS=$((NEXT_CHECK - $(date +%s)))

    if [ $WAIT_SECONDS -gt 0 ]; then
        WAIT_MINUTES=$((WAIT_SECONDS / 60))
        echo "Next check in ${WAIT_MINUTES} minutes..."
        echo ""
        sleep "$WAIT_SECONDS"
    fi
done

# Final summary
log_header "24-Hour Canary Complete!"
echo ""
log_info "Monitoring period ended"
log_info "Review log file: $LOG_FILE"
echo ""
echo "Decision:"
echo "  ✅ All metrics green for 24h?"
echo "     → Scale to 10%: AGENTIC_DESIGN_BOT_ROLLOUT_PERCENTAGE=10"
echo ""
echo "  ⚠️  Some warnings but no critical errors?"
echo "     → Hold at 5% for another 24h, investigate"
echo ""
echo "  ❌ Critical errors detected?"
echo "     → Rollback: AGENTIC_DESIGN_BOT_ROLLOUT_PERCENTAGE=0"
echo ""
