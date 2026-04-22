# 🚀 Go-Live: Railway Deployment Execution

**Status**: READY FOR IMMEDIATE DEPLOYMENT
**Last Updated**: 2026-04-21
**Target**: Railway `artistic-kindness` project

---

## DEPLOYMENT EXECUTION PLAN

### Phase 1: Pre-Deployment (Complete These First)

#### 1.1 Verify All Code is Committed

```bash
cd ~/kealee-platform-v10
git status
# Expected: "On branch main. Your branch is up to date with 'origin/main'."
```

**Status**: ✅ All documentation and scripts committed

#### 1.2 Verify Source Code Structure

✅ **API Service** (`services/api/`)
- Entry point: `src/index.ts`
- Build script: `pnpm run build:ts`
- Start command: `node dist/index.js`
- Port: 3001
- Dockerfile: ✅ Created

✅ **Web-Main Service** (`apps/web-main/`)
- Entry point: `next.config.js`
- Build script: `pnpm run build`
- Start command: `pnpm start`
- Port: 3024
- Output: Standalone

✅ **Worker Service** (`services/worker/`)
- Entry point: `src/index.ts`
- Build script: `pnpm run build`
- Start command: `node dist/index.js`
- Dockerfile: ✅ Created

#### 1.3 Verify Frontend Routes and API Integration

**Routes Verified**:
- ✅ `/` — Homepage
- ✅ `/concept-engine` — Concept selector
- ✅ `/estimation` — Estimation intake
- ✅ `/permits` — Permit intake
- ✅ `/pre-design/results/[id]` — Results page with polling
- ✅ `/pre-design/[type]/checkout` — Checkout flow

**API Integration Verified**:
- ✅ Using `NEXT_PUBLIC_API_URL` environment variable
- ✅ No hardcoded localhost URLs
- ✅ Fetch calls: `/api/pre-design/:id` and `/api/project-output/:id`
- ✅ Error boundaries configured
- ✅ Fallback output component ready

#### 1.4 Environment Variables Ready

**All required variables documented in**:
- RAILWAY_CONFIG_REFERENCE.md
- .env.example
- apps/web-main/.env.example

---

### Phase 2: Railway Configuration (Do This on Railway Dashboard)

#### 2.1 Log into Railway Dashboard

```
Project: artistic-kindness
Environment: production
URL: https://railway.app/project/8187fcf6-9916-49aa-bc75-77407f83d319
```

#### 2.2 Configure Environment Variables

**For `kealee-api` service (ID: 7c13d3c7-fa75-40c4-a2fe-2963c9a76aab)**

Create these variables in Settings → Variables:

```
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://postgres:OAhPZZZvFbMiKcUkPWbCTKIPGsOuaOVd@ballast.proxy.rlwy.net:46074/railway
REDIS_URL=redis://[your-railway-redis-internal-url]:6379

STRIPE_SECRET_KEY=sk_live_[YOUR_STRIPE_KEY]
STRIPE_WEBHOOK_SECRET=whsec_[YOUR_WEBHOOK_SECRET]

ANTHROPIC_API_KEY=sk-ant-[YOUR_ANTHROPIC_KEY]
RESEND_API_KEY=re_[YOUR_RESEND_KEY]
SUPABASE_SERVICE_ROLE_KEY=eyJ[YOUR_SUPABASE_KEY]

SENTRY_DSN=https://[key]@[domain].ingest.sentry.io/[id]
SENTRY_ORG=kealee
SENTRY_PROJECT=kealee-api

# 25 Stripe Price IDs (see RAILWAY_CONFIG_REFERENCE.md for complete list)
STRIPE_PRICE_CONCEPT_ESSENTIAL=price_[xxx]
STRIPE_PRICE_CONCEPT_PROFESSIONAL=price_[xxx]
STRIPE_PRICE_CONCEPT_PREMIUM=price_[xxx]
# ... and 22 more
```

**For `web-main` service (ID: 84c5a1e5-49f4-4c63-87aa-bb8c732d478e)**

```
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://api.kealee.com
API_URL=https://api.kealee.com
NEXT_PUBLIC_APP_URL=https://kealee.com

NEXT_PUBLIC_SUPABASE_URL=https://[your-project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ[YOUR_ANON_KEY]
SUPABASE_SERVICE_ROLE_KEY=eyJ[YOUR_SERVICE_ROLE_KEY]

SENTRY_AUTH_TOKEN=sntrys_eyJ[token]
SENTRY_ORG=kealee
SENTRY_PROJECT=web-main

# 25 Stripe Price IDs (same as API)
STRIPE_PRICE_CONCEPT_ESSENTIAL=price_[xxx]
# ... etc
```

