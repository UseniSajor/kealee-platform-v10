# Agentic Framework Deployment Guide

**Status:** Ready to deploy  
**Timeline:** 8 days (24h canary + 5 days staged rollout + 1 day buffer)  
**Risk Level:** Low (feature flag-based gradual rollout)

---

## Phase 0: Pre-Deployment Setup (Today)

### Checklist

- [ ] **1. Staging Database Created**
  ```bash
  # Create Supabase staging project (see STAGING_DATABASE_STRATEGY.md)
  # Set staging DATABASE_URL in Railway
  ```

- [ ] **2. Sentry Configured**
  ```bash
  # Set SENTRY_DSN in Railway dashboard
  SENTRY_DSN=https://...
  SENTRY_ENVIRONMENT=production
  SENTRY_TRACES_SAMPLE_RATE=0.1
  ```

- [ ] **3. Feature Flags Configured**
  
  In Railway production environment variables:
  ```bash
  AGENTIC_BOT_WORKER_ENABLED=true
  AGENTIC_DESIGN_BOT_ENABLED=true
  AGENTIC_DESIGN_BOT_ROLLOUT_PERCENTAGE=0  # Start at 0%, enable after health checks
  ```

- [ ] **4. Environment Variables Verified**
  
  ```bash
  # All services must have these set
  NODE_ENV=production
  APP_ENV=production
  DATABASE_URL=postgresql://...@prod.supabase.co:...
  REDIS_URL=redis://...prod...
  SENTRY_DSN=https://...
  ANTHROPIC_API_KEY=sk-ant-...
  ```

- [ ] **5. Health Checks Passing (Local)**
  
  ```bash
  # In your local environment
  cd services/api
  pnpm build
  pnpm dev
  
  # In another terminal
  curl http://localhost:3099/health
  # Should return: status='healthy', all checks connected
  ```

- [ ] **6. Worker Health Endpoint Verified**
  
  ```bash
  # Start worker locally
  cd services/worker
  pnpm build
  pnpm dev
  
  # In another terminal
  curl http://localhost:3099/health
  # Should show: queues, metrics, alerts
  ```

- [ ] **7. Staging Migration Test Complete**
  
  ```bash
  # Follow STAGING_DATABASE_STRATEGY.md
  # Run: npx prisma migrate deploy (in staging env)
  # Verify: agentic models created in staging DB
  ```

---

## Phase 1: Deploy to Production (Day 1 at 5%)

### Pre-Deploy Verification (30 minutes before)

```bash
# 1. Ensure all code is committed
git status
# Expected: clean working directory

# 2. Ensure latest code
git pull origin main

# 3. Verify Dockerfile builds
docker build -f Dockerfile -t kealee:latest .
# Expected: successful build, no errors

# 4. Check Railway health before deploy
curl https://api.kealee.com/health
# Expected: 200 OK, all checks green
```

### Deployment (10 minutes)

```bash
# 1. Push code to main (triggers Railway auto-deploy)
git push origin main

# 2. Watch Railway deployment
# Go to: https://railway.app → kealee project → api service
# Expected: build starts, migrations run, service restarts

# 3. Wait for deployment to complete (~5 minutes)
# Watch the logs for:
# ✅ "Starting Kealee Platform API Service"
# ✅ "Database migrations complete"
# ✅ "Worker health endpoint listening on port 3099"

# 4. Verify post-deploy health (5 minutes after restart)
curl https://api.kealee.com/health
# Expected: 200 OK

curl https://api.kealee.com/api/agentic-bots/health
# Expected: 200 OK, status='healthy'
```

### Enable 5% Canary Rollout (Immediately after deploy)

```bash
# Go to Railway dashboard → Variables
# Update: AGENTIC_DESIGN_BOT_ROLLOUT_PERCENTAGE=5

# This routes ~5% of design bot orders to the new agentic system
# The other 95% still go to the legacy bot (safety net)

# DesignBotAgentic will now:
# 1. Accept jobs from the dispatcher
# 2. Initialize agentic executor
# 3. Run multi-step tool orchestration
# 4. Return concept output (same format as legacy)
# 5. Persist to BotDesignConcept
```

### Verify Canary is Working (15 minutes after enable)

