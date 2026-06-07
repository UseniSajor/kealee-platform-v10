# 🚀 Agentic Framework Deployment: START HERE

**Date:** June 7, 2026  
**Status:** Ready to execute immediately  
**Timeline:** 8 days to full production

---

## What You Need to Do RIGHT NOW

This is a **complete, ready-to-execute deployment plan**. No research needed. Just follow the steps.

---

## Phase 0: Setup (2-3 hours, TODAY)

### Step 1: Create Staging Database

```bash
./scripts/setup-staging-db.sh
```

**What it does:**
- Guides you through creating a Supabase staging project
- Tests database connection
- Creates migration environment
- Total time: 1 hour

**Manual steps required:**
1. Go to https://supabase.com
2. Create new project named `kealee-staging`
3. When ready, run the script above
4. Copy the connection string provided

**Outcome:** You have a staging database separate from production

---

### Step 2: Configure Sentry

```bash
./scripts/setup-sentry.sh
```

**What it does:**
- Guides you through Sentry project creation
- Collects your Sentry DSN
- Provides Railway environment variables
- Total time: 30 minutes

**Manual steps required:**
1. Go to https://sentry.io
2. Create new project (Platform: Node.js)
3. Copy the DSN
4. Run the script above, paste DSN when prompted

**Outcome:** You have error tracking configured

---

### Step 3: Configure Railway

**Manual (no script):**

1. Go to https://railway.app
2. Select your project → `production` environment
3. Click "Variables"
4. Add these variables:

```
AGENTIC_BOT_WORKER_ENABLED=true
AGENTIC_DESIGN_BOT_ENABLED=true
AGENTIC_DESIGN_BOT_ROLLOUT_PERCENTAGE=0
SENTRY_DSN=https://examplePublicKey@sentry.example.com/project-id
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1
SENTRY_PROFILES_SAMPLE_RATE=0.1
```

**Use values from:**
- SENTRY_DSN: From Sentry setup step
- Rest: Copy as-is

**Time:** 10 minutes

**Outcome:** Railway configured with feature flags + monitoring

---

### Step 4: Test Migration in Staging

```bash
# In your terminal, using WSL/Ubuntu path
cd packages/database

# Set staging database connection
export DATABASE_URL="postgresql://user:pass@staging.supabase.co:5432/postgres"

# Apply migration
npx prisma migrate deploy

# Verify
npx prisma db execute --stdin < /dev/null
```

**Outcome:** Schema tested in staging before production

---

### ✅ Phase 0 Complete When:

- [ ] Staging database created and tested
- [ ] Sentry project created and DSN copied
- [ ] Railway variables added (all 8 above)
- [ ] Migration tested in staging database
- [ ] All three health endpoints responding locally

---

## Phase 1: Deploy to Production (Day 1 Morning)

### Pre-Deploy Checklist (30 mins before)

```bash
# Verify everything is committed
git status
# Expected: clean working directory

# Pull latest
git pull origin main

# Check health locally
curl http://localhost:3099/health
# Expected: 200 OK
```

---

### Deploy Script

```bash
./scripts/deploy-agentic.sh
```

**What it does:**
1. Verifies git is clean
2. Checks current production health
3. Pushes code to main (triggers Railway deployment)
4. Waits 2 minutes for services to start
5. Verifies post-deploy health
6. Prompts you to enable 5% canary

**Time:** 5-10 minutes (plus 2 min wait)

**Outcome:**
- Code deployed to production
- Migrations applied automatically
- Services restarted with new env vars
- Ready for canary enablement

---

### Enable 5% Canary (Manual)

After script completes:

1. Go to https://railway.app
2. Select project → `production` environment
3. Update: `AGENTIC_DESIGN_BOT_ROLLOUT_PERCENTAGE=0` → `5`
4. Click "Save"

**Result:** 5% of design bot orders route to agentic system

---

### Verify Deployment

```bash
# Check health
curl https://api.kealee.com/api/agentic-bots/health | jq

# Expected response:
{
  "status": "healthy",
  "checks": {
    "redisConnection": "connected",
    "databaseConnection": "connected"
  },
  "metrics": {
    "totalActiveJobs": 0,
    "totalFailedJobs": 0
  }
}
```

---

## Phase 2: Monitor 24 Hours (Day 1)

### Start Monitoring

```bash
./scripts/monitor-canary.sh
```

**What it does:**
- Runs health checks every hour
- Logs results to `canary-monitoring-*.log`
- Checks Sentry for errors
- Alerts you to issues

