# Kealee Platform — Environment Configuration Guide

## Quick Start (Local Development)

```bash
# 1. Copy the root .env.example
cp .env.example .env.local

# 2. Start required services
docker run -d -p 6379:6379 --name kealee-redis redis:7-alpine
# Ensure PostgreSQL is running on localhost:5432

# 3. Set minimum required variables in .env.local:
#    - DATABASE_URL
#    - SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
#    - STRIPE_SECRET_KEY + STRIPE_WEBHOOK_SECRET

# 4. Install & start
pnpm install
pnpm run dev
```

## Required Services

| Service    | Required By         | Local Default               | Production                   |
|------------|--------------------|-----------------------------|------------------------------|
| PostgreSQL | API, Worker        | `localhost:5432`            | Railway Postgres             |
| Redis      | Worker (required), API (recommended) | `localhost:6379` | Railway Redis          |
| Supabase   | API (auth)         | Cloud project               | Cloud project                |
| Stripe     | API (payments)     | Test mode keys              | Live mode keys               |

## Redis Requirement

Redis is **mandatory** for the worker service and **recommended** for the API service.

- **Worker service**: Will `exit(1)` immediately in production if `REDIS_URL` is not set.
  In development, falls back to `redis://localhost:6379` with a warning.
- **API service**: Logs a warning if `REDIS_URL` is missing. Rate limiting, caching,
  and queue integration will be degraded.
- **Local development**: `docker run -d -p 6379:6379 redis:7-alpine`

## Stripe Webhook Configuration

There is **one canonical webhook endpoint**:

```
POST /webhooks/stripe
```

### Production Setup
1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://api.kealee.com/webhooks/stripe`
3. Copy the signing secret → set as `STRIPE_WEBHOOK_SECRET`

### Local Development
```bash
stripe listen --forward-to localhost:3001/webhooks/stripe
# Copy the whsec_... secret printed by the CLI into .env.local
```

### Deprecated Paths
These paths now 301-redirect to `/webhooks/stripe`:
- `/billing/stripe/webhook` (was in billing.routes.ts)
- `/payments/webhooks/stripe` (was in payment-webhook.routes.ts)

If your Stripe Dashboard still points to one of these, update it to `/webhooks/stripe`.

## GoHighLevel (GHL) Integration

GHL integration is optional. If not configured, user/lead sync is silently skipped.

| Variable            | Description                                    |
|---------------------|------------------------------------------------|
| `GHL_API_KEY`       | Private integration token (Settings → Integrations) |
| `GHL_LOCATION_ID`   | Business location ID (Settings → Business Profile) |
| `GHL_BASE_URL`      | API base URL (default: `https://services.leadconnectorhq.com`) |
| `GHL_WEBHOOK_SECRET`| HMAC secret for verifying inbound GHL webhooks |

The GHL webhook endpoint is `POST /ghl`. Configure this URL in your GHL location settings.

## Environment Variable Tiers

### Always Required (API won't start without these)
- `DATABASE_URL` — PostgreSQL connection string
- `SUPABASE_URL` — Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service-role key
- `STRIPE_SECRET_KEY` — Stripe API secret key
- `STRIPE_WEBHOOK_SECRET` — Stripe webhook signing secret

### Production Required (fatal in production, optional in dev)
- `REDIS_URL` — Redis connection URL

### Optional (features degrade gracefully)
- `ANTHROPIC_API_KEY` — AI features (chat, estimation, takeoff)
- `GHL_API_KEY` + `GHL_LOCATION_ID` — GoHighLevel CRM sync
- `RESEND_API_KEY` or `SENDGRID_API_KEY` — Email delivery
- `TWILIO_ACCOUNT_SID` — SMS notifications
- `DOCUSIGN_INTEGRATION_KEY` — E-signatures
- `SENTRY_DSN` — Error tracking
- `VAPID_PUBLIC_KEY` + `VAPID_PRIVATE_KEY` — Web push notifications
- `S3_ACCESS_KEY_ID` / `R2_ACCESS_KEY_ID` — File storage

## Auth Signup Flow

The signup process creates accounts in two systems:

1. **Supabase Auth** — creates the auth identity (email/password)
2. **Prisma/PostgreSQL** — creates the user record (synced ID)

If the Prisma step fails after Supabase succeeds, the Supabase user is
automatically rolled back (deleted) to prevent orphaned auth records.

## Per-Service .env.example Files

| File                             | Purpose                    |
|----------------------------------|----------------------------|
| `.env.example`                   | Master template (all vars) |
| `services/api/.env.example`      | API service config         |
| `services/worker/.env.example`   | Worker service config      |
| `packages/database/.env.example` | Database connection only   |
