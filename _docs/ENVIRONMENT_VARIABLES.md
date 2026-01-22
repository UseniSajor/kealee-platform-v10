# 🔐 Environment Variables Configuration

## Overview
Complete guide for setting up environment variables across all Kealee Platform services.

---

## 📋 Quick Reference

| Variable | Required | Service | Purpose |
|----------|----------|---------|---------|
| `DATABASE_URL` | ✅ | API, Worker | PostgreSQL connection |
| `REDIS_URL` | ✅ | API, Worker | Redis connection |
| `JWT_SECRET` | ✅ | API | JWT signing |
| `STRIPE_SECRET_KEY` | ✅ | API | Stripe API |
| `STRIPE_WEBHOOK_SECRET` | ✅ | API | Webhook verification |
| `NEXT_PUBLIC_API_URL` | ✅ | All Frontends | API endpoint |

---

## 🚂 Railway Configuration

### API Service Environment Variables

**In Railway Dashboard → API Service → Variables:**

```env
# Core
NODE_ENV=production
APP_ENV=production
PORT=3000

# Database (auto-linked)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Redis (auto-linked)
REDIS_URL=${{Redis.REDIS_URL}}

# JWT Authentication (GENERATE SECURE VALUES!)
JWT_SECRET=<generate-64+-char-secret>
JWT_REFRESH_SECRET=<generate-64+-char-secret>
JWT_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_CLIENT_ID=ca_...

# AWS S3 (File Storage)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=<your-key>
AWS_SECRET_ACCESS_KEY=<your-secret>
AWS_S3_BUCKET=kealee-production

# Email (Resend)
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@kealee.com

# Error Tracking
SENTRY_DSN=https://...@sentry.io/...
SENTRY_AUTH_TOKEN=sntrys_...

# URLs
FRONTEND_URL=https://app.kealee.com
API_URL=https://api.kealee.com

# Security
SESSION_SECRET=<generate-32+-char-secret>
CSRF_SECRET=<generate-32+-char-secret>

# Features
ENABLE_GRAPHQL=false
ENABLE_SWAGGER=false
ENABLE_2FA=true

# Payment Config
MINIMUM_DEPOSIT=100
MAXIMUM_DEPOSIT=100000000
PLATFORM_FEE_PERCENTAGE=2.5

# Compliance
SAR_THRESHOLD=5000
CTR_THRESHOLD=10000
FORM_1099_THRESHOLD=600
```

### Worker Service Environment Variables

**In Railway Dashboard → Worker Service → Variables:**

```env
# Core
NODE_ENV=production
PORT=3001

# Database (auto-linked)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Redis (auto-linked)
REDIS_URL=${{Redis.REDIS_URL}}

# Stripe (for payout processing)
STRIPE_SECRET_KEY=sk_live_...

# Email
RESEND_API_KEY=re_...

# Error Tracking
SENTRY_DSN=https://...@sentry.io/...
```

---

## ☁️ Vercel Configuration

### All Frontend Apps

**In Vercel Dashboard → Project Settings → Environment Variables:**

#### **Production:**
```env
# API Endpoint
NEXT_PUBLIC_API_URL=https://api.kealee.com

# Stripe Public Key
NEXT_PUBLIC_STRIPE_KEY=pk_live_...

# Sentry
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...

# Google Maps (if needed)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIza...

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=true
```

#### **Preview (Staging):**
```env
NEXT_PUBLIC_API_URL=https://api-staging.kealee.com
NEXT_PUBLIC_STRIPE_KEY=pk_test_...
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
```

#### **Development:**
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_STRIPE_KEY=pk_test_...
```

---

## 🔑 How to Generate Secrets

### JWT Secrets (64+ characters)

**Option 1: OpenSSL**
```bash
openssl rand -base64 64
```

**Option 2: Node.js**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```

**Option 3: Online Generator**
- Visit: https://generate-secret.vercel.app/64

**Example Output:**
```
JWT_SECRET=7xJ8KmP2nQ5vR9tY3wB6cE1fH4gL0aM8zN7oS2uV5xD9kF3bG6hJ1mN4pQ7rT0w
```

### Session Secrets (32+ characters)

```bash
openssl rand -base64 32
```

---

## 📝 Setting Variables in Railway

### Method 1: Railway Dashboard (Recommended)

1. Go to https://railway.app
2. Select your project
3. Click on a service (e.g., "api-staging")
4. Click "Variables" tab
5. Click "+ New Variable"
6. Add variable name and value
7. Click "Add"
8. Service auto-redeploys

### Method 2: Railway CLI

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to project
railway link

# Set variables
railway variables set JWT_SECRET="your-secret-here"
railway variables set STRIPE_SECRET_KEY="sk_live_..."

# Bulk set from file
railway variables set -f .env.production
```

### Method 3: GitHub Actions (for CI/CD)

```yaml
# .github/workflows/deploy.yml
- name: Set Railway Variables
  run: |
    railway variables set NODE_ENV=production
    railway variables set DATABASE_URL=${{ secrets.DATABASE_URL }}
  env:
    RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

---

## 📝 Setting Variables in Vercel

### Method 1: Vercel Dashboard (Recommended)

1. Go to https://vercel.com
2. Select your project
3. Go to "Settings" → "Environment Variables"
4. Add variable:
   - **Key:** `NEXT_PUBLIC_API_URL`
   - **Value:** `https://api.kealee.com`
   - **Environment:** ✅ Production ✅ Preview ✅ Development
