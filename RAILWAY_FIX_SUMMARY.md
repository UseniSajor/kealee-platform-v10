# Railway Deployment Fix Summary

**Date:** April 20–21, 2026  
**Branch:** main  
**Total commits in session:** ~50

---

## Problem

Railway was failing to deploy the Kealee Platform monorepo. The primary issues were:

1. **Builder confusion** — Railway was oscillating between Nixpacks and Docker, neither succeeding consistently.
2. **Startup failures** — Shell initialization errors (`m-marketplace` error) caused the API container to crash on start.
3. **Wrong Dockerfile paths** — `services/api/railway.json` referenced `./Dockerfile.api` instead of `./Dockerfile`.
4. **Root-level Dockerfiles** — Stale root `Dockerfile` and `Dockerfile.api` confused Railway's auto-detection.
5. **Supabase auth import** — `@supabase/auth-helpers-nextjs` was importing `createServerClient`, which doesn't exist in that package; should use `createClient` from `@supabase/supabase-js`.
6. **turbo.json concurrency** — `concurrency` field was a number, must be a string.
7. **Docker layer cache** — Railway was caching a broken build layer; needed forced cache busts.

---

## Fixes Applied

### 1. Locked Docker Builder (`railway.toml`)
Removed any Nixpacks `railway.json` files that overrode the builder. Set `builder = "dockerfile"` explicitly for each service in `railway.toml`.

### 2. Fixed API `railway.json`
```json
{
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "./Dockerfile"
  }
}
```
Path changed from `./Dockerfile.api` → `./Dockerfile`.

### 3. Removed Root-level Dockerfiles
Deleted `./Dockerfile` and `./Dockerfile.api` from the repo root to prevent Railway from picking up the wrong build context.

### 4. API Dockerfile — Direct Node.js Startup
Replaced shell-based startup with `dumb-init` + direct `node dist/index.js`:
```dockerfile
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]
```
This eliminates shell initialization errors entirely.

### 5. Fixed Supabase Auth Import (`packages/core-auth/src/session-manager.ts`)
```ts
// Before (broken):
import { createServerClient } from '@supabase/auth-helpers-nextjs'

// After (fixed):
import { createClient } from '@supabase/supabase-js'
```
Also added try/catch guards around `cookieStore.getAll()` and `cookieStore.set()`.

### 6. Fixed `turbo.json`
```json
// Before:
"concurrency": 4

// After:
"concurrency": "4"
```

### 7. Force Cache Busts
Multiple commits changed the base image (`alpine` → `slim`) and added `LABEL build.timestamp=...` to break Railway's Docker layer cache.

### 8. Added `Procfile` as Fallback
Added a `Procfile` at the repo root as a last-resort fallback if Railway falls back to Procfile detection.

---

## Current Railway Config State

| Service | Builder | Dockerfile |
|---------|---------|------------|
| `web-main` | `dockerfile` | `apps/web-main/Dockerfile` |
| `kealee-api` | `dockerfile` | `services/api/Dockerfile` |
| `worker` | `dockerfile` | `services/worker/Dockerfile` |

Root `railway.toml` defines all services. Each service has its own Dockerfile with multi-stage builds.

---

## What Still Needs Verification

- [ ] Confirm Railway deployment succeeds end-to-end (healthcheck `/health` returns 200)
- [ ] Verify `DATABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set in Railway dashboard
- [ ] Confirm `web-main` Next.js standalone output builds correctly
- [ ] Check `worker` service starts without errors
