# Stripe Production Setup - Environment Variables Template

**Date:** January 19, 2025  
**Use this template to set environment variables in Railway and Vercel**

---

## Railway (API Service) - Environment Variables

Copy these to Railway → Your API Service → Variables tab:

```bash
# Stripe LIVE API Keys
STRIPE_SECRET_KEY=sk_live_XXXXXXXXXXXXXXXXXXXXXXXX
STRIPE_PUBLISHABLE_KEY=pk_live_XXXXXXXXXXXXXXXXXXXXXXXX
STRIPE_WEBHOOK_SECRET=whsec_XXXXXXXXXXXXXXXXXXXXXXXX

# Stripe Product IDs (from Stripe Dashboard → Products)
STRIPE_PRODUCT_PACKAGE_A=prod_XXXXXXXXXXXXXXXXXXXXXXXX
STRIPE_PRODUCT_PACKAGE_B=prod_XXXXXXXXXXXXXXXXXXXXXXXX
STRIPE_PRODUCT_PACKAGE_C=prod_XXXXXXXXXXXXXXXXXXXXXXXX
STRIPE_PRODUCT_PACKAGE_D=prod_XXXXXXXXXXXXXXXXXXXXXXXX

# Stripe Price IDs (from Stripe Dashboard → Products → Prices)
STRIPE_PRICE_PACKAGE_A_MONTHLY=price_XXXXXXXXXXXXXXXXXXXXXXXX
STRIPE_PRICE_PACKAGE_B_MONTHLY=price_XXXXXXXXXXXXXXXXXXXXXXXX
STRIPE_PRICE_PACKAGE_C_MONTHLY=price_XXXXXXXXXXXXXXXXXXXXXXXX
STRIPE_PRICE_PACKAGE_D_MONTHLY=price_XXXXXXXXXXXXXXXXXXXXXXXX
```

**Instructions:**
1. Replace `XXXXXXXXXXXXXXXXXXXXXXXX` with actual values from Stripe Dashboard
2. Go to Railway → Your API Service → Variables
3. Add each variable one by one
4. Save and redeploy

---

## Vercel (m-ops-services App) - Environment Variables

Copy this to Vercel → m-ops-services Project → Settings → Environment Variables:

```bash
# Stripe LIVE Publishable Key (for frontend)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_XXXXXXXXXXXXXXXXXXXXXXXX
```

**Instructions:**
1. Replace `XXXXXXXXXXXXXXXXXXXXXXXX` with actual publishable key from Stripe Dashboard
2. Go to Vercel → m-ops-services → Settings → Environment Variables
3. Add variable
4. Save and redeploy

---

## Where to Find These Values

### API Keys
1. Stripe Dashboard → **Developers** → **API keys**
2. Ensure you're in **LIVE mode**
3. Copy **Secret key** (starts with `sk_live_`)
4. Copy **Publishable key** (starts with `pk_live_`)

### Product IDs
1. Stripe Dashboard → **Products**
2. Click on each product
3. Copy **Product ID** (starts with `prod_`)

### Price IDs
1. Stripe Dashboard → **Products**
2. Click on each product
3. Click on the price
4. Copy **Price ID** (starts with `price_`)

### Webhook Secret
1. Stripe Dashboard → **Developers** → **Webhooks**
2. Click on your webhook endpoint
3. Click **Reveal** on Signing secret
4. Copy **Signing secret** (starts with `whsec_`)

---

## Verification

After setting all variables, run:

```bash
bash scripts/verify-stripe-setup.sh
```

Or on Windows:
```cmd
scripts\verify-stripe-setup.bat
```

---

## Important Notes

- ⚠️ **Never commit these values to git**
- ⚠️ **Use LIVE keys only in production**
- ⚠️ **Keep webhook secret secure**
- ⚠️ **Verify all IDs are from LIVE mode**

---

**Last Updated:** January 19, 2025
