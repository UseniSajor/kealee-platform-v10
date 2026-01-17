# Kealee Platform V10 - Production Setup Checklist

**Date Started:** 2026-01-17
**Target:** Complete production-ready deployment on Railway

---

## ✅ Setup Progress Tracker

- [ ] 1. Supabase (Authentication & Database)
- [ ] 2. Railway Postgres (Alternative to Supabase DB)
- [ ] 3. Stripe (Payments & Billing)
- [ ] 4. Cloudflare R2 (File Storage)
- [ ] 5. SendGrid (Email Delivery)
- [ ] 6. Upstash Redis (Background Jobs)
- [ ] 7. Anthropic Claude (AI Features)
- [ ] 8. DocuSign (E-Signatures)
- [ ] 9. Google Maps API (Location Services)
- [ ] 10. Security Secrets (JWT, Webhooks)
- [ ] 11. Railway Variables Configuration
- [ ] 12. Deploy & Test
- [ ] 13. Custom Domain Setup
- [ ] 14. SSL/HTTPS Configuration
- [ ] 15. Monitoring & Alerts

---

## 1. 🔐 Supabase Setup (Authentication & Database)

**Purpose:** User authentication, database hosting  
**Cost:** FREE tier available (50,000 MAU, 500MB database)  
**Required for:** Core functionality

### Steps:

1. **Sign Up:**
   - Go to: https://supabase.com/dashboard
   - Click "New Project"
   - Organization: Create new or select existing
   - Project name: `kealee-platform-prod`
   - Database password: Generate strong password (SAVE THIS!)
   - Region: Choose closest to your users (e.g., `us-east-1`)
   - Click "Create new project"

2. **Get Credentials:**
   - Wait for project to finish setting up (~2 minutes)
   - Go to: **Settings** → **API**
   - Copy these values:
     ```
     Project URL: https://xxxxx.supabase.co
     anon public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
     service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (keep secret!)
     ```

3. **Configure Database:**
   - Go to: **Settings** → **Database**
   - Copy: **Connection string** (for Railway if not using Supabase DB)
   ```
   postgresql://postgres.[project-id]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres
   ```

4. **Enable Email Auth:**
   - Go to: **Authentication** → **Providers**
   - Enable: Email (enabled by default)
   - Configure: Email templates (optional)

5. **Set Auth Redirect URLs:**
   - Go to: **Authentication** → **URL Configuration**
   - Add your production domains:
     ```
     Site URL: https://yourdomain.com
     Redirect URLs: 
     - https://yourdomain.com/*
     - https://app.yourdomain.com/*
     - https://your-api.railway.app/*
     ```

### Railway Variables:
```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (optional, for admin operations)
```

---

## 2. 🗄️ Railway Postgres (Alternative Database)

**Purpose:** PostgreSQL database (alternative to Supabase DB)  
**Cost:** ~$5/month  
**Required for:** If using Railway instead of Supabase for database

### Steps:

1. **Add Postgres Service:**
   - In Railway Dashboard → Your Project
   - Click "New" → "Database" → "Add PostgreSQL"
   - Wait for provisioning

2. **Get Connection String:**
   - Click on Postgres service
   - Go to "Variables" tab
   - Copy `DATABASE_URL` (auto-generated)

### Railway Variables:
```env
DATABASE_URL=postgresql://postgres:password@host:port/railway?sslmode=require
```

**Note:** Use either Supabase DB OR Railway Postgres, not both.

---

## 3. 💳 Stripe Setup (Payments & Billing)

**Purpose:** Subscription payments, invoicing  
**Cost:** FREE (2.9% + 30¢ per transaction)  
**Required for:** Billing module

### Steps:

1. **Sign Up:**
   - Go to: https://dashboard.stripe.com/register
   - Complete verification process

2. **Get Test Keys:**
   - Go to: https://dashboard.stripe.com/test/apikeys
   - Copy:
     ```
     Publishable key: pk_test_...
     Secret key: sk_test_...
     ```

3. **Create Products:**
   - Go to: **Products** → "Add product"
   - Create your subscription tiers:
     - Starter: $29/month
     - Professional: $99/month
     - Enterprise: Custom
   - Note the Product IDs

4. **Configure Webhooks (Later):**
   - Go to: **Developers** → **Webhooks**
   - Add endpoint: `https://your-api.railway.app/stripe/webhook`
   - Select events:
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
   - Copy webhook signing secret

