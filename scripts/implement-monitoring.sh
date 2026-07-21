#!/bin/bash
# scripts/implement-monitoring.sh
# Implement monitoring setup - install packages and configure code

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[MONITORING]${NC} $1"
}

success() {
    echo -e "${GREEN}✅${NC} $1"
}

fail() {
    echo -e "${RED}❌${NC} $1"
}

warn() {
    echo -e "${YELLOW}⚠️${NC} $1"
}

echo "🔍 Implementing Monitoring Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "This script helps you implement monitoring in your applications."
echo ""

# Applications
APPS=(
    "m-marketplace"
    "os-admin"
    "os-pm"
    "m-ops-services"
    "m-project-owner"
    "m-architect"
    "m-permits-inspections"
)

# Step 1: Install Sentry packages
echo "📦 Step 1: Installing Sentry Packages"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

read -p "Install Sentry packages for Next.js apps? (y/N): " INSTALL_SENTRY

if [ "$INSTALL_SENTRY" = "y" ] || [ "$INSTALL_SENTRY" = "Y" ]; then
    for app in "${APPS[@]}"; do
        APP_DIR="apps/$app"
        if [ -d "$APP_DIR" ] && [ -f "$APP_DIR/package.json" ]; then
            log "Installing Sentry in $app..."
            cd "$APP_DIR"
            
            if npm install @sentry/nextjs 2>&1 | grep -q "error\|Error"; then
                warn "  Failed to install Sentry (may already be installed)"
            else
                success "  Sentry installed"
            fi
            
            cd ../..
        fi
    done
fi

# Step 2: Install Datadog packages
echo ""
echo "📦 Step 2: Installing Datadog Packages"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

read -p "Install Datadog packages? (y/N): " INSTALL_DATADOG

if [ "$INSTALL_DATADOG" = "y" ] || [ "$INSTALL_DATADOG" = "Y" ]; then
    # Next.js apps
    for app in "${APPS[@]}"; do
        APP_DIR="apps/$app"
        if [ -d "$APP_DIR" ] && [ -f "$APP_DIR/package.json" ]; then
            log "Installing Datadog in $app..."
            cd "$APP_DIR"
            
            if npm install @datadog/nextjs 2>&1 | grep -q "error\|Error"; then
                warn "  Failed to install Datadog (may already be installed)"
            else
                success "  Datadog installed"
            fi
            
            cd ../..
        fi
    done
    
    # API service
    if [ -d "services/api" ]; then
        log "Installing Datadog in API service..."
        cd services/api
        
        if npm install dd-trace 2>&1 | grep -q "error\|Error"; then
            warn "  Failed to install Datadog (may already be installed)"
        else
            success "  Datadog installed"
        fi
        
        cd ../..
    fi
fi

# Step 3: Generate configuration files
echo ""
echo "📝 Step 3: Generating Configuration Files"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Generate Sentry configuration template
SENTRY_CONFIG_TEMPLATE="templates/sentry.config.js"
mkdir -p templates
log "Generating Sentry configuration template..."

cat > "$SENTRY_CONFIG_TEMPLATE" << 'SENTRY_TEMPLATE_EOF'
// sentry.config.js
// Sentry configuration for Next.js apps

/** @type {import('@sentry/nextjs').SentryWebpackPluginOptions} */
const sentryConfig = {
  // Suppresses source map uploading logs during build
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options
};

module.exports = sentryConfig;
SENTRY_TEMPLATE_EOF

success "Sentry config template created: $SENTRY_CONFIG_TEMPLATE"

# Generate Sentry client configuration
SENTRY_CLIENT_TEMPLATE="templates/sentry.client.config.ts"
log "Generating Sentry client configuration template..."

cat > "$SENTRY_CLIENT_TEMPLATE" << 'SENTRY_CLIENT_EOF'
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  debug: false,
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  integrations: [
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
});
SENTRY_CLIENT_EOF

success "Sentry client config template created: $SENTRY_CLIENT_TEMPLATE"

# Generate Datadog configuration template
DATADOG_CONFIG_TEMPLATE="templates/datadog.config.js"
log "Generating Datadog configuration template..."

cat > "$DATADOG_CONFIG_TEMPLATE" << 'DATADOG_TEMPLATE_EOF
// datadog.config.js
// Datadog RUM configuration for Next.js apps

