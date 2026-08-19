# Vercel Deployment Setup Guide

## Overview

This guide covers setting up all 7 Kealee Platform apps in Vercel, configuring domains, environment variables, and monitoring.

---

## Apps and Domains

| App | Domain | Port (Local) |
|-----|--------|--------------|
| m-marketplace | marketplace.kealee.com | 3000 |
| os-admin | admin.kealee.com | 3002 |
| os-pm | pm.kealee.com | 3003 |
| m-ops-services | ops.kealee.com | 3004 |
| m-project-owner | app.kealee.com | 3005 |
| m-architect | architect.kealee.com | 3006 |
| m-permits-inspections | permits.kealee.com | 3007 |

---

## 1. Prerequisites

### Install Vercel CLI
```bash
npm install -g vercel
```

### Login to Vercel
```bash
vercel login
```

### Verify Organization
```bash
vercel teams ls
# Should show: kealee
```

---

## 2. Add Projects to Vercel

### Option A: Using Script
```bash
./scripts/setup-vercel-projects.sh
```

### Option B: Manual Setup

For each app:

```bash
cd apps/m-marketplace
vercel link --scope=kealee --project=m-marketplace
vercel

cd ../os-admin
vercel link --scope=kealee --project=os-admin
vercel

# ... repeat for all apps
```

---

## 3. Configure Domains

### Option A: Using Script
```bash
./scripts/setup-vercel-projects.sh
```

### Option B: Manual Setup

```bash
# Add domains to projects
vercel domains add marketplace.kealee.com --scope=kealee
vercel domains add admin.kealee.com --scope=kealee
vercel domains add pm.kealee.com --scope=kealee
vercel domains add ops.kealee.com --scope=kealee
vercel domains add app.kealee.com --scope=kealee
vercel domains add architect.kealee.com --scope=kealee
vercel domains add permits.kealee.com --scope=kealee
```

### DNS Configuration

For each domain, add CNAME record:
```
Type: CNAME
Name: @ (or subdomain)
Value: cname.vercel-dns.com
```

Or use A record:
```
Type: A
Name: @
Value: 76.76.21.21
```

---

## 4. Environment Variables Setup

### Option A: Using Script
```bash
# Create .env.production file with all variables
./scripts/setup-vercel-env-vars.sh .env.production
```

### Option B: Manual Setup (Vercel Dashboard)

1. Go to Vercel Dashboard → Project → Settings → Environment Variables
2. Add each variable for Production, Preview, and Development
3. Use the templates from `ENVIRONMENT_VARIABLES_SETUP.md`

### Option C: Using Vercel CLI

```bash
# For each app
cd apps/m-marketplace
vercel env add NEXT_PUBLIC_API_URL production
# Enter value when prompted
vercel env add NEXT_PUBLIC_SUPABASE_URL production
# ... repeat for all variables
```

### Common Variables for All Apps

```bash
# Set for all apps
for app in m-marketplace os-admin os-pm m-ops-services m-project-owner m-architect m-permits-inspections; do
  cd apps/$app
  vercel env add NEXT_PUBLIC_API_URL production
  vercel env add NEXT_PUBLIC_SUPABASE_URL production
  vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
  vercel env add NEXT_PUBLIC_SENTRY_DSN production
  cd ../..
done
```

---

## 5. Monitoring Setup

### Sentry

1. **Create Projects**
   ```bash
   npm install -g @sentry/cli
   sentry-cli login
   
   for app in m-marketplace os-admin os-pm m-ops-services m-project-owner m-architect m-permits-inspections; do
     sentry-cli projects create $app --org kealee
   done
   ```

2. **Get DSNs**
   - Go to Sentry Dashboard → Projects
   - Copy DSN for each project
   - Add to Vercel environment variables: `NEXT_PUBLIC_SENTRY_DSN`

3. **Install in Apps**
   ```bash
   cd apps/m-marketplace
   npm install @sentry/nextjs
   npx @sentry/wizard@latest -i nextjs
   ```

### LogRocket

1. **Create Projects**
   - Go to https://logrocket.com
   - Create project for each app
   - Get app ID for each

2. **Install**
   ```bash
   npm install logrocket
   ```

