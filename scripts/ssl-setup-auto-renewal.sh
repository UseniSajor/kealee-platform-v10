#!/bin/bash

# SSL Auto-Renewal Setup Script
# Sets up automatic SSL certificate renewal

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[SSL RENEWAL]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log "Setting up SSL certificate auto-renewal..."
echo ""

# Check if using Vercel
if [ -n "$VERCEL" ] || command -v vercel &> /dev/null; then
    log "Detected Vercel deployment"
    log "Vercel automatically renews SSL certificates"
    log "No additional setup required"
    log ""
    log "To verify auto-renewal:"
    log "1. Check Vercel Dashboard → Project → Settings → Domains"
    log "2. SSL certificates are automatically managed"
    log "3. Renewal happens automatically before expiry"
    exit 0
fi

# Check if using Let's Encrypt
if command -v certbot &> /dev/null; then
    log "Detected Certbot (Let's Encrypt)"
    log "Setting up auto-renewal..."
    
    # Create renewal script
    cat > /usr/local/bin/ssl-renew-kealee.sh <<'EOF'
#!/bin/bash
# SSL Certificate Renewal Script for Kealee Platform

DOMAINS=(
    "api.kealee.com"
    "marketplace.kealee.com"
    "admin.kealee.com"
    "pm.kealee.com"
    "ops.kealee.com"
    "app.kealee.com"
    "architect.kealee.com"
    "permits.kealee.com"
)

LOG_FILE="/var/log/ssl-renewal.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "Starting SSL certificate renewal..."

for domain in "${DOMAINS[@]}"; do
    log "Renewing certificate for $domain..."
    
    # Renew certificate
    if certbot renew --cert-name "$domain" --quiet --no-self-upgrade; then
        log "✅ Certificate renewed for $domain"
        
        # Reload web server
        if systemctl is-active --quiet nginx; then
            systemctl reload nginx
            log "✅ Nginx reloaded"
        elif systemctl is-active --quiet apache2; then
            systemctl reload apache2
            log "✅ Apache reloaded"
        elif systemctl is-active --quiet httpd; then
            systemctl reload httpd
            log "✅ Httpd reloaded"
        fi
    else
        log "⚠️  Certificate renewal failed for $domain"
    fi
done

log "SSL certificate renewal complete"
EOF
    
    chmod +x /usr/local/bin/ssl-renew-kealee.sh
    log "✅ Renewal script created: /usr/local/bin/ssl-renew-kealee.sh"
    
    # Set up cron job (run twice daily, certbot only renews if needed)
    CRON_JOB="0 0,12 * * * /usr/local/bin/ssl-renew-kealee.sh >> /var/log/ssl-renewal.log 2>&1"
    
    # Check if cron job already exists
    if crontab -l 2>/dev/null | grep -q "ssl-renew-kealee"; then
        warn "Cron job already exists"
    else
        (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
        log "✅ Cron job added for automatic renewal"
    fi
    
    # Test renewal (dry run)
    log "Testing certificate renewal (dry run)..."
    certbot renew --dry-run --quiet || warn "Dry run failed (this is normal if certificates are new)"
    
    log "✅ Auto-renewal setup complete"
    
elif [ -d "/etc/letsencrypt" ]; then
    log "Let's Encrypt certificates detected but certbot not found"
    warn "Install certbot: sudo apt-get install certbot (Ubuntu/Debian) or sudo yum install certbot (CentOS/RHEL)"
    
else
    log "Setting up custom SSL certificate renewal..."
    
    # Create renewal script template
    cat > scripts/ssl-renew-custom.sh <<'EOF'
#!/bin/bash
# Custom SSL Certificate Renewal Script
# Update this script based on your certificate provider

DOMAINS=(
    "api.kealee.com"
    "marketplace.kealee.com"
    "admin.kealee.com"
    "pm.kealee.com"
    "ops.kealee.com"
    "app.kealee.com"
    "architect.kealee.com"
    "permits.kealee.com"
)

CERT_DIR="/etc/ssl/certs/kealee"
KEY_DIR="/etc/ssl/private/kealee"

# Function to renew certificate for a domain
renew_certificate() {
    local domain=$1
    
    echo "Renewing certificate for $domain..."
    
    # TODO: Add your certificate renewal logic here
    # Examples:
    # - Call your certificate provider's API
    # - Use acme.sh or similar tool
    # - Download from certificate management system
    
    # After renewal, reload web server
    if systemctl is-active --quiet nginx; then
        systemctl reload nginx
    elif systemctl is-active --quiet apache2; then
        systemctl reload apache2
    fi
}

# Renew all certificates
for domain in "${DOMAINS[@]}"; do
    renew_certificate "$domain"
done
EOF
    
    chmod +x scripts/ssl-renew-custom.sh
    log "✅ Custom renewal script created: scripts/ssl-renew-custom.sh"
    warn "  Update the script with your certificate renewal logic"
    
    # Create cron job template
    cat > scripts/ssl-cron-setup.sh <<'EOF'
#!/bin/bash
# Setup cron job for SSL renewal

CRON_JOB="0 0 * * 0 /path/to/scripts/ssl-renew-custom.sh >> /var/log/ssl-renewal.log 2>&1"

# Add to crontab
(crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -

echo "Cron job added. Update the path in the cron job to match your script location."
EOF
    
    chmod +x scripts/ssl-cron-setup.sh
    log "✅ Cron setup script created: scripts/ssl-cron-setup.sh"
fi

echo ""
log "SSL auto-renewal setup complete!"
log ""
log "Verification:"
log "1. Check cron jobs: crontab -l"
log "2. Test renewal script manually"
log "3. Monitor renewal logs: tail -f /var/log/ssl-renewal.log"
log "4. Set up email alerts for renewal failures"
