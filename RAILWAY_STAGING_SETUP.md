# 🔧 Railway Staging Environment Setup

**Goal:** Create separate staging API for Vercel preview deployments  
**Time:** 15-20 minutes  
**Cost:** Free tier covers both environments

---

## 🎯 **ARCHITECTURE:**

```
Production Flow:
  Vercel Production → Railway Production API → Supabase Production

Staging Flow:
  Vercel Preview → Railway Staging API → Supabase Staging/Same
```

---

## 📊 **OPTION 1: Duplicate Service (Easiest) ⭐**

### **Step 1: Access Railway Dashboard**

1. Go to: https://railway.app/dashboard
2. Click on your project: **`kealee-platform-v10`**
3. You should see your current **`api`** service

---

### **Step 2: Create Staging Service**

**Method A: Duplicate Existing Service (Fastest)**

1. Click on your **`api`** service
2. Click **"Settings"** (gear icon)
3. Scroll to **"Danger Zone"**
4. Look for **"Duplicate Service"** (if available)
   - If available: Click it, name it **`api-staging`**
   - If not available: Use Method B below

**Method B: Create New Service Manually**

1. In your Railway project dashboard
2. Click **"+ New"** button
3. Select **"Empty Service"**
4. Name it: **`api-staging`**

---

### **Step 3: Configure Staging Service**

#### **3.1: Connect to GitHub**

1. Click on **`api-staging`** service
2. Click **"Settings"**
3. Under **"Source"**, click **"Connect Repo"**
4. Select: **`UseniSajor/kealee-platform-v10`**
5. **Branch:** Select **`preview-deploy`** (or `main` if no preview branch)
6. Click **"Connect"**

---

#### **3.2: Set Root Directory**

1. Still in Settings
2. Find **"Root Directory"**
3. Click **"Configure"**
4. Enter: `services/api`
5. Click **"Update"**

---

#### **3.3: Set Build Configuration**

1. In Settings → **"Build"**
2. **Build Command:**
   ```bash
   pnpm install --frozen-lockfile && cd ../.. && pnpm build --filter=@kealee/api
   ```

3. **Start Command:**
   ```bash
   node dist/index.js
   ```

4. **Install Command:**
   ```bash
   pnpm install --frozen-lockfile
   ```

---

### **Step 4: Set Environment Variables (Staging)**

1. Click on **`api-staging`** → **"Variables"** tab
2. Add these variables:

```bash
# === REQUIRED ===

# Node Environment
NODE_ENV=staging

# Port
PORT=3000

# Database (Staging)
# Option A: Use same Supabase (easier)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres

# Option B: Create separate staging database
# DATABASE_URL=postgresql://postgres:[STAGING_PASSWORD]@db.[STAGING_PROJECT].supabase.co:5432/postgres

# Supabase
SUPABASE_URL=https://[PROJECT].supabase.co
SUPABASE_KEY=[ANON_KEY]
SUPABASE_SERVICE_KEY=[SERVICE_KEY]

# CORS Origins (Allow Vercel preview URLs)
CORS_ORIGINS=https://*.vercel.app,http://localhost:3000

# === OPTIONAL ===

# API Key (for internal calls)
API_SECRET_KEY=your_staging_secret_key_different_from_prod

# Logging
LOG_LEVEL=debug

# Feature Flags (for staging)
ENABLE_DEBUG_MODE=true
ALLOW_TEST_USERS=true
```

3. Click **"Add"** for each variable

---

### **Step 5: Deploy Staging**

1. After setting variables, Railway auto-deploys
2. Wait 2-3 minutes for build
3. Check **"Deployments"** tab for status

---

### **Step 6: Enable Public Networking**

1. Click on **`api-staging`** service
2. Go to **"Settings"**
3. Find **"Networking"** section
4. Click **"Generate Domain"**
5. Railway generates: `api-staging-production-xxxx.up.railway.app`

**Save this URL!** You'll need it for Vercel preview environment.

---

### **Step 7: Test Staging API**

```bash
# Health check
curl https://api-staging-production-xxxx.up.railway.app/health

# Expected response:
{
  "status": "ok",
  "timestamp": 1234567890,
  "environment": "staging"
}
```

