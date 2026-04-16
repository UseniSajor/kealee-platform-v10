# Phase 4: Billing & Subscriptions — Deployment Guide

**Date:** April 16, 2026  
**Status:** Ready for Production  
**Previous Phases:** Phase 1-3 complete and deployed to Railway

---

## Pre-Deployment Checklist

- [ ] Phase 1-3 running on Railway (artistic-kindness service)
- [ ] Stripe account created (production or test mode)
- [ ] PostgreSQL database running with Prisma migrations applied
- [ ] Redis instance available for job queues
- [ ] GitHub repo synced with latest Phase 4 code
- [ ] Node.js 20+ and pnpm installed locally for testing

---

## Step 1: Set Up Stripe Products & Prices

### Option A: Automated Setup (Recommended)

Run the setup script to create Stripe products and prices:

```bash
# Set your Stripe Secret Key
export STRIPE_SECRET_KEY="sk_test_..." # or sk_live_...

# Run the setup script
cd kealee-platform-v10
npx tsx scripts/setup-stripe-products.ts
```

**Output:** The script will print environment variable names and IDs to add to Railway.

### Option B: Manual Setup via Stripe Dashboard

If you prefer manual setup, create the following products and prices in your Stripe dashboard:

**Product 1: Kealee GC Operations - Starter**
- Monthly price: $1,750 (id: `price_...`)
- Annual price: $17,750 (id: `price_...`)
- Trial period: 14 days

**Product 2: Kealee GC Operations - Growth**
- Monthly price: $3,500 (id: `price_...`)
- Annual price: $35,700 (id: `price_...`)
- Trial period: 14 days

**Product 3: Kealee GC Operations - Professional**
- Monthly price: $7,500 (id: `price_...`)
- Annual price: $76,500 (id: `price_...`)
- Trial period: 14 days

**Product 4: Kealee GC Operations - Enterprise**
- Monthly price: $16,500 (id: `price_...`)
- Annual price: $168,300 (id: `price_...`)
- Trial period: 14 days

---

## Step 2: Update Railway Environment Variables

### Via Railway Dashboard