3. **Initialize**
   ```typescript
   // apps/m-marketplace/lib/logrocket.ts
   import LogRocket from 'logrocket';
   
   if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_LOGROCKET_APP_ID) {
     LogRocket.init(process.env.NEXT_PUBLIC_LOGROCKET_APP_ID);
   }
   ```

### Datadog

1. **Create API Key**
   - Go to Datadog Dashboard → Organization Settings → API Keys
   - Create new API key

2. **Set up RUM**
   - Go to Datadog Dashboard → RUM Applications
   - Create application
   - Get client token

3. **Install**
   ```bash
   npm install @datadog/browser-rum
   ```

4. **Initialize**
   ```typescript
   // apps/m-marketplace/lib/datadog.ts
   import { datadogRum } from '@datadog/browser-rum';
   
   if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_DATADOG_CLIENT_TOKEN) {
     datadogRum.init({
       applicationId: process.env.NEXT_PUBLIC_DATADOG_APP_ID!,
       clientToken: process.env.NEXT_PUBLIC_DATADOG_CLIENT_TOKEN!,
       site: 'datadoghq.com',
       service: 'm-marketplace',
       env: 'production',
       version: '1.0.0',
       sampleRate: 100,
       trackInteractions: true,
     });
   }
   ```

### UptimeRobot

1. **Create Account**
   - Go to https://uptimerobot.com
   - Create account

2. **Add Monitors**
   - For each domain, create HTTPS monitor
   - Set check interval: 5 minutes
   - Set alert contacts

3. **Monitor Endpoints**
   - `https://api.kealee.com/health` (Backend API)
   - `https://marketplace.kealee.com` (Marketplace)
   - `https://admin.kealee.com` (Admin)
   - `https://pm.kealee.com` (PM)
   - `https://ops.kealee.com` (Ops Services)
   - `https://app.kealee.com` (Project Owner)
   - `https://architect.kealee.com` (Architect)
   - `https://permits.kealee.com` (Permits)

---

## 6. Deployment

### First Deployment

```bash
# For each app
cd apps/m-marketplace
vercel --prod

cd ../os-admin
vercel --prod

# ... repeat for all apps
```

### Continuous Deployment

Vercel automatically deploys when you push to:
- `main` branch → Production
- Other branches → Preview

Configure in Vercel Dashboard → Project → Settings → Git

---

## 7. Verification Checklist

### For Each App

- [ ] Project linked to Vercel
- [ ] Domain configured
- [ ] DNS records updated
- [ ] Environment variables set
- [ ] Build succeeds
- [ ] Deployment successful
- [ ] Domain accessible
- [ ] SSL certificate valid
- [ ] Monitoring configured
- [ ] Error tracking working

---

## 8. Troubleshooting

### Build Failures

1. Check build logs in Vercel Dashboard
2. Verify environment variables are set
3. Check for missing dependencies
4. Verify Node.js version compatibility

### Domain Issues

1. Verify DNS records are correct
2. Check domain verification in Vercel
3. Wait for DNS propagation (up to 48 hours)
4. Check SSL certificate status

### Environment Variable Issues

1. Verify variables are set for correct environment (Production/Preview/Development)
2. Check variable names match exactly (case-sensitive)
3. Verify values don't have extra spaces
4. Check if variables are encrypted (sensitive values)

---

## 9. Quick Reference

### Vercel CLI Commands

```bash
# Login
vercel login

# Link project
vercel link

# Deploy
vercel --prod

# View deployments
vercel ls

# View logs
vercel logs

# Add environment variable
vercel env add VARIABLE_NAME production

# List environment variables
vercel env ls

# Remove environment variable
vercel env rm VARIABLE_NAME production
```

### Scripts Available

- `scripts/setup-vercel-projects.sh` - Set up all projects
- `scripts/setup-vercel-env-vars.sh` - Bulk set environment variables
- `scripts/setup-monitoring.sh` - Set up monitoring services
- `scripts/setup-s3-r2-storage.sh` - Set up file storage
- `scripts/test-file-upload.sh` - Test file uploads

---

## Next Steps

1. Run setup scripts
2. Configure domains
3. Set environment variables
4. Set up monitoring
5. Deploy to production
6. Verify all apps are accessible
7. Set up alerts
8. Monitor performance
