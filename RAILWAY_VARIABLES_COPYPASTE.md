# 🚀 Railway Variables - Raw Copy & Paste Format

**For:** arstic-kindness service in Railway  
**Date:** April 6, 2026

---

## 📋 COPY ALL BELOW THIS LINE

```
ADMIN_API_KEY=2963f446c99b44278525daff14bc7bac
API_SERVICE_KEY=kealee-service-auth-v1
```

---

## 🔍 BUT FIRST - Verify You Have These Already Set:

Before adding the 2 above, make sure your Railway variables include:

```
# DATABASE (REQUIRED)
DATABASE_URL=postgresql://[your_current_connection]

# OPENAI (REQUIRED FOR AGENTS)
OPENAI_API_KEY=sk_[your_current_key]

# STRIPE PRICES (26 total - you said these are set)
STRIPE_PRICE_CONCEPT=price_1Sw[...]
STRIPE_PRICE_KITCHEN=price_1Sw[...]
STRIPE_PRICE_BATH=price_1Sw[...]
... (23 more STRIPE_PRICE_* variables)

# RESEND (REQUIRED FOR EMAIL)
RESEND_API_KEY=re_[your_current_key]

# JWT & SESSION (REQUIRED FOR AUTH)
JWT_SECRET=[your_current_secret]
SESSION_SECRET=[your_current_secret]

# PUBLIC URLs (REQUIRED FOR FRONTEND)
NEXT_PUBLIC_API_URL=https://arstic-kindness.up.railway.app
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_[your_current_key]

# ENVIRONMENT
NODE_ENV=production
```

---

## ✅ FINAL VARIABLE LIST TO SET

If you're starting fresh, here's EVERYTHING for arstic-kindness:

```
ADMIN_API_KEY=2963f446c99b44278525daff14bc7bac
API_SERVICE_KEY=kealee-service-auth-v1
DATABASE_URL=postgresql://postgres:[PASSWORD]@ballast.proxy.rlwy.net:46074/railway
OPENAI_API_KEY=sk_[YOUR_OPENAI_KEY]
RESEND_API_KEY=re_[YOUR_RESEND_KEY]
JWT_SECRET=[32_CHAR_RANDOM_STRING]
SESSION_SECRET=[32_CHAR_RANDOM_STRING]
NEXT_PUBLIC_API_URL=https://arstic-kindness.up.railway.app
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_[YOUR_STRIPE_PK]
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

---

## 🎯 HOW TO PASTE INTO RAILWAY

### **Option 1: One at a time (Safest)**

1. Go to: https://railway.app
2. Select: kealee-platform-v10
3. Select: arstic-kindness service
4. Click: Variables tab
5. Add one variable per line:
   ```
   ADMIN_API_KEY=2963f446c99b44278525daff14bc7bac
   ```
6. Click Save
7. Repeat for `API_SERVICE_KEY=kealee-service-auth-v1`

### **Option 2: Bulk paste (Faster)**

1. Go to: https://railway.app → kealee-platform-v10 → arstic-kindness → Variables
2. Click: "Add Variable" (or raw text edit mode if available)
3. Paste the entire list above
4. Click: Save

### **Option 3: Railway CLI (If you use it)**

```bash
# Save variables to .env file locally
# Then run:
railway env push

# Or manually:
railway env set ADMIN_API_KEY=2963f446c99b44278525daff14bc7bac
railway env set API_SERVICE_KEY=kealee-service-auth-v1
```

---

## ⏱️ AFTER ADDING VARIABLES

Wait **2-3 minutes** for Railway to:
1. Accept variables
2. Rebuild service
3. Deploy new version

You'll see in Railway > Logs:
```
Building...
[keabot-design] Ready with 3 tools
```

---

# 🎨 HOW TO EXECUTE 162 IMAGE GENERATION

## **Step 1: Verify Admin Key Works (Dry Run)**

```bash
curl -X POST "https://arstic-kindness.up.railway.app/admin/generate-images?dryRun=true" \
  -H "X-API-Key=2963f446c99b44278525daff14bc7bac"
```

**Expected Response:**
```json
{
  "message": "DRY RUN - No images generated",
  "plan": {
    "productsCount": 27,
    "imagesPerProduct": 6,
    "totalImages": 162,
    "dryRun": true,
    "estimatedCost": 6.48
  }
}
```

---

## **Step 2: Execute Full Generation (162 Images)**

```bash
curl -X POST https://arstic-kindness.up.railway.app/admin/generate-images \
  -H "X-API-Key=2963f446c99b44278525daff14bc7bac"
