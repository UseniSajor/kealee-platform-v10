# Setup and Deployment - Complete Implementation

## ✅ What Has Been Created

### 1. Test Pipeline Configuration
- **`.github/workflows/test-pipeline.yml`** - Complete CI/CD pipeline with:
  - Unit tests for all 7 apps
  - Integration tests with PostgreSQL and Redis
  - E2E tests with Playwright
  - Performance tests
  - Security scans

### 2. Setup Scripts
- **`scripts/run-all-setup.sh`** - Master setup script that runs all setup steps
- **`scripts/setup-s3-r2-storage.sh`** - S3/R2 storage configuration
- **`scripts/setup-vercel-projects.sh`** - Vercel projects setup
- **`scripts/setup-vercel-env-vars.sh`** - Environment variables setup
- **`scripts/setup-monitoring.sh`** - Monitoring services setup
- **`scripts/setup-alerts.sh`** - Alert configuration

### 3. Testing Scripts
- **`scripts/test-integrations.sh`** - Comprehensive integration tests:
  - API connectivity
  - File uploads
  - Payment flows
  - Subscription flows
  - Permit flows
- **`scripts/test-file-upload.sh`** - File upload testing

### 4. Deployment Scripts
- **`scripts/deploy-staging.sh`** - Deploy all apps to staging
- **`scripts/deploy-production.sh`** - Deploy all apps to production (with safety checks)

### 5. Database SQL Scripts
- **`packages/database/sql/00_run_all.sql`** - Master script to run all SQL scripts
- **`packages/database/sql/01_create_tables.sql`** - Core tables
- **`packages/database/sql/02_create_subscriptions.sql`** - Subscription tables
- **`packages/database/sql/03_create_payments.sql`** - Payment tables
- **`packages/database/sql/04_create_documents.sql`** - File storage tables
- **`packages/database/sql/05_create_projects.sql`** - Project tables
- **`packages/database/sql/06_create_permits.sql`** - Permit tables
- **`packages/database/sql/07_create_inspections.sql`** - Inspection tables
- **`packages/database/sql/08_create_audit_logs.sql`** - Audit log tables
- **`packages/database/sql/09_create_analytics.sql`** - Analytics tables
- **`packages/database/sql/10_seed_data.sql`** - Initial seed data

### 6. Documentation
- **`DEPLOYMENT_WORKFLOW.md`** - Complete deployment guide
- **`VERCEL_DEPLOYMENT_SETUP.md`** - Vercel setup guide
- **`COMPLETE_DEPLOYMENT_GUIDE.md`** - Master deployment guide
- **`DEPLOYMENT_CHECKLIST.md`** - Deployment checklist
- **`packages/database/sql/README.md`** - Database setup guide

### 7. Package.json Scripts
Added npm scripts for easy execution:
- `npm run setup` - Complete setup
- `npm run test:integration` - Integration tests
- `npm run deploy:staging` - Deploy to staging
- `npm run deploy:production` - Deploy to production

---

## 🚀 Quick Start

### 1. Complete Setup

```bash
# Run all setup scripts
npm run setup

# Or run individually
npm run setup:storage      # S3/R2 storage
npm run setup:vercel       # Vercel projects
npm run setup:env          # Environment variables
npm run setup:monitoring   # Monitoring
npm run setup:alerts       # Alerts
```

### 2. Database Setup

```bash
# Set database URL
export DATABASE_URL="postgresql://user:password@localhost:5432/kealee_platform"

# Run database scripts
cd packages/database/sql
psql $DATABASE_URL -f 00_run_all.sql
```

### 3. Run Tests

```bash
# Set API URL and auth token
export API_URL=http://localhost:3001
export AUTH_TOKEN=your_token

# Run integration tests
npm run test:integration

# Run specific tests
npm run test:api
npm run test:payment
npm run test:upload
npm run test:subscription
```

### 4. Deploy to Staging

```bash
# Deploy all apps
npm run deploy:staging

# Verify deployment
npm run test:smoke
```

### 5. Deploy to Production

```bash
# Deploy all apps (with safety checks)
npm run deploy:production

# Verify production
npm run test:smoke:production
```

---

## 📋 Execution Order

### Initial Setup (One-Time)

1. **Database Setup**
   ```bash
   cd packages/database/sql
   psql $DATABASE_URL -f 00_run_all.sql
   ```

