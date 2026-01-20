#!/bin/bash
# scripts/troubleshoot.sh
# Comprehensive troubleshooting script for Kealee Platform

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[TROUBLESHOOT]${NC} $1"
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

echo "🔍 Kealee Platform Troubleshooting"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check what to troubleshoot
echo "Select what to troubleshoot:"
echo "  1) PostgreSQL"
echo "  2) Redis"
echo "  3) Vercel Deployments"
echo "  4) Environment Variables"
echo "  5) API Service"
echo "  6) All Services"
echo ""
read -p "Enter choice (1-6): " CHOICE

# PostgreSQL Troubleshooting
check_postgresql() {
    echo ""
    echo "🐘 PostgreSQL Troubleshooting"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # Check if PostgreSQL is installed
    if ! command -v psql &> /dev/null; then
        fail "PostgreSQL client (psql) is not installed"
        info "Install: sudo apt-get install postgresql-client"
        return 1
    fi
    success "PostgreSQL client is installed"
    
    # Check if PostgreSQL is running
    log "Checking if PostgreSQL is running..."
    if command -v pg_isready &> /dev/null; then
        if pg_isready -q; then
            success "PostgreSQL is running and accepting connections"
        else
            fail "PostgreSQL is not running or not accepting connections"
            info "Start PostgreSQL: sudo systemctl start postgresql"
            return 1
        fi
    else
        warn "pg_isready not found, checking connection string..."
    fi
    
    # Check connection string
    log "Checking DATABASE_URL..."
    if [ -z "$DATABASE_URL" ]; then
        warn "DATABASE_URL is not set"
        info "Set it: export DATABASE_URL='postgresql://user:pass@host:port/db'"
        
        # Try to load from .env files
        if [ -f ".env.local" ]; then
            log "Loading from .env.local..."
            export $(grep -v '^#' .env.local | xargs)
        fi
        
        if [ -z "$DATABASE_URL" ]; then
            fail "DATABASE_URL not found"
            return 1
        fi
    fi
    
    success "DATABASE_URL is set"
    info "Connection string: ${DATABASE_URL%%@*}@***"
    
    # Test connection
    log "Testing database connection..."
    if psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1; then
        success "Database connection successful"
        
        # Get database info
        log "Getting database information..."
        DB_NAME=$(psql "$DATABASE_URL" -t -c "SELECT current_database();" | xargs)
        DB_VERSION=$(psql "$DATABASE_URL" -t -c "SELECT version();" | head -1 | xargs)
        CONN_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT count(*) FROM pg_stat_activity;" | xargs)
        
        info "Database: $DB_NAME"
        info "Version: $DB_VERSION"
        info "Active connections: $CONN_COUNT"
    else
        fail "Database connection failed"
        info "Check:"
        info "  - Database server is running"
        info "  - Connection string is correct"
        info "  - Network connectivity"
        info "  - Firewall rules"
        return 1
    fi
    
    # Check migrations
    log "Checking migration status..."
    if [ -d "packages/database" ]; then
        cd packages/database
        if npx prisma migrate status > /dev/null 2>&1; then
            success "Prisma migrations are accessible"
        else
            warn "Could not check migration status"
        fi
        cd ../..
    fi
}

# Redis Troubleshooting
check_redis() {
    echo ""
    echo "🔴 Redis Troubleshooting"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # Check if Redis client is installed
    if ! command -v redis-cli &> /dev/null; then
        fail "Redis client (redis-cli) is not installed"
        info "Install: sudo apt-get install redis-tools"
        return 1
    fi
    success "Redis client is installed"
    
    # Check if Redis is running
    log "Checking if Redis is running..."
    if redis-cli ping > /dev/null 2>&1; then
        success "Redis is running and responding"
        
        # Get Redis info
        log "Getting Redis information..."
        REDIS_VERSION=$(redis-cli INFO server | grep "redis_version" | cut -d: -f2 | xargs)
        REDIS_MEMORY=$(redis-cli INFO memory | grep "used_memory_human" | cut -d: -f2 | xargs)
        REDIS_CONNECTIONS=$(redis-cli INFO clients | grep "connected_clients" | cut -d: -f2 | xargs)
        
        info "Version: $REDIS_VERSION"
        info "Memory used: $REDIS_MEMORY"
        info "Connected clients: $REDIS_CONNECTIONS"
    else
        fail "Redis is not running or not responding"
        info "Start Redis: sudo systemctl start redis"
        info "Or check: redis-cli -h <host> -p <port> ping"
        
        # Check Redis logs
        if [ -f "/var/log/redis/redis-server.log" ]; then
            log "Recent Redis log entries:"
            tail -n 10 /var/log/redis/redis-server.log | sed 's/^/  /'
        fi
        return 1
    fi
    
    # Check Redis logs
    log "Checking Redis logs..."
    if [ -f "/var/log/redis/redis-server.log" ]; then
        ERROR_COUNT=$(grep -i error /var/log/redis/redis-server.log | wc -l | xargs)
        if [ "$ERROR_COUNT" -gt 0 ]; then
            warn "Found $ERROR_COUNT error(s) in Redis logs"
            info "View logs: tail -f /var/log/redis/redis-server.log"
        else
            success "No errors found in recent logs"
        fi
    else
        info "Redis log file not found at /var/log/redis/redis-server.log"
    fi
}

