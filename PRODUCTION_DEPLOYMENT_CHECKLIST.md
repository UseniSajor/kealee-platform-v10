# Kealee Platform - Production Deployment Checklist

## Pre-Deployment Verification

### 1. Code Quality & Testing
- [ ] All unit tests passing (`pnpm test`)
- [ ] E2E payment flow tests verified
- [ ] Integration tests for escrow/milestone flow passing
- [ ] Load testing completed (target: 100 RPS, p95 < 500ms)
- [ ] Security audit completed on payment endpoints
- [ ] No critical/high severity vulnerabilities in dependencies (`pnpm audit`)
- [ ] TypeScript builds without errors (`pnpm build`)
- [ ] ESLint passes with no errors (`pnpm lint`)

### 2. Database
- [ ] Database migrations ready and tested
- [ ] Rollback scripts prepared
- [ ] Database backup completed
- [ ] Connection pooling configured (min: 5, max: 20)
- [ ] SSL/TLS enabled for database connections
- [ ] Read replicas configured (if applicable)

### 3. Infrastructure
- [ ] Production environment provisioned
- [ ] Auto-scaling configured
- [ ] Load balancer health checks configured
- [ ] SSL certificates installed and valid
- [ ] CDN configured for static assets
- [ ] DNS records updated

### 4. Environment Variables
Required environment variables set:
- [ ] `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_NAME`, `DATABASE_USER`, `DATABASE_PASSWORD`
- [ ] `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`
- [ ] `JWT_SECRET` (min 32 characters)
- [ ] `STRIPE_SECRET_KEY` (production key, starts with `sk_live_`)
- [ ] `STRIPE_PUBLISHABLE_KEY` (production key, starts with `pk_live_`)
- [ ] `STRIPE_WEBHOOK_SECRET` (production webhook secret)
- [ ] `STRIPE_CONNECT_WEBHOOK_SECRET`
- [ ] `SENDGRID_API_KEY`
- [ ] `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `S3_BUCKET`
- [ ] `SENTRY_DSN`
- [ ] `API_BASE_URL`

### 5. Stripe Configuration
- [ ] Production API keys configured
- [ ] Webhook endpoints registered:
  - `POST /webhooks/stripe` - Main webhook
  - `POST /webhooks/stripe/connect` - Connect webhook
- [ ] Products and prices created in Stripe Dashboard:
  - Design packages (BASIC $199, STANDARD $499, PREMIUM $999)
  - Engineering packages (BASIC $1,500, STANDARD $4,500, PREMIUM $12,000)
  - Subscription plans
- [ ] Connect onboarding flow tested
- [ ] Payment methods enabled (Cards, ACH, Wire)

### 6. Feature Flags
Verify rollout configuration:
| Module | Status | Rollout % |
|--------|--------|-----------|
| m-ops-services | Enabled | 100% |
| m-permits-inspections | Enabled | 100% |
| m-project-owner | Enabled | 100% |
| m-architect | Enabled | 100% |
| m-finance-trust | Enabled | 100% |
| m-marketplace | Beta | 50% |
| m-engineer | Beta | 25% |
| m-command-center | Enabled | 100% |

---

## Deployment Steps

### Phase 1: Database Migration
```bash
# 1. Create database backup
pg_dump -h $DATABASE_HOST -U $DATABASE_USER $DATABASE_NAME > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Run migrations
pnpm prisma migrate deploy

# 3. Verify migration success
pnpm prisma migrate status
```

### Phase 2: Deploy API Service
```bash
# 1. Build API
cd services/api
pnpm build

# 2. Deploy to production
# (Use your deployment tool: Docker, Kubernetes, Railway, AWS ECS, etc.)

# 3. Verify health endpoint
curl https://api.kealee.com/health
```

### Phase 3: Deploy Frontend Applications
Deploy in priority order:

1. **m-ops-services** (Main landing & marketing)
```bash
cd apps/m-ops-services
pnpm build
# Deploy to CDN/hosting
```

2. **m-project-owner** (Project owner portal)
```bash
cd apps/m-project-owner
pnpm build
```

3. **m-finance-trust** (Finance & escrow)
```bash
cd apps/m-finance-trust
pnpm build
```

4. **m-engineer** (Engineering services)
```bash
cd apps/m-engineer
pnpm build
```

5. Remaining apps...

### Phase 4: Post-Deployment Verification
```bash
# 1. Verify API health
curl https://api.kealee.com/health
curl https://api.kealee.com/status