```bash
# 1. Check for agentic jobs in queue
curl https://api.kealee.com/api/agentic-bots/stats
# Expected:
# {
#   "queueSize": 0-5,
#   "activeJobs": 0-2,
#   "rolloutPercentage": 5,
#   "routed_to_agentic": 1-3
# }

# 2. Check for errors in Sentry
# Go to: https://sentry.io → kealee project
# Expected: no new errors related to agentic

# 3. Check worker logs for agentic job processing
# Go to: Railway → worker service → logs
# Expected: entries like:
# "Executing agentic job: design-bot-job-xxx"
# "DesignBotAgentic iteration 1/20: calling Claude"
# "Tool execution: retrieve_context (RAG)"

# 4. Check database for new records
# Query staging database (if you have access)
# SELECT * FROM agentic_job_executions ORDER BY created_at DESC LIMIT 1;
# Expected: recent record with success=true
```

---

## Phase 1: Monitor 24 Hours (Day 1)

### Hourly Check (Every hour for first 24 hours)

```bash
# Check error rate (target: <1%)
curl https://api.kealee.com/api/agentic-bots/health | jq '.metrics'

# Expected output:
# {
#   "totalActiveJobs": 0-5,
#   "totalFailedJobs": 0,        ← Must be 0
#   "totalStalledJobs": 0,       ← Must be 0
#   "queueSize": 0-3
# }

# Check Sentry for new issues
# Go to: https://sentry.io → Issues
# Expected: no agentic-related errors
```

### Metrics to Monitor (Every 2 hours)

| Metric | Target | Action if not met |
|--------|--------|-------------------|
| Error rate | <1% | Rollback to 0% |
| Execution duration p95 | <60s | Investigate slow query |
| Tool success rate | >90% | Check RAG configuration |
| Memory usage | <256MB | Check for memory leak |
| Blocked URLs | 0 | Check browser security |

### Sentry Alerts (Automatic)

You should receive Slack notifications if:
- Error rate exceeds 1%
- Execution duration exceeds 60s
- Failed jobs exceed 5 in 5 minutes
- Tool success rate drops below 80%

**Action:** Check Sentry immediately if you get a critical alert

### After 24 Hours: Make Decision

```
Are all metrics GREEN?
  ├─ YES → Proceed to Phase 2 (scale to 10%)
  ├─ WARNING → Hold at 5% for another 24h, investigate
  └─ RED → Rollback to 0%, fix issue, retry next day
```

### Rollback Procedure (if needed)

```bash
# 1. Immediately disable agentic routing
# Go to Railway → Variables
# Set: AGENTIC_DESIGN_BOT_ROLLOUT_PERCENTAGE=0

# 2. Verify new orders go to legacy bot
curl https://api.kealee.com/api/agentic-bots/stats
# Expected: routed_to_agentic=0

# 3. Investigate error in Sentry
# Go to: https://sentry.io → Issues
# Find the agentic-related error
# Check DesignBotAgentic logs in Railway

# 4. Fix and redeploy
# Edit the problematic code
# git commit -m "fix: resolve agentic issue"
# git push origin main
# Watch deployment
# Re-enable at 5%: AGENTIC_DESIGN_BOT_ROLLOUT_PERCENTAGE=5
```

---

## Phase 2: Staged Rollout (Days 2-5)

### Day 2: Scale to 10%

**Time:** 24h after Phase 1 deployment  
**Prerequisites:** All Phase 1 metrics green

```bash
# 1. Update feature flag
# Railway → Variables
# AGENTIC_DESIGN_BOT_ROLLOUT_PERCENTAGE=10

# 2. Verify scale
curl https://api.kealee.com/api/agentic-bots/stats
# Expected: routed_to_agentic is now 2-3x higher than at 5%

# 3. Monitor for 24 hours (same as Phase 1)
# Hourly health checks
# Watch Sentry for errors
# Check execution metrics

# 4. After 24h: Proceed to 25% or hold/rollback
```

### Day 3: Scale to 25%

**Prerequisite:** 10% metrics stable for 24 hours

```bash
AGENTIC_DESIGN_BOT_ROLLOUT_PERCENTAGE=25
# Monitor for 24 hours
```

### Day 4: Scale to 50%

**Prerequisite:** 25% metrics stable for 24 hours

```bash
AGENTIC_DESIGN_BOT_ROLLOUT_PERCENTAGE=50
# Monitor for 24 hours
# At this point, more agentic orders than legacy
```

