# Environment Variable Checklist

> Last updated: 2026-03-15
> Platform: Railway (ALL services — no Vercel)
> Services: api, worker, ai-learning, command-center, os-land, os-feas, os-dev, os-pm, os-pay, os-ops, marketplace
> Apps: portal-owner, portal-contractor, portal-developer, command-center, web-main, admin-console

---

## Legend

- ✅ Required — service will not start without this
- ⚠️ Optional — feature degraded if missing, service starts
- 🔒 Secret — never log, never commit
- 📋 Shared — same value across all services

---

## Core Infrastructure (ALL services)

| Variable | Required | Secret | Value (staging) | Notes |
|----------|----------|--------|-----------------|-------|
| `NODE_ENV` | ✅ | No | `staging` / `production` | |
| `APP_ENV` | ✅ | No | `staging` / `production` | Overrides NODE_ENV for env guard |
| `DATABASE_URL` | ✅ | 🔒 | `postgresql://...@...railway.internal:5432/railway` | Backend services only |
| `REDIS_URL` | ✅ | 🔒 | `redis://...railway.internal:6379` | |
| `PORT` | ✅ | No | Set by Railway automatically | |

---

## Authentication (api service + all Next.js apps)

| Variable | Required | Secret | Notes |
|----------|----------|--------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | No | Public — safe in frontend |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | No | Public — safe in frontend |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | 🔒 | Backend only. Never expose to frontend |
| `JWT_SECRET` | ✅ | 🔒 | For internal JWT signing |
| `AUDIT_SIGNING_KEY` | ⚠️ | 🔒 | For audit log signatures |

---

## API Service (`services/api`)

| Variable | Required | Secret | Notes |
|----------|----------|--------|-------|
| `API_URL` | ✅ | No | Internal: `http://api.railway.internal:3000` |
| `NEXT_PUBLIC_API_URL` | ✅ | No | Public API URL for frontend apps |
| `CORS_ORIGINS` | ⚠️ | No | Comma-separated allowed origins |
| `RATE_LIMIT_WINDOW_MS` | ⚠️ | No | Default: `60000` |
| `RATE_LIMIT_GLOBAL_MAX` | ⚠️ | No | Default: `100` |

---

## AI / Anthropic (api service, all bots, ai-learning)

| Variable | Required | Secret | Notes |
|----------|----------|--------|-------|
| `ANTHROPIC_API_KEY` | ✅ | 🔒 | `sk-ant-...` — needed by all KeaBots |
| `ANTHROPIC_MODEL` | ⚠️ | No | Default: `claude-sonnet-4-20250514` |
| `OPENAI_API_KEY` | ⚠️ | 🔒 | For embeddings / RAG only |

---

## Payments (api service, os-pay)

| Variable | Required | Secret | Notes |
|----------|----------|--------|-------|
| `STRIPE_SECRET_KEY` | ✅ | 🔒 | `sk_live_...` in prod, `sk_test_...` in staging |
| `STRIPE_WEBHOOK_SECRET` | ✅ | 🔒 | `whsec_...` — from Stripe dashboard |
| `STRIPE_PRICE_PACKAGE_A` | ✅ | No | Stripe Price ID for Package A |
| `STRIPE_PRICE_PACKAGE_B` | ✅ | No | Stripe Price ID for Package B |
| `STRIPE_PRICE_PACKAGE_C` | ✅ | No | Stripe Price ID for Package C |
| `STRIPE_PRICE_PACKAGE_D` | ✅ | No | Stripe Price ID for Package D |
| `STRIPE_PRICE_PACKAGE_E` | ✅ | No | Stripe Price ID for Package E |
| `STRIPE_PRICE_PACKAGE_F` | ✅ | No | Stripe Price ID for Package F |
| `STRIPE_PRICE_PACKAGE_G` | ✅ | No | Stripe Price ID for Package G |
| `STRIPE_PRICE_PACKAGE_H` | ✅ | No | Stripe Price ID for Package H |
| `STRIPE_PRICE_MONTHLY_PRO` | ⚠️ | No | Monthly subscription price |
| `STRIPE_PRICE_ANNUAL_PRO` | ⚠️ | No | Annual subscription price |
| `STRIPE_PRICE_CONTRACTOR_BASIC` | ⚠️ | No | Contractor tier basic |
| `STRIPE_PRICE_CONTRACTOR_PRO` | ⚠️ | No | Contractor tier pro |
| `STRIPE_PRICE_ENTERPRISE` | ⚠️ | No | Enterprise tier |

---

## Email / Resend (api service, worker)

| Variable | Required | Secret | Notes |
|----------|----------|--------|-------|
| `RESEND_API_KEY` | ✅ | 🔒 | `re_...` |
| `RESEND_FROM_EMAIL` | ⚠️ | No | Default: `Kealee <noreply@kealee.com>` |

---

## SMS / Twilio (api service, worker)

