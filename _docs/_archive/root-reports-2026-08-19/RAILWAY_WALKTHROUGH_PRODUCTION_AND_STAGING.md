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
# ===== CORE CONFIGURATION =====
NODE_ENV=production
PORT=3000

# ===== DATABASE (Supabase Postgres - Connection Pooler) =====
# Get from: Supabase Dashboard → Settings → Database → Connection String → Transaction mode
DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres

# Optional: Direct connection for migrations
DIRECT_URL=postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres

# ===== SUPABASE AUTHENTICATION =====
SUPABASE_URL=https://[PROJECT-REF].supabase.co
SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# ===== CORS (Production domains) =====
CORS_ORIGINS=https://admin.kealee.com,https://pm.kealee.com,https://permits.kealee.com,https://owner.kealee.com,https://architect.kealee.com,https://services.kealee.com

# ===== STRIPE (LIVE KEYS FOR PRODUCTION!) =====
STRIPE_SECRET_KEY=sk_live_51...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# ===== SENDGRID EMAIL =====
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxx...
SENDGRID_FROM_EMAIL=noreply@kealee.com
SENDGRID_FROM_NAME=Kealee Platform

# ===== ANTHROPIC CLAUDE AI =====
ANTHROPIC_API_KEY=sk-ant-api03-...

# ===== PRODUCTION SETTINGS =====
LOG_LEVEL=info
ENABLE_DEBUG_MODE=false
RAILWAY_ENVIRONMENT=production
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

### **Step 3.2: Add Staging Variables**

Add these one by one (or use "Raw Editor" to paste all at once):

```env
# ===== CORE CONFIGURATION =====
NODE_ENV=staging
PORT=3000

# ===== DATABASE (Supabase Postgres - Connection Pooler) =====
# Get from: Supabase Dashboard → Settings → Database → Connection String → Transaction mode
DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres

SUPABASE_UR# Optional: Direct connection for migrations (non-pooled)
DIRECT_URL=postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres

# ===== SUPABASE AUTHENTICATION =====
# Get from: Supabase Dashboard → Settings → API
SUPABASE_URL=https://[PROJECT-REF].supabase.co
SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# ===== CORS (Allow Vercel preview domains) =====
CORS_ORIGINS=https://*.vercel.app,http://localhost:3000,http://localhost:3001

# ===== STRIPE (TEST KEYS FOR STAGING!) =====
# Get from: Stripe Dashboard → Developers → API keys → Test mode
STRIPE_SECRET_KEY=sk_test_51...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# ===== SENDGRID EMAIL (Same key for staging/production) =====
# Get from: SendGrid Dashboard → Settings → API Keys
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxx...
SENDGRID_FROM_EMAIL=noreply@kealee.com
SENDGRID_FROM_NAME=Kealee Platform (Staging)

# ===== ANTHROPIC CLAUDE AI =====
# Get from: Anthropic Console → API Keys
ANTHROPIC_API_KEY=sk-ant-api03-...

# ===== TWILIO (Optional - for SMS) =====
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...

# ===== DEBUGGING (Staging only) =====
LOG_LEVEL=debug
ENABLE_DEBUG_MODE=true
ALLOW_TEST_USERS=true
RAILWAY_ENVIRONMENT=staging
```

---

### **Step 3.3: IMPORTANT - Environment Variables Comparison**

Here's what should be **DIFFERENT** vs **SAME** between environments:

| Service | Production | Staging | Notes |
|---------|-----------|---------|-------|
| **Stripe Secret** | `sk_live_...` | `sk_test_...` ⭐ | DIFFERENT - prevent real charges |
| **Stripe Publishable** | `pk_live_...` | `pk_test_...` ⭐ | DIFFERENT |
| **Stripe Webhook** | `whsec_...` (live) | `whsec_...` (test) ⭐ | DIFFERENT |
| **SendGrid API Key** | `SG.xxx...` | `SG.xxx...` ✅ | SAME - ok for staging |
| **SendGrid From Name** | `Kealee Platform` | `Kealee Platform (Staging)` | DIFFERENT - clarity |
| **Postgres (DATABASE_URL)** | Port 6543 | Port 6543 ✅ | SAME connection pooler |
| **Postgres (DIRECT_URL)** | Port 5432 | Port 5432 ✅ | SAME direct connection |
| **Database** | Production DB | Production DB ✅ | SAME or separate database |
| **Supabase URL** | `https://[ref].supabase.co` | `https://[ref].supabase.co` ✅ | SAME |
| **Supabase Keys** | Same keys | Same keys ✅ | SAME |
| **Anthropic API** | `sk-ant-...` | `sk-ant-...` ✅ | SAME |
| **NODE_ENV** | `production` | `staging` | DIFFERENT |
| **Logging** | `info` | `debug` ⭐ | DIFFERENT - verbose staging logs |
| **Debug Mode** | `false` | `true` ⭐ | DIFFERENT |

