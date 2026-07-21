# Environment Variables Setup Guide

**Date:** January 19, 2025  
**Purpose:** Complete guide for setting up all production environment variables

---

## Overview

This guide covers all environment variables required for:
- **Railway** (API service)
- **Vercel** (6 frontend apps)

---

## Railway (API Service) - Environment Variables

### Required Variables

#### Database
```bash
DATABASE_URL=postgresql://user:password@host:port/database
```
**Where to find:** Railway → PostgreSQL Service → Variables → `DATABASE_URL`  
**Format:** Must start with `postgresql://`  
**⚠️ Must be production database (not localhost)**

#### Supabase
```bash
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
**Where to find:** Supabase Dashboard → Settings → API  
**Format:** 
- URL: Must be `https://xxx.supabase.co`
- Service Key: Must start with `eyJ` (JWT token)
**⚠️ Must be production Supabase project (not local)**

#### Stripe (LIVE Mode)
```bash
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxx
```
**Where to find:** Stripe Dashboard → Developers → API keys (LIVE mode)  
**Format:**
- Secret Key: Must start with `sk_live_`
- Publishable Key: Must start with `pk_live_`
- Webhook Secret: Must start with `whsec_`
**⚠️ Must be LIVE keys (not test keys starting with sk_test_ or pk_test_)**

#### Stripe Products & Prices
```bash
STRIPE_PRODUCT_PACKAGE_A=prod_xxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_PRODUCT_PACKAGE_B=prod_xxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_PRODUCT_PACKAGE_C=prod_xxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_PRODUCT_PACKAGE_D=prod_xxxxxxxxxxxxxxxxxxxxxxxx

STRIPE_PRICE_PACKAGE_A_MONTHLY=price_xxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_PRICE_PACKAGE_B_MONTHLY=price_xxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_PRICE_PACKAGE_C_MONTHLY=price_xxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_PRICE_PACKAGE_D_MONTHLY=price_xxxxxxxxxxxxxxxxxxxxxxxx
```
**Where to find:** Stripe Dashboard → Products (LIVE mode)  
**Format:** Must start with `prod_` or `price_`  
**⚠️ Must be from LIVE mode products**

#### CORS
```bash
CORS_ORIGINS=https://os-admin.kealee.com,https://os-pm.kealee.com,https://m-ops-services.kealee.com,https://m-project-owner.kealee.com,https://m-architect.kealee.com,https://m-permits-inspections.kealee.com
```
**Format:** Comma-separated list of production domains  
**⚠️ Must be production domains (not localhost)**

#### Security
```bash
NODE_ENV=production
JWT_SECRET=your-secure-random-string-min-32-chars
CSRF_SECRET=your-secure-random-string-min-32-chars
```
**Format:**
- `NODE_ENV`: Must be `production` or `preview`
- `JWT_SECRET`: Minimum 32 characters, secure random string
- `CSRF_SECRET`: Minimum 32 characters, secure random string

**Generate secrets:**
```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Using OpenSSL
openssl rand -hex 32
```

#### Optional Variables
```bash
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
REDIS_URL=redis://user:password@host:port
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxx
PORT=3000
```

---

## Vercel - Environment Variables

### Common Variables (All Apps)

These must be set for **all 6 apps**:

```bash
NEXT_PUBLIC_API_URL=https://api.kealee.com
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Where to find:**
- `NEXT_PUBLIC_API_URL`: Your Railway API URL
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase Dashboard → Settings → API
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase Dashboard → Settings → API

**⚠️ Must be production URLs (not localhost)**

### App-Specific Variables

#### os-admin
**No additional variables required**

#### os-pm
```bash
NEXT_PUBLIC_PM_WS_URL=wss://api.kealee.com
```
**Format:** Must start with `wss://` (secure WebSocket)

#### m-ops-services
```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxxxxxxxxxxxxx
```
**Where to find:** Stripe Dashboard → Developers → API keys (LIVE mode)  
**Format:** Must start with `pk_live_`  
**⚠️ Must be LIVE key (not pk_test_)**

#### m-project-owner
**No additional variables required**

#### m-architect
**No additional variables required**

#### m-permits-inspections
**No additional variables required**

### Optional Variables (All Apps)

```bash
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
NEXT_PUBLIC_POSTHOG_KEY=phc_xxxxxxxxxxxxxxxxxxxxxxxx
```

---

## How to Set Environment Variables

### Railway

1. Go to Railway Dashboard
2. Select your API service
3. Go to **Variables** tab
4. Click **New Variable**
5. Enter variable name and value
6. Click **Add**
7. Service will automatically redeploy

### Vercel

1. Go to Vercel Dashboard
2. Select your project (e.g., `os-admin`)
3. Go to **Settings** → **Environment Variables**
4. Click **Add New**
5. Enter variable name and value
6. Select environment: **Production**, **Preview**, or **Development**
7. Click **Save**
8. Redeploy the project

---

## Security Best Practices

### ✅ DO

- ✅ Use environment variables for all secrets
- ✅ Use different keys for production and development
- ✅ Rotate secrets regularly
- ✅ Use strong random strings for JWT_SECRET and CSRF_SECRET
- ✅ Verify all URLs are production (not localhost)
- ✅ Verify all Stripe keys are LIVE (not test)
- ✅ Keep secrets secure and never commit to git

