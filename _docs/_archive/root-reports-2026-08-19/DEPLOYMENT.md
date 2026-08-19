# 🚀 Deployment Guide - Kealee Platform v10

**Last Updated:** January 18, 2026

---

## 📚 **COMPLETE GUIDES AVAILABLE:**

For detailed step-by-step setup, see:
- **[RAILWAY_WALKTHROUGH_PRODUCTION_AND_STAGING.md](./RAILWAY_WALKTHROUGH_PRODUCTION_AND_STAGING.md)** - Complete 30-45 min walkthrough ⭐
- **[RAILWAY_COMPLETE_SETUP_GUIDE.md](./RAILWAY_COMPLETE_SETUP_GUIDE.md)** - URLs & environment variables reference
- **[RAILWAY_STAGING_SETUP.md](./RAILWAY_STAGING_SETUP.md)** - Staging environment setup details

This file is a **quick reference only**.

---

## 🏗️ Railway Setup - Quick Reference

### Current Architecture:

```
┌─────────────────────────────────────┐
│  📦 api (Production)                │
│  Branch: main                       │
│  URL: kealee-platform-v10-prod...  │
│  Always on                          │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  📦 api-staging (Staging)           │
│  Branch: main                       │
│  URL: api-staging-production-xxx... │
│  Sleep mode enabled                 │
└─────────────────────────────────────┘
```

---

### 1. Create Two Services

**Production Service (Existing):**
- Name: `api`
- Branch: `main`
- Builder: Docker (auto-detected)
- Environment: `NODE_ENV=production`
- Sleep Mode: Disabled (always on)

**Staging Service (New):**
- Name: `api-staging`
- Branch: `main`
- Builder: Docker (auto-detected)
- Environment: `NODE_ENV=staging`
- Sleep Mode: Enabled (saves resources)

---

### 2. Configure Services

**✅ Using Docker (Current Setup):**

Both services use the `Dockerfile` at project root:
- **Build Command:** (empty - uses Dockerfile)
- **Start Command:** (empty - uses Dockerfile CMD)
- **Root Directory:** (empty - uses project root)
- **Health Check:** `/health`

**Railway auto-detects and uses your Dockerfile!**

---

### 3. Quick Setup Steps

**For Staging (if not created yet):**

```bash
1. Railway Dashboard → Your Project → "+ New" → "Empty Service"
2. Name: api-staging
3. Connect repo: UseniSajor/kealee-platform-v10
4. Branch: main
5. Root Directory: (empty)
6. Variables: Copy from production, change NODE_ENV=staging
7. Settings → Networking → Generate Domain
8. Settings → Sleep Mode → Enable
```

**See full walkthrough:** [RAILWAY_WALKTHROUGH_PRODUCTION_AND_STAGING.md](./RAILWAY_WALKTHROUGH_PRODUCTION_AND_STAGING.md)

### 4. Environment Variables

**Production (`api` service):**
```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://postgres:password@host:6543/postgres
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
CORS_ORIGINS=https://*.vercel.app,http://localhost:3000
STRIPE_SECRET_KEY=sk_live_...  # Production key
LOG_LEVEL=info
```

**Staging (`api-staging` service):**
```env
NODE_ENV=staging
PORT=3000
DATABASE_URL=postgresql://postgres:password@host:6543/postgres
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
CORS_ORIGINS=https://*.vercel.app,http://localhost:3000
STRIPE_SECRET_KEY=sk_test_...  # ⚠️ Test key for staging!
LOG_LEVEL=debug  # Verbose logging
ENABLE_DEBUG_MODE=true
```

**See full templates:** [RAILWAY_COMPLETE_SETUP_GUIDE.md](./RAILWAY_COMPLETE_SETUP_GUIDE.md)

---

## 🔄 Deployment Workflow

### Current Flow:

**Method 1: Using Branches**
```
1. Push to `preview-deploy` branch (or any branch)
   ↓
2. Railway staging auto-deploys
   ↓
3. Vercel preview deployments use staging API
   ↓
4. Test in preview environment
   ↓
5. Merge to `main` branch
   ↓
6. Railway production auto-deploys
   ↓
7. Vercel production deployments use production API
```

**Method 2: Manual Redeploy**
```
1. Railway Dashboard → api-staging → Deployments
2. Click latest deployment → "..." → "Redeploy"
3. Test staging thoroughly
4. Railway Dashboard → api → Deployments
5. Click "..." → "Redeploy" to update production
```

**Environment Isolation:**
- Production uses `NODE_ENV=production` + live API keys
- Staging uses `NODE_ENV=staging` + test API keys
- Both run simultaneously, completely isolated

---

## ⚡ Build Optimization

### Using Docker (Current Setup):

Your `Dockerfile` already includes optimizations:
- ✅ Multi-stage build (smaller image)
- ✅ Dependency caching (faster rebuilds)
- ✅ Skips Puppeteer chrome download
- ✅ pnpm workspace support
- ✅ Prisma generation

**No manual build commands needed!** Railway uses your Dockerfile automatically.

**Build times:**
- First build: ~3-5 minutes
- Subsequent builds: ~2-3 minutes (with cache)

**To further optimize:**
1. Railway caches Docker layers automatically
2. Only rebuild when source code changes
3. Dependencies are cached between builds

---

## 🐛 Troubleshooting

### Build Fails
**Symptoms:** Red X on deployment
**Solutions:**
1. Check Railway logs: Click deployment → View logs
2. Verify Dockerfile exists at project root
3. Check environment variables are set
4. Test Docker build locally: `docker build -t test .`

