# Railway Environment Variables Reference

## Quick Add Script

Run this to add all variables interactively:

**PowerShell:**
```powershell
.\scripts\add-railway-env-vars.ps1
```

**Bash:**
```bash
bash scripts/add-railway-env-vars.sh
```

---

## Required Variables for API Service

### Core Database & Auth

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:pass@host:port/railway?sslmode=require` |
| `PRISMA_CLIENT_ENGINE_TYPE` | Prisma engine type (use binary for better performance) | `binary` |
| `PRISMA_HIDE_UPDATE_MESSAGE` | Hide Prisma update messages | `true` |
| `SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `SUPABASE_SERVICE_KEY` | Supabase service role key (optional) | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `PORT` | API server port | `3001` |
| `NODE_ENV` | Node environment | `production` |

### Stripe Configuration

| Variable | Description | Example |
|----------|-------------|---------|
| `STRIPE_SECRET_KEY` | Stripe secret key | `sk_live_...` or `sk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | `whsec_...` |

### ⭐ Stripe Price IDs for Ops Services Packages (REQUIRED)

These are **REQUIRED** for the ops services checkout flow to work:

| Variable | Description | Package | Example |
|----------|-------------|---------|---------|
| `STRIPE_PRICE_PACKAGE_A` | Stripe Price ID for Package A | Starter ($1,750-$2,750/mo) | `price_1ABC...` |
| `STRIPE_PRICE_PACKAGE_B` | Stripe Price ID for Package B | Professional ($3,750-$5,500/mo) | `price_1DEF...` |
| `STRIPE_PRICE_PACKAGE_C` | Stripe Price ID for Package C | Premium ($6,500-$9,500/mo) | `price_1GHI...` |
| `STRIPE_PRICE_PACKAGE_D` | Stripe Price ID for Package D | Enterprise ($10,500-$16,500/mo) | `price_1JKL...` |

**How to get Stripe Price IDs:**
1. Go to Stripe Dashboard
2. Products → Create/Edit product
3. Add pricing → Copy the Price ID (starts with `price_`)
4. Create separate products for each package (A, B, C, D)

### DocuSign (Optional)

| Variable | Description | Example |
|----------|-------------|---------|
| `DOCUSIGN_INTEGRATION_KEY` | DocuSign integration key | `xxxx-xxxx-xxxx-xxxx` |
| `DOCUSIGN_USER_ID` | DocuSign user ID | `xxxx-xxxx-xxxx-xxxx` |
| `DOCUSIGN_ACCOUNT_ID` | DocuSign account ID | `xxxx-xxxx-xxxx-xxxx` |
| `DOCUSIGN_PRIVATE_KEY` | DocuSign private key (base64) | `LS0tLS1CRUdJTi...` |

### AWS S3 (Optional)

| Variable | Description | Example |
|----------|-------------|---------|
| `AWS_ACCESS_KEY_ID` | AWS access key | `AKIA...` |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | `wJalr...` |
| `AWS_S3_BUCKET` | S3 bucket name | `kealee-documents` |
| `AWS_REGION` | AWS region | `us-east-1` |

### CORS & Monitoring

| Variable | Description | Example |
|----------|-------------|---------|
| `CORS_ORIGINS` | Allowed CORS origins (comma-separated) | `https://www.kealee.com,https://ops.kealee.com` |
| `SENTRY_DSN` | Sentry DSN for error tracking | `https://xxx@sentry.io/xxx` |

---

## Required Variables for Worker Service

### Core Infrastructure

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:pass@host:port/railway?sslmode=require` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` or `rediss://default:pass@host:port` |
| `NODE_ENV` | Node environment | `production` |

### Email Queue (SendGrid)

| Variable | Description | Example |
|----------|-------------|---------|
| `SENDGRID_API_KEY` | SendGrid API key | `SG.xxxx...` |
| `SENDGRID_FROM_EMAIL` | Default from email | `noreply@kealee.com` |
| `SENDGRID_FROM_NAME` | Default from name | `Kealee Platform` |

### ML Queue (Anthropic Claude)

| Variable | Description | Example |
|----------|-------------|---------|
| `ANTHROPIC_API_KEY` | Anthropic Claude API key | `sk-ant-...` |

### Monitoring

