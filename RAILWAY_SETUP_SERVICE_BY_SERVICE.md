# 🎯 Railway Variables Setup - Step by Step

**Admin Key:** `2963f446c99b44278525daff14bc7bac`  
**Date:** April 6, 2026  
**Status:** Ready for deployment

---

## 📋 SERVICES REQUIRING VARIABLES

In arstic-kindness project, these 8 services need variables:

1. **arstic-kindness** (API) - CRITICAL
2. **web-main** (Frontend) - CRITICAL
3. **m-marketplace** (Mini-app)
4. **command-center** (Mini-app)
5. **portal-owner** (Portal)
6. **portal-contractor** (Portal)
7. **portal-developer** (Portal)
8. **admin-console** (Admin)

---

## 🔧 SERVICE-BY-SERVICE SETUP

### **⚠️ CRITICAL: Service #1 - arstic-kindness (API)**

**Go to:** Railway > kealee-platform-v10 > **arstic-kindness** > Variables

**Paste these variables:**

```
ADMIN_API_KEY=2963f446c99b44278525daff14bc7bac
API_SERVICE_KEY=kealee-service-auth-v1
DATABASE_URL=postgresql://postgres:[PASSWORD]@ballast.proxy.rlwy.net:46074/railway
OPENAI_API_KEY=sk_[EXISTING_KEY]
RESEND_API_KEY=re_[EXISTING_KEY]
JWT_SECRET=[EXISTING_SECRET]
SESSION_SECRET=[EXISTING_SECRET]
NEXT_PUBLIC_API_URL=https://arstic-kindness.up.railway.app
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_[EXISTING_KEY]
NODE_ENV=production
STRIPE_PRICE_CONCEPT=price_1SwJCjIQghAs8OOIcZxddJDk
STRIPE_PRICE_KITCHEN=price_1SwJCjIQghAs8OOI6qX8d97n
STRIPE_PRICE_BATH=price_1SwJCjIQghAs8OOIKvPp9P4h
STRIPE_PRICE_MEDIA=price_1SwJCjIQghAs8OOI8C3d8Xq2
STRIPE_PRICE_HARDSCAPE=price_1SwJCjIQghAs8OOIqJPjKz4I
STRIPE_PRICE_LANDSCAPE=price_1SwJCjIQghAs8OOIcqKCp9Qp
STRIPE_PRICE_DECK=price_1SwJCjIQghAs8OOI2X2zzP2d
STRIPE_PRICE_PERGOLA=price_1SwJCjIQghAs8OOIqKCBhPFd
STRIPE_PRICE_PATIO=price_1SwJCjIQghAs8OOI4K3pK9nP
STRIPE_PRICE_FENCE=price_1SwJCjIQghAs8OOI8q8JkZ3d
STRIPE_PRICE_RETAINING=price_1SwJCjIQghAs8OOI4NjJpXqF
STRIPE_PRICE_FIRE_PIT=price_1SwJCjIQghAs8OOI7qXpn4qP
STRIPE_PRICE_WATER_FEATURE=price_1SwJCjIQghAs8OOI2JJCpq9j
STRIPE_PRICE_POOL=price_1SwJCjIQghAs8OOI5sHNjP3z
STRIPE_PRICE_HOT_TUB=price_1SwJCjIQghAs8OOI9Cq4Kq2X
STRIPE_PRICE_ADU=price_1SwJCjIQghAs8OOI3Ls8Pp4K
STRIPE_PRICE_GUEST_HOUSE=price_1SwJCjIQghAs8OOI6sXqjs2D
STRIPE_PRICE_GARAGE=price_1SwJCjIQghAs8OOI4CqJpjzJ
STRIPE_PRICE_CARPORT=price_1SwJCjIQghAs8OOI8nPs8qNf
STRIPE_PRICE_STORAGE=price_1SwJCjIQghAs8OOI2DjQpqXk
STRIPE_PRICE_SHED=price_1SwJCjIQghAs8OOI5nJPDqq7
STRIPE_PRICE_PERGOLA_KIT=price_1SwJCjIQghAs8OOI7FpKJjZ9
STRIPE_PRICE_GAZEBO=price_1SwJCjIQghAs8OOI3qQpJpQD
STRIPE_PRICE_SUNROOM=price_1SwJCjIQghAs8OOI9KpQpJpF
STRIPE_PRICE_SCREENED_ROOM=price_1SwJCjIQghAs8OOI4nPqPJqM
STRIPE_PRICE_WINE_CELLAR=price_1SwJCjIQghAs8OOI7qZpJqNP
```

**⚡ Action:** Copy above, paste into Railway, click **Save**

---

### **Service #2 - web-main (Frontend)**

**Go to:** Railway > kealee-platform-v10 > **web-main** > Variables

**Paste these variables:**

```
DATABASE_URL=postgresql://postgres:[PASSWORD]@ballast.proxy.rlwy.net:46074/railway
JWT_SECRET=[EXISTING_SECRET]
SESSION_SECRET=[EXISTING_SECRET]
NEXT_PUBLIC_API_URL=https://arstic-kindness.up.railway.app
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_[EXISTING_KEY]
NODE_ENV=production
```

**⚡ Action:** Copy above, paste into Railway, click **Save**

---

### **Service #3 - m-marketplace**

**Go to:** Railway > kealee-platform-v10 > **m-marketplace** > Variables

