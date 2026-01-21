# Vercel Deployment Fix Guide

## Issue: All Vercel Deployments Failed

### Common Causes:

1. **Missing Environment Variables**
   - `DATABASE_URL` (Railway PostgreSQL)
   - `NEXT_PUBLIC_API_URL` (Railway API endpoint)
   - `SUPABASE_URL` and `SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

2. **Build Command Issues**
   - Turborepo build commands may need adjustment
   - Missing dependencies in package.json

3. **Railway Database Connection**
   - DATABASE_URL may need updating if Railway database was recreated
   - Connection string format may have changed

---

## Quick Fix Steps

### 1. Check Railway Database URL

```bash
# Get Railway database URL from Railway dashboard
# Format: postgresql://postgres:password@host:port/railway?sslmode=require
```

### 2. Update Vercel Environment Variables

For each app in Vercel, set these environment variables:

#### Required for ALL Apps:
```env
DATABASE_URL=postgresql://postgres:password@host:port/railway?sslmode=require
NEXT_PUBLIC_API_URL=https://api.kealee.com
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

#### App-Specific Variables:

**m-marketplace:**
```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
```

**m-ops-services:**
```env
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**m-permits-inspections:**
```env
GOOGLE_PLACES_API_KEY=your-google-api-key
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_S3_BUCKET=your-bucket-name
```

---

## 3. Fix Build Commands

### For Turborepo Apps (os-pm, os-admin):

Update `vercel.json`:
```json
{
  "buildCommand": "cd ../.. && pnpm install && pnpm turbo run build --filter=os-pm",
  "installCommand": "cd ../.. && pnpm install",
  "outputDirectory": ".next"
}
```

### For Standalone Apps:

Ensure `package.json` has:
```json
{
  "scripts": {
    "build": "next build",
    "dev": "next dev"
  }
}
```

---

## 4. Railway Database Connection

### Check Railway Dashboard:

1. Go to Railway dashboard
2. Select your PostgreSQL service
3. Copy the connection string from "Connect" tab
4. Update `DATABASE_URL` in Vercel

### Connection String Format:
```
postgresql://postgres:password@containers-us-west-xxx.railway.app:5432/railway?sslmode=require
```

---

## 5. Verify API Endpoint

### Check Railway API Service:

1. Go to Railway dashboard
2. Select your API service
3. Copy the public URL (e.g., `https://api-production-xxxx.up.railway.app`)
4. Update `NEXT_PUBLIC_API_URL` in all Vercel apps

---

## 6. Test Deployment

After updating environment variables:

1. Go to Vercel dashboard
2. Select each project
3. Click "Redeploy" → "Redeploy with existing Build Cache"
4. Monitor build logs for errors

---

## Common Build Errors & Fixes

### Error: "Module not found"
**Fix:** Ensure all dependencies are in `package.json` and run `pnpm install` locally first

### Error: "Cannot connect to database"
**Fix:** Check `DATABASE_URL` format and Railway service status

### Error: "API request failed"
**Fix:** Verify `NEXT_PUBLIC_API_URL` points to correct Railway endpoint

### Error: "Supabase auth failed"
**Fix:** Verify Supabase environment variables are set correctly

---

## Automated Fix Script

Run this to check all environment variables:

```bash
# Check Vercel projects
vercel env ls

# Pull environment variables
vercel env pull .env.local
```

---

## Next Steps

1. ✅ Update Railway database URL in Vercel
2. ✅ Update Railway API URL in Vercel
3. ✅ Verify Supabase credentials
4. ✅ Redeploy all apps
5. ✅ Monitor build logs

---

## Railway Configuration Files

Current Railway configs:
- `railway.json` - Root config
- `services/api/railway.json` - API service config
- `services/worker/railway.json` - Worker service config

These should be automatically detected by Railway. If deployments fail, check:
- Railway service is running
- Database is provisioned
- Environment variables are set in Railway

