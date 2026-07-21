# Vercel Environment Variable Configuration Guide

This guide explains how to configure environment variables for all Kealee Platform apps on Vercel.

## Overview

The configuration scripts automate the process of setting up environment variables across multiple apps and environments in Vercel.

## Prerequisites

1. **Vercel CLI** - Install globally:
   ```bash
   npm install -g vercel
   ```

2. **Vercel Account** - Login:
   ```bash
   vercel login
   ```

3. **Vercel Token** (Optional but recommended):
   - Get from: https://vercel.com/account/tokens
   - Set as environment variable: `export VERCEL_TOKEN=your_token`

## Quick Start

### Step 1: Create Environment Template

The script will create a `.env.template` file with all required variables. Copy it to `.env.local` and fill in your actual values:

```bash
# On Unix/Linux/macOS
./scripts/configure-vercel-env.sh

# On Windows
.\scripts\configure-vercel-env.ps1
```

### Step 2: Edit .env.local

Open `.env.local` and fill in all the actual values:

```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/database
DATABASE_URL_PRODUCTION=postgresql://user:password@prod-host:5432/database
DATABASE_URL_STAGING=postgresql://user:password@staging-host:5432/database

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# ... etc
```

### Step 3: Run Configuration Script

Run the script again to configure all apps:

```bash
# Unix/Linux/macOS
./scripts/configure-vercel-env.sh

# Windows PowerShell
.\scripts\configure-vercel-env.ps1
```

## Apps Configured

The script configures the following apps:

- **m-marketplace** - Marketplace app
- **os-admin** - Admin dashboard
- **os-pm** - Project management
- **m-ops-services** - Operations services (includes Stripe config)
- **m-project-owner** - Project owner portal (includes DocuSign config)
- **m-architect** - Architect module (includes S3 storage config)
- **m-permits-inspections** - Permits & inspections (includes S3 storage config)

## Environments

Each app is configured for three environments:

- **production** - Production deployment
- **preview** - Preview deployments (PRs, branches)
- **development** - Development environment

## App-Specific Variables

### m-marketplace
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SITE_NAME`
- `NEXT_PUBLIC_GA_MEASUREMENT_ID` (if set)

### m-ops-services
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PUBLISHABLE_KEY`

### m-project-owner
- `DOCUSIGN_INTEGRATION_KEY`
- `DOCUSIGN_SECRET_KEY`
- `DOCUSIGN_ACCOUNT_ID`

### m-architect & m-permits-inspections
- `S3_ACCESS_KEY_ID`
- `S3_SECRET_ACCESS_KEY`
- `S3_BUCKET_NAME`
- `S3_REGION`

## Common Variables

All apps receive these common variables:

- `NODE_ENV` - Environment name
- `APP_NAME` - App name
- `APP_ENV` - Environment type
- `VERCEL_ENV` - Vercel environment
- `VERCEL_GIT_COMMIT_REF` - Git branch (if available)
- `VERCEL_GIT_COMMIT_SHA` - Git commit SHA (if available)
- `DATABASE_URL` - Database connection string
- `NEXT_PUBLIC_API_URL` - Backend API URL

## Backups

The script automatically creates backups of all environment variables in the `backups/` directory:

```
backups/
  env-m-marketplace-20250119-143022.txt
  env-os-admin-20250119-143022.txt
  ...
```

## Testing Environment Variables

After configuration, test that variables are loaded correctly:

```bash
# Test all apps
node scripts/test-env-vars.js
```

This will:
1. Check each app's `/api/env-test` endpoint
2. Verify critical variables are present
3. Report any missing variables

## Manual Configuration

If you prefer to configure manually:

1. Go to Vercel Dashboard
2. Select a project
3. Go to Settings → Environment Variables
4. Add variables for each environment

## Troubleshooting

### Script Fails with "Not logged in"
```bash
vercel login
```

### Script Fails with "Project not found"
The script will attempt to create projects automatically. If it fails:
1. Create the project manually in Vercel Dashboard
2. Run the script again

### Variables Not Appearing
1. Check Vercel Dashboard → Projects → Settings → Environment Variables
2. Verify the correct environment is selected
3. Ensure variables are set for the right environment (production/preview/development)

### Test Endpoint Returns 404
Ensure the `/api/env-test` route exists in your app. It's included in:
- `apps/m-ops-services/app/api/env-test/route.ts`

For other apps, create a similar endpoint or remove them from the test script.

## Security Best Practices

1. **Never commit `.env.local`** - It contains sensitive credentials
2. **Use Vercel Secrets** - For highly sensitive values, consider using Vercel's secret management
3. **Rotate credentials regularly** - Update secrets periodically
4. **Use different values per environment** - Production should have different credentials than staging
5. **Review backups** - Backups contain sensitive data, store securely

## Environment Variable Reference

### Database
- `DATABASE_URL` - Primary database connection
- `DATABASE_URL_POOLER` - Connection pooler URL (optional)
- `DATABASE_URL_PRODUCTION` - Production database
- `DATABASE_URL_STAGING` - Staging database

### Stripe
- `STRIPE_SECRET_KEY` - Stripe secret key (starts with `sk_`)
- `STRIPE_PUBLISHABLE_KEY` - Stripe publishable key (starts with `pk_`)
- `STRIPE_WEBHOOK_SECRET` - Webhook signing secret (starts with `whsec_`)
- `STRIPE_ACCOUNT_ID` - Stripe Connect account ID (optional)

### API
- `API_URL` - Backend API URL
- `NEXT_PUBLIC_API_URL` - Public API URL (exposed to client)

### Authentication
- `NEXTAUTH_URL` - NextAuth.js base URL
- `NEXTAUTH_SECRET` - NextAuth.js secret
- `JWT_SECRET` - JWT signing secret

### Storage (S3/R2)
- `S3_ACCESS_KEY_ID` - S3 access key
- `S3_SECRET_ACCESS_KEY` - S3 secret key
- `S3_BUCKET_NAME` - S3 bucket name
- `S3_REGION` - AWS region
- `S3_ENDPOINT` - S3 endpoint URL

### Email (SendGrid)
- `SMTP_HOST` - SMTP host (usually `smtp.sendgrid.net`)
- `SMTP_PORT` - SMTP port (usually `587`)
- `SMTP_USER` - SMTP username (usually `apikey`)
- `SMTP_PASSWORD` - SendGrid API key
- `EMAIL_FROM` - From email address

### Monitoring
- `SENTRY_DSN` - Sentry DSN for error tracking
- `NEXT_PUBLIC_SENTRY_DSN` - Public Sentry DSN
- `LOGROCKET_ID` - LogRocket project ID

### Analytics
- `NEXT_PUBLIC_GA_MEASUREMENT_ID` - Google Analytics ID
- `NEXT_PUBLIC_FB_PIXEL_ID` - Facebook Pixel ID
- `NEXT_PUBLIC_HOTJAR_ID` - Hotjar ID

### DocuSign
- `DOCUSIGN_INTEGRATION_KEY` - DocuSign integration key
- `DOCUSIGN_SECRET_KEY` - DocuSign secret key
- `DOCUSIGN_ACCOUNT_ID` - DocuSign account ID
- `DOCUSIGN_USER_ID` - DocuSign user ID

## Additional Resources

- [Vercel Environment Variables Documentation](https://vercel.com/docs/concepts/projects/environment-variables)
- [Vercel CLI Documentation](https://vercel.com/docs/cli)
- [Environment Variables Best Practices](./ENVIRONMENT_VARIABLES_SETUP.md)