**For `kealee-worker` service (NEW - create if not exists)**

```
NODE_ENV=production
DATABASE_URL=postgresql://postgres:OAhPZZZvFbMiKcUkPWbCTKIPGsOuaOVd@ballast.proxy.rlwy.net:46074/railway
REDIS_URL=redis://[your-railway-redis-internal-url]:6379

ANTHROPIC_API_KEY=sk-ant-[YOUR_ANTHROPIC_KEY]
RESEND_API_KEY=re_[YOUR_RESEND_KEY]

SENTRY_DSN=https://[key]@[domain].ingest.sentry.io/[id]
SENTRY_ORG=kealee
SENTRY_PROJECT=kealee-worker
```

#### 2.3 Configure Custom Domains

**For `web-main` service**:
1. Go to Settings → Domains
2. Add custom domain: `kealee.com`
3. Add custom domain: `www.kealee.com` (optional, redirect to kealee.com)

**For `kealee-api` service**:
1. Go to Settings → Domains
2. Add custom domain: `api.kealee.com`

#### 2.4 Verify DNS Configuration

**CNAME Records Required**:
```
kealee.com          CNAME → [railway-web-main-public-url]
api.kealee.com      CNAME → [railway-api-public-url]
www.kealee.com      CNAME → kealee.com (optional alias)
```

Get the Railway public URLs from the service Settings → Domains section.

#### 2.5 Enable Auto-Deploy from GitHub

For each service (kealee-api, web-main, kealee-worker):

1. Go to Settings
2. Under "Deployments", set:
   - Source: GitHub
   - Repository: origin/main
   - Auto-deploy: ON
3. Save

---

### Phase 3: Trigger Deployment

#### 3.1 Push Code to Main Branch

```bash
cd ~/kealee-platform-v10

# Verify everything is committed
git status

# Push to main (triggers auto-deploy on Railway)
git push origin main
```

#### 3.2 Monitor Deployment Progress

**Watch in Railway Dashboard**:
1. Go to Services
2. For each service (kealee-api, web-main, kealee-worker):
   - Click service name
   - Watch "Deployment" tab
   - Monitor logs in "Logs" tab
   - Wait for status to change to "Running" (green)

**Expected Deployment Time**: 5-10 minutes per service

#### 3.3 Check Deployment Logs

**If deployment fails**, check logs for:
- Build errors: Check if packages installed correctly
- Environment variable issues: Look for "undefined" references
- Start command errors: Verify process started correctly