| Variable | Description | Example |
|----------|-------------|---------|
| `SENTRY_DSN` | Sentry DSN for error tracking | `https://xxx@sentry.io/xxx` |

---

## Ops Services Package Configuration

### Package Details

The ops services app offers 4 subscription packages:

1. **Package A - Starter**
   - Price: $1,750-$2,750/month
   - Features: 5-10 hours/week PM time, single project focus
   - Stripe Price ID: `STRIPE_PRICE_PACKAGE_A`

2. **Package B - Professional**
   - Price: $3,750-$5,500/month
   - Features: 15-20 hours/week PM time, up to 3 concurrent projects
   - Stripe Price ID: `STRIPE_PRICE_PACKAGE_B`

3. **Package C - Premium** ⭐ Most Popular
   - Price: $6,500-$9,500/month
   - Features: 30-40 hours/week PM time, unlimited projects
   - Stripe Price ID: `STRIPE_PRICE_PACKAGE_C`

4. **Package D - Enterprise**
   - Price: $10,500-$16,500/month
   - Features: 40+ hours/week PM time, portfolio management
   - Stripe Price ID: `STRIPE_PRICE_PACKAGE_D`

### A La Carte Products

Currently, the ops services app uses **package-based subscriptions only**. There are no individual/a la carte products configured yet.

**To add a la carte products in the future:**
1. Create products in Stripe Dashboard
2. Add price IDs as environment variables:
   - `STRIPE_PRICE_ALACARTE_PERMIT_TRACKING`
   - `STRIPE_PRICE_ALACARTE_VENDOR_MANAGEMENT`
   - `STRIPE_PRICE_ALACARTE_WEEKLY_REPORTING`
   - etc.
3. Update checkout flow in `apps/m-ops-services/app/api/create-checkout/route.ts`

---

## Where to Get Values

### Railway Database URL
1. Railway Dashboard → PostgreSQL service
2. Click "Connect" tab
3. Copy connection string

### Railway Redis URL
1. Railway Dashboard → Redis service (or Upstash)
2. Copy connection string
3. Format: `redis://` or `rediss://` (SSL)

### Stripe Price IDs
1. Stripe Dashboard → Products
2. Create product for each package (A, B, C, D)
3. Add recurring pricing (monthly)
4. Copy Price ID (starts with `price_`)

### Supabase Credentials
1. Supabase Dashboard → Project Settings → API
2. Copy:
   - Project URL → `SUPABASE_URL`
   - anon/public key → `SUPABASE_ANON_KEY`
   - service_role key → `SUPABASE_SERVICE_KEY`

### SendGrid API Key
1. SendGrid Dashboard → Settings → API Keys
2. Create API key with "Full Access"
3. Copy key (starts with `SG.`)

### Anthropic API Key
1. Anthropic Console → API Keys
2. Create new key
3. Copy key (starts with `sk-ant-`)

---

## Manual Addition (Alternative)

If you prefer to add variables manually in Railway dashboard:

1. Go to Railway Dashboard
2. Select service (API or Worker)
3. Go to Variables tab
4. Click "New Variable"
5. Add each variable

---

## Verification

After adding variables, verify they're set:

```bash
# List variables for a service
railway variables --service api
railway variables --service worker
```

---

## Important Notes

### ⚠️ Stripe Price IDs are REQUIRED

Without the Stripe Price IDs (`STRIPE_PRICE_PACKAGE_A`, `STRIPE_PRICE_PACKAGE_B`, etc.), the ops services checkout flow will fail. These must be set in the **API service** environment variables.

### Service Names

Railway service names may differ from "api" and "worker". Check your Railway dashboard for exact service names and update the script accordingly.

### Environment-Specific Variables

- **Production**: Use live Stripe keys (`sk_live_...`, `pk_live_...`)
- **Staging/Preview**: Use test Stripe keys (`sk_test_...`, `pk_test_...`)

---

## Troubleshooting

### "Service not found" error
- Check exact service name in Railway dashboard
- Update script to use correct service name

### Variables not appearing
- Ensure you're logged in: `railway login`
- Check you have permissions for the project
- Verify service exists in Railway dashboard

### Checkout fails
- Verify all 4 Stripe Price IDs are set
- Check Price IDs match products in Stripe Dashboard
- Ensure prices are active and recurring (monthly)