| Variable | Required | Secret | Notes |
|----------|----------|--------|-------|
| `TWILIO_ACCOUNT_SID` | ✅ | 🔒 | `ACxxxxxxxxxxxxxxxx` |
| `TWILIO_AUTH_TOKEN` | ✅ | 🔒 | |
| `TWILIO_PHONE_NUMBER` | ✅ | No | `+1...` — verified Twilio number |

---

## GHL CRM (api service)

| Variable | Required | Secret | Notes |
|----------|----------|--------|-------|
| `GHL_API_KEY` | ✅ | 🔒 | GoHighLevel API key |
| `GHL_LOCATION_ID` | ✅ | No | GHL Location ID (subaccount) |
| `GHL_WEBHOOK_SECRET` | ⚠️ | 🔒 | For verifying GHL webhook payloads |

---

## File Storage / S3 (api service, worker)

| Variable | Required | Secret | Notes |
|----------|----------|--------|-------|
| `S3_ACCESS_KEY_ID` | ✅ | 🔒 | |
| `S3_SECRET_ACCESS_KEY` | ✅ | 🔒 | |
| `S3_BUCKET_NAME` | ✅ | No | `kealee-uploads` |
| `S3_REGION` | ⚠️ | No | Default: `us-west-2` |
| `R2_ENDPOINT` | ⚠️ | No | If using Cloudflare R2 instead of S3 |

---

## DocuSign (api service)

| Variable | Required | Secret | Notes |
|----------|----------|--------|-------|
| `DOCUSIGN_INTEGRATION_KEY` | ⚠️ | 🔒 | Required for contract signing |
| `DOCUSIGN_ACCOUNT_ID` | ⚠️ | No | |
| `DOCUSIGN_USER_ID` | ⚠️ | No | |
| `DOCUSIGN_PRIVATE_KEY` | ⚠️ | 🔒 | RSA private key for JWT auth |

---

## Push Notifications (api service, portal apps)

| Variable | Required | Secret | Notes |
|----------|----------|--------|-------|
| `VAPID_PUBLIC_KEY` | ⚠️ | No | Web push public key |
| `VAPID_PRIVATE_KEY` | ⚠️ | 🔒 | Web push private key |

---

## Worker Service (`services/worker`)

| Variable | Required | Secret | Notes |
|----------|----------|--------|-------|
| `REDIS_URL` | ✅ | 🔒 | Same Redis as API |
| `API_BASE_URL` | ✅ | No | `http://api.railway.internal:3000` |
| `HEALTH_PORT` | ⚠️ | No | Default: `3099` — Railway health check port |
| `SENDGRID_API_KEY` | ⚠️ | 🔒 | NOTE: Worker uses SendGrid for templates (legacy). Migrate to Resend. |
| `REPORTS_DIR` | ⚠️ | No | Default: `/tmp/reports` |
| `FILE_CLEANUP_AGE_DAYS` | ⚠️ | No | Default: `30` |
| `INCOMPLETE_UPLOAD_AGE_HOURS` | ⚠️ | No | Default: `24` |
| `SPATIAL_AI_MODEL` | ⚠️ | No | Default: `claude-sonnet-4-20250514` |
| `TEST_EMAIL` | ⚠️ | No | Set to `false` to skip dev test email |

---

## Portal Apps (Next.js — all 6)

| Variable | Required | Secret | Notes |
|----------|----------|--------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | No | Public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | No | Public |
| `NEXT_PUBLIC_API_URL` | ✅ | No | API service URL |
| `NEXT_PUBLIC_APP_URL` | ✅ | No | This app's own URL |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | ⚠️ | No | For Stripe Elements in portal |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | ⚠️ | No | For web push subscription |

---

## Observability (all services — optional)

| Variable | Required | Secret | Notes |
|----------|----------|--------|-------|
| `SENTRY_DSN` | ⚠️ | No | Error tracking (not yet installed) |
| `DATADOG_API_KEY` | ⚠️ | 🔒 | APM tracing (not yet installed) |
| `LOG_LEVEL` | ⚠️ | No | `info` / `debug` / `warn` / `error` |

---

## Railway-Set Variables (auto-injected, do not set manually)

```
RAILWAY_ENVIRONMENT_NAME   — "production" or "staging"
RAILWAY_SERVICE_NAME       — service identifier
RAILWAY_PROJECT_ID         — Railway project UUID
RAILWAY_DEPLOYMENT_ID      — current deployment UUID
```

---

## Quick Validation Script

```bash
# Run from services/api to check all required vars are set:
node -e "
const required = ['DATABASE_URL','REDIS_URL','ANTHROPIC_API_KEY',
  'SUPABASE_SERVICE_ROLE_KEY','STRIPE_SECRET_KEY','STRIPE_WEBHOOK_SECRET',
  'RESEND_API_KEY','GHL_API_KEY','GHL_LOCATION_ID']
const missing = required.filter(k => !process.env[k])
if (missing.length) { console.error('MISSING:', missing); process.exit(1) }
console.log('All required env vars present')
"
```
