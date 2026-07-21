# 🔗 Connect Vercel Apps to Railway API

**Goal:** Point all Vercel frontend apps to your Railway backend API  
**Time:** 20-30 minutes  
**Services to Configure:** 10 Vercel apps → 1 Railway API

---

## 📋 STEP 1: Get Your Railway API URL (5 minutes)

### **Option A: Use Railway's Generated URL**

1. Go to Railway Dashboard
2. Click **"kealee-platform-v10"** service
3. Click **"Settings"** tab
4. Under **"Public Networking"**:
   - If you see a domain: **Copy it**
   - If not: Click **"Generate Domain"**
5. Copy the URL (e.g., `https://kealee-platform-v10-production.up.railway.app`)

### **Option B: Use Custom Domain (Recommended)**

1. In Railway → kealee-platform-v10 → Settings
2. Click **"+ Custom Domain"**
3. Enter: `api.kealee.com`
4. Copy the DNS values Railway provides
5. Go to NameBright → Add CNAME record:
   - Name: `api`
   - Value: (from Railway)
6. Wait 5-15 minutes for DNS
7. Use: `https://api.kealee.com`

---

## 📋 STEP 2: Add API URL to All Vercel Apps (20 minutes)

### **Apps That Need This Variable:**
1. m-marketplace
2. m-ops-services ⭐ (CRITICAL)
3. m-project-owner
4. m-architect
5. m-engineer
6. m-permits-inspections
7. m-finance-trust
8. m-inspector
9. m-estimation
10. os-pm
11. os-admin

### **For EACH App:**

1. Go to https://vercel.com/dashboard
2. Click the app
3. **Settings** → **Environment Variables**
4. Click **"Add New"** or **"Edit"** if it exists
5. Add:
   ```
   Name: NEXT_PUBLIC_API_URL
   Value: https://api.kealee.com
   (or your Railway URL)
   Environments: ✅ Production ✅ Preview ✅ Development
   ```
6. **Save**
7. **Redeploy** the app

---

## ⚡ **Quick Method - Bulk Update**

Instead of doing each app manually, use Vercel CLI:

```bash
# For each app directory
cd apps/m-ops-services
vercel env add NEXT_PUBLIC_API_URL production
# Paste: https://api.kealee.com
# Press Enter

# Repeat for each app
```

---

## 🗑️ **About Your Duplicate Services**

### **Services to KEEP in Railway:**
- ✅ Postgres
- ✅ Redis  
- ✅ kealee-platform-v10 (API backend)

### **Services to DELETE from Railway:**
- ❌ All frontend apps (already on Vercel)
- ❌ Any duplicate/test services
- ❌ "grateful-surprise" (if it's a test service)

**Why Delete?**
- Saves money (Railway charges per service)
- Reduces confusion
- Frontend apps work better on Vercel anyway

---

## 🔄 **Connection Flow**

```
User Browser
    ↓
Vercel App (e.g., m-ops-services)
    ↓ API call via NEXT_PUBLIC_API_URL
Railway API (kealee-platform-v10)
    ↓
Postgres Database
```

**All Vercel apps → ONE Railway API → ONE Database**

---

## ✅ **Verification**

After setup, test the connection:

1. **Visit:** https://ops.kealee.com (or your m-ops-services URL)
2. **Open browser console** (F12)
3. **Check Network tab**
4. **Look for API calls** - should go to your Railway URL
5. **Should return data** (not errors)

---

## 🎯 **Quick Decision Tree**

**Do you want to:**

**A) Use Custom Domain** (api.kealee.com) - Professional ✅
- Adds 15 min for DNS setup
- Looks professional
- Easier to remember

**B) Use Railway URL** - Quick ⚡
- Immediate (no DNS wait)
- Long ugly URL
- Works fine

**Recommendation:** Option A (custom domain) - worth the extra 15 minutes!

---

## 📞 **Need Help?**

**Tell me:**
1. What's your Railway API service URL? (or should we set up api.kealee.com?)
2. Should I help you delete the unnecessary Railway services?
3. Want me to create a script to bulk-update all Vercel apps?

**I can automate the Vercel env var updates once you give me the Railway API URL!** 🚀