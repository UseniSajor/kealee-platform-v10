# Monitoring Implementation Guide

Complete step-by-step guide for implementing monitoring in Kealee Platform.

## Quick Start

```bash
# Run implementation script
./scripts/implement-monitoring.sh
```

## Step-by-Step Implementation

### Step 1: Review Generated Configuration Files

After running setup scripts, review:

- `sentry-config.txt` - Sentry project configuration
- `datadog-config.txt` - Datadog integration configuration  
- `uptime-monitoring-config.txt` - Uptime monitoring endpoints

### Step 2: Create Projects/Accounts

#### Sentry Projects

1. Go to https://sentry.io
2. Create organization (if needed)
3. For each app, create a project:
   ```
   - Platform: Next.js (for frontend apps)
   - Platform: Node.js (for API service)
   - Project name: kealee-<app-name>
   ```
4. Get DSN from: Settings → Client Keys (DSN)

#### Datadog Setup

1. Go to https://www.datadoghq.com
2. Sign up or log in
3. Get API key: Organization Settings → API Keys
4. Create RUM application:
   - Go to: RUM → Applications → New Application
   - Platform: Browser
   - Get Application ID and Client Token

#### Uptime Monitoring

1. Sign up for monitoring service:
   - UptimeRobot: https://uptimerobot.com
   - Pingdom: https://www.pingdom.com
   - StatusCake: https://www.statuscake.com
2. Create monitors for each endpoint from `uptime-monitoring-config.txt`

### Step 3: Get API Keys and DSNs

#### Sentry DSNs

For each app, get the DSN:
```
https://<key>@<org>.ingest.sentry.io/<project-id>
```

Store in: `sentry-dsns.txt`

#### Datadog Credentials

- **API Key:** From Organization Settings → API Keys
- **Application ID:** From RUM Application settings
- **Client Token:** From RUM Application settings

Store in: `datadog-credentials.txt`

### Step 4: Set Environment Variables

#### Vercel (Frontend Apps)

For each app in Vercel dashboard:

**Sentry:**
```bash
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
SENTRY_ORG=your-org
SENTRY_PROJECT=kealee-<app-name>
SENTRY_AUTH_TOKEN=your-auth-token
```

**Datadog:**
```bash
NEXT_PUBLIC_DD_RUM_APPLICATION_ID=...
NEXT_PUBLIC_DD_RUM_CLIENT_TOKEN=...
DATADOG_SITE=datadoghq.com
DD_SERVICE=kealee-<app-name>
DD_ENV=production
DD_VERSION=1.0.0
```

#### Railway (API Service)

**Sentry:**
```bash
SENTRY_DSN=https://...@sentry.io/...
SENTRY_ORG=your-org
SENTRY_PROJECT=kealee-api
```

**Datadog:**
```bash
DD_SERVICE=kealee-api
DD_ENV=production
DD_VERSION=1.0.0
DATADOG_API_KEY=your-api-key
```

### Step 5: Install Monitoring Packages

#### Sentry - Next.js Apps

```bash
cd apps/m-marketplace
npm install @sentry/nextjs
```

#### Datadog - Next.js Apps

```bash
cd apps/m-marketplace
npm install @datadog/browser-rum @datadog/nextjs
```

#### Datadog - API Service

```bash
cd services/api
npm install dd-trace
```

### Step 6: Configure Monitoring in Code

#### Sentry - Next.js Apps

1. **Copy `sentry.config.js`** to app root:
   ```bash
   cp templates/sentry.config.js apps/m-marketplace/
   ```

2. **Copy `sentry.client.config.ts`**:
   ```bash
   cp templates/sentry.client.config.ts apps/m-marketplace/
   ```

3. **Copy `sentry.server.config.ts`**:
   ```bash
   cp templates/sentry.server.config.ts apps/m-marketplace/
   ```