**Paste these variables:**

```
NEXT_PUBLIC_API_URL=https://arstic-kindness.up.railway.app
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_[EXISTING_KEY]
JWT_SECRET=[EXISTING_SECRET]
NODE_ENV=production
```

**⚡ Action:** Copy above, paste into Railway, click **Save**

---

### **Service #4 - command-center**

**Go to:** Railway > kealee-platform-v10 > **command-center** > Variables

**Paste these variables:**

```
NEXT_PUBLIC_API_URL=https://arstic-kindness.up.railway.app
ADMIN_API_KEY=2963f446c99b44278525daff14bc7bac
JWT_SECRET=[EXISTING_SECRET]
NODE_ENV=production
```

**⚡ Action:** Copy above, paste into Railway, click **Save**

---

### **Service #5 - portal-owner**

**Go to:** Railway > kealee-platform-v10 > **portal-owner** > Variables

**Paste these variables:**

```
NEXT_PUBLIC_API_URL=https://arstic-kindness.up.railway.app
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_[EXISTING_KEY]
JWT_SECRET=[EXISTING_SECRET]
NODE_ENV=production
```

**⚡ Action:** Copy above, paste into Railway, click **Save**

---

### **Service #6 - portal-contractor**

**Go to:** Railway > kealee-platform-v10 > **portal-contractor** > Variables

**Paste these variables:**

```
NEXT_PUBLIC_API_URL=https://arstic-kindness.up.railway.app
JWT_SECRET=[EXISTING_SECRET]
NODE_ENV=production
```

**⚡ Action:** Copy above, paste into Railway, click **Save**

---

### **Service #7 - portal-developer**

**Go to:** Railway > kealee-platform-v10 > **portal-developer** > Variables

**Paste these variables:**

```
NEXT_PUBLIC_API_URL=https://arstic-kindness.up.railway.app
JWT_SECRET=[EXISTING_SECRET]
NODE_ENV=production
```

**⚡ Action:** Copy above, paste into Railway, click **Save**

---

### **Service #8 - admin-console**

**Go to:** Railway > kealee-platform-v10 > **admin-console** > Variables

**Paste these variables:**

```
NEXT_PUBLIC_API_URL=https://arstic-kindness.up.railway.app
ADMIN_API_KEY=2963f446c99b44278525daff14bc7bac
JWT_SECRET=[EXISTING_SECRET]
NODE_ENV=production
```

**⚡ Action:** Copy above, paste into Railway, click **Save**

---

## ⏱️ DEPLOYMENT TIMELINE

After updating all 8 services:

1. **5 minutes:** Add variables to all services
2. **2-3 minutes:** Railway builds & deploys (watch logs)
3. **1 minute:** Tests (dry-run)
4. **30-45 minutes:** Image generation (162 images)

---

## ✅ COMPLETION CHECKLIST

After adding variables:

- [ ] **arstic-kindness** - All 32 variables added + Saved
- [ ] **web-main** - All 6 variables added + Saved
- [ ] **m-marketplace** - All 4 variables added + Saved
- [ ] **command-center** - All 4 variables added + Saved
- [ ] **portal-owner** - All 4 variables added + Saved
- [ ] **portal-contractor** - All 3 variables added + Saved
- [ ] **portal-developer** - All 3 variables added + Saved
- [ ] **admin-console** - All 4 variables added + Saved

---

## 🚀 ONCE VARIABLES ARE SET

Then run these commands in terminal:

### **Test Connection (Dry Run)**
```bash
curl -X POST "https://arstic-kindness.up.railway.app/admin/generate-images?dryRun=true" \
  -H "X-API-Key=2963f446c99b44278525daff14bc7bac"
```

Should show:
```json
{
  "message": "DRY RUN - No images generated",
  "plan": {
    "productsCount": 27,
    "totalImages": 162,
    "estimatedCost": 6.48
  }
}
```

### **Execute 162 Image Generation**
```bash
curl -X POST https://arstic-kindness.up.railway.app/admin/generate-images \
  -H "X-API-Key=2963f446c99b44278525daff14bc7bac"
```

Should show:
```json
{
  "message": "Image generation queued",
  "jobs": 27,
  "details": "KeaBot-Design will process these jobs. Check logs for progress."
}
```

### **Monitor Progress (Every 5-10 minutes)**
```bash
curl https://arstic-kindness.up.railway.app/admin/generate-images/status \
  -H "X-API-Key=2963f446c99b44278525daff14bc7bac"
```

Target output when done:
```json
{
  "totalProducts": 27,
  "totalImages": 162,
  "completionPercentage": "100.0"
}
```

---

## 📝 NOTES

**"[EXISTING_KEY]" means:**
- Use the value that's already in Railway
- Don't create a new one
- Just copy the existing value into this format

**Example for DATABASE_URL:**
```
# If your current Railway DATABASE_URL is:
postgresql://postgres:mypassword@ballast.proxy.rlwy.net:46074/railway

# Use exactly that in the paste section
```

---

## 🎯 NEXT IMMEDIATE STEPS

1. Go to Railway dashboard
2. Add variables to each of the 8 services using the sections above
3. Wait 2-3 minutes for redeploy
4. Come back here and run the curl commands

**Estimated time:** 10-15 minutes to set up, then 30-45 minutes for image generation

Ready? Start with **arstic-kindness** (the API service) - that's the most critical one. ✅

