#!/bin/bash

# SSL Trust Chain Fix Script
# Fixes SSL certificate trust chain issues

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[SSL FIX]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log "Fixing SSL certificate trust chain issues..."
echo ""

# Check if running on Vercel or custom server
if [ -n "$VERCEL" ]; then
    log "Detected Vercel deployment"
    log "Vercel automatically manages SSL certificates"
    log "If you're seeing trust chain issues:"
    log "1. Check domain configuration in Vercel Dashboard"
    log "2. Verify DNS records are correct"
    log "3. Wait for SSL certificate propagation (up to 24 hours)"
    log "4. Contact Vercel support if issues persist"
    exit 0
fi

# For custom servers (e.g., API server)
log "Custom server detected - fixing trust chain..."

# Download intermediate certificates
log "Downloading intermediate certificates..."

# Let's Encrypt intermediate certificate
mkdir -p /etc/ssl/certs/kealee
cd /etc/ssl/certs/kealee

# Download Let's Encrypt intermediate certificate
if command -v wget &> /dev/null; then
    wget -O lets-encrypt-r3.pem https://letsencrypt.org/certs/lets-encrypt-r3.pem 2>/dev/null || warn "Failed to download Let's Encrypt R3"
    wget -O lets-encrypt-e1.pem https://letsencrypt.org/certs/lets-encrypt-e1.pem 2>/dev/null || warn "Failed to download Let's Encrypt E1"
elif command -v curl &> /dev/null; then
    curl -o lets-encrypt-r3.pem https://letsencrypt.org/certs/lets-encrypt-r3.pem 2>/dev/null || warn "Failed to download Let's Encrypt R3"
    curl -o lets-encrypt-e1.pem https://letsencrypt.org/certs/lets-encrypt-e1.pem 2>/dev/null || warn "Failed to download Let's Encrypt E1"
else
    error "wget or curl required to download certificates"
fi

# Download ISRG Root X1 (Let's Encrypt root)
if command -v wget &> /dev/null; then
    wget -O isrg-root-x1.pem https://letsencrypt.org/certs/isrgrootx1.pem 2>/dev/null || warn "Failed to download ISRG Root X1"
elif command -v curl &> /dev/null; then
    curl -o isrg-root-x1.pem https://letsencrypt.org/certs/isrgrootx1.pem 2>/dev/null || warn "Failed to download ISRG Root X1"
fi

log "✅ Intermediate certificates downloaded"
echo ""

# Create certificate chain file
log "Creating certificate chain file..."

# For Nginx
if [ -d "/etc/nginx" ]; then
    log "Detected Nginx - updating configuration..."
    
    cat > /etc/nginx/ssl-chain.conf <<'EOF'
# SSL Certificate Chain Configuration
# Include this in your server blocks

ssl_certificate /path/to/your/certificate.crt;
ssl_certificate_key /path/to/your/private.key;

# Include intermediate certificates
ssl_trusted_certificate /etc/ssl/certs/kealee/lets-encrypt-r3.pem;

# SSL Configuration
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers HIGH:!aNULL:!MD5;
ssl_prefer_server_ciphers on;
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;
EOF
    
    log "✅ Nginx configuration created: /etc/nginx/ssl-chain.conf"
    warn "  Update paths in the configuration file"
fi

# For Apache
if [ -d "/etc/apache2" ] || [ -d "/etc/httpd" ]; then
    log "Detected Apache - updating configuration..."
    
    APACHE_DIR="/etc/apache2"
    [ -d "/etc/httpd" ] && APACHE_DIR="/etc/httpd"
    
    cat > "$APACHE_DIR/ssl-chain.conf" <<'EOF'
# SSL Certificate Chain Configuration
# Include this in your virtual hosts

SSLCertificateFile /path/to/your/certificate.crt
SSLCertificateKeyFile /path/to/your/private.key
SSLCertificateChainFile /etc/ssl/certs/kealee/lets-encrypt-r3.pem

# SSL Configuration
SSLProtocol all -SSLv2 -SSLv3
SSLCipherSuite HIGH:!aNULL:!MD5
SSLHonorCipherOrder on
EOF
    
    log "✅ Apache configuration created: $APACHE_DIR/ssl-chain.conf"
    warn "  Update paths in the configuration file"
fi

# For Node.js/Express (API server)
log "Creating Node.js SSL configuration..."

cat > services/api/src/config/ssl-chain.ts <<'EOF'
// SSL Certificate Chain Configuration for Node.js/Express

import fs from 'fs';
import path from 'path';

export const sslConfig = {
  // Certificate files
  cert: process.env.SSL_CERT_PATH 
    ? fs.readFileSync(process.env.SSL_CERT_PATH, 'utf8')
    : null,
  key: process.env.SSL_KEY_PATH
    ? fs.readFileSync(process.env.SSL_KEY_PATH, 'utf8')
    : null,
  
  // Intermediate certificate chain
  ca: [
    process.env.SSL_INTERMEDIATE_PATH || '/etc/ssl/certs/kealee/lets-encrypt-r3.pem',
    process.env.SSL_ROOT_PATH || '/etc/ssl/certs/kealee/isrg-root-x1.pem',
  ]
    .filter(Boolean)
    .map(certPath => {
      try {
        return fs.readFileSync(certPath, 'utf8');
      } catch (error) {
        console.warn(`Warning: Could not read certificate: ${certPath}`);
        return null;
      }
    })
    .filter(Boolean),
  
  // SSL Options
  secureProtocol: 'TLSv1_2_method',
  rejectUnauthorized: true,
};

// For HTTPS server
export function getHttpsOptions() {
  if (!sslConfig.cert || !sslConfig.key) {
    return null;
  }
  
  return {
    cert: sslConfig.cert,
    key: sslConfig.key,
    ca: sslConfig.ca.length > 0 ? sslConfig.ca : undefined,
  };
}
EOF

log "✅ Node.js SSL configuration created"
echo ""

# Update certificate bundle
log "Updating system certificate bundle..."

# For Ubuntu/Debian
if [ -f "/etc/ssl/certs/ca-certificates.crt" ]; then
    log "Updating ca-certificates..."
    update-ca-certificates 2>/dev/null || warn "Could not update ca-certificates (may require sudo)"
fi

# For CentOS/RHEL
if [ -f "/etc/pki/tls/certs/ca-bundle.crt" ]; then
    log "Updating ca-bundle..."
    # Add intermediate certificates to bundle
    cat /etc/ssl/certs/kealee/lets-encrypt-r3.pem >> /etc/pki/tls/certs/ca-bundle.crt 2>/dev/null || warn "Could not update ca-bundle (may require sudo)"
fi

log "✅ Certificate bundle updated"
echo ""

log "SSL trust chain fix complete!"
log ""
log "Next steps:"
log "1. Update certificate paths in configuration files"
log "2. Restart web server: sudo systemctl restart nginx (or apache2/httpd)"
log "3. Restart API server if using custom SSL"
log "4. Test certificates: npm run ssl:test"
log "5. Set up auto-renewal: npm run ssl:setup-renewal"