5. Click "Save"
6. Redeploy for changes to take effect

### Method 2: Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Set variables
vercel env add NEXT_PUBLIC_API_URL production
# Paste value when prompted

# Pull variables locally
vercel env pull .env.local
```

### Method 3: vercel.json (Not Recommended for Secrets)

```json
{
  "env": {
    "NEXT_PUBLIC_API_URL": "https://api.kealee.com"
  }
}
```
**Note:** Only use for non-sensitive values!

---

## 🔒 Security Best Practices

### 1. Never Commit Secrets

```bash
# Add to .gitignore
.env
.env.local
.env.production
.env.development
.env.*.local
```

### 2. Use Different Secrets Per Environment

```
# ❌ BAD: Same secret everywhere
JWT_SECRET=abc123 (dev, staging, production)

# ✅ GOOD: Different secrets
JWT_SECRET=dev-secret-xyz (development)
JWT_SECRET=staging-secret-abc (staging)
JWT_SECRET=prod-secret-789 (production)
```

### 3. Rotate Secrets Regularly

```bash
# Generate new secret
NEW_SECRET=$(openssl rand -base64 64)

# Update in Railway
railway variables set JWT_SECRET="$NEW_SECRET"

# Update in Vercel
vercel env add JWT_SECRET production
```

### 4. Use Railway's Secret Management

Railway automatically:
- ✅ Encrypts variables at rest
- ✅ Injects variables at runtime
- ✅ Never exposes in logs
- ✅ Allows per-environment overrides

### 5. Audit Access

- Limit who can view/edit production variables
- Use Railway teams/Vercel teams for access control
- Enable 2FA on Railway and Vercel accounts

---

## 🧪 Local Development Setup

### Step 1: Copy Example File

```bash
# Create .env from template
cp _docs/env.example .env
```

### Step 2: Fill in Local Values

```env
# .env (for local development)
NODE_ENV=development
DATABASE_URL=postgresql://postgres:password@localhost:5432/kealee_dev
REDIS_URL=redis://localhost:6379
JWT_SECRET=dev-secret-not-for-production-use-only
STRIPE_SECRET_KEY=sk_test_... # Use test keys
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Step 3: Load Variables

**Option A: dotenv (Node.js)**
```typescript
import 'dotenv/config';
// Variables loaded automatically
```

**Option B: direnv (Recommended)**
```bash
# Install direnv
brew install direnv # macOS
sudo apt install direnv # Linux

# Allow .envrc
echo 'dotenv' > .envrc
direnv allow

# Variables loaded when you cd into directory
```

---

## 🐛 Troubleshooting

### Error: "Missing DATABASE_URL"

**Check 1: Verify variable is set**
```bash
# Railway
railway variables

# Vercel
vercel env ls
```

**Check 2: Verify service is linked**
```bash
# Railway - check linked databases
railway service

# Should show: Postgres linked ✓
```

**Check 3: Restart service**
```bash
# Railway
railway service restart api-staging

# Vercel (redeploy)
vercel --prod
```

### Variables Not Updating

**Solution: Trigger Redeploy**

**Railway:**
```bash
# Force rebuild
railway up --detach

# Or in dashboard: Deployments → ⋯ → Redeploy
```

**Vercel:**
```bash
# Redeploy
vercel --prod

# Or in dashboard: Deployments → ⋯ → Redeploy
```

### CORS Errors

**Check frontend can access API:**
```env
# API Service
FRONTEND_URL=https://app.kealee.com

# Frontend
NEXT_PUBLIC_API_URL=https://api.kealee.com
```

**Verify URLs match:**
- No trailing slashes
- Same protocol (https)
- Correct domain

---

## 📋 Deployment Checklist

### Before Deploying

- [ ] All required variables documented
- [ ] Secrets generated (64+ chars)
- [ ] Test keys for staging
- [ ] Live keys for production
- [ ] DATABASE_URL linked to Postgres
- [ ] REDIS_URL linked to Redis
- [ ] Stripe webhooks configured
- [ ] CORS URLs correct
- [ ] Sentry DSN set
- [ ] Email service configured

### After Deploying

- [ ] Verify all services started
- [ ] Check `/health` endpoints
- [ ] Test authentication flow
- [ ] Test payment processing
- [ ] Verify email delivery
- [ ] Check error tracking (Sentry)
- [ ] Monitor logs for errors

---

## 📚 Environment Variable Template

Save this as `env.template` in your repository:

```bash
# ========================================
# KEALEE PLATFORM - ENVIRONMENT VARIABLES
# ========================================

# Core
NODE_ENV=
APP_ENV=
PORT=

# Database
DATABASE_URL=

# Redis
REDIS_URL=

# JWT
JWT_SECRET=
JWT_REFRESH_SECRET=
JWT_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Stripe
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_CLIENT_ID=

# AWS S3
AWS_REGION=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=

# Email
RESEND_API_KEY=
EMAIL_FROM=

# Sentry
SENTRY_DSN=
SENTRY_AUTH_TOKEN=

# URLs
FRONTEND_URL=
API_URL=

# Security
SESSION_SECRET=
CSRF_SECRET=

# Features
ENABLE_GRAPHQL=false
ENABLE_2FA=true
```

---

**Next Step:** Run database migrations (see `DATABASE_MIGRATIONS.md`)
