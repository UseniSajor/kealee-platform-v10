#!/bin/bash
# scripts/configure-postgresql.sh
# Configure PostgreSQL performance settings

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[POSTGRES]${NC} $1"
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

# Configuration
PG_CONFIG_FILE=${PG_CONFIG_FILE:-"/etc/postgresql/16/main/postgresql.conf"}
PG_DATA_DIR=${PG_DATA_DIR:-"/var/lib/postgresql/16/main"}
BACKUP_CONFIG=${BACKUP_CONFIG:-"true"}

# Performance settings
MAX_CONNECTIONS=${MAX_CONNECTIONS:-200}
SHARED_BUFFERS=${SHARED_BUFFERS:-"4GB"}
EFFECTIVE_CACHE_SIZE=${EFFECTIVE_CACHE_SIZE:-"12GB"}
MAINTENANCE_WORK_MEM=${MAINTENANCE_WORK_MEM:-"1GB"}
CHECKPOINT_COMPLETION_TARGET=${CHECKPOINT_COMPLETION_TARGET:-0.9}
WAL_BUFFERS=${WAL_BUFFERS:-"16MB"}
DEFAULT_STATISTICS_TARGET=${DEFAULT_STATISTICS_TARGET:-100}

echo "⚙️  PostgreSQL Performance Configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   Config file: $PG_CONFIG_FILE"
echo "   Data directory: $PG_DATA_DIR"
echo ""

# Check if running as root or postgres user
if [ "$EUID" -ne 0 ] && [ "$USER" != "postgres" ]; then
    warn "Not running as root or postgres user"
    echo "   Some operations may require elevated privileges"
    echo ""
    read -p "Continue anyway? (y/N): " CONTINUE
    if [ "$CONTINUE" != "y" ] && [ "$CONTINUE" != "Y" ]; then
        exit 0
    fi
fi

# Detect PostgreSQL version and config location
log "Detecting PostgreSQL configuration..."
if [ -f "/etc/postgresql/16/main/postgresql.conf" ]; then
    PG_CONFIG_FILE="/etc/postgresql/16/main/postgresql.conf"
    PG_VERSION="16"
elif [ -f "/etc/postgresql/15/main/postgresql.conf" ]; then
    PG_CONFIG_FILE="/etc/postgresql/15/main/postgresql.conf"
    PG_VERSION="15"
elif [ -f "/etc/postgresql/14/main/postgresql.conf" ]; then
    PG_CONFIG_FILE="/etc/postgresql/14/main/postgresql.conf"
    PG_VERSION="14"
elif [ -f "/var/lib/pgsql/data/postgresql.conf" ]; then
    PG_CONFIG_FILE="/var/lib/pgsql/data/postgresql.conf"
    PG_DATA_DIR="/var/lib/pgsql/data"
elif [ -f "$PG_DATA_DIR/postgresql.conf" ]; then
    PG_CONFIG_FILE="$PG_DATA_DIR/postgresql.conf"
else
    fail "PostgreSQL configuration file not found"
    echo ""
    echo "Common locations:"
    echo "  - /etc/postgresql/*/main/postgresql.conf (Debian/Ubuntu)"
    echo "  - /var/lib/pgsql/data/postgresql.conf (RHEL/CentOS)"
    echo "  - /usr/local/var/postgres/postgresql.conf (macOS Homebrew)"
    echo ""
    read -p "Enter PostgreSQL config file path: " PG_CONFIG_FILE
fi

if [ ! -f "$PG_CONFIG_FILE" ]; then
    fail "Configuration file not found: $PG_CONFIG_FILE"
    exit 1
fi

success "Found PostgreSQL config: $PG_CONFIG_FILE"

# Backup original config
if [ "$BACKUP_CONFIG" = "true" ]; then
    BACKUP_FILE="${PG_CONFIG_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
    log "Backing up original configuration..."
    if cp "$PG_CONFIG_FILE" "$BACKUP_FILE"; then
        success "Backup created: $BACKUP_FILE"
    else
        warn "Could not create backup (may require sudo)"
    fi
fi

# Generate optimized configuration
log "Generating optimized PostgreSQL configuration..."

# Read current config
CURRENT_CONFIG=$(cat "$PG_CONFIG_FILE")

# Function to update or add config parameter
update_config() {
    local param=$1
    local value=$2
    local file=$3
    
    # Check if parameter exists
    if grep -q "^[[:space:]]*${param}[[:space:]]*=" "$file"; then
        # Update existing parameter
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' "s|^[[:space:]]*${param}[[:space:]]*=.*|${param} = ${value}|" "$file"
        else
            # Linux
            sed -i "s|^[[:space:]]*${param}[[:space:]]*=.*|${param} = ${value}|" "$file"
        fi
        log "  Updated: $param = $value"
    else
        # Add new parameter
        echo "" >> "$file"
        echo "# Performance tuning - added by configure-postgresql.sh" >> "$file"
        echo "${param} = ${value}" >> "$file"
        log "  Added: $param = $value"
    fi
}