### ❌ DON'T

- ❌ Never commit secrets to git
- ❌ Never use test keys in production
- ❌ Never use localhost URLs in production
- ❌ Never share secrets in chat/email
- ❌ Never use weak secrets (e.g., "password123")
- ❌ Never reuse the same secret across services

---

## Verification

### Run Verification Script

```bash
# Install dependencies if needed
npm install -g tsx

# Run verification
tsx scripts/verify-env.ts
```

The script will:
- ✅ Check all required variables are set
- ✅ Validate variable formats
- ✅ Check for test/dev values
- ✅ Generate verification report

### Manual Verification Checklist

**Railway:**
- [ ] DATABASE_URL is production PostgreSQL
- [ ] SUPABASE_URL is production Supabase
- [ ] STRIPE_SECRET_KEY starts with `sk_live_`
- [ ] STRIPE_PUBLISHABLE_KEY starts with `pk_live_`
- [ ] STRIPE_WEBHOOK_SECRET starts with `whsec_`
- [ ] All Stripe price IDs start with `price_`
- [ ] CORS_ORIGINS contains production domains only
- [ ] NODE_ENV is `production` or `preview`
- [ ] JWT_SECRET is at least 32 characters

**Vercel (each app):**
- [ ] NEXT_PUBLIC_API_URL is `https://api.kealee.com`
- [ ] NEXT_PUBLIC_SUPABASE_URL is production Supabase
- [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY is valid JWT
- [ ] No localhost URLs
- [ ] m-ops-services has NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (LIVE)
- [ ] os-pm has NEXT_PUBLIC_PM_WS_URL (wss://)

---

## Troubleshooting

### Variable Not Found

**Issue:** Script reports variable as missing  
**Solution:**
1. Verify variable is set in Railway/Vercel dashboard
2. Check variable name spelling (case-sensitive)
3. Redeploy service after adding variable

### Invalid Format

**Issue:** Script reports variable format is invalid  
**Solution:**
1. Check variable value matches required format
2. Verify it's production value (not test/localhost)
3. Check for typos or extra spaces

### Test Keys in Production

**Issue:** Script detects test keys (sk_test_, pk_test_)  
**Solution:**
1. Switch to LIVE mode in Stripe Dashboard
2. Copy LIVE keys
3. Update environment variables
4. Redeploy

### Localhost URLs

**Issue:** Script detects localhost URLs  
**Solution:**
1. Replace with production URLs
2. Verify URLs are correct
3. Redeploy

---

## Environment Variable Reference

### Railway (API) - Complete List

```bash
# Database
DATABASE_URL=postgresql://...

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...

# Stripe (LIVE)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Products
STRIPE_PRODUCT_PACKAGE_A=prod_...
STRIPE_PRODUCT_PACKAGE_B=prod_...
STRIPE_PRODUCT_PACKAGE_C=prod_...
STRIPE_PRODUCT_PACKAGE_D=prod_...

# Stripe Prices
STRIPE_PRICE_PACKAGE_A_MONTHLY=price_...
STRIPE_PRICE_PACKAGE_B_MONTHLY=price_...
STRIPE_PRICE_PACKAGE_C_MONTHLY=price_...
STRIPE_PRICE_PACKAGE_D_MONTHLY=price_...

# Security
NODE_ENV=production
JWT_SECRET=...
CSRF_SECRET=...

# CORS
CORS_ORIGINS=https://os-admin.kealee.com,...

# Optional
SENTRY_DSN=https://...
REDIS_URL=redis://...
RESEND_API_KEY=re_...
PORT=3000
```

### Vercel - Complete List (All Apps)

```bash
# Common (all apps)
NEXT_PUBLIC_API_URL=https://api.kealee.com
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Optional (all apps)
NEXT_PUBLIC_SENTRY_DSN=https://...
NEXT_PUBLIC_POSTHOG_KEY=phc_...

# os-pm specific
NEXT_PUBLIC_PM_WS_URL=wss://api.kealee.com

# m-ops-services specific
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

---

## Quick Setup Checklist

### Railway
- [ ] Set DATABASE_URL
- [ ] Set SUPABASE_URL and SUPABASE_SERVICE_KEY
- [ ] Set all Stripe LIVE keys
- [ ] Set all Stripe product/price IDs
- [ ] Set CORS_ORIGINS
- [ ] Set NODE_ENV=production
- [ ] Set JWT_SECRET (generate secure random)
- [ ] Set CSRF_SECRET (generate secure random)
- [ ] Set optional variables (Sentry, Redis, etc.)

### Vercel (each of 6 apps)
- [ ] Set NEXT_PUBLIC_API_URL
- [ ] Set NEXT_PUBLIC_SUPABASE_URL
- [ ] Set NEXT_PUBLIC_SUPABASE_ANON_KEY
- [ ] Set app-specific variables (if any)
- [ ] Set optional variables (Sentry, PostHog, etc.)

### Verification
- [ ] Run verification script
- [ ] Fix any issues found
- [ ] Verify no test keys
- [ ] Verify no localhost URLs
- [ ] Test API connection
- [ ] Test frontend apps

---

**Last Updated:** January 19, 2025
