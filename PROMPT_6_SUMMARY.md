# PROMPT 6 — Railway Deployment Fix ✅ COMPLETE

**Commit**: `377e99ea` | **Date**: 2026-04-21

---

## Problem Identified

The monorepo's Railway configuration used generic `"startCommand": "pnpm start"` for all services, which failed because:
1. Root `package.json` has **no `start` script**
2. Nixpacks runs in the root directory context
3. `pnpm start` → looks for root's start script → not found → service crashes

---

## Solution Implemented

Fixed all 3 services with **explicit, direct Node.js start commands** that work in Railway's environment:

| Service | Path | Builder | Start Command | Health Check |
|---------|------|---------|----------------|--------------|
| **web-main** | `apps/web-main` | NIXPACKS | `node .next/standalone/server.js` | `/` (120s) |
| **kealee-api** | `services/api` | NIXPACKS | `node dist/index.js` | `/health` (30s) |
| **worker** | `services/worker` | NIXPACKS | `node dist/index.js` | None |

---

## Files Changed

### ✅ railway.toml (Root Configuration)
**Before**: Generic `"startCommand": "pnpm start"`
**After**: Service-specific start commands with explanatory comments

```toml
# web-main
startCommand = "node .next/standalone/server.js"

# kealee-api  
startCommand = "node dist/index.js"

# worker
startCommand = "node dist/index.js"
```

### ✅ apps/web-main/railway.json
**Before**: 
```json
"startCommand": "pnpm start"
```

**After**:
```json
"startCommand": "node .next/standalone/server.js"
```

**Why**: Next.js with `output: 'standalone'` creates a self-contained Node.js server in `.next/standalone/server.js`

### ✅ services/api/railway.json
**Before**: `"startCommand": "pnpm start"`
**After**: `"startCommand": "node dist/index.js"`

**Why**: TypeScript compiled to `dist/` directory, start via Node.js directly

### ✅ services/worker/railway.json
**Before**: `"startCommand": "pnpm start"`
**After**: `"startCommand": "node dist/index.js"`

**Why**: Same pattern as API service, runs compiled TypeScript

### ✅ docs/railway-deployment-config.md (NEW)
Complete deployment guide with:
- Service configurations
- Nixpacks build pipeline explanation
- Environment variables required
- Health check configuration
- Troubleshooting guide
- Deployment checklist

---

## What Each Service Does on Railway

### 1. web-main (Next.js Frontend)
```
Push to GitHub
  ↓
Nixpacks detects: Node.js + pnpm + Next.js
  ↓
Build: pnpm install → next build
  ↓
Output: .next/ directory with standalone mode
  ↓
Start: node .next/standalone/server.js
  ↓
Listen on $PORT (Railway sets, defaults 3000)
  ↓
Health check: GET / every 10s (120s timeout)
  ↓
If fails 3x → auto-restart
```

### 2. kealee-api (Fastify Backend)
```
Push to GitHub
  ↓
Nixpacks detects: Node.js + pnpm + TypeScript
  ↓
Build: pnpm install → tsc compilation
  ↓
Output: dist/ with compiled JavaScript
  ↓
Start: node dist/index.js
  ↓
Listen on $PORT (Railway sets, defaults 3000)
  ↓
Health check: GET /health every 5s (30s timeout)
  ↓
If fails 5x → auto-restart
```

### 3. worker (BullMQ Job Processor)
```
Push to GitHub
  ↓
Nixpacks detects: Node.js + pnpm + TypeScript
  ↓
Build: pnpm install → tsc compilation
  ↓
Output: dist/ with compiled JavaScript
  ↓
Start: node dist/index.js
  ↓
Connect to Redis, watch job queues
  ↓
No health check (background service)
  ↓
If crashes → auto-restart (max 5 retries)
```

---

## How to Deploy Now

### Step 1: Resolve Git Conflicts (if needed)
```bash
cd /home/tim_chamberlain/kealee-platform-v10

# Try to rebase from origin
git fetch origin
git rebase origin/main

# If conflicts, resolve them in the conflicted files:
# - RAILWAY_FIX_SUMMARY.md
# - apps/web-main/railway.json  
# - services/api/railway.json
# - railway.toml

# After resolving conflicts:
git add .
git rebase --continue
```

### Step 2: Push to GitHub
```bash
git push origin main
```

### Step 3: Railway Auto-Deploys
- Railway detects push
- Reads root `railway.toml`
- Builds all 3 services in parallel
- Each service uses its own `railway.json` (overrides root settings)
- Starts services with correct start commands

### Step 4: Verify Deployment
Check Railway Dashboard:
- **web-main**: Should show "Running" with domain `kealee.com`
- **kealee-api**: Should show "Running" with domain `api.kealee.com`
- **worker**: Should show "Running" (background, no public domain)

Check Health:
```bash
# Web frontend
curl https://kealee.com/

# API health
curl https://api.kealee.com/health

# Should both return HTTP 200
```

---

## Configuration Checklist

- [x] web-main/railway.json uses `node .next/standalone/server.js`
- [x] services/api/railway.json uses `node dist/index.js`
- [x] services/worker/railway.json uses `node dist/index.js`
- [x] root railway.toml has all 3 services correctly configured
- [x] No Dockerfiles in services (Nixpacks only)
- [x] Health check paths correct (`/` for web, `/health` for API)
- [x] Restart policies configured
- [x] Documentation complete

---

## Result

✅ All 3 Railway services now have:
- **Correct Root Directories**: apps/web-main, services/api, services/worker
- **Correct Builders**: NIXPACKS (no Docker)
- **Correct Start Commands**: Explicit paths to Node.js binaries
- **Health Checks**: Configured per service type
- **Auto-Restart**: Configured with appropriate retry policies
- **Documentation**: Complete deployment guide

**Services are ready to deploy!**

---

## Files Modified

- `railway.toml` — root config with correct start commands
- `apps/web-main/railway.json` — Next.js standalone server path
- `services/api/railway.json` — Node.js start path
- `services/worker/railway.json` — Node.js start path
- `docs/railway-deployment-config.md` — NEW: complete deployment guide

**Total Changes**: 5 files | **Lines Added**: 421 | **Lines Removed**: 13
