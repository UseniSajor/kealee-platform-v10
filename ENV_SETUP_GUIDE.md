# Environment Variables Setup Guide

## Critical: APP_ENV is Required

The `APP_ENV` variable is **required** for all environments. The application will not start without it.

Valid values:
- `development` - Local development
- `staging` - Staging/preview environment
- `production` - Production environment

---

## Local Development

1. **Copy the example file:**
   ```bash
   cp .env.example .env.local
   # OR for API service
   cp services/api/.env.example services/api/.env.local
   ```

2. **Set APP_ENV:**
   ```env
   APP_ENV=development
   ```

3. **Update other required variables:**
   - `DATABASE_URL`
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

---

## Railway (Backend API)

### Staging Environment

1. Go to Railway Dashboard → Your Project → **Staging** environment
2. Click on `api-staging` service
3. Go to **Variables** tab
4. Add these **REQUIRED** variables:

```env
APP_ENV=staging
DATABASE_URL=postgresql://...@staging-postgres.internal:5432/railway
SUPABASE_URL=https://[PROJECT-REF].supabase.co
SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
NODE_ENV=staging
```

### Production Environment

1. Go to Railway Dashboard → Your Project → **Production** environment
2. Click on `api` (or `kealee-platform-v10`) service
3. Go to **Variables** tab
4. Add these **REQUIRED** variables:

```env
APP_ENV=production
DATABASE_URL=postgresql://...@production-postgres.internal:5432/railway
SUPABASE_URL=https://[PROJECT-REF].supabase.co
SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
NODE_ENV=production
```

---

## Vercel (Frontend Apps)

For **each** frontend app, set these in Vercel Dashboard:

### All Environments (Production, Preview, Development)

1. Go to Vercel Dashboard → Your Project → Settings → **Environment Variables**
2. Add `APP_ENV` for each environment:

**Production:**
```env
APP_ENV=production
NEXT_PUBLIC_API_URL=https://kealee-platform-v10-production.up.railway.app
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT-REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

**Preview:**
```env
APP_ENV=staging
NEXT_PUBLIC_API_URL=https://api-staging-production-xxx.up.railway.app
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT-REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

**Development:**
```env
APP_ENV=development
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT-REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

---

## Quick Fix for Current Error

If you're seeing the `APP_ENV is not set` error:

### For Railway:
```bash
# Using Railway CLI
railway variables set APP_ENV=staging --environment staging
railway variables set APP_ENV=production --environment production
```

### For Local Development:
```bash
# Create .env.local with APP_ENV
echo "APP_ENV=development" > .env.local
echo "DATABASE_URL=postgresql://postgres:postgres@localhost:5432/kealee" >> .env.local
# Add other required variables...
```

---

## Verification

After setting variables:

1. **Railway:** Check deployment logs for confirmation
2. **Vercel:** Redeploy to pick up new variables
3. **Local:** Run `pnpm dev` to test

---

## Reference Documents

- `RAILWAY_ENVIRONMENT_SETUP.md` - Complete Railway setup
- `ENVIRONMENT_VARIABLES_SETUP.md` - All environment variables
- `.cursor/rules.md` - Development guardrails

