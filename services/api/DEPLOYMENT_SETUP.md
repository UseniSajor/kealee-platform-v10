# API Service Deployment Setup Guide

## Environment Variable Configuration

The API service requires proper environment configuration to start. The service now supports **flexible environment detection** with multiple fallback options.

---

## 🎯 **Environment Detection Priority**

The service detects the environment using this priority order:

1. **`APP_ENV`** (Highest Priority)
   - Explicit environment override
   - Values: `development`, `staging`, `production`, `preview`
   - Recommended for explicit control

2. **`NODE_ENV`** (Standard Node.js)
   - Standard Node.js environment variable
   - Values: `development`, `staging`, `production`
   - Most commonly used

3. **Railway Service Name Detection**
   - Automatically detects if service name contains "staging"
   - E.g., `kealee-api-staging` → staging environment

4. **`RAILWAY_ENVIRONMENT_NAME`** (Lowest Priority)
   - Automatically set by Railway
   - Used as final fallback

---

## 🚀 **Railway Deployment Setup**

### Option 1: Using NODE_ENV (Recommended)

**Why:** Standard across all Node.js applications

**Steps:**
1. Go to Railway Dashboard
2. Select your service (e.g., `kealee-api`)
3. Click **Variables** tab
4. Add new variable:
   - **Name:** `NODE_ENV`
   - **Value:** `staging` (or `production`)
5. Click **Deploy** or wait for auto-deploy

### Option 2: Using APP_ENV (Explicit Control)

**Why:** Explicit environment control, overrides everything

**Steps:**
1. Go to Railway Dashboard
2. Select your service
3. Click **Variables** tab
4. Add new variable:
   - **Name:** `APP_ENV`
   - **Value:** `staging` (or `production`)
5. Click **Deploy** or wait for auto-deploy

### Option 3: Using Service Name (Automatic)

**Why:** No manual configuration needed

**Steps:**
1. Name your Railway service with environment suffix:
   - Production: `kealee-api` or `kealee-api-production`
   - Staging: `kealee-api-staging`
2. No additional variables needed!
3. Service automatically detects environment from name

---

## 📦 **Vercel Deployment Setup**

**For Frontend Apps Only** (Not for API service)

Vercel automatically sets `NODE_ENV`:
- Preview deployments: `NODE_ENV=development`
- Production deployments: `NODE_ENV=production`

If you need to override:
1. Go to Vercel Dashboard
2. Select your project
3. Settings → Environment Variables
4. Add:
   - **Name:** `NODE_ENV`
   - **Value:** `staging` or `production`
   - **Environment:** Select which deployments (Production/Preview/Development)

---

## ✅ **Required Environment Variables**

### All Environments

```bash
# Environment (ONE of these is required)
NODE_ENV=staging                    # Recommended
# OR
APP_ENV=staging                     # Alternative

# Database
DATABASE_URL=postgresql://...       # Must match environment
```

### Staging Environment

```bash
NODE_ENV=staging
DATABASE_URL=postgresql://...staging-postgres.internal:5432/...
STRIPE_SECRET_KEY=sk_test_...      # Test keys only
DOCUSIGN_BASE_PATH=https://demo.docusign.net/restapi
```

### Production Environment

```bash
NODE_ENV=production
DATABASE_URL=postgresql://...production-postgres.internal:5432/...
STRIPE_SECRET_KEY=sk_live_...      # Live keys
DOCUSIGN_BASE_PATH=https://www.docusign.net/restapi
SUPABASE_URL=https://...supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
```

---

## 🔒 **Environment Safety Guards**

The API has **automatic safety guards** to prevent:

### ❌ **Prevented Scenarios:**
1. **Staging → Production DB**
   - Staging environment cannot connect to production database
   - Prevents accidental data corruption

2. **Production → Staging DB**
   - Production environment cannot connect to staging database
   - Prevents using test data in production

3. **Missing Environment**
   - Service won't start if no environment is detected
   - Shows helpful error message with current variable values

### ✅ **Safety Features:**
- Automatic database URL validation
- Environment/database mismatch detection
- Clear error messages with fix instructions
- Multiple fallback detection methods

---

## 🛠️ **Troubleshooting**

### Error: "Environment not configured"

**Symptoms:**
```
❌ FATAL ERROR: Environment not configured
No environment variable found to determine the application environment.
```

