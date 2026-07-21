# Environment Variables Setup Guide

This guide covers setting up environment variables for all 7 Kealee Platform apps.

## Apps Overview

1. **m-ops-services** - Operations Services (Main customer-facing app)
2. **m-marketplace** - Marketplace (Contractor marketplace)
3. **m-architect** - Architect Tools
4. **m-permits-inspections** - Permits & Inspections Hub
5. **m-project-owner** - Project Owner Portal
6. **os-admin** - Admin Dashboard
7. **os-pm** - Project Manager Dashboard

---

## 1. m-ops-services (.env.production)

```env
# App Configuration
NEXT_PUBLIC_APP_URL=https://ops.kealee.com
NEXT_PUBLIC_API_URL=https://api.kealee.com
NODE_ENV=production

# Supabase Auth
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Sentry
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
SENTRY_AUTH_TOKEN=your_sentry_token
SENTRY_ORG=kealee
SENTRY_PROJECT=m-ops-services

# Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
NEXT_PUBLIC_FB_PIXEL_ID=XXXXXXXXXX
NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX

# DocuSign
DOCUSIGN_INTEGRATION_KEY=your_integration_key
DOCUSIGN_USER_ID=your_user_id
DOCUSIGN_ACCOUNT_ID=your_account_id
DOCUSIGN_RSA_PRIVATE_KEY=your_private_key
DOCUSIGN_BASE_PATH=https://demo.docusign.net

# File Storage (S3/R2)
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
S3_BUCKET_NAME=kealee-uploads
# OR for Cloudflare R2:
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=kealee-uploads
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com

# Email (SendGrid/SES)
SENDGRID_API_KEY=SG.xxx
# OR
AWS_SES_REGION=us-east-1
AWS_SES_ACCESS_KEY_ID=xxx
AWS_SES_SECRET_ACCESS_KEY=xxx

# Redis (for queues)
REDIS_URL=redis://your-redis-url:6379

# Database (if direct access needed)
DATABASE_URL=postgresql://user:password@host:5432/kealee
```

---

## 2. m-marketplace (.env.production)

```env
# App Configuration
NEXT_PUBLIC_APP_URL=https://marketplace.kealee.com
NEXT_PUBLIC_API_URL=https://api.kealee.com
NODE_ENV=production

# Supabase Auth
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
NEXT_PUBLIC_FB_PIXEL_ID=XXXXXXXXXX
NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX
NEXT_PUBLIC_HOTJAR_ID=XXXXXXXX
NEXT_PUBLIC_CUSTOMER_IO_SITE_ID=your_site_id
NEXT_PUBLIC_CUSTOMER_IO_API_KEY=your_api_key

# Sentry
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
SENTRY_AUTH_TOKEN=your_sentry_token
SENTRY_ORG=kealee
SENTRY_PROJECT=m-marketplace

# Performance Monitoring
NEXT_PUBLIC_PERFORMANCE_MONITORING_ENABLED=true
```

---

## 3. m-architect (.env.production)

```env
# App Configuration
NEXT_PUBLIC_APP_URL=https://architect.kealee.com
NEXT_PUBLIC_API_URL=https://api.kealee.com
NODE_ENV=production

# Supabase Auth
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# File Storage
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
S3_BUCKET_NAME=kealee-architect-files

# Sentry
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
```

---

## 4. m-permits-inspections (.env.production)

```env
# App Configuration
NEXT_PUBLIC_APP_URL=https://permits.kealee.com
NEXT_PUBLIC_API_URL=https://api.kealee.com
NODE_ENV=production

# Supabase Auth
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# GIS Integration
GIS_API_KEY=your_gis_api_key
GIS_API_URL=https://api.gis-provider.com

# Accela Integration (if used)
ACCELA_API_KEY=your_accela_key
ACCELA_API_SECRET=your_accela_secret
ACCELA_BASE_URL=https://api.accela.com

# Sentry
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
```

---

## 5. m-project-owner (.env.production)

```env
# App Configuration
NEXT_PUBLIC_APP_URL=https://app.kealee.com
NEXT_PUBLIC_API_URL=https://api.kealee.com
NODE_ENV=production

# Supabase Auth
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Sentry
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
```

---

## 6. os-admin (.env.production)

```env
# App Configuration
NEXT_PUBLIC_APP_URL=https://admin.kealee.com
NEXT_PUBLIC_API_URL=https://api.kealee.com
NODE_ENV=production

# Supabase Auth
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Admin-specific
ADMIN_API_KEY=your_admin_api_key
ADMIN_SECRET=your_admin_secret

# Sentry
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
```

---

## 7. os-pm (.env.production)