# Update configuration parameters
log "Updating configuration parameters..."

update_config "max_connections" "$MAX_CONNECTIONS" "$PG_CONFIG_FILE"
update_config "shared_buffers" "$SHARED_BUFFERS" "$PG_CONFIG_FILE"
update_config "effective_cache_size" "$EFFECTIVE_CACHE_SIZE" "$PG_CONFIG_FILE"
update_config "maintenance_work_mem" "$MAINTENANCE_WORK_MEM" "$PG_CONFIG_FILE"
update_config "checkpoint_completion_target" "$CHECKPOINT_COMPLETION_TARGET" "$PG_CONFIG_FILE"
update_config "wal_buffers" "$WAL_BUFFERS" "$PG_CONFIG_FILE"
update_config "default_statistics_target" "$DEFAULT_STATISTICS_TARGET" "$PG_CONFIG_FILE"

# Additional recommended settings
log "Adding additional recommended settings..."

# Calculate work_mem based on max_connections
WORK_MEM_CALC=$((12 * 1024 / MAX_CONNECTIONS))
WORK_MEM="${WORK_MEM_CALC}MB"

update_config "work_mem" "$WORK_MEM" "$PG_CONFIG_FILE"
update_config "random_page_cost" "1.1" "$PG_CONFIG_FILE"  # For SSD
update_config "effective_io_concurrency" "200" "$PG_CONFIG_FILE"  # For SSD
update_config "min_wal_size" "1GB" "$PG_CONFIG_FILE"
update_config "max_wal_size" "4GB" "$PG_CONFIG_FILE"
update_config "max_worker_processes" "8" "$PG_CONFIG_FILE"
update_config "max_parallel_workers_per_gather" "4" "$PG_CONFIG_FILE"
update_config "max_parallel_workers" "8" "$PG_CONFIG_FILE"
update_config "max_parallel_maintenance_workers" "4" "$PG_CONFIG_FILE"

success "Configuration updated"

# Generate configuration summary
CONFIG_SUMMARY="postgresql-config-summary.txt"
log "Generating configuration summary: $CONFIG_SUMMARY"

cat > "$CONFIG_SUMMARY" << SUMMARY_EOF
# PostgreSQL Performance Configuration Summary
# Generated: $(date)
# Config file: $PG_CONFIG_FILE

# Performance Settings Applied:
max_connections = $MAX_CONNECTIONS
shared_buffers = $SHARED_BUFFERS
effective_cache_size = $EFFECTIVE_CACHE_SIZE
maintenance_work_mem = $MAINTENANCE_WORK_MEM
checkpoint_completion_target = $CHECKPOINT_COMPLETION_TARGET
wal_buffers = $WAL_BUFFERS
default_statistics_target = $DEFAULT_STATISTICS_TARGET
work_mem = $WORK_MEM
random_page_cost = 1.1
effective_io_concurrency = 200
min_wal_size = 1GB
max_wal_size = 4GB
max_worker_processes = 8
max_parallel_workers_per_gather = 4
max_parallel_workers = 8
max_parallel_maintenance_workers = 4

# Next Steps:
# 1. Review configuration: $PG_CONFIG_FILE
# 2. Restart PostgreSQL: sudo systemctl restart postgresql
# 3. Verify settings: psql -c "SHOW max_connections;"
# 4. Monitor performance after changes
SUMMARY_EOF

success "Configuration summary saved: $CONFIG_SUMMARY"

echo ""
echo "📋 Next Steps"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. ✅ Review configuration:"
echo "   cat $PG_CONFIG_FILE | grep -E 'max_connections|shared_buffers|effective_cache_size'"
echo ""
echo "2. ✅ Restart PostgreSQL:"
echo "   sudo systemctl restart postgresql"
echo "   # or"
echo "   sudo service postgresql restart"
echo ""
echo "3. ✅ Verify settings:"
echo "   psql -c \"SHOW max_connections;\""
echo "   psql -c \"SHOW shared_buffers;\""
echo "   psql -c \"SHOW effective_cache_size;\""
echo ""
echo "4. ✅ Monitor performance:"
echo "   - Check connection count: SELECT count(*) FROM pg_stat_activity;"
echo "   - Monitor query performance"
echo "   - Check cache hit ratio: SELECT * FROM pg_statio_user_tables;"
echo ""
echo "⚠️  Important Notes:"
echo "   - shared_buffers should be ~25% of RAM"
echo "   - effective_cache_size should be ~50-75% of RAM"
echo "   - Restart required for most settings to take effect"
echo "   - Monitor system resources after changes"
