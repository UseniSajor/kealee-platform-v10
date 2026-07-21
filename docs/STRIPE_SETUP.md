# Stripe Production Setup Guide

**Date:** January 19, 2025  
**Status:** Manual Setup Required  
**Priority:** CRITICAL - Revenue Blocker

---

## ⚠️ IMPORTANT: Manual Steps Required

This guide provides step-by-step instructions for setting up Stripe in LIVE mode. **You must complete these steps manually in the Stripe Dashboard** - they cannot be automated.

---

## 📋 PRE-SETUP CHECKLIST

Before starting, ensure you have:
- [ ] Stripe account created
- [ ] Business details verified
- [ ] Bank account connected
- [ ] Tax information completed
- [ ] Access to Stripe Dashboard

---

## STEP 1: Switch to LIVE Mode

### 1.1 Access Stripe Dashboard

1. Log into [Stripe Dashboard](https://dashboard.stripe.com)
2. Click the **"Test mode"** toggle in the top right
3. Switch to **"Live mode"**
4. Confirm the switch

### 1.2 Verify Business Details

1. Go to **Settings** → **Business settings**
2. Verify:
   - [ ] Business name
   - [ ] Business type
   - [ ] Address
   - [ ] Tax ID (EIN/SSN)
   - [ ] Bank account details
   - [ ] Identity verification (if required)

### 1.3 Enable Payment Methods

1. Go to **Settings** → **Payment methods**
2. Enable:
   - [ ] Credit and debit cards
   - [ ] ACH Direct Debit (optional, recommended)
   - [ ] Other methods as needed

### 1.4 Configure Billing Portal

1. Go to **Settings** → **Billing** → **Customer portal**
2. Enable customer portal
3. Configure:
   - Allow customers to update payment methods
   - Allow customers to cancel subscriptions
   - Allow customers to update billing details
4. Save settings

---

## STEP 2: Create Products in LIVE Mode

### 2.1 Product 1: PM Staffing - Starter (Package A)

**Steps:**
1. Go to **Products** → **Add product**
2. Fill in:
   - **Name:** `PM Staffing - Starter (Package A)`
   - **Description:** `Basic Ops - Ops intake + planning, Vendor shortlist, Monthly check-ins, Basic reporting`
   - **Metadata:** 
     - `package_tier`: `package-a`
     - `slug`: `package-a`
     - `plan_type`: `ops-services`
3. Click **Save product**
4. **Add Price:**
   - **Price:** `$1,750.00`
   - **Billing period:** `Monthly`
   - **Recurring:** ✅ Enabled
   - **Currency:** `USD`
5. Click **Save price**
6. **COPY THE PRICE ID** (starts with `price_...`)
   - Example: `price_1ABC123...` (LIVE mode price ID)

**Save this:** `STRIPE_PRICE_PACKAGE_A_MONTHLY=price_...`

---

### 2.2 Product 2: PM Staffing - Professional (Package B)

**Steps:**
1. Go to **Products** → **Add product**
2. Fill in:
   - **Name:** `PM Staffing - Professional (Package B)`
   - **Description:** `Standard Ops - Dedicated ops support, Weekly updates, Permit tracking, Vendor coordination`
   - **Metadata:**
     - `package_tier`: `package-b`
     - `slug`: `package-b`
     - `plan_type`: `ops-services`
3. Click **Save product**
4. **Add Price:**
   - **Price:** `$4,500.00`
   - **Billing period:** `Monthly`
   - **Recurring:** ✅ Enabled
   - **Currency:** `USD`
5. Click **Save price**
6. **COPY THE PRICE ID**

**Save this:** `STRIPE_PRICE_PACKAGE_B_MONTHLY=price_...`

---

### 2.3 Product 3: PM Staffing - Premium (Package C)

**Steps:**
1. Go to **Products** → **Add product**
2. Fill in:
   - **Name:** `PM Staffing - Premium (Package C)`
   - **Description:** `Premium Ops - Priority response, Full vendor ops, Risk tracking, Weekly reporting + escalation`
   - **Metadata:**
     - `package_tier`: `package-c`
     - `slug`: `package-c`
     - `plan_type`: `ops-services`
3. Click **Save product**
4. **Add Price:**
   - **Price:** `$8,500.00`
   - **Billing period:** `Monthly`
   - **Recurring:** ✅ Enabled
   - **Currency:** `USD`
5. Click **Save price**
6. **COPY THE PRICE ID**

**Save this:** `STRIPE_PRICE_PACKAGE_C_MONTHLY=price_...`

---

### 2.4 Product 4: PM Staffing - Enterprise (Package D)

**Steps:**
1. Go to **Products** → **Add product**
2. Fill in:
   - **Name:** `PM Staffing - Enterprise (Package D)`
   - **Description:** `Enterprise Ops - Multi-project program, Custom SLA, Program reporting, Dedicated support channel`
   - **Metadata:**
     - `package_tier`: `package-d`
     - `slug`: `package-d`
     - `plan_type`: `ops-services`
3. Click **Save product**
4. **Add Price:**
   - **Price:** `$16,500.00`
   - **Billing period:** `Monthly`
   - **Recurring:** ✅ Enabled
   - **Currency:** `USD`
5. Click **Save price**
6. **COPY THE PRICE ID**

**Save this:** `STRIPE_PRICE_PACKAGE_D_MONTHLY=price_...`

---

## STEP 3: Get API Keys

### 3.1 Get Secret Key

1. Go to **Developers** → **API keys**
2. Ensure you're in **LIVE mode**
3. Find **Secret key** (starts with `sk_live_...`)
4. Click **Reveal test key** if needed
5. **COPY THE SECRET KEY**

**Save this:** `STRIPE_SECRET_KEY=sk_live_...`

### 3.2 Get Publishable Key

1. In the same **API keys** page
2. Find **Publishable key** (starts with `pk_live_...`)
3. **COPY THE PUBLISHABLE KEY**

**Save this:** `STRIPE_PUBLISHABLE_KEY=pk_live_...`

---

## STEP 4: Configure Webhook Endpoint

### 4.1 Create Webhook Endpoint

1. Go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Fill in:
   - **Endpoint URL:** `https://api.kealee.com/webhooks/stripe`
   - **Description:** `Kealee Platform - Production Webhooks`
4. Click **Add endpoint**

### 4.2 Select Events to Listen For

Select these events:
- ✅ `customer.subscription.created`
- ✅ `customer.subscription.updated`
- ✅ `customer.subscription.deleted`
- ✅ `invoice.paid`
- ✅ `invoice.payment_failed`
- ✅ `payment_intent.succeeded`
- ✅ `payment_intent.payment_failed`
- ✅ `charge.refunded` (optional)
- ✅ `transfer.created` (optional, for Stripe Connect)

Click **Add events**

### 4.3 Get Webhook Signing Secret

1. After creating the endpoint, click on it
2. Find **Signing secret** (starts with `whsec_...`)
3. Click **Reveal** to show the secret
4. **COPY THE SIGNING SECRET**

**Save this:** `STRIPE_WEBHOOK_SECRET=whsec_...`

### 4.4 Test Webhook (Optional)

1. In the webhook endpoint page
2. Click **Send test webhook**
3. Select an event type (e.g., `customer.subscription.created`)
4. Click **Send test webhook**
5. Verify it appears in webhook logs

---

## STEP 5: Update Environment Variables

### 5.1 Railway (API Service)

Go to Railway → Your API Service → **Variables** tab

Add/Update these variables:

```bash
# Stripe LIVE Keys
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Product IDs (from Step 2)
STRIPE_PRODUCT_PACKAGE_A=prod_...
STRIPE_PRODUCT_PACKAGE_B=prod_...
STRIPE_PRODUCT_PACKAGE_C=prod_...
STRIPE_PRODUCT_PACKAGE_D=prod_...

# Stripe Price IDs (from Step 2)
STRIPE_PRICE_PACKAGE_A_MONTHLY=price_...
STRIPE_PRICE_PACKAGE_B_MONTHLY=price_...
STRIPE_PRICE_PACKAGE_C_MONTHLY=price_...
STRIPE_PRICE_PACKAGE_D_MONTHLY=price_...
```

**Important:** Replace `...` with actual values from Stripe Dashboard

### 5.2 Vercel (m-ops-services App)

Go to Vercel → m-ops-services Project → **Settings** → **Environment Variables**

Add:

```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

**Important:** Replace `...` with actual publishable key from Step 3.2

---

## STEP 6: Update Seed File

The seed file (`packages/database/prisma/seed.ts`) is already configured to use environment variables. After setting the environment variables in Railway, run:

```bash
cd packages/database
npm run db:seed
```

This will create service plans with the LIVE Stripe product/price IDs.

---

## STEP 7: Test Webhook Signature

### 7.1 Using Stripe CLI (Local Testing)

```bash
# Install Stripe CLI (if not installed)
# https://stripe.com/docs/stripe-cli

# Login to Stripe
stripe login

# Forward webhooks to local API
stripe listen --forward-to http://localhost:3001/webhooks/stripe

# In another terminal, trigger a test event
stripe trigger customer.subscription.created
```

### 7.2 Verify Webhook Processing

1. Check API logs for webhook events
2. Verify database records are created/updated
3. Check webhook logs in Stripe Dashboard

### 7.3 Production Webhook Testing

1. Create a test subscription in your app
2. Check Stripe Dashboard → **Webhooks** → Your endpoint → **Events**
3. Verify events are received
4. Check API logs for processing
5. Verify database sync

---

## 📊 PRODUCT SUMMARY

| Package | Name | Monthly Price | Price ID Variable |
|---------|------|---------------|-------------------|
| A | PM Staffing - Starter | $1,750 | `STRIPE_PRICE_PACKAGE_A_MONTHLY` |
| B | PM Staffing - Professional | $4,500 | `STRIPE_PRICE_PACKAGE_B_MONTHLY` |
| C | PM Staffing - Premium | $8,500 | `STRIPE_PRICE_PACKAGE_C_MONTHLY` |
| D | PM Staffing - Enterprise | $16,500 | `STRIPE_PRICE_PACKAGE_D_MONTHLY` |

---

## ✅ VERIFICATION CHECKLIST

After completing all steps, verify:

- [ ] Stripe dashboard is in LIVE mode
- [ ] All 4 products created with correct prices
- [ ] All 4 price IDs copied and saved
- [ ] API keys copied (secret + publishable)
- [ ] Webhook endpoint created and configured
- [ ] Webhook signing secret copied
- [ ] Environment variables set in Railway
- [ ] Environment variables set in Vercel (m-ops-services)
- [ ] Seed script run with LIVE IDs
- [ ] Webhook signature tested
- [ ] Test subscription created successfully
- [ ] Database records synced correctly

---

## 🧪 TESTING CHECKLIST

1. **Create Test Subscription:**
   - Go to m-ops-services app
   - Select a package
   - Complete checkout
   - Verify subscription created in Stripe

2. **Verify Webhook Processing:**
   - Check Stripe Dashboard → Webhooks → Events
   - Verify events received
   - Check API logs
   - Verify database records

3. **Test Payment:**
   - Use Stripe test card: `4242 4242 4242 4242`
   - Complete payment
   - Verify invoice created
   - Verify payment recorded

4. **Test Subscription Updates:**
   - Upgrade/downgrade package
   - Verify webhook received
   - Verify database updated

5. **Test Cancellation:**
   - Cancel subscription
   - Verify webhook received
   - Verify subscription status updated

---

## 🚨 TROUBLESHOOTING

### Webhook Not Receiving Events

1. **Check Endpoint URL:**
   - Verify URL is correct: `https://api.kealee.com/webhooks/stripe`
   - Ensure API is deployed and accessible

2. **Check Webhook Secret:**
   - Verify `STRIPE_WEBHOOK_SECRET` is set correctly
   - Ensure it's the LIVE webhook secret (starts with `whsec_`)

3. **Check API Logs:**
   - Look for webhook processing errors
   - Verify signature verification is working

4. **Check Stripe Dashboard:**
   - Go to Webhooks → Your endpoint → Events
   - Check for failed deliveries
   - Review error messages

### Subscription Not Creating

1. **Check Price IDs:**
   - Verify price IDs are correct in environment variables
   - Ensure they're LIVE price IDs (not test)

2. **Check API Keys:**
   - Verify `STRIPE_SECRET_KEY` is LIVE key (starts with `sk_live_`)
   - Verify `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is LIVE key (starts with `pk_live_`)

3. **Check Seed Data:**
   - Verify service plans have correct Stripe IDs
   - Run seed script again if needed

---

## 📝 NOTES

- **Never commit LIVE keys to git** - use environment variables only
- **Keep webhook secret secure** - rotate if compromised
- **Monitor webhook failures** - set up alerts in Stripe
- **Test in test mode first** - before switching to LIVE
- **Keep test and LIVE keys separate** - don't mix them

---

## 🔗 RESOURCES

- [Stripe Dashboard](https://dashboard.stripe.com)
- [Stripe API Documentation](https://stripe.com/docs/api)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe Testing Guide](https://stripe.com/docs/testing)

---

**Last Updated:** January 19, 2025  
**Status:** Ready for Manual Setup
