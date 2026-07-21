# Railway Deployment Configuration Guide

## Overview

The Kealee Platform is a monorepo with multiple services that deploy to Railway. Each service has specific configuration requirements.

**Current Project**: `artistic-kindness` (ID: `8187fcf6-9916-49aa-bc75-77407f83d319`)
**Environment**: `production`

---

## Service Configuration Reference

### 1. **web-main** (Next.js Frontend)
**Service ID**: `84c5a1e5-49f4-4c63-87aa-bb8c732d478e`

| Setting | Value |
|---------|-------|
| Root Directory | `apps/web-main` |
| Dockerfile | `apps/web-main/Dockerfile` |
| **START COMMAND** | `pnpm start` |
| **HEALTHCHECK PATH** | `/` |
| HEALTHCHECK TIMEOUT | 30s |
| Port | 3024 |
| NODE_ENV | production |

**Environment Variables**:
```
NEXT_PUBLIC_APP_URL=https://web-main-production-url.railway.app
NEXT_PUBLIC_SUPABASE_URL=https://rkreqfpkxavqpsqexbfs.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<set in dashboard>
SUPABASE_SERVICE_ROLE_KEY=<set in dashboard>
```

---

### 2. **kealee-api** (Fastify Backend)
**Service ID**: `7c13d3c7-fa75-40c4-a2fe-2963c9a76aab`

| Setting | Value |
|---------|-------|
| Root Directory | `services/api` |
| Dockerfile | `services/api/Dockerfile` |
| **START COMMAND** | `node dist/index.js` |
| **HEALTHCHECK PATH** | `/health` |
| HEALTHCHECK TIMEOUT | 30s |
| Port | 3000 |
| NODE_ENV | production |

**Environment Variables**:
```
DATABASE_URL=<PostgreSQL connection string>
REDIS_URL=<Redis connection string>
STRIPE_SECRET_KEY=<Stripe secret key>
ANTHROPIC_API_KEY=<Claude API key>
SUPABASE_SERVICE_ROLE_KEY=<Supabase key>
RESEND_API_KEY=<Resend email API key>
TWILIO_ACCOUNT_SID=<Twilio SID>
TWILIO_AUTH_TOKEN=<Twilio token>
```

---

### 3. **portal-owner** (Owner Portal)
**Service ID**: `18d90332-9ca8-4541-b75c-54117e6e7a3a`

| Setting | Value |
|---------|-------|
| Root Directory | `apps/portal-owner` |
| Dockerfile | `apps/portal-owner/Dockerfile` |
| **START COMMAND** | `pnpm start` |
| **HEALTHCHECK PATH** | `/` |
| Port | 3020 |

---

### 4. **portal-contractor** (Contractor Portal)
**Service ID**: `24578856-daf0-4b83-9b60-cbdbcf64809d`

| Setting | Value |
|---------|-------|
| Root Directory | `apps/portal-contractor` |
| Dockerfile | `apps/portal-contractor/Dockerfile` |
| **START COMMAND** | `pnpm start` |
| **HEALTHCHECK PATH** | `/` |
| Port | 3021 |

---

### 5. **portal-developer** (Developer Portal)
**Service ID**: `fc01ca37-06ac-4667-827c-6f80e497e96f`

| Setting | Value |
|---------|-------|
| Root Directory | `apps/portal-developer` |
| Dockerfile | `apps/portal-developer/Dockerfile` |
| **START COMMAND** | `pnpm start` |
| **HEALTHCHECK PATH** | `/` |
| Port | 3022 |

---

### 6. **command-center** (Operations Center)
**Service ID**: `51d78b4f-1f7b-4e51-b0cd-a3db5f4542c6`

| Setting | Value |
|---------|-------|
| Root Directory | `apps/command-center` |
| Dockerfile | `apps/command-center/Dockerfile` |
| **START COMMAND** | `pnpm start` |
| **HEALTHCHECK PATH** | `/` |
| Port | 3023 |

---

### 7. **admin-console** (Admin Dashboard)
**Service ID**: `f5007ce2-ee4d-42dc-bc34-e383631fb17b`

| Setting | Value |
|---------|-------|
| Root Directory | `apps/admin-console` |
| Dockerfile | `apps/admin-console/Dockerfile` |
| **START COMMAND** | `pnpm start` |
| **HEALTHCHECK PATH** | `/` |
| Port | 3025 |

---

### 8. **worker** (Job Queue Processor)
**Status**: Not yet deployed (handles project-execution jobs)

