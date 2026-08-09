# Production Activation Plan for Agentic Bots

**Status:** Ready for Production Deployment  
**Date:** June 7, 2026  
**Target Bots:** DesignBot (Phase 1), Estimate/Permit/Floorplan (Phase 2+)  

---

## Deployment Phases

### Phase 0: Pre-Flight (Today)
- [ ] Database migration (Prisma)
- [ ] pnpm install (Playwright + SDK)
- [ ] Queue worker setup
- [ ] Observability configuration (Sentry)
- [ ] Health check implementation
- [ ] Monitoring & alerting setup

### Phase 1: Canary (Day 1)
- [ ] Enable AgenticBotWorker in queue
- [ ] Route 5% of orders to DesignBotAgentic
- [ ] Monitor error rates, latency, tool success
- [ ] Verify RAG tool calls
- [ ] Verify browser tool (if enabled)

### Phase 2: Staged Rollout (Days 2-7)
- [ ] 10% → 25% → 50% → 100% traffic shift
- [ ] Daily metrics review
- [ ] Alert on failures/anomalies
- [ ] Rollback plan ready

### Phase 3: Scale (Week 2+)
- [ ] Migrate Estimate/Permit/Floorplan bots
- [ ] Optimize queue worker performance
- [ ] Archive execution history (>90d)
- [ ] Publish success metrics

---

## Pre-Flight Checklist

### 1. Database Setup
```bash
cd packages/database
npx prisma migrate dev --name add-agentic-persistence
npx prisma generate
```

**Verify:**
- [ ] Tables created: agentic_job_execution, tool_execution_log, browser_audit_event, agentic_session_memory
- [ ] Indexes created for sessionId, userId, status
- [ ] Prisma client generated

### 2. Dependencies
```bash
pnpm install
```

**Verify:**
- [ ] @anthropic-ai/sdk installed
- [ ] playwright installed
- [ ] No conflicts with existing packages

### 3. Environment Setup
```bash
# .env or .env.local
NODE_ENV=production
SENTRY_DSN=https://examplePublicKey@sentry.example.com/project-id
AGENTIC_DESIGN_BOT=true (start with false, enable gradually)
AGENTIC_BOT_WORKER_ENABLED=true
AGENTIC_BOT_BATCH_SIZE=10
AGENTIC_BOT_TIMEOUT_MS=60000
AGENTIC_BOT_MAX_RETRIES=2
```

### 4. Health Checks
Implement `/health/agentic-bots` endpoint that checks:
- [ ] Queue connection (Redis/PostgreSQL)
- [ ] Bot registry loaded
- [ ] Observability provider connected
- [ ] Database connection pool healthy

### 5. Monitoring Setup
- [ ] Sentry project created (if using)
- [ ] Grafana dashboard created
- [ ] Alert rules enabled (execution timeout, tool failures, blocked URLs)
- [ ] Logging aggregation (CloudWatch/DataDog/Splunk)

### 6. Feature Flags
```typescript
// In your feature flag provider
{
  "AGENTIC_DESIGN_BOT": {
    "enabled": false,      // Start disabled
    "rolloutPercentage": 0, // Start at 0%
    "targetDate": "2026-06-08" // Review date
  },
  "AGENTIC_BOT_WORKER_ENABLED": {
    "enabled": true,        // Enable queue worker immediately
    "rolloutPercentage": 100
  }
}
```

---

## Implementation Tasks

### Task 1: Queue Worker Setup
Location: `services/api/src/workers/agentic-bot-worker.ts`

```typescript
import { Worker } from 'bullmq';
import { AgenticBotWorker, createAgenticBotHandler } from '@kealee/queue';
import { initializeObservability } from '@kealee/core-agents';
import { botRegistry } from '@/bots/registry';

const { observability, anomalyDetector } = initializeObservability({
  sentryDsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});

const handler = createAgenticBotHandler({
  botRegistry,
  observability,
  db: prisma,
  logger: logger.child({ component: 'agentic-bot-worker' }),
});

export const agenticBotWorker = new Worker('agentic-bots', handler, {
  connection: redisConnection,
  concurrency: parseInt(process.env.AGENTIC_BOT_CONCURRENCY || '5'),
  settings: {
    maxStalledCount: 2,
    stalledInterval: 5000,
    maxRetriesPerLogEntry: 50,
  },
});

agenticBotWorker.on('completed', (job) => {
  logger.info('agentic bot job completed', { jobId: job.id });
});

agenticBotWorker.on('failed', (job, err) => {
  logger.error('agentic bot job failed', { jobId: job.id, error: err.message });
});
```