# 2. Verify Stripe webhook connectivity
# Send test webhook from Stripe Dashboard

# 3. Test critical user flows
# - User registration/login
# - Create PreCon project
# - Process test payment
# - Verify escrow deposit
```

---

## Monitoring Setup

### 1. Application Monitoring
- [ ] Sentry error tracking configured
- [ ] APM (Application Performance Monitoring) enabled
- [ ] Custom dashboards created

### 2. Infrastructure Monitoring
- [ ] Server metrics (CPU, memory, disk)
- [ ] Database metrics (connections, queries, latency)
- [ ] Redis metrics (memory, connections, hit rate)
- [ ] API response times and error rates

### 3. Business Metrics
- [ ] Payment success/failure rates
- [ ] User registration rates
- [ ] Feature adoption metrics
- [ ] Revenue tracking (3.5% platform commission)

### 4. Alerting
Configure alerts for:
- [ ] API error rate > 1%
- [ ] API p95 latency > 1s
- [ ] Database connection failures
- [ ] Payment failures > 5%
- [ ] Stripe webhook failures
- [ ] Server health check failures

---

## Rollback Plan

### Immediate Rollback (< 5 minutes)
```bash
# 1. Revert to previous deployment
# (Use your deployment tool's rollback feature)

# 2. Verify rollback success
curl https://api.kealee.com/health
```

### Database Rollback
```bash
# Only if migration caused issues
# 1. Restore from backup
psql -h $DATABASE_HOST -U $DATABASE_USER $DATABASE_NAME < backup_YYYYMMDD_HHMMSS.sql

# 2. Verify data integrity
```

---

## Client-Facing Integration Points

All changes reflect in the following locations:

### Marketing Website (m-ops-services)
- `/` - Main landing page with all 8 platform modules
- `/pricing` - Complete pricing page with fee transparency
- All modules listed with pricing and features

### Project Owner Portal (m-project-owner)
- `/dashboard` - PreCon pipeline widget showing active projects
- `/projects` - Full project management with fee display
- Design package selection and payment

### Finance & Trust Hub (m-finance-trust)
- `/` - Escrow dashboard with balance and pending releases
- `/transactions` - Full transaction history
- `/approvals` - Milestone approval workflow

### Engineering Portal (m-engineer)
- `/` - Service offerings overview
- `/pricing` - Package tiers (Basic/Standard/Premium/Enterprise)
- `/projects` - Project dashboard for contractors

### Payment Flow Integration
- PreCon projects: Design package payments ($199-$999)
- Engineering: Service package payments ($1,500-$12,000)
- Escrow: Deposit and milestone release with 3.5% fee
- Subscriptions: Monthly billing with all payment methods

---

## Post-Launch Tasks

### Day 1
- [ ] Monitor error rates and performance
- [ ] Review Stripe webhook logs
- [ ] Check user feedback channels
- [ ] Verify all payment flows working

### Week 1
- [ ] Review performance metrics
- [ ] Analyze user adoption by module
- [ ] Address any critical bugs
- [ ] Adjust rate limits if needed
- [ ] Increase m-marketplace rollout to 75%

### Week 2
- [ ] Increase m-engineer rollout to 50%
- [ ] Review security logs
- [ ] Performance optimization based on data
- [ ] User feedback review

### Month 1
- [ ] Full rollout of all modules (100%)
- [ ] Comprehensive performance review
- [ ] Security audit review
- [ ] Plan next feature releases

---

## Revenue Model Summary

| Product | Price | Platform Fee (3.5%) | Net to Vendor |
|---------|-------|---------------------|---------------|
| Basic Design | $199 | $6.97 | $192.03 |
| Standard Design | $499 | $17.47 | $481.54 |
| Premium Design | $999 | $34.97 | $964.04 |
| Basic Engineering | $1,500 | $52.50 | $1,447.50 |
| Standard Engineering | $4,500 | $157.50 | $4,342.50 |
| Premium Engineering | $12,000 | $420.00 | $11,580.00 |

---

## Sign-off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Engineering Lead | | | |
| QA Lead | | | |
| DevOps Lead | | | |
| Product Owner | | | |

---

## Appendix: Test Commands

```bash
# Run all tests
pnpm test

# Run specific test suites
pnpm test --filter=@kealee/api

# Run E2E tests
cd services/api && pnpm test:e2e

# Run load tests
cd services/api && npx ts-node scripts/load-test.ts all 50 30

# Security audit
pnpm audit

# Build all
pnpm build
```
