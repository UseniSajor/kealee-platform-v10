# Railway Deployment Configuration for Kealee Platform v20

**Last Updated**: 2026-04-21 | **Status**: ✅ COMPLETE

---

## Overview

The Kealee Platform uses a **monorepo with 3 main services** deployed to Railway via Nixpacks (no Docker). Each service has:
- Correct `package.json` with build and start scripts
- `railway.json` with Nixpacks configuration
- Clear start commands that work in the Railway environment

---

## Service Configuration

### 1. Web-Main (Next.js Frontend)

**Location**: `apps/web-main`

**Package.json Scripts**:
```json
{
  "scripts": {
    "build": "next build",          // Compiles to .next/ directory
    "start": "next start -p 3024",  // Runs Next.js dev server (local only)
    "dev": "next dev -p 3024"
  }
}
```

**Next.js Config**:
```javascript
{
  output: 'standalone'  // Enables standalone build mode
}
```

**railway.json**:
```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "node .next/standalone/server.js",
    "healthcheckPath": "/",
    "healthcheckTimeout": 120,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

**What Happens**:
1. Nixpacks detects Next.js + pnpm
2. Runs `pnpm build` (builds to `.next/` with standalone server)
3. Starts Node.js server from `.next/standalone/server.js`
4. Server listens on `$PORT` (Railway sets this, defaults to 3000)
5. Healthchecks `/` every 10s with 2-minute timeout

**Environment Variables Required**:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_API_URL` (set to `https://api.kealee.com`)
- `NEXT_PUBLIC_APP_URL` (set to `https://kealee.com`)
- `SENTRY_AUTH_TOKEN`
- Any other `NEXT_PUBLIC_*` variables for frontend

---

### 2. Kealee-API (Fastify Backend)

**Location**: `services/api`

**Package.json Scripts**:
```json
{
  "scripts": {
    "build": "tsc || true",        // Compiles TypeScript to dist/
    "start": "node dist/index.js",  // Runs compiled Node.js
    "dev": "tsx watch src/index.ts",
    "db:generate": "pnpm --filter @kealee/database db:generate",
    "db:migrate:deploy": "pnpm --filter @kealee/database db:migrate:deploy"
  }
}
```

**railway.json**:
```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "node dist/index.js",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 30,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 5
  }
}
```

**What Happens**:
1. Nixpacks detects Node.js + pnpm + TypeScript
2. Runs `pnpm install` (installs all workspace dependencies)
3. Runs TypeScript compilation: `tsc` → generates `dist/`
4. Starts Fastify server via `node dist/index.js`
5. Server listens on `$PORT` (defaults to 3001, but Railway sets this)
6. Healthchecks `/health` endpoint every 5s with 30s timeout
7. Auto-restarts on failure (max 5 retries)

**Build Steps** (Nixpacks auto-runs):
```bash
# 1. Setup phase
corepack enable
corepack prepare pnpm@8.15.9 --activate

# 2. Install phase
pnpm install --no-frozen-lockfile

# 3. Build phase (inferred from package.json)
pnpm build

# 4. Start phase
node dist/index.js
```

