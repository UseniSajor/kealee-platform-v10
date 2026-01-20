# Deployment Tasks - P0 Critical

## 1. DEPLOY STRIPE WEBHOOK HANDLER (P0 - Blocking Revenue)

### Current Status
- ✅ Stripe webhook handler exists at `services/api/src/modules/webhooks/stripe.webhook.ts`
- ✅ Route registered at `/billing/stripe/webhook` in `billing.routes.ts`
- ✅ Next.js proxy route exists at `apps/m-ops-services/app/api/webhooks/stripe/route.ts`
- ⚠️ Needs deployment and testing

### Deployment Steps

#### Step 1: Verify Backend API Route
The Stripe webhook endpoint is available at:
- **Backend API**: `POST /billing/stripe/webhook`
- **Next.js Proxy**: `POST /api/webhooks/stripe` (forwards to backend)

#### Step 2: Configure Environment Variables
Ensure these are set in your production environment:
```bash
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_API_VERSION=2025-01-27.acacia
```

#### Step 3: Configure Stripe Dashboard
1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://api.kealee.com/billing/stripe/webhook`
3. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
   - `invoice.payment_action_required`
   - `customer.subscription.trial_will_end`
4. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

#### Step 4: Test with Stripe CLI (Local Development)
```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe  # macOS
# or download from https://stripe.com/docs/stripe-cli

# Login to Stripe
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3001/billing/stripe/webhook

# In another terminal, trigger test events
stripe trigger checkout.session.completed
stripe trigger invoice.payment_failed
stripe trigger customer.subscription.updated
```

#### Step 5: Verify Webhook Signature Validation
The handler includes:
- ✅ Signature verification using `stripe.webhooks.constructEvent()`
- ✅ Rate limiting (100 requests/minute per IP)
- ✅ Raw body capture for signature verification
- ✅ Async event processing (returns 200 OK immediately)
- ✅ Retry logic with exponential backoff
- ✅ Comprehensive event logging

#### Step 6: Test All Event Types
```bash
# Test checkout completion
stripe trigger checkout.session.completed

# Test subscription creation
stripe trigger customer.subscription.created

# Test subscription update
stripe trigger customer.subscription.updated

# Test subscription deletion
stripe trigger customer.subscription.deleted

# Test invoice payment
stripe trigger invoice.paid

# Test payment failure
stripe trigger invoice.payment_failed

# Test payment action required
stripe trigger invoice.payment_action_required
```

#### Step 7: Monitor Webhook Delivery
- Check Stripe Dashboard → Developers → Webhooks → [Your Endpoint] → Recent deliveries
- Verify all events show "Succeeded" status
- Check backend logs for webhook processing

### Verification Checklist
- [ ] Webhook endpoint accessible at production URL
- [ ] `STRIPE_WEBHOOK_SECRET` configured correctly
- [ ] Stripe dashboard shows webhook endpoint as active
- [ ] Test events successfully processed
- [ ] Database subscriptions synced correctly
- [ ] Module entitlements enabled/disabled correctly
- [ ] Audit logs created for webhook events
- [ ] Error handling works for invalid signatures

---

## 2. DEPLOY m-marketplace LANDING PAGE (Quick Win)

### Current Status
- ✅ Deployment script exists at `apps/m-marketplace/scripts/deploy-marketplace.sh`
- ✅ Next.js app configured with analytics, SEO, performance monitoring
- ⚠️ Needs deployment to staging

### Deployment Steps

#### Step 1: Navigate to App Directory
```bash
cd apps/m-marketplace
```

#### Step 2: Set Environment Variables
Create `.env.staging` file:
```bash
NEXT_PUBLIC_API_URL=https://api.kealee.com
NEXT_PUBLIC_APP_URL=https://staging-marketplace.kealee.com
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
NEXT_PUBLIC_FB_PIXEL_ID=XXXXXXXXXX
NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX
NEXT_PUBLIC_HOTJAR_ID=XXXXXXXX
NEXT_PUBLIC_SENTRY_DSN=https://...
```

#### Step 3: Run Deployment Script
```bash
# Using bash script (Linux/macOS/Git Bash)
./scripts/deploy-marketplace.sh staging

# Or using npm
npm run deploy:staging
```

#### Step 4: Verify Deployment
1. Check deployment URL: `https://staging-marketplace.kealee.com`
2. Verify analytics tracking:
   - Open browser DevTools → Network tab
   - Look for requests to:
     - `www.google-analytics.com` (GA4)
     - `www.facebook.com` (Facebook Pixel)
     - `www.googletagmanager.com` (GTM)
     - `vars.hotjar.com` (Hotjar)
3. Test SEO:
   - View page source
   - Verify meta tags, Open Graph tags, Schema.org markup
   - Check canonical URLs
4. Test performance:
   - Run Lighthouse audit
   - Check Core Web Vitals
   - Verify PerformanceMonitor is tracking metrics

#### Step 5: Set Up Monitoring
- Configure Sentry for error tracking
- Set up uptime monitoring (e.g., UptimeRobot, Pingdom)
- Configure alerts for deployment failures

