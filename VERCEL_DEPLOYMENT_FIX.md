# Vercel Deployment Fix

## Problem
Vercel deployment failing with `ERR_PNPM_META_FETCH_FAIL` and `ERR_INVALID_THIS` errors.

## Root Cause
Vercel's default PNPM version (8.x) has a bug with URL parsing that causes npm registry fetch failures.

## Solution Applied

### 1. Files Updated
- ✅ `.node-version` - Set Node.js 20
- ✅ `pnpm-workspace.yaml` - Define workspace structure
- ✅ `.npmrc` - Enhanced PNPM configuration
- ✅ `package.json` - Updated packageManager to pnpm@9.15.4
- ✅ All `apps/*/vercel.json` - Added corepack commands

### 2. Configuration Changes

#### `.npmrc` Updates:
```ini
auto-install-peers=true
strict-peer-dependencies=false
network-timeout=300000
fetch-retries=3
fetch-retry-mintimeout=20000
fetch-retry-maxtimeout=120000
shamefully-hoist=true
public-hoist-pattern[]=*
resolution-mode=highest
node-linker=hoisted
```

#### `vercel.json` Updates:
All app configs now explicitly enable corepack and prepare PNPM 9.15.4:
```json
{
  "installCommand": "cd ../.. && corepack enable && corepack prepare pnpm@9.15.4 --activate && pnpm install --no-frozen-lockfile",
  "buildCommand": "cd ../.. && corepack enable && corepack prepare pnpm@9.15.4 --activate && pnpm build --filter=<app-name>"
}
```

### 3. Additional Vercel Dashboard Settings

**IMPORTANT:** You must also configure these settings in Vercel Dashboard:

#### For Each Project:
1. Go to **Project Settings** → **General**
2. Set **Node.js Version**: `20.x`
3. Set **Package Manager**: `pnpm`

#### Environment Variables (Optional but Recommended):
Go to **Project Settings** → **Environment Variables** and add:
```
ENABLE_EXPERIMENTAL_COREPACK=1
VERCEL_FORCE_NO_BUILD_CACHE=1
```

## Deployment Process

### Step 1: Push Changes
```bash
git add .
git commit -m "Fix: Configure Vercel for PNPM 9.15.4 with corepack"
git push
```

### Step 2: Monitor Deployment
1. Go to Vercel Dashboard → Deployments
2. Watch for new deployment triggered by push
3. Check build logs for:
   - ✅ `corepack enable`
   - ✅ `Preparing pnpm@9.15.4`
   - ✅ `Installing dependencies`
   - ✅ `Build completed`

### Step 3: If Build Still Fails
Try these in order:

1. **Clear Build Cache**
   - Vercel Dashboard → Settings → Clear Build Cache
   - Redeploy

2. **Set Environment Variables**
   - Add `ENABLE_EXPERIMENTAL_COREPACK=1`
   - Redeploy

3. **Manual Deploy via CLI**
   ```bash
   cd apps/<app-name>
   vercel --prod
   ```

## Expected Build Output

When working correctly, you should see:
```
Running "corepack enable"
✓ Corepack enabled
Running "corepack prepare pnpm@9.15.4 --activate"
✓ Preparing pnpm@9.15.4 for immediate activation
✓ Dependencies installed successfully (using pnpm 9.15.4)
✓ Build completed successfully
```

## Troubleshooting

### Issue: Still Getting ERR_INVALID_THIS
**Solution:** Vercel might be caching the old PNPM version
- Clear build cache in Vercel dashboard
- Add `VERCEL_FORCE_NO_BUILD_CACHE=1` env var
- Force redeploy

### Issue: Corepack Command Not Found
**Solution:** Node version too old
- Update Node.js version to 20.x in Vercel settings
- Corepack is included by default in Node 16.9+

### Issue: Workspace Dependencies Not Found
**Solution:** Monorepo not properly configured
- Verify `pnpm-workspace.yaml` exists at root
- Verify `--filter` flag matches app name in `package.json`

## Apps Configured
- ✅ m-ops-services
- ✅ os-pm
- ✅ m-finance-trust
- ✅ m-marketplace
- ✅ m-project-owner
- ✅ m-architect
- ✅ m-permits-inspections
- ✅ os-admin

## Status
- **Local PNPM Version**: 9.15.4 ✅
- **Vercel Configuration**: Updated ✅
- **Workspace Configuration**: Created ✅
- **Ready to Deploy**: YES ✅

---

**Last Updated:** 2025-01-24
**Commit:** Includes corepack activation in all vercel.json files