**Key Points:**

✅ **SAME for both:** SendGrid, Postgres connection (same DB or separate), Supabase, AI APIs  
⭐ **DIFFERENT:** Stripe keys (TEST vs LIVE), logging level, debug mode  

**Why different Stripe keys?** So you don't accidentally charge real customers when testing!  
**Why same SendGrid?** Email sending is safe to share, just different sender name  
**Why same Postgres?** Can use same database with different data, or separate staging DB

---

### **Step 3.4: Understanding Postgres Configuration**

Both Production and Staging use the **same Postgres ports**:

#### **DATABASE_URL - Port 6543 (Connection Pooler)**

```env
# Production API
DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres

# Staging API  
DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

**Why Port 6543?**
- ✅ This is Supabase's **connection pooler** (PgBouncer)
- ✅ Recommended for API runtime connections
- ✅ Prevents "too many connections" errors
- ✅ Better performance for serverless/Railway environments

#### **DIRECT_URL - Port 5432 (Direct Connection)**

```env
# Production API (for Prisma migrations)
DIRECT_URL=postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres

# Staging API (for Prisma migrations)
DIRECT_URL=postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
```

**Why Port 5432?**
- ✅ This is the **direct Postgres connection**
- ✅ Required for Prisma migrations
- ✅ Bypasses connection pooler
- ⚠️ Don't use for regular API queries

#### **How to Get Your Connection Strings:**

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your project**
3. **Settings** → **Database**
4. **Connection string** section
5. **Select "Transaction mode"** for DATABASE_URL (port 6543)
6. **Select "Session mode"** for DIRECT_URL (port 5432)
7. **Replace `[YOUR-PASSWORD]` with your actual database password**

#### **Database Strategy Options:**

**Option 1: Shared Database (Recommended for starting)**
```
Production API → Same Postgres DB
Staging API    → Same Postgres DB
```
- ✅ Simpler setup
- ✅ Save on database costs
- ⚠️ Be careful with staging data

**Option 2: Separate Databases (Recommended for production)**
```
Production API → Production Postgres DB
Staging API    → Staging Postgres DB (separate Supabase project)
```
- ✅ Complete isolation
- ✅ Safe testing without affecting production
- ✅ Can use test data freely
- ⚠️ Costs more (need 2 Supabase projects)

---

### **Step 3.5: Understanding SendGrid Configuration**

Both Production and Staging use the **same SendGrid API key**:

```env
# Production API
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxx...
SENDGRID_FROM_EMAIL=noreply@kealee.com
SENDGRID_FROM_NAME=Kealee Platform