5. **Activate Account (For Production):**
   - Complete business verification
   - Add bank account details
   - Switch to live mode
   - Get live API keys

### Railway Variables:
```env
# Test mode (development)
STRIPE_SECRET_KEY=sk_test_your_test_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_test_key
STRIPE_WEBHOOK_SECRET=whsec_test_your_webhook_secret

# Production mode (switch when ready)
# STRIPE_SECRET_KEY=sk_live_your_live_key
# STRIPE_PUBLISHABLE_KEY=pk_live_your_live_key
# STRIPE_WEBHOOK_SECRET=whsec_live_your_webhook_secret
```

---

## 4. 💾 Cloudflare R2 Setup (File Storage)

**Purpose:** Document storage, images, PDFs, BIM files  
**Cost:** FREE for first 10GB storage, $0.015/GB thereafter  
**Required for:** File uploads, document management

### Steps:

1. **Sign Up / Login:**
   - Go to: https://dash.cloudflare.com/
   - Navigate to: **R2 Object Storage** (left sidebar)

2. **Create Bucket:**
   - Click "Create bucket"
   - Bucket name: `kealee-files-prod`
   - Location: Automatic
   - Click "Create bucket"

3. **Create API Token:**
   - Go to: **R2** → **Manage R2 API Tokens**
   - Click "Create API Token"
   - Token name: `kealee-api-token`
   - Permissions: **Object Read & Write**
   - TTL: Never expire (or set expiry)
   - Click "Create API Token"
   - **SAVE IMMEDIATELY** (shown only once):
     ```
     Access Key ID: xxxxxxxxxxxxxxxx
     Secret Access Key: yyyyyyyyyyyyyyyy
     ```

4. **Get Account ID:**
   - In R2 dashboard, look at the URL or bucket settings
   - Account ID is in the S3 endpoint URL
   - Format: `https://[ACCOUNT-ID].r2.cloudflarestorage.com`

5. **Configure Public Access (Optional):**
   - For public files (images, etc.)
   - Go to bucket → Settings → Public Access
   - Enable custom domain or public URL

### Railway Variables:
```env
AWS_ACCESS_KEY_ID=your_r2_access_key_id
AWS_SECRET_ACCESS_KEY=your_r2_secret_access_key
AWS_REGION=auto
AWS_ENDPOINT=https://YOUR-ACCOUNT-ID.r2.cloudflarestorage.com
AWS_BUCKET_NAME=kealee-files-prod
```

---

## 5. 📧 SendGrid Setup (Email Delivery)

**Purpose:** Transactional emails, notifications  
**Cost:** FREE (100 emails/day), $15/month (40,000 emails)  
**Required for:** User notifications, password resets

### Steps:

1. **Sign Up:**
   - Go to: https://signup.sendgrid.com/
   - Complete registration
   - Verify email address

2. **Create API Key:**
   - Go to: **Settings** → **API Keys**
   - Click "Create API Key"
   - Name: `kealee-production`
   - Access: **Full Access** (or **Restricted** with Mail Send only)
   - Click "Create & View"
   - **COPY AND SAVE** (shown only once):
     ```
     SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
     ```

3. **Verify Sender Email:**
   - **Option A - Single Sender (Quick):**
     - Go to: **Settings** → **Sender Authentication**
     - Click "Verify a Single Sender"
     - Email: `noreply@yourdomain.com`
     - Complete verification
   
   - **Option B - Domain Authentication (Recommended for Production):**
     - Go to: **Settings** → **Sender Authentication**
     - Click "Authenticate Your Domain"
     - Domain: `yourdomain.com`
     - Add DNS records to your domain provider
     - Wait for verification (up to 48 hours)

4. **Create Email Templates (Optional):**
   - Go to: **Email API** → **Dynamic Templates**
   - Create templates for:
     - Welcome email
     - Password reset
     - Invoice notifications
     - etc.

### Railway Variables:
```env
SENDGRID_API_KEY=SG.your_actual_api_key_here
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
SENDGRID_FROM_NAME=Kealee Platform
```

---

## 6. 🔄 Upstash Redis Setup (Background Jobs)

**Purpose:** Queue system for emails, webhooks, reports  
**Cost:** FREE (10,000 commands/day), $0.20/100k commands  
**Required for:** Worker service, background processing

### Steps:

1. **Sign Up:**
   - Go to: https://console.upstash.com/
   - Sign up with GitHub or email

