# 🔐 Railway Variables Audit for arstic-kindness

**Generated Admin API Key:** `2963f446c99b44278525daff14bc7bac`

**Date:** April 6, 2026  
**Status:** Ready to deploy

---

## 📋 VARIABLES TO SET IN RAILWAY

### **Paste This Into: Railway > kealee-platform-v10 > arstic-kindness > Variables**

```
# ============================================================================
# ADMIN & AUTH
# ============================================================================
ADMIN_API_KEY=2963f446c99b44278525daff14bc7bac
API_SERVICE_KEY=kealee-service-auth-v1

# ============================================================================
# OPENAI / AI
# ============================================================================
OPENAI_API_KEY=sk-[YOUR_OPENAI_KEY_HERE]

# ============================================================================
# STRIPE (26 Price IDs - Already set per your message)
# ============================================================================
# STRIPE_PRICE_CONCEPT=price_1Sw...
# STRIPE_PRICE_KITCHEN=price_1Sw...
# (etc. - you said these are already set)

# ============================================================================
# DATABASE
# ============================================================================
DATABASE_URL=postgresql://[user]:[password]@ballast.proxy.rlwy.net:46074/railway

# ============================================================================
# NEXT.JS / WEB APPS
# ============================================================================
NEXT_PUBLIC_API_URL=https://arstic-kindness.up.railway.app
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_[YOUR_PK_KEY]

# ============================================================================
# EMAIL / RESEND
# ============================================================================
RESEND_API_KEY=re_[YOUR_RESEND_KEY]

# ============================================================================
# JWT / SESSIONS
# ============================================================================
JWT_SECRET=[RANDOM_32_CHAR_SECRET]
SESSION_SECRET=[RANDOM_32_CHAR_SECRET]

# ============================================================================
# RAILS DEPLOYMENT
# ============================================================================
NODE_ENV=production
```

---

## ✅ VARIABLE CHECKLIST BY SERVICE

### **1. web-main (Next.js)**
- [ ] `DATABASE_URL` - PostgreSQL connection
- [ ] `NEXT_PUBLIC_API_URL` - Points to https://arstic-kindness.up.railway.app
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe public key
- [ ] `JWT_SECRET` - Session signing
- [ ] `NODE_ENV=production`

### **2. arstic-kindness (API Service)**
- [ ] `DATABASE_URL` - PostgreSQL connection
- [ ] `OPENAI_API_KEY` - For AI agents
- [ ] `ADMIN_API_KEY` - For `/admin/*` endpoints
- [ ] `API_SERVICE_KEY` - For service-to-service auth
- [ ] `STRIPE_*` (26 price IDs) - All 26 product mappings
- [ ] `RESEND_API_KEY` - Email service
- [ ] `JWT_SECRET` - Token verification
- [ ] `NODE_ENV=production`

### **3. m-marketplace (Next.js Mini-App)**
- [ ] `NEXT_PUBLIC_API_URL` - API endpoint
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Payments
- [ ] `JWT_SECRET` - Auth
- [ ] `DATABASE_URL` - (if reads data)

### **4. command-center (Next.js Mini-App)**
- [ ] `NEXT_PUBLIC_API_URL` - API endpoint
- [ ] `ADMIN_API_KEY` - Access admin endpoints
- [ ] `JWT_SECRET` - Auth

### **5. portal-owner (Next.js Portal)**
- [ ] `NEXT_PUBLIC_API_URL` - API endpoint
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Payments
- [ ] `JWT_SECRET` - Auth

### **6. portal-contractor (Next.js Portal)**
- [ ] `NEXT_PUBLIC_API_URL` - API endpoint
- [ ] `JWT_SECRET` - Auth

### **7. portal-developer (Next.js Portal)**
- [ ] `NEXT_PUBLIC_API_URL` - API endpoint  
- [ ] `JWT_SECRET` - Auth

### **8. admin-console (Next.js Admin)**
- [ ] `NEXT_PUBLIC_API_URL` - API endpoint
- [ ] `ADMIN_API_KEY` - Admin auth
- [ ] `JWT_SECRET` - Session

---

## 🔍 HOW TO VERIFY CURRENT VARIABLES

### **In Railway Dashboard:**

1. **Go to:** https://railway.app
2. **Select:** kealee-platform-v10 project
3. **Click:** arstic-kindness service
4. **Tab:** Variables
5. **Check:** Each variable is set

### **Required Environment Variables:**

```dockerfile
# CRITICAL (Must have):
✅ DATABASE_URL
✅ OPENAI_API_KEY
✅ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
✅ NEXT_PUBLIC_API_URL

# Image Generation (New):
✅ ADMIN_API_KEY = 2963f446c99b44278525daff14bc7bac
✅ API_SERVICE_KEY = kealee-service-auth-v1

# Email:
✅ RESEND_API_KEY

# Auth:
✅ JWT_SECRET
✅ SESSION_SECRET

# Stripe Product Prices (26 total):
✅ STRIPE_PRICE_CONCEPT
✅ STRIPE_PRICE_KITCHEN
✅ STRIPE_PRICE_BATH
... (24 more)

# App URLs:
✅ NODE_ENV = production
```

---

## 🚀 QUICK SETUP (3 Steps)

### **Step 1: Copy Admin Key**
```
ADMIN_API_KEY=2963f446c99b44278525daff14bc7bac
```

### **Step 2: Add to Railway Variables**
1. Railway > arstic-kindness > Variables
2. Paste `ADMIN_API_KEY=2963f446c99b44278525daff14bc7bac`
3. Click Save