---

## 📊 **OPTION 2: Use Environments (Railway Pro Feature)**

**Note:** This requires Railway Pro plan ($20/month)

### **Step 1: Create Environment**

1. Railway Dashboard → Your Project
2. Click **"Environments"** tab
3. Click **"+ New Environment"**
4. Name: **`staging`**
5. Click **"Create"**

---

### **Step 2: Configure Staging Environment**

1. Switch to **`staging`** environment (dropdown at top)
2. Your existing service now runs in staging
3. Set different environment variables:
   - Different `DATABASE_URL`
   - Different API keys
   - Different feature flags

---

### **Step 3: Deploy to Staging**

1. Railway automatically deploys to staging
2. Each environment gets its own URL
3. Production remains unchanged

---

## 🔄 **OPTION 3: Branch Deployments (Simple)**

**If you don't want separate services:**

### **Use Git Branches for Staging**

1. Keep one Railway service
2. Configure it to deploy from **`preview-deploy`** branch
3. Production uses **`main`** branch

**Setup:**

1. Railway → Service Settings
2. **"Source"** → **"Branch"**
3. Change to: `preview-deploy`
4. Now pushes to `preview-deploy` trigger staging deploys

**Limitations:**
- Only one deployment at a time
- Can't have both production and staging running simultaneously

---

## ✅ **RECOMMENDED APPROACH:**

**For Free Tier:** Use **Option 1** (Duplicate Service)

**Benefits:**
- ✅ Production and staging run simultaneously
- ✅ Separate databases (if needed)
- ✅ Independent environment variables
- ✅ No impact on production when testing
- ✅ Still within free tier limits

---

## 🔗 **UPDATE VERCEL PREVIEW ENVIRONMENT:**

After creating staging API:

### **For Each Vercel App:**

1. Vercel Dashboard → Your App → **"Settings"** → **"Environment Variables"**
2. Find: `NEXT_PUBLIC_API_URL`
3. Click **"..."** → **"Edit"**
4. Set different values per environment:

```bash
# Production Environment
NEXT_PUBLIC_API_URL=https://kealee-platform-v10-production.up.railway.app

# Preview Environment  
NEXT_PUBLIC_API_URL=https://api-staging-production-xxxx.up.railway.app

# Development Environment
NEXT_PUBLIC_API_URL=http://localhost:3000
```

5. Click **"Save"**
6. Redeploy preview

---

## 📊 **VERIFICATION CHECKLIST:**

After setup:

- [ ] **Staging API deployed on Railway**
- [ ] **Health endpoint responds**
- [ ] **Different URL from production**
- [ ] **Environment variables set**
- [ ] **Public networking enabled**
- [ ] **Vercel preview uses staging URL**
- [ ] **Production still works**

---

## 🔍 **TEST YOUR SETUP:**

### **1. Test Staging API:**

```bash
# Health check
curl https://api-staging-production-xxxx.up.railway.app/health

# GraphQL endpoint
curl -X POST https://api-staging-production-xxxx.up.railway.app/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ hello }"}'
```

---

### **2. Test from Vercel Preview:**

1. Push to `preview-deploy` branch
2. Wait for Vercel preview deployment
3. Open preview URL
4. Check browser console (F12)
5. Network tab should show calls to staging API

---

### **3. Verify Isolation:**

```bash
# Production should still work
curl https://kealee-platform-v10-production.up.railway.app/health

# Staging should be independent
curl https://api-staging-production-xxxx.up.railway.app/health
```

---

## 🗄️ **DATABASE STRATEGY:**

### **Option A: Shared Database (Easier)**

**Pros:**
- ✅ One database to manage
- ✅ Simpler setup
- ✅ Real production data for testing

**Cons:**
- ⚠️ Staging affects production data
- ⚠️ Less isolation
- ⚠️ Risk of data corruption

**Best For:** Early development

---

### **Option B: Separate Staging Database (Recommended)**

**Pros:**
- ✅ Complete isolation
- ✅ Safe to test destructive operations
- ✅ Can use test data

**Cons:**
- ⚠️ More setup required
- ⚠️ Data sync needed

