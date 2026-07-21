# Railway Environment Variables Guide

## How `.env.local` Works vs Railway

### Important: `.env.local` Does NOT Connect to Railway

**`.env.local` files are for LOCAL DEVELOPMENT ONLY** and are:
- ✅ Gitignored (never committed to git)
- ✅ Only loaded on your local machine
- ❌ **NOT read by Railway**
- ❌ **NOT accessible in production**

## How Railway Gets Environment Variables

Railway uses **environment variables set in the Railway dashboard**, not `.env.local` files.

### The Flow

```
Local Development:
  .env.local → dotenv loads it → process.env → Your app

Railway Production:
  Railway Dashboard → Environment Variables → process.env → Your app
  (No .env.local files involved!)
```

## Current Code Behavior

Looking at `services/api/src/index.ts`:

```typescript
// Load .env.local file (for API service)
config({ path: resolve(process.cwd(), '.env.local') })

// Only in development, also load database .env
if (process.env.NODE_ENV !== 'production') {
  config({ path: resolve(process.cwd(), '../../packages/database/.env'), override: true })
}
```

**What happens:**
- **Local dev**: Loads `.env.local` ✅
- **Railway**: Tries to load `.env.local` (file doesn't exist, silently fails) → Falls back to `process.env` (which Railway provides) ✅

This works because:
1. Railway sets environment variables directly in `process.env`
2. The `dotenv` call fails silently if `.env.local` doesn't exist
3. Your app reads from `process.env` (which Railway populated)

## How to Set Environment Variables in Railway

### Method 1: Railway Dashboard (Recommended)

1. Go to your Railway project
2. Click on a service (e.g., "api")
3. Go to **"Variables"** tab
4. Click **"New Variable"**
5. Add each variable:
   - **Name**: `SUPABASE_URL`
   - **Value**: `https://your-project.supabase.co`
   - Click **"Add"**

### Method 2: Railway CLI

```bash
# Set a variable for a specific service
railway variables set SUPABASE_URL=https://your-project.supabase.co --service api

# Set a shared variable (available to all services)
railway variables set DATABASE_URL=postgresql://... --service $RAILWAY_PROJECT_ID
```

### Method 3: Bulk Import (via Dashboard)

1. Go to service → Variables
2. Click **"Raw Editor"**
3. Paste your variables in format:
   ```
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your_key_here
   DATABASE_URL=postgresql://...
   ```
4. Click **"Save"**

## Migrating from `.env.local` to Railway

### Step 1: List Your Local Variables

Check your `.env.local` files:
```bash
# API service
cat services/api/.env.local

# Worker service  
cat services/worker/.env.local
```

### Step 2: Add to Railway

For each variable in `.env.local`:

1. **Copy the variable name and value**
2. **Go to Railway dashboard**
3. **Add it to the appropriate service**

**Example:**
```bash
# In services/api/.env.local:
SUPABASE_URL=https://abc123.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...

# In Railway:
# Service: api
# Variable: SUPABASE_URL = https://abc123.supabase.co
# Variable: SUPABASE_ANON_KEY = eyJhbGc...
```

## Environment Variable Organization

### Project-Level Variables (Shared)
Set these at the **project level** so all services can access them:

- `DATABASE_URL` (from PostgreSQL addon - auto-set)
- `NODE_ENV=production`

### Service-Level Variables
Set these per service:

**API Service:**
- `PORT` (auto-set by Railway)
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY` (for user authentication)
- `SUPABASE_SERVICE_ROLE_KEY` (⚠️ REQUIRED - for API keys, webhooks, security audit, analytics)
- `REDIS_URL`
- `API_URL` (set after first deployment)
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

**Worker Service:**
- `REDIS_URL`
- `DATABASE_URL` (or use project-level)
- `SENDGRID_API_KEY`
- `SENDGRID_FROM_EMAIL`
- `ANTHROPIC_API_KEY`

## Best Practices

### ✅ DO:
- Use Railway dashboard to set production variables
- Keep `.env.local` for local development only
- Use `.env.example` files as templates (committed to git)
- Set sensitive variables in Railway (never commit them)
- Use Railway's variable sharing for common variables

### ❌ DON'T:
- Commit `.env.local` files to git
- Try to upload `.env.local` files to Railway
- Hardcode secrets in your code
- Share `.env.local` files between team members (use Railway variables)

## Verification

### Check Variables in Railway

**Via Dashboard:**
1. Service → Variables tab
2. See all set variables

**Via CLI:**
```bash
railway variables --service api
```

### Test in Your App

Your code should read from `process.env`:

```typescript
// This works in both local (from .env.local) and Railway (from dashboard)
const supabaseUrl = process.env.SUPABASE_URL
```

## Troubleshooting

### "Variable not found" in Railway

**Problem**: App can't find environment variable

**Solution**:
1. Check variable is set in Railway dashboard
2. Verify variable name matches exactly (case-sensitive)
3. Redeploy service after adding variables
4. Check service logs: `railway logs --service api`

### Variables work locally but not on Railway

**Problem**: `.env.local` works, Railway doesn't

**Solution**:
1. Verify you added the variable in Railway dashboard
2. Check the variable name matches exactly
3. Ensure you're looking at the correct service
4. Redeploy after adding variables

### Database URL not working

**Problem**: `DATABASE_URL` is undefined

**Solution**:
1. If using Railway PostgreSQL addon, `DATABASE_URL` is auto-set
2. Check it exists: `railway variables --service api | grep DATABASE_URL`
3. If missing, add PostgreSQL addon or set manually

## Quick Reference

```bash
# View all variables for a service
railway variables --service api

# Set a variable
railway variables set KEY=value --service api

# Unset a variable
railway variables unset KEY --service api

# View logs (to debug env var issues)
railway logs --service api
```

## Summary

- **`.env.local`** = Local development only (gitignored)
- **Railway Dashboard** = Production environment variables
- **No connection** between `.env.local` and Railway
- **You must manually add** each variable to Railway
- **Railway sets** `process.env` directly (no file needed)
