#!/bin/bash
# scripts/configure-nginx.sh
# Configure Nginx reverse proxy for API backend

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[NGINX]${NC} $1"
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
NGINX_CONFIG_DIR=${NGINX_CONFIG_DIR:-"/etc/nginx"}
NGINX_SITES_DIR=${NGINX_SITES_DIR:-"/etc/nginx/sites-available"}
NGINX_ENABLED_DIR=${NGINX_ENABLED_DIR:-"/etc/nginx/sites-enabled"}
BACKEND_PORT=${BACKEND_PORT:-3000}
SERVER_NAME=${SERVER_NAME:-"api.kealee.com"}
BACKUP_CONFIG=${BACKUP_CONFIG:-"true"}

echo "⚙️  Nginx Reverse Proxy Configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   Config directory: $NGINX_CONFIG_DIR"
echo "   Backend port: $BACKEND_PORT"
echo "   Server name: $SERVER_NAME"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    warn "Not running as root"
    echo "   Some operations may require sudo"
    echo ""
    read -p "Continue anyway? (y/N): " CONTINUE
    if [ "$CONTINUE" != "y" ] && [ "$CONTINUE" != "Y" ]; then
        exit 0
    fi
fi

# Detect Nginx installation
log "Detecting Nginx installation..."
if ! command -v nginx &> /dev/null; then
    fail "Nginx is not installed"
    echo ""
    echo "Install Nginx:"
    echo "  Ubuntu/Debian: sudo apt-get install nginx"
    echo "  CentOS/RHEL: sudo yum install nginx"
    echo "  macOS: brew install nginx"
    exit 1
fi

success "Nginx is installed: $(nginx -v 2>&1)"

# Detect OS and set paths
if [ -d "/etc/nginx/sites-available" ]; then
    # Debian/Ubuntu
    NGINX_SITES_DIR="/etc/nginx/sites-available"
    NGINX_ENABLED_DIR="/etc/nginx/sites-enabled"
elif [ -d "/etc/nginx/conf.d" ]; then
    # CentOS/RHEL
    NGINX_SITES_DIR="/etc/nginx/conf.d"
    NGINX_ENABLED_DIR="/etc/nginx/conf.d"
else
    fail "Could not determine Nginx configuration directory"
    exit 1
fi

success "Using config directory: $NGINX_SITES_DIR"

# Create site configuration
SITE_CONFIG="${NGINX_SITES_DIR}/${SERVER_NAME//./-}.conf"
log "Creating site configuration: $SITE_CONFIG"

# Backup existing config if it exists
if [ -f "$SITE_CONFIG" ] && [ "$BACKUP_CONFIG" = "true" ]; then
    BACKUP_FILE="${SITE_CONFIG}.backup.$(date +%Y%m%d_%H%M%S)"
    log "Backing up existing configuration..."
    if cp "$SITE_CONFIG" "$BACKUP_FILE"; then
        success "Backup created: $BACKUP_FILE"
    else
        warn "Could not create backup"
    fi
fi

# Generate configuration
log "Generating Nginx configuration..."

cat > "$SITE_CONFIG" << NGINX_CONFIG_EOF
# Nginx configuration for $SERVER_NAME
# Generated: $(date)

upstream api_backend {
    server localhost:$BACKEND_PORT;
    keepalive 32;
}

server {
    listen 80;
    server_name $SERVER_NAME;
    
    # Logging
    access_log /var/log/nginx/${SERVER_NAME//./-}-access.log;
    error_log /var/log/nginx/${SERVER_NAME//./-}-error.log;
    
    # Client settings
    client_max_body_size 10M;
    client_body_timeout 60s;
    client_header_timeout 60s;
    
    # Proxy settings
    location / {
        proxy_pass http://api_backend;
        proxy_http_version 1.1;
        
        # WebSocket support
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        
        # Standard headers
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # Cache control
        proxy_cache_bypass \$http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Buffering
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
        proxy_busy_buffers_size 8k;
    }
    
    # Health check endpoint
    location /health {
        proxy_pass http://api_backend;
        access_log off;
    }
}
NGINX_CONFIG_EOF

success "Configuration file created: $SITE_CONFIG"

# Enable site (Debian/Ubuntu)
if [ -d "/etc/nginx/sites-enabled" ]; then
    ENABLED_LINK="${NGINX_ENABLED_DIR}/$(basename $SITE_CONFIG)"
    if [ ! -L "$ENABLED_LINK" ]; then
        log "Enabling site..."
        if ln -s "$SITE_CONFIG" "$ENABLED_LINK"; then
            success "Site enabled: $ENABLED_LINK"
        else
            warn "Could not create symlink (may require sudo)"
        fi
    else
        success "Site already enabled"
    fi
fi

# Test configuration
log "Testing Nginx configuration..."
if nginx -t 2>&1 | grep -q "successful"; then
    success "Configuration test passed"
else
    fail "Configuration test failed"
    echo ""
    echo "Errors:"
    nginx -t
    exit 1
fi

# Generate configuration summary
NGINX_CONFIG_SUMMARY="nginx-config-summary.txt"
log "Generating configuration summary: $NGINX_CONFIG_SUMMARY"

cat > "$NGINX_CONFIG_SUMMARY" << SUMMARY_EOF
# Nginx Configuration Summary
# Generated: $(date)

# Configuration Details:
- Config file: $SITE_CONFIG
- Server name: $SERVER_NAME
- Backend port: $BACKEND_PORT
- Enabled link: ${ENABLED_LINK:-N/A}

# Next Steps:
1. Review configuration: $SITE_CONFIG
2. Reload Nginx: sudo systemctl reload nginx
3. Test connection: curl http://$SERVER_NAME/health
4. Check logs: tail -f /var/log/nginx/${SERVER_NAME//./-}-access.log

# SSL Configuration (Optional):
To enable HTTPS:
1. Obtain SSL certificate (Let's Encrypt recommended)
2. Uncomment SSL server block in $SITE_CONFIG
3. Update certificate paths
4. Reload Nginx

# Load Balancing (Optional):
To add multiple backend servers, update upstream block:
upstream api_backend {
    server localhost:3000 weight=1;
    server localhost:3001 weight=1;
    server localhost:3002 backup;
}
SUMMARY_EOF

success "Configuration summary saved: $NGINX_CONFIG_SUMMARY"

echo ""
echo "📋 Next Steps"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. ✅ Review configuration:"
echo "   cat $SITE_CONFIG"
echo ""
echo "2. ✅ Reload Nginx:"
echo "   sudo systemctl reload nginx"
echo "   # or"
echo "   sudo service nginx reload"
echo ""
echo "3. ✅ Test connection:"
echo "   curl http://$SERVER_NAME/health"
echo ""
echo "4. ✅ Check logs:"
echo "   tail -f /var/log/nginx/${SERVER_NAME//./-}-access.log"
echo ""
echo "5. ✅ Configure DNS:"
echo "   Point $SERVER_NAME to this server's IP address"
echo ""
echo "⚠️  Important Notes:"
echo "   - Ensure backend is running on port $BACKEND_PORT"
echo "   - Configure firewall to allow port 80 (and 443 for HTTPS)"
echo "   - Update DNS records to point to this server"
echo "   - Consider enabling SSL/HTTPS for production"
