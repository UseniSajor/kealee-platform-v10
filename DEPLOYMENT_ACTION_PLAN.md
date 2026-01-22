# 🚀 KEALEE PLATFORM - DEPLOYMENT ACTION PLAN

**Status:** ✅ **ALL DOCUMENTATION COMPLETE - READY TO DEPLOY**  
**Date:** January 22, 2026  
**Target:** Staging Environment (Railway + Vercel)

---

## 📋 QUICK START - 5 STEPS TO PRODUCTION

### ✅ Step 1: Provision Redis in Railway
**Time:** 5 minutes  
**Documentation:** `_docs/REDIS_SETUP_GUIDE.md`

**Actions:**
1. Go to https://railway.app → Your Project
2. Click "+ New" → "Database" → "Add Redis"
3. Link Redis to API service (auto-configures `REDIS_URL`)
4. Link Redis to Worker service
5. Verify in logs: `✅ Redis connected`

---

### ✅ Step 2: Configure Stripe Webhooks
**Time:** 10 minutes  
**Documentation:** `_docs/STRIPE_WEBHOOK_SETUP.md`

**Actions:**
1. Go to https://dashboard.stripe.com/test/webhooks
2. Click "+ Add endpoint"
3. URL: `https://api-staging.kealee.com/webhooks/stripe`
4. Select all payment events (or use preset list in docs)
5. Copy webhook signing secret (`whsec_...`)
6. Add to Railway API service:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```
7. Test with Stripe CLI: `stripe listen --forward-to localhost:3000/webhooks/stripe`

---

### ✅ Step 3: Set Environment Variables
**Time:** 15 minutes  
**Documentation:** `_docs/ENVIRONMENT_VARIABLES.md`

**Railway (API Service):**
```env
# Generate secrets first!
JWT_SECRET=<64-char-secret>          # openssl rand -base64 64
JWT_REFRESH_SECRET=<64-char-secret>
SESSION_SECRET=<32-char-secret>      # openssl rand -base64 32

# Stripe
STRIPE_SECRET_KEY=sk_test_...        # From Stripe dashboard
STRIPE_WEBHOOK_SECRET=whsec_...      # From Step 2

# AWS S3 (or skip for MVP)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=kealee-staging

# Email
RESEND_API_KEY=re_...                # From resend.com

# Sentry
SENTRY_DSN=https://...@sentry.io/... # From sentry.io
```

**Vercel (All Frontend Apps):**
```env
NEXT_PUBLIC_API_URL=https://api-staging.kealee.com
NEXT_PUBLIC_STRIPE_KEY=pk_test_...
```

---

### ✅ Step 4: Run Database Migrations
**Time:** 5 minutes  
**Documentation:** `_docs/DATABASE_MIGRATIONS.md`

**Actions:**
1. Migrations run automatically via Railway release command
2. Verify in Railway logs:
   ```bash
   railway logs -s api-staging --filter "migrate"
   ```
3. Look for: `✓ Prisma Migrate applied X migrations`
4. If failed, run manually:
   ```bash
   railway run pnpm --filter @kealee/database db:migrate:deploy
   ```

---

### ✅ Step 5: Run UAT Tests
**Time:** 2 hours  
**Documentation:** `_docs/UAT_TESTING_GUIDE.md`

**Critical Tests (30 min minimum):**
1. ✅ Health checks (all services respond)
2. ✅ User registration & login
3. ✅ Create contract with escrow
4. ✅ Make test deposit (Stripe test card)
5. ✅ Approve milestone → Release payment
6. ✅ Generate lien waiver

**Full UAT:** Follow comprehensive test plan in docs

---

## 🎯 DEPLOYMENT SEQUENCE

### Phase 1: Pre-Deployment Setup (30 min)

```bash
# 1. Generate all secrets
JWT_SECRET=$(openssl rand -base64 64)
JWT_REFRESH_SECRET=$(openssl rand -base64 64)
SESSION_SECRET=$(openssl rand -base64 32)

# 2. Save to secure password manager
# (1Password, LastPass, etc.)

