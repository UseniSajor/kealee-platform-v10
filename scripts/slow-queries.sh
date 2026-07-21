#!/bin/bash
# scripts/slow-queries.sh
# Analyze slow database queries

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[SLOW QUERIES]${NC} $1"
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

echo "🐌 Slow Database Queries Analysis"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    fail "DATABASE_URL is not set"
    info "Set it: export DATABASE_URL='postgresql://...'"
    exit 1
fi

# Check psql
if ! command -v psql &> /dev/null; then
    fail "psql is not installed"
    exit 1
fi

# Test connection
log "Testing database connection..."
if ! psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1; then
    fail "Cannot connect to database"
    exit 1
fi
success "Connected to database"

echo ""
echo "📊 Query Statistics"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if pg_stat_statements is enabled
log "Checking pg_stat_statements extension..."
if psql "$DATABASE_URL" -t -c "SELECT count(*) FROM pg_extension WHERE extname = 'pg_stat_statements';" | grep -q "1"; then
    success "pg_stat_statements is enabled"
else
    warn "pg_stat_statements is not enabled"
    info "Enable it: CREATE EXTENSION IF NOT EXISTS pg_stat_statements;"
    echo ""
    echo "Showing currently running queries instead..."
    echo ""
    psql "$DATABASE_URL" -c "
        SELECT 
            pid,
            now() - pg_stat_activity.query_start AS duration,
            state,
            query
        FROM pg_stat_activity
        WHERE state = 'active'
        AND now() - pg_stat_activity.query_start > interval '1 second'
        ORDER BY duration DESC;
    "
    exit 0
fi

# Top 10 slowest queries
echo "🔝 Top 10 Slowest Queries (by total time)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
psql "$DATABASE_URL" -c "
    SELECT 
        round(total_exec_time::numeric, 2) AS total_time_ms,
        calls,
        round(mean_exec_time::numeric, 2) AS mean_time_ms,
        round((100 * total_exec_time / sum(total_exec_time) OVER ())::numeric, 2) AS percentage,
        substring(query, 1, 100) AS query_preview
    FROM pg_stat_statements
    ORDER BY total_exec_time DESC
    LIMIT 10;
"

echo ""
echo "📈 Most Frequently Executed Queries"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
psql "$DATABASE_URL" -c "
    SELECT 
        calls,
        round(total_exec_time::numeric, 2) AS total_time_ms,
        round(mean_exec_time::numeric, 2) AS mean_time_ms,
        substring(query, 1, 100) AS query_preview
    FROM pg_stat_statements
    ORDER BY calls DESC
    LIMIT 10;
"

echo ""
echo "⏱️  Queries with Highest Mean Execution Time"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
psql "$DATABASE_URL" -c "
    SELECT 
        round(mean_exec_time::numeric, 2) AS mean_time_ms,
        calls,
        round(total_exec_time::numeric, 2) AS total_time_ms,
        substring(query, 1, 100) AS query_preview
    FROM pg_stat_statements
    WHERE calls > 0
    ORDER BY mean_exec_time DESC
    LIMIT 10;
"

echo ""
echo "🔄 Currently Running Queries"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
psql "$DATABASE_URL" -c "
    SELECT 
        pid,
        now() - pg_stat_activity.query_start AS duration,
        state,
        wait_event_type,
        wait_event,
        substring(query, 1, 100) AS query_preview
    FROM pg_stat_activity
    WHERE state != 'idle'
    AND query NOT LIKE '%pg_stat_activity%'
    ORDER BY duration DESC;
"

echo ""
echo "📊 Index Usage Statistics"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
psql "$DATABASE_URL" -c "
    SELECT 
        schemaname,
        tablename,
        indexname,
        idx_scan AS index_scans,
        idx_tup_read AS tuples_read,
        idx_tup_fetch AS tuples_fetched
    FROM pg_stat_user_indexes
    WHERE idx_scan = 0
    ORDER BY schemaname, tablename
    LIMIT 20;
" || warn "Could not retrieve index statistics"

echo ""
echo "💡 Recommendations"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Review slow queries and optimize:"
echo "   - Add indexes for frequently queried columns"
echo "   - Optimize JOIN operations"
echo "   - Consider query caching"
echo ""
echo "2. Check for missing indexes:"
echo "   - Review tables with idx_scan = 0"
echo "   - Add indexes for foreign keys"
echo "   - Add indexes for WHERE clause columns"
echo ""
echo "3. Monitor connection count:"
echo "   psql \$DATABASE_URL -c \"SELECT count(*) FROM pg_stat_activity;\""
echo ""
echo "4. Consider connection pooling if connection count is high"
echo ""

success "Analysis complete"
