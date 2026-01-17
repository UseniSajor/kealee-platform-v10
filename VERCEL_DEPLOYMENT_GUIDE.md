# Vercel Deployment Guide for Kealee Platform

## Overview

This monorepo contains multiple Next.js apps that can be deployed to Vercel. Each app should be deployed as a separate Vercel project.

## Apps to Deploy

### Next.js Apps (Deploy to Vercel):
- ✅ `apps/m-permits-inspections` - Permits & Inspections Hub
- ✅ `apps/os-admin` - Platform Administration Dashboard
- ✅ `apps/os-pm` - Project Manager Dashboard
- ✅ `apps/m-project-owner` - Project Owner Portal
- ✅ `apps/m-architect` - Architect Dashboard
- ✅ `apps/m-ops-services` - Operations Services Dashboard

### Mobile App (NOT for Vercel):
- ❌ `apps/m-inspector` - React Native mobile app (deploy to app stores)

---

## Prerequisites

Before deploying to Vercel:

1. ✅ Railway API is deployed and running
2. ✅ You have your Railway API URL (e.g., `https://your-api.up.railway.app`)
3. ✅ Supabase project is set up
4. ✅ GitHub repository is connected to Vercel

---

## Required Environment Variables

Each Vercel app needs these environment variables:

### All Next.js Apps:

```env
# Railway API URL (where your backend is deployed)
NEXT_PUBLIC_API_URL=https://your-api.up.railway.app

# Supabase Authentication
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Supabase Service Role (for API routes that need admin access)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Node Environment
NODE_ENV=production
```

### Optional (if app uses these):

```env
# OpenAI (if using AI features)
NEXT_PUBLIC_OPENAI_API_KEY=sk-...

# Mapbox (for m-permits-inspections mapping features)
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ...
```

---

## Deployment Steps

### Step 1: Deploy First App (m-permits-inspections)

