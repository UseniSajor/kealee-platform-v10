# Railway Docker Cache Fix - Complete Solution

## Problem
Railway was using cached Docker layers, causing it to continue using the old Dockerfile code even after 4 commits with fixes. The error showed Railway was still executing:
```bash
pnpm build --filter=@kealee/database
```
Instead of the new:
```bash
pnpm --filter @kealee/database run build
```

## Root Cause
Railway's Docker layer caching was aggressively caching the Dockerfile build steps, preventing new changes from being picked up.

## Solution Applied

### 1. Updated Build Marker File (`.railway-build-marker`)
- Changed `BUILD_ID` to `fix-dockerfile-build-commands-v6`
- Updated `VERSION` to `6.0.0`
- Added `FORCE_REBUILD=true`
- Updated timestamp and commit hash

This file is copied early in the Dockerfile, so changing it invalidates all subsequent layers.

### 2. Added Build Arguments to Dockerfile
```dockerfile
ARG BUILD_DATE=2026-01-21
ARG BUILD_VERSION=6.0.0
ARG CACHE_BUST=6026742
```

These ARGs force Docker to rebuild layers when they change.

### 3. Updated Dockerfile Version Comment
Added clear version information at the top:
```dockerfile
# Version: 6.0.0
# Last Updated: 2026-01-21
# Commit: 6026742
```

### 4. All Build Commands Fixed
- ✅ Database package: `pnpm --filter @kealee/database run build`
- ✅ Workflow-engine: `pnpm --filter @kealee/workflow-engine run build`
- ✅ Other packages: `pnpm --filter @kealee/$pkg run build`
- ✅ API service: `pnpm --filter @kealee/api run build`

## Commits Made
1. `6ddaebf` - Package configuration fixes
2. `b62b7c2` - Dockerfile build fixes (packages)
3. `6026742` - API service build fix
4. `6aaf15a` - **Cache invalidation fix** (this commit)

## What Railway Needs to Do

### Automatic (Should Happen)
Railway should automatically detect the new commit and rebuild. The build marker change will force a complete rebuild from scratch.

### Manual Steps (If Automatic Doesn't Work)
1. **Clear Build Cache in Railway:**
   - Go to Railway dashboard
   - Select your service
   - Go to Settings → Build
   - Click "Clear Build Cache" or "Rebuild from Scratch"

2. **Force Redeploy:**
   - Go to Deployments
   - Click "Redeploy" on the latest deployment
   - Or trigger a new deployment manually

3. **Verify Dockerfile Path:**
   - Check `railway.json` has: `"dockerfilePath": "./Dockerfile"`
   - Verify the Dockerfile is at the project root

## Verification

After Railway rebuilds, check the build logs for:
- ✅ `BUILD_VERSION: 6.0.0` in the build marker output
- ✅ `pnpm --filter @kealee/database run build` (not `pnpm build --filter`)
- ✅ No "turbo: not found" errors
- ✅ Successful database package build

## If Still Failing

If Railway still shows the old error after this fix:

1. **Check Railway is using the correct branch:**
   - Verify Railway is connected to `main` branch
   - Check the commit hash in Railway matches `6aaf15a`

2. **Check for multiple railway.json files:**
   - Root `railway.json` should use `DOCKERFILE` builder
   - No conflicting `railway.json` in subdirectories

3. **Manual cache clear:**
   - Railway dashboard → Service → Settings → Clear cache
   - Or use Railway CLI: `railway up --no-cache`

4. **Verify Dockerfile is being read:**
   - Check Railway build logs show the version comment
   - Should see "Version: 6.0.0" in logs

## Expected Build Output

You should now see in Railway logs:
```
=== STEP: Building database package ===
Running build script via pnpm...
pnpm --filter @kealee/database run build
> @kealee/database@1.0.0 build /app/packages/database
> tsc
=== SUCCESS: Database package built ===
```

Instead of the old error with `turbo: not found`.

