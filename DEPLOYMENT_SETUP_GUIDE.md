# Kealee Platform V10 - Complete Deployment Setup Guide

## 🚀 Quick Start: Railway Deployment (Current Setup)

Your API is currently deploying to **Railway** using Docker.

### Railway Environment Variables Setup

Go to **Railway Dashboard** → Your Project → **API Service** → **Variables** tab

#### Required Variables:

```env
# ===== DATABASE (Required) =====
DATABASE_URL=postgresql://user:password@host:port/database?schema=public
# Railway provides this automatically when you add a Postgres service

# ===== AUTHENTICATION (Required) =====
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key

# ===== STRIPE BILLING (Required) =====
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
# Get from: https://dashboard.stripe.com/test/apikeys

# ===== OPTIONAL =====
PORT=3001
NODE_ENV=production
```

#### Additional Module Variables (Add as needed):

```env
# ===== FILE STORAGE (S3/R2) =====
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=auto
AWS_ENDPOINT=https://your-account.r2.cloudflarestorage.com
AWS_BUCKET_NAME=kealee-files

# ===== DOCUSIGN =====
DOCUSIGN_INTEGRATION_KEY=your_integration_key
DOCUSIGN_API_ACCOUNT_ID=your_account_id
DOCUSIGN_RSA_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
DOCUSIGN_USER_ID=your_user_id

# ===== EMAIL (SendGrid) =====
SENDGRID_API_KEY=SG.your_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@kealee.com
SENDGRID_FROM_NAME=Kealee Platform

# ===== REDIS (for Worker Service) =====
REDIS_URL=redis://default:password@host:port
# Or Upstash: rediss://default:password@host:port

# ===== AI/ML (Anthropic Claude) =====
ANTHROPIC_API_KEY=sk-ant-your_anthropic_key

# ===== WEBHOOKS =====
WEBHOOK_SECRET=your_webhook_secret

# ===== PERMITS & INSPECTIONS =====
JURISDICTION_API_KEY=your_jurisdiction_api_key

# ===== MARKETPLACE =====
GOOGLE_MAPS_API_KEY=your_google_maps_key
```

---

## 📋 Module-by-Module Setup Guide

### 1. **Authentication Module** ✅ (Core - Required)

**What it does:** User signup, login, JWT tokens, session management

**Setup:**
1. Create a Supabase project: https://supabase.com/dashboard
2. Get your credentials:
   - Go to Project Settings → API
   - Copy `Project URL` → `SUPABASE_URL`
   - Copy `anon public` key → `SUPABASE_ANON_KEY`
3. Add to Railway Variables

**Test:**
```bash
curl https://your-api.railway.app/health
```

---

### 2. **Database Module** ✅ (Core - Required)

**What it does:** PostgreSQL database with Prisma ORM

**Setup:**
1. **On Railway:**
   - Add a **Postgres** service to your project
   - Railway auto-generates `DATABASE_URL`
   - No manual setup needed!

2. **Run Migrations:**
   ```bash
   # Locally
   cd packages/database
   pnpm db:generate
   pnpm db:push
   ```

3. **Seed Data (Optional):**
   ```bash
   pnpm db:seed
   ```

---

### 3. **Billing Module** (Stripe Integration)

**What it does:** Subscription plans, payments, invoices

**Setup:**
1. Sign up for Stripe: https://dashboard.stripe.com/register
2. Get API keys:
   - Go to: https://dashboard.stripe.com/test/apikeys
   - Copy "Secret key" (starts with `sk_test_`)
3. Add to Railway:
   ```env
   STRIPE_SECRET_KEY=sk_test_xxxxx
   ```
4. **Create Products in Stripe:**
   - Go to Stripe Dashboard → Products
   - Create your subscription tiers (Starter, Pro, Enterprise)
   - Note the Product IDs

**Endpoints:**
- `GET /billing/plans` - List subscription plans
- `POST /billing/subscribe` - Create subscription
- `POST /billing/portal` - Customer portal
- `GET /billing/usage` - Usage tracking

---