**Best For:** Production environments

**Setup:**

1. Supabase Dashboard
2. Create new project: **`kealee-platform-staging`**
3. Copy staging DATABASE_URL
4. Add to Railway staging environment
5. Run migrations on staging database

---

## 💰 **COST IMPLICATIONS:**

### **Railway Free Tier:**

```
Free Plan Includes:
- $5 credit per month
- 500 hours of usage
- Multiple services allowed

With 2 Services:
- Production API: ~350 hours/month
- Staging API: ~150 hours/month (if always on)

Recommendation:
- Enable "Sleep on Idle" for staging
- Staging sleeps after 5 min of no requests
- Wakes up automatically when needed
- Production stays always-on
```

---

## ⚙️ **ENABLE SLEEP MODE (Staging Only):**

1. Railway → **`api-staging`** → **"Settings"**
2. Find **"Sleep Mode"**
3. Toggle **"Enable"**
4. Staging API now sleeps after 5 minutes idle
5. Wakes automatically on first request

**Note:** First request after sleep takes ~10 seconds

---

## 🎯 **ENVIRONMENT VARIABLES COMPARISON:**

| Variable | Production | Staging |
|----------|-----------|---------|
| `NODE_ENV` | production | staging |
| `DATABASE_URL` | Prod DB | Staging DB |
| `LOG_LEVEL` | info | debug |
| `ENABLE_DEBUG_MODE` | false | true |
| `STRIPE_KEY` | sk_live_xxx | sk_test_xxx |
| `CORS_ORIGINS` | Production URLs | Preview URLs |

---

## 🔄 **DEPLOYMENT WORKFLOW:**

```bash
# 1. Develop locally
git checkout -b feature/new-feature
# ... make changes ...

# 2. Push to preview branch
git checkout preview-deploy
git merge feature/new-feature
git push origin preview-deploy

# 3. Automatic deployments:
# - Railway staging API rebuilds
# - Vercel preview deploys
# - Preview uses staging API

# 4. Test preview thoroughly

# 5. Promote to production
git checkout main
git merge preview-deploy
git push origin main

# 6. Automatic production deploy
# - Railway production API updates
# - Vercel production deploys
```

---

## 📚 **USEFUL RAILWAY CLI COMMANDS:**

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link to project
railway link

# View logs (staging)
railway logs --service api-staging

# View logs (production)
railway logs --service api

# Set variable (staging)
railway variables set NODE_ENV=staging --service api-staging

# Deploy manually
railway up --service api-staging
```

---

## 🆘 **TROUBLESHOOTING:**

### **Staging API not responding:**

```bash
# Check Railway logs
# Dashboard → api-staging → "Deployments" → Click latest → View logs

Common issues:
1. Environment variables missing
2. Build failed
3. Port not set correctly
4. Sleep mode (first request slow)
```

---

### **Vercel preview still using production API:**

```bash
# Check environment variables
Vercel → App → Settings → Environment Variables
→ NEXT_PUBLIC_API_URL should be different for Preview

# Redeploy preview after changing
```

---

### **Database connection fails:**

```bash
# Check DATABASE_URL is correct
# Test connection:
railway shell --service api-staging
> node -e "console.log(process.env.DATABASE_URL)"
```

---

## ✅ **SUCCESS CRITERIA:**

Your staging is working when:

- ✅ Staging API responds to health checks
- ✅ Different URL from production
- ✅ Vercel preview uses staging URL
- ✅ Can deploy to staging without affecting production
- ✅ Staging has debug logging enabled
- ✅ Production remains stable

---

## 📝 **QUICK SETUP (TL;DR):**

```bash
1. Railway → "+ New" → "Empty Service" → Name: "api-staging"
2. Settings → Source → Connect repo → Branch: preview-deploy
3. Settings → Root Directory → "services/api"
4. Variables → Copy from production, change NODE_ENV=staging
5. Settings → Networking → Generate Domain
6. Save staging URL
7. Vercel → Apps → Settings → Environment Variables
   → Set NEXT_PUBLIC_API_URL for Preview = staging URL
8. Test!
```

---

**Ready to create your staging environment?** 🚀