1. **Go to Vercel Dashboard** → [vercel.com/new](https://vercel.com/new)

2. **Import Git Repository:**
   - Select your GitHub repository: `UseniSajor/kealee-platform-v10`
   - Click "Import"

3. **Configure Project:**
   - **Project Name:** `kealee-permits-inspections` (or your choice)
   - **Framework Preset:** Next.js (auto-detected)
   - **Root Directory:** `apps/m-permits-inspections`
   - **Build Command:** `cd ../.. && pnpm install --filter @kealee/m-permits-inspections... && pnpm build --filter @kealee/m-permits-inspections`
   - **Output Directory:** `.next` (default)
   - **Install Command:** `cd ../.. && pnpm install --filter @kealee/m-permits-inspections...`

4. **Add Environment Variables:**
   - Click "Environment Variables"
   - Add all required variables (see above)
   - Click "Add" for each

5. **Deploy:**
   - Click "Deploy"
   - Wait for build to complete

### Step 2: Deploy Remaining Apps

Repeat Step 1 for each app, changing:
- **Project Name** (unique for each app)
- **Root Directory** (point to each app folder)
- **Build Command** (update filter name)

---

## Vercel Configuration Files

Each app has its own configuration. See `apps/[app-name]/vercel.json` if present, or use Vercel's dashboard settings.

### Build Settings for Each App:

| App | Root Directory | Build Command |
|-----|----------------|---------------|
| `m-permits-inspections` | `apps/m-permits-inspections` | `cd ../.. && pnpm install --filter @kealee/m-permits-inspections... && pnpm build --filter @kealee/m-permits-inspections` |
| `os-admin` | `apps/os-admin` | `cd ../.. && pnpm install --filter @kealee/os-admin... && pnpm build --filter @kealee/os-admin` |
| `os-pm` | `apps/os-pm` | `cd ../.. && pnpm install --filter @kealee/os-pm... && pnpm build --filter @kealee/os-pm` |
| `m-project-owner` | `apps/m-project-owner` | `cd ../.. && pnpm install --filter @kealee/m-project-owner... && pnpm build --filter @kealee/m-project-owner` |
| `m-architect` | `apps/m-architect` | `cd ../.. && pnpm install --filter @kealee/m-architect... && pnpm build --filter @kealee/m-architect` |
| `m-ops-services` | `apps/m-ops-services` | `cd ../.. && pnpm install --filter @kealee/m-ops-services... && pnpm build --filter @kealee/m-ops-services` |

---

## Monorepo Configuration

Since this is a pnpm monorepo, Vercel needs special configuration:

### Option 1: Using Vercel Dashboard (Recommended)

For each app, in Vercel Project Settings:

1. **General → Root Directory:** Set to `apps/[app-name]`
2. **Build & Development Settings:**
   - **Install Command:** `cd ../.. && pnpm install --filter @kealee/[app-name]...`
   - **Build Command:** `cd ../.. && pnpm build --filter @kealee/[app-name]`
   - **Output Directory:** `.next` (auto-detected)

### Option 2: Using vercel.json

Each app can have its own `vercel.json` in the app directory (see examples below).

---

## Environment Variables Reference

### Where to Get Values:

1. **NEXT_PUBLIC_API_URL:**
   - Railway Dashboard → Your API Service → Settings → Domains
   - Format: `https://your-api-name.up.railway.app`

2. **NEXT_PUBLIC_SUPABASE_URL:**
   - Supabase Dashboard → Settings → API → Project URL

3. **NEXT_PUBLIC_SUPABASE_ANON_KEY:**
   - Supabase Dashboard → Settings → API → anon/public key

4. **SUPABASE_SERVICE_ROLE_KEY:**
   - Supabase Dashboard → Settings → API → service_role key

---

## Deployment Checklist

Before deploying each app:

- [ ] Railway API is deployed and accessible
- [ ] Railway API URL is copied
- [ ] Supabase credentials are ready
- [ ] Root Directory is set correctly
- [ ] Build Command includes pnpm filter
- [ ] All environment variables are added
- [ ] Test build locally first (optional but recommended)

---

## Testing After Deployment

1. **Check Build Logs:**
   - Vercel Dashboard → Deployments → Latest → Build Logs
   - Should complete without errors

2. **Test the App:**
   - Visit the Vercel URL (provided after deployment)
   - Test login/signup (should connect to Supabase)
   - Test API calls (should connect to Railway)

3. **Check Environment Variables:**
   - Vercel Dashboard → Settings → Environment Variables
   - Verify all `NEXT_PUBLIC_*` variables are set

---

## Troubleshooting

### Build Fails: "Cannot find module @kealee/..."

**Solution:** Make sure build command runs from monorepo root:
```bash
cd ../.. && pnpm install --filter @kealee/[app-name]...
```

### Build Fails: "Missing environment variable"

**Solution:** Check Vercel Environment Variables:
- All `NEXT_PUBLIC_*` variables must be set
- Variables are case-sensitive
- Redeploy after adding variables

### API Calls Fail: "Network Error"

**Solution:**
- Verify `NEXT_PUBLIC_API_URL` is correct Railway URL
- Check Railway API is running
- Test Railway API directly: `https://your-api.up.railway.app/health`

### Authentication Not Working

**Solution:**
- Verify Supabase variables are set
- Check `NEXT_PUBLIC_SUPABASE_URL` format
- Ensure `NEXT_PUBLIC_SUPABASE_ANON_KEY` is correct

---

## Quick Deploy Commands

After initial setup, you can use Vercel CLI:

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy from app directory
cd apps/m-permits-inspections
vercel --prod
```

---

## Next Steps

After deploying all apps:

1. ✅ Set up custom domains (optional)
2. ✅ Configure password protection (for testing)
3. ✅ Set up preview deployments for branches
4. ✅ Configure analytics and monitoring
5. ✅ Set up staging environment

---

## Support

If you encounter issues:
1. Check Vercel build logs
2. Verify all environment variables
3. Test Railway API is accessible
4. Check Supabase project is active
