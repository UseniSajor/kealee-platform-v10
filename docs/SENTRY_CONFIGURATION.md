# Sentry Configuration for Kealee Platform

**Purpose:** Real-time error tracking, performance monitoring, and alerting for production deployments.

---

## 1. Create Sentry Project

### Step 1: Sign Up / Log In
- Go to [sentry.io](https://sentry.io)
- Create organization or log in
- Create new project:
  - **Platform:** Node.js
  - **Alert frequency:** Alerts on all errors initially, tune later
  - **Team:** Assign to platform team

### Step 2: Get Your DSN
After project creation, you'll get a **DSN** (Data Source Name):
```
https://examplePublicKey@sentry.example.com/project-id
```

This goes in `SENTRY_DSN` environment variable across all services.

---

## 2. Railway Configuration

### Set Environment Variables

Go to Railway dashboard → Your project → Variables:

```bash
# All services (API, Worker, AI Learning, etc.)
SENTRY_DSN=https://examplePublicKey@sentry.example.com/project-id
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1          # 10% of requests (avoids quota overload)
SENTRY_PROFILES_SAMPLE_RATE=0.1        # 10% of requests for profiling

# Optional: for sourcemap uploads (enables stack traces)
SENTRY_AUTH_TOKEN=sntrys_...            # from Sentry settings → Auth Tokens
```

### Verify Configuration

After deploying, check Sentry dashboard:
1. Go to **Settings → Projects**
2. Select your project
3. Click **"Client Keys (DSN)"**
4. You should see events flowing in within minutes

---

## 3. Configure Alerts

### Error Rate Alert (Critical)

**Settings → Alerts → Create Alert Rule**

```
Condition: Event count exceeds 10 in 5 minutes
Environment: production
Filter: error level = error or higher
Action: Send to Slack/Email
```

### Performance Alert (High Latency)

```
Condition: p95 duration exceeds 60 seconds
Environment: production
Filter: transaction = /api/bots/chain
Action: Send to Slack/Email
```

### Failed Job Alert

```
Condition: Custom: tags.type = "queue_failure"
Count: exceeds 5 in 5 minutes
Action: Send to Slack/Email
```

---

## 4. Integration with Slack

### Connect Slack to Sentry

1. Go to **Settings → Integrations**
2. Search for "Slack"
3. Click **"Install"**
4. Authorize Sentry to your Slack workspace
5. Select channel for alerts (e.g., `#prod-incidents`)

### Slack Alert Format

When an error occurs, you'll get:
```
🚨 [Production] Error in /api/bots/chain
Error: TypeError: Cannot read property 'id' of undefined
Affected: 3 users · First: 2 minutes ago
↳ View in Sentry
```

---

## 5. Source Maps (Optional but Recommended)

Enables readable stack traces by mapping compiled code back to source.

### Generate Source Maps

In `services/api/tsconfig.json`:
```json
{
  "compilerOptions": {
    "sourceMap": true,
    "declaration": true
  }
}
```

### Upload Source Maps

Add to your Railway deployment script:

```bash
# After build, before deploy
npm install -g @sentry/cli

sentry-cli releases files upload-sourcemaps \
  dist/ \
  --release=v1.0.0 \
  --org=your-org \
  --project=your-project
```

---

## 6. Agentic Framework Integration

The agentic framework includes Sentry integration via:

```typescript
// From packages/core-agents/src/runtime/observability.ts
const observability = initializeObservability('production');

// Automatically tracks:
observability.recordExecution({
  duration: 1250,
  iterations: 5,
  toolCount: 2,
  success: true,
  toolHistory: [...]
});

// Records anomalies:
observability.recordAnomaly({
  type: 'high_duration',
  value: 75000,
  threshold: 60000,
  severity: 'warning'
});
```

### Sentry Provider Setup

```typescript
// In production:
const provider = new SentryProvider({
  dsn: process.env.SENTRY_DSN,
  environment: 'production',
  tracingSampleRate: 0.1,
  beforeSend: (event) => {
    // Filter out low-priority events
    if (event.level === 'debug') return null;
    return event;
  }
});
```

---

## 7. Monitoring Dashboard (Sentry)

### Key Dashboards to Set Up

**1. Error Rate Over Time**
- Widget: Line chart
- Metric: `count()` by time
- Filter: `level:[error, fatal]`

**2. Agentic Bot Execution Performance**
- Widget: Line chart
- Metric: `agentic_execution_duration_seconds` (p95)
- Label: "Agentic Bot Duration p95"

**3. Queue Failure Rate**
- Widget: Stat
- Metric: Failed jobs / Total jobs
- Alert threshold: >5%

**4. Tool Success Rate**
- Widget: Gauge
- Metric: `agentic_tool_success_rate` by tool_name
- Target: >90%

**5. Blocked URLs**
- Widget: Stat
- Metric: `browser_blocked_url_attempts`
- Alert: >0 (suspicious activity)

---

## 8. Testing Sentry Integration

### Send Test Error

```bash
# From services/api
curl -X POST http://localhost:3000/api/test-sentry \
  -H "Content-Type: application/json" \
  -d '{"message": "Test error from worker"}'
```

Expected: Error appears in Sentry dashboard within 1 minute

### Test Webhook / Slack Alert

```bash
# Go to Sentry Settings → Integrations → Slack
# Click "Send Test Message"
# Should see message in Slack channel
```

---

## 9. Environment-Specific Configuration

### Development
```bash
SENTRY_DSN=<development-project-dsn>
SENTRY_ENVIRONMENT=development
SENTRY_TRACES_SAMPLE_RATE=1.0  # Capture everything in dev
```

### Staging
```bash
SENTRY_DSN=<staging-project-dsn>
SENTRY_ENVIRONMENT=staging
SENTRY_TRACES_SAMPLE_RATE=0.5  # 50% sampling
```

### Production
```bash
SENTRY_DSN=<production-project-dsn>
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1  # 10% sampling (high volume)
```

---

## 10. Metrics to Track

### API Service
- Error rate (target: <1%)
- Request latency p95 (target: <500ms)
- Database query duration (target: <100ms)
- Stripe webhook success rate (target: >99%)

### Worker Service
- Job success rate (target: >99%)
- Job duration p95 (target: <30s per job type)
- Queue size (alert: >50 jobs)
- Failed job count (alert: >10)
- Stalled job count (alert: >3)

### Agentic Framework
- Execution duration p95 (target: <60s)
- Tool success rate (target: >90%)
- Iterations per execution (target: <10 avg)
- Blocked URL attempts (target: 0)
- Memory usage (target: <256MB)

---

## 11. Troubleshooting

### Events Not Appearing in Sentry

1. **Check DSN is correct:**
   ```bash
   echo $SENTRY_DSN  # Should print full DSN
   ```

2. **Check Sentry client initialization:**
   ```typescript
   import * as Sentry from '@sentry/node';
   console.log('Sentry initialized:', Sentry.isInitialized());
   ```

3. **Test sending error:**
   ```typescript
   throw new Error('Test error from app');
   ```

4. **Check sample rate** (if >0):
   ```bash
   # If SENTRY_TRACES_SAMPLE_RATE=0, no events sent
   ```

### High Event Volume / Quota Exceeded

1. Reduce `SENTRY_TRACES_SAMPLE_RATE` (e.g., 0.1 = 10%)
2. Filter out low-priority events in `beforeSend`
3. Upgrade Sentry plan

---

## 12. Cost

| Plan | Monthly Cost | Quota |
|------|--------------|-------|
| Free | $0 | 5,000 events/month |
| Team | $29 | 50,000 events/month + advanced features |
| Business | $99+ | Unlimited + dedicated support |

For Kealee platform (assuming 10K DAU, 5 events/user/day):
- **Low load:** ~$29/month (Team plan)
- **Production:** ~$99+/month (Business plan)

---

## 13. Deploy Checklist

- [ ] Create Sentry project
- [ ] Copy DSN to Railway variables
- [ ] Set SENTRY_ENVIRONMENT correctly
- [ ] Configure Slack integration
- [ ] Create 5 alert rules (error rate, latency, failures, stalled, blocked URLs)
- [ ] Deploy services (Railway auto-picks up env vars)
- [ ] Verify events flowing into Sentry
- [ ] Test Slack alert
- [ ] Set up dashboard widgets
- [ ] Document alert contacts + on-call rotation

