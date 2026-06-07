# Production Initialization Checklist

## Pre-Deployment (Before Release)

### Database & Dependencies
- [ ] Run `npx prisma migrate dev --name add-agentic-persistence`
- [ ] Run `npx prisma generate` 
- [ ] Verify migrations in `packages/database/prisma/migrations/`
- [ ] Run `pnpm install` to get playwright + SDK
- [ ] Run `pnpm run build` to compile TypeScript

### Environment Variables
Create `.env.production` or deploy via CI/CD:

```bash
# Core
NODE_ENV=production
DATABASE_URL=postgresql://user:password@host/db

# Queue
REDIS_URL=redis://host:6379

# Observability
SENTRY_DSN=https://examplePublicKey@sentry.example.com/project-id
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1

# Feature Flags (start conservative)
AGENTIC_BOT_WORKER_ENABLED=true
AGENTIC_DESIGN_BOT_ENABLED=true
AGENTIC_DESIGN_BOT_ROLLOUT_PERCENTAGE=5  # 5% = canary
AGENTIC_BOT_CONCURRENCY=5
AGENTIC_BOT_TIMEOUT_MS=60000
```

### Queue Setup
- [ ] Redis instance running and accessible
- [ ] Queue connection pool configured
- [ ] Job deadletter handling set up
- [ ] Queue monitoring enabled

### Monitoring & Logging
- [ ] Sentry project created and configured
- [ ] Grafana dashboard deployed with key metrics:
  - Execution duration (p50, p95, p99)
  - Tool success rate
  - Error rate by type
  - Blocked URL attempts
- [ ] Alert rules configured in Sentry/Prometheus
- [ ] Log aggregation tested (CloudWatch/DataDog/Splunk)
- [ ] Slack channel for prod alerts created

### Feature Flags
- [ ] Feature flag service integration ready
- [ ] Initial flags set (AGENTIC_DESIGN_BOT = 5%)
- [ ] Gradual rollout plan documented
- [ ] Flag update procedures documented

---

## Deployment (Release Day)

### 1. Pre-Deployment Verification (30 mins before)

```bash
# Verify all checks green
curl https://prod-api.example.com/health/agentic-bots

# Expected response:
# {
#   "status": "healthy",
#   "checks": {
#     "queueConnection": { "status": "connected" },
#     "worker": { "status": "running" },
#     "database": { "status": "connected" },
#     "redis": { "status": "connected" }
#   }
# }
```

- [ ] All health checks passing
- [ ] No database connection issues
- [ ] Queue processing normally
- [ ] Worker running and accepting jobs
- [ ] Observability pipeline working

### 2. Deployment Window

```bash
# Tag release
git tag production-agentic-v1-$(date +%Y%m%d)

# Deploy via CI/CD
git push origin main
# Trigger deployment pipeline
# Wait for: database migrations, service restart, health checks
```

- [ ] Code deployed to production
- [ ] Database migrations complete
- [ ] Services restarted and healthy
- [ ] Health checks passing

### 3. Post-Deployment Verification (15 mins after)

```bash
# Check queue metrics
curl https://prod-api.example.com/api/agentic-bots/stats

# Expected: queues empty or processing normally
```

- [ ] No deployment errors in logs
- [ ] Queue processing normally
- [ ] Metrics flowing to Grafana
- [ ] Sentry receiving events
- [ ] Slack alerts working

### 4. Initial Monitoring Period (First hour)

- [ ] Watch error rate (should be <1%)
- [ ] Watch execution duration (p95 should be <60s)
- [ ] Watch tool success rate (should be >90% for RAG)
- [ ] Watch blocked URL attempts (should be 0)
- [ ] No unusual log spikes

**If issues detected:**
- [ ] Scale AGENTIC_DESIGN_BOT rollout back to 0%
- [ ] Route new orders to legacy bot
- [ ] Investigate issue in logs/Sentry
- [ ] Fix and re-deploy

---

## Canary Phase (Days 1-5)

### Day 1: 5% Canary

```bash
# Morning: Enable 5% of design bot orders
UPDATE feature_flags SET rollout_percentage = 5 WHERE name = 'AGENTIC_DESIGN_BOT';

# Throughout day: Monitor metrics every hour
# Evening: Review metrics and decide next step
```

Metrics to track:
- Error rate (target: <1%)
- Success rate (target: >99%)
- Execution duration p95 (target: <60s)
- Tool success rate (target: >90%)
- Blocked URLs (target: 0)

**Decision criteria for 10%:**
- [ ] Error rate < 1%
- [ ] No new Sentry issues
- [ ] Execution time stable
- [ ] No customer complaints

### Day 2: Scale to 10%

```bash
# Update rollout
UPDATE feature_flags SET rollout_percentage = 10 WHERE name = 'AGENTIC_DESIGN_BOT';

# Monitor for 24h
```

### Day 3: Scale to 25%

```bash
UPDATE feature_flags SET rollout_percentage = 25 WHERE name = 'AGENTIC_DESIGN_BOT';
```

### Day 4-5: Monitor & Plan Phase 2

- [ ] All metrics stable
- [ ] No regressions
- [ ] Positive user feedback
- [ ] Ready for 100% or Phase 2 bots

---

## Health Checks (Ongoing)

### Hourly
- [ ] Error rate <1%
- [ ] Queue processing <5s latency
- [ ] No stalled jobs

### Daily
- [ ] Tool success rate >90%
- [ ] Execution duration p95 <60s
- [ ] Database connections healthy
- [ ] Observability pipeline working

### Weekly
- [ ] Review execution logs for patterns
- [ ] Clean up archived jobs (>90d)
- [ ] Capacity planning (growing queue?)
- [ ] Performance optimization review

---

## Rollback Procedure

If issues detected at any time:

### Immediate (< 5 mins)
```bash
# Disable agentic route
UPDATE feature_flags SET rollout_percentage = 0 WHERE name = 'AGENTIC_DESIGN_BOT';

# Verify new orders go to legacy bot
# Monitor error rate dropping
```

### Short-term (5-30 mins)
- [ ] Investigate Sentry for error patterns
- [ ] Check database query logs
- [ ] Check queue job logs
- [ ] Identify root cause

### Fix & Re-enable (30+ mins)
- [ ] Fix code issue or database issue
- [ ] Deploy hotfix
- [ ] Re-enable with 5% rollout
- [ ] Monitor for 24h before increasing

---

## Success Metrics

### Week 1 Targets
- [ ] 0 critical issues
- [ ] Error rate <1% consistent
- [ ] Execution time p95 <60s
- [ ] RAG tool success >90%
- [ ] 100% rollout for DesignBot

### Week 2 Targets
- [ ] Start EstimateBot canary (5%)
- [ ] No regression in DesignBot metrics
- [ ] Database performance stable
- [ ] Ready for Permit/Floorplan Phase 2

---

## Sign-Off

- [ ] **Release Engineer:** ___________________ Date: ___
- [ ] **Platform Lead:** ___________________ Date: ___
- [ ] **SRE/Ops Lead:** ___________________ Date: ___

---

## Incident Response

If production incidents occur:

1. **Page on-call SRE**
2. **Document in incident tracker**
3. **If rollback needed:** Scale AGENTIC_DESIGN_BOT to 0%
4. **Post-incident review:** Add learnings to this checklist

Emergency contacts:
- On-call: #prod-oncall-slack
- SRE lead: [contact]
- Platform lead: [contact]