# Staging API
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxx...
SENDGRID_FROM_EMAIL=noreply@kealee.com
SENDGRID_FROM_NAME=Kealee Platform (Staging)
```

**Why Same API Key?**
- ✅ Email sending is safe to share between environments
- ✅ SendGrid tracks usage, not environments
- ✅ Simpler credential management
- ✅ Same sender verification

**What's Different?**
- ⭐ `SENDGRID_FROM_NAME` includes "(Staging)" to identify test emails

**How to Get Your SendGrid API Key:**

1. **Go to SendGrid Dashboard**: https://app.sendgrid.com
2. **Settings** → **API Keys**
3. **Click "Create API Key"**
4. **Name:** `Kealee Platform API`
5. **Permissions:** Full Access (or Mail Send only)
6. **Click "Create & View"**
7. **Copy the key** - it starts with `SG.`
8. ⚠️ **Save it immediately** - you can't view it again!

**SendGrid Sender Configuration:**

Before sending emails, verify your sender identity:

1. **SendGrid Dashboard** → **Settings** → **Sender Authentication**
2. **Option A: Single Sender Verification**
   - Add: `noreply@kealee.com`
   - Verify via email
   
3. **Option B: Domain Authentication (Recommended)**
   - Authenticate entire `kealee.com` domain
   - Add DNS records to NameBright
   - Better deliverability

---

### **Step 3.6: Deploy Staging**

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
   - Verify connection string format (port 6543 for pooled connections):
     ```
     postgresql://postgres.[PROJECT-REF]:PASSWORD@aws-0-[REGION].pooler.supabase.com:6543/postgres
     ```
   - Replace `[YOUR-PASSWORD]` placeholder with actual password

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

### **Issue 6: Database Connection Fails - "too many connections"**

**Symptoms:**
```
Error: remaining connection slots are reserved
FATAL: remaining connection slots are reserved for non-replication superuser connections
```

**Solutions:**

1. **Use connection pooler (port 6543) instead of direct connection (port 5432):**
   ```env
   # CORRECT - Uses pooler
   DATABASE_URL=postgresql://postgres.[REF]:PASS@aws-0-region.pooler.supabase.com:6543/postgres
   
   # WRONG - Direct connection
   DATABASE_URL=postgresql://postgres.[REF]:PASS@aws-0-region.pooler.supabase.com:5432/postgres
   ```

2. **Verify you're using Transaction mode:**
   - Supabase → Database → Connection String → **Transaction mode**

3. **Check Supabase connection pooler is enabled:**
   - Supabase Dashboard → Database → Connection Pooling → Should be ON

---

### **Issue 7: SendGrid Emails Not Sending**

**Symptoms:**
```
Error: SendGrid API request failed
401 Unauthorized
```

**Solutions:**

1. **Verify SendGrid API Key:**
   - Should start with `SG.`
   - Check for extra spaces or line breaks
   - Verify key has "Mail Send" permissions

2. **Verify sender identity:**
   ```bash
   # SendGrid Dashboard → Settings → Sender Authentication
   # Must verify noreply@kealee.com first
   ```

3. **Check Railway logs for SendGrid errors:**
   ```
   Railway → Deployments → View Logs
   Look for: "SendGrid" or "email" errors
   ```

4. **Test SendGrid API key:**
   ```bash
   curl -X POST https://api.sendgrid.com/v3/mail/send \
     -H "Authorization: Bearer SG.YOUR_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{...}'
   ```

---

### **Issue 8: Can't find staging URL**

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
┌───────────────────────────────────────────────────────────────────┐
│                    YOUR COMPLETE INFRASTRUCTURE                   │
├───────────────────────────────────────────────────────────────────┤
│                                                                   │
│  🚂 RAILWAY (Backend APIs)                                        │
│  ├── api (Production)                                             │
│  │   ├── URL: kealee-platform-v10-production.up.railway.app     │
│  │   ├── Always on, never sleeps                                 │
│  │   ├── Stripe: LIVE keys (sk_live_...)                         │
│  │   ├── Logging: info level                                     │
│  │   └── Port: 3000 (internal)                                   │
│  │                                                                │
│  └── api-staging (Staging)                                        │
│      ├── URL: api-staging-production-xxx.up.railway.app          │
│      ├── Sleep mode enabled (saves costs)                        │
│      ├── Stripe: TEST keys (sk_test_...)                         │
│      ├── Logging: debug level                                    │
│      └── Port: 3000 (internal)                                   │
│                                                                   │
│  ☁️ VERCEL (Frontend - 6 Apps)                                    │
│  ├── Production Deployments                                      │
│  │   ├── admin.kealee.com          → os-admin                    │
│  │   ├── pm.kealee.com             → os-pm                       │
│  │   ├── permits.kealee.com        → m-permits-inspections       │
│  │   ├── owner.kealee.com          → m-project-owner             │
│  │   ├── architect.kealee.com      → m-architect                 │
│  │   ├── services.kealee.com       → m-ops-services              │
│  │   └── Calls: Production Railway API                           │
│  │                                                                │
│  └── Preview Deployments (*.vercel.app)                          │
│      └── Calls: Staging Railway API                              │
│                                                                   │
│  🗄️ SUPABASE (Postgres Database)                                 │
│  ├── Connection Pooler (Port 6543)                               │
│  │   ├── Used by: Production API (runtime queries)               │
│  │   ├── Used by: Staging API (runtime queries)                  │
│  │   └── Protocol: Transaction mode (PgBouncer)                  │
│  │                                                                │
│  └── Direct Connection (Port 5432)                               │
│      ├── Used by: Prisma migrations                              │
│      └── Protocol: Session mode (Direct Postgres)                │
│                                                                   │
│  📧 SENDGRID (Email Service)                                      │
│  ├── API Key: SG.xxx... (SAME for both environments)             │
│  ├── From: noreply@kealee.com                                    │
│  ├── Production: "Kealee Platform"                               │
│  └── Staging: "Kealee Platform (Staging)"                        │
│                                                                   │
│  💳 STRIPE (Payment Processing)                                   │
│  ├── Production: sk_live_... (LIVE MODE)                         │
│  └── Staging: sk_test_... (TEST MODE)                            │
│                                                                   │
│  🤖 ANTHROPIC CLAUDE (AI Service)                                │
│  └── API Key: sk-ant-... (SAME for both environments)            │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘

Data Flow:
──────────
1. User visits: admin.kealee.com (Vercel)
2. Vercel app calls: kealee-platform-v10-production.up.railway.app
3. Railway API queries: Supabase Postgres (port 6543)
4. Railway API sends emails via: SendGrid (noreply@kealee.com)
5. Railway API processes payments via: Stripe (live mode)
```