**Duration:** Automatically runs for 24 hours

**What to watch:**
- ✅ Error rate <1%
- ✅ Queue size <20
- ✅ Failed jobs = 0
- ✅ Stalled jobs = 0
- ✅ Sentry clear of agentic errors

---

### Manual Verification (Hourly during business hours)

```bash
# Check health
curl https://api.kealee.com/api/agentic-bots/health | jq '.metrics'

# Check queue stats
curl https://api.kealee.com/api/agentic-bots/stats | jq

# Check Sentry
# Go to: https://sentry.io → Issues
# Filter: project=kealee-platform
# Expected: 0 agentic-related errors
```

---

### After 24 Hours: Decision

**If all metrics are GREEN:**
- Proceed to Phase 3 Day 2 (scale to 10%)

**If any metric is ORANGE:**
- Hold at 5% for another 24h
- Investigate the issue
- Retry after fix

**If any metric is RED:**
- Rollback immediately: `AGENTIC_DESIGN_BOT_ROLLOUT_PERCENTAGE=0`
- New orders route to legacy bot
- Investigate root cause
- Redeploy after fix

---

## Phase 3: Progressive Rollout (Days 2-5)

### Same Pattern Each Day:

```
Check previous 24h metrics
  ↓
All green?
  ├─ YES → Increase rollout percentage
  ├─ WARNING → Hold, investigate
  └─ RED → Rollback to 0%
```

### Timeline:

```
Day 2: 5% → 10%  (if all green)
Day 3: 10% → 25% (if all green)
Day 4: 25% → 50% (if all green)
Day 5: 50% → 100% (if all green)
```

### How to Scale:

```bash
# Go to Railway dashboard
# Settings → production environment → Variables
# Update: AGENTIC_DESIGN_BOT_ROLLOUT_PERCENTAGE=X

# Replace X with:
# Day 2: 10
# Day 3: 25
# Day 4: 50
# Day 5: 100
```

---

## Emergency Rollback (Anytime)

```bash
# Set rollout to 0%
# Railway → production → Variables
# AGENTIC_DESIGN_BOT_ROLLOUT_PERCENTAGE=0

# Effect: IMMEDIATE (no redeploy)
# Result: All new orders → legacy bot
```

---

## Success = End of Week 1

When you have:
- ✅ 100% rollout to DesignBotAgentic
- ✅ <1% error rate
- ✅ <60s execution duration p95
- ✅ >90% tool success rate
- ✅ Zero customer escalations

**Then:** Celebrate! DesignBotAgentic is production-ready.

---

## Quick Reference

| File | Purpose | When |
|------|---------|------|
| `scripts/setup-staging-db.sh` | Create staging DB | Phase 0 |
| `scripts/setup-sentry.sh` | Create Sentry project | Phase 0 |
| `scripts/RAILWAY_SETUP.md` | Railway configuration | Phase 0 |
| `scripts/deploy-agentic.sh` | Deploy to production | Phase 1 |
| `scripts/monitor-canary.sh` | Monitor 24h canary | Phase 2 |
| `docs/AGENTIC_DEPLOYMENT_GUIDE.md` | Full details | Anytime |
| `docs/STAGING_DATABASE_STRATEGY.md` | Staging DB guide | Reference |
| `docs/SENTRY_CONFIGURATION.md` | Sentry details | Reference |

---

## Timeline

```
TODAY:           Phase 0 Setup (2-3 hours)
TOMORROW:        Phase 1 Deploy + Phase 2 Monitor (30 min + 24h)
DAYS 2-5:        Phase 3 Progressive rollout (5 days)
END OF WEEK 1:   100% rollout achieved ✅
WEEK 2+:         Phase 2 bots (EstimateBot, PermitBot, FloorplanBot)
```

---

## You're Not Alone

If you get stuck:

1. **Setup issue?** Check `scripts/RAILWAY_SETUP.md`
2. **Deployment issue?** Check `docs/AGENTIC_DEPLOYMENT_GUIDE.md`
3. **Monitoring issue?** Check `docs/DEPLOYMENT_STATUS_2026-06-07.md`
4. **General question?** Check `docs/DEPLOYMENT_EXECUTION_SUMMARY.md`

All scripts are idempotent (safe to re-run).  
All procedures have rollback options.  
All decisions have 24h safety buffers.

---

## Start Now

```bash
# Phase 0, Step 1: Create staging database
./scripts/setup-staging-db.sh
```

🚀 **Let's ship the agentic framework!**

