# Environment Variables Setup Guide

Complete guide for setting up environment variables across all applications.

## Quick Start

### Automatic Setup

```bash
# Generate .env.local files from templates
./scripts/setup-env-local.sh
```

This will:
- ✅ Copy `.env.example` to `.env.local` for each app
- ✅ Set default DATABASE_URL
- ✅ Generate NEXTAUTH_SECRET automatically
- ✅ Preserve existing files (with confirmation)

### Manual Setup

```bash
# Copy example file
cp apps/m-marketplace/.env.example apps/m-marketplace/.env.local

# Edit with your values
nano apps/m-marketplace/.env.local
```

## Required Environment Variables

### All Apps

#### Database
```env
DATABASE_URL="postgresql://kealee:kealee_dev@localhost:5433/kealee_development"
```

#### NextAuth (if using)
```env
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
```

**Generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

#### API URLs
```env
NEXT_PUBLIC_API_URL="http://localhost:3001"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

### App-Specific Variables

#### m-marketplace (Port 3000)

```env
# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Stripe Price IDs
STRIPE_PRICE_PACKAGE_A="price_..."
STRIPE_PRICE_PACKAGE_B="price_..."
STRIPE_PRICE_PACKAGE_C="price_..."
STRIPE_PRICE_PACKAGE_D="price_..."

# Analytics (Optional)
NEXT_PUBLIC_GA_MEASUREMENT_ID="G-XXXXXXXXXX"
NEXT_PUBLIC_GTM_ID="GTM-XXXXXXX"
NEXT_PUBLIC_FB_PIXEL_ID=""
NEXT_PUBLIC_HOTJAR_ID=""
NEXT_PUBLIC_CRISP_WEBSITE_ID=""

# Monitoring
NEXT_PUBLIC_SENTRY_DSN=""

# Google Maps (Optional)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=""
```

#### m-ops-services (Port 3005)

```env
# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Stripe Price IDs
STRIPE_PRICE_PACKAGE_A="price_..."
STRIPE_PRICE_PACKAGE_B="price_..."
STRIPE_PRICE_PACKAGE_C="price_..."
STRIPE_PRICE_PACKAGE_D="price_..."
```

#### os-admin (Port 3002)

```env
# Supabase Auth
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

#### m-project-owner (Port 3004)

```env
# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
```

#### m-permits-inspections (Port 3007)

```env
# Stripe (for jurisdiction subscriptions)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
```

#### services/api (Port 3001)

```env
# Server
PORT=3001
NODE_ENV=development

# Supabase Auth
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Stripe Price IDs
STRIPE_PRICE_PACKAGE_A="price_..."
STRIPE_PRICE_PACKAGE_B="price_..."
STRIPE_PRICE_PACKAGE_C="price_..."
STRIPE_PRICE_PACKAGE_D="price_..."

# CORS
CORS_ORIGIN="http://localhost:3000,http://localhost:3002,http://localhost:3003,http://localhost:3004,http://localhost:3005,http://localhost:3006,http://localhost:3007"
```

## Getting API Keys

### Stripe Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Developers** → **API keys**
3. Copy:
   - **Secret key** → `STRIPE_SECRET_KEY`
   - **Publishable key** → `STRIPE_PUBLISHABLE_KEY`
4. For webhooks:
   - Go to **Developers** → **Webhooks**
   - Create endpoint or view existing
   - Copy **Signing secret** → `STRIPE_WEBHOOK_SECRET`

### Stripe Price IDs

1. Go to **Products** in Stripe Dashboard
2. Find your products (Package A, B, C, D)
3. Copy the **Price ID** for each:
   - Monthly price → `STRIPE_PRICE_PACKAGE_X`
   - Annual price (optional) → `STRIPE_PRICE_PACKAGE_X_ANNUAL`

### Supabase Keys

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → `SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `SUPABASE_ANON_KEY` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

### Google Analytics

1. Go to [Google Analytics](https://analytics.google.com)
2. Create property or use existing
3. Go to **Admin** → **Data Streams**
4. Copy **Measurement ID** → `NEXT_PUBLIC_GA_MEASUREMENT_ID`

### Sentry

1. Go to [Sentry](https://sentry.io)
2. Create project or use existing
3. Copy **DSN** → `NEXT_PUBLIC_SENTRY_DSN` / `SENTRY_DSN`

## Development vs Production

### Development

Use test keys and local URLs:
- `STRIPE_SECRET_KEY="sk_test_..."`
- `DATABASE_URL="postgresql://...localhost..."`
- `NEXTAUTH_URL="http://localhost:3000"`

### Production

Use live keys and production URLs:
- `STRIPE_SECRET_KEY="sk_live_..."`
- `DATABASE_URL="postgresql://...production-db..."`
- `NEXTAUTH_URL="https://marketplace.kealee.com"`

## Environment File Locations

Each app has its own `.env.local` file:
```
apps/
  m-marketplace/.env.local
  m-ops-services/.env.local
  os-admin/.env.local
  os-pm/.env.local
  m-project-owner/.env.local
  m-architect/.env.local
  m-permits-inspections/.env.local
services/
  api/.env.local
```

## Security Best Practices

### ✅ Do

- ✅ Use `.env.local` (gitignored)
- ✅ Use different secrets for dev/staging/production
- ✅ Rotate secrets regularly
- ✅ Use strong NEXTAUTH_SECRET
- ✅ Never commit `.env.local` files

### ❌ Don't

- ❌ Commit `.env.local` files
- ❌ Share secrets in chat/email
- ❌ Use production keys in development
- ❌ Hardcode secrets in code
- ❌ Use weak secrets

## Verification

### Check Environment Variables

```bash
# For Next.js apps
cd apps/m-marketplace
npm run dev
# Check console for missing variables

# For API service
cd services/api
npm run dev
# Check startup logs
```

### Test Stripe Connection

```bash
# In m-ops-services
curl http://localhost:3005/api/env-test
```

### Test Database Connection

```bash
# Using psql
psql $DATABASE_URL -c "SELECT 1;"
```

## Troubleshooting

### Missing Environment Variables

**Error:** `STRIPE_SECRET_KEY is not set`

**Solution:**
1. Check `.env.local` exists
2. Verify variable name matches exactly
3. Restart dev server after changes

### Database Connection Failed

**Error:** `Can't reach database server`

**Solution:**
1. Check PostgreSQL is running
2. Verify DATABASE_URL format
3. Test connection: `psql $DATABASE_URL`

### NextAuth Errors

**Error:** `NEXTAUTH_SECRET is missing`

**Solution:**
1. Generate secret: `openssl rand -base64 32`
2. Add to `.env.local`
3. Restart dev server

### Stripe Webhook Errors

**Error:** `Invalid webhook signature`

**Solution:**
1. Verify `STRIPE_WEBHOOK_SECRET` matches Stripe Dashboard
2. Check webhook endpoint URL
3. Ensure correct Stripe API version

## Common Issues

### Port Conflicts

If port is already in use:
```bash
# Find process using port
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Kill process or change port in package.json
```

### Environment Variables Not Loading

1. Restart dev server
2. Check file is named `.env.local` (not `.env`)
3. Verify no syntax errors
4. Check Next.js version supports `.env.local`

### Different Values Across Apps

For SSO to work, use the same:
- `NEXTAUTH_SECRET` across all apps
- `NEXTAUTH_URL` should match app URL
- Database can be shared or separate

## Support

For environment variable issues:
1. Check `.env.example` for required variables
2. Verify all keys are set correctly
3. Test each service individually
4. Check logs for specific errors
5. Contact DevOps team