# 3. Add to Railway via dashboard
#    (Railway → api-staging → Variables)
```

### Phase 2: Provision Services (15 min)

**Railway Dashboard:**
1. ✅ Add Redis database
2. ✅ Link to API & Worker services  
3. ✅ Verify `DATABASE_URL` linked to Postgres
4. ✅ Check all services show "Healthy"

**Stripe Dashboard:**
1. ✅ Create webhook endpoint
2. ✅ Copy signing secret
3. ✅ Add to Railway variables

### Phase 3: Configure Environment (20 min)

**Railway - API Service Variables:**
- Copy all from `_docs/ENVIRONMENT_VARIABLES.md`
- Generate secrets
- Add Stripe keys
- Add AWS/email/Sentry credentials

**Vercel - All Frontend Apps:**
- Set `NEXT_PUBLIC_API_URL`
- Set `NEXT_PUBLIC_STRIPE_KEY`
- Same variables for all 10 apps

### Phase 4: Deploy & Verify (15 min)

```bash
# 1. Trigger deployment
git push origin main

# 2. Watch Railway deployment
railway logs -s api-staging --tail

# 3. Watch Vercel deployment
# (Check dashboard: https://vercel.com)

# 4. Verify services started
curl https://api-staging.kealee.com/health
curl https://m-finance-trust-staging.vercel.app

# 5. Check migrations ran
railway logs -s api-staging --filter "migrate"
```

### Phase 5: UAT Testing (2 hours)

Follow comprehensive test plan:
- Smoke tests (5 min)
- Functional tests (30 min)
- Integration tests (1 hour)
- Performance tests (15 min)
- Security tests (10 min)

### Phase 6: Production Deployment (30 min)

**After UAT passes:**
```bash
# 1. Merge to release branch
git checkout release
git merge main
git push origin release

# 2. Railway auto-deploys to production

# 3. Verify production
curl https://api.kealee.com/health

# 4. Monitor for 1 hour
railway logs -s api-production --tail

# 5. Check error rates in Sentry
```

---

## 📚 ALL DOCUMENTATION

### Core Guides
| Document | Purpose | When to Use |
|----------|---------|-------------|
| **REDIS_SETUP_GUIDE.md** | Redis configuration | Before first deploy |
| **STRIPE_WEBHOOK_SETUP.md** | Stripe integration | Before testing payments |
| **ENVIRONMENT_VARIABLES.md** | All env vars | Before any deploy |
| **DATABASE_MIGRATIONS.md** | Migration strategy | Every schema change |
| **UAT_TESTING_GUIDE.md** | Testing procedures | Before production |
| **PRODUCTION_READINESS_REPORT.md** | Overall status | Reference |

### How to Use This Documentation

**Scenario 1: First Time Deployment**
1. Read `PRODUCTION_READINESS_REPORT.md` (overview)
2. Follow this action plan sequentially
3. Complete Steps 1-5 above
4. Run UAT tests
5. Deploy to production

**Scenario 2: Adding New Feature**
1. Create database migration
2. Follow `DATABASE_MIGRATIONS.md`
3. Deploy to staging
4. Run relevant UAT tests
5. Deploy to production

**Scenario 3: Troubleshooting**
1. Check service-specific guide
2. Review `ENVIRONMENT_VARIABLES.md` for config
3. Check Railway/Vercel logs
4. Review Sentry errors

---

## 🔧 USEFUL COMMANDS

### Railway

```bash
# Install CLI
npm install -g @railway/cli

# Login
railway login

# Link project
railway link

# View logs
railway logs -s api-staging --tail

# Run command in Railway environment
railway run pnpm --filter @kealee/database db:migrate:deploy

# Check service status
railway status

# Set environment variable
railway variables set JWT_SECRET="your-secret"

# Restart service
railway service restart api-staging

# Connect to database
railway connect Postgres
```

### Vercel

```bash
# Install CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod

# View logs
vercel logs

# Set environment variable
vercel env add NEXT_PUBLIC_API_URL production

# Pull environment variables
vercel env pull .env.local

# List deployments
vercel ls
```

### Database

```bash
# Generate Prisma Client
pnpm --filter @kealee/database db:generate

# Create migration (dev)
pnpm --filter @kealee/database db:migrate:dev --name migration_name

# Deploy migrations (prod)
pnpm --filter @kealee/database db:migrate:deploy

# Check migration status
pnpm --filter @kealee/database db:migrate:status

# Open Prisma Studio
pnpm --filter @kealee/database db:studio
```

### Stripe

```bash
# Install CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local
stripe listen --forward-to localhost:3000/webhooks/stripe

# Trigger test event
stripe trigger payment_intent.succeeded

# View webhook logs
stripe logs tail

# Test webhook
stripe trigger payment_intent.succeeded
```

### Git

```bash
# Deploy to staging
git push origin main

