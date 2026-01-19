# Monitoring Quick Start Guide

## 🚀 5-Minute Setup

### Step 1: Install Dependencies

**API:**
```bash
cd services/api
pnpm add @sentry/node ioredis
```

**Frontend (repeat for each app):**
```bash
cd apps/os-pm
pnpm add @sentry/nextjs posthog-js
```

### Step 2: Set Environment Variables

**API (.env):**
```bash
SENTRY_DSN=https://xxx@sentry.io/xxx
REDIS_URL=redis://localhost:6379
```

**Frontend (.env.local):**
```bash
NEXT_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx
NEXT_PUBLIC_POSTHOG_KEY=ph_xxx
```

### Step 3: Add Database Models

Add to `packages/database/prisma/schema.prisma`:
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
  @@index([method, path, createdAt])
}
```

Then migrate:
```bash
cd packages/database
pnpm prisma migrate dev --name add_monitoring
```

### Step 4: Update App Layouts

Add to each app's `layout.tsx`:
```tsx
import { AnalyticsProvider } from '@kealee/ui'

<AnalyticsProvider>
  {children}
</AnalyticsProvider>
```

### Step 5: Set Up Uptime Monitoring

1. Go to https://betterstack.com
2. Add monitors for:
   - `https://api.kealee.com/health`
   - All frontend app URLs
3. Configure alerts

## ✅ Done!

Monitoring is now active. Check:
- Sentry dashboard for errors
- PostHog dashboard for analytics
- Better Stack for uptime
- `/monitoring/dashboard` for metrics