---

## 📋 **COMPLETE ENVIRONMENT VARIABLES REFERENCE**

### **Production API Environment Variables (Complete List)**

```env
# ===== CORE CONFIGURATION =====
NODE_ENV=production
PORT=3000

# ===== DATABASE (Supabase Postgres) =====
# Transaction mode - Port 6543 (Connection Pooler)
DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres

# Session mode - Port 5432 (Direct - for migrations)
DIRECT_URL=postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres

# ===== SUPABASE AUTHENTICATION =====
SUPABASE_URL=https://[PROJECT-REF].supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ===== CORS (Production domains) =====
CORS_ORIGINS=https://admin.kealee.com,https://pm.kealee.com,https://permits.kealee.com,https://owner.kealee.com,https://architect.kealee.com,https://services.kealee.com

# ===== STRIPE (LIVE KEYS) =====
STRIPE_SECRET_KEY=sk_live_51...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# ===== SENDGRID EMAIL =====
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxx...
SENDGRID_FROM_EMAIL=noreply@kealee.com
SENDGRID_FROM_NAME=Kealee Platform

# ===== ANTHROPIC CLAUDE AI =====
ANTHROPIC_API_KEY=sk-ant-api03-...

# ===== OPTIONAL: TWILIO SMS =====
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...

# ===== PRODUCTION SETTINGS =====
LOG_LEVEL=info
ENABLE_DEBUG_MODE=false
RAILWAY_ENVIRONMENT=production
```

---

### **Staging API Environment Variables (Complete List)**

```env
# ===== CORE CONFIGURATION =====
NODE_ENV=staging
PORT=3000

# ===== DATABASE (Supabase Postgres) =====
# Transaction mode - Port 6543 (Connection Pooler)
DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres

# Session mode - Port 5432 (Direct - for migrations)
DIRECT_URL=postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres

# ===== SUPABASE AUTHENTICATION =====
SUPABASE_URL=https://[PROJECT-REF].supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ===== CORS (Allow Vercel preview domains) =====
CORS_ORIGINS=https://*.vercel.app,http://localhost:3000,http://localhost:3001

# ===== STRIPE (TEST KEYS) =====
STRIPE_SECRET_KEY=sk_test_51...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# ===== SENDGRID EMAIL =====
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxx...
SENDGRID_FROM_EMAIL=noreply@kealee.com
SENDGRID_FROM_NAME=Kealee Platform (Staging)

# ===== ANTHROPIC CLAUDE AI =====
ANTHROPIC_API_KEY=sk-ant-api03-...

# ===== OPTIONAL: TWILIO SMS =====
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...

# ===== STAGING/DEBUG SETTINGS =====
LOG_LEVEL=debug
ENABLE_DEBUG_MODE=true
ALLOW_TEST_USERS=true
RAILWAY_ENVIRONMENT=staging
```

