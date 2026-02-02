# 🔧 Environment Variables Setup Guide

**Purpose:** Configure all required environment variables for production deployment  
**Time Required:** 30-45 minutes  
**Status:** Critical for all services to function

---

## 🎯 QUICK START

### **For Development (Local):**
1. Copy `.env.example` to `.env.local` in project root
2. Fill in your credentials
3. Run `npx tsx scripts/verify-environment.ts` to validate

### **For Production:**
1. Add to Railway (backend services)
2. Add to Vercel (frontend apps)
3. Run verification script

---

## 🚂 RAILWAY (Backend API Service)

**Service:** kealee-platform-v10

**Go to:** Railway Dashboard → kealee-platform-v10 → Variables → Raw Editor

**Paste this and fill in values:**

```env
# Database & Cache
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}

# Environment
NODE_ENV=production
APP_ENV=production
PORT=3001

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key

# Security Secrets
JWT_SECRET=9ad04d23d47eaa63cfa1553855e6f1d0ac8de50860dec11ba608440758662269eb62c00b92393519a39b1090baf029df2524c615dca97429437b2a31517aa6c4
AUDIT_SIGNING_KEY=51b61fd793b004f07b000814f32ade4b58642178bf78def5c0b58ec058bc7c26c2e99c00328294e2a8489a23bd76c4555cb5f4307fade4e593ea25da2d95c856

# Stripe
STRIPE_SECRET_KEY=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
STRIPE_WEBHOOK_SECRET=whsec_xxx_get_from_stripe_dashboard
STRIPE_PRICE_PACKAGE_A=price_1SwJCZIQghAs8OOIBMx2eiCB
STRIPE_PRICE_PACKAGE_B=price_1SwJCaIQghAs8OOI91v8URrR
STRIPE_PRICE_PACKAGE_C=price_1SwJCaIQghAs8OOIq4vDyqVN
STRIPE_PRICE_PACKAGE_D=price_1SwJCbIQghAs8OOIBZtGoIhe

# External Services (Optional)
SENDGRID_API_KEY=SG.your_key_here
ANTHROPIC_API_KEY=sk-ant-your_key_here
TWILIO_ACCOUNT_SID=your_sid_here
TWILIO_AUTH_TOKEN=your_token_here
```

**Fill in:**
- Supabase values (from Supabase dashboard)
- SendGrid key (if using email)
- Anthropic key (if using AI features)
- Twilio keys (if using SMS)

---

## ▲ VERCEL (Frontend Apps)

**All 10 apps need these variables:**

### **Required for ALL apps:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_API_URL=https://api.kealee.com
```

### **Payment Apps (m-ops-services, m-finance-trust, m-marketplace):**
```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
```

### **App-Specific (each app):**
```env
NEXT_PUBLIC_APP_URL=https://ops.kealee.com
```

---

## 📋 WHERE TO ADD VARIABLES

### **For Each Vercel App:**

1. **m-marketplace:**
   - Go to: https://vercel.com/dashboard → m-marketplace
   - Settings → Environment Variables
   - Add: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_API_URL
   - Set Environment: ✅ Production

2. **m-ops-services:**
   - Same variables PLUS
   - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
   - NEXT_PUBLIC_APP_URL=https://ops.kealee.com

3. **m-permits-inspections:**
   - Same core variables
   - NEXT_PUBLIC_APP_URL=https://permits.kealee.com

4. **Repeat for all 10 apps:**
   - m-project-owner
   - m-architect
   - m-engineer
   - m-finance-trust
   - m-inspector
   - m-estimation
   - os-pm
   - os-admin

---

## 🔐 GET YOUR CREDENTIALS

### **Supabase:**
1. Go to: https://supabase.com/dashboard
2. Select your project
3. Settings → API
4. Copy:
   - **Project URL** → SUPABASE_URL
   - **anon/public** → SUPABASE_ANON_KEY  
   - **service_role** → SUPABASE_SERVICE_ROLE_KEY

### **Stripe:**
1. Go to: https://dashboard.stripe.com/
2. Make sure you're in **Live mode** (or Test for testing)
3. Developers → API keys
4. Copy:
   - **Secret key** → STRIPE_SECRET_KEY (backend)
   - **Publishable key** → NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (frontend)

### **Stripe Webhook:**
1. Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://api.kealee.com/webhooks/stripe`
3. Select events:
   - checkout.session.completed
   - customer.subscription.created
   - customer.subscription.updated
   - payment_intent.succeeded
4. Copy webhook signing secret

---

## ⚠️ IMPORTANT NOTES

### **Backend vs Frontend:**

**❌ NEVER add to frontend (Vercel):**
- DATABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- STRIPE_SECRET_KEY (use publishable key instead)
- JWT_SECRET
- Any secret keys

**✅ Safe for frontend:**
- Anything starting with `NEXT_PUBLIC_`
- Supabase anon key (public)
- Stripe publishable key (public)

### **Security:**
- ✅ All secrets in Railway are encrypted
- ✅ All secrets in Vercel are encrypted
- ✅ Never commit .env.local to Git
- ✅ Rotate keys regularly

---

## 🔄 RUNTIME CONFIGURATION

The warnings you saw are **expected and safe**:

```
[warn]   - DATABASE_URL
[warn]   - SUPABASE_SERVICE_ROLE_KEY
```

**Why?**
- These are **backend-only** variables
- Frontend apps don't need them
- Build process checks for them but won't use them
- Apps will work fine at runtime with NEXT_PUBLIC_ variables

**Action Required:** None for build warnings - just ensure runtime variables are set

---

## ✅ VALIDATION

### **After Setting Variables:**

**Railway:**
```bash
# Variables should be visible in:
Railway → Service → Variables tab
```

**Vercel:**
```bash
# Variables should show in:
Vercel → Project → Settings → Environment Variables
```

**Test:**
```bash
# Run verification script
npx tsx scripts/verify-environment.ts api
```

---

## 🚀 DEPLOYMENT CHECKLIST

### **Before Deploying:**
- [ ] All Railway variables added
- [ ] All Vercel variables added (per app)
- [ ] Supabase credentials correct
- [ ] Stripe keys (live mode for production)
- [ ] Database URL connected
- [ ] Redis URL connected

### **After Deploying:**
- [ ] API health check passes
- [ ] Frontend apps load
- [ ] Authentication works
- [ ] Payment processing works

---

## 📞 TROUBLESHOOTING

**App won't start:**
- Check environment variables are set
- Verify DATABASE_URL connects
- Check logs for missing variables

**Build warnings about missing variables:**
- ✅ Normal if they're backend-only variables
- ✅ Safe to ignore during frontend builds
- ❌ Action needed only if app actually needs them at runtime

**Authentication doesn't work:**
- Verify Supabase URL and keys
- Check NEXT_PUBLIC_SUPABASE_URL is set
- Ensure anon key is public (not service role)

---

## 🎯 QUICK REFERENCE

**Backend (Railway):**
- DATABASE_URL ✅
- REDIS_URL ✅
- JWT_SECRET ✅
- STRIPE_SECRET_KEY ✅
- SUPABASE_SERVICE_ROLE_KEY ✅

**Frontend (Vercel):**
- NEXT_PUBLIC_SUPABASE_URL ✅
- NEXT_PUBLIC_SUPABASE_ANON_KEY ✅
- NEXT_PUBLIC_API_URL ✅
- NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ✅

---

**Follow this guide and your platform will be properly configured!** 🔐✅

**The warnings are expected - apps will work once Railway variables are set!** 🚀
