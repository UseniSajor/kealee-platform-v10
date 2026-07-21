# Monitoring, Logging & Analytics Setup Guide

## 🚀 Quick Setup

### 1. Install Dependencies

**API:**
```bash
cd services/api
pnpm add @sentry/node ioredis
```

**Frontend Apps:**
```bash
cd apps/os-pm  # Repeat for each app
pnpm add @sentry/nextjs posthog-js @kealee/ui
```

### 2. Add Database Models

Add to `packages/database/prisma/schema.prisma`:

```prisma
// Copy from schema-monitoring-additions.prisma
model ApiRequestLog { ... }
model PerformanceMetric { ... }
model UserEvent { ... }
```

Then migrate:
```bash
cd packages/database
pnpm prisma migrate dev --name add_monitoring_models
```

### 3. Environment Variables

**API (.env):**
```bash
SENTRY_DSN=https://xxx@sentry.io/xxx
REDIS_URL=redis://localhost:6379
```

**Frontend (.env.local):**
```bash
NEXT_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx
NEXT_PUBLIC_POSTHOG_KEY=ph_xxx
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

### 4. Update App Layouts

Add to each app's `layout.tsx`:

```tsx
import { AnalyticsProvider } from '@kealee/ui'

<AnalyticsProvider>
  {children}
</AnalyticsProvider>
```

## ✅ Done!

Monitoring is now active across all apps!
