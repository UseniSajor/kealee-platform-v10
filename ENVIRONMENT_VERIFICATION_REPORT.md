# Environment Variables Verification Report

**Date:** January 19, 2025  
**Status:** Verification Script Created | Manual Verification Required

---

## ✅ COMPLETED

### 1. Verification Script Created ✅

**File:** `scripts/verify-env.ts`

**Features:**
- ✅ Validates all Railway environment variables
- ✅ Validates all Vercel environment variables (6 apps)
- ✅ Checks variable formats (URLs, keys, secrets)
- ✅ Detects test/dev values (localhost, test keys)
- ✅ Generates detailed verification report
- ✅ Color-coded output for easy reading

**Validation Rules:**
- ✅ Database URLs must be production (not localhost)
- ✅ Stripe keys must be LIVE (not test)
- ✅ Supabase URLs must be production
- ✅ CORS origins must be production domains
- ✅ JWT/CSRF secrets must be minimum 32 characters
- ✅ WebSocket URLs must use `wss://` (secure)

### 2. Documentation Created ✅

**Files:**
- ✅ `docs/ENVIRONMENT_SETUP.md` - Complete setup guide
- ✅ `env-templates/railway-api.env.template` - Railway template
- ✅ `env-templates/vercel-apps.env.template` - Vercel template

**Contents:**
- ✅ All required variables listed
- ✅ Where to find each value
- ✅ How to set in Railway/Vercel
- ✅ Security best practices
- ✅ Troubleshooting guide

---

## ⚠️ MANUAL VERIFICATION REQUIRED

### Railway (API Service) - Required Variables

**Critical Variables:**
- [ ] `DATABASE_URL` - Production PostgreSQL (starts with `postgresql://`)
- [ ] `SUPABASE_URL` - Production Supabase (starts with `https://`)
- [ ] `SUPABASE_SERVICE_KEY` - Production service key (starts with `eyJ`)
- [ ] `STRIPE_SECRET_KEY` - LIVE key (starts with `sk_live_`)
- [ ] `STRIPE_PUBLISHABLE_KEY` - LIVE key (starts with `pk_live_`)
- [ ] `STRIPE_WEBHOOK_SECRET` - LIVE secret (starts with `whsec_`)
- [ ] `CORS_ORIGINS` - Production domains (no localhost)
- [ ] `NODE_ENV` - Set to `production` or `preview`
- [ ] `JWT_SECRET` - Secure random string (min 32 chars)
- [ ] `CSRF_SECRET` - Secure random string (min 32 chars)

**Stripe Products & Prices:**
- [ ] `STRIPE_PRODUCT_PACKAGE_A` - Starts with `prod_`
- [ ] `STRIPE_PRODUCT_PACKAGE_B` - Starts with `prod_`
- [ ] `STRIPE_PRODUCT_PACKAGE_C` - Starts with `prod_`
- [ ] `STRIPE_PRODUCT_PACKAGE_D` - Starts with `prod_`
- [ ] `STRIPE_PRICE_PACKAGE_A_MONTHLY` - Starts with `price_`
- [ ] `STRIPE_PRICE_PACKAGE_B_MONTHLY` - Starts with `price_`
- [ ] `STRIPE_PRICE_PACKAGE_C_MONTHLY` - Starts with `price_`
- [ ] `STRIPE_PRICE_PACKAGE_D_MONTHLY` - Starts with `price_`

**Optional Variables:**
- [ ] `SENTRY_DSN` - Sentry DSN URL
- [ ] `REDIS_URL` - Redis connection string
- [ ] `RESEND_API_KEY` - Resend API key
- [ ] `PORT` - Port number (default: 3000)

### Vercel Apps - Required Variables

**Common (All 6 Apps):**
- [ ] `NEXT_PUBLIC_API_URL` - Production API URL (`https://api.kealee.com`)
- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Production Supabase URL
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Production anon key (starts with `eyJ`)

