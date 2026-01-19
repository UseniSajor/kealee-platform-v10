# Monitoring, Logging & Analytics - Complete Configuration Guide

## 📋 Overview

This guide provides complete configuration for monitoring, logging, and analytics across all apps and the API.

## 🔧 1. Error Tracking (Sentry)

### Frontend Apps Configuration

**Install Dependencies:**
```bash
cd apps/os-pm
pnpm add @sentry/nextjs

# Repeat for: m-ops-services, m-project-owner, os-admin, m-architect, m-permits-inspections
```

**Environment Variables (.env.local):**
```bash
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
NEXT_PUBLIC_SENTRY_ENVIRONMENT=production
SENTRY_AUTH_TOKEN=your_sentry_auth_token
```

**sentry.client.config.ts (create in each app):**
```typescript
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || 'development',
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay(),
  ],
  beforeSend(event, hint) {
    // Filter out non-critical errors
    if (event.exception?.values?.[0]?.type === 'Error' && 
        event.exception.values[0].value?.includes('console')) {
      return null
    }
    return event
  },
})
```

**sentry.server.config.ts (create in each app):**
```typescript
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || 'development',
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
  ],
})
```

**sentry.edge.config.ts (create in each app):**
```typescript
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || 'development',
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
})
```

**next.config.ts (update):**
```typescript
import { withSentryConfig } from '@sentry/nextjs'

const nextConfig = {
  // ... your existing config
}

export default withSentryConfig(nextConfig, {
  silent: true,
  org: 'your-sentry-org',
  project: 'your-project-name',
})
```

### API Configuration

**Install Dependencies:**
```bash
cd services/api
pnpm add @sentry/node @sentry/profiling-node
```

**Environment Variables (.env):**
```bash
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_ENVIRONMENT=production
SENTRY_AUTH_TOKEN=your_sentry_auth_token
```

**Already implemented in:** `services/api/src/middleware/sentry.middleware.ts`

## 📊 2. Performance Monitoring

### Frontend Configuration

**Already implemented in:** `packages/ui/src/lib/performance.ts`

**Usage in App:**
```typescript
import { initPerformanceMonitoring } from '@kealee/ui'

// In layout or _app.tsx
useEffect(() => {
  initPerformanceMonitoring()
}, [])
```

**Performance Budgets (.github/workflows/performance-budget.yml):**
```yaml
name: Performance Budget
on: [push, pull_request]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Lighthouse CI
        uses: treosh/lighthouse-ci-action@v9
        with:
          urls: |
            https://os-pm.kealee.com
            https://m-ops-services.kealee.com
          budgetPath: ./budget.json
```

**budget.json:**
```json
{
  "ci": {
    "collect": {
      "numberOfRuns": 3
    },
    "assert": {
      "assertions": {
        "first-contentful-paint": ["error", {"maxNumericValue": 2000}],
        "largest-contentful-paint": ["error", {"maxNumericValue": 2500}],
        "cumulative-layout-shift": ["error", {"maxNumericValue": 0.1}],
        "first-input-delay": ["error", {"maxNumericValue": 100}],
        "total-blocking-time": ["error", {"maxNumericValue": 300}]
      }
    }
  }
}
```

### API Performance Monitoring

**Already implemented in:** `services/api/src/middleware/request-logger.middleware.ts`

**Metrics tracked:**
- Request duration
- Response size
- Status codes
- User ID
- IP address

## 🗄️ 3. Database Logging

### Audit Logs (Already Exists)

**Model:** `SecurityAuditLog` in `schema.prisma`

**Usage:**
```typescript
import { auditService } from './modules/audit/audit.service'

await auditService.recordAudit({
  action: 'USER_LOGIN',
  entityType: 'User',
  entityId: userId,
  userId: userId,
  reason: 'User logged in',
  ipAddress: request.ip,
  userAgent: request.headers['user-agent'],
})
```

### API Request Logs

**Add to schema.prisma:**
```prisma
model ApiRequestLog {
  id            String    @id @default(uuid())
  method        String
  path          String
  statusCode    Int
  durationMs    Int
  userId        String?
  ipAddress     String?
  userAgent     String?
  queryParams   Json?
  bodySize      Int?
  responseSize  Int?
  createdAt     DateTime  @default(now())

  @@index([method])
  @@index([path])
  @@index([statusCode])
  @@index([userId])
  @@index([createdAt])
  @@index([method, path, createdAt])
}
```

