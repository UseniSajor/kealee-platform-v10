# Deployment Guide — Kealee Platform v20

**Current Status:** Railway-only deployment (both frontend and backend)
**Last Updated:** 2026-07-07

## Overview

All services are deployed to **Railway.app**:
- ✅ Frontend (`web-main`) — Railway
- ✅ Backend APIs (`services/api`) — Railway  
- ✅ Command Center — Railway
- ✅ Workers/Background Jobs — Railway
- ✅ Marketing Cron — Railway

**Vercel is NOT used** — all infrastructure on Railway.

## Service Deployments

### 1. Web Main (Frontend)
**Service:** web-main
**Type:** Next.js standalone server
**Railway Config:** `railway.json` (root)
**Environment:** Railway environment variables
**Build:** Dockerfile (multi-stage)
**Entry:** `scripts/railway-next-start.sh`

```bash
# Local test
pnpm --filter web-main dev

# Railway deployment
# Automatic via git push to main
```

### 2. API (Backend)
**Service:** services/api
**Type:** Fastify server
**Railway Config:** `services/api/railway.json`
**Environment:** Railway secrets
**Build:** Dockerfile (auto-detects via RAILWAY_SERVICE_NAME)

```bash
# Local test
cd services/api && pnpm dev

# Railway deployment
# Automatic via git push to main
```

### 3. Command Center
**Service:** command-center (apps/command-center)
**Type:** Next.js + backend API
**Status:** Active production service

### 4. Workers
**Service:** worker (services/worker)
**Type:** Node.js background job processor
**Queue:** BullMQ with Redis
**Status:** Active production service

### 5. Marketing Cron
**Service:** marketing-cron (packages/automation/apps/marketing-cron)
**Type:** Node.js scheduled tasks
**Scheduler:** node-cron
**Status:** Deployable via Railway

## Environment Variables

### Railway Console
Navigate to: **Project → Service → Variables**

#### Web Main Variables
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_APP_URL=https://app.kealee.com
NEXT_PUBLIC_HERO_VIDEO_KITCHEN=https://replicate.delivery/...
NEXT_PUBLIC_HERO_VIDEO_ADDITION=https://replicate.delivery/...
NEXT_PUBLIC_HERO_VIDEO_GARDEN=https://replicate.delivery/...
```

#### API Service Variables
```
DATABASE_URL=postgresql://...
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
REPLICATE_API_TOKEN=token_xxx
ANTHROPIC_API_KEY=sk-ant-...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Deployment Process

### Automatic (Recommended)
```bash
git push origin main
# Railway webhook triggers build automatically
# Monitor: Railway dashboard → Deployments tab
```

### Manual Trigger (if needed)
```bash
# Via Railway CLI
railway deploy

# Or: Force rebuild via dummy commit
git commit --allow-empty -m "chore: trigger deployment"
git push origin main
```

## Build Process

### Multi-Stage Dockerfile
1. **deps stage**: Fetch dependencies + postinstall hooks (Prisma generate)
2. **builder stage**: Compile TypeScript, build Next.js
3. **production stage**: Copy artifacts, strip dev deps

### Build Optimization
- **Turbo cache:** Incremental builds (first: 20+ min, subsequent: 3-5 min)
- **Layer caching:** pnpm-lock.yaml layer stays cached until deps change
- **Tree shaking:** Dev dependencies stripped for production

### Build Failure Diagnosis

**If build fails:**
1. Check Railway Deployments tab for error message
2. Search error in MONOREPO_CLEANUP.md or VERCEL_RAILWAY_CONFLICT_ANALYSIS.md
3. Common issues:
   - pnpm-lock.yaml out of sync → run `pnpm install --no-frozen-lockfile`
   - Missing environment variables → set in Railway console
   - Stale node_modules → Railway auto-cleans on each deploy

## Monitoring

### Railway Dashboard
- **Health:** Project → Services → Health
- **Logs:** Service → Logs (streaming)
- **Metrics:** CPU, Memory, Network usage
- **Deployments:** View history and rollback

### Alerts
Configure in Railway:
- Build failures
- Service crashes
- High memory/CPU usage
- Error rate spikes

## Database Migrations

### Before Deploy
```bash
# Test migration locally
cd packages/database
pnpm exec prisma migrate deploy

# Or use Railway plugin
# PostgreSQL add-on handles migrations automatically
```

### Rollback
```bash
# Rollback last migration
pnpm exec prisma migrate resolve --rolled-back migration_name

# Re-run migrate
pnpm exec prisma migrate deploy
```

## Performance

### Deployment Time
- **First deploy:** 20-30 minutes
  - Node modules install: ~10 min
  - TypeScript compilation: ~10 min
  - Next.js build: ~5 min
- **Subsequent deploys:** 3-5 minutes (Turbo cache hit)

### Reducing Build Time
1. **Avoid changing dependencies** (invalidates layer cache)
2. **Keep commits focused** (reduced files = faster builds)
3. **Use Turbo cache** (don't use `--force` flag)

## Reverting Deployments

### Quick Rollback
```bash
# Via Railway CLI
railway rollback <deployment_id>

# Or use Railway dashboard: Deployments → Click deployment → Rollback
```

### Git-based Rollback
```bash
# Revert last commit
git revert HEAD
git push origin main

# Railway auto-rebuilds with previous code
```

## Troubleshooting

### Service Won't Start
- Check logs: `railway logs --service web-main`
- Verify env vars are set
- Check database connection: `railway exec psql $DATABASE_URL -c "SELECT 1"`

### Build Timeout
- Check file size: `du -sh .`
- Purge build cache: Railway → Service → Settings → Clear build cache
- Check for large node_modules: `npm ls --depth=0`

### Slow Response Time
- Check logs for errors
- Monitor CPU/memory: Railway dashboard
- Scale up: Railway → Service → Settings → Upgrade machine

## Disaster Recovery

### Scenarios & Recovery

| Scenario | Recovery |
|----------|----------|
| DB connection lost | Check PostgreSQL add-on health; restart service |
| OOM (out of memory) | Upgrade Railway machine size |
| Deployment loop | Revert last 2-3 commits |
| Secrets leaked | Rotate via Railway → Settings → Sensitive variables |
| DDoS attack | Enable Cloudflare/Railway DDoS protection |

### Backup Database
```bash
# Export production database
railway exec pg_dump $DATABASE_URL > backup.sql

# Restore from backup
railway exec psql $DATABASE_URL < backup.sql
```

## Cost Optimization

### Current Setup
- **web-main:** $5/mo starter tier
- **services/api:** $12/mo standard tier
- **command-center:** $7/mo standard tier
- **Redis:** $10/mo (BullMQ queue)
- **PostgreSQL:** $15/mo (1GB storage)
- **Total:** ~$50/mo baseline

### Reduce Costs
- Combine services on single machine (if traffic allows)
- Use Railway's Cron feature instead of separate service
- Archive old deployments (Railway keeps 30 days)

## Related Docs
- [MONOREPO_CLEANUP.md](./MONOREPO_CLEANUP.md) — Dead code removal
- [VERCEL_RAILWAY_CONFLICT_ANALYSIS.md](./VERCEL_RAILWAY_CONFLICT_ANALYSIS.md) — Why Vercel failed
- [BUILD_OPTIMIZATION.md](./BUILD_OPTIMIZATION.md) — Dockerfile details
