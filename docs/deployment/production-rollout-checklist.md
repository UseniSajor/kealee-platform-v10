# Production Rollout Checklist

> Last updated: 2026-03-15
> Platform: Railway
> Staging test checklist must be FULLY COMPLETED before executing this checklist.

---

## Phase 0 — Pre-Deploy Verification (24h before deploy)

- [ ] All staging tests pass (see staging-test-checklist.md)
- [ ] Tim signed off on staging test summary
- [ ] No open P0/P1 bugs in GitHub Issues
- [ ] DB migrations reviewed — no destructive operations (no DROP TABLE, no column removal)
- [ ] All required env vars confirmed in Railway production variables
- [ ] Stripe webhook endpoint registered in Stripe Dashboard → Production → Webhooks
- [ ] GHL webhook endpoint registered in GHL → Integrations → Webhooks
- [ ] Resend domain verified for `noreply@kealee.com` (DKIM/SPF)
- [ ] Twilio phone number active and verified for production
- [ ] Redis production instance running and accessible
- [ ] All KeaBot tool handlers reviewed — no mock data in production path
- [ ] ANTHROPIC_API_KEY usage limits reviewed (rate limits, billing)

---

## Phase 1 — Database Migration

**Deploy order: Database first, then services.**

```bash
# 1. Take production DB backup
railway run --service production-postgres -- pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Apply pending migrations
railway run --service api -- npx prisma migrate deploy

# 3. Verify migration applied
railway run --service api -- npx prisma migrate status
```

- [ ] Backup taken and stored
- [ ] All pending migrations applied successfully
- [ ] Schema matches expected state (check with Prisma Studio or `prisma db pull`)

---

## Phase 2 — Deploy Services (in order)

Deploy order matters — API and worker depend on shared DB/Redis.

### Step 1: Worker Service

```bash
railway up --service worker
```

- [ ] Worker deployed successfully
- [ ] Health endpoint responding: `GET {worker_railway_url}:{HEALTH_PORT} → 200`
- [ ] All 8 queues shown as active in health response
- [ ] No error logs in Railway dashboard within 2 minutes of deploy

### Step 2: API Service

```bash
railway up --service api
```

- [ ] API deployed successfully
- [ ] Health endpoint: `GET {api_railway_url}/health → 200`
- [ ] `GET {api_railway_url}/api/v1/status → 200`
- [ ] No startup errors in Railway logs

### Step 3: OS Services (in parallel)

```bash
railway up --service os-land &
railway up --service os-feas &
railway up --service os-dev &
railway up --service os-pm &
railway up --service os-pay &
railway up --service os-ops &
railway up --service marketplace &
wait
```

- [ ] All 7 OS services deployed
- [ ] Each health endpoint responding

### Step 4: Portal Apps (in parallel)

```bash
railway up --service portal-owner &
railway up --service portal-contractor &
railway up --service portal-developer &
railway up --service command-center &
railway up --service web-main &
railway up --service admin-console &
wait
```

- [ ] All 6 portal apps deployed
- [ ] Each responding on their assigned port

---

## Phase 3 — Post-Deploy Smoke Tests

Run immediately after deploy, in < 15 minutes.

```
[ ] GET {api_url}/health → { status: "ok" }
[ ] GET {api_url}/owner/projects (with valid JWT) → 200 or 401
[ ] POST {api_url}/comms/send (with valid JWT) → 201
[ ] GET {portal_owner_url}/ → 200 (Next.js app serving)
[ ] GET {admin_console_url}/ → 200
[ ] POST {api_url}/bots/lead-bot/execute → 200 with output
```

---

## Phase 4 — Monitoring Setup

- [ ] Railway auto-restart enabled for all services (crashloop protection)
- [ ] Railway health check configured:
  - API: `GET /health` every 30s, 3 failures → restart
  - Worker: `GET :{HEALTH_PORT}` every 30s, 3 failures → restart
- [ ] Set Railway resource limits:
  - API: 2 vCPU, 2GB RAM
  - Worker: 1 vCPU, 1GB RAM
  - OS Services: 0.5 vCPU, 512MB RAM each
  - Portal Apps: 0.5 vCPU, 512MB RAM each
- [ ] Log alerts configured in Railway: ERROR log rate > 10/min → notify
- [ ] Stripe dashboard: webhook event logs reviewed (no failed deliveries)
- [ ] GHL dashboard: API call logs reviewed (no auth failures)

---

## Phase 5 — Traffic Cutover

For initial launch:

- [ ] DNS updated to point to Railway service URLs (if custom domain)
- [ ] Announce deployment in team Slack
- [ ] Monitor error rates for 30 minutes post-launch

---

## Rollback Plan

If critical issues discovered post-deploy:

### Option A — Fast Rollback (< 5 min)

Use Railway's one-click rollback to previous deployment:

```
Railway Dashboard → Service → Deployments → Previous → Redeploy
```

Do this for: api, worker, portal apps (all in parallel).
**Does NOT rollback DB migrations.**

### Option B — Full Rollback (if migration issues)

```bash
# 1. Revert services to previous build via Railway dashboard
# 2. Check if migration is reversible (most are additive-only = safe)
# 3. If data corruption: restore from Phase 1 backup
railway run --service production-postgres -- psql $DATABASE_URL < backup_YYYYMMDD_HHMMSS.sql
```

### Option C — Feature Flag Kill Switch

For issues with specific features:

```
POST /enterprise/flags
{
  "flagKey": "feature.{feature_name}",
  "enabled": false,
  "scope": "GLOBAL"
}
```

Disable affected feature without rollback.

---

## Known Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| DB migration failure | Low | High | Additive-only migrations, tested on staging |
| Anthropic API rate limit | Medium | Medium | Per-user rate limiting, cost guard |
| Stripe webhook missing | Low | High | Verify webhook secret before deploy |
| Worker startup failure (Redis down) | Low | Medium | Worker retries, health check triggers restart |
| GHL API key expired | Low | Low | Platform continues, CRM sync fails silently |
| Bot tools returning mock data | High | Medium | Feature flag bots off until tools wired |

---

## Post-Launch Monitoring (24h)

- [ ] Monitor Railway logs every 2h for first 24h
- [ ] Check Stripe webhook delivery in Stripe Dashboard
- [ ] Check Resend email delivery stats (bounce rate < 2%)
- [ ] Check Anthropic usage dashboard (verify cost within budget)
- [ ] Check Redis memory usage (< 70% of limit)
- [ ] Check DB connection pool (< 80 of max connections)
- [ ] Review event stream: `events:project`, `events:engagement` entries appear as expected

---

**Deployment Date:** _______________
**Deployed By:** _______________
**Rollback Threshold:** Any P0 error within 1h of deploy → immediate rollback