| Setting | Value |
|---------|-------|
| Root Directory | `services/worker` |
| Dockerfile | `services/worker/Dockerfile` |
| **START COMMAND** | `node dist/index.js` |
| **HEALTHCHECK PATH** | `/health` |
| Port | 3001 |

---

## How to Update Service Configuration in Railway

1. **Go to Railway Dashboard** → Select `artistic-kindness` project
2. **Select the service** (e.g., web-main)
3. **Settings** → **Deploy** tab
4. Update:
   - **Start Command**: Set from the table above
   - **Healthcheck Path**: Set from the table above
   - **Port**: Set from the table above
5. **Variables** tab
6. Add all environment variables from the section above
7. Click **Save** → Railway redeploys

---

## Critical Issue: web-main 404 Error

If web-main is returning `{"error":{"message":"Route GET / not found"...}}`:

### Root Cause
The railway.toml had a global `startCommand = "node dist/index.js"` which was being applied to ALL services, including web-main (a Next.js app). This tried to run a Node script that doesn't exist, causing the app to fail.

### Fix Applied
1. ✅ Removed global `startCommand` from railway.toml (commit: TBD)
2. ⏳ **You must now configure per-service in Railway dashboard**

### Manual Fix Steps
1. Go to Railway dashboard → `artistic-kindness` → `web-main` service
2. Click **Settings** → **Deploy**
3. Set:
   - **Start Command**: `pnpm start`
   - **Healthcheck Path**: `/`
4. Click **Save**
5. Railway will rebuild and redeploy

---

## Verification Checklist

After updating each service:

```bash
# 1. Check service is running
curl https://[service-url]/health  # or / for Next.js apps

# 2. Check environment variables are set
Railway dashboard → Service → Variables

# 3. Check logs for errors
Railway dashboard → Service → Logs

# 4. Verify Dockerfile exists and is correct
ls apps/[service]/Dockerfile
ls services/[service]/Dockerfile
```

---

## Shared Configuration

All services should inherit from root `railway.toml`:

```toml
[build]
dockerfile = "Dockerfile"
contextDir = "."

[deploy]
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 5
```

This ensures each service uses its own Dockerfile (located in its directory).

---

## PostgreSQL & Redis

These are shared infrastructure services on Railway:

- **PostgreSQL**:
  - Service ID: `f56e4724-a481-484c-b5e4-8402edfad177`
  - Connection: All services use `DATABASE_URL`

- **Redis**:
  - Service ID: `29708244-7fdd-4ddc-8f5a-f2e318040280`
  - Connection: API & worker use `REDIS_URL`

---

## Deployment Flow

```
1. Commit to GitHub main branch
2. Railway detects push
3. For each service:
   a. Build Dockerfile (using root railway.toml settings)
   b. Start service (using SERVICE-SPECIFIC startCommand from dashboard)
   c. Health check (using SERVICE-SPECIFIC healthcheckPath from dashboard)
4. If health check passes → service live
5. If health check fails → rollback to previous version
```

---

## Troubleshooting

### Service won't start
1. Check Railway dashboard → Logs tab
2. Verify Start Command is correct for that service
3. Verify Dockerfile exists in the service directory

### Health check failing
1. Check Health Check Path is correct
2. Verify the service responds on that path
3. Check health check timeout (default 30s, might need increase for first start)

### 404 errors on frontend
1. Verify Start Command: `pnpm start` (not `node dist/index.js`)
2. Verify Healthcheck Path: `/` (not `/health`)
3. Check service logs for startup errors

### API connection failing
1. Verify DATABASE_URL is set and valid
2. Verify REDIS_URL is set (optional, has fallback)
3. Check API service is running: `curl https://api-url/health`

---

## Important Notes

- **railway.toml** defines global build settings only
- **Per-service configuration** (startCommand, healthcheckPath) is in Railway Dashboard
- Each service has its own Dockerfile with proper CMD
- Environment variables are set per-service in Railway dashboard Variables section
- Database migrations run automatically on API startup

---

## Emergency Recovery

If all services are down:

1. Go to Railway dashboard
2. Select each service
3. Click **Redeploy** button
4. Railway rebuilds from latest GitHub commit
5. Services restart with dashboard configuration

---

## Future: Automated Service Discovery

Consider implementing:
- `.railway.toml` per service directory (if Railway adds support)
- GitHub Actions to configure Railway services on deploy
- Secrets management via Doppler instead of Railway dashboard