### **Step 3: Verify Service Vars**
Check that each of these 8 services has correct variables:
- [x] web-main
- [x] arstic-kindness 
- [x] m-marketplace
- [x] command-center
- [x] portal-owner
- [x] portal-contractor
- [x] portal-developer
- [x] admin-console

---

## 📊 VARIABLES BY CATEGORY

### **Database**
```
DATABASE_URL=postgresql://[user]:[pass]@ballast.proxy.rlwy.net:46074/railway
```
✅ Shared across: arstic-kindness, web-main, portal-*, admin-console

---

### **Stripe (26 Price IDs)**
```
STRIPE_PRICE_CONCEPT=price_1SwJC...
STRIPE_PRICE_KITCHEN=price_1SwJC...
STRIPE_PRICE_BATH=price_1SwJC...
STRIPE_PRICE_MEDIA=price_1SwJC...
STRIPE_PRICE_HARDSCAPE=price_1SwJC...
STRIPE_PRICE_LANDSCAPE=price_1SwJC...
STRIPE_PRICE_DECK=price_1SwJC...
STRIPE_PRICE_PERGOLA=price_1SwJC...
STRIPE_PRICE_PATIO=price_1SwJC...
STRIPE_PRICE_FENCE=price_1SwJC...
STRIPE_PRICE_RETAINING=price_1SwJC...
STRIPE_PRICE_FIRE_PIT=price_1SwJC...
STRIPE_PRICE_WATER_FEATURE=price_1SwJC...
STRIPE_PRICE_POOL=price_1SwJC...
STRIPE_PRICE_HOT_TUB=price_1SwJC...
STRIPE_PRICE_ADU=price_1SwJC...
STRIPE_PRICE_GUEST_HOUSE=price_1SwJC...
STRIPE_PRICE_GARAGE=price_1SwJC...
STRIPE_PRICE_CARPORT=price_1SwJC...
STRIPE_PRICE_STORAGE=price_1SwJC...
STRIPE_PRICE_SHED=price_1SwJC...
STRIPE_PRICE_PERGOLA_KIT=price_1SwJC...
STRIPE_PRICE_GAZEBO=price_1SwJC...
STRIPE_PRICE_SUNROOM=price_1SwJC...
STRIPE_PRICE_SCREENED_ROOM=price_1SwJC...
STRIPE_PRICE_WINE_CELLAR=price_1SwJC...
```
✅ Location: arstic-kindness (you said these are already set)

---

### **OpenAI / AI Agents**
```
OPENAI_API_KEY=sk-[YOUR_KEY]
```
✅ Location: arstic-kindness (for KeaBots)

---

### **Admin & Image Generation (NEW)**
```
ADMIN_API_KEY=2963f446c99b44278525daff14bc7bac
API_SERVICE_KEY=kealee-service-auth-v1
```
✅ Location: arstic-kindness (for /admin/* endpoints)

---

### **Email**
```
RESEND_API_KEY=re_[YOUR_KEY]
```
✅ Location: arstic-kindness (for email notifications)

---

### **JWT / Sessions**
```
JWT_SECRET=[random 32 char]
SESSION_SECRET=[random 32 char]
```
✅ Location: arstic-kindness, web-main

---

### **Public URLs**
```
NEXT_PUBLIC_API_URL=https://arstic-kindness.up.railway.app
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_[YOUR_KEY]
```
✅ Location: web-main, portal-*, marketplace

---

## ⚠️ COMMON ISSUES

### **"ADMIN_API_KEY not found"**
- [ ] Add `ADMIN_API_KEY=2963f446c99b44278525daff14bc7bac` to Variables
- [ ] Click Save
- [ ] Wait 2-3 min for redeploy
- [ ] Retry

### **"OPENAI_API_KEY not set"**
- [ ] Verify: Railway > arstic-kindness > Variables
- [ ] Confirm `OPENAI_API_KEY=sk_*` exists
- [ ] If missing, add your key

### **Images fail to save**
- [ ] Check: `API_SERVICE_KEY` is set
- [ ] Check: `DATABASE_URL` is correct
- [ ] Check: ProductImage table exists (Prisma schema)

---

## 🎯 FINAL CHECKLIST

Before running image generation:

- [ ] `ADMIN_API_KEY` = 2963f446c99b44278525daff14bc7bac ← **NEW**
- [ ] `OPENAI_API_KEY` = sk_* ← **Must exist**
- [ ] All 26 `STRIPE_PRICE_*` variables set ← **You confirmed these**
- [ ] `DATABASE_URL` set ← **Must exist**
- [ ] `NEXT_PUBLIC_API_URL` = https://arstic-kindness.up.railway.app ← **Must exist**
- [ ] `RESEND_API_KEY` set ← **For emails**
- [ ] `JWT_SECRET` set ← **For auth**
- [ ] `NODE_ENV=production` ← **Set**

---

## ✅ READY TO GENERATE IMAGES?

Once variables are confirmed:

```bash
# Dry run (no cost):
curl -X POST "https://arstic-kindness.up.railway.app/admin/generate-images?dryRun=true" \
  -H "X-API-Key=2963f446c99b44278525daff14bc7bac"

# Full execution (162 images, ~$6.50):
curl -X POST https://arstic-kindness.up.railway.app/admin/generate-images \
  -H "X-API-Key=2963f446c99b44278525daff14bc7bac"
```

---

**Your Admin API Key:** `2963f446c99b44278525daff14bc7bac`  
**Action Required:** Add only this new key to Railway variables, then we can run image generation!