### 4. **File Storage Module** (S3/Cloudflare R2)

**What it does:** Upload/download files (documents, images, PDFs)

**Setup with Cloudflare R2 (Recommended - Free tier):**

1. Go to: https://dash.cloudflare.com/
2. Navigate to **R2 Object Storage**
3. Create a bucket: `kealee-files`
4. Create API Token:
   - Permissions: Object Read & Write
   - Copy: Access Key ID & Secret Access Key
5. Add to Railway:
   ```env
   AWS_ACCESS_KEY_ID=your_access_key
   AWS_SECRET_ACCESS_KEY=your_secret_key
   AWS_REGION=auto
   AWS_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
   AWS_BUCKET_NAME=kealee-files
   ```

**Or use AWS S3:**
```env
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
AWS_BUCKET_NAME=kealee-files
# No AWS_ENDPOINT needed for S3
```

---

### 5. **DocuSign Integration Module**

**What it does:** E-signature for contracts, permit documents

**Setup:**
1. Sign up: https://developers.docusign.com/
2. Create an Integration Key:
   - Go to: Settings → Integrations → Apps and Keys
   - Add App → Integration Key
3. Generate RSA Keypair
4. Get User ID and Account ID
5. Add to Railway:
   ```env
   DOCUSIGN_INTEGRATION_KEY=your_integration_key
   DOCUSIGN_API_ACCOUNT_ID=your_account_id
   DOCUSIGN_RSA_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
   DOCUSIGN_USER_ID=your_user_id
   ```

**Endpoints:**
- `POST /docusign/send` - Send document for signature
- `GET /docusign/status/:envelopeId` - Check signature status
- `POST /docusign/webhook` - Webhook for signature events

---

### 6. **Email Module** (SendGrid)

**What it does:** Transactional emails, notifications

**Setup:**
1. Sign up: https://signup.sendgrid.com/
2. Create API Key:
   - Go to: Settings → API Keys
   - Create API Key with "Full Access"
3. Verify Sender Email:
   - Settings → Sender Authentication
   - Verify your domain or single email
4. Add to Railway:
   ```env
   SENDGRID_API_KEY=SG.xxxxx
   SENDGRID_FROM_EMAIL=noreply@yourdomain.com
   SENDGRID_FROM_NAME=Kealee Platform
   ```

---

### 7. **Worker Service** (Background Jobs)

**What it does:** Email queue, webhooks, ML processing, PDF generation

**Setup:**
1. **Add Redis** (Required for queues):
   - **Option A - Upstash (Recommended for Railway):**
     - Sign up: https://upstash.com/
     - Create Redis database
     - Copy connection URL
   
   - **Option B - Railway Redis:**
     - Add Redis service to your project

2. Add to Railway:
   ```env
   REDIS_URL=redis://default:password@host:port
   # Or Upstash: rediss://default:password@host:port
   ```

3. **Deploy Worker Service:**
   - Create a new service in Railway
   - Point to: `services/worker`
   - Add same environment variables

**Queues:**
- Email Queue (requires SendGrid)
- Webhook Queue
- ML Processing Queue (requires Anthropic API)
- Report Generation Queue (PDF)

---

### 8. **Architect Module** (Design Projects)

**What it does:** BIM models, drawing sets, revisions, approvals

**Setup:**
- Uses core database (already set up)
- File storage required for BIM files (see Module 4)

**Features:**
- Design projects & phases
- BIM model management
- Drawing sets & sheets
- Permit packages
- Review & approval workflows
- Version control
- Stamp & seal management

---

### 9. **Marketplace Module**

**What it does:** Lead generation, contractor discovery, bid management

**Setup:**
1. **Google Maps API** (Optional for location features):
   - Go to: https://console.cloud.google.com/
   - Enable Maps JavaScript API
   - Create API Key
   - Add to Railway:
     ```env
     GOOGLE_MAPS_API_KEY=AIza...
     ```

**Endpoints:**
- `POST /marketplace/leads` - Create lead
- `GET /marketplace/contractors` - Find contractors
- `POST /marketplace/bids` - Submit bid

