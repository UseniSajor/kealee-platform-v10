#!/bin/bash
# scripts/health-check.sh
# Comprehensive health check for all services

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[HEALTH]${NC} $1"
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

info() {
    echo -e "${CYAN}ℹ️${NC} $1"
}

echo "🏥 Comprehensive Health Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Service Status
echo "📦 Service Status"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# PostgreSQL
log "Checking PostgreSQL..."
if pg_isready -q 2>/dev/null; then
    success "PostgreSQL: Running"
    CONN_COUNT=$(psql $DATABASE_URL -t -c "SELECT count(*) FROM pg_stat_activity;" 2>/dev/null | xargs || echo "N/A")
    info "  Active connections: $CONN_COUNT"
else
    fail "PostgreSQL: Not running"
fi

# Redis
log "Checking Redis..."
if redis-cli ping > /dev/null 2>&1; then
    success "Redis: Running"
    MEMORY=$(redis-cli INFO memory | grep "used_memory_human" | cut -d: -f2 | xargs)
    info "  Memory used: $MEMORY"
else
    fail "Redis: Not running"
fi

# API Service
log "Checking API Service..."
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    success "API Service: Running"
    RESPONSE_TIME=$(curl -o /dev/null -s -w '%{time_total}' http://localhost:3000/health)
    info "  Response time: ${RESPONSE_TIME}s"
else
    fail "API Service: Not running"
fi

echo ""

# Database Connectivity
echo "🗄️  Database Connectivity"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -n "$DATABASE_URL" ]; then
    log "Testing database connection..."
    if psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1; then
        success "Database connection: OK"
        
        # Get database info
        DB_NAME=$(psql "$DATABASE_URL" -t -c "SELECT current_database();" 2>/dev/null | xargs)
        DB_SIZE=$(psql "$DATABASE_URL" -t -c "SELECT pg_size_pretty(pg_database_size(current_database()));" 2>/dev/null | xargs)
        info "  Database: $DB_NAME"
        info "  Size: $DB_SIZE"
    else
        fail "Database connection: Failed"
    fi
else
    warn "DATABASE_URL not set"
fi

echo ""

# External Service Status
echo "🌐 External Service Status"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check S3
if [ -n "$S3_BUCKET_NAME" ] && command -v aws &> /dev/null; then
    log "Checking S3..."
    if aws s3 ls "s3://$S3_BUCKET_NAME" > /dev/null 2>&1; then
        success "S3: Accessible"
    else
        fail "S3: Not accessible"
    fi
else
    warn "S3: Not configured or AWS CLI not installed"
fi

# Check Stripe (if API key is set)
if [ -n "$STRIPE_SECRET_KEY" ]; then
    log "Checking Stripe..."
    # Simple check - verify key format
    if [[ "$STRIPE_SECRET_KEY" =~ ^sk_(test|live)_ ]]; then
        success "Stripe: Key format valid"
    else
        warn "Stripe: Key format may be invalid"
    fi
fi

echo ""

# Disk Space
echo "💾 Disk Space"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

df -h | grep -E "^/dev|Filesystem" | while read line; do
    USAGE=$(echo "$line" | awk '{print $5}' | sed 's/%//')
    if [ -n "$USAGE" ] && [ "$USAGE" -gt 80 ]; then
        warn "$line"
    else
        info "$line"
    fi
done

echo ""

# Memory Usage
echo "🧠 Memory Usage"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if command -v free &> /dev/null; then
    free -h | head -2
    MEM_USAGE=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100}')
    if [ "$MEM_USAGE" -gt 80 ]; then
        warn "Memory usage: ${MEM_USAGE}% (High)"
    else
        success "Memory usage: ${MEM_USAGE}%"
    fi
fi

echo ""

# System Load
echo "⚡ System Load"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if command -v uptime &> /dev/null; then
    LOAD=$(uptime | awk -F'load average:' '{print $2}')
    info "Load average:$LOAD"
fi

echo ""
success "Health check complete"
