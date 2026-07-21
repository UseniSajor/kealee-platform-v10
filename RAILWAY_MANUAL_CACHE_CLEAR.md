# Railway Manual Cache Clear - Required Steps

## ⚠️ CRITICAL: If Automatic Cache Busting Doesn't Work

If Railway is still using the old Dockerfile after commit `b9936b8`, you **MUST manually clear the cache** in Railway.

## Step-by-Step Manual Cache Clear

### Option 1: Railway Dashboard (Recommended)

1. **Go to Railway Dashboard**
   - Navigate to https://railway.app
   - Select your project
   - Select the **api-staging** service

2. **Clear Build Cache**
   - Click on **Settings** tab
   - Scroll to **Build** section
   - Look for **"Clear Build Cache"** or **"Rebuild from Scratch"** button
   - Click it to clear all cached layers

3. **Force Redeploy**
   - Go to **Deployments** tab
   - Click **"Redeploy"** on the latest deployment
   - OR click **"Deploy"** to trigger a new build

4. **Verify Build is Using New Code**
   - Watch the build logs
   - Look for: `BUILD_VERSION: 6.1.0`
   - Look for: `CACHE INVALIDATION FORCED`
   - Should see: `pnpm --filter @kealee/database run build` (NOT `pnpm build --filter`)

### Option 2: Railway CLI

If you have Railway CLI installed:

```bash
# Install Railway CLI if needed
npm i -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Clear cache and redeploy
railway up --no-cache
```

### Option 3: Delete and Recreate Service (Last Resort)

If cache clearing doesn't work:

1. **Create a new service** in Railway
2. **Connect it to the same GitHub repo**
3. **Use the same environment variables**
4. **Point to the same database**
5. **Delete the old service** once new one is working

## Verification Checklist

After manual cache clear, verify in build logs:

- [ ] Build shows `BUILD_VERSION: 6.1.0`
- [ ] Build shows `CACHE INVALIDATION FORCED`
- [ ] Build shows `RAILWAY BUILD MARKER` with `BUILD_ID=force-rebuild-v7-aggressive-cache-bust`
- [ ] Database build step shows: `pnpm --filter @kealee/database run build`
- [ ] **NO** `turbo: not found` errors
- [ ] **NO** `pnpm build --filter` commands (old syntax)

## If Still Failing After Manual Clear

1. **Check Railway is using correct branch:**
   - Settings → Source → Verify branch is `main`
   - Verify commit hash matches `b9936b8`

2. **Check for multiple railway.json files:**
   - Root `railway.json` should have `"builder": "DOCKERFILE"`
   - No conflicting configs in subdirectories

3. **Check Dockerfile path:**
   - Railway should be reading `./Dockerfile` from root
   - Verify `railway.json` has: `"dockerfilePath": "./Dockerfile"`

4. **Contact Railway Support:**
   - If cache persists after manual clear, this is a Railway bug
   - Report to Railway support with commit hash `b9936b8`

## Expected Build Log Output

You should see something like:

```
=========================================
CACHE INVALIDATION FORCED
BUILD_DATE: 2026-01-21T14:30:00Z
BUILD_VERSION: 6.1.0
CACHE_BUST: 9241af0
RAILWAY_FORCE_REBUILD: true
=========================================
RAILWAY BUILD MARKER:
BUILD_ID=force-rebuild-v7-aggressive-cache-bust
...
=========================================
=== STEP: Building database package ===
Running build script via pnpm...
pnpm --filter @kealee/database run build
> @kealee/database@1.0.0 build /app/packages/database
> tsc
=== SUCCESS: Database package built ===
```

## Commits Made

- `b9936b8` - **AGGRESSIVE cache busting** (current)
- `9241af0` - Documentation
- `6aaf15a` - Cache invalidation fix
- `6026742` - API build fix
- `b62b7c2` - Package build fixes
- `6ddaebf` - Package configuration fixes

