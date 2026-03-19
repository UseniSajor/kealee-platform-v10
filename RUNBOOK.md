# Kealee Platform — Runbook

## Database migrations (Railway)

```bash
# Connect to Railway environment
railway login
railway link [project-id]   # see railway.json for project ID

# Run pending migrations
railway run --service api npx prisma migrate deploy

# Verify migration status
railway run --service api npx prisma migrate status

# Check migration history
railway run --service api npx prisma migrate status --schema packages/database/prisma/schema.prisma
```

## Deploy all services

```bash
# API
cd services/api && railway up --service api

# Command center
cd services/command-center && railway up --service command-center

# Worker
cd services/worker && railway up --service worker

# Portal apps (Railway static / Dockerfile)
cd apps/portal-owner && railway up --service portal-owner
cd apps/portal-contractor && railway up --service portal-contractor
cd apps/portal-developer && railway up --service portal-developer
cd apps/web-main && railway up --service web-main
cd apps/admin-console && railway up --service admin-console
```

## Railway alert setup (manual — Railway Dashboard)
1. Go to Railway Dashboard → Project → Monitoring
2. Add alert: HTTP Error Rate > 2% → notify Slack webhook
3. Add alert: P95 Response Time > 1000ms → notify Slack webhook
4. Add alert: Service Restart → notify Slack webhook
5. Add alert: Memory > 80% → notify Slack webhook

## Log drain setup (Railway)
1. Railway Dashboard → Project → Settings → Log Drains
2. Add HTTP Drain with your aggregation service URL
3. Supported: Datadog (https://http-intake.logs.datadoghq.com/...), Papertrail, Logtail
4. Set `RAILWAY_LOG_DRAIN_URL` env var in each service

## Stripe product import (production)

```bash
# Set production key
export STRIPE_SECRET_KEY=sk_live_...

# Run import (creates/updates all products and prices)
node scripts/stripe-import-products.js

# Output:
#   stripe-products-complete.json  — all price IDs as JSON
#   stripe-products-env.txt        — env vars ready to paste into Railway

# Copy contents of stripe-products-env.txt to Railway environment variables
```

## Developer Services — Stripe price env vars

After running stripe-import-products.js, set these in the API service Railway variables:

```
STRIPE_PRICE_DEV_FEASIBILITY=price_...
STRIPE_PRICE_DEV_PROFORMA=price_...
STRIPE_PRICE_DEV_CAPITAL=price_...
STRIPE_PRICE_DEV_ENTITLEMENTS=price_...
```

## DLQ monitoring
- Endpoint: `GET https://api.kealee.com/admin/dlq` (requires admin JWT)
- Alert threshold: depth > 10 jobs per queue
- Manual replay: `POST /admin/dlq/:queueName/replay`
- DLQ queues are named `dlq:{originalQueueName}` in Redis

## Prisma schema changes
```bash
# After editing packages/database/prisma/schema.prisma:

# 1. Generate Prisma client
cd packages/database
npx prisma generate

# 2. Create migration
npx prisma migrate dev --name descriptive_name

# 3. Deploy to Railway production
DATABASE_URL="postgresql://..." npx prisma migrate deploy
# Or via Railway:
railway run --service api npx prisma migrate deploy
```

## Emergency rollback
```bash
# Roll back last migration
railway run --service api npx prisma migrate resolve --rolled-back [migration-name]

# Redeploy previous version
railway rollback --service api

# Force reset (DANGER — dev only)
railway run --service api npx prisma migrate reset
```

## Environment variables

All environment variables are managed in Railway Dashboard → Project → [Service] → Variables.

Key services and their env var sources:
- `services/api/.env.example` — API service
- `services/command-center/.env.example` — Command center
- `apps/portal-owner/.env.example` — Portal owner
- `apps/portal-contractor/.env.example` — Portal contractor
- `apps/portal-developer/.env.example` — Portal developer

After running `node scripts/stripe-import-products.js`, copy `stripe-products-env.txt` to the API service env vars in Railway.

## Common issues

### Prisma client out of date
Run `npx prisma generate` in `packages/database/` after any schema changes.

### Redis connection refused
Check `REDIS_URL` in Railway service environment. Redis is a separate Railway service — confirm it's running.

### Stripe webhook not receiving events
1. Check `STRIPE_WEBHOOK_SECRET` is set (get from Stripe Dashboard → Webhooks)
2. Confirm Railway service URL is registered in Stripe Dashboard → Webhooks
3. Check Railway logs: `railway logs --service api`

### Bot workers not starting
Check `REDIS_URL` and `ANTHROPIC_API_KEY` in command-center service variables.

## Logging

The API uses Fastify's built-in structured JSON logger (`fastify({ logger: true })`).
Log level is controlled by the `LOG_LEVEL` env var (default: `info`).

To stream logs in real time:
```bash
railway logs --service api --tail
```

To query logs with Railway CLI:
```bash
railway logs --service api --since 1h
```