```env
# App Configuration
NEXT_PUBLIC_APP_URL=https://pm.kealee.com
NEXT_PUBLIC_API_URL=https://api.kealee.com
NODE_ENV=production

# Supabase Auth
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Sentry
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
```

---

## Backend API Service (.env.production)

```env
# Server Configuration
PORT=3001
NODE_ENV=production
API_BASE_URL=https://api.kealee.com

# Database
DATABASE_URL=postgresql://user:password@host:5432/kealee

# Supabase Auth
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_API_VERSION=2025-01-27.acacia

# DocuSign
DOCUSIGN_INTEGRATION_KEY=your_integration_key
DOCUSIGN_USER_ID=your_user_id
DOCUSIGN_ACCOUNT_ID=your_account_id
DOCUSIGN_RSA_PRIVATE_KEY=your_private_key
DOCUSIGN_BASE_PATH=https://demo.docusign.net

# File Storage
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
S3_BUCKET_NAME=kealee-uploads

# Redis
REDIS_URL=redis://your-redis-url:6379

# Email
SENDGRID_API_KEY=SG.xxx

# CORS Origins (comma-separated)
CORS_ORIGINS=https://kealee.com,https://ops.kealee.com,https://app.kealee.com,https://architect.kealee.com,https://permits.kealee.com,https://marketplace.kealee.com,https://admin.kealee.com,https://pm.kealee.com

# Security
JWT_SECRET=your_jwt_secret
ENCRYPTION_KEY=your_encryption_key

# Monitoring
SENTRY_DSN=https://...@sentry.io/...
```

---

## Vercel Environment Variables Setup

### For Each App:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add each variable from the corresponding `.env.production` above
3. Set environment to "Production", "Preview", and "Development" as needed

### Quick Setup Script:

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Login to Vercel
vercel login

# For each app, set environment variables
cd apps/m-ops-services
vercel env add NEXT_PUBLIC_API_URL production
# Repeat for all variables

# Or use Vercel Dashboard for bulk import
```

---

## Environment Variable Validation

Create a validation script to check all required variables:

```bash
#!/bin/bash
# validate-env.sh

APPS=(
  "m-ops-services"
  "m-marketplace"
  "m-architect"
  "m-permits-inspections"
  "m-project-owner"
  "os-admin"
  "os-pm"
)

REQUIRED_VARS=(
  "NEXT_PUBLIC_API_URL"
  "NEXT_PUBLIC_SUPABASE_URL"
  "NEXT_PUBLIC_SUPABASE_ANON_KEY"
)

for app in "${APPS[@]}"; do
  echo "Checking $app..."
  if [ -f "apps/$app/.env.production" ]; then
    for var in "${REQUIRED_VARS[@]}"; do
      if ! grep -q "^$var=" "apps/$app/.env.production"; then
        echo "  ❌ Missing: $var"
      else
        echo "  ✅ Found: $var"
      fi
    done
  else
    echo "  ⚠️  .env.production not found"
  fi
  echo ""
done
```

---

## Security Best Practices

1. **Never commit `.env.production` files** - Add to `.gitignore`
2. **Use Vercel Secrets** - Store sensitive values in Vercel Dashboard
3. **Rotate keys regularly** - Set up key rotation schedule
4. **Use different keys per environment** - Separate dev/staging/prod
5. **Limit access** - Only grant access to necessary team members
6. **Monitor usage** - Set up alerts for unusual API usage

---

## Testing Configuration

After setting up environment variables:

1. **Test API connectivity:**
   ```bash
   curl https://api.kealee.com/health
   ```

2. **Test authentication:**
   - Try logging in to each app
   - Verify Supabase connection

3. **Test API calls:**
   - Check browser DevTools → Network tab
   - Verify API requests are using correct base URL
   - Check for CORS errors

4. **Test Stripe (if applicable):**
   - Verify Stripe keys are correct
   - Test webhook endpoint

---

## Troubleshooting

### Common Issues:

1. **CORS Errors:**
   - Check `CORS_ORIGINS` in backend API
   - Verify app URL is in allowed origins

2. **Authentication Failures:**
   - Verify Supabase credentials
   - Check token expiration

3. **API Connection Errors:**
   - Verify `NEXT_PUBLIC_API_URL` is correct
   - Check API service is running
   - Verify network connectivity

4. **Missing Environment Variables:**
   - Check Vercel Dashboard → Environment Variables
   - Verify variable names match exactly (case-sensitive)
   - Check environment scope (Production/Preview/Development)

---

## Next Steps

1. Create `.env.production` files for each app
2. Set up Vercel environment variables
3. Test each app's configuration
4. Deploy to staging for verification
5. Deploy to production
