# SSL Certificate Configuration Guide

## Overview

This document provides instructions for configuring SSL certificates for all Kealee Platform subdomains and implementing automatic certificate renewal.

## Current Domain Structure

The platform uses the following subdomains:
- `kealee.com` (root)
- `www.kealee.com`
- `ops.kealee.com` (m-ops-services)
- `app.kealee.com` (m-project-owner)
- `architect.kealee.com` (m-architect)
- `permits.kealee.com` (m-permits-inspections)
- `pm.kealee.com` (os-pm)
- `admin.kealee.com` (os-admin)
- `marketplace.kealee.com` (m-marketplace)

## Recommended Solution: Vercel Automatic SSL

Vercel provides automatic SSL certificates for all deployments. No manual certificate management is required.

### 1. Domain Configuration in Vercel

1. Navigate to Vercel Dashboard → Project Settings → Domains
2. Add each subdomain:
   - `ops.kealee.com` → m-ops-services project
   - `app.kealee.com` → m-project-owner project
   - `architect.kealee.com` → m-architect project
   - `permits.kealee.com` → m-permits-inspections project
   - `pm.kealee.com` → os-pm project
   - `admin.kealee.com` → os-admin project
   - `marketplace.kealee.com` → m-marketplace project

3. Vercel will automatically:
   - Generate SSL certificates via Let's Encrypt
   - Configure DNS records
   - Enable automatic renewal
   - Handle certificate chain properly

### 2. DNS Configuration

Update DNS records at your domain registrar (NameBright) to point to Vercel:

```
Type    Name    Value                    TTL
CNAME   ops     cname.vercel-dns.com     3600
CNAME   app     cname.vercel-dns.com     3600
CNAME   architect cname.vercel-dns.com   3600
CNAME   permits cname.vercel-dns.com     3600
CNAME   pm      cname.vercel-dns.com     3600
CNAME   admin   cname.vercel-dns.com     3600
CNAME   marketplace cname.vercel-dns.com 3600

A       @       [Vercel IP - check Vercel dashboard]  3600
CNAME   www     cname.vercel-dns.com     3600
```

### 3. API Server SSL (Railway)

For the API server on Railway:

1. **Use Railway's Automatic SSL:**
   - Railway provides automatic SSL certificates via Let's Encrypt
   - Ensure domain is configured in Railway project settings
   - Railway handles certificate renewal automatically

2. **Manual Certificate Configuration (if needed):**
   ```bash
   # Install certbot
   sudo apt-get update
   sudo apt-get install certbot

   # Generate certificate
   certbot certonly --standalone -d api.kealee.com

   # Certificates will be at:
   # /etc/letsencrypt/live/api.kealee.com/fullchain.pem
   # /etc/letsencrypt/live/api.kealee.com/privkey.pem
   ```

3. **Configure Automatic Renewal:**
   ```bash
   # Add to crontab
   sudo crontab -e
   
   # Add line:
   0 0 * * * certbot renew --quiet --deploy-hook "systemctl reload your-api-service"
   ```

### 4. Certificate Chain Update

If you encounter certificate chain issues:

1. **Get Full Certificate Chain:**
   ```bash
   # Download intermediate certificates
   wget https://letsencrypt.org/certs/lets-encrypt-r3.pem
   wget https://letsencrypt.org/certs/isrg-root-x1.pem

   # Combine certificates
   cat fullchain.pem lets-encrypt-r3.pem isrg-root-x1.pem > fullchain-complete.pem
   ```

2. **Update Server Configuration:**
   ```javascript
   // In Fastify server configuration
   const https = require('https')
   const fs = require('fs')

   const server = https.createServer({
     cert: fs.readFileSync('/path/to/fullchain-complete.pem'),
     key: fs.readFileSync('/path/to/privkey.pem'),
   }, fastify.server)
   ```

### 5. Testing SSL Certificates

Test each subdomain:

```bash
# Test certificate
openssl s_client -connect ops.kealee.com:443 -showcerts

# Check certificate expiration
echo | openssl s_client -connect ops.kealee.com:443 2>/dev/null | openssl x509 -noout -dates

# Test all subdomains
for domain in ops app architect permits pm admin marketplace; do
  echo "Testing ${domain}.kealee.com..."
  openssl s_client -connect ${domain}.kealee.com:443 -servername ${domain}.kealee.com < /dev/null 2>/dev/null | openssl x509 -noout -subject -dates
done
```

### 6. SSL Monitoring

Set up monitoring for certificate expiration:

```javascript
// services/worker/src/jobs/ssl-monitoring.job.ts
// Monitor certificate expiration dates
// Send alerts if certificates expire within 30 days
```

### 7. Certificate Renewal Automation

**For Vercel:**
- Automatic - no action needed

**For Railway:**
- Automatic - no action needed

**For Custom Deployments:**
- Use certbot with automatic renewal
- Set up monitoring alerts
- Configure auto-reload of services after renewal

## Verification Checklist

- [ ] All subdomains have valid SSL certificates
- [ ] Certificate chain includes intermediate certificates
- [ ] Automatic renewal is configured
- [ ] DNS records point to correct servers
- [ ] All certificates expire more than 30 days in the future
- [ ] HTTPS redirect is enabled for all domains
- [ ] SSL monitoring is active
- [ ] Test all subdomains with SSL Labs: https://www.ssllabs.com/ssltest/

## Troubleshooting

### Certificate Chain Errors
- Ensure fullchain.pem includes intermediate certificates
- Verify certificate order (domain → intermediate → root)
- Check server configuration includes full chain

### Certificate Not Trusted
- Verify root CA is in system trust store
- Check certificate includes all required SANs
- Ensure certificate matches domain exactly

### Renewal Failures
- Check certbot logs: `/var/log/letsencrypt/letsencrypt.log`
- Verify DNS records are correct
- Ensure port 80/443 is accessible for validation
- Check firewall rules

## Production Checklist

Before going live:
- [ ] All certificates are valid
- [ ] HSTS headers are enabled
- [ ] TLS 1.2+ only
- [ ] Certificate pinning configured (optional)
- [ ] Monitoring alerts active
- [ ] Renewal process tested
- [ ] Backup certificates stored securely