2. **Create Redis Database:**
   - Click "Create Database"
   - Name: `kealee-prod-redis`
   - Type: **Regional** (cheaper) or **Global** (better latency)
   - Region: Choose closest to Railway deployment
   - TLS: **Enabled**
   - Eviction: **No eviction**
   - Click "Create"

3. **Get Connection Details:**
   - Click on your database
   - Copy connection string from **REST API** or **Redis** tab:
     ```
     rediss://default:YOUR_PASSWORD@your-host.upstash.io:6379
     ```

4. **Test Connection (Optional):**
   - Use Redis CLI or Upstash web CLI
   - Test: `SET test "hello"` and `GET test`

### Railway Variables:
```env
REDIS_URL=rediss://default:your_password@your-host.upstash.io:6379
```

---

## 7. 🤖 Anthropic Claude Setup (AI Features)

**Purpose:** AI-powered features, document analysis  
**Cost:** Pay-as-you-go (~$3-15 per million tokens)  
**Required for:** ML processing, intelligent features

### Steps:

1. **Sign Up:**
   - Go to: https://console.anthropic.com/
   - Create account

2. **Add Credits:**
   - Go to: **Billing**
   - Add payment method
   - Purchase credits (start with $10-20)

3. **Create API Key:**
   - Go to: **API Keys**
   - Click "Create Key"
   - Name: `kealee-production`
   - Click "Create"
   - **COPY AND SAVE:**
     ```
     sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
     ```

4. **Set Usage Limits (Recommended):**
   - Go to: **Settings** → **Usage Limits**
   - Set monthly spend limit (e.g., $100)
   - Enable alerts at 50%, 80%, 100%

### Railway Variables:
```env
ANTHROPIC_API_KEY=sk-ant-api03-your_actual_key_here
ANTHROPIC_MODEL=claude-3-sonnet-20240229
```

---

## 8. ✍️ DocuSign Setup (E-Signatures)

**Purpose:** Digital signatures for contracts, permits  
**Cost:** FREE developer account (sandbox), Production requires subscription  
**Required for:** Contract signing, permit approvals

### Steps:

1. **Sign Up for Developer Account:**
   - Go to: https://developers.docusign.com/
   - Click "Get a Developer Account"
   - Complete registration

2. **Create Integration Key:**
   - Login to: https://admindemo.docusign.com/
   - Go to: **Settings** → **Integrations** → **Apps and Keys**
   - Click "Add App and Integration Key"
   - App Name: `Kealee Platform`
   - Click "Create App"
   - **Save Integration Key** (shown immediately)

3. **Generate RSA Keypair:**
   - In the same app, scroll to **Authentication**
   - Click "Generate RSA"
   - **Download private key** (save as `docusign-private.key`)
   - Copy the public key (automatically added to DocuSign)

4. **Get User ID and Account ID:**
   - User ID: Click your profile (top right) → User ID
   - Account ID: Settings → API and Keys → Account ID (API)

5. **Grant Consent:**
   - Get consent URL:
     ```
     https://account-d.docusign.com/oauth/auth?response_type=code&scope=signature%20impersonation&client_id=YOUR_INTEGRATION_KEY&redirect_uri=https://www.docusign.com
     ```
   - Replace `YOUR_INTEGRATION_KEY` and visit URL
   - Click "Allow Access"

6. **For Production (Later):**
   - Go live process: https://developers.docusign.com/platform/go-live/
   - Submit app for review
   - Get production credentials

### Format Private Key:
Convert the private key to single-line format for environment variable:
```bash
# In PowerShell
$key = Get-Content docusign-private.key -Raw
$key -replace "`n","\n"
```

### Railway Variables:
```env
DOCUSIGN_INTEGRATION_KEY=your_integration_key_here
DOCUSIGN_API_ACCOUNT_ID=your_account_id
DOCUSIGN_USER_ID=your_user_id
DOCUSIGN_RSA_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\nYOUR_PRIVATE_KEY_CONTENT_HERE\n-----END RSA PRIVATE KEY-----"
DOCUSIGN_BASE_PATH=https://demo.docusign.net/restapi
```

---

## 9. 🗺️ Google Maps API Setup (Location Services)

**Purpose:** Address autocomplete, geocoding, maps  
**Cost:** $200 FREE credit/month, then pay-as-you-go  
**Required for:** Marketplace, property locations

### Steps:

1. **Create Google Cloud Project:**
   - Go to: https://console.cloud.google.com/
   - Click "Select a project" → "New Project"
   - Project name: `kealee-platform`
   - Click "Create"

2. **Enable APIs:**
   - Go to: **APIs & Services** → **Library**
   - Enable these APIs:
     - Maps JavaScript API
     - Places API
     - Geocoding API
     - Directions API (optional)

3. **Create API Key:**
   - Go to: **APIs & Services** → **Credentials**
   - Click "Create Credentials" → "API Key"
   - **SAVE the key**
   - Click "Edit API Key" to restrict it

4. **Restrict API Key:**
   - Application restrictions:
     - HTTP referrers: `https://yourdomain.com/*`
   - API restrictions:
     - Restrict key to selected APIs
     - Select: Maps JavaScript API, Places API, Geocoding API
   - Click "Save"

