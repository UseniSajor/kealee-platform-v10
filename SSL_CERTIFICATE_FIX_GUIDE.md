# SSL Certificate Fix Guide

## Overview

This guide covers diagnosing and fixing SSL certificate issues for all Kealee Platform API services and subdomains.

---

## Quick Start

### Run Complete SSL Fix
```bash
npm run ssl:fix-all
```

### Run Individual Steps
```bash
npm run ssl:diagnose        # Check current certificates
npm run ssl:fix            # Fix trust chain issues
npm run ssl:test           # Test all subdomains
npm run ssl:setup-renewal  # Set up auto-renewal
```

---

## Step 1: Diagnose Current SSL Certificates

### What It Does
- Checks certificate validity for all subdomains
- Identifies expired or expiring certificates
- Verifies trust chain completeness
- Checks certificate chain
- Validates Subject Alternative Names
- Tests cipher strength

### Run
```bash
npm run ssl:diagnose
```

### Output
- Certificate expiry dates
- Trust chain status
- Certificate chain completeness
- Domain validation
- Cipher information

### Common Issues Found
- **Expired certificates**: Certificate has passed expiry date
- **Expiring soon**: Certificate expires within 30 days
- **Trust chain issues**: Intermediate certificates missing
- **Incomplete chain**: Certificate chain not properly configured

---

## Step 2: Fix Trust Chain Issues

### What It Does
- Downloads intermediate certificates (Let's Encrypt)
- Creates certificate chain files
- Updates web server configurations (Nginx/Apache)
- Configures Node.js/Express SSL
- Updates system certificate bundles

### Run
```bash
npm run ssl:fix
```

### Requirements
- Root/sudo access (for system certificate updates)
- Web server access (Nginx/Apache configuration)

### Configuration Files Created
- `/etc/nginx/ssl-chain.conf` - Nginx SSL configuration
- `/etc/apache2/ssl-chain.conf` - Apache SSL configuration
- `services/api/src/config/ssl-chain.ts` - Node.js SSL configuration

### Manual Steps Required
1. Update certificate paths in configuration files
2. Restart web server:
   ```bash
   sudo systemctl restart nginx    # For Nginx
   sudo systemctl restart apache2  # For Apache
   sudo systemctl restart httpd    # For CentOS/RHEL
   ```
3. Restart API server if using custom SSL

---

## Step 3: Test All Subdomains

### What It Does
- Tests HTTPS connection for each subdomain
- Validates SSL certificates
- Verifies certificate chains
- Checks TLS versions
- Tests cipher suites
- Validates certificate expiry

### Run
```bash
npm run ssl:test
```

### Domains Tested
- api.kealee.com
- marketplace.kealee.com
- admin.kealee.com
- pm.kealee.com
- ops.kealee.com
- app.kealee.com
- architect.kealee.com
- permits.kealee.com

### Expected Results
- ✅ All HTTPS connections successful
- ✅ All SSL certificates valid
- ✅ All certificate chains valid
- ✅ All certificates not expiring soon

---

## Step 4: Set Up Auto-Renewal

### What It Does
- Sets up automatic certificate renewal
- Creates renewal scripts
- Configures cron jobs
- Tests renewal process

### Run
```bash
npm run ssl:setup-renewal
```

### For Vercel
- Auto-renewal is automatic
- No additional setup required
- Certificates renew automatically before expiry

### For Let's Encrypt (Certbot)
- Creates renewal script: `/usr/local/bin/ssl-renew-kealee.sh`
- Sets up cron job (runs twice daily)
- Certbot only renews when needed (within 30 days of expiry)

### For Custom Certificates
- Creates template renewal script: `scripts/ssl-renew-custom.sh`
- Update script with your certificate provider's API
- Set up cron job manually

### Verification
```bash
# Check cron jobs
crontab -l

# Test renewal (dry run)
certbot renew --dry-run

# Monitor renewal logs
tail -f /var/log/ssl-renewal.log
```

---

## Troubleshooting

### Certificate Not Trusted

**Issue**: Browser shows "Certificate not trusted" error

**Solution**:
1. Check if intermediate certificates are included
2. Run trust chain fix: `npm run ssl:fix`
3. Verify certificate chain in browser
4. Check certificate bundle is updated

### Certificate Expired

**Issue**: Certificate has expired

**Solution**:
1. Renew certificate immediately
2. For Let's Encrypt: `certbot renew`
3. For Vercel: Check domain configuration
4. Restart web server after renewal

### Trust Chain Issues

**Issue**: "Certificate chain is incomplete" error

**Solution**:
1. Download intermediate certificates
2. Include in web server configuration
3. Update certificate chain file
4. Restart web server

### Vercel SSL Issues

**Issue**: SSL issues on Vercel deployments

**Solution**:
1. Check domain configuration in Vercel Dashboard
2. Verify DNS records are correct
3. Wait for SSL propagation (up to 24 hours)
4. Contact Vercel support if issues persist

### Custom Server SSL Issues

**Issue**: SSL not working on custom API server

**Solution**:
1. Verify certificate files are in correct location
2. Check file permissions (certificates readable, keys secure)
3. Verify certificate chain is complete
4. Check web server configuration
5. Review SSL logs

---

## Best Practices

### Certificate Management
- ✅ Monitor certificate expiry dates
- ✅ Set up auto-renewal
- ✅ Test certificates regularly
- ✅ Keep intermediate certificates updated
- ✅ Use strong cipher suites
- ✅ Enable TLS 1.2+ only

### Security
- ✅ Use secure private key storage
- ✅ Restrict certificate file permissions
- ✅ Enable HSTS (HTTP Strict Transport Security)
- ✅ Use certificate pinning for mobile apps
- ✅ Regular security audits

### Monitoring
- ✅ Set up alerts for certificate expiry
- ✅ Monitor SSL/TLS errors
- ✅ Track certificate renewal success
- ✅ Review SSL logs regularly

---

## Verification Checklist

After fixing SSL issues, verify:

- [ ] All subdomains have valid certificates
- [ ] Trust chain is complete
- [ ] Certificates not expiring soon
- [ ] HTTPS connections work
- [ ] Auto-renewal configured
- [ ] Web server restarted
- [ ] No SSL errors in logs
- [ ] Browser shows valid certificate
- [ ] SSL Labs test passes (A or A+ rating)

---

## SSL Labs Testing

Test your SSL configuration:
1. Go to https://www.ssllabs.com/ssltest/
2. Enter your domain
3. Review SSL rating (aim for A or A+)
4. Fix any issues identified

---

## Support

For SSL certificate issues:
1. Run diagnosis: `npm run ssl:diagnose`
2. Review error messages
3. Check this guide for solutions
4. Contact support if issues persist

---

## Quick Reference

```bash
# Complete SSL fix
npm run ssl:fix-all

# Individual steps
npm run ssl:diagnose        # Diagnose issues
npm run ssl:fix            # Fix trust chain
npm run ssl:test           # Test subdomains
npm run ssl:setup-renewal  # Auto-renewal

# Manual checks
openssl s_client -servername domain.com -connect domain.com:443
curl -vI https://domain.com
```

---

## Next Steps

1. Run complete SSL fix: `npm run ssl:fix-all`
2. Verify all tests pass
3. Set up monitoring alerts
4. Schedule regular SSL audits
5. Document certificate locations and renewal process