4. **Update `next.config.js`**:
   ```javascript
   const { withSentryConfig } = require('@sentry/nextjs');
   
   module.exports = withSentryConfig(
     {
       // Your existing Next.js config
     },
     {
       // Sentry webpack plugin options
       silent: true,
       org: process.env.SENTRY_ORG,
       project: process.env.SENTRY_PROJECT,
     }
   );
   ```

#### Datadog - Next.js Apps

1. **Copy `datadog-rum.config.ts`**:
   ```bash
   cp templates/datadog-rum.config.ts apps/m-marketplace/lib/
   ```

2. **Import in `app/layout.tsx`**:
   ```typescript
   // app/layout.tsx
   import '../lib/datadog-rum.config';
   ```

#### Datadog - API Service

1. **Copy `datadog-api.config.ts`**:
   ```bash
   cp templates/datadog-api.config.ts services/api/src/
   ```

2. **Import at top of `src/index.ts`**:
   ```typescript
   // src/index.ts
   import './datadog-api.config';
   // ... rest of imports
   ```

### Step 7: Set Up Dashboards and Alerts

#### Sentry Dashboards

1. **Create Dashboards:**
   - Error rates by app
   - Performance metrics
   - Release tracking
   - User impact

2. **Set Up Alerts:**
   - Error rate > 1%
   - Performance degradation > 20%
   - New issue types
   - Release failures

#### Datadog Dashboards

1. **Create Dashboards:**
   - Application Performance (APM)
   - Real User Monitoring (RUM)
   - Infrastructure metrics
   - Custom business metrics

2. **Set Up Monitors:**
   - Error rate > 1%
   - Response time > 2s (p95)
   - Memory usage > 80%
   - CPU usage > 80%

#### Uptime Monitoring Alerts

1. **Configure Alert Contacts:**
   - Email (primary notifications)
   - Slack (team channel)
   - PagerDuty (critical alerts)
   - SMS (on-call rotation)

2. **Set Alert Thresholds:**
   - Down for 2 consecutive checks
   - Response time > 5s
   - Status code != 200

## Verification

### Test Sentry

1. **Trigger test error:**
   ```typescript
   // In any component
   throw new Error('Test Sentry error');
   ```

2. **Check Sentry dashboard** - Error should appear within seconds

### Test Datadog

1. **Check RUM data:**
   - Navigate to app
   - Check Datadog RUM dashboard
   - Verify sessions are being tracked

2. **Check APM traces:**
   - Make API calls
   - Check Datadog APM dashboard
   - Verify traces are being collected

### Test Uptime Monitoring

1. **Temporarily stop a service**
2. **Verify alert is received** (within check interval)
3. **Restart service**
4. **Verify recovery notification**

## Monitoring Best Practices

### Error Monitoring

- ✅ Set up error rate alerts
- ✅ Review errors daily
- ✅ Prioritize high-impact errors
- ✅ Track error trends over time

### Performance Monitoring

- ✅ Monitor response times (p50, p95, p99)
- ✅ Track database query performance
- ✅ Monitor API endpoint performance
- ✅ Set up performance budgets

### Uptime Monitoring

- ✅ Monitor all critical endpoints
- ✅ Set up status page
- ✅ Configure escalation policies
- ✅ Test alert delivery regularly

## Troubleshooting

### Sentry Not Working

1. Check DSN is set correctly
2. Verify Sentry packages are installed
3. Check browser console for errors
4. Verify source maps are uploaded

### Datadog Not Working

1. Check Application ID and Client Token
2. Verify packages are installed
3. Check browser console for errors
4. Verify API key for APM

### Uptime Monitoring Not Working

1. Verify DNS is configured correctly
2. Check endpoint is accessible
3. Verify alert contacts are configured
4. Test alert delivery

## Next Steps

1. ✅ Monitor error rates daily
2. ✅ Review performance metrics weekly
3. ✅ Set up on-call rotation
4. ✅ Document alert response procedures
5. ✅ Regular review of monitoring effectiveness
6. ✅ Optimize based on monitoring data
