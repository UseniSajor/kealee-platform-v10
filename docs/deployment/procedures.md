# Deployment Procedures

## Prerequisites

### Required Tools

```bash
# Install required tools
npm install -g vercel@latest
npm install -g @sentry/cli

# macOS
brew install postgresql redis

# Ubuntu/Debian
apt-get install postgresql redis

# Windows
# Use WSL or install PostgreSQL and Redis separately
```

### Environment Setup

1. **Node.js 18+** - Required for all applications
2. **pnpm 8+** - Package manager
3. **PostgreSQL 15+** - Database
4. **Redis** - Caching and queues
5. **Vercel CLI** - Deployment
6. **Git** - Version control

## Technology Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: React Context + SWR
- **Authentication**: NextAuth.js

### Backend
- **Runtime**: Node.js 18+
- **API Framework**: Next.js API Routes (Frontend apps) + Fastify (API service)
- **Database**: PostgreSQL 15
- **ORM**: Prisma
- **Cache**: Redis/Upstash

### Infrastructure
- **Hosting**: Vercel (All apps)
- **DNS**: Cloudflare
- **Monitoring**: Sentry, Datadog
- **CI/CD**: GitHub Actions + Vercel
- **Storage**: AWS S3 / Cloudflare R2

### External Services
- **Payments**: Stripe
- **Email**: SendGrid
- **SMS**: Twilio
- **Documents**: DocuSign
- **Analytics**: Google Analytics, Hotjar

## Application Portfolio

| Application | URL | Purpose | Tech Stack |
|------------|-----|---------|------------|
| m-marketplace | https://marketplace.kealee.com | Contractor marketplace | Next.js, Stripe, Mapbox |
| os-admin | https://admin.kealee.com | Internal admin dashboard | Next.js, Prisma, Recharts |
| os-pm | https://pm.kealee.com | Project management | Next.js, DnD Kit, Calendar |
| m-ops-services | https://ops.kealee.com | Operations & services | Next.js, Stripe, Webhooks |
| m-project-owner | https://projects.kealee.com | Client project portal | Next.js, DocuSign, File upload |
| m-architect | https://architect.kealee.com | Architect tools | Next.js, S3, 3D viewer |
| m-permits-inspections | https://permits.kealee.com | Permit management | Next.js, GIS, Calendar |

## Data Flow

1. **User Request** → Cloudflare CDN → Vercel Edge
2. **API Call** → API Gateway → Backend Service
3. **Database** → PostgreSQL (Primary) → Redis (Cache)
4. **File Upload** → S3/R2 → CDN Delivery
5. **Payment** → Stripe API → Webhook → Database
6. **Monitoring** → Sentry/Datadog → Alerting

## Pre-Deployment Checklist

### 1. Code Quality
- [ ] All tests passing
- [ ] Linting passes
- [ ] Type checking passes
- [ ] No console errors
- [ ] Code review completed

### 2. Environment Variables
- [ ] All required env vars set in Vercel
- [ ] Database connection string verified
- [ ] API keys configured
- [ ] Stripe keys set (test/production)
- [ ] Supabase credentials configured

### 3. Database
- [ ] Migrations reviewed
- [ ] Backup created
- [ ] Migration script tested
- [ ] Data integrity verified

### 4. Dependencies
- [ ] All dependencies installed
- [ ] Lock files committed
- [ ] No security vulnerabilities
- [ ] Build succeeds locally

### 5. Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] API endpoint tests pass
- [ ] Payment flow tested

## Deployment Steps

### 1. API Service Deployment

```bash
# 1. Navigate to API service
cd services/api

# 2. Run database migrations
cd ../../packages/database
../../scripts/run-database-migrations.sh

# 3. Build API service
cd ../api
pnpm build

# 4. Test locally
pnpm start

# 5. Deploy to Railway (or your hosting)
# Railway automatically deploys on git push
# Or use Railway CLI:
railway up
```

### 2. Frontend Application Deployment

```bash
# 1. Navigate to application
cd apps/m-ops-services  # or other app

# 2. Build locally (optional, for testing)
pnpm build

# 3. Deploy to Vercel
vercel --prod

# Or push to main branch (auto-deploy)
git push origin main
```

### 3. Database Migration

```bash
# 1. Create backup
cd packages/database
../../scripts/run-database-migrations.sh

# 2. Review migration status
npx prisma migrate status

# 3. Apply migrations
npx prisma migrate deploy

# 4. Verify
npx prisma studio  # Optional: verify data
```

### 4. Environment Variables

```bash
# Use Vercel CLI or dashboard
vercel env add DATABASE_URL production
vercel env add STRIPE_SECRET_KEY production
vercel env add SUPABASE_URL production
# ... etc

# Or use configuration script
./scripts/configure-vercel-env.sh
```

## Post-Deployment Verification

### 1. Health Checks

```bash
# API health
curl https://api.kealee.com/health

# Application health
curl https://ops.kealee.com/api/health
```

### 2. Smoke Tests

```bash
# Run staging tests
./scripts/test-staging.sh https://ops.kealee.com

# Run API endpoint tests
./scripts/test-all-api-endpoints.sh
```

### 3. Monitoring

- [ ] Check Sentry for errors
- [ ] Verify Datadog metrics
- [ ] Check Vercel analytics
- [ ] Review Railway logs

### 4. User Acceptance

- [ ] Test critical user flows
- [ ] Verify payment processing
- [ ] Check file uploads
- [ ] Test authentication

## Rollback Procedures

### Quick Rollback (Vercel)

```bash
# List deployments
vercel ls

# Rollback to previous deployment
vercel rollback [deployment-url]
```

### Database Rollback

```bash
# Restore from backup
cd packages/database
psql $DATABASE_URL < backups/db_backup_*.sql

# Or reset migrations
npx prisma migrate reset
```

### API Service Rollback

```bash
# Railway: Use dashboard to rollback
# Or redeploy previous version
git checkout [previous-commit]
railway up
```

## Monitoring & Alerts

### Sentry Setup

```bash
# Install Sentry CLI
npm install -g @sentry/cli

# Configure Sentry
sentry-cli login
sentry-cli releases new [version]
sentry-cli releases finalize [version]
```

### Datadog Setup

1. Create Datadog account
2. Install Datadog agent (if needed)
3. Configure API keys in Vercel
4. Set up dashboards and alerts

## Troubleshooting

### Common Issues

#### Build Failures
```bash
# Clear cache and rebuild
rm -rf .next node_modules
pnpm install
pnpm build
```

#### Database Connection Issues
```bash
# Test connection
psql $DATABASE_URL -c "SELECT 1;"

# Check migrations
cd packages/database
npx prisma migrate status
```

#### Environment Variable Issues
```bash
# Verify env vars
vercel env ls

# Pull env vars locally
vercel env pull .env.local
```

## Best Practices

1. **Always test in staging first**
2. **Create backups before migrations**
3. **Deploy during low-traffic periods**
4. **Monitor closely after deployment**
5. **Have rollback plan ready**
6. **Document all changes**
7. **Use feature flags for risky changes**
8. **Gradual rollout for major changes**

## CI/CD Integration

### GitHub Actions

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
      - run: pnpm install
      - run: pnpm build
      - run: pnpm test
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

## Support

For deployment issues:
1. Check deployment logs
2. Review error messages
3. Verify environment variables
4. Test locally first
5. Contact DevOps team