```

**Expected Response:**
```json
{
  "message": "Image generation queued",
  "plan": {
    "productsCount": 27,
    "imagesPerProduct": 6,
    "totalImages": 162,
    "estimatedCost": 6.48,
    "dryRun": false
  },
  "jobs": 27,
  "details": "KeaBot-Design will process these jobs. Check logs for progress."
}
```

---

## **Step 3: Monitor Progress (30-45 minutes)**

Open **Railway Logs** and watch:

```bash
# Go to:
https://railway.app 
  → kealee-platform-v10 
  → arstic-kindness 
  → Logs

# Look for lines like:
[keabot-design] Processing: kitchen-remodel (kitchen-remodel)
[keabot-design] ✅ before (modern) for kitchen-remodel
[keabot-design] ✅ after (modern) for kitchen-remodel
[keabot-design] Processing: bathroom-renovation (bathroom-renovation)
[keabot-design] ✅ before (contemporary) for bathroom-renovation
... (continues for 27 products)

# Final message:
[keabot-design] ✅ Image generation complete!
```

---

## **Step 4: Check Status**

```bash
curl https://arstic-kindness.up.railway.app/admin/generate-images/status \
  -H "X-API-Key=2963f446c99b44278525daff14bc7bac"
```

**Response updates as images are generated:**
```json
{
  "totalProducts": 27,
  "totalImages": 45,
  "averageImagesPerProduct": 1.7,
  "completionPercentage": "27.8"
}
```

Poll this every 5-10 minutes to track progress. Target: 162 images.

---

## **Step 5: Verify Images in Database**

Once complete (162 images), they're saved to PostgreSQL `ProductImage` table.

Check via:
```bash
# Using psql or database client:
SELECT COUNT(*) FROM "ProductImage";
# Should show: 162

SELECT DISTINCT type FROM "ProductImage";
# Should show: before, after, hero
```

---

## 🚀 COMPLETE EXECUTION CHECKLIST

- [ ] **Add Variables to Railway** (ADMIN_API_KEY + API_SERVICE_KEY)
- [ ] **Wait 2-3 min** for redeploy
- [ ] **Run dry-run** test to verify auth
- [ ] **Execute full generation** (curl command)
- [ ] **Monitor logs** for success messages
- [ ] **Poll status endpoint** every 5-10 min
- [ ] **Wait 30-45 minutes** for all images
- [ ] **Verify count = 162** via status endpoint
- [ ] **Display on product pages** (next step)

---

## 💰 COST BREAKDOWN

```
162 images × $0.04 per DALL-E 3 image = $6.48
```

One-time cost. After that, images are free to display on site.

---

## 🎯 QUICK COMMAND REFERENCE

```bash
# Dry run (test, $0):
curl -X POST "https://arstic-kindness.up.railway.app/admin/generate-images?dryRun=true" \
  -H "X-API-Key=2963f446c99b44278525daff14bc7bac"

# Full generation (162 images, ~$6.50):
curl -X POST https://arstic-kindness.up.railway.app/admin/generate-images \
  -H "X-API-Key=2963f446c99b44278525daff14bc7bac"

# Check status:
curl https://arstic-kindness.up.railway.app/admin/generate-images/status \
  -H "X-API-Key=2963f446c99b44278525daff14bc7bac"

# Single product only:
curl -X POST "https://arstic-kindness.up.railway.app/admin/generate-images?productId=kitchen-remodel" \
  -H "X-API-Key=2963f446c99b44278525daff14bc7bac"
```

---

## ⚠️ TROUBLESHOOTING

### **"Unauthorized" / "Invalid API Key"**
```
Solution: Verify ADMIN_API_KEY in Railway matches:
2963f446c99b44278525daff14bc7bac
```

### **"OPENAI_API_KEY not found"**
```
Solution: Verify OPENAI_API_KEY is set in Railway variables
```

### **Generation takes too long**
```
Each image: 10-30 seconds
162 images: 30-90 minutes total
This is NORMAL. Don't interrupt.
```

### **Images not saving to database**
```
Check: 
1. DATABASE_URL is correct
2. Prisma ProductImage migration applied
3. API_SERVICE_KEY matches in code
```

---

**Your Admin Key:** `2963f446c99b44278525daff14bc7bac`  
**Setup Time:** 5 minutes (add variables + redeploy)  
**Generation Time:** 30-45 minutes  
**Cost:** ~$6.50

Ready? Add the variables now! 🚀