### API Returns 500 Errors
**Symptoms:** Health check fails or 500 responses
**Solutions:**
1. Check Railway logs for errors
2. Verify `DATABASE_URL` is set correctly
3. Test connection: `curl https://your-api.railway.app/health`
4. Check Supabase variables are correct

### CORS Errors from Vercel
**Symptoms:** Browser console shows CORS blocked
**Solutions:**
1. Add to Railway variables: `CORS_ORIGINS=https://*.vercel.app`
2. Redeploy API after adding variable
3. Verify Vercel uses correct API URL

### Staging API Not Responding
**Symptoms:** Timeout on first request
**Solutions:**
1. Sleep mode enabled - first request takes ~10-15 seconds
2. Check Railway logs to see if it's waking up
3. Disable sleep mode if needed (costs more)

**See detailed troubleshooting:** [RAILWAY_WALKTHROUGH_PRODUCTION_AND_STAGING.md](./RAILWAY_WALKTHROUGH_PRODUCTION_AND_STAGING.md#troubleshooting)

---

## 📊 Monitoring

### Health Checks:

**Production API:**
```bash
curl https://kealee-platform-v10-production.up.railway.app/health
# Expected: {"status":"ok","timestamp":1737241234567}
```

**Staging API:**
```bash
curl https://api-staging-production-xxxx.up.railway.app/health
# Expected: {"status":"ok","timestamp":1737241234567}
# Note: First request after sleep may take ~10-15 seconds
```

### View Logs (Railway Dashboard):
```
1. Railway Dashboard → Your Project
2. Click service (api or api-staging)
3. Click "Deployments" tab
4. Click latest deployment
5. View logs in real-time
```

### Railway CLI (Optional):
```bash
# Install CLI
npm i -g @railway/cli

# Login
railway login

# View logs
railway logs --service api
railway logs --service api-staging
```

---

## 🔐 Security Best Practices

1. **Never commit secrets** - Use Railway environment variables only
2. **Use test keys in staging:**
   - Stripe: `sk_test_...` not `sk_live_...`
   - Other APIs: Use sandbox/test keys
3. **Isolate environments:**
   - Production and staging are completely separate
   - Different API URLs
   - Different environment variables
4. **Enable sleep mode for staging** - Saves resources
5. **Monitor both environments** - Set up alerts
6. **Use branch protection on `main`** - Require reviews before merging

---

## 🔗 Integration with Vercel

### Connect Vercel Apps to Railway APIs:

**For each Vercel app, set:**

```env
Environment: Production
NEXT_PUBLIC_API_URL=https://kealee-platform-v10-production.up.railway.app

Environment: Preview
NEXT_PUBLIC_API_URL=https://api-staging-production-xxxx.up.railway.app

Environment: Development
NEXT_PUBLIC_API_URL=http://localhost:3000
```

**See Vercel setup guides:**
- [VERCEL_ALL_APPS_DEPLOYMENT.md](./VERCEL_ALL_APPS_DEPLOYMENT.md)
- [VERCEL_PREVIEW_DEPLOYMENT_GUIDE.md](./VERCEL_PREVIEW_DEPLOYMENT_GUIDE.md)

---

## 🎯 Quick Reference

| Service | URL | Status | Purpose |
|---------|-----|--------|---------|
| **Production** | `https://kealee-platform-v10-production.up.railway.app` | ✅ Live | Live users |
| **Staging** | `https://api-staging-production-xxxx.up.railway.app` | ✅ Live | Testing |

| Action | How To |
|--------|--------|
| Test production API | `curl https://kealee-platform-v10-production.up.railway.app/health` |
| Test staging API | `curl https://api-staging-production-xxxx.up.railway.app/health` |
| View logs | Railway Dashboard → Service → Deployments → View Logs |
| Redeploy | Railway Dashboard → Service → Deployments → "..." → Redeploy |
| Generate new URL | Settings → Networking → Generate Domain |
| Toggle sleep mode | Settings → Sleep Mode → Enable/Disable |

---

## ✅ Deployment Checklist

**Before Creating Staging:**
- [ ] Production API is working
- [ ] Have production environment variables copied
- [ ] Know your Supabase credentials
- [ ] Have test Stripe API keys ready

**After Creating Staging:**
- [ ] Staging API health check passes
- [ ] Different URL from production
- [ ] Using test API keys (not production keys!)
- [ ] Sleep mode enabled (optional)
- [ ] Vercel preview apps updated with staging URL
- [ ] Tested full flow: Vercel preview → Staging API → Database

**See complete setup guide:** [RAILWAY_WALKTHROUGH_PRODUCTION_AND_STAGING.md](./RAILWAY_WALKTHROUGH_PRODUCTION_AND_STAGING.md)

---

## 📚 Related Documentation

- **[RAILWAY_WALKTHROUGH_PRODUCTION_AND_STAGING.md](./RAILWAY_WALKTHROUGH_PRODUCTION_AND_STAGING.md)** - Complete setup guide (30-45 min) ⭐
- **[RAILWAY_COMPLETE_SETUP_GUIDE.md](./RAILWAY_COMPLETE_SETUP_GUIDE.md)** - URLs & environment variables
- **[RAILWAY_STAGING_SETUP.md](./RAILWAY_STAGING_SETUP.md)** - Staging environment details
- **[VERCEL_ALL_APPS_DEPLOYMENT.md](./VERCEL_ALL_APPS_DEPLOYMENT.md)** - Frontend deployment
- **[DEPLOYMENT_URLS.md](./DEPLOYMENT_URLS.md)** - All deployment URLs

---

**Need Help?**
- Railway docs: https://docs.railway.app
- Railway Dashboard: https://railway.app/dashboard
- Vercel Dashboard: https://vercel.com/dashboard