5. **Enable Billing:**
   - Go to: **Billing**
   - Link billing account
   - Set budget alerts (recommended: $50/month)

### Railway Variables:
```env
GOOGLE_MAPS_API_KEY=AIzaSyC_your_actual_google_maps_key
```

---

## 10. 🔒 Generate Security Secrets

**Purpose:** Secure tokens, JWT signing, webhook verification  
**Cost:** FREE  
**Required for:** Security

### Generate Secrets:

**Option 1 - PowerShell:**
```powershell
# Generate 64-character random string
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_})
```

**Option 2 - Online:**
- Go to: https://generate-secret.vercel.app/64
- Click "Generate" multiple times

**Option 3 - OpenSSL (if installed):**
```bash
openssl rand -base64 64
```

### Railway Variables:
```env
JWT_SECRET=your_64_char_random_string_here
SESSION_SECRET=different_64_char_random_string
WEBHOOK_SECRET=another_64_char_random_string
ENCRYPTION_KEY=yet_another_64_char_random_string
```

---

## 11. 📝 Complete Railway Variables Configuration

### Copy ALL variables to Railway:

1. Go to: **Railway Dashboard** → Your API Service → **Variables**
2. Click **"RAW Editor"** (easier for bulk paste)
3. Paste all your configured variables:

```env
# ========================================
# CORE / REQUIRED
# ========================================
DATABASE_URL=postgresql://postgres:password@host:port/database
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
STRIPE_SECRET_KEY=sk_test_your_stripe_key

# ========================================
# GENERAL
# ========================================
NODE_ENV=production
PORT=3001

# ========================================
# FILE STORAGE (Cloudflare R2)
# ========================================
AWS_ACCESS_KEY_ID=your_r2_access_key
AWS_SECRET_ACCESS_KEY=your_r2_secret_key
AWS_REGION=auto
AWS_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
AWS_BUCKET_NAME=kealee-files-prod

# ========================================
# EMAIL (SendGrid)
# ========================================
SENDGRID_API_KEY=SG.your_sendgrid_key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
SENDGRID_FROM_NAME=Kealee Platform

# ========================================
# REDIS (Upstash)
# ========================================
REDIS_URL=rediss://default:password@your-host.upstash.io:6379

# ========================================
# AI (Anthropic Claude)
# ========================================
ANTHROPIC_API_KEY=sk-ant-api03-your_key
ANTHROPIC_MODEL=claude-3-sonnet-20240229

# ========================================
# DOCUSIGN
# ========================================
DOCUSIGN_INTEGRATION_KEY=your_integration_key
DOCUSIGN_API_ACCOUNT_ID=your_account_id
DOCUSIGN_USER_ID=your_user_id
DOCUSIGN_RSA_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\nKEY_CONTENT\n-----END RSA PRIVATE KEY-----"
DOCUSIGN_BASE_PATH=https://demo.docusign.net/restapi

# ========================================
# GOOGLE MAPS
# ========================================
GOOGLE_MAPS_API_KEY=AIzaSyC_your_google_maps_key

# ========================================
# SECURITY SECRETS
# ========================================
JWT_SECRET=your_64_char_random_string
SESSION_SECRET=different_64_char_string
WEBHOOK_SECRET=another_64_char_string
ENCRYPTION_KEY=yet_another_64_char_string

# ========================================
# CORS / FRONTEND
# ========================================
FRONTEND_URL=https://yourdomain.com
ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com

# ========================================
# WEBHOOKS
# ========================================
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# ========================================
# OPTIONAL - MONITORING
# ========================================
LOG_LEVEL=info
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_MS=60000
```

4. Click **"Save"**
5. Railway will automatically redeploy

