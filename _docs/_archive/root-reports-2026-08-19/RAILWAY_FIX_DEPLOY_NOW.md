# Railway Healthcheck Fix - Quick Deploy Checklist

## ✅ What's Been Fixed

Three critical issues resolved:

1. **Healthcheck Timeout** (100ms → 30s)
   - `services/api/railway.json` updated
   - `railway.toml` updated

2. **Missing Environment Variables** 
   - Added APP_ENV to railway.toml
   - Documentation updated for required DATABASE_URL

3. **Blocking Startup Sequence**
   - `services/api/src/index.ts` refactored
   - Server now responds to /health immediately
   - Heavy initialization runs in background

---

## 🚀 Deploy These Changes

### Quick Deploy (2 minutes)

```bash
# 1. Add files to git
git add railway.toml services/api/railway.json services/api/src/index.ts

# 2. Commit
git commit -m "fix: Railway healthcheck failures - optimize startup"

# 3. Push (triggers auto-deploy on Railway)
git push origin main
```

### Or Manual Railway Deploy

```bash
railway login
railway deploy --service api
```

---

## 📋 Pre-Deploy Checklist

**Required:**
- [ ] DATABASE_URL is set in Railway Variables section
- [ ] NODE_ENV = production in Railway Variables
- [ ] APP_ENV = production in Railway Variables (or will use NODE_ENV)

**Optional but recommended:**
- [ ] REDIS_URL (for caching, defaults to localhost:6379 if not set)
- [ ] Service credentials (Stripe, Anthropic, etc.) if needed

---

## 📊 Post-Deploy Verification (5 minutes)

After pushing/deploying:

1. **Check Deployment Status**
   - Go to Railway Dashboard → Deployments
   - Wait for build to complete (should take 2-3 min)
   - Look for: "✅ Build successful"

2. **Monitor Logs**
   - Click on deployment → Logs tab
   - Look for: `🚀 API Server Started Successfully`
   - Verify no error messages before that

3. **Check Healthchecks**
   - Response should change from "service unavailable" to healthy
   - All 6+ healthcheck attempts should succeed
   - Service should be marked "HEALTHY" in dashboard

4. **Test API**
   ```bash
   curl https://your-api-url.com/health
   # Should return: {"status":"ok","timestamp":"...","uptime":...}
   ```

---

## ⚠️ If Deployment Still Fails

1. **Check DATABASE_URL is actually set**
   ```bash
   railway run env | grep DATABASE_URL
   ```

2. **Check application logs during startup**
   - Look for "FATAL ERROR" messages
   - Common: "DATABASE_URL is not set" or "Environment not configured"

3. **Check if migrations need to run**
   ```bash
   railway run --service api npx prisma migrate status
   railway run --service api npx prisma migrate deploy
   ```

4. **Clear Railway cache and retry**
   - Railway Dashboard → Settings → Clear Build Cache
   - Redeploy

---

## 📈 Expected Results

### Before
```
Attempt #1 failed with service unavailable
Attempt #2 failed with service unavailable
Attempt #3 failed with service unavailable
Attempt #4 failed with service unavailable
Attempt #5 failed with service unavailable
Attempt #6 failed with service unavailable
1/1 replicas never became healthy! ❌
```

### After ✅
```
✅ API Server Started Successfully
📦 Integrations: X/9 configured
🤖 RAG Retrieval Layer: ✅ LOADED
Health: /health
Docs: /docs
[All 6+ healthchecks succeed] ✅
1/1 replicas became healthy! ✅
```

---

## 📞 Support

For issues:
1. Check [RAILWAY_HEALTHCHECK_FIX.md](./RAILWAY_HEALTHCHECK_FIX.md) for detailed troubleshooting
2. Check Railway logs for specific error messages
3. Verify all required environment variables are set
