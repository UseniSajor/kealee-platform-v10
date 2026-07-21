# Staging Deployment Guide

Complete guide for deploying all applications to Vercel staging environment.

## Quick Start

### Deploy All Apps

```bash
# Deploy all applications to staging
./scripts/deploy-staging.sh

# Or using npm script
npm run deploy:staging
```

### Deploy Individual App

```bash
# Navigate to app directory
cd apps/m-marketplace

# Deploy to staging
npm run deploy:staging

# Or use Vercel CLI directly
vercel --yes --prod=false
```

## Prerequisites

### 1. Install Vercel CLI

```bash
npm install -g vercel@latest
```

### 2. Login to Vercel

```bash
vercel login
```

### 3. Link Projects (First Time)

For each application, link it to a Vercel project:

```bash
cd apps/m-marketplace
vercel link
```

## Applications

| Application | Directory | Deploy Command |
|------------|-----------|----------------|
| m-marketplace | `apps/m-marketplace` | `npm run deploy:staging` |
| os-admin | `apps/os-admin` | `npm run deploy:staging` |
| os-pm | `apps/os-pm` | `npm run deploy:staging` |
| m-ops-services | `apps/m-ops-services` | `npm run deploy:staging` |
| m-project-owner | `apps/m-project-owner` | `npm run deploy:staging` |
| m-architect | `apps/m-architect` | `npm run deploy:staging` |
| m-permits-inspections | `apps/m-permits-inspections` | `npm run deploy:staging` |

## Deployment Process

### Automated Deployment (All Apps)

The `deploy-staging.sh` script:

1. ✅ Validates Vercel CLI is installed
2. ✅ Checks if logged in to Vercel
3. ✅ Builds each application
4. ✅ Deploys to staging (preview environment)
5. ✅ Reports deployment URLs
6. ✅ Provides summary

### Manual Deployment (Single App)

1. **Navigate to app directory:**
   ```bash
   cd apps/m-marketplace
   ```

2. **Build the application:**
   ```bash
   pnpm build
   ```

3. **Deploy to staging:**
   ```bash
   npm run deploy:staging
   # Or: vercel --yes --prod=false
   ```

## Environment Variables

Ensure staging environment variables are set in Vercel:

```bash
# Set environment variables for staging
vercel env add DATABASE_URL staging
vercel env add STRIPE_SECRET_KEY staging
vercel env add SUPABASE_URL staging
# ... etc
```

Or use the configuration script:

```bash
./scripts/configure-vercel-env.sh
```

## Verification

### Check Deployment Status

```bash
# List recent deployments
vercel ls

# View deployment details
vercel inspect [deployment-url]
```

### Test Staging Deployment

```bash
# Run staging tests
./scripts/test-staging.sh https://your-app.vercel.app
```

## Troubleshooting

### Build Failures

1. **Check build logs:**
   ```bash
   vercel logs [deployment-url]
   ```

2. **Build locally first:**
   ```bash
   cd apps/m-marketplace
   pnpm build
   ```

3. **Check environment variables:**
   ```bash
   vercel env ls
   ```

### Deployment Failures

1. **Verify Vercel project is linked:**
   ```bash
   cd apps/m-marketplace
   vercel link
   ```

2. **Check Vercel project settings:**
   - Framework preset
   - Build command
   - Output directory
   - Install command

3. **Review Vercel dashboard:**
   - Check deployment logs
   - Verify project configuration
   - Check team/organization settings

### Environment Variable Issues

1. **List environment variables:**
   ```bash
   vercel env ls
   ```

2. **Add missing variables:**
   ```bash
   vercel env add VARIABLE_NAME staging
   ```

3. **Verify variable values:**
   ```bash
   vercel env pull .env.local
   cat .env.local
   ```

## Best Practices

1. **Always test locally first:**
   ```bash
   pnpm build
   pnpm start
   ```

2. **Run pre-deployment checklist:**
   ```bash
   ./scripts/pre-deployment-checklist.sh
   ```

3. **Deploy during low-traffic periods**

4. **Monitor deployments:**
   - Check Vercel dashboard
   - Review deployment logs
   - Test critical user flows

5. **Keep staging environment updated:**
   - Regular deployments
   - Test new features
   - Verify integrations

## Rollback

### Rollback Deployment

```bash
# List deployments
vercel ls

# Rollback to previous deployment
vercel rollback [deployment-url]
```

### Or via Vercel Dashboard

1. Go to Vercel dashboard
2. Select project
3. Go to Deployments
4. Click on previous deployment
5. Click "Promote to Production" or redeploy

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Deploy to Staging

on:
  push:
    branches: [develop]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
      
      - run: pnpm install
      - run: pnpm build
      
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod=false'
```

## Support

For deployment issues:
1. Check Vercel dashboard logs
2. Review deployment configuration
3. Verify environment variables
4. Test locally first
5. Contact DevOps team