### Verification Checklist
- [ ] Site accessible at staging URL
- [ ] Analytics tracking working (GA4, Facebook Pixel, GTM)
- [ ] SEO meta tags present
- [ ] Performance monitoring active
- [ ] Error tracking configured (Sentry)
- [ ] All API endpoints responding correctly

---

## 3. FIX CRITICAL SSL CERTIFICATE ISSUES

### Current Status
- ⚠️ SSL certificate trust chain issues reported
- ⚠️ Need to verify all subdomains
- ⚠️ Need automatic renewal setup

### Fix Steps

#### Step 1: Identify SSL Issues
Check SSL certificates for all subdomains:
```bash
# Test SSL certificate
openssl s_client -connect api.kealee.com:443 -showcerts

# Check certificate chain
echo | openssl s_client -connect api.kealee.com:443 2>/dev/null | openssl x509 -noout -text

# Test all subdomains
for domain in api.kealee.com ops.kealee.com app.kealee.com architect.kealee.com permits.kealee.com marketplace.kealee.com; do
  echo "Testing $domain..."
  openssl s_client -connect $domain:443 -showcerts < /dev/null 2>/dev/null | grep -A 2 "Certificate chain"
done
```

#### Step 2: Update Certificate Chain
If using Let's Encrypt:
```bash
# Install certbot if not already installed
sudo apt-get update
sudo apt-get install certbot

# Renew certificates
sudo certbot renew --force-renewal

# Verify certificate chain includes intermediate certificates
```

If using Cloudflare:
1. Go to Cloudflare Dashboard → SSL/TLS
2. Ensure "Full (strict)" mode is enabled
3. Verify origin certificate is valid
4. Check certificate expiration dates

#### Step 3: Configure Automatic Renewal
For Let's Encrypt:
```bash
# Certbot auto-renewal is usually configured via systemd timer
# Verify it's active:
systemctl status certbot.timer

# Test renewal:
sudo certbot renew --dry-run
```

For Cloudflare:
- Certificates auto-renew, but verify in dashboard
- Set up alerts for certificate expiration

#### Step 4: Update API Service SSL Configuration
If the API service has SSL trust issues, update the certificate chain:
```bash
# Download intermediate certificates
wget https://letsencrypt.org/certs/lets-encrypt-r3.pem
wget https://letsencrypt.org/certs/lets-encrypt-e1.pem

# Combine with your certificate
cat your-cert.pem lets-encrypt-r3.pem lets-encrypt-e1.pem > full-chain.pem

# Update your server configuration to use full-chain.pem
```

#### Step 5: Test All Subdomains
Create a test script:
```bash
#!/bin/bash
# test-ssl.sh

DOMAINS=(
  "api.kealee.com"
  "ops.kealee.com"
  "app.kealee.com"
  "architect.kealee.com"
  "permits.kealee.com"
  "marketplace.kealee.com"
  "staging-marketplace.kealee.com"
)

for domain in "${DOMAINS[@]}"; do
  echo "Testing $domain..."
  
  # Check certificate validity
  expiry=$(echo | openssl s_client -connect $domain:443 -servername $domain 2>/dev/null | openssl x509 -noout -enddate | cut -d= -f2)
  echo "  Expires: $expiry"
  
  # Check certificate chain
  chain=$(echo | openssl s_client -connect $domain:443 -servername $domain 2>/dev/null | grep -c "BEGIN CERTIFICATE")
  echo "  Chain length: $chain certificates"
  
  # Check SSL Labs rating (requires API key)
  # curl "https://api.ssllabs.com/api/v3/analyze?host=$domain"
  
  echo ""
done
```

#### Step 6: Update Vercel/Deployment Platform SSL
If using Vercel:
- SSL is automatically managed
- Verify in Vercel Dashboard → Settings → Domains
- Ensure all domains have valid SSL certificates

### Verification Checklist
- [ ] All subdomains have valid SSL certificates
- [ ] Certificate chain is complete (includes intermediate certs)
- [ ] Certificates not expiring soon (check expiration dates)
- [ ] Automatic renewal configured and tested
- [ ] SSL Labs rating is A or A+
- [ ] No certificate warnings in browsers
- [ ] API service can make HTTPS requests without trust errors

---

## Quick Reference

### Stripe Webhook Endpoint
- **Production**: `https://api.kealee.com/billing/stripe/webhook`
- **Local Test**: `http://localhost:3001/billing/stripe/webhook`

### Marketplace URLs
- **Production**: `https://marketplace.kealee.com`
- **Staging**: `https://staging-marketplace.kealee.com`

### SSL Test Commands
```bash
# Test single domain
openssl s_client -connect api.kealee.com:443 -showcerts

# Check expiration
echo | openssl s_client -connect api.kealee.com:443 2>/dev/null | openssl x509 -noout -enddate

# Test with curl
curl -vI https://api.kealee.com
```

---

## Support Contacts
- **Stripe Issues**: Check Stripe Dashboard → Developers → Webhooks
- **Deployment Issues**: Check Vercel Dashboard → Deployments
- **SSL Issues**: Check Cloudflare Dashboard or server logs