**Migration:**
```bash
cd packages/database
pnpm prisma migrate dev --name add_api_request_logs
```

**Log Rotation (weekly):**
```sql
-- Run weekly via cron job
DELETE FROM "ApiRequestLog" 
WHERE "createdAt" < NOW() - INTERVAL '7 days';
```

## 📝 4. API Request Logging

**Already implemented in:** `services/api/src/middleware/request-logger.middleware.ts`

**Configuration:**
- Batch size: 50 requests
- Flush interval: 5 seconds
- Automatic logging on all requests

**Logs include:**
- Method (GET, POST, etc.)
- Path
- Status code
- Duration (ms)
- User ID
- IP address
- User agent
- Query parameters
- Body size
- Response size

## 📈 5. Analytics (PostHog)

### Frontend Configuration

**Install Dependencies:**
```bash
cd apps/os-pm
pnpm add posthog-js

# Repeat for all apps
```

**Environment Variables (.env.local):**
```bash
NEXT_PUBLIC_POSTHOG_KEY=ph_xxx
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

**Already implemented in:** `packages/ui/src/lib/analytics.ts`

**Usage:**
```typescript
import { AnalyticsProvider } from '@kealee/ui'

// In layout.tsx
<AnalyticsProvider>
  {children}
</AnalyticsProvider>
```

**Track Events:**
```typescript
import { trackEvent } from '@kealee/ui'

trackEvent('Button Clicked', {
  buttonId: 'submit-form',
  page: '/dashboard',
})
```

**PostHog Dashboard Setup:**
1. Create account at https://posthog.com
2. Create project
3. Get API key
4. Set up conversion funnels:
   - Signup → Onboarding → First Action
   - Page View → Feature Usage → Conversion

## 🏥 6. Health Checks

**Already implemented in:** `services/api/src/middleware/health-check.middleware.ts`

**Endpoints:**
- `GET /health` - Basic health check
- `GET /health/detailed` - Detailed health with all services
- `GET /health/db` - Database health
- `GET /health/redis` - Redis health

**Response Format:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00Z",
  "checks": {
    "database": {
      "status": "healthy",
      "latency": 5
    },
    "redis": {
      "status": "healthy",
      "latency": 2
    },
    "external": {
      "status": "healthy",
      "services": {
        "stripe": { "status": "healthy" },
        "supabase": { "status": "healthy" }
      }
    }
  },
  "version": "1.0.0",
  "uptime": 3600
}
```

## ⏱️ 7. Uptime Monitoring

### Better Stack Setup

1. **Create Account:** https://betterstack.com
2. **Add Monitors:**
   - API Production: `https://api.kealee.com/health`
   - API Staging: `https://api-staging.kealee.com/health`
   - OS PM: `https://os-pm.kealee.com`
   - Ops Services: `https://m-ops-services.kealee.com`
   - Project Owner: `https://m-project-owner.kealee.com`
   - Admin: `https://os-admin.kealee.com`
   - Architect: `https://m-architect.kealee.com`
   - Permits: `https://m-permits-inspections.kealee.com`

3. **Configure Alerts:**
   - Email: your-email@kealee.com
   - Slack: #alerts channel
   - PagerDuty: (optional)

4. **Check Interval:** 1 minute
5. **Timeout:** 10 seconds
6. **Expected Status:** 200

### UptimeRobot Setup (Alternative)

1. **Create Account:** https://uptimerobot.com
2. **Add Monitors:**
   - Type: HTTP(s)
   - URL: `https://api.kealee.com/health`
   - Interval: 5 minutes
   - Alert Contacts: Email, SMS

## 📊 8. Monitoring Dashboard

**Already implemented in:** `services/api/src/modules/monitoring/monitoring-dashboard.service.ts`

**Endpoint:**
```http
GET /monitoring/dashboard?startDate=2024-01-01&endDate=2024-01-31
```

