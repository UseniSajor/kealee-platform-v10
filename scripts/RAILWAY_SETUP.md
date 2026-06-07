# Railway Production Configuration

## Step 1: Verify Current Environment

Check current Railway setup:
```bash
railway projects list
railway environments list
```

Expected: You have a `production` environment running API + Worker services.

---

## Step 2: Add Feature Flags to Production Environment

Go to [Railway Dashboard](https://railway.app) → Your Project → `production` environment

### Variables to Add/Update

```
# Agentic Framework Configuration
AGENTIC_BOT_WORKER_ENABLED=true
AGENTIC_DESIGN_BOT_ENABLED=true
AGENTIC_DESIGN_BOT_ROLLOUT_PERCENTAGE=0

# Sentry Observability (from Sentry setup)
SENTRY_DSN=https://examplePublicKey@sentry.example.com/project-id
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1
SENTRY_PROFILES_SAMPLE_RATE=0.1

# Verify existing variables are present:
# NODE_ENV=production
# APP_ENV=production
# DATABASE_URL=postgresql://...@prod.supabase.co:...
# REDIS_URL=redis://...prod...
# ANTHROPIC_API_KEY=sk-ant-...
```

### How to Add Variables in Railway

1. Go to Railway dashboard
2. Select project → `production` environment
3. Click "Variables"
4. Add each variable one by one (or bulk paste)
5. Click "Save"

---

## Step 3: Create Staging Environment (Optional but Recommended)

For safe testing before production:

```bash
# In Railway CLI
railway env:create staging

# Then set staging-specific variables:
NODE_ENV=staging
APP_ENV=staging
DATABASE_URL=postgresql://...@staging.supabase.co:...  # From staging setup
REDIS_URL=redis://...staging...
SENTRY_DSN=https://...  # Can use same Sentry project
SENTRY_ENVIRONMENT=staging
SENTRY_TRACES_SAMPLE_RATE=0.5
```

---

## Step 4: Deploy with New Configuration

```bash
# Ensure all code is committed
git status

# Deploy to production (triggers with new env vars)
git push origin main

# Watch deployment in Railway dashboard:
# - Code builds
# - Migrations run (Prisma)
# - Services restart with new env vars
```

---

## Step 5: Verify Deployment

```bash
# Check health endpoint
curl https://api.kealee.com/health

# Check agentic health
curl https://api.kealee.com/api/agentic-bots/health

# Expected response:
# {
#   "status": "healthy",
#   "checks": {
#     "redisConnection": "connected",
#     "databaseConnection": "connected",
#     "workersRunning": 2,
#     "workersTotal": 2
#   },
#   "metrics": {...},
#   "alerts": []
# }
```

---

## Step 6: Enable 5% Canary Rollout

Only after health checks are green:

1. Go to Railway dashboard
2. Select `production` environment
3. Update variable: `AGENTIC_DESIGN_BOT_ROLLOUT_PERCENTAGE=5`
4. Click "Save" (no redeploy needed, env var reloaded)

Now 5% of design bot orders will use the agentic system.

---

## Step 7: Monitor in Sentry

Go to [Sentry Dashboard](https://sentry.io) → Your Project

Expected within 5 minutes:
- First agentic job execution recorded
- No errors (or very few)
- Performance metrics showing up

---

## Complete Configuration Checklist

- [ ] AGENTIC_BOT_WORKER_ENABLED=true
- [ ] AGENTIC_DESIGN_BOT_ENABLED=true
- [ ] AGENTIC_DESIGN_BOT_ROLLOUT_PERCENTAGE=0 (before canary)
- [ ] SENTRY_DSN=https://...
- [ ] SENTRY_ENVIRONMENT=production
- [ ] SENTRY_TRACES_SAMPLE_RATE=0.1
- [ ] SENTRY_PROFILES_SAMPLE_RATE=0.1
- [ ] DATABASE_URL pointing to production
- [ ] REDIS_URL pointing to production
- [ ] ANTHROPIC_API_KEY set
- [ ] Health endpoints responding
- [ ] Sentry receiving events

All checked? → Ready for canary rollout!

---

## Progressive Rollout

Once canary at 5% is stable for 24h:

```
Day 2: AGENTIC_DESIGN_BOT_ROLLOUT_PERCENTAGE=10
Day 3: AGENTIC_DESIGN_BOT_ROLLOUT_PERCENTAGE=25
Day 4: AGENTIC_DESIGN_BOT_ROLLOUT_PERCENTAGE=50
Day 5: AGENTIC_DESIGN_BOT_ROLLOUT_PERCENTAGE=100
```

Each day: Wait 24h, monitor metrics, then proceed to next percentage.

---

## Emergency Rollback

If issues detected:

```
Set: AGENTIC_DESIGN_BOT_ROLLOUT_PERCENTAGE=0
Result: All new orders immediately route to legacy bot
Time to effect: Instant (no redeploy needed)
```

---

## Troubleshooting

### Env vars not taking effect

1. Verify saved in Railway dashboard
2. Check service logs for errors
3. May need to manually restart services:
   ```bash
   railway service:restart api
   railway service:restart worker
   ```

### Migration failed on deploy

1. Check Railway logs for SQL errors
2. Fix schema issue in Prisma
3. Redeploy: `git push origin main`

### Sentry not receiving events

1. Verify SENTRY_DSN is correct
2. Check Sentry project exists
3. Manually test: `curl /api/test-sentry`

---

## References

- Railway: https://railway.app
- Sentry: https://sentry.io
- Documentation: docs/AGENTIC_DEPLOYMENT_GUIDE.md