**Current Values Shown:**
```
APP_ENV:                    (not set)
NODE_ENV:                   (not set)
RAILWAY_ENVIRONMENT_NAME:   (not set)
RAILWAY_SERVICE_NAME:       kealee-api
```

**Solutions:**

1. **Set NODE_ENV** (Easiest)
   ```bash
   # Railway Dashboard → Variables
   NODE_ENV=staging
   ```

2. **Set APP_ENV** (Alternative)
   ```bash
   # Railway Dashboard → Variables
   APP_ENV=staging
   ```

3. **Rename Service** (Automatic)
   ```
   Railway Dashboard → Service Settings → Name
   Change to: kealee-api-staging
   ```

4. **Check Railway Environment**
   - Railway should auto-set `RAILWAY_ENVIRONMENT_NAME`
   - If not set, manually add `NODE_ENV`

---

### Error: "Environment/Database Mismatch"

**Symptoms:**
```
❌ FATAL ERROR: Environment/Database Mismatch
Staging environment is attempting to connect to production database!
```

**Solution:**
1. Verify `NODE_ENV` or `APP_ENV` matches your database
2. Check `DATABASE_URL`:
   - Staging should use: `staging-postgres.internal`
   - Production should use: `production-postgres.internal`
3. Ensure separate Railway services for staging/production
4. Never share databases between environments

---

### Successful Startup

**What You Should See:**
```
✅ Environment detected: staging
✅ Startup guards passed:
   Environment: staging
   DATABASE_URL: postgresql://****@staging-postgres.internal:5432/****

============================================================
🔶 Environment Configuration 🔶
============================================================
Environment:        STAGING
APP_ENV:            (not set)
NODE_ENV:           staging
Railway Env:        staging
Railway Service:    kealee-api-staging
Is Production:      false
Is Staging:         true
Is Preview:         false
Is Development:     false
============================================================

============================================================
🔶 API Server Started Successfully 🔶
============================================================
Environment:  STAGING
Port:         3000
Host:         0.0.0.0
Health:       /health
Docs:         /docs
============================================================
```

---

## 📋 **Railway Setup Checklist**

### Staging Service

- [ ] Service name: `kealee-api-staging` (recommended)
- [ ] Variable: `NODE_ENV=staging` or `APP_ENV=staging`
- [ ] Variable: `DATABASE_URL` pointing to `staging-postgres.internal`
- [ ] Variable: `STRIPE_SECRET_KEY=sk_test_...` (test key)
- [ ] Variable: `DOCUSIGN_BASE_PATH=https://demo.docusign.net/restapi`
- [ ] Deploy and verify startup logs

### Production Service

- [ ] Service name: `kealee-api` or `kealee-api-production`
- [ ] Variable: `NODE_ENV=production` or `APP_ENV=production`
- [ ] Variable: `DATABASE_URL` pointing to `production-postgres.internal`
- [ ] Variable: `STRIPE_SECRET_KEY=sk_live_...` (live key)
- [ ] Variable: `DOCUSIGN_BASE_PATH=https://www.docusign.net/restapi`
- [ ] Variable: `SUPABASE_URL`
- [ ] Variable: `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Variable: All production API keys configured
- [ ] Deploy and verify startup logs

---

## 🔍 **Verifying Configuration**

### Check Environment Detection

After deployment, check Railway logs for:

```
✅ Environment detected: staging
```

### Check Health Endpoint

```bash
curl https://your-service.railway.app/health

# Response:
{
  "status": "ok",
  "environment": "staging",
  "timestamp": "2024-01-23T12:00:00.000Z"
}
```

### Check Database Connection

```bash
curl https://your-service.railway.app/health/db

# Response:
{
  "status": "ok",
  "db": "ok"
}
```

---

## 📞 **Support**

If you continue to have issues:

1. Check Railway deployment logs for the exact error
2. Verify all environment variables are set
3. Ensure database is running and accessible
4. Check that service can connect to database (network/VPN)
5. Review startup guard error messages for specific guidance

---

## 🎉 **Quick Start**

**Fastest way to fix the error:**

```bash
# In Railway Dashboard for your API service:
# Go to Variables tab and add:

NODE_ENV=staging

# Then redeploy or wait for auto-deploy
# ✅ Done!
```

That's it! The service will automatically detect the environment and start successfully.
