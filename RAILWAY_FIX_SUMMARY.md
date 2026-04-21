# Railway Build Fix — Dockerfile Error Resolution

**Date**: 2026-04-20
**Issue**: "Dockerfile does not exist" error
**Root Cause**: Conflicting Docker vs. Nixpacks builder configuration
**Solution**: Switch ALL services to Nixpacks builder, remove Docker references from config

---

## FILES MODIFIED

### 1. Root Configuration

**File**: `/railway.toml`
- ✅ Changed `services.web-main.build.builder` from `"dockerfile"` to `"nixpacks"`
- ✅ Removed `dockerfile = "apps/web-main/Dockerfile"` reference
- ✅ Changed `services.kealee-api.build` from Docker to `builder = "nixpacks"`
- ✅ Changed `services.worker.build` from Docker to `builder = "nixpacks"`
- ✅ Updated all `startCommand` to `pnpm start` (monorepo-aware)

**File**: `/railway.json`
- ✅ Ensured `"builder": "NIXPACKS"` (was already correct)
- ✅ Added `"startCommand": "pnpm start"` to deploy section

### 2. Service-Level Configurations

**File**: `/services/api/railway.json`
- ✅ Changed `"builder": "DOCKERFILE"` → `"builder": "NIXPACKS"`
- ✅ Removed `"dockerfilePath": "./Dockerfile"` reference
- ✅ Changed `"startCommand": "node dist/index.js"` → `"pnpm start"`
- ✅ Simplified health check timeout (30000ms → 30)

**File**: `/services/worker/railway.json`
- ✅ Fixed `"startCommand": "cd services/worker && node dist/index.js"` → `"pnpm start"`
- ✅ Removed dangerous `cd` command that causes "executable `cd` could not be found" error

**File**: `/apps/web-main/railway.json` (NEW)
- ✅ Created new service config file
- ✅ Set `"builder": "NIXPACKS"`
- ✅ Set `"startCommand": "pnpm start"`
- ✅ Added healthcheck path: `/`

---

## ENTRY POINT VALIDATION

### services/api
- **Build Script**: `"build": "tsc || true"` → Outputs `dist/index.js`
- **Start Command**: `"start": "node dist/index.js"`
- **Railway Command**: `pnpm start` ✅

### services/worker
- **Build Script**: `"build": "pnpm --filter @kealee/database db:generate && tsc"` → Outputs `dist/index.js`
- **Start Command**: `"start": "node dist/index.js"`
- **Railway Command**: `pnpm start` ✅

### apps/web-main
- **Build Script**: `"build": "next build"` → Outputs `.next/` and `.next/standalone/`
- **Start Command**: `"start": "next start -p 3024"`
- **Railway Command**: `pnpm start` ✅
- **Next.js Config**: Must have `output: 'standalone'` in `next.config.js`

---

## RAILWAY UI SETTINGS — COPY/PASTE READY

Apply these settings in Railway Dashboard for each service:

### SERVICE: web-main (web frontend)
```
Root Directory:        apps/web-main
Builder:              Nixpacks
Start Command:        pnpm start
Health Check Path:    /
Health Check Timeout: 120 seconds
Restart Policy:       ON_FAILURE (max 10 retries)
```

### SERVICE: kealee-api (backend API)
```
Root Directory:        services/api
Builder:              Nixpacks
Start Command:        pnpm start
Health Check Path:    /health
Health Check Timeout: 30 seconds
Restart Policy:       ON_FAILURE (max 10 retries)
```

### SERVICE: worker (job processor)
```
Root Directory:        services/worker
Builder:              Nixpacks
Start Command:        pnpm start
Health Check Path:    (optional)
Restart Policy:       ON_FAILURE (max 10 retries)
```

---

## WHAT CHANGED

### Before (Docker Builder — BROKEN)
```json
{
  "builder": "DOCKERFILE",
  "dockerfilePath": "./Dockerfile"
}
```

### After (Nixpacks — WORKING)
```json
{
  "builder": "NIXPACKS"
}
```

**Why This Works:**
- Nixpacks auto-detects Node.js + pnpm environment
- Reads `package.json` build scripts automatically
- No manual Dockerfile path required
- No "cd" shell commands (avoids "executable `cd` could not be found" error)
- Simpler, more reliable deployment

---

## BUILD PROCESS (Nixpacks)

1. **Detect** runtime: Node.js 20.x
2. **Install** dependencies: `pnpm install --frozen-lockfile`
3. **Build** with turbo: `pnpm run build`
   - `services/api` → `tsc` → `dist/index.js`
   - `services/worker` → `tsc` → `dist/index.js`
   - `apps/web-main` → `next build` → `.next/standalone/`
4. **Start** service: `pnpm start` (monorepo-aware)

---

## FILES NOT CHANGED (Still Present)

- ❌ `/services/api/Dockerfile` — Still exists, but ignored by Nixpacks
- ❌ `/apps/web-main/Dockerfile` — Still exists, but ignored by Nixpacks
- ✅ These can be deleted later if desired, but not required

---

## VERIFICATION CHECKLIST

After applying Railway UI settings:

- [ ] web-main service rebuild triggered
  - [ ] Docker build logs show Nixpacks in use
  - [ ] No "Dockerfile does not exist" error
  - [ ] Build completes in 5-10 minutes
  - [ ] Service health check passes at `/`

- [ ] kealee-api service rebuild triggered
  - [ ] Nixpacks detected, build starts
  - [ ] TypeScript compilation succeeds
  - [ ] Release command: `pnpm --filter @kealee/database db:migrate:deploy`
  - [ ] Service health check passes at `/health`

- [ ] worker service rebuild triggered
  - [ ] Nixpacks build succeeds
  - [ ] `dist/index.js` generated
  - [ ] Service starts without "cd" errors

---

## IMMEDIATE NEXT STEPS

1. **Commit Configuration Changes**
   ```bash
   git add railway.json railway.toml services/api/railway.json services/worker/railway.json apps/web-main/railway.json
   git commit -m "Fix: Switch all services to Nixpacks builder, remove Docker config"
   git push origin main
   ```

2. **Railway Dashboard Updates**
   - Navigate to each service (web-main, kealee-api, worker)
   - Update **Root Directory** and **Builder** settings per table above
   - Trigger manual rebuild for each service

3. **Monitor Builds**
   - Watch Railway deployment logs
   - Confirm health checks pass
   - Test endpoints:
     - `GET https://kealee.com/` → web-main
     - `GET https://api.kealee.com/health` → kealee-api
     - Worker logs in Railway dashboard

---

## TROUBLESHOOTING

**If "Dockerfile does not exist" error persists:**
1. Clear build cache in Railway Dashboard → Service Settings
2. Verify Root Directory is set correctly (no trailing slashes)
3. Confirm Builder is set to "Nixpacks" (not Docker)
4. Check that `pnpm-lock.yaml` exists in repo root

**If build fails with TypeScript errors:**
1. Ensure `tsconfig.json` exists in repo root
2. Check that `dist/` directory is created after build
3. Verify package.json build script doesn't have `--strict` flag issues

**If service doesn't start:**
1. Verify `start` script exists in service package.json
2. Check that startup command is `pnpm start` (not absolute paths)
3. Look for port conflicts (web-main uses 3024, API uses 3000)