---

### **Key Differences Highlighted**

| Variable | Production | Staging |
|----------|-----------|---------|
| `NODE_ENV` | `production` | `staging` |
| `STRIPE_SECRET_KEY` | `sk_live_...` ⚠️ | `sk_test_...` ⚠️ |
| `STRIPE_PUBLISHABLE_KEY` | `pk_live_...` ⚠️ | `pk_test_...` ⚠️ |
| `SENDGRID_FROM_NAME` | `Kealee Platform` | `Kealee Platform (Staging)` |
| `CORS_ORIGINS` | Custom domains | `*.vercel.app` wildcard |
| `LOG_LEVEL` | `info` | `debug` |
| `ENABLE_DEBUG_MODE` | `false` | `true` |
| `ALLOW_TEST_USERS` | Not set | `true` |

**Everything else is THE SAME!**

---

## 🎓 **BEST PRACTICES**

### **DO:**

✅ Use test API keys in staging (Stripe sk_test_...)  
✅ Enable sleep mode for staging to save costs  
✅ Use debug logging in staging  
✅ Test in staging before deploying to production  
✅ Keep production and staging isolated  
✅ Use same Postgres ports (6543 for runtime, 5432 for migrations)  
✅ Use same SendGrid API key for both environments  
✅ Include "(Staging)" in sender name for test emails  

### **DON'T:**

❌ Use production Stripe keys in staging  
❌ Test destructive operations in production  
❌ Skip testing in staging before production deploys  
❌ Share staging URLs with customers  
❌ Forget to update CORS_ORIGINS when adding new Vercel domains  
❌ Use different Postgres ports between environments  
❌ Mix up DATABASE_URL (port 6543) and DIRECT_URL (port 5432)  

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

### **Test APIs:**

```bash
# Test Production API
curl https://kealee-platform-v10-production.up.railway.app/health

# Test Staging API
curl https://api-staging-production-xxx.up.railway.app/health

# Expected response:
# {"status":"ok","timestamp":1737241234567}
```

### **Test Database Connection:**

```bash
# Test Postgres connection (requires psql)
psql "postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres"

# Test connection pooler (port 6543)
pg_isready -h aws-0-[REGION].pooler.supabase.com -p 6543

# Test direct connection (port 5432)
pg_isready -h aws-0-[REGION].pooler.supabase.com -p 5432
```

### **Railway CLI Commands:**

```bash
# View Railway logs (requires CLI)
railway logs --service api
railway logs --service api-staging

# View environment variables
railway variables --service api
railway variables --service api-staging

# Deploy manually
railway up --service api-staging
```

### **Git Deployment Commands:**

```bash
# Deploy to staging (push to preview branch)
git push origin preview-deploy

# Deploy to production (push to main)
git push origin main

# Check deployment status
git log --oneline -5
```

### **Test SendGrid:**

```bash
# Verify SendGrid API key (replace YOUR_API_KEY)
curl -X GET "https://api.sendgrid.com/v3/user/profile" \
  -H "Authorization: Bearer SG.YOUR_API_KEY"

# Should return your SendGrid account info if key is valid
```

### **DNS/Network Debugging:**

```bash
# Check if Railway API is reachable
ping kealee-platform-v10-production.up.railway.app

# Check DNS resolution
nslookup kealee-platform-v10-production.up.railway.app

# Check SSL certificate
openssl s_client -connect kealee-platform-v10-production.up.railway.app:443 -servername kealee-platform-v10-production.up.railway.app
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

**Last Updated:** January 19, 2026  
**Guide Version:** 2.0  
**Estimated Time:** 30-45 minutes

**What's New in v2.0:**
- ✅ Complete Postgres configuration (ports 6543 & 5432)
- ✅ SendGrid setup and configuration details
- ✅ Complete environment variables reference for both environments
- ✅ Enhanced troubleshooting for database and email issues
- ✅ Expanded quick reference commands
- ✅ Detailed architecture diagram with all services