### Task 2: Job Dispatcher
Location: `services/api/src/modules/bots/bot-dispatcher.ts`

```typescript
import { isAgenticBotJob, type AgenticBotJobData } from '@kealee/queue';
import { featureFlags } from '@/feature-flags';

export async function dispatchBotJob(jobData) {
  // Check if agentic bot worker is enabled
  if (!featureFlags.isEnabled('AGENTIC_BOT_WORKER_ENABLED')) {
    return dispatchTraditionalBotJob(jobData);
  }

  // Route agentic bots to new queue
  if (jobData.botId === 'design' && featureFlags.shouldRoute('AGENTIC_DESIGN_BOT')) {
    const agenticJobData: AgenticBotJobData = {
      ...jobData,
      agentic: true,
      systemPrompt: DESIGN_BOT_SYSTEM_PROMPT,
      tools: ['rag'], // 'rag', 'browser' (optional)
    };
    return agenticBotsQueue.add('agentic-bot-job', agenticJobData);
  }

  // Default: traditional bot
  return botsQueue.add('bot-job', jobData);
}
```

### Task 3: Health Checks
Location: `services/api/src/health/agentic-bots.ts`

```typescript
import { Router } from 'express';
import { agenticBotWorker } from '@/workers/agentic-bot-worker';
import { prisma } from '@kealee/database';
import { redisClient } from '@/redis';

export const agenticBotsHealthRouter = Router();

agenticBotsHealthRouter.get('/', async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      checks: {},
    };

    // Check queue worker
    health.checks.queueWorker = {
      status: agenticBotWorker.isPaused() ? 'paused' : 'running',
      processingCount: await agenticBotWorker.getProcessingCount?.(),
    };

    // Check Redis
    try {
      await redisClient.ping();
      health.checks.redis = { status: 'connected' };
    } catch (err) {
      health.checks.redis = { status: 'error', error: err.message };
      health.status = 'degraded';
    }

    // Check database
    try {
      await prisma.$queryRaw`SELECT 1`;
      health.checks.database = { status: 'connected' };
    } catch (err) {
      health.checks.database = { status: 'error', error: err.message };
      health.status = 'unhealthy';
    }

    // Check bot registry
    health.checks.botRegistry = {
      status: botRegistry.list().length > 0 ? 'loaded' : 'empty',
      botCount: botRegistry.list().length,
    };

    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (err) {
    res.status(503).json({
      status: 'unhealthy',
      error: err instanceof Error ? err.message : 'Unknown error',
    });
  }
});
```

### Task 4: Metrics & Monitoring
Location: `services/api/src/monitoring/agentic-metrics.ts`

```typescript
import { observability, anomalyDetector } from '@/observability';

export async function recordAgenticExecution(result) {
  await observability.recordExecution('design', {
    success: result.success,
    durationMs: result.durationMs,
    iterations: result.totalIterations,
    toolCalls: result.toolHistory.length,
    outputLength: result.finalText.length,
  });

  // Detect anomalies
  const anomalies = await anomalyDetector.detectExecutionAnomalies({
    botName: 'design',
    durationMs: result.durationMs,
    iterations: result.totalIterations,
    toolCallCount: result.toolHistory.length,
    successfulToolCalls: result.toolHistory.filter(t => t.success).length,
  });

  if (anomalies.length > 0) {
    logger.warn('Agentic execution anomalies detected', {
      botName: 'design',
      anomalies,
    });
  }
}
```

### Task 5: Gradual Rollout
Location: `services/api/src/feature-flags/agentic-bots.ts`

```typescript
export const agenticBotFlags = {
  AGENTIC_DESIGN_BOT: {
    enabled: true,
    rolloutPercentage: () => {
      const time = Date.now();
      // Day 1: 5%
      // Day 2: 10%
      // Day 3: 25%
      // Day 4+: 50%+
      const days = (time - startTime) / (24 * 60 * 60 * 1000);
      if (days < 1) return 5;
      if (days < 2) return 10;
      if (days < 3) return 25;
      return 50;
    },
    shouldRoute: (userId) => {
      const hash = hashUserId(userId);
      return hash % 100 < rolloutPercentage();
    },
  },
};
```

---

## Execution Steps

### Step 1: Pre-Flight (Duration: 30 mins)
```bash
# 1. Database migration
cd packages/database
npx prisma migrate dev --name add-agentic-persistence
npx prisma generate

# 2. Dependencies
cd ../..
pnpm install

# 3. Build
pnpm run build

# 4. Environment
cp .env.production .env.local
# Edit: set SENTRY_DSN, feature flags
```