export const datadogConfig = {
  applicationId: process.env.NEXT_PUBLIC_DD_RUM_APPLICATION_ID,
  clientToken: process.env.NEXT_PUBLIC_DD_RUM_CLIENT_TOKEN,
  site: process.env.DATADOG_SITE || 'datadoghq.com',
  service: process.env.DD_SERVICE || 'kealee-app',
  env: process.env.DD_ENV || process.env.NODE_ENV,
  version: process.env.DD_VERSION || '1.0.0',
  sampleRate: 100,
  trackInteractions: true,
  trackResources: true,
  trackLongTasks: true,
  defaultPrivacyLevel: 'mask-user-input',
};
DATADOG_TEMPLATE_EOF

success "Datadog config template created: $DATADOG_CONFIG_TEMPLATE"

# Generate API Datadog configuration
DATADOG_API_TEMPLATE="templates/datadog-api.config.ts"
log "Generating Datadog API configuration template..."

cat > "$DATADOG_API_TEMPLATE" << 'DATADOG_API_EOF
// datadog-api.config.ts
// Datadog APM configuration for API service

import tracer from 'dd-trace';

tracer.init({
  service: process.env.DD_SERVICE || 'kealee-api',
  env: process.env.DD_ENV || process.env.NODE_ENV,
  version: process.env.DD_VERSION || '1.0.0',
  logInjection: true,
  runtimeMetrics: true,
  profiling: true,
});

export default tracer;
DATADOG_API_EOF

success "Datadog API config template created: $DATADOG_API_TEMPLATE"

# Generate implementation guide
IMPLEMENTATION_GUIDE="docs/MONITORING_IMPLEMENTATION_GUIDE.md"
log "Generating implementation guide..."

cat > "$IMPLEMENTATION_GUIDE" << 'GUIDE_EOF
# Monitoring Implementation Guide

Complete guide for implementing monitoring in Kealee Platform.

## Overview

This guide covers implementing:
- ✅ Sentry (Error Monitoring)
- ✅ Datadog (APM & RUM)
- ✅ Uptime Monitoring (External Service)

## Step 1: Review Configuration Files

Review the generated configuration files:
- `sentry-config.txt` - Sentry project configuration
- `datadog-config.txt` - Datadog integration configuration
- `uptime-monitoring-config.txt` - Uptime monitoring endpoints

## Step 2: Create Projects/Accounts

### Sentry

1. Go to https://sentry.io
2. Create organization (if needed)
3. For each app, create a project:
   - Platform: Next.js (for frontend apps)
   - Platform: Node.js (for API)
   - Project name: `kealee-<app-name>`
4. Get DSN from: Settings → Client Keys (DSN)

### Datadog

1. Go to https://www.datadoghq.com
2. Sign up or log in
3. Get API key: Organization Settings → API Keys
4. Create RUM application: RUM → Applications → New Application
5. Get Application ID and Client Token

### Uptime Monitoring

1. Sign up for monitoring service:
   - UptimeRobot: https://uptimerobot.com
   - Pingdom: https://www.pingdom.com
   - StatusCake: https://www.statuscake.com
2. Create monitors for each endpoint
3. Configure alert notifications

## Step 3: Get API Keys and DSNs

### Sentry DSNs

For each app, get the DSN:
```
https://<key>@<org>.ingest.sentry.io/<project-id>
```

### Datadog Credentials

- API Key: From Organization Settings
- Application ID: From RUM Application
- Client Token: From RUM Application

## Step 4: Set Environment Variables

### Vercel (Frontend Apps)

For each app in Vercel dashboard:

```bash
# Sentry
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
SENTRY_ORG=your-org
SENTRY_PROJECT=kealee-<app-name>
SENTRY_AUTH_TOKEN=your-auth-token

# Datadog
NEXT_PUBLIC_DD_RUM_APPLICATION_ID=...
NEXT_PUBLIC_DD_RUM_CLIENT_TOKEN=...
DATADOG_SITE=datadoghq.com
DD_SERVICE=kealee-<app-name>
DD_ENV=production
DD_VERSION=1.0.0
```

### Railway (API Service)

