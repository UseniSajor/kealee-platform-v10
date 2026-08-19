# 🚀 Production Deployment Checklist

**Platform:** Kealee Platform V10  
**Target:** Production Launch  
**Status:** Ready to Execute

---

## ✅ PRE-DEPLOYMENT (Complete)

### Code & Infrastructure
- [x] All code committed to Git
- [x] All scripts created
- [x] Documentation complete
- [x] Tests created
- [x] CSRF protection added
- [x] Seed data prepared

---

## 📋 DEPLOYMENT STEPS

### STEP 1: Run Database Migrations (30 minutes)

**Location:** `packages/database/`

```bash
# Option A: Automated script
cd packages/database
sh scripts/deploy-migrations.sh

# Option B: Manual
npx prisma migrate deploy
npx tsx prisma/seed-complete.ts
```

**Creates:**
- ✅ All database tables
- ✅ Admin user (admin@kealee.com)
- ✅ 7 default roles
- ✅ 10 major jurisdictions
- ✅ 4 service plans
- ✅ System configuration

**Checklist:**
- [ ] Migrations deployed
- [ ] Seed data loaded
- [ ] Admin can login
- [ ] Roles exist
- [ ] Jurisdictions visible

---

### STEP 2: Create Stripe Products (1 hour)

**Location:** `services/api/scripts/stripe/`

**Prerequisites:**
1. Switch Stripe to LIVE mode in dashboard
2. Get live secret key (sk_live_xxx)
3. Set STRIPE_SECRET_KEY environment variable

**Execute:**
```bash
cd services/api

# Create all products (30+ products)
STRIPE_SECRET_KEY=sk_live_xxx pnpm tsx scripts/stripe/create-complete-catalog.ts --confirm-live
```

**Creates:**
- 4 PM Packages (monthly)
- 4 PM Packages (annual, 10% discount)
- 12 On-Demand Ops services
- 3 Estimation tiers
- 3 Architecture phases
- 2 Engineering services
- 2 Permit services
- 2 Finance products
- 2 Marketplace products
- 2 Consultation options

**Total: 30+ products**

**After Creation:**
1. Copy price IDs from output
2. Add to Railway (API service → Variables)
3. Add to Vercel (m-ops-services → Environment Variables)
4. Update seed.ts with IDs

**Checklist:**
- [ ] Stripe in live mode
- [ ] Products created
- [ ] Environment variables set
- [ ] stripe-catalog-output.env saved
- [ ] stripe-catalog.json saved

---

### STEP 3: Deploy Worker Service (1 hour)

**Location:** Railway Dashboard

**Steps:**
1. Go to Railway → New Service
2. Select "Deploy from GitHub repo"
3. Choose: kealee-platform-v10
4. Set Root Directory: `services/worker`
5. Configure:
   - Build Command: `pnpm build`
   - Start Command: `pnpm start`
6. Set Environment Variables:
   ```env
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   REDIS_URL=${{Redis.REDIS_URL}}
   ANTHROPIC_API_KEY=your_claude_key
   SENDGRID_API_KEY=your_sendgrid_key
   ```
7. Deploy

**Checklist:**
- [ ] Service created
- [ ] Connected to repo
- [ ] Environment variables set
- [ ] Build succeeded
- [ ] Service running
- [ ] Jobs processing

---

### STEP 4: Configure Custom Domains (2 hours)

**Required Domains:**
```
kealee.com → m-marketplace
ops.kealee.com → m-ops-services
projects.kealee.com → m-project-owner
architect.kealee.com → m-architect
engineer.kealee.com → m-engineer
permits.kealee.com → m-permits-inspections
finance.kealee.com → m-finance-trust
inspector.kealee.com → m-inspector
estimation.kealee.com → m-estimation (when ready)
pm.kealee.com → os-pm
admin.kealee.com → os-admin
api.kealee.com → API Gateway (Railway)
```

**For Each App:**

#### In Vercel
1. Go to project → Settings → Domains
2. Add domain (e.g., ops.kealee.com)
3. Copy provided DNS values

#### In NameBright
1. Go to DNS management for kealee.com
2. Add record:
   - Type: CNAME
   - Name: ops (for ops.kealee.com)
   - Value: cname.vercel-dns.com
3. Save

#### In Railway (for api.kealee.com)
1. Go to API service → Settings
2. Add custom domain: api.kealee.com
3. Copy provided DNS values
4. Add in NameBright

**Checklist:**
- [ ] All domains added in Vercel
- [ ] All DNS records created
- [ ] DNS propagation verified (15-30 min)
- [ ] SSL certificates issued
- [ ] All URLs accessible
- [ ] Redirects working

---

### STEP 5: Set Environment Variables (1 hour)

**Railway (API Service):**
```env
# Core
NODE_ENV=production
APP_ENV=production
DATABASE_URL=(from Postgres service)
REDIS_URL=(from Redis service)

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxx
SUPABASE_ANON_KEY=xxx

# Stripe
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PRICE_PACKAGE_A=price_xxx
STRIPE_PRICE_PACKAGE_B=price_xxx
STRIPE_PRICE_PACKAGE_C=price_xxx
STRIPE_PRICE_PACKAGE_D=price_xxx
(+ all other price IDs from catalog)

# Security
JWT_SECRET=(generate strong secret)
AUDIT_SIGNING_KEY=(generate strong secret)

# External Services
ANTHROPIC_API_KEY=sk-ant-xxx
SENDGRID_API_KEY=SG.xxx
```