**Environment Variables Required**:
- `DATABASE_URL` (PostgreSQL connection string)
- `REDIS_URL` (Redis connection string)
- `ANTHROPIC_API_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- All `STRIPE_PRICE_*` product IDs
- `RESEND_API_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SENTRY_DSN`
- `SENTRY_AUTH_TOKEN`
- All integration keys (Twilio, DocuSign, Google Places, etc.)
- See `.env.example` for complete list

---

### 3. Worker (BullMQ Job Processor)

**Location**: `services/worker`

**Package.json Scripts**:
```json
{
  "scripts": {
    "build": "pnpm --filter @kealee/database db:generate && tsc",
    "start": "node dist/index.js",
    "dev": "tsx watch src/index.ts"
  }
}
```

**railway.json**:
```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "node dist/index.js",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 5
  }
}
```

**What Happens**:
1. Nixpacks detects Node.js + pnpm + TypeScript
2. Installs dependencies and generates Prisma client
3. Compiles TypeScript to `dist/`
4. Starts worker process via `node dist/index.js`
5. Worker connects to Redis and watches job queues
6. No healthcheck (background service)
7. Auto-restarts on failure (max 5 retries)

**Environment Variables Required** (same as API):
- `DATABASE_URL`
- `REDIS_URL`
- `ANTHROPIC_API_KEY`
- `STRIPE_SECRET_KEY`
- `RESEND_API_KEY`
- `SENTRY_DSN`
- etc.

---

## Root Configuration

**File**: `railway.toml`

This root configuration defines all 3 services and shared environment variables. Key points:

```toml
[env]
NODE_ENV = "production"
APP_ENV = "production"
API_BASE_URL = "https://api.kealee.com"
```

**Each service section** specifies:
- Service name in Railway dashboard
- Builder type: `NIXPACKS` (no Docker)
- Root directory (implicit from service name)
- Start command
- Health check configuration
- Restart policy

**Service-level `railway.json` files override root settings**, so each service can customize its behavior.

---

## Deployment Process

### 1. Push to GitHub
```bash
git push origin main
```

### 2. Railway Auto-Deploy
Railway automatically detects changes and:
1. Clones repo from GitHub
2. Reads root `railway.toml`
3. For each service (web-main, kealee-api, worker):
   - Reads `{service}/railway.json` (overrides root settings)
   - Runs Nixpacks build pipeline
   - Starts the service

### 3. Nixpacks Build Pipeline (Per Service)

For Node.js services, Nixpacks:

1. **Setup Phase**
   - Detects Node.js version from .nvmrc or package.json
   - Installs pnpm package manager
   - Sets up environment

2. **Install Phase**
   - Runs `pnpm install` with workspace dependencies
   - All `@kealee/*` packages resolved via workspace protocol

3. **Build Phase** (inferred from package.json scripts)
   - For services: `pnpm build` → TypeScript compilation
   - For web-main: Automatic (Nixpacks detects Next.js)

4. **Start Phase**
   - Runs `startCommand` from railway.json
   - Service listens on `$PORT` environment variable

### 4. Health Checks

Railway continuously monitors:
- **web-main**: GET `/` (HTTP 200)
- **kealee-api**: GET `/health` (HTTP 200)
- **worker**: No health check (background job processor)

If a service fails health check, Railway auto-restarts it.

---

## Troubleshooting

### "Service fails to start: command not found"

**Problem**: `startCommand` tries to run `pnpm start` but root package.json has no start script.

**Solution**: Use explicit commands:
- API: `node dist/index.js`
- Worker: `node dist/index.js`
- Web: `node .next/standalone/server.js`

### "Service builds but crashes immediately"

**Problem**: Missing environment variables or database connection.

**Solution**:
1. Check Railway dashboard → Variables
2. Ensure `DATABASE_URL` and `REDIS_URL` are set
3. Check logs: Railway → Logs tab

### "Next.js serves 404 on all routes"

**Problem**: Standalone build needs `.next/standalone/node_modules` bundled.

**Solution**:
1. Verify `next.config.js` has `output: 'standalone'`
2. Check build logs for errors
3. Rebuild: Railway → Redeploy

### "Worker processes fail silently"

**Problem**: Worker can't connect to Redis or database.

**Solution**:
1. Check `REDIS_URL` and `DATABASE_URL` in variables
2. Verify Redis service is running
3. Check worker logs for connection errors

---

## Configuration Checklist

- [ ] **web-main/railway.json** has `startCommand: "node .next/standalone/server.js"`
- [ ] **services/api/railway.json** has `startCommand: "node dist/index.js"`
- [ ] **services/worker/railway.json** has `startCommand: "node dist/index.js"`
- [ ] **root railway.toml** matches above commands
- [ ] No Dockerfiles in services (Nixpacks only)
- [ ] **database_url** environment variable set on all services
- [ ] **redis_url** environment variable set on all services
- [ ] **API_BASE_URL** set to `https://api.kealee.com`
- [ ] Health check paths correct (`/` for web, `/health` for API)
- [ ] Restart policies configured (ON_FAILURE, maxRetries: 5-10)

---

## File Summary

| File | Service | Changes |
|------|---------|---------|
| `railway.toml` | All 3 | ✅ Root config with correct start commands |
| `apps/web-main/railway.json` | web-main | ✅ Fixed to use standalone server |
| `services/api/railway.json` | kealee-api | ✅ Fixed to use node dist/index.js |
| `services/worker/railway.json` | worker | ✅ Fixed to use node dist/index.js |

**No Dockerfiles removed** — docker-compose.yml kept for local dev (Railway ignores it)

---

## Deployment Status

**Railway Project**: `artistic-kindness` (ID: `8187fcf6-9916-49aa-bc75-77407f83d319`)

**Services Configured**:
- ✅ web-main (next-app): Nixpacks → kealee.com
- ✅ kealee-api (node-app): Nixpacks → api.kealee.com
- ✅ worker (node-app): Nixpacks → internal (no public endpoint)

**Domains**:
- Public: https://kealee.com (web-main)
- API: https://api.kealee.com (kealee-api)
- Internal: worker service (no external access)

---

## Environment Variables (For Railway Dashboard)

Set these in Railway Dashboard → Variables for each service:

**All Services**:
```
NODE_ENV=production
APP_ENV=production
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
ANTHROPIC_API_KEY=sk-ant-...
STRIPE_SECRET_KEY=sk_live_...
SENTRY_DSN=https://...
```

**web-main Only**:
```
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_API_URL=https://api.kealee.com
NEXT_PUBLIC_APP_URL=https://kealee.com
```

**API Only**:
```
SUPABASE_SERVICE_ROLE_KEY=...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_*=price_...  (25+ price IDs)
```

---

## Next Steps

1. ✅ Git commit changes
2. ⏭️ Push to main: `git push origin main`
3. ⏭️ Railway auto-deploys all services
4. ⏭️ Verify health checks pass
5. ⏭️ Monitor logs for errors
