# Vercel Environment Variables Reference

## Quick Add Script

Run this to add all variables interactively:

**PowerShell:**
```powershell
.\scripts\add-vercel-env-vars.ps1
```

**Bash:**
```bash
bash scripts/add-vercel-env-vars.sh
```

---

## Required Variables for ALL Apps

These variables must be added to **all 7 apps**:

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Railway PostgreSQL connection string | `postgresql://postgres:pass@host:port/railway?sslmode=require` |
| `NEXT_PUBLIC_API_URL` | Railway API endpoint | `https://api.kealee.com` or Railway URL |
| `SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `NEXT_PUBLIC_SUPABASE_URL` | Same as SUPABASE_URL (for client) | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same as SUPABASE_ANON_KEY (for client) | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `SUPABASE_SERVICE_KEY` | Supabase service role key (optional) | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |

---

## App-Specific Variables

### m-marketplace

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | `pk_live_...` or `pk_test_...` |
| `STRIPE_SECRET_KEY` | Stripe secret key | `sk_live_...` or `sk_test_...` |
| `NEXT_PUBLIC_APP_URL` | App URL | `https://www.kealee.com` |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Google Analytics ID (optional) | `G-XXXXXXXXXX` |
| `NEXT_PUBLIC_HOTJAR_ID` | Hotjar ID (optional) | `1234567` |

### m-ops-services

| Variable | Description | Example |
|----------|-------------|---------|
| `STRIPE_SECRET_KEY` | Stripe secret key | `sk_live_...` or `sk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | `whsec_...` |
| `NEXT_PUBLIC_APP_URL` | App URL | `https://ops.kealee.com` |

### m-permits-inspections

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_APP_URL` | App URL | `https://permits.kealee.com` |
| `NEXT_PUBLIC_GOOGLE_PLACES_API_KEY` | Google Places API key (optional) | `AIzaSy...` |
| `AWS_ACCESS_KEY_ID` | AWS access key (optional) | `AKIA...` |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key (optional) | `wJalr...` |
| `AWS_S3_BUCKET` | S3 bucket name (optional) | `kealee-documents` |

### m-project-owner

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_APP_URL` | App URL | `https://app.kealee.com` |

### m-architect

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_APP_URL` | App URL | `https://architect.kealee.com` |

### os-admin

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_APP_URL` | App URL | `https://admin.kealee.com` |

### os-pm

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_APP_URL` | App URL | `https://pm.kealee.com` |

---

## Optional Variables (All Apps)

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry DSN for error tracking | `https://xxx@sentry.io/xxx` |
| `SENTRY_DSN` | Sentry DSN (server-side) | `https://xxx@sentry.io/xxx` |

---

## Where to Get Values

### Railway Database URL
1. Go to Railway Dashboard
2. Select PostgreSQL service
3. Click "Connect" tab
4. Copy connection string

### Railway API URL
1. Go to Railway Dashboard
2. Select API service
3. Go to Settings → Public URL
4. Copy the URL (e.g., `https://api-production-xxxx.up.railway.app`)

### Supabase Credentials
1. Go to Supabase Dashboard
2. Select your project
3. Go to Settings → API
4. Copy:
   - Project URL → `SUPABASE_URL`
   - anon/public key → `SUPABASE_ANON_KEY`
   - service_role key → `SUPABASE_SERVICE_KEY`

### Stripe Keys
1. Go to Stripe Dashboard
2. Developers → API keys
3. Copy:
   - Publishable key → `STRIPE_PUBLISHABLE_KEY`
   - Secret key → `STRIPE_SECRET_KEY`
   - Webhooks → Add endpoint → Copy signing secret → `STRIPE_WEBHOOK_SECRET`

---

## Manual Addition (Alternative)

If you prefer to add variables manually in Vercel dashboard:

1. Go to Vercel Dashboard
2. Select each project
3. Go to Settings → Environment Variables
4. Add each variable for:
   - Production
   - Preview
   - Development (optional)

---

## Verification

After adding variables, verify they're set:

```bash
# Check variables for an app
vercel env ls m-marketplace production
```

Or use the check script:
```bash
bash scripts/check-vercel-env.sh
```