---

### 10. **Permits & Inspections Module**

**What it does:** Jurisdiction management, permit tracking, inspections

**Setup:**
- Uses core database
- Optional: Integration with jurisdiction APIs

---

## 🌐 Deploying to Vercel (Next.js Apps)

If you want to deploy the Next.js apps (landing pages, admin dashboard) to Vercel:

### Step 1: Install Vercel CLI
```bash
npm i -g vercel
```

### Step 2: Deploy Each App
```bash
# From project root
cd apps/w-landing
vercel

# Follow prompts:
# - Link to existing project or create new
# - Set root directory: apps/w-landing
# - Framework: Next.js
```

### Step 3: Add Environment Variables in Vercel
Go to: Vercel Dashboard → Your Project → Settings → Environment Variables

```env
NEXT_PUBLIC_API_URL=https://your-api.railway.app
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### Apps to Deploy:
- `apps/w-landing` - Marketing website
- `apps/w-homeowner-portal` - Homeowner portal
- `apps/w-contractor-portal` - Contractor portal
- `apps/os-admin` - Admin dashboard
- `apps/m-permits-inspections` - Permits module

---

## 🔧 Complete Railway Setup (Recommended Architecture)

### Services to Create:

1. **API Service** (Main backend)
   - Root: `/`
   - Dockerfile: `Dockerfile`
   - Port: 3001

2. **Worker Service** (Background jobs)
   - Root: `services/worker`
   - Build Command: `pnpm build`
   - Start Command: `node dist/index.js`

3. **Postgres Database**
   - Add from Railway marketplace
   - Auto-connects `DATABASE_URL`

4. **Redis** (Optional - for Worker)
   - Add from Railway marketplace
   - Or use Upstash

---

## 🧪 Testing Your Deployment

### 1. Health Check
```bash
curl https://your-api.railway.app/health
# Should return: {"status":"ok"}
```

### 2. API Documentation
Visit: `https://your-api.railway.app/docs`
(Swagger UI with all endpoints)

### 3. Test Authentication
```bash
# Signup
curl -X POST https://your-api.railway.app/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Password123!"}'
```

---

## 📊 Monitoring & Logs

### Railway Logs:
- Go to: Railway Dashboard → Your Service → Deployments
- Click on deployment to see logs
- Use search/filter to find errors

### Supabase Dashboard:
- Monitor auth users
- View database tables
- Check API usage

### Stripe Dashboard:
- Monitor subscriptions
- View payments
- Test webhooks

---

## 🚨 Troubleshooting

### Build Fails:
- Check Railway logs for errors
- Verify `FORCE_REBUILD` timestamp is recent
- Clear build cache (redeploy without cache)

### App Crashes on Start:
- Check for missing environment variables
- Verify `STRIPE_SECRET_KEY` is set
- Check `DATABASE_URL` is valid

### Database Connection Issues:
- Verify Railway Postgres service is running
- Check `DATABASE_URL` format
- Run migrations: `pnpm db:push`

---

## 📚 Next Steps

1. ✅ Set up required environment variables in Railway
2. ✅ Get Stripe test key and add to Railway
3. ✅ Redeploy API service
4. ✅ Test health endpoint
5. ⏭️ Set up optional modules (DocuSign, SendGrid, etc.)
6. ⏭️ Deploy Next.js apps to Vercel
7. ⏭️ Configure custom domains

---

## 🔗 Useful Links

- **Railway Dashboard:** https://railway.app/dashboard
- **Supabase Dashboard:** https://supabase.com/dashboard
- **Stripe Dashboard:** https://dashboard.stripe.com/
- **Vercel Dashboard:** https://vercel.com/dashboard
- **GitHub Repo:** https://github.com/UseniSajor/kealee-platform-v10

---

**Current Status:**
- ✅ Docker build working (turbo.json fixed)
- ⚠️ Need to add `STRIPE_SECRET_KEY` to Railway
- ⏭️ Deploy Next.js apps to Vercel (optional)