### Day 5: Full Rollout to 100%

**Prerequisite:** 50% metrics stable for 24 hours

```bash
AGENTIC_DESIGN_BOT_ROLLOUT_PERCENTAGE=100
# All new design bot orders use agentic system
# Legacy system now inactive for design bots

# Celebrate! 🎉
```

---

## Monitoring Checklist (24h at Each Stage)

### Hourly (During business hours)

- [ ] Error rate <1%
- [ ] No critical Sentry alerts
- [ ] Queue size <20 jobs
- [ ] Failed jobs = 0

### Every 2 hours

- [ ] Execution duration p95 <60s
- [ ] Tool success rate >90%
- [ ] Memory usage stable
- [ ] Redis connection healthy

### Daily (End of day)

- [ ] Review Sentry dashboard
- [ ] Check database row counts (new models)
- [ ] Review worker logs for errors
- [ ] Document any issues found

### Decision Gate (Before scaling)

**PROCEED TO NEXT PERCENTAGE IF:**
- ✅ Error rate < 1% for full 24h
- ✅ Execution duration p95 stable <60s
- ✅ Tool success rate > 90%
- ✅ No failed jobs
- ✅ No stalled jobs
- ✅ Sentry shows no agentic issues
- ✅ Customer feedback positive (if monitoring support chat)

**HOLD OR ROLLBACK IF:**
- ❌ Error rate > 1%
- ❌ Execution duration p95 > 90s
- ❌ Tool success rate < 80%
- ❌ Failed jobs > 5
- ❌ Memory leak detected
- ❌ Critical Sentry issue

---

## After 100% Rollout (Week 2+)

### Keep Monitoring

```bash
# Weekly health check
curl https://api.kealee.com/api/agentic-bots/health

# Monthly metrics review
# Go to: Sentry → Alerts → Agentic Bot metrics
# Check: Error rate, duration, success rate trends
```

### Optimization

Once stable at 100%, you can:
- [ ] Increase worker concurrency (currently 2)
- [ ] Tune RAG prompt for better context retrieval
- [ ] Optimize browser session pooling
- [ ] Add more tools (web search, document lookup)

### Phase 2 Bots (Next sprints)

After DesignBot is stable, repeat for:
1. **EstimateBot** (5% → 100%)
2. **PermitBot** (5% → 100%)
3. **FloorplanBot** (5% → 100%)

Each bot gets its own feature flag:
```bash
AGENTIC_ESTIMATE_BOT_ROLLOUT_PERCENTAGE=5
AGENTIC_PERMIT_BOT_ROLLOUT_PERCENTAGE=5
AGENTIC_FLOORPLAN_BOT_ROLLOUT_PERCENTAGE=5
```

---

## Emergency Contact

**During Deployment/Canary:**
- On-call: [Add contact]
- Slack channel: #prod-incidents
- Escalation: Platform Lead

**If Critical Issue:**
1. Disable agentic routing (set rollout to 0%)
2. Page on-call
3. Check Sentry for root cause
4. Create incident ticket
5. Schedule post-mortem

---

## Deployment Success Criteria

**Week 1 Success = All of:**
- ✅ 100% rollout to DesignBotAgentic
- ✅ <1% error rate
- ✅ <60s execution duration p95
- ✅ >90% tool success rate
- ✅ Zero customer escalations
- ✅ Team confident in monitoring

**Go/No-Go Decision:** Friday EOD after Week 1

If all green → Mark agentic framework as production-ready  
If issues → Continue monitoring, optimize, retry next week

---

## Appendix: Command Reference

```bash
# Check agentic health
curl https://api.kealee.com/api/agentic-bots/health | jq

# Check queue stats
curl https://api.kealee.com/api/agentic-bots/stats | jq

# View recent jobs
curl https://api.kealee.com/api/agentic-bots/jobs?limit=10 | jq

# Enable canary
# Railway → Variables → set AGENTIC_DESIGN_BOT_ROLLOUT_PERCENTAGE=5

# Disable (emergency rollback)
# Railway → Variables → set AGENTIC_DESIGN_BOT_ROLLOUT_PERCENTAGE=0

# View worker logs
# Railway → worker service → Logs (real-time)

# View API logs
# Railway → api service → Logs (real-time)

# Check Sentry errors
# https://sentry.io → Issues → filter by "agentic"
```