**Common Issues**:
- `MODULE_NOT_FOUND` → Missing dependencies (run `pnpm install` locally first)
- `Cannot find database` → DATABASE_URL not set correctly
- `Port already in use` → Service conflict (shouldn't happen on Railway)

---

### Phase 4: Post-Deployment Verification

#### 4.1 Health Checks

**Check API Service**:
```bash
curl https://api.kealee.com/health
# Expected: { "status": "ok" } (200 OK)

curl https://api.kealee.com/health/ready
# Expected: { "status": "ok", "db": true, "redis": true }
```

**Check Web Service**:
```bash
curl https://kealee.com
# Expected: HTML page (200 OK)

curl -I https://kealee.com
# Expected: Content-Type: text/html
```

#### 4.2 Run Validation Tests

```bash
# Pre-deployment check (verify configuration)
pnpm production-deployment-check
# Expected: All checks PASS

# Post-deployment check (verify endpoints)
pnpm go-live-check
# Expected: All endpoints responding, database connected

# Full automation validation
pnpm automation-validation
# Expected: Queue working, email configured, UI validating, no failures

# Platform AI test (end-to-end user flows)
pnpm platform-ai-test
# Expected: 3 scenarios pass, 120+ assertions pass
```

#### 4.3 Manual Testing

**Test Complete User Flow**:

1. **Visit homepage**:
   ```
   https://kealee.com
   → Should load with navigation visible
   ```

2. **Start concept intake**:
   ```
   https://kealee.com/concept-engine
   → Fill form, submit
   → Should see results page with loading spinner
   ```

3. **View results**:
   ```
   https://kealee.com/pre-design/results/[id]
   → Should show real API data (not mock)
   → Should display ResultsReadyBanner with 4 deliverables
   ```

4. **Test API endpoint**:
   ```
   curl -X GET https://api.kealee.com/health
   → Should respond with 200 OK
   ```

5. **Test webhook**:
   ```
   curl -X POST https://api.kealee.com/webhooks/stripe
   → Should respond with 400 (missing signature is OK for test)
   ```

#### 4.4 Monitor Error Tracking

1. **Check Sentry Dashboard**:
   ```
   https://sentry.io/organizations/kealee/
   ```
   - Should show 0 unresolved errors
   - Any errors should be non-critical (warnings, info)

2. **Check Railway Logs**:
   - Services should show "Running" status
   - No FATAL errors in logs
   - Normal startup messages visible

---

## ROLLBACK PROCEDURE

If critical issues occur post-deployment:

### Immediate Rollback (Fastest)

```bash
# Option 1: Redeploy previous version via Railway
cd ~/kealee-platform-v10
git log --oneline -5
# Identify previous good commit (before a25c97a1)

# Option 2: Fix and redeploy
git revert HEAD                # Revert last commit
git push origin main           # Auto-redeploys previous version
```

### Safe Rollback

```bash
# Check deployment history
railway status

# Redeploy specific deployment ID
railway redeploy <deployment-id>

# Monitor with logs
railway logs -f
```

---

## MONITORING AFTER GO-LIVE

### Daily Checklist

- [ ] Check Sentry for errors (https://sentry.io)
- [ ] Verify all services show "Running" in Railway
- [ ] Monitor queue depth (should be < 100)
- [ ] Check recent deployments succeeded
- [ ] Verify no 5xx errors in logs

### Weekly Tasks

- [ ] Review error trends in Sentry
- [ ] Analyze user flow completion rates
- [ ] Check API response times
- [ ] Verify database backups completed
- [ ] Review webhook delivery success

### Monthly Tasks

- [ ] Full security audit
- [ ] Database optimization review
- [ ] Stripe account reconciliation
- [ ] Performance analysis
- [ ] Dependency updates

---

## CRITICAL CONTACTS

| Issue | Resolution |
|-------|-----------|
| Deployment failed | Check Railway logs, verify env vars, rebuild |
| Services not running | Check health endpoints, verify DATABASE_URL |
| Website returns 404 | Check domains configured, DNS propagated |
| API not responding | Check PORT env var, verify Fastify listening |
| Queue jobs not processing | Check REDIS_URL, verify worker service running |
| Payment webhooks not working | Verify webhook endpoint public, check signature secret |
| Errors not tracking | Check SENTRY_DSN, verify auth token |

---

## SUCCESS INDICATORS

✅ **API Service**
- Health: https://api.kealee.com/health → 200 OK
- Ready: https://api.kealee.com/health/ready → db: true, redis: true
- Webhook: https://api.kealee.com/webhooks/stripe → 400 (no sig) or 200 (valid)

✅ **Web Service**
- Homepage: https://kealee.com → HTML 200 OK
- Routes: All pages load without 404 or 500
- API calls: Console shows no CORS errors

✅ **Worker Service**
- Status: "Running" in Railway dashboard
- Logs: No errors, normal job processing messages
- Queues: Jobs processed, output saved

✅ **Database**
- Connection: `DATABASE_URL` working
- Migrations: Applied successfully
- Data: Tables accessible, no permission errors

✅ **Error Tracking**
- Sentry: 0 unresolved critical errors
- Logs: Normal startup messages, no fatals
- Monitoring: Alerts configured

---

## 🎉 GO-LIVE COMPLETE

When all verification tests pass:

```
✅ API Service: LIVE at https://api.kealee.com
✅ Web Service: LIVE at https://kealee.com
✅ Worker: Processing background jobs
✅ Database: Connected and persisting data
✅ Payments: Stripe webhooks working
✅ Error Tracking: Sentry monitoring active
```

**The Kealee Platform V20 is now in production!**

---

## NEXT STEPS FOR USERS

1. **Spread the word**: Share the website with early adopters
2. **Monitor closely**: Watch Sentry and Railway dashboards daily
3. **Gather feedback**: Collect user reports for v20.1
4. **Scale infrastructure**: Plan for increased traffic
5. **Security audit**: Conduct penetration testing

---

**Deployment Date**: 2026-04-21
**Status**: READY FOR EXECUTION
**Commit**: a25c97a1

Good luck with production go-live! 🚀
