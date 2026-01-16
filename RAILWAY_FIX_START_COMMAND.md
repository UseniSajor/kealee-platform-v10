# Fix: Railway "No start command was found" Error

## Problem

Railway detected your monorepo but can't find a start command because it's looking at the root directory.

## Solution: Configure Build & Start Commands in Railway Dashboard

You need to manually configure the build and start commands in Railway dashboard for each service.

### For API Service:

1. **Go to Railway Dashboard** → Your Project → API Service
2. **Click "Settings"** → **"Source"** tab
3. **Configure Build Command:**
   ```
   pnpm install && pnpm build --filter=@kealee/api
   ```
4. **Configure Start Command:**
   ```
   cd services/api && node dist/index.js
   ```
5. **Root Directory:** (leave empty - uses monorepo root)
6. **Click "Save"**

### For Worker Service:

1. **Go to Railway Dashboard** → Your Project → Worker Service
2. **Click "Settings"** → **"Source"** tab
3. **Configure Build Command:**
   ```
   pnpm install && pnpm build --filter=@kealee/worker
   ```
4. **Configure Start Command:**
   ```
   cd services/worker && node dist/index.js
   ```
5. **Root Directory:** (leave empty)
6. **Click "Save"**

## Alternative: Using Railway.json (If Supported)

I've created a `railway.json` in the root that specifies the start command for the API service. However, Railway may still need the build command configured in the dashboard.

## Quick Fix Steps

### Step 1: Configure API Service

1. Railway Dashboard → Your Project
2. Find your **API service** (or create one if it doesn't exist)
3. Click on the service → **Settings** → **Source**
4. Set:
   - **Build Command:** `pnpm install && pnpm build --filter=@kealee/api`
   - **Start Command:** `cd services/api && node dist/index.js`
5. Save

### Step 2: Configure Worker Service (if deploying)

1. Create new service or select existing worker service
2. Settings → Source
3. Set:
   - **Build Command:** `pnpm install && pnpm build --filter=@kealee/worker`
   - **Start Command:** `cd services/worker && node dist/index.js`
4. Save

### Step 3: Redeploy

After saving, Railway should automatically redeploy with the new commands.

## Why This Happens

Railway's auto-detection works for simple projects, but monorepos need explicit configuration because:
- The root `package.json` doesn't have a `start` script
- The services are in subdirectories
- Railway needs to know which service to build and how to start it

## Verification

After configuring, check the deployment logs:
- Should see: "Installing dependencies..."
- Should see: "Building @kealee/api..."
- Should see: "Starting service..."
- Should see: "🚀 API server running on port..."

## Troubleshooting

### Build Fails

**Error:** `@kealee/api not found`
- **Fix:** Make sure build command runs from root: `pnpm install && pnpm build --filter=@kealee/api`

**Error:** `pnpm: command not found`
- **Fix:** Railway should auto-detect pnpm. If not, add environment variable: `NIXPACKS_PKG_MANAGER=pnpm`

### Start Command Fails

**Error:** `Cannot find module 'dist/index.js'`
- **Fix:** Build command didn't run or failed. Check build logs first.

**Error:** `Port already in use`
- **Fix:** Railway sets PORT automatically. Make sure your code uses `process.env.PORT`

## Next Steps

1. ✅ Configure build/start commands in Railway dashboard
2. ✅ Save and redeploy
3. ✅ Check deployment logs
4. ✅ Verify service is running
5. ✅ Test API endpoints
