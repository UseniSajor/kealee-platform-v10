# 🚂 Railway Complete Setup Walkthrough
## Production + Staging API Configuration

**Time Required:** 30-45 minutes  
**Difficulty:** Intermediate  
**Prerequisites:** Git repository, Railway account

---

## 📋 **TABLE OF CONTENTS**

1. [Overview & Architecture](#overview)
2. [Part 1: Verify Production API](#part-1-verify-production)
3. [Part 2: Create Staging API](#part-2-create-staging)
4. [Part 3: Configure Environment Variables](#part-3-environment-variables)
5. [Part 4: Testing & Verification](#part-4-testing)
6. [Part 5: Connect to Vercel](#part-5-connect-vercel)
7. [Troubleshooting](#troubleshooting)

---

<a name="overview"></a>
## 🎯 **OVERVIEW & ARCHITECTURE**

### **What We're Building:**

```
┌─────────────────────────────────────────────────┐
│  PRODUCTION ENVIRONMENT                         │
├─────────────────────────────────────────────────┤
│  Vercel Apps (Production)                       │
│       ↓ API calls                               │
│  Railway API (Production)                       │
│       ↓ database queries                        │
│  Supabase (Production)                          │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  STAGING ENVIRONMENT (for testing)              │
├─────────────────────────────────────────────────┤
│  Vercel Apps (Preview)                          │
│       ↓ API calls                               │
│  Railway API (Staging) ⭐ NEW                    │
│       ↓ database queries                        │
│  Supabase (Same or Separate)                    │
└─────────────────────────────────────────────────┘
```

---

### **Why Two Environments?**

| Feature | Production | Staging |
|---------|-----------|---------|
| **Purpose** | Live users | Testing |
| **API Keys** | Live (Stripe sk_live_) | Test (Stripe sk_test_) |
| **Logging** | Minimal (info) | Verbose (debug) |
| **Uptime** | Always on | Sleeps when idle |
| **Data** | Real | Test/dummy |
| **Cost** | Higher | Lower (sleep mode) |

---

<a name="part-1-verify-production"></a>
## 📦 **PART 1: VERIFY PRODUCTION API**

### **Step 1.1: Access Railway Dashboard**

1. Go to: https://railway.app/dashboard
2. Login with your account
3. Find your project: **`kealee-platform-v10`**
4. Click on it

---

### **Step 1.2: Locate Your Current API Service**

In your project dashboard, you should see:

```
┌────────────────────────────────┐
│  kealee-platform-v10           │
├────────────────────────────────┤
│  📦 api (or similar name)      │  ← Your current production API
│  Status: 🟢 Active             │
│  Last deployed: [date]         │
└────────────────────────────────┘
```

**Click on the API service** to view details.

---

### **Step 1.3: Check Current Configuration**

1. **Click on "Settings" tab**
2. **Verify these settings:**

```yaml
Source:
  Connected Repository: UseniSajor/kealee-platform-v10
  Branch: main
  Root Directory: (empty - uses project root)

Build:
  Builder: Docker (auto-detected from Dockerfile)
  Build Command: (empty)
  Start Command: (empty)
```

---

### **Step 1.4: Check Environment Variables**

1. **Click on "Variables" tab**
2. **You should see these critical variables:**

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://...
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

3. **Copy these variables** - you'll need them for staging!

**TIP:** Click "Copy All Variables" button and paste into a text file temporarily.

---

### **Step 1.5: Get Production API URL**

1. Click on **"Settings"** → **"Networking"**
2. Find **"Public Networking"** section
3. You should see a URL like:

```
https://kealee-platform-v10-production.up.railway.app
```

4. **Copy this URL** - save it for later!

---

### **Step 1.6: Test Production API**

Open a terminal and run:

```bash
curl https://kealee-platform-v10-production.up.railway.app/health
```

**Expected response:**
```json
{"status":"ok","timestamp":1737241234567}
```

✅ **If you see this, your production API is working!**

❌ **If not working:** See troubleshooting section at the end.

---

<a name="part-2-create-staging"></a>
## 🆕 **PART 2: CREATE STAGING API**

### **Step 2.1: Create New Service**

1. **Go back to your Railway project dashboard**
2. Click **"+ New"** button (top right)
3. Select **"Empty Service"**
4. Name it: **`api-staging`**
5. Click **"Create"**

You now have two services:
```
┌────────────────────────────────┐
│  📦 api                        │  ← Production
│  Status: 🟢 Active             │
└────────────────────────────────┘

┌────────────────────────────────┐
│  📦 api-staging                │  ← Staging (NEW)
│  Status: 🟡 Not deployed yet   │
└────────────────────────────────┘
```

---

### **Step 2.2: Connect Repository to Staging**

1. **Click on `api-staging` service**
2. Click **"Settings"** tab
3. Find **"Source"** section
4. Click **"Connect Repo"**

**Configure as follows:**

```yaml
Repository: UseniSajor/kealee-platform-v10
Branch: main
Root Directory: (leave empty)
```

5. Click **"Connect"**

---

### **Step 2.3: Verify Docker Detection**

After connecting:

1. Railway should **auto-detect your Dockerfile**
2. You'll see: **"Builder: Docker"**
3. **Leave all build commands empty:**
   - Build Command: (empty)
   - Start Command: (empty)
   - Install Command: (empty)

**Why?** Your Dockerfile handles everything!

---

### **Step 2.4: Generate Public URL for Staging**

1. Still in `api-staging` → **"Settings"**
2. Find **"Networking"** section
3. Under **"Public Networking"**, click **"Generate Domain"**

Railway creates a URL like:
```
https://api-staging-production-abcd1234.up.railway.app
```

4. **Copy this URL** - you'll need it for Vercel!

---

### **Step 2.5: Enable Sleep Mode (Optional but Recommended)**

To save resources:

1. Still in **"Settings"**
2. Find **"Sleep Mode"** section
3. Toggle **"Enable"**

**What this does:**
- Staging API sleeps after 5 minutes of no requests
- Wakes up automatically on first request (~10 seconds delay)
- Saves your Railway credits
- Production stays always-on

---

<a name="part-3-environment-variables"></a>
## 🔑 **PART 3: CONFIGURE ENVIRONMENT VARIABLES**

### **Step 3.1: Set Staging Variables**

1. Click on `api-staging` service
2. Click **"Variables"** tab
3. Click **"+ New Variable"**

---

### **Step 3.2: Add Core Variables**

Add these one by one (or use "Raw Editor" to paste all at once):

```env
# ===== CORE CONFIGURATION =====
NODE_ENV=staging
PORT=3000

# ===== DATABASE (Same as production or separate) =====
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:6543/postgres

# ===== SUPABASE (Same as production) =====
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# ===== CORS (Allow Vercel domains) =====
CORS_ORIGINS=https://*.vercel.app,http://localhost:3000

# ===== API KEYS (Use TEST keys!) =====
# Stripe (TEST key for staging!)
STRIPE_SECRET_KEY=sk_test_51...

# Anthropic Claude
ANTHROPIC_API_KEY=sk-ant-...

# SendGrid
SENDGRID_API_KEY=SG...

# ===== DEBUGGING (Staging only) =====
LOG_LEVEL=debug
ENABLE_DEBUG_MODE=true
ALLOW_TEST_USERS=true
RAILWAY_ENVIRONMENT=staging
```

---

### **Step 3.3: IMPORTANT - Use Test API Keys!**

For staging, use **test/sandbox** keys:

| Service | Production | Staging |
|---------|-----------|---------|
| **Stripe** | `sk_live_...` | `sk_test_...` ⭐ |
| **Stripe Publishable** | `pk_live_...` | `pk_test_...` ⭐ |
| **Database** | Production DB | Same or separate |
| **Logging** | `info` | `debug` ⭐ |

**Why?** So you don't accidentally charge real customers when testing!

---

### **Step 3.4: Deploy Staging**

After adding variables:

1. Railway **automatically deploys** staging
2. Go to **"Deployments"** tab
3. Watch the build progress

**Build takes:** ~3-5 minutes

**Logs will show:**
```
Building with Docker...
[+] Building 180.5s...
Successfully built...
Starting service...
✅ Server ready at http://0.0.0.0:3000
```

---

<a name="part-4-testing"></a>
## 🧪 **PART 4: TESTING & VERIFICATION**

### **Step 4.1: Test Staging Health Check**

Once deployed, test your staging API:

```bash
curl https://api-staging-production-abcd1234.up.railway.app/health
```

**Expected response:**
```json
{"status":"ok","timestamp":1737241234567}
```

✅ **Working!**

---

### **Step 4.2: Test Both APIs Side-by-Side**

```bash
# Production
curl https://kealee-platform-v10-production.up.railway.app/health

# Staging  
curl https://api-staging-production-abcd1234.up.railway.app/health

# Both should respond with:
# {"status":"ok","timestamp":1737241234567}
```

---

### **Step 4.3: Check Railway Logs**

1. Click on `api-staging` → **"Deployments"** tab
2. Click on latest deployment
3. View logs - you should see:

```
✅ Server ready at http://0.0.0.0:3000
📍 Health: http://0.0.0.0:3000/health
🚀 GraphQL: http://0.0.0.0:3000/graphql
```

---

### **Step 4.4: Compare Services**

Your Railway dashboard should now show:

```
┌────────────────────────────────────────────────┐
│  📦 api (Production)                           │
│  Status: 🟢 Active                             │
│  URL: kealee-platform-v10-production.up...    │
│  Environment: production                       │
│  Sleep: Disabled                               │
└────────────────────────────────────────────────┘

┌────────────────────────────────────────────────┐
│  📦 api-staging (Staging)                      │
│  Status: 🟢 Active                             │
│  URL: api-staging-production-abcd1234.up...   │
│  Environment: staging                          │
│  Sleep: Enabled (saves resources)              │
└────────────────────────────────────────────────┘
```

---

<a name="part-5-connect-vercel"></a>
## 🔗 **PART 5: CONNECT TO VERCEL**

### **Step 5.1: Update Vercel Environment Variables**

For **EACH** of your 6 Vercel apps, do this:

1. Go to Vercel Dashboard: https://vercel.com/dashboard
2. Click on the app (e.g., `kealee-platform-v10-os-admin`)
3. Click **"Settings"** → **"Environment Variables"**
4. Find `NEXT_PUBLIC_API_URL`

---

### **Step 5.2: Configure API URL Per Environment**

Click **"Edit"** on `NEXT_PUBLIC_API_URL`:

**Set different values for each environment:**

```env
Environment: Production
Value: https://kealee-platform-v10-production.up.railway.app
[✓] Production

Environment: Preview
Value: https://api-staging-production-abcd1234.up.railway.app
[✓] Preview

Environment: Development
Value: http://localhost:3000
[✓] Development
```

Click **"Save"**

---

### **Step 5.3: Repeat for All 6 Apps**

Update `NEXT_PUBLIC_API_URL` for:

- [  ] kealee-platform-v10-os-admin
- [  ] kealee-platform-v10-os-pm
- [  ] kealee-platform-v10-m-architect
- [  ] kealee-platform-v10-m-permits-inspections
- [  ] kealee-platform-v10-m-project-owner
- [  ] kealee-platform-v10-m-ops-services

---

### **Step 5.4: Redeploy Vercel Apps**

After changing environment variables:

1. Go to each app's **"Deployments"** tab
2. Find latest deployment
3. Click **"..."** → **"Redeploy"**
4. This picks up the new environment variables

---

### **Step 5.5: Test the Full Flow**

**Production Flow:**
```bash
1. Visit: https://kealee-admin.vercel.app (once deployed)
2. Open DevTools (F12) → Network tab
3. Make an API call (e.g., login)
4. Verify it calls: kealee-platform-v10-production.up.railway.app
```

**Preview/Staging Flow:**
```bash
1. Visit: https://kealee-admin-git-preview-xxx.vercel.app
2. Open DevTools (F12) → Network tab
3. Make an API call
4. Verify it calls: api-staging-production-abcd1234.up.railway.app
```

---

## ✅ **VERIFICATION CHECKLIST**

### **Railway Setup:**

- [  ] Production API deployed and responding
- [  ] Staging API deployed and responding
- [  ] Both have different URLs
- [  ] Staging uses test API keys (Stripe sk_test_...)
- [  ] Staging has debug logging enabled
- [  ] Sleep mode enabled for staging
- [  ] Both can connect to database

---

### **Vercel Integration:**

- [  ] All 6 apps have `NEXT_PUBLIC_API_URL` configured
- [  ] Production environment uses production API
- [  ] Preview environment uses staging API
- [  ] Development environment uses localhost
- [  ] Apps redeployed after variable changes

---

### **Testing:**

- [  ] Production API health check passes
- [  ] Staging API health check passes
- [  ] Vercel production apps call production API
- [  ] Vercel preview apps call staging API
- [  ] No CORS errors in browser console

---

<a name="troubleshooting"></a>
## 🔧 **TROUBLESHOOTING**

### **Issue 1: Staging build fails**

**Symptoms:**
```
Error: Build failed
exit code: 1
```

**Solutions:**

1. **Check Railway logs:**
   - Click "Deployments" → Latest deployment → View logs
   - Look for error message

2. **Common fixes:**
   ```bash
   # Missing DATABASE_URL
   → Add DATABASE_URL variable

   # Missing Dockerfile
   → Verify Dockerfile exists at project root

   # Wrong root directory
   → Settings → Root Directory → Leave empty
   ```

---

### **Issue 2: API responds with 500 errors**

**Symptoms:**
```bash
curl https://api-staging-production-xxx.up.railway.app/health
# Returns: 500 Internal Server Error
```

**Solutions:**

1. **Check logs:**
   ```
   Railway → api-staging → Deployments → View Logs
   Look for: "Error connecting to database"
   ```

2. **Verify DATABASE_URL:**
   - Go to Variables tab
   - Check DATABASE_URL is set correctly
   - Test connection string format:
     ```
     postgresql://postgres:PASSWORD@HOST:6543/postgres
     ```

---

### **Issue 3: CORS errors from Vercel**

**Symptoms:**
```
Console Error:
Access to fetch at 'https://api-staging...' has been blocked by CORS policy
```

**Solutions:**

1. **Add CORS_ORIGINS variable to Railway:**
   ```env
   CORS_ORIGINS=https://*.vercel.app,http://localhost:3000
   ```

2. **Redeploy API after adding variable**

---

### **Issue 4: Staging API not waking up from sleep**

**Symptoms:**
- First request takes forever
- Timeout after 30 seconds

**Solutions:**

1. **Wait longer** - first request after sleep takes ~10-15 seconds
2. **Disable sleep mode** if needed:
   - Settings → Sleep Mode → Disable

---

### **Issue 5: Wrong API called from Vercel**

**Symptoms:**
- Preview deployment calls production API
- Or vice versa

**Solutions:**

1. **Check Vercel environment variables:**
   ```
   Vercel → App → Settings → Environment Variables
   → NEXT_PUBLIC_API_URL
   → Verify each environment is set correctly
   ```

2. **Redeploy after fixing**

---

### **Issue 6: Can't find staging URL**

**Solution:**

```bash
# In Railway Dashboard:
1. Click api-staging service
2. Settings → Networking
3. Public Networking → Your URL is shown here
4. Copy the entire URL (https://api-staging-production-xxx.up.railway.app)
```

---

## 📊 **FINAL ARCHITECTURE**

After completing this guide, you'll have:

```
┌─────────────────────────────────────────────────────────┐
│                    YOUR INFRASTRUCTURE                  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  🚂 RAILWAY (Backend)                                   │
│  ├── api (Production)                                   │
│  │   └── URL: kealee-platform-v10-production.up...    │
│  │   └── Always on, live API keys                      │
│  │                                                      │
│  └── api-staging (Staging)                              │
│      └── URL: api-staging-production-xxx.up...        │
│      └── Sleep mode, test API keys                     │
│                                                         │
│  ☁️ VERCEL (Frontend - 6 Apps)                          │
│  ├── Production                                         │
│  │   └── Calls: Production API                         │
│  │                                                      │
│  └── Preview                                            │
│      └── Calls: Staging API                            │
│                                                         │
│  🗄️ SUPABASE (Database)                                 │
│  └── One database (or separate for staging)            │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🎓 **BEST PRACTICES**

### **DO:**

✅ Use test API keys in staging (Stripe sk_test_...)  
✅ Enable sleep mode for staging to save costs  
✅ Use debug logging in staging  
✅ Test in staging before deploying to production  
✅ Keep production and staging isolated  

### **DON'T:**

❌ Use production API keys in staging  
❌ Test destructive operations in production  
❌ Skip testing in staging before production deploys  
❌ Share staging URLs with customers  
❌ Use same database for both (risk of data loss)  

---

## 📚 **NEXT STEPS**

After completing this guide:

1. **Test staging thoroughly:**
   - Run all API endpoints
   - Test with Vercel preview deployments
   - Verify test Stripe payments work

2. **Set up CI/CD:**
   - Configure GitHub Actions
   - Auto-deploy to staging on preview branch
   - Auto-deploy to production on main branch

3. **Monitor both environments:**
   - Set up error tracking (Sentry)
   - Configure log aggregation
   - Set up health check monitors

4. **Document your URLs:**
   - Update DEPLOYMENT_URLS.md
   - Share with team
   - Keep environment variables secure

---

## 🎯 **QUICK REFERENCE COMMANDS**

```bash
# Test Production API
curl https://kealee-platform-v10-production.up.railway.app/health

# Test Staging API
curl https://api-staging-production-xxx.up.railway.app/health

# View Railway logs (requires CLI)
railway logs --service api-staging

# Deploy to staging (push to preview branch)
git push origin preview-deploy

# Deploy to production (push to main)
git push origin main
```

---

## 🆘 **GET HELP**

**Railway Dashboard:** https://railway.app/dashboard  
**Vercel Dashboard:** https://vercel.com/dashboard  
**Railway Docs:** https://docs.railway.app  
**Vercel Docs:** https://vercel.com/docs

---

**🎉 CONGRATULATIONS!**

You now have a complete production + staging setup on Railway!

**Production:** For live users  
**Staging:** For safe testing

**Both environments are isolated and ready to use.** 🚀

---

**Last Updated:** January 18, 2026  
**Guide Version:** 1.0  
**Estimated Time:** 30-45 minutes