### Step 2: Deploy to Staging (Duration: 15 mins)
```bash
# Deploy to staging environment
git push origin main
# Trigger staging deployment via CI/CD
# Wait for deployment to complete
```

### Step 3: Verify Staging (Duration: 30 mins)
```bash
# Run health checks
curl https://staging-api.kealee.com/health/agentic-bots

# Test manual bot call
curl -X POST https://staging-api.kealee.com/api/bots/design \
  -H "Content-Type: application/json" \
  -d '{
    "projectType": "kitchen",
    "squareFeet": 250,
    "budget": 75000,
    "stylePreferences": ["modern"],
    "location": "Washington, DC"
  }'

# Check Sentry for errors
# Check Grafana for metrics
```

### Step 4: Deploy to Production (Duration: 10 mins)
```bash
# Deploy to production with AGENTIC_BOT_WORKER_ENABLED=true
# AGENTIC_DESIGN_BOT=false (start disabled)
git tag production-agentic-v1
git push origin production-agentic-v1
# Trigger production deployment
```

### Step 5: Canary Launch (Duration: 24 hours)
```bash
# Hour 0: Enable 5% of design bot orders
featureFlags.update('AGENTIC_DESIGN_BOT', { rolloutPercentage: 5 });

# Hour 6: Review metrics
# - Check error rate (should be <1%)
# - Check execution duration (should be <60s p95)
# - Check tool success rate (should be >50%)
# - Check blocked URLs (should be 0)

# Hour 12: Increase to 10%
featureFlags.update('AGENTIC_DESIGN_BOT', { rolloutPercentage: 10 });

# Hour 24: If healthy, go to 25%
featureFlags.update('AGENTIC_DESIGN_BOT', { rolloutPercentage: 25 });
```

### Step 6: Monitor & Scale (Days 2-7)
```bash
# Daily checks:
# 1. Error rate trending down
# 2. Tool success rate stable
# 3. No new anomalies detected
# 4. User satisfaction (feedback)

# Gradual scale:
# Day 2: 25%
# Day 3: 50%
# Day 4: 75%
# Day 5: 100% (if all metrics green)
```

---

## Monitoring Dashboard (Grafana)

Key panels:

1. **Execution Health**
   - Success rate (%)
   - Execution duration (p50, p95, p99)
   - Error count by type

2. **Tool Performance**
   - RAG success rate
   - Browser success rate (if enabled)
   - Tool latency breakdown

3. **Anomalies**
   - High failure rate alerts
   - Timeout alerts
   - Memory usage alerts
   - Blocked URL attempts

4. **Business Metrics**
   - Orders processed (agentic vs traditional)
   - Rollout percentage
   - User satisfaction (NPS, if available)

---

## Rollback Plan

If issues detected:

1. **Immediate (< 5 mins)**
   - Set AGENTIC_DESIGN_BOT rolloutPercentage to 0
   - New orders route to traditional bot

2. **Short-term (5-30 mins)**
   - Investigate error logs in Sentry
   - Check database for stuck jobs
   - Review tool execution logs

3. **Resolution (30+ mins)**
   - Fix issue in code
   - Deploy hotfix
   - Re-enable with 5% rollout
   - Monitor for 24h before increasing

---

## Success Criteria

✅ **Day 1:** Error rate <1%, RAG success >90%, no blocked URLs  
✅ **Day 3:** Execution time p95 <60s, all metrics stable  
✅ **Day 5:** 100% rollout, user satisfaction >4/5  
✅ **Week 2:** Estimate/Permit/Floorplan bots in canary  

---

## Production Configuration

```yaml
# production.yml
agentic-bots:
  enabled: true
  worker:
    concurrency: 10
    timeout: 60000
    maxRetries: 2
    stalledInterval: 5000
  features:
    AGENTIC_DESIGN_BOT: true
    AGENTIC_ESTIMATE_BOT: false # Phase 2
    AGENTIC_PERMIT_BOT: false   # Phase 2
    AGENTIC_FLOORPLAN_BOT: false # Phase 2
  tools:
    rag:
      enabled: true
      timeout: 5000
    browser:
      enabled: false # Phase 1.5
      timeout: 30000
      maxSessions: 3
  observability:
    provider: sentry
    environment: production
    tracesSampleRate: 0.1
    alertThresholds:
      maxDurationMs: 60000
      maxIterations: 20
      minToolSuccessRate: 0.5
      maxBlockedUrls: 3
  database:
    retention:
      recent: 30 # days
      archive: 90 # days
      delete: true
```

