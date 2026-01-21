# 🚀 Ops Services Stripe Products Import Guide

**Purpose:** Import all Ops Services products (packages + a la carte) into Stripe and configure environment variables.

---

## 📋 Prerequisites

1. **Stripe Account:** Active Stripe account with API access
2. **Stripe Secret Key:** `STRIPE_SECRET_KEY` environment variable set
3. **Node.js & pnpm:** Installed and working

---

## 🔧 Step 1: Run the Import Script

### **From services/api directory:**

```bash
cd services/api
pnpm tsx scripts/stripe/setup-ops-products.ts
```

### **What the script does:**

1. ✅ Creates/updates 4 package products (A, B, C, D)
2. ✅ Creates monthly and annual prices for each package
3. ✅ Creates 8 a la carte products
4. ✅ Creates prices for a la carte products
5. ✅ Outputs environment variables for all price IDs

---

## 📦 Products Created

### **Package-Based Subscriptions:**

| Package | Monthly Price | Annual Price | Price IDs |
|---------|--------------|--------------|-----------|
| Package A | $1,750/month | $17,850/year | `STRIPE_PRICE_PACKAGE_A_MONTHLY`, `STRIPE_PRICE_PACKAGE_A_ANNUAL` |
| Package B | $3,750/month | $38,250/year | `STRIPE_PRICE_PACKAGE_B_MONTHLY`, `STRIPE_PRICE_PACKAGE_B_ANNUAL` |
| Package C | $6,500/month | $66,300/year | `STRIPE_PRICE_PACKAGE_C_MONTHLY`, `STRIPE_PRICE_PACKAGE_C_ANNUAL` |
| Package D | $10,500/month | $107,100/year | `STRIPE_PRICE_PACKAGE_D_MONTHLY`, `STRIPE_PRICE_PACKAGE_D_ANNUAL` |

### **A La Carte Products:**

| Product | Type | Price | Price ID |
|---------|------|-------|----------|
| Permit Application Help | One-time | $150-$500 (midpoint: $325) | `STRIPE_PRICE_PERMIT_APPLICATION_HELP` |
| Inspection Scheduling | One-time | $100-$300 (midpoint: $200) | `STRIPE_PRICE_INSPECTION_SCHEDULING` |
| Contractor Coordination | Recurring | $500/month | `STRIPE_PRICE_CONTRACTOR_COORDINATION` |
| Change Order Management | One-time | $200-$750 (midpoint: $475) | `STRIPE_PRICE_CHANGE_ORDER_MANAGEMENT` |
| Billing & Invoicing | Recurring | $300/month | `STRIPE_PRICE_BILLING_INVOICING` |
| Schedule Optimization | One-time | $500-$2,000 (midpoint: $1,250) | `STRIPE_PRICE_SCHEDULE_OPTIMIZATION` |
| Document Preparation | One-time | $150-$500 (midpoint: $325) | `STRIPE_PRICE_DOCUMENT_PREPARATION` |
| Other Operations Help | One-time | $200-$1,000 (midpoint: $600) | `STRIPE_PRICE_OTHER_OPERATIONS_HELP` |

---

## 🔑 Step 2: Add Environment Variables

### **A. Vercel (m-ops-services app)**

1. Go to Vercel Dashboard → m-ops-services project
2. Settings → Environment Variables
3. Add all variables from script output:
   - For **Production** environment
   - For **Preview** environment

### **B. Railway (API service)**

1. Go to Railway Dashboard → API service
2. Variables tab
3. Add all variables from script output

### **C. Local Development (.env.local)**

1. Copy variables to `apps/m-ops-services/.env.local`
2. Copy variables to `services/api/.env.local`

---

## 📝 Step 3: Update Database Seed

Update `services/api/prisma/seed.ts` with the new price IDs:

```typescript
const plans = [
  {
    id: 'package-a',
    name: 'Package A',
    stripePriceIdMonthly: process.env.STRIPE_PRICE_PACKAGE_A_MONTHLY || 'price_XXXXXX',
    stripePriceIdAnnual: process.env.STRIPE_PRICE_PACKAGE_A_ANNUAL || 'price_YYYYYY',
    // ... rest of plan
  },
  // ... other packages
];
```

---

## ✅ Step 4: Verify Setup

### **Test Stripe Products:**

1. Go to Stripe Dashboard → Products
2. Verify all products are created:
   - 4 package products
   - 8 a la carte products
3. Verify prices are attached correctly

### **Test Checkout:**

1. Start dev server: `cd apps/m-ops-services && pnpm dev`
2. Navigate to `/pricing`
3. Click "Get Started" on a package
4. Verify checkout session creates successfully

---

## 🐛 Troubleshooting

### **Error: Missing STRIPE_SECRET_KEY**
- **Fix:** Set `STRIPE_SECRET_KEY` in environment before running script

### **Error: Product already exists**
- **Fix:** Script uses upsert logic, will update existing products

### **Error: Price lookup_key conflict**
- **Fix:** Script checks for existing prices, won't create duplicates

### **Checkout fails with "Invalid price ID"**
- **Fix:** Verify environment variables are set correctly in Vercel/Railway
- **Fix:** Check that price IDs match Stripe dashboard

---

## 📊 Expected Output

The script will output something like:

```
🚀 Setting up Ops Services Stripe products...

📦 Creating package-based subscriptions...

Processing Package A - Starter...
  ✅ Product: prod_xxxxx
  ✅ Monthly Price: price_xxxxx ($1750/month)
  ✅ Annual Price: price_yyyyy ($17850/year)

...

================================================================================
📋 ENVIRONMENT VARIABLES
================================================================================

// Package-based subscriptions (monthly)
STRIPE_PRICE_PACKAGE_A_MONTHLY=price_xxxxx
STRIPE_PRICE_PACKAGE_B_MONTHLY=price_yyyyy
...

✅ Setup complete!
```

---

## 🎯 Next Steps After Import

1. ✅ **Update seed.ts** with price IDs
2. ✅ **Add env vars** to Vercel and Railway
3. ✅ **Test checkout flow** end-to-end
4. ✅ **Deploy to staging**
5. ✅ **Test webhook handling**

---

## 📚 Related Documentation

- `docs/OPS_SERVICES_PRODUCTS.md` - Product definitions
- `apps/m-ops-services/OPS_SERVICES_STATUS.md` - App status
- `services/api/scripts/stripe/setup-ops-products.ts` - Import script

---

**Status:** ✅ Script ready, awaiting execution  
**Last Updated:** January 2026