---

## 12. 🚀 Deploy & Test

### A. Watch Deployment:
1. Go to: **Deployments** tab
2. Watch build logs for success
3. Look for:
   ```
   ✓ Database package built
   ✓ Workflow-engine package built
   Build time: ~90 seconds
   ```

### B. Test Endpoints:

```bash
# Health check
curl https://your-service.railway.app/health
# Should return: {"status":"ok"}

# API documentation
https://your-service.railway.app/docs
```

### C. Test Authentication:
```bash
curl -X POST https://your-service.railway.app/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123456!"}'
```

### D. Test File Upload (if R2 configured):
```bash
curl -X POST https://your-service.railway.app/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@test.pdf"
```

---

## 13. 🌐 Custom Domain Setup

### A. In Railway:
1. Go to: **Settings** → **Domains**
2. Click "Add Domain"
3. Enter: `api.yourdomain.com`
4. Copy the CNAME record shown

### B. In Your DNS Provider:
1. Go to your domain registrar (Cloudflare, Namecheap, etc.)
2. Add CNAME record:
   ```
   Type: CNAME
   Name: api
   Value: your-service.railway.app
   TTL: Auto or 3600
   ```
3. Save changes
4. Wait for DNS propagation (5 minutes - 24 hours)

### C. Verify:
```bash
curl https://api.yourdomain.com/health
```

---

## 14. 🔐 SSL/HTTPS Configuration

**Good news:** Railway automatically provides SSL certificates!

- Railway uses Let's Encrypt
- Certificates auto-renew
- HTTPS is enforced by default
- No manual configuration needed

---

## 15. 📊 Monitoring & Alerts

### A. Railway Built-in Monitoring:
- Go to: **Metrics** tab
- Monitor:
  - CPU usage
  - Memory usage
  - Network traffic
  - Request count

### B. Set Up Healthchecks:
Already configured in your `Dockerfile`:
```dockerfile
HEALTHCHECK --interval=30s --timeout=3s \
  CMD node -e "require('http').get('http://localhost:3001/health')"
```

### C. Optional: Add Sentry (Error Tracking):
1. Sign up: https://sentry.io/
2. Create project
3. Get DSN
4. Add to Railway:
   ```env
   SENTRY_DSN=https://xxxxx@o123456.ingest.sentry.io/123456
   ```

### D. Set Up Alerts:
- Railway notifications for deployment failures
- Upstash alerts for Redis usage
- Stripe webhooks for payment issues
- SendGrid alerts for email bounces

---

## 📋 Final Checklist

### Pre-Launch:
- [ ] All environment variables set
- [ ] API responding to /health endpoint
- [ ] Swagger docs accessible at /docs
- [ ] Authentication working (signup/login)
- [ ] Database migrations run successfully
- [ ] File uploads working (if R2 configured)
- [ ] Emails sending (if SendGrid configured)
- [ ] Stripe webhooks configured
- [ ] Custom domain pointing to Railway
- [ ] SSL certificate active

### Post-Launch:
- [ ] Monitor error rates
- [ ] Check API response times
- [ ] Verify email delivery rates
- [ ] Monitor Stripe payment success
- [ ] Review logs daily for first week
- [ ] Set up automated backups
- [ ] Document incident response procedures

---

## 🆘 Troubleshooting

### Issue: Build Fails
- Check Railway build logs
- Verify all workspace packages build correctly
- Check for TypeScript errors

### Issue: App Crashes on Start
- Check runtime logs in Railway
- Verify all required environment variables are set
- Check DATABASE_URL connection

### Issue: 502 Bad Gateway
- App is crashing during startup
- Check logs for missing environment variables
- Verify database connection

### Issue: Emails Not Sending
- Check SendGrid API key is valid
- Verify sender email is verified
- Check SendGrid activity log

### Issue: File Uploads Fail
- Verify R2 credentials
- Check bucket permissions
- Test R2 connection directly

---

## 📞 Support Resources

- **Railway:** https://railway.app/help
- **Supabase:** https://supabase.com/docs
- **Stripe:** https://support.stripe.com/
- **SendGrid:** https://support.sendgrid.com/
- **Cloudflare:** https://community.cloudflare.com/
- **Upstash:** https://docs.upstash.com/

---

**Created:** 2026-01-17  
**Last Updated:** 2026-01-17  
**Status:** In Progress  
**Next Step:** Begin with Supabase setup