```bash
# Sentry
SENTRY_DSN=https://...@sentry.io/...
SENTRY_ORG=your-org
SENTRY_PROJECT=kealee-api

# Datadog
DD_SERVICE=kealee-api
DD_ENV=production
DD_VERSION=1.0.0
DATADOG_API_KEY=your-api-key
```

## Step 5: Install Monitoring Packages

### Next.js Apps (Sentry)

```bash
cd apps/m-marketplace
npm install @sentry/nextjs
```

### Next.js Apps (Datadog)

```bash
cd apps/m-marketplace
npm install @datadog/nextjs
```

### API Service (Datadog)

```bash
cd services/api
npm install dd-trace
```

## Step 6: Configure Monitoring in Code

### Sentry - Next.js Apps

1. **Create `sentry.config.js`** in app root:

```javascript
// sentry.config.js
module.exports = {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
};
```

2. **Create `sentry.client.config.ts`**:

```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

3. **Create `sentry.server.config.ts`**:

```typescript
// sentry.server.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

4. **Update `next.config.js`**:

```javascript
const { withSentryConfig } = require('@sentry/nextjs');

module.exports = withSentryConfig(
  {
    // Your Next.js config
  },
  {
    // Sentry config
  }
);
```

### Datadog - Next.js Apps

1. **Create `datadog.config.js`**:

```javascript
// datadog.config.js
export const datadogConfig = {
  applicationId: process.env.NEXT_PUBLIC_DD_RUM_APPLICATION_ID,
  clientToken: process.env.NEXT_PUBLIC_DD_RUM_CLIENT_TOKEN,
  site: 'datadoghq.com',
  service: 'kealee-<app-name>',
  env: 'production',
};
```

2. **Initialize in `app/layout.tsx`**:

```typescript
// app/layout.tsx
import { datadogRum } from '@datadog/browser-rum';
import { datadogConfig } from '../datadog.config';

if (typeof window !== 'undefined' && datadogConfig.applicationId) {
  datadogRum.init({
    ...datadogConfig,
    sampleRate: 100,
  });
}
```

### Datadog - API Service

1. **Create `datadog.config.ts`**:

```typescript
// datadog.config.ts
import tracer from 'dd-trace';

tracer.init({
  service: 'kealee-api',
  env: process.env.NODE_ENV,
  version: '1.0.0',
});

export default tracer;
```

2. **Import at top of `src/index.ts`**:

```typescript
// src/index.ts
import './datadog.config';
// ... rest of imports
```

## Step 7: Set Up Dashboards and Alerts

### Sentry Dashboards

1. Go to Sentry dashboard
2. Create custom dashboards for:
   - Error rates by app
   - Performance metrics
   - Release tracking
3. Set up alerts:
   - Error rate threshold
   - Performance degradation
   - Release issues

### Datadog Dashboards

1. Go to Datadog dashboard
2. Create dashboards for:
   - Application Performance (APM)
   - Real User Monitoring (RUM)
   - Infrastructure metrics
3. Set up monitors:
   - Error rate > 1%
   - Response time > 2s
   - Memory usage > 80%

### Uptime Monitoring Alerts

1. Configure alert contacts:
   - Email (primary)
   - Slack (team notifications)
   - PagerDuty (critical)
2. Set alert thresholds:
   - Down for 2 consecutive checks
   - Response time > 5s

## Verification

### Test Sentry

```bash
# Trigger a test error
# Should appear in Sentry dashboard within seconds
```

### Test Datadog

```bash
# Check RUM data in Datadog dashboard
# Check APM traces for API calls
```

### Test Uptime Monitoring

```bash
# Temporarily stop a service
# Verify alert is received
# Restart service
# Verify recovery notification
```

## Next Steps

1. ✅ Monitor error rates daily
2. ✅ Review performance metrics weekly
3. ✅ Set up on-call rotation
4. ✅ Document alert response procedures
5. ✅ Regular review of monitoring effectiveness
GUIDE_EOF

success "Implementation guide created: $IMPLEMENTATION_GUIDE"

echo ""
echo "✅ Monitoring Implementation Setup Complete!"
echo ""
echo "📋 Next Steps:"
echo "   1. Review: $IMPLEMENTATION_GUIDE"
echo "   2. Copy configuration templates to apps"
echo "   3. Set environment variables"
echo "   4. Test monitoring integration"
echo ""