**Response:**
```json
{
  "errors": {
    "total": 150,
    "byStatus": [
      { "status": 404, "count": 100 },
      { "status": 500, "count": 50 }
    ],
    "byEndpoint": [
      { "endpoint": "/api/projects", "count": 30 }
    ],
    "recent": [...]
  },
  "performance": {
    "averageResponseTime": 250,
    "p50": 200,
    "p95": 500,
    "p99": 1000,
    "byEndpoint": [...]
  },
  "users": {
    "activeUsers24h": 150,
    "activeUsers7d": 500,
    "activeUsers30d": 2000,
    "newUsers24h": 10
  },
  "revenue": {
    "totalRevenue": 50000,
    "revenue24h": 1000,
    "revenue7d": 5000,
    "revenue30d": 20000,
    "platformFees": 1500
  }
}
```

**Frontend Dashboard (create in os-admin):**
```typescript
// apps/os-admin/app/monitoring/page.tsx
'use client'

import { useQuery } from '@tanstack/react-query'
import { apiRequest } from '@kealee/ui'

export default function MonitoringDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['monitoring-dashboard'],
    queryFn: () => apiRequest('/monitoring/dashboard'),
  })

  if (isLoading) return <div>Loading...</div>

  return (
    <div>
      <h1>Monitoring Dashboard</h1>
      <div>
        <h2>Errors</h2>
        <p>Total: {data.errors.total}</p>
        {/* Display error charts */}
      </div>
      <div>
        <h2>Performance</h2>
        <p>Avg Response Time: {data.performance.averageResponseTime}ms</p>
        {/* Display performance charts */}
      </div>
      <div>
        <h2>Users</h2>
        <p>Active (24h): {data.users.activeUsers24h}</p>
        {/* Display user charts */}
      </div>
      <div>
        <h2>Revenue</h2>
        <p>Total: ${data.revenue.totalRevenue}</p>
        {/* Display revenue charts */}
      </div>
    </div>
  )
}
```

## 🔔 9. Alerts Configuration

### Sentry Alerts

1. **Go to:** Sentry Dashboard → Alerts
2. **Create Alert Rules:**
   - **Critical Errors:** Error rate > 10/min
   - **Performance:** P95 > 1000ms
   - **New Issues:** Any new error type

3. **Notification Channels:**
   - Email
   - Slack: `#alerts`
   - PagerDuty (optional)

### PostHog Alerts

1. **Go to:** PostHog Dashboard → Insights
2. **Create Insights:**
   - Error rate
   - Conversion rate
   - Feature usage

3. **Set Up Alerts:**
   - Conversion rate drops below threshold
   - Error rate increases

## 📦 Complete Setup Checklist

### API Setup
- [ ] Install `@sentry/node` and `ioredis`
- [ ] Set `SENTRY_DSN` environment variable
- [ ] Set `REDIS_URL` environment variable
- [ ] Add `ApiRequestLog` model to schema
- [ ] Run database migration
- [ ] Verify health checks work

### Frontend Setup (Each App)
- [ ] Install `@sentry/nextjs` and `posthog-js`
- [ ] Create `sentry.client.config.ts`
- [ ] Create `sentry.server.config.ts`
- [ ] Create `sentry.edge.config.ts`
- [ ] Update `next.config.ts` with Sentry
- [ ] Set `NEXT_PUBLIC_SENTRY_DSN`
- [ ] Set `NEXT_PUBLIC_POSTHOG_KEY`
- [ ] Add `<AnalyticsProvider>` to layout
- [ ] Verify Sentry events appear in dashboard
- [ ] Verify PostHog events appear in dashboard

### Uptime Monitoring
- [ ] Create Better Stack account
- [ ] Add all monitor URLs
- [ ] Configure alert channels
- [ ] Test alerts

### Dashboard
- [ ] Create monitoring dashboard page in os-admin
- [ ] Add charts for errors, performance, users, revenue
- [ ] Set up refresh interval
- [ ] Add date range filters

## 🎯 Environment Variables Summary

### API (.env)
```bash
# Sentry
SENTRY_DSN=https://xxx@sentry.io/xxx
SENTRY_ENVIRONMENT=production

# Redis
REDIS_URL=redis://localhost:6379

# Database (already set)
DATABASE_URL=postgresql://...
```

### Frontend Apps (.env.local)
```bash
# Sentry
NEXT_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx
NEXT_PUBLIC_SENTRY_ENVIRONMENT=production

# PostHog
NEXT_PUBLIC_POSTHOG_KEY=ph_xxx
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# API URL (already set)
NEXT_PUBLIC_API_URL=https://api.kealee.com
```

## ✅ Status: READY TO DEPLOY

All monitoring, logging, and analytics features are implemented and ready for configuration!