**App-Specific:**
- [ ] **os-pm:** `NEXT_PUBLIC_PM_WS_URL` - WebSocket URL (`wss://api.kealee.com`)
- [ ] **m-ops-services:** `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - LIVE key (`pk_live_...`)

**Optional (All Apps):**
- [ ] `NEXT_PUBLIC_SENTRY_DSN` - Sentry DSN
- [ ] `NEXT_PUBLIC_POSTHOG_KEY` - PostHog key

---

## 🔍 VERIFICATION CHECKLIST

### Railway Verification

**Run in Railway environment:**
```bash
tsx scripts/verify-env.ts
```

**Check:**
- [ ] All required variables present
- [ ] No test keys (sk_test_, pk_test_)
- [ ] No localhost URLs
- [ ] All Stripe keys are LIVE
- [ ] All URLs are production
- [ ] Secrets are secure (min 32 chars)

### Vercel Verification

**For each app (os-admin, os-pm, m-ops-services, m-project-owner, m-architect, m-permits-inspections):**

**Check:**
- [ ] Common variables set
- [ ] App-specific variables set (if any)
- [ ] No localhost URLs
- [ ] All URLs are production
- [ ] Stripe key is LIVE (m-ops-services)

---

## 📊 EXPECTED VERIFICATION RESULTS

### Railway (API Service)

**Total Variables:** ~25
- ✅ Present: 25
- ❌ Missing: 0
- ⚠️ Invalid: 0

### Vercel Apps (Each)

**Total Variables:** 3-5 per app
- ✅ Present: 3-5
- ❌ Missing: 0
- ⚠️ Invalid: 0

---

## 🚨 COMMON ISSUES TO CHECK

### Issue 1: Test Keys in Production

**Symptom:** Script reports `STRIPE_SECRET_KEY` is invalid  
**Cause:** Using test key (`sk_test_`) instead of LIVE key (`sk_live_`)  
**Fix:** Switch to LIVE mode in Stripe Dashboard, copy LIVE keys

### Issue 2: Localhost URLs

**Symptom:** Script reports URLs contain `localhost`  
**Cause:** Using development URLs in production  
**Fix:** Replace with production URLs

### Issue 3: Missing Stripe Price IDs

**Symptom:** Script reports `STRIPE_PRICE_PACKAGE_X_MONTHLY` is missing  
**Cause:** Stripe products not created or IDs not set  
**Fix:** Create products in Stripe Dashboard, copy price IDs

### Issue 4: Weak Secrets

**Symptom:** Script reports `JWT_SECRET` is too short  
**Cause:** Secret is less than 32 characters  
**Fix:** Generate secure random string (32+ chars)

---

## 📝 HOW TO RUN VERIFICATION

### Option 1: Local Verification (Mock)

Since we don't have access to Railway/Vercel environment variables locally, the script will show what needs to be verified:

```bash
tsx scripts/verify-env.ts
```

### Option 2: Railway Environment

1. SSH into Railway service
2. Run verification script
3. Review results

### Option 3: Vercel Environment

1. Add verification script to build process
2. Run during deployment
3. Review logs

### Option 4: Manual Checklist

Use the checklist above to manually verify each variable in Railway/Vercel dashboards.

---

## 📄 VERIFICATION REPORT OUTPUT

The script generates:
1. **Console Output:** Color-coded verification results
2. **JSON Report:** `env-verification-report.json` with detailed results

**Report Structure:**
```json
{
  "timestamp": "2025-01-19T...",
  "results": [
    {
      "service": "Railway (API)",
      "summary": {
        "total": 25,
        "present": 25,
        "missing": 0,
        "invalid": 0
      },
      "issues": []
    }
  ]
}
```

---

## ✅ NEXT STEPS

1. **Set Environment Variables:**
   - Use `env-templates/railway-api.env.template` for Railway
   - Use `env-templates/vercel-apps.env.template` for Vercel

2. **Run Verification:**
   ```bash
   tsx scripts/verify-env.ts
   ```

3. **Fix Issues:**
   - Address any missing variables
   - Fix invalid formats
   - Replace test keys with LIVE keys
   - Replace localhost URLs with production URLs

4. **Re-verify:**
   - Run script again
   - Ensure all checks pass

5. **Deploy:**
   - Deploy to production
   - Monitor for errors

---

## 📚 DOCUMENTATION

- **Complete Guide:** `docs/ENVIRONMENT_SETUP.md`
- **Railway Template:** `env-templates/railway-api.env.template`
- **Vercel Template:** `env-templates/vercel-apps.env.template`
- **Verification Script:** `scripts/verify-env.ts`

---

**Last Updated:** January 19, 2025  
**Status:** Script Ready | Manual Verification Required
