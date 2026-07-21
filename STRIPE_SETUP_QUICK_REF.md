# Stripe Production Setup - Quick Reference

## 🚀 Quick Setup Checklist

### 1. Stripe Dashboard
- [ ] Switch to LIVE mode
- [ ] Verify business details
- [ ] Enable payment methods
- [ ] Configure billing portal

### 2. Create Products
- [ ] Package A: $1,750/month → Save `price_...`
- [ ] Package B: $4,500/month → Save `price_...`
- [ ] Package C: $8,500/month → Save `price_...`
- [ ] Package D: $16,500/month → Save `price_...`

### 3. Get API Keys
- [ ] Secret Key: `sk_live_...`
- [ ] Publishable Key: `pk_live_...`

### 4. Configure Webhook
- [ ] Endpoint: `https://api.kealee.com/webhooks/stripe`
- [ ] Events: subscription.*, invoice.*, payment_intent.*
- [ ] Signing Secret: `whsec_...`

### 5. Set Environment Variables

**Railway (API):**
```bash
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRODUCT_PACKAGE_A=prod_...
STRIPE_PRODUCT_PACKAGE_B=prod_...
STRIPE_PRODUCT_PACKAGE_C=prod_...
STRIPE_PRODUCT_PACKAGE_D=prod_...
STRIPE_PRICE_PACKAGE_A_MONTHLY=price_...
STRIPE_PRICE_PACKAGE_B_MONTHLY=price_...
STRIPE_PRICE_PACKAGE_C_MONTHLY=price_...
STRIPE_PRICE_PACKAGE_D_MONTHLY=price_...
```

**Vercel (m-ops-services):**
```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

### 6. Run Seed Script
```bash
cd packages/database
npm run db:seed
```

### 7. Test
- [ ] Create test subscription
- [ ] Verify webhook received
- [ ] Check database sync

---

## 📋 Price IDs Template

After creating products in Stripe, fill in:

```
STRIPE_PRICE_PACKAGE_A_MONTHLY=price_XXXXXXXXXXXXXX
STRIPE_PRICE_PACKAGE_B_MONTHLY=price_XXXXXXXXXXXXXX
STRIPE_PRICE_PACKAGE_C_MONTHLY=price_XXXXXXXXXXXXXX
STRIPE_PRICE_PACKAGE_D_MONTHLY=price_XXXXXXXXXXXXXX
```

---

## 🧪 Test Webhook

```bash
# Using Stripe CLI
stripe listen --forward-to http://localhost:3001/webhooks/stripe
stripe trigger customer.subscription.created
```

---

## ✅ Verification

Run verification script:
```bash
bash scripts/verify-stripe-setup.sh
```

---

See `docs/STRIPE_SETUP.md` for complete documentation.
