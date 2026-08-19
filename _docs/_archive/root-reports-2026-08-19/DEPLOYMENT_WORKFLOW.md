# Complete Deployment Workflow

This document outlines the complete deployment workflow for the Kealee Platform V10.

## Overview

The deployment process consists of:
1. **Setup Phase** - Infrastructure and configuration
2. **Testing Phase** - Comprehensive testing
3. **Staging Deployment** - Deploy to staging environment
4. **Production Deployment** - Deploy to production after verification
5. **Monitoring Phase** - Monitor and maintain

---

## Phase 1: Setup

### 1.1 Run All Setup Scripts

```bash
# Run complete setup
npm run setup

# Or run individual setup steps
npm run setup:storage      # S3/R2 storage
npm run setup:vercel       # Vercel projects
npm run setup:env          # Environment variables
npm run setup:monitoring   # Monitoring services
npm run setup:alerts       # Alert configuration
```

### 1.2 Database Setup

```bash
# Set database URL
export DATABASE_URL="postgresql://user:password@localhost:5432/kealee_platform"

# Run database scripts
cd packages/database/sql
psql $DATABASE_URL -f 00_run_all.sql
```

### 1.3 Storage Setup

```bash
# For Cloudflare R2
export R2_ACCOUNT_ID=your_account_id
export R2_ACCESS_KEY_ID=your_access_key
export R2_SECRET_ACCESS_KEY=your_secret_key
npm run setup:storage r2 kealee-uploads

# For AWS S3
export AWS_ACCESS_KEY_ID=your_access_key
export AWS_SECRET_ACCESS_KEY=your_secret_key
export AWS_REGION=us-east-1
npm run setup:storage s3 kealee-uploads
```

### 1.4 Vercel Setup

```bash
# Login to Vercel
vercel login

# Set up projects
npm run setup:vercel

# Set environment variables
npm run setup:env
```

### 1.5 Monitoring Setup

```bash
# Set up monitoring services
npm run setup:monitoring

# Configure alerts
npm run setup:alerts
```

---

## Phase 2: Testing

### 2.1 Integration Tests

```bash
# Set API URL and auth token
export API_URL=http://localhost:3001
export AUTH_TOKEN=your_token

# Run integration tests
npm run test:integration
```

### 2.2 Individual Test Suites

```bash
# API connectivity
npm run test:api

# Payment flows
npm run test:payment

# File uploads
npm run test:upload

# Subscriptions
npm run test:subscription

# E2E tests
npm run test:e2e
```

### 2.3 Performance Tests

```bash
npm run test:performance
```

---

## Phase 3: Staging Deployment

### 3.1 Deploy to Staging

```bash
# Deploy all apps to staging
npm run deploy:staging

# Or deploy individual app
cd apps/m-marketplace
vercel
```

### 3.2 Verify Staging Deployment

```bash
# Run smoke tests
npm run test:smoke

# Check application logs
vercel logs

# Verify all apps are accessible
curl https://staging-marketplace.kealee.com
curl https://staging-admin.kealee.com
# ... etc
```

### 3.3 Fix Issues

If issues are found:
1. Fix the issue
2. Re-run tests
3. Re-deploy to staging
4. Verify fixes

---

## Phase 4: Production Deployment

### 4.1 Pre-Deployment Checklist

- [ ] All staging tests passed
- [ ] All apps deployed to staging
- [ ] No critical errors in staging
- [ ] Performance metrics acceptable
- [ ] Monitoring configured
- [ ] Alerts configured
- [ ] Rollback plan ready

### 4.2 Deploy to Production

```bash
# Deploy all apps to production
npm run deploy:production

# Or deploy individual app
cd apps/m-marketplace
vercel --prod
```

### 4.3 Post-Deployment Verification

```bash
# Run production smoke tests
npm run test:smoke:production

# Verify all apps
curl https://marketplace.kealee.com
curl https://admin.kealee.com
curl https://api.kealee.com/health
```

---

## Phase 5: Monitoring

### 5.1 Monitor Deployments

- **Vercel Dashboard**: Check deployment status
- **Sentry**: Monitor error rates
- **UptimeRobot**: Check uptime
- **Datadog**: Monitor performance

### 5.2 Monitor Application Health

```bash
# Run health check script
bash scripts/check-system-health.sh

# Or set up cron job
crontab -e
# Add: */5 * * * * /path/to/scripts/check-system-health.sh
```

### 5.3 Monitor Key Metrics

- **Error Rates**: Should be < 1%
- **Response Times**: P95 < 2s
- **Uptime**: Should be > 99.9%
- **Payment Success Rate**: Should be > 99%
- **File Upload Success Rate**: Should be > 99%

---

## Quick Reference

### Setup Commands

```bash
npm run setup              # Complete setup
npm run setup:storage      # Storage setup
npm run setup:vercel       # Vercel setup
npm run setup:env          # Environment variables
npm run setup:monitoring   # Monitoring setup
npm run setup:alerts       # Alerts setup
```

### Test Commands

```bash
npm run test:integration   # All integration tests
npm run test:api           # API tests
npm run test:payment       # Payment tests
npm run test:upload        # File upload tests
npm run test:subscription  # Subscription tests
npm run test:e2e           # E2E tests
npm run test:smoke         # Smoke tests
```

### Deployment Commands

```bash
npm run deploy:staging      # Deploy to staging
npm run deploy:production  # Deploy to production
npm run deploy:all         # Full deployment workflow
```

---

## Troubleshooting

### Build Failures

1. Check build logs in Vercel Dashboard
2. Verify environment variables are set
3. Check for missing dependencies
4. Verify Node.js version compatibility

### Deployment Failures

1. Check Vercel deployment logs
2. Verify domain configuration
3. Check DNS records
4. Verify SSL certificates

### Test Failures

1. Check API connectivity
2. Verify authentication tokens
3. Check database connectivity
4. Verify test environment configuration

---

## Rollback Procedure

If production deployment fails:

1. **Immediate Rollback**
   ```bash
   # In Vercel Dashboard → Deployments → Previous deployment → Promote to Production
   ```

2. **Investigate Issue**
   - Check error logs
   - Review recent changes
   - Test in staging

3. **Fix and Redeploy**
   - Fix the issue
   - Test in staging
   - Redeploy to production

---

## Success Criteria

### All Apps
- ✅ Accessible at their domains
- ✅ SSL certificates valid
- ✅ No critical errors
- ✅ Performance acceptable

### Integrations
- ✅ API connectivity working
- ✅ Payment processing working
- ✅ File uploads working
- ✅ Subscriptions working

### Monitoring
- ✅ Error tracking active
- ✅ Performance monitoring active
- ✅ Alerts configured
- ✅ Uptime monitoring active

---

## Next Steps After Deployment

1. Monitor all apps for 24-48 hours
2. Review error logs daily
3. Check performance metrics
4. Gather user feedback
5. Fix any issues found
6. Optimize performance
7. Plan next iteration
