#!/bin/bash
# scripts/configure-redis.sh
# Configure Redis performance settings

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[REDIS]${NC} $1"
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
REDIS_CONFIG_FILE=${REDIS_CONFIG_FILE:-"/etc/redis/redis.conf"}
MAXMEMORY=${MAXMEMORY:-"2gb"}
MAXMEMORY_POLICY=${MAXMEMORY_POLICY:-"allkeys-lru"}
BACKUP_CONFIG=${BACKUP_CONFIG:-"true"}

echo "⚙️  Redis Performance Configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   Config file: $REDIS_CONFIG_FILE"
echo "   Max memory: $MAXMEMORY"
echo "   Eviction policy: $MAXMEMORY_POLICY"
echo ""

# Detect Redis config file
if [ ! -f "$REDIS_CONFIG_FILE" ]; then
    # Try common locations
    if [ -f "/etc/redis/redis.conf" ]; then
        REDIS_CONFIG_FILE="/etc/redis/redis.conf"
    elif [ -f "/usr/local/etc/redis.conf" ]; then
        REDIS_CONFIG_FILE="/usr/local/etc/redis.conf"
    elif [ -f "/opt/homebrew/etc/redis.conf" ]; then
        REDIS_CONFIG_FILE="/opt/homebrew/etc/redis.conf"
    else
        fail "Redis configuration file not found"
        echo ""
        echo "Common locations:"
        echo "  - /etc/redis/redis.conf (Linux)"
        echo "  - /usr/local/etc/redis.conf (macOS)"
        echo "  - /opt/homebrew/etc/redis.conf (macOS Homebrew)"
        echo ""
        read -p "Enter Redis config file path: " REDIS_CONFIG_FILE
    fi
fi

if [ ! -f "$REDIS_CONFIG_FILE" ]; then
    fail "Configuration file not found: $REDIS_CONFIG_FILE"
    exit 1
fi

success "Found Redis config: $REDIS_CONFIG_FILE"

# Backup original config
if [ "$BACKUP_CONFIG" = "true" ]; then
    BACKUP_FILE="${REDIS_CONFIG_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
    log "Backing up original configuration..."
    if cp "$REDIS_CONFIG_FILE" "$BACKUP_FILE"; then
        success "Backup created: $BACKUP_FILE"
    else
        warn "Could not create backup (may require sudo)"
    fi
fi

# Function to update or add config parameter
update_config() {
    local param=$1
    local value=$2
    local file=$3
    
    # Check if parameter exists (handle commented lines)
    if grep -q "^[[:space:]]*${param}[[:space:]]" "$file" || grep -q "^[[:space:]]*#.*${param}[[:space:]]" "$file"; then
        # Update existing parameter (uncomment if needed)
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' "s|^[[:space:]]*#*[[:space:]]*${param}[[:space:]].*|${param} ${value}|" "$file"
        else
            # Linux
            sed -i "s|^[[:space:]]*#*[[:space:]]*${param}[[:space:]].*|${param} ${value}|" "$file"
        fi
        log "  Updated: $param $value"
    else
        # Add new parameter
        echo "" >> "$file"
        echo "# Performance tuning - added by configure-redis.sh" >> "$file"
        echo "${param} ${value}" >> "$file"
        log "  Added: $param $value"
    fi
}

# Update configuration parameters
log "Updating configuration parameters..."

update_config "maxmemory" "$MAXMEMORY" "$REDIS_CONFIG_FILE"
update_config "maxmemory-policy" "$MAXMEMORY_POLICY" "$REDIS_CONFIG_FILE"

# Snapshot settings
update_config "save" "900 1" "$REDIS_CONFIG_FILE"
update_config "save" "300 10" "$REDIS_CONFIG_FILE"
update_config "save" "60 10000" "$REDIS_CONFIG_FILE"

# Additional recommended settings
log "Adding additional recommended settings..."

update_config "appendonly" "yes" "$REDIS_CONFIG_FILE"
update_config "appendfsync" "everysec" "$REDIS_CONFIG_FILE"
update_config "tcp-keepalive" "300" "$REDIS_CONFIG_FILE"
update_config "timeout" "300" "$REDIS_CONFIG_FILE"

success "Configuration updated"

# Generate configuration summary
REDIS_CONFIG_SUMMARY="redis-config-summary.txt"
log "Generating configuration summary: $REDIS_CONFIG_SUMMARY"

cat > "$REDIS_CONFIG_SUMMARY" << SUMMARY_EOF
# Redis Performance Configuration Summary
# Generated: $(date)
# Config file: $REDIS_CONFIG_FILE

# Performance Settings Applied:
maxmemory $MAXMEMORY
maxmemory-policy $MAXMEMORY_POLICY

# Snapshot Settings:
save 900 1      # Save if at least 1 key changed in 900 seconds (15 min)
save 300 10     # Save if at least 10 keys changed in 300 seconds (5 min)
save 60 10000   # Save if at least 10000 keys changed in 60 seconds (1 min)

# Persistence Settings:
appendonly yes
appendfsync everysec
tcp-keepalive 300
timeout 300

# Next Steps:
# 1. Review configuration: $REDIS_CONFIG_FILE
# 2. Restart Redis: sudo systemctl restart redis
# 3. Verify settings: redis-cli CONFIG GET maxmemory
# 4. Monitor memory usage: redis-cli INFO memory
SUMMARY_EOF

success "Configuration summary saved: $REDIS_CONFIG_SUMMARY"

echo ""
echo "📋 Next Steps"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. ✅ Review configuration:"
echo "   cat $REDIS_CONFIG_FILE | grep -E 'maxmemory|save|appendonly'"
echo ""
echo "2. ✅ Restart Redis:"
echo "   sudo systemctl restart redis"
echo "   # or"
echo "   sudo service redis restart"
echo ""
echo "3. ✅ Verify settings:"
echo "   redis-cli CONFIG GET maxmemory"
echo "   redis-cli CONFIG GET maxmemory-policy"
echo "   redis-cli CONFIG GET save"
echo ""
echo "4. ✅ Monitor Redis:"
echo "   redis-cli INFO memory"
echo "   redis-cli INFO stats"
echo ""
echo "⚠️  Important Notes:"
echo "   - maxmemory should be less than available RAM"
echo "   - allkeys-lru evicts least recently used keys when memory is full"
echo "   - Snapshot settings balance data safety vs performance"
echo "   - Restart required for most settings to take effect"
