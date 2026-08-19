# 📋 Add Stripe Price IDs - Step-by-Step Guide

**Status:** Stripe products created ✅  
**Action Required:** Add environment variables to Railway and Vercel  
**Time Required:** 10-15 minutes total

---

## 🚂 RAILWAY (API Service)

### **Step 1: Go to Railway Dashboard**
1. Visit: https://railway.app/project
2. Select your **Kealee API** service (or main project)
3. Click on your **API** service

### **Step 2: Add Variables**
1. Click **"Variables"** tab
2. Click **"+ New Variable"**
3. Add these **one by one**:

```
STRIPE_PRICE_PACKAGE_A = price_1SwJCZIQghAs8OOIBMx2eiCB
STRIPE_PRICE_PACKAGE_B = price_1SwJCaIQghAs8OOI91v8URrR
STRIPE_PRICE_PACKAGE_C = price_1SwJCaIQghAs8OOIq4vDyqVN
STRIPE_PRICE_PACKAGE_D = price_1SwJCbIQghAs8OOIBZtGoIhe
```

### **Step 3: Add On-Demand Service IDs (Optional but Recommended)**
```
STRIPE_PRICE_OD_PERMIT_APP = price_1SwJCdIQghAs8OOI2pHSaiWV
STRIPE_PRICE_OD_INSPECTION = price_1SwJCeIQghAs8OOIjWFyCEBb
STRIPE_PRICE_OD_SITE_VISIT = price_1SwJCeIQghAs8OOIZ90FI305
STRIPE_PRICE_OD_QC_REVIEW = price_1SwJCfIQghAs8OOIICGcwlAL
STRIPE_PRICE_OD_CONTRACTOR_COORD = price_1SwJCfIQghAs8OOI5v4yJMiZ
STRIPE_PRICE_OD_CHANGE_ORDER = price_1SwJCgIQghAs8OOIKbE0Frc2
STRIPE_PRICE_OD_DOCUMENT_ORG = price_1SwJCgIQghAs8OOIM0AUPP1P
STRIPE_PRICE_OD_PROGRESS_REPORT = price_1SwJChIQghAs8OOIrEx2y8ro
STRIPE_PRICE_OD_BUDGET_ANALYSIS = price_1SwJChIQghAs8OOI0X4Qs1Ha
STRIPE_PRICE_OD_SCHEDULE_OPT = price_1SwJCiIQghAs8OOIFwYPNq62
```

### **Step 4: Redeploy**
1. Go to **"Deployments"** tab
2. Click **"Deploy"** or it will auto-redeploy
3. Wait for deployment to complete (~2-3 minutes)

---

## ▲ VERCEL (Frontend Apps)

### **Apps That Need These Variables:**
1. **m-ops-services** (CRITICAL - subscription checkout)
2. m-marketplace (for package display)
3. m-finance-trust (for payment processing)

---

### **For m-ops-services:**

**Step 1: Go to Vercel Dashboard**
1. Visit: https://vercel.com/dashboard
2. Find **"m-ops-services"** project
3. Click on it

**Step 2: Add Environment Variables**
1. Go to **"Settings"** tab
2. Click **"Environment Variables"** in sidebar
3. Click **"Add New"**
4. Add these **one by one**:

**Variable 1:**
- Key: `STRIPE_PRICE_PACKAGE_A`
- Value: `price_1SwJCZIQghAs8OOIBMx2eiCB`
- Environment: ✅ Production, ✅ Preview, ✅ Development

**Variable 2:**
- Key: `STRIPE_PRICE_PACKAGE_B`
- Value: `price_1SwJCaIQghAs8OOI91v8URrR`
- Environment: ✅ Production, ✅ Preview, ✅ Development

**Variable 3:**
- Key: `STRIPE_PRICE_PACKAGE_C`
- Value: `price_1SwJCaIQghAs8OOIq4vDyqVN`
- Environment: ✅ Production, ✅ Preview, ✅ Development

**Variable 4:**
- Key: `STRIPE_PRICE_PACKAGE_D`
- Value: `price_1SwJCbIQghAs8OOIBZtGoIhe`
- Environment: ✅ Production, ✅ Preview, ✅ Development

**Step 3: Redeploy**
1. Go to **"Deployments"** tab
2. Click **"..."** on latest deployment
3. Click **"Redeploy"**
4. Check **"Use existing Build Cache"** ✅
5. Click **"Redeploy"**
6. Wait ~2-3 minutes

---

### **For m-marketplace (Optional):**
Repeat same steps for m-marketplace project

### **For m-finance-trust (Optional):**
Repeat same steps for m-finance-trust project

---

## ✅ VERIFICATION

### **Test Railway Variables:**
1. Go to Railway → API service → Variables
2. Verify all 4 variables are there
3. Check deployment logs for any errors

### **Test Vercel Variables:**
1. Go to Vercel → m-ops-services → Settings → Environment Variables
2. Verify all 4 variables showing
3. Check deployment completed successfully

### **Test Checkout Flow:**
1. Visit your m-ops-services site
2. Click "Subscribe to Package B"
3. Should redirect to Stripe checkout
4. You'll see real pricing ($3,750/month)

---

## 🎯 QUICK COPY-PASTE

**For Railway and Vercel (all in one):**
```
STRIPE_PRICE_PACKAGE_A=price_1SwJCZIQghAs8OOIBMx2eiCB
STRIPE_PRICE_PACKAGE_B=price_1SwJCaIQghAs8OOI91v8URrR
STRIPE_PRICE_PACKAGE_C=price_1SwJCaIQghAs8OOIq4vDyqVN
STRIPE_PRICE_PACKAGE_D=price_1SwJCbIQghAs8OOIBZtGoIhe
```

---

## 📊 SUMMARY

**What This Does:**
- ✅ Enables package subscription checkout
- ✅ Connects your Stripe products to your apps
- ✅ Allows users to purchase PM packages
- ✅ Activates revenue generation

**Where to Add:**
- **Railway:** API service (backend)
- **Vercel:** m-ops-services (primary frontend)

**Time Required:**
- Railway: ~5 minutes
- Vercel: ~5 minutes
- Redeployment: ~5 minutes
- **Total: 15 minutes**

---

## ⚡ AFTER ADDING

Your platform will be **payment-ready**:
- ✅ Users can subscribe to packages
- ✅ Stripe checkout works
- ✅ Subscriptions are tracked
- ✅ Revenue flows to your account

---

**Follow the steps above to add these variables, then your platform is LIVE for payments!** 💰✅

**I've also saved the complete list of all 36 products in:**
- `services/api/scripts/stripe/stripe-catalog-output.env` (all env vars)
- `services/api/scripts/stripe/stripe-catalog.json` (complete catalog)
- `STRIPE_PRODUCTS_CREATED.md` (documentation)