**Vercel (All Frontend Apps):**
```env
# Each app needs:
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
NEXT_PUBLIC_API_URL=https://api.kealee.com
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx

# App-specific
NEXT_PUBLIC_APP_URL=https://ops.kealee.com (specific to each app)
```

**Verify:**
```bash
npx tsx scripts/verify-environment.ts
```

**Checklist:**
- [ ] Railway variables set
- [ ] Vercel variables set (all 10 apps)
- [ ] Verification script passed
- [ ] No missing required vars

---

### STEP 6: Configure Stripe Webhook (30 minutes)

**Steps:**
1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. URL: `https://api.kealee.com/webhooks/stripe`
4. Events to listen for:
   - payment_intent.succeeded
   - payment_intent.payment_failed
   - checkout.session.completed
   - customer.subscription.created
   - customer.subscription.updated
   - customer.subscription.deleted
5. Copy webhook signing secret
6. Add to Railway: `STRIPE_WEBHOOK_SECRET=whsec_xxx`

**Checklist:**
- [ ] Webhook endpoint created
- [ ] Events selected
- [ ] Signing secret copied
- [ ] Environment variable set
- [ ] Test webhook (Stripe CLI or dashboard)

---

### STEP 7: End-to-End Testing (4-6 hours)

**Critical Flows to Test:**

```bash
# Run automated tests
cd services/api
pnpm test:e2e
```

**Manual Tests:**
1. **User Registration**
   - Sign up as GC
   - Verify email
   - Complete onboarding

2. **Package Subscription**
   - Browse packages
   - Select Package B
   - Complete checkout
   - Verify subscription active

3. **Project Creation**
   - Create new project
   - Upload documents
   - Assign PM

4. **Estimation**
   - Create estimate
   - AI scope analysis
   - Build line items
   - Export PDF

5. **Escrow & Payments**
   - Create escrow account
   - Fund escrow
   - Request milestone release
   - Verify payout

6. **Permits**
   - Create permit application
   - Track status
   - Receive notifications

**Checklist:**
- [ ] All automated tests passing
- [ ] User registration works
- [ ] Stripe checkout works
- [ ] Payments processing
- [ ] Escrow functional
- [ ] Permits tracking
- [ ] No critical bugs

---

### STEP 8: Monitoring & Alerts (30 minutes)

**Sentry:**
- [ ] Verify error tracking active
- [ ] Test error reporting
- [ ] Set up alert rules

**PostHog:**
- [ ] Verify analytics tracking
- [ ] Check event collection
- [ ] Set up funnels

**Uptime Monitoring:**
- [ ] Add api.kealee.com to UptimeRobot
- [ ] Set alert email
- [ ] Test notifications

---

## 🎯 GO-LIVE CHECKLIST

### Security ✅
- [x] CSRF protection enabled
- [x] Rate limiting active
- [ ] SSL certificates verified
- [ ] Security headers configured
- [ ] Webhook signatures verified

### Database ✅
- [ ] Migrations deployed
- [ ] Seed data loaded
- [ ] Backups configured
- [ ] Connection pooling enabled

### Payments ✅
- [ ] Stripe in live mode
- [ ] Products created
- [ ] Webhook configured
- [ ] Test payment processed

### Services ✅
- [ ] API service running
- [ ] Worker service running
- [ ] All apps deployed
- [ ] Health checks passing

### Domains ✅
- [ ] All custom domains configured
- [ ] SSL active on all domains
- [ ] Redirects working
- [ ] DNS propagated

---

## 🚨 ROLLBACK PLAN

If issues occur:

1. **Database Issues**
   ```bash
   # Rollback last migration
   npx prisma migrate rollback
   ```

2. **Stripe Issues**
   - Archive products in Stripe dashboard
   - Revert environment variables
   - Switch back to test mode temporarily

3. **Service Issues**
   - Rollback Railway deployment
   - Check logs for errors
   - Verify environment variables

---

## 📞 SUPPORT CONTACTS

- **Database:** Check Railway logs
- **Payments:** Stripe dashboard → Logs
- **API Errors:** Sentry dashboard
- **Domain Issues:** Vercel support
- **General:** Check runbooks in _docs/

---

## ✅ POST-LAUNCH

### Immediate (Day 1)
- [ ] Monitor error rates
- [ ] Check payment processing
- [ ] Verify all domains
- [ ] Test critical flows
- [ ] Monitor performance

### Week 1
- [ ] Review analytics
- [ ] Check user feedback
- [ ] Fix critical bugs
- [ ] Optimize performance
- [ ] Document issues

### Month 1
- [ ] Review metrics
- [ ] Plan improvements
- [ ] Scale infrastructure
- [ ] Add features

---

**Ready to deploy when you are!** 🚀

**Estimated Total Time:** 10-15 hours  
**Can be done over:** 2-3 days  
**Team Required:** 1-2 engineers

---

**All scripts and tools are ready. Execute when confident!**