# Vercel Troubleshooting
check_vercel() {
    echo ""
    echo "▲ Vercel Troubleshooting"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # Check if Vercel CLI is installed
    if ! command -v vercel &> /dev/null; then
        fail "Vercel CLI is not installed"
        info "Install: npm install -g vercel"
        return 1
    fi
    success "Vercel CLI is installed"
    
    # Check if logged in
    log "Checking Vercel authentication..."
    if vercel whoami > /dev/null 2>&1; then
        USER=$(vercel whoami)
        success "Logged in as: $USER"
    else
        fail "Not logged in to Vercel"
        info "Login: vercel login"
        return 1
    fi
    
    # Check Vercel token
    if [ -z "$VERCEL_TOKEN" ]; then
        warn "VERCEL_TOKEN is not set"
        info "Set it: export VERCEL_TOKEN='your-token'"
    else
        success "VERCEL_TOKEN is set"
    fi
    
    # Check deployments for each app
    APPS=("m-marketplace" "os-admin" "os-pm" "m-ops-services" "m-project-owner" "m-architect" "m-permits-inspections")
    
    log "Checking deployment status..."
    for app in "${APPS[@]}"; do
        if [ -d "apps/$app" ]; then
            log "  Checking $app..."
            cd "apps/$app"
            
            if vercel list --token="${VERCEL_TOKEN:-}" 2>/dev/null | grep -q "$app"; then
                success "  $app: Has deployments"
                
                # Get latest deployment
                LATEST=$(vercel list --token="${VERCEL_TOKEN:-}" 2>/dev/null | head -2 | tail -1)
                info "    Latest: $LATEST"
            else
                warn "  $app: No deployments found"
            fi
            
            cd ../..
        fi
    done
    
    # Check build logs
    if [ -n "$VERCEL_TOKEN" ]; then
        log "Checking recent build logs..."
        for app in "${APPS[@]}"; do
            if [ -d "apps/$app" ]; then
                log "  $app logs:"
                vercel logs "$app" --token="$VERCEL_TOKEN" --limit=5 2>/dev/null | head -10 | sed 's/^/    /' || warn "    Could not fetch logs"
            fi
        done
    fi
}

# Environment Variables Troubleshooting
check_env_vars() {
    echo ""
    echo "🔐 Environment Variables Troubleshooting"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # Required environment variables
    REQUIRED_VARS=(
        "DATABASE_URL"
        "NEXTAUTH_SECRET"
        "NEXTAUTH_URL"
        "STRIPE_SECRET_KEY"
    )
    
    log "Checking required environment variables..."
    MISSING=0
    
    for var in "${REQUIRED_VARS[@]}"; do
        if [ -z "${!var}" ]; then
            fail "$var is not set"
            MISSING=$((MISSING + 1))
        else
            success "$var is set"
        fi
    done
    
    if [ $MISSING -gt 0 ]; then
        warn "Missing $MISSING required environment variable(s)"
        info "Load from .env.local: export \$(grep -v '^#' .env.local | xargs)"
    fi
    
    # Check .env files
    log "Checking .env files..."
    if [ -f ".env.local" ]; then
        success ".env.local exists"
    else
        warn ".env.local not found"
        info "Create it: ./scripts/setup-env-local.sh"
    fi
    
    if [ -f ".env" ]; then
        success ".env exists"
    fi
}

# API Service Troubleshooting
check_api_service() {
    echo ""
    echo "🚀 API Service Troubleshooting"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # Check if API directory exists
    if [ ! -d "services/api" ]; then
        fail "API service directory not found"
        return 1
    fi
    success "API service directory exists"
    
    # Check if dependencies are installed
    log "Checking dependencies..."
    if [ -d "services/api/node_modules" ]; then
        success "Dependencies are installed"
    else
        warn "Dependencies not installed"
        info "Install: cd services/api && npm install"
    fi
    
    # Check if API is running
    log "Checking if API is running..."
    if curl -s http://localhost:3000/health > /dev/null 2>&1; then
        success "API is running on port 3000"
        
        # Test health endpoint
        HEALTH=$(curl -s http://localhost:3000/health)
        info "Health check: $HEALTH"
    else
        fail "API is not running on port 3000"
        info "Start API: cd services/api && npm run dev"
    fi
    
    # Check port availability
    log "Checking port 3000..."
    if lsof -i :3000 > /dev/null 2>&1; then
        PROCESS=$(lsof -i :3000 | tail -1 | awk '{print $2}')
        info "Port 3000 is in use by process: $PROCESS"
    else
        warn "Port 3000 is not in use"
    fi
}

# Run selected checks
case $CHOICE in
    1)
        check_postgresql
        ;;
    2)
        check_redis
        ;;
    3)
        check_vercel
        ;;
    4)
        check_env_vars
        ;;
    5)
        check_api_service
        ;;
    6)
        check_postgresql
        check_redis
        check_vercel
        check_env_vars
        check_api_service
        ;;
    *)
        fail "Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "✅ Troubleshooting complete"
echo ""
echo "📋 Next Steps:"
echo "  - Review any warnings or errors above"
echo "  - Check documentation: docs/TROUBLESHOOTING_GUIDE.md"
echo "  - View detailed logs for specific services"
echo ""