# Deploy to production
git checkout release
git merge main
git push origin release

# Rollback (revert last commit)
git revert HEAD
git push origin main

# Check current branch
git branch --show-current

# View recent commits
git log --oneline -10
```

---

## 🚨 TROUBLESHOOTING QUICK REFERENCE

### Issue: Service Won't Start

```bash
# Check logs
railway logs -s api-staging --tail

# Common causes:
# 1. Missing environment variable
railway variables

# 2. Database connection failed
railway connect Postgres

# 3. Migration failed
railway run pnpm --filter @kealee/database db:migrate:status
```

### Issue: 500 Errors in API

```bash
# Check Sentry
# Go to: https://sentry.io

# Check Railway logs
railway logs -s api-staging --filter "error"

# Check database connection
curl https://api-staging.kealee.com/api/health/db
```

### Issue: Payments Not Working

```bash
# Verify Stripe keys
railway variables | grep STRIPE

# Check webhook endpoint
curl -I https://api-staging.kealee.com/webhooks/stripe

# View webhook logs in Stripe dashboard
# https://dashboard.stripe.com/test/webhooks

# Test with Stripe CLI
stripe listen --forward-to https://api-staging.kealee.com/webhooks/stripe
```

### Issue: Frontend Can't Connect to API

```bash
# Check CORS settings
# Verify in Railway:
FRONTEND_URL=https://app-staging.kealee.com

# Check Vercel environment
vercel env ls

# Verify API URL
# Should be: NEXT_PUBLIC_API_URL=https://api-staging.kealee.com
```

---

## 📞 SUPPORT & RESOURCES

### External Services

| Service | Dashboard | Documentation |
|---------|-----------|---------------|
| Railway | https://railway.app | https://docs.railway.app |
| Vercel | https://vercel.com | https://vercel.com/docs |
| Stripe | https://dashboard.stripe.com | https://stripe.com/docs |
| Sentry | https://sentry.io | https://docs.sentry.io |
| Resend | https://resend.com | https://resend.com/docs |

### Internal Documentation

All docs in `_docs/` folder:
- Deployment guides (this file)
- API documentation
- Database schema docs
- Architecture decisions

### Getting Help

**Technical Issues:**
1. Check relevant guide in `_docs/`
2. Review error logs (Railway/Sentry)
3. Search GitHub issues
4. Ask in team Slack

**Service Outages:**
- Railway status: https://railway.app/status
- Vercel status: https://vercel-status.com
- Stripe status: https://status.stripe.com

---

## ✅ FINAL CHECKLIST

Before going live:

### Pre-Deployment
- [ ] All documentation read
- [ ] Secrets generated (JWT, session, etc.)
- [ ] Redis provisioned in Railway
- [ ] Stripe webhooks configured
- [ ] All environment variables set (Railway & Vercel)
- [ ] Database migrations tested locally
- [ ] Backup strategy confirmed (Railway auto-backup)

### Deployment
- [ ] Code pushed to `main` branch
- [ ] Railway deployment successful
- [ ] Vercel deployment successful (all 10 apps)
- [ ] Database migrations applied
- [ ] All services show "Healthy"
- [ ] Health checks passing

### Post-Deployment
- [ ] Smoke tests passed
- [ ] Full UAT completed (2 hours)
- [ ] Performance benchmarks met
- [ ] Security tests passed
- [ ] No critical bugs
- [ ] Monitoring configured (Sentry)
- [ ] Team notified of deployment
- [ ] Documentation updated

### Production Ready
- [ ] All staging tests passed
- [ ] Load testing completed
- [ ] Security audit done
- [ ] Legal/compliance sign-off
- [ ] Rollback plan documented
- [ ] On-call schedule set
- [ ] Launch date confirmed

---

## 🎉 YOU'RE READY!

**All implementation complete:**
✅ Stage 5 Finance & Trust Hub  
✅ Comprehensive security layer  
✅ 10 frontend applications  
✅ 3 backend services  
✅ Complete deployment documentation  

**Next Actions:**
1. **Now:** Follow Steps 1-5 above
2. **Today:** Deploy to staging
3. **This Week:** Complete UAT testing
4. **Next Week:** Deploy to production

**Good luck with your deployment!** 🚀

---

**Document Version:** 1.0  
**Last Updated:** 2026-01-22  
**Maintained By:** Kealee Platform Team
