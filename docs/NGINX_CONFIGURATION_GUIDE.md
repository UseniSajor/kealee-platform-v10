# Nginx Configuration Guide

Complete guide for configuring Nginx as a reverse proxy for the Kealee Platform API.

## Quick Configuration

```bash
# Configure Nginx with default settings
./scripts/configure-nginx.sh

# With custom settings
BACKEND_PORT=3001 SERVER_NAME=api-staging.kealee.com ./scripts/configure-nginx.sh
```

## Configuration Overview

### Basic Reverse Proxy

```nginx
upstream api_backend {
    server localhost:3000;
    keepalive 32;
}

server {
    listen 80;
    server_name api.kealee.com;
    
    location / {
        proxy_pass http://api_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Installation

### Ubuntu/Debian

```bash
# Install Nginx
sudo apt-get update
sudo apt-get install nginx

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### CentOS/RHEL

```bash
# Install Nginx
sudo yum install nginx

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### macOS

```bash
# Install via Homebrew
brew install nginx

# Start Nginx
brew services start nginx
```

### Windows

1. Download from: https://nginx.org/en/download.html
2. Extract to `C:\nginx`
3. Run: `nginx.exe`

## Configuration Steps

### 1. Create Site Configuration

```bash
# Run configuration script
./scripts/configure-nginx.sh

# Or manually create config
sudo nano /etc/nginx/sites-available/api.kealee.com.conf
```

### 2. Enable Site (Debian/Ubuntu)

```bash
# Create symlink
sudo ln -s /etc/nginx/sites-available/api.kealee.com.conf \
           /etc/nginx/sites-enabled/

# Or use script
sudo ./scripts/configure-nginx.sh
```

### 3. Test Configuration

```bash
# Test Nginx configuration
sudo nginx -t

# If successful, reload Nginx
sudo systemctl reload nginx
```

### 4. Verify Setup

```bash
# Test backend connection
curl http://api.kealee.com/health

# Check logs
sudo tail -f /var/log/nginx/api-kealee-com-access.log
```

## Advanced Configuration

### Load Balancing

```nginx
upstream api_backend {
    # Round-robin (default)
    server localhost:3000;
    server localhost:3001;
    server localhost:3002;
    
    # Weighted
    server localhost:3000 weight=3;
    server localhost:3001 weight=1;
    
    # Backup server
    server localhost:3002 backup;
    
    # Keepalive connections
    keepalive 32;
}
```

### SSL/HTTPS Configuration

```nginx
server {
    listen 443 ssl http2;
    server_name api.kealee.com;
    
    # SSL certificates
    ssl_certificate /etc/ssl/certs/api.kealee.com.crt;
    ssl_certificate_key /etc/ssl/private/api.kealee.com.key;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    location / {
        proxy_pass http://api_backend;
        # ... proxy settings
    }
}

# HTTP to HTTPS redirect
server {
    listen 80;
    server_name api.kealee.com;
    return 301 https://$server_name$request_uri;
}
```

### Let's Encrypt SSL (Recommended)

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d api.kealee.com

# Auto-renewal (already configured)
sudo certbot renew --dry-run
```

### WebSocket Support

```nginx
location / {
    proxy_pass http://api_backend;
    proxy_http_version 1.1;
    
    # WebSocket headers
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    
    # Standard headers
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # Cache bypass for WebSocket
    proxy_cache_bypass $http_upgrade;
}
```

### Rate Limiting

```nginx
# Define rate limit zone
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

server {
    location / {
        # Apply rate limiting
        limit_req zone=api_limit burst=20 nodelay;
        
        proxy_pass http://api_backend;
        # ... other settings
    }
}
```

### Caching

```nginx
# Define cache zone
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m max_size=1g;

server {
    location / {
        # Enable caching
        proxy_cache api_cache;
        proxy_cache_valid 200 10m;
        proxy_cache_valid 404 1m;
        proxy_cache_use_stale error timeout updating;
        
        proxy_pass http://api_backend;
    }
}
```

## Performance Optimization

### Connection Keepalive

```nginx
upstream api_backend {
    server localhost:3000;
    keepalive 32;  # Reuse connections
}
```

### Buffering

```nginx
location / {
    proxy_buffering on;
    proxy_buffer_size 4k;
    proxy_buffers 8 4k;
    proxy_busy_buffers_size 8k;
    
    proxy_pass http://api_backend;
}
```

### Timeouts

```nginx
location / {
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
    
    proxy_pass http://api_backend;
}
```

## Security Configuration

### Hide Nginx Version

```nginx
# In nginx.conf
server_tokens off;
```

### Security Headers

```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
```

### IP Whitelisting

```nginx
location /admin {
    allow 192.168.1.0/24;
    allow 10.0.0.0/8;
    deny all;
    
    proxy_pass http://api_backend;
}
```

## Monitoring and Logging

### Access Logs

```nginx
access_log /var/log/nginx/api-access.log combined;
```

### Error Logs

```nginx
error_log /var/log/nginx/api-error.log warn;
```

### Log Rotation

```bash
# Configure logrotate
sudo nano /etc/logrotate.d/nginx

# Content:
/var/log/nginx/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data adm
    sharedscripts
    postrotate
        [ -f /var/run/nginx.pid ] && kill -USR1 `cat /var/run/nginx.pid`
    endscript
}
```

## Troubleshooting

### Test Configuration

```bash
# Test syntax
sudo nginx -t

# Check configuration
sudo nginx -T | grep -A 20 "server_name"
```

### Check Status

```bash
# Check Nginx status
sudo systemctl status nginx

# Check listening ports
sudo netstat -tlnp | grep nginx
```

### View Logs

```bash
# Access logs
sudo tail -f /var/log/nginx/access.log

# Error logs
sudo tail -f /var/log/nginx/error.log

# Specific site logs
sudo tail -f /var/log/nginx/api-kealee-com-access.log
```

### Common Issues

**502 Bad Gateway:**
- Backend server not running
- Backend port incorrect
- Firewall blocking connection

**504 Gateway Timeout:**
- Increase `proxy_read_timeout`
- Check backend server performance
- Review network connectivity

**Connection Refused:**
- Backend server not listening
- Wrong backend port
- SELinux/firewall blocking

## Best Practices

1. **Use HTTPS:**
   - Always use SSL/TLS in production
   - Use Let's Encrypt for free certificates
   - Enable HTTP/2

2. **Monitor Performance:**
   - Set up log monitoring
   - Track response times
   - Monitor error rates

3. **Security:**
   - Keep Nginx updated
   - Use security headers
   - Implement rate limiting
   - Restrict access when needed

4. **High Availability:**
   - Use load balancing
   - Configure health checks
   - Set up backup servers

## Additional Resources

- [Nginx Documentation](https://nginx.org/en/docs/)
- [Nginx Beginner's Guide](https://nginx.org/en/docs/beginners_guide.html)
- [Let's Encrypt](https://letsencrypt.org/)
- [Certbot Documentation](https://certbot.eff.org/)