2. **Storage Setup**
   ```bash
   export R2_ACCOUNT_ID=...
   export R2_ACCESS_KEY_ID=...
   export R2_SECRET_ACCESS_KEY=...
   npm run setup:storage r2 kealee-uploads
   ```

3. **Vercel Setup**
   ```bash
   vercel login
   npm run setup:vercel
   npm run setup:env
   ```

4. **Monitoring Setup**
   ```bash
   npm run setup:monitoring
   npm run setup:alerts
   ```

### Regular Deployment Workflow

1. **Development**
   - Make changes
   - Run tests locally
   - Commit and push

2. **CI/CD Pipeline**
   - GitHub Actions runs tests automatically
   - Unit tests → Integration tests → E2E tests

3. **Staging Deployment**
   ```bash
   npm run deploy:staging
   npm run test:smoke
   ```

4. **Production Deployment**
   ```bash
   npm run deploy:production
   npm run test:smoke:production
   ```

5. **Monitoring**
   - Monitor error rates
   - Check performance metrics
   - Respond to alerts

---

## 🔍 Testing Coverage

### Integration Tests
- ✅ API connectivity
- ✅ File uploads (small and large)
- ✅ Payment flows
- ✅ Subscription flows
- ✅ Permit flows

### E2E Tests
- ✅ User journey tests
- ✅ Critical workflows
- ✅ Cross-app functionality

### Performance Tests
- ✅ API response times
- ✅ Page load times
- ✅ File upload speeds

### Security Scans
- ✅ npm audit
- ✅ Snyk security scan
- ✅ Dependency checks

---

## 📊 Monitoring & Alerts

### Monitoring Services
- **Sentry** - Error tracking
- **LogRocket** - Session replay
- **Datadog** - Performance monitoring
- **UptimeRobot** - Uptime monitoring

### Alert Configuration
- Error rate > 5% in 5 minutes
- API response time > 2s (P95)
- Uptime < 99.9%
- Payment failures
- File upload failures

---

## 🛠️ Troubleshooting

### Setup Issues
- Check prerequisites (Node.js, npm, PostgreSQL, Vercel CLI)
- Verify environment variables are set
- Check script permissions (on Linux/macOS)

### Test Failures
- Verify API is running
- Check authentication tokens
- Verify database connectivity
- Check test environment configuration

### Deployment Failures
- Check Vercel deployment logs
- Verify environment variables in Vercel
- Check build errors
- Verify domain configuration

---

## ✅ Checklist

### Pre-Deployment
- [ ] All setup scripts run successfully
- [ ] Database tables created
- [ ] Storage configured
- [ ] Vercel projects set up
- [ ] Environment variables configured
- [ ] Monitoring configured
- [ ] Alerts configured

### Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] Performance tests pass
- [ ] Security scans pass

### Staging
- [ ] All apps deployed to staging
- [ ] Smoke tests pass
- [ ] No critical errors
- [ ] Performance acceptable

### Production
- [ ] Staging verified
- [ ] All apps deployed to production
- [ ] Production smoke tests pass
- [ ] Monitoring active
- [ ] Alerts configured

---

## 📚 Documentation

- **`DEPLOYMENT_WORKFLOW.md`** - Complete deployment workflow
- **`VERCEL_DEPLOYMENT_SETUP.md`** - Vercel setup details
- **`COMPLETE_DEPLOYMENT_GUIDE.md`** - Master guide
- **`DEPLOYMENT_CHECKLIST.md`** - Detailed checklist
- **`packages/database/sql/README.md`** - Database setup

---

## 🎯 Next Steps

1. **Run Setup**
   ```bash
   npm run setup
   ```

2. **Configure Credentials**
   - Set environment variables
   - Configure API keys
   - Set up monitoring accounts

3. **Run Tests**
   ```bash
   npm run test:integration
   ```

4. **Deploy to Staging**
   ```bash
   npm run deploy:staging
   ```

5. **Deploy to Production**
   ```bash
   npm run deploy:production
   ```

6. **Monitor**
   - Check error rates
   - Monitor performance
   - Respond to alerts

---

## 🎉 Success!

All setup and deployment scripts are ready. The platform is configured for:
- ✅ Automated testing
- ✅ Staging deployments
- ✅ Production deployments
- ✅ Monitoring and alerts
- ✅ Complete workflow automation