1. Go to [Railway Dashboard](https://railway.app)
2. Select project "Kealee Platform" → Service "artistic-kindness"
3. Go to **Variables** tab
4. Add the following variables:

```
# Stripe API Keys (already set from Phase 2-3)
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Price IDs (from Step 1)
STRIPE_PRICE_PACKAGE_A_MONTHLY=price_...
STRIPE_PRICE_PACKAGE_A_ANNUAL=price_...
STRIPE_PRICE_PACKAGE_B_MONTHLY=price_...
STRIPE_PRICE_PACKAGE_B_ANNUAL=price_...
STRIPE_PRICE_PACKAGE_C_MONTHLY=price_...
STRIPE_PRICE_PACKAGE_C_ANNUAL=price_...
STRIPE_PRICE_PACKAGE_D_MONTHLY=price_...
STRIPE_PRICE_PACKAGE_D_ANNUAL=price_...

# API URL (for frontend to call backend)
API_URL=https://artistic-kindness.railway.app

# Application URL (for redirects)
NEXT_PUBLIC_APP_URL=https://your-frontend-domain.com
```

### Via CLI

```bash
# Login to Railway
railway login

# Select project
railway link

# Add environment variables
railway variables set STRIPE_PRICE_PACKAGE_A_MONTHLY=price_...
railway variables set STRIPE_PRICE_PACKAGE_A_ANNUAL=price_...
# ... etc for all 8 price IDs
```

---

## Step 3: Deploy to Railway

### Automatic Deployment (GitHub Integration)

Since your GitHub repo is already connected to Railway:

1. Commit Phase 4 code to `main` branch:
   ```bash
   git add .
   git commit -m "feat: Phase 4 - Billing & Subscriptions implementation"
   git push origin main
   ```

2. Railway automatically detects the push and triggers a deployment
3. Watch deployment progress in Railway dashboard
4. Once complete, verify at `https://artistic-kindness.railway.app`

### Manual Deployment

```bash
# Build the application
pnpm run build

# Deploy to Railway
railway up

# Monitor deployment
railway logs
```

---

## Step 4: Verify Deployment

### 1. Check Service Health

```bash
# Via Railway dashboard
curl https://artistic-kindness.railway.app/health

# Expected response:
# { "status": "ok", "timestamp": "2026-04-16T..." }
```

### 2. Test Checkout Page

```
1. Navigate to: https://artistic-kindness.railway.app/checkout
2. Verify 4 plans load correctly
3. Click monthly/annual toggle → prices update
4. Click "Choose Plan" button → redirects to Stripe Checkout
```

### 3. Test Billing API Endpoints

```bash
# Test checkout route
curl -X POST https://artistic-kindness.railway.app/api/billing/checkout \
  -H "Content-Type: application/json" \
  -d '{
    "planSlug": "package-a",
    "interval": "month",
    "orgId": "test-org-123",
    "customerEmail": "test@example.com"
  }'

# Expected: { "url": "https://checkout.stripe.com/..." }

# Test portal route
curl -X POST https://artistic-kindness.railway.app/api/billing/portal \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "cus_...",
    "returnUrl": "https://your-domain.com/dashboard/billing"
  }'

# Expected: { "url": "https://billing.stripe.com/..." }
```

### 4. Monitor Webhook Events

In Stripe Dashboard:
1. Go to **Developers** → **Webhooks**
2. Find webhook endpoint: `https://artistic-kindness.railway.app/billing/stripe/webhook`
3. Monitor events:
   - `checkout.session.completed` ✓
   - `customer.subscription.created` ✓
   - `customer.subscription.updated` ✓
   - `invoice.paid` ✓

---

## Step 5: Run E2E Tests

### Install Playwright (first time only)

```bash
cd apps/web-main
pnpm add -D @playwright/test
npx playwright install
```

### Run Tests

```bash
# Run all billing tests
npx playwright test e2e/phase-4-billing.spec.ts

# Run specific test
npx playwright test e2e/phase-4-billing.spec.ts -g "checkout page displays"

# Run with UI mode
npx playwright test e2e/phase-4-billing.spec.ts --ui

# Run tests against production
PLAYWRIGHT_TEST_BASE_URL=https://artistic-kindness.railway.app \
npx playwright test e2e/phase-4-billing.spec.ts
```

### Expected Test Results

```
✓ checkout page displays all subscription plans
✓ billing interval toggle updates prices
✓ plan cards display features
✓ choose plan button initiates checkout flow
✓ checkout page displays FAQ
✓ unauthenticated users can access checkout
✓ billing dashboard requires login
✓ checkout API route returns valid response
✓ portal API route accepts customerId
✓ checkout is in public routes
✓ checkout handles missing required fields
✓ checkout rejects invalid plan slug

15 passed
```

---

## Step 6: Test Full Checkout Flow (Manual)

### With Stripe Test Mode

1. **Navigate to checkout:**
   ```
   https://your-app.com/checkout
   ```

2. **Select Growth plan (most popular)**
   - Toggle to Annual (Save 15%)
   - Click "Choose Plan"

3. **In Stripe Checkout:**
   - Email: `test@example.com`
   - Card: `4242 4242 4242 4242`
   - Expiry: `12/25`
   - CVC: `123`
   - Click "Subscribe"

4. **After completion:**
   - Should redirect to `/dashboard/billing?success=true`
   - Verify subscription status shows "Trial"
   - Verify next billing date is 14 days from now

5. **In Dashboard:**
   - Click "Manage Payment" → opens Stripe Billing Portal
   - Click "View Invoices" → shows upcoming invoice
   - Click "Cancel Subscription" → confirms cancellation

### With Stripe Live Mode

**⚠️ For production only:**

1. Switch to live Stripe keys: `sk_live_...`
2. Update Railway environment variables with live keys
3. Redeploy application
4. Use real credit cards for testing

---

## Step 7: Monitor in Production

### Via Railway Dashboard

1. Service logs: Watch for errors
2. Metrics: CPU, Memory, Request rate
3. Database: Query performance

### Via Stripe Dashboard

1. **Payments**: Monitor successful transactions
2. **Disputes**: Handle charge-backs
3. **Webhooks**: Verify delivery success
4. **Subscriptions**: Monitor churn rate

### Alert Configuration

Set up alerts for:
- [ ] Stripe webhook failures
- [ ] Payment failures > 5% of transactions
- [ ] API response time > 2s
- [ ] Database query errors
- [ ] Out of memory events

---

## Troubleshooting

### Issue: "Stripe not configured" error

**Solution:** Verify environment variables:
```bash
railway variables list | grep STRIPE
```

Ensure all 8 price ID variables are set.

### Issue: Checkout redirects to Stripe but fails

**Solution:** 
1. Verify STRIPE_SECRET_KEY is correct
2. Check that price IDs exist in Stripe dashboard
3. Ensure Stripe product is active (not archived)

### Issue: Webhook events not received

**Solution:**
1. Verify webhook endpoint URL is correct
2. Check STRIPE_WEBHOOK_SECRET matches
3. Monitor webhook delivery in Stripe dashboard
4. Look for logs in Railway: `railway logs | grep webhook`

### Issue: Users can't access /checkout

**Solution:**
1. Verify `/checkout` is in PUBLIC_ROUTES in middleware.ts
2. Redeploy application
3. Clear browser cache

### Issue: Subscription not showing on billing dashboard

**Solution:**
1. Verify API_URL environment variable is set
2. Check database for subscription record: 
   ```sql
   SELECT * FROM service_subscriptions 
   WHERE "orgId" = 'org-id' 
   LIMIT 1;
   ```
3. Verify webhook processed the subscription.created event

---

## Rollback Plan

If Phase 4 needs to be rolled back:

```bash
# Revert to Phase 3 commit
git revert HEAD

# Redeploy
git push origin main

# Remove Stripe prices from dashboard (optional)
# - Keep products and prices for future use
# - Just disable them if you want to revert
```

---

## Next Steps

- **Phase 5:** PM Dashboard (Client management, project tracking)
- **Phase 6:** Contractor Marketplace (Lead management, matching)
- **Phase 7:** Communication (Messaging, notifications)

---

## Support

For questions or issues:
1. Check Railway logs: `railway logs -t 100`
2. Review Stripe webhook logs in dashboard
3. Contact support: support@kealee.com

---

**Deployment Complete! 🎉**

Your Kealee Platform now supports:
- ✅ Subscription billing with 14-day free trial
- ✅ 4 pricing tiers (Starter to Enterprise)
- ✅ Monthly/annual billing options
- ✅ Stripe payment processing
- ✅ Subscription management dashboard
- ✅ Invoice tracking

**Revenue generation is now active.**
