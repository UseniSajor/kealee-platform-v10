# Kealee Platform — Production Rollout Runbook

> **Date**: 2026-03-15
> **Author**: Tim Chamberlain
> **Scope**: Full production deployment of Kealee Platform v10/v20 on Railway, covering contractor acquisition automation, revenue hooks, DesignBot, and contractor marketing services.

---

## A — Rollout Architecture Overview

### System Topology

```
┌─────────────────────────────────────────────────────────────────┐
│                        RAILWAY PROJECT                          │
│                                                                  │
│  ┌──────────────────┐      ┌──────────────────────────────────┐ │
│  │   api service    │      │    command-center service        │ │
│  │  (Fastify 4)     │◄────►│  (BullMQ workers + GrowthBot)   │ │
│  │  Port 3000       │      │  Port 3001                       │ │
│  └────────┬─────────┘      └──────────────┬───────────────────┘ │
│           │                               │                      │
│  ┌────────┴──────────────────────────────┴───────────────────┐  │
│  │              PostgreSQL (Railway Managed)                 │  │
│  │              Redis (Railway Managed)                      │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────┐  ┌─────────────────┐  ┌─────────────────┐    │
│  │ portal-owner │  │portal-contractor│  │ command-center  │    │
│  │ (Next.js 14) │  │  (Next.js 14)   │  │  app (Next.js)  │    │
│  │  Port 3020   │  │   Port 3021     │  │   Port 3023     │    │
│  └──────────────┘  └─────────────────┘  └─────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### Internal Networking (Railway Private Network)

| Service | Internal URL | External URL |
|---------|-------------|--------------|
| api | `http://api.railway.internal:3000` | `https://api.kealee.com` |
| command-center | `http://command-center.railway.internal:3001` | internal only |
| PostgreSQL | `postgresql://...@ballast.proxy.rlwy.net:46074/railway` | private URL |
| Redis | `redis://...@redis.railway.internal:6379` | private URL |

### Service Dependencies

```
portal-* apps
    └── api (NEXT_PUBLIC_API_URL)
         ├── PostgreSQL (DATABASE_URL)
         ├── Redis (REDIS_URL) — session cache, dedup
         ├── Supabase (SUPABASE_*) — auth JWT verification
         ├── Stripe (STRIPE_*) — payments
         ├── Zoho CRM (ZOHO_*) — CRM sync
         ├── SendGrid (SENDGRID_*) — transactional email
         └── Twilio (TWILIO_*) — SMS

command-center
    ├── api (INTERNAL_API_URL — Zoho proxy)
    ├── Redis (REDIS_URL) — BullMQ
    ├── Anthropic (ANTHROPIC_API_KEY) — GrowthBot AI
    └── PostgreSQL (DATABASE_URL)
```

---

## B — Service Deployment Design

### Railway Service Configuration

Each service is deployed as a Railway service with:
- Docker-based build (Dockerfile at service root)
- Health check on `GET /health`
- Restart policy: `on_failure` with 3 max retries
- Memory: api → 512MB, command-center → 256MB, portals → 256MB each

### Dockerfile Pattern (api)

```dockerfile
FROM node:20-alpine AS base
RUN npm install -g pnpm@9

FROM base AS deps
WORKDIR /app
COPY pnpm-lock.yaml package.json pnpm-workspace.yaml turbo.json ./
COPY packages/ packages/
COPY services/api/ services/api/
RUN pnpm install --frozen-lockfile --filter @kealee/api...

FROM deps AS builder
RUN pnpm run --filter @kealee/api build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/services/api/dist ./services/api/dist
COPY --from=builder /app/services/api/package.json ./services/api/package.json
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "services/api/dist/index.js"]
```

### Deploy Order

1. **Infrastructure**: PostgreSQL, Redis (Railway add-ons — auto-provisioned)
2. **api** — core backend (no runtime deps on command-center)
3. **command-center** — depends on api for Zoho proxy; wait for api health
4. **portal apps** — depend on api; deploy in parallel after api is healthy

### Railway CLI Deployment

```bash
# Login
railway login

# Link to project
railway link --project kealee-production

# Deploy api
railway up --service api

# Deploy command-center
railway up --service command-center

# Deploy portals (parallel)
railway up --service portal-owner &
railway up --service portal-contractor &
railway up --service portal-developer &
wait
```

---

## C — Environment Variable Pack

### api service — complete env

```bash
# ── Core ──────────────────────────────────────────────────────────
NODE_ENV=production
PORT=3000
API_URL=https://api.kealee.com
CORS_ORIGIN=https://kealee.com,https://owner.kealee.com,https://contractor.kealee.com

# ── Database ──────────────────────────────────────────────────────
DATABASE_URL=postgresql://postgres:PASSWORD@ballast.proxy.rlwy.net:46074/railway

# ── Redis ─────────────────────────────────────────────────────────
REDIS_URL=redis://default:PASSWORD@redis.railway.internal:6379

# ── Auth (Supabase) ───────────────────────────────────────────────
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# ── Stripe ────────────────────────────────────────────────────────
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_MKT_STARTER_MONTHLY=price_...
STRIPE_PRICE_MKT_STARTER_ANNUAL=price_...
STRIPE_PRICE_MKT_GROWTH_MONTHLY=price_...
STRIPE_PRICE_MKT_GROWTH_ANNUAL=price_...
STRIPE_PRICE_MKT_PRO_MONTHLY=price_...
STRIPE_PRICE_MKT_PRO_ANNUAL=price_...
STRIPE_PRICE_MKT_PRO_SETUP=price_...
# Revenue hook one-time payments
STRIPE_PRICE_DESIGN_ARCHITECT_REVIEW=price_...
STRIPE_PRICE_DESIGN_FULL_DESIGN=price_...
STRIPE_PRICE_PERMIT_PREP=price_...
STRIPE_PRICE_PERMIT_COORDINATION=price_...
STRIPE_PRICE_PERMIT_EXPEDITING=price_...
STRIPE_PRICE_ESTIMATE_DETAILED=price_...
STRIPE_PRICE_ESTIMATE_PROFESSIONAL=price_...
STRIPE_PRICE_CONTRACTOR_FEATURED=price_...
STRIPE_PRICE_CONTRACTOR_PRIORITY=price_...
STRIPE_PRICE_ENGAGEMENT_OWNER_ESCROW=price_...
STRIPE_PRICE_ENGAGEMENT_FULL_MANAGED=price_...

# ── Zoho CRM ─────────────────────────────────────────────────────
ZOHO_CLIENT_ID=1000.xxx
ZOHO_CLIENT_SECRET=xxx
ZOHO_REFRESH_TOKEN=1000.xxx
ZOHO_DOMAIN=com
ZOHO_WEBHOOK_TOKEN=your-random-32-char-token

# ── SendGrid ──────────────────────────────────────────────────────
SENDGRID_API_KEY=SG.xxx
SENDGRID_FROM_EMAIL=hello@kealee.com
SENDGRID_FROM_NAME=Kealee Platform

# ── Twilio ────────────────────────────────────────────────────────
TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_PHONE_NUMBER=+18005550000
# or: TWILIO_MESSAGING_SERVICE_SID=MGxxx

# ── Internal service auth ────────────────────────────────────────
INTERNAL_API_KEY=your-random-64-char-key

# ── Portal URLs ──────────────────────────────────────────────────
PORTAL_CONTRACTOR_URL=https://contractor.kealee.com
PORTAL_OWNER_URL=https://owner.kealee.com

# ── AI ───────────────────────────────────────────────────────────
ANTHROPIC_API_KEY=sk-ant-...
```

### command-center service — complete env

```bash
NODE_ENV=production
PORT=3001

DATABASE_URL=postgresql://postgres:PASSWORD@ballast.proxy.rlwy.net:46074/railway
REDIS_URL=redis://default:PASSWORD@redis.railway.internal:6379

INTERNAL_API_URL=http://api.railway.internal:3000
INTERNAL_API_KEY=your-random-64-char-key  # Must match api service

ANTHROPIC_API_KEY=sk-ant-...

SENDGRID_API_KEY=SG.xxx
SENDGRID_FROM_EMAIL=hello@kealee.com
SENDGRID_FROM_NAME=Kealee Contractor Team

TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_PHONE_NUMBER=+18005550000

GROWTH_BOT_SCHEDULE="0 */4 * * *"   # every 4h
SHORTAGE_THRESHOLD=70
```

### portal apps — shared env pattern

```bash
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://api.kealee.com
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

---

## D — Zoho CRM Setup

### OAuth2 Token (one-time)

1. Log into [Zoho API Console](https://api-console.zoho.com)
2. Create a **Server-based Application**
3. Scopes required: `ZohoCRM.modules.ALL,ZohoCRM.settings.fields.CREATE,ZohoCRM.settings.fields.READ`
4. Generate a self-client grant code → exchange for refresh token:

```bash
curl -X POST "https://accounts.zoho.com/oauth/v2/token" \
  -d "grant_type=authorization_code" \
  -d "client_id=$ZOHO_CLIENT_ID" \
  -d "client_secret=$ZOHO_CLIENT_SECRET" \
  -d "redirect_uri=https://api.kealee.com/zoho/oauth/callback" \
  -d "code=1000.PASTE_AUTH_CODE_HERE"
# Save refresh_token from response → ZOHO_REFRESH_TOKEN env var
```

### Run Field Creation Script

```bash
# From repo root
ZOHO_CLIENT_ID=xxx ZOHO_CLIENT_SECRET=xxx ZOHO_REFRESH_TOKEN=xxx \
  npx tsx scripts/rollout/zoho-setup.ts
```

This creates the following custom fields:

**Leads module:**
| API Name | Display Name | Type |
|----------|-------------|------|
| `Contractor_Stage__c` | Contractor Stage | Picklist |
| `Target_Trade__c` | Target Trade | Single Line |
| `Target_Geo__c` | Target Geography | Single Line |
| `Kealee_User_Id__c` | Kealee User ID | Single Line |
| `Shortage_Score__c` | Shortage Score | Integer |
| `Outreach_Source__c` | Outreach Source | Picklist |
| `Last_Contacted_At__c` | Last Contacted At | DateTime |
| `Kealee_Profile_Id__c` | Kealee Profile ID | Single Line |

**Contacts module:**
| API Name | Display Name | Type |
|----------|-------------|------|
| `Kealee_Profile_Id__c` | Kealee Profile ID | Single Line |
| `Kealee_User_Id__c` | Kealee User ID | Single Line |
| `Contractor_Stage__c` | Contractor Stage | Picklist |
| `Primary_Trade__c` | Primary Trade | Single Line |
| `Service_Geo__c` | Service Geography | Single Line |
| `Verification_Status__c` | Verification Status | Picklist |

### Configure Webhook (Zoho → Kealee)

In Zoho CRM → Setup → Automation → Webhooks:
- URL: `https://api.kealee.com/zoho/webhook`
- Auth header: `x-zoho-webhook-token: $ZOHO_WEBHOOK_TOKEN`
- Trigger on: Lead stage change, Contact create

---

## E — SendGrid Setup

### API Key

1. Go to [SendGrid Settings → API Keys](https://app.sendgrid.com/settings/api_keys)
2. Create key with **Full Access** (or restrict to Mail Send + Template Engine)
3. Set `SENDGRID_API_KEY` in Railway env

### Domain Authentication

1. Settings → Sender Authentication → Authenticate Your Domain
2. Add DNS records to your domain registrar (CNAME records)
3. Verify — required for deliverability

### Unsubscribe Groups

Create groups matching automated flows:
- **Marketing Onboarding** — contractor package welcome emails
- **Lead Notifications** — contractor lead alerts
- **Recruitment Sequence** — acquisition outreach emails

Map group IDs to `SENDGRID_UNSUBSCRIBE_GROUP_*` env vars.

### Template IDs (optional override)

If you want custom SendGrid dynamic templates instead of inline HTML:

```bash
SENDGRID_TEMPLATE_RECRUIT_1=d-xxx    # "Stop chasing homeowners"
SENDGRID_TEMPLATE_RECRUIT_2=d-xxx    # "How Kealee delivers permit-ready jobs"
SENDGRID_TEMPLATE_RECRUIT_3=d-xxx    # "Join the contractor marketplace"
SENDGRID_TEMPLATE_ONBOARD_WELCOME=d-xxx
SENDGRID_TEMPLATE_MARKETING_WELCOME=d-xxx
```

---

## F — Twilio Setup

### Account Configuration

1. Log into [Twilio Console](https://console.twilio.com)
2. Note: Account SID, Auth Token → `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`

### Phone Number or Messaging Service

**Option A — Single Number** (simple, lower volume):
```bash
TWILIO_PHONE_NUMBER=+18005550000
```

**Option B — Messaging Service** (recommended for production — handles scale + opt-outs):
1. Messaging → Services → Create Messaging Service
2. Add your purchased number(s) to the service
3. Configure opt-out keywords: STOP, UNSUBSCRIBE
4. Set `TWILIO_MESSAGING_SERVICE_SID=MGxxx` in env (code will prefer this over phone number)

### A2P 10DLC Registration (US compliance)

For production SMS you must register:
1. Messaging → Regulatory Compliance → US A2P 10DLC
2. Register Brand (business entity details)
3. Register Campaign (use case: Mixed — marketing + transactional)
4. Link campaign to your Messaging Service
5. Approval typically takes 3-5 business days

### Opt-out Handling

Twilio automatically handles STOP/UNSTOP for registered messaging services. No code change needed.

---

## G — Railway Deployment

### Step-by-Step

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Create project (if new)
railway init

# 4. Link existing project
railway link

# 5. Set environment variables (bulk from .env file)
railway variables --set-from-file scripts/rollout/env.production.api.example

# 6. Deploy api first
railway service api
railway up

# 7. Run database migrations
railway run --service api -- npx prisma migrate deploy

# 8. Deploy command-center
railway service command-center
railway up

# 9. Deploy portal apps
for service in portal-owner portal-contractor portal-developer command-center-app; do
  railway service $service
  railway up
done

# 10. Set custom domains
railway domain --service api api.kealee.com
railway domain --service portal-owner owner.kealee.com
railway domain --service portal-contractor contractor.kealee.com
```

### railway.json (api)

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "services/api/Dockerfile"
  },
  "deploy": {
    "startCommand": "node dist/index.js",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 30,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3
  }
}
```

### Post-Deploy Health Check

```bash
# Verify api
curl https://api.kealee.com/health

# Verify Zoho integration
curl https://api.kealee.com/zoho/status \
  -H "x-internal-key: $INTERNAL_API_KEY"

# Verify marketing packages
curl https://api.kealee.com/marketing/packages
```

---

## H — Smoke Tests

Run `scripts/rollout/smoke-test.sh` after deployment:

```bash
chmod +x scripts/rollout/smoke-test.sh
API_URL=https://api.kealee.com \
INTERNAL_KEY=$INTERNAL_API_KEY \
  ./scripts/rollout/smoke-test.sh
```

**Test Matrix:**

| Test | Endpoint | Expected |
|------|---------|---------|
| API health | `GET /health` | 200 + `{"status":"ok"}` |
| Marketing packages | `GET /marketing/packages` | 200 + 3 packages |
| Revenue hook tiers | `GET /revenue-hooks/tiers/permit_detected` | 200 + 4 tiers |
| Zoho status | `GET /zoho/status` | 200 + configured=true |
| Zoho webhook auth | `POST /zoho/webhook` (no token) | 401 |
| Lead create | `POST /zoho/leads` | 201 + Zoho ID |
| Landing page | `GET /marketing/landing/test-id` | 200 + SEO data |
| DesignBot health | `GET /keabots/health` | 200 |

---

## I — First 48h Monitoring Plan

### Railway Metrics (Dashboard)

Monitor immediately post-deploy:
- **CPU** — api should idle <5%, spike to <40% on traffic
- **Memory** — api <400MB, command-center <200MB
- **Request count** — baseline from smoke tests
- **Error rate** — should be 0% for /health

### Log Queries (Railway Log Drain → Papertrail / Datadog)

```bash
# Watch api startup
railway logs --service api --tail

# Watch command-center worker
railway logs --service command-center --tail

# Filter for errors
railway logs --service api | grep '"level":50'
```

### Redis Monitoring

```bash
# Run redis-verify.sh
./scripts/rollout/redis-verify.sh

# Key counts to watch
# acq:dedup:* — contractor acquisition dedup keys (expect 0 initially)
# bull:growth:* — BullMQ growth bot jobs
```

### Stripe Dashboard

- Payments → Subscriptions: watch for `marketing_*` subscriptions being created
- Webhooks: verify `checkout.session.completed` events received (note: webhook handler still needed — see gap below)
- Revenue hooks: verify one-time payment sessions being created

### Alert Thresholds (First 48h)

| Metric | Warning | Critical |
|--------|---------|----------|
| API P95 latency | >500ms | >2000ms |
| API error rate | >1% | >5% |
| Stripe webhook failures | >0 | >3/hr |
| Zoho API errors | >5/hr | >20/hr |
| SendGrid bounce rate | >2% | >5% |
| Redis memory | >70% | >90% |
| DB connection pool | >80% | >95% |

### Zoho Sync Verification

24h after first contractor registration:
```bash
curl "https://api.kealee.com/zoho/leads/stage/Contacted" \
  -H "x-internal-key: $INTERNAL_API_KEY" | jq '.count'
# Should match number of contractors who registered
```

---

## J — Redis Dedup Plan

### Key Structure

```
acq:dedup:{step}:{identifier}
```

| Step | Identifier | TTL |
|------|-----------|-----|
| `outreach` | email address | 7 days |
| `registration_reminder` | email | 2 days |
| `documents_reminder` | userId | 3 days |
| `verified_notification` | userId | 30 days |
| `reengagement` | userId | 14 days |
| `zoho_webhook` | `{stage}:{contactId}` | 24 hours |

### Dedup Logic

```typescript
// SET NX (only set if Not eXists) — atomic, no race conditions
const key = `acq:dedup:${step}:${identifier}`;
const acquired = await redis.set(key, '1', 'EX', ttlSeconds, 'NX');
if (!acquired) {
  logger.debug({ key }, 'Dedup: skipping duplicate');
  return; // already sent
}
// proceed with action
```

### Clearing Dedup (manual — for testing)

```bash
# Clear all acquisition dedup keys
redis-cli -u $REDIS_URL --scan --pattern 'acq:dedup:*' | xargs redis-cli -u $REDIS_URL DEL

# Clear specific step
redis-cli -u $REDIS_URL --scan --pattern 'acq:dedup:outreach:*' | xargs redis-cli -u $REDIS_URL DEL
```

### BullMQ Delayed Emails

Scheduled recruitment follow-ups use BullMQ:

```
Queue: kealee:acquisition:emails
Jobs:
  - recruitment_email_2  → delay: 3 days (259200s)
  - recruitment_email_3  → delay: 7 days (604800s)
```

Monitor queue depth:
```bash
# Via redis-verify.sh
./scripts/rollout/redis-verify.sh

# Manual check
redis-cli -u $REDIS_URL llen 'bull:kealee:acquisition:emails:delayed'
```

### TTL Governance

- All dedup keys expire automatically — no cleanup cron needed
- Redis memory budget: 50MB for dedup keys at 10k contractors (est. 50 bytes/key × 5 keys × 10k = 2.5MB — well within budget)
- If Redis runs low on memory: increase TTLs are the first lever to pull

---

## K — Rollback & Incident Response

### Rollback Procedure

**Railway deployment rollback (< 1 minute):**
```bash
# List recent deployments
railway deployments --service api

# Roll back to previous
railway rollback --service api --deployment DEPLOYMENT_ID
```

**Database rollback:**
```bash
# Prisma migrate down (run from api service context)
railway run --service api -- npx prisma migrate resolve --rolled-back MIGRATION_NAME

# Or restore from Railway automatic backup (daily snapshots)
# Dashboard → PostgreSQL → Backups → Restore
```

### Incident Runbook

#### P0 — API completely down

1. Check Railway service status (Dashboard → api → Deployments)
2. Check `/health` endpoint — if 502, service is crashed
3. Check recent logs: `railway logs --service api --tail 100`
4. If OOM: increase memory limit in Railway settings
5. If startup crash: check env vars — missing `DATABASE_URL` or `REDIS_URL` will kill startup
6. Roll back if new deployment caused it: `railway rollback --service api`

#### P1 — Stripe payments failing

1. Check Stripe Dashboard → Developers → Events for errors
2. Verify `STRIPE_SECRET_KEY` is live key (not test) in Railway env
3. Check `POST /revenue-hooks/checkout` returns correct `line_items`
4. For webhook failures: check `STRIPE_WEBHOOK_SECRET` matches Stripe dashboard endpoint secret
5. Stripe status page: https://status.stripe.com

#### P1 — Zoho sync failing

1. Check `GET /zoho/status` for `configured: false` → missing env vars
2. Check `railway logs --service api | grep zoho` for OAuth errors
3. OAuth token expired: re-generate refresh token (tokens expire after 10 years but can be revoked)
4. Rate limit (200 req/min): check Zoho API usage → implement request queuing if needed
5. Zoho status: https://status.zoho.com

#### P2 — SendGrid emails not delivering

1. Check SendGrid Dashboard → Activity Feed for bounces/blocks
2. Common causes: domain not authenticated, email in suppression list, spam content
3. Check `SENDGRID_FROM_EMAIL` matches authenticated sender domain
4. Test: `curl -X POST https://api.sendgrid.com/v3/mail/send` with raw payload

#### P2 — Redis dedup keys causing missed messages

1. Check TTLs: `redis-cli -u $REDIS_URL TTL acq:dedup:outreach:email@example.com`
2. If key exists but message was already sent correctly: this is expected behavior (not a bug)
3. If key exists but message was NOT sent: manually delete key and re-trigger
4. If Redis is down: service degrades gracefully — dedup is skipped, not blocked

### Escalation Contacts

| Layer | Contact | Response SLA |
|-------|---------|-------------|
| Railway infra | support.railway.app | 2h |
| Stripe payments | stripe.com/support | 4h |
| Zoho CRM | zoho.com/support | 8h |
| SendGrid deliverability | sendgrid.com/support | 24h |

---

## L — Go-Live Checklist

### Pre-Deploy (Complete before `railway up`)

- [ ] **Env vars**: All required vars set in Railway for api + command-center
- [ ] **Stripe products**: All 11 Stripe prices created (marketing packages + revenue hook tiers)
- [ ] **Domain DNS**: `api.kealee.com`, `owner.kealee.com`, `contractor.kealee.com` pointed to Railway
- [ ] **SSL**: Railway auto-provisions Let's Encrypt — verify HTTPS after domain link
- [ ] **Supabase**: Auth project live, anon key + service role key copied
- [ ] **Zoho**: OAuth2 refresh token generated, custom fields script run
- [ ] **SendGrid**: Domain authenticated, API key has Mail Send access
- [ ] **Twilio**: A2P 10DLC registered (or test number for staging)
- [ ] **Redis**: Railway Redis add-on provisioned, `REDIS_URL` set

### Deploy Day

- [ ] **DB migration**: `railway run -- npx prisma migrate deploy` — verify 0 errors
- [ ] **api health**: `curl https://api.kealee.com/health` → 200
- [ ] **command-center health**: `railway logs --service command-center | grep 'Ready'`
- [ ] **Zoho status**: `GET /zoho/status` → `configured: true`
- [ ] **Marketing packages**: `GET /marketing/packages` → 3 packages with prices
- [ ] **Smoke tests**: `./scripts/rollout/smoke-test.sh` — all GREEN
- [ ] **Redis verify**: `./scripts/rollout/redis-verify.sh` — connectivity OK
- [ ] **Stripe webhook**: Register endpoint `https://api.kealee.com/stripe/webhook` in Stripe dashboard

### Post-Deploy (First 4h)

- [ ] **Test contractor registration**: Create a test contractor account end-to-end
- [ ] **Test lead notification**: Submit test lead on contractor landing page
- [ ] **Test revenue hook**: Trigger design complete modal, verify Stripe session URL returned
- [ ] **Verify Zoho sync**: Check test contractor appears in Zoho CRM as Lead
- [ ] **Verify email**: Confirm onboarding welcome email received for test account
- [ ] **Verify SMS**: Confirm lead notification SMS received on test phone
- [ ] **GrowthBot**: Manually trigger via `POST /command-center/growth/trigger` — verify no errors
- [ ] **Acquisition dedup**: Check `acq:dedup:outreach:*` keys in Redis after GrowthBot run

### Hardening (First Week)

- [ ] **Stripe webhook handler**: Implement `checkout.session.completed` → activate subscription → enroll onboarding email → sync Zoho
- [ ] **Anonymous checkout**: Build checkout flow without requiring Supabase auth
- [ ] **Portal API integration**: Replace mock data in portal-* apps with real API calls
- [ ] **Error budget**: Set up Railway alerting for error rate >2%
- [ ] **Log drain**: Connect Railway logs to Datadog / Papertrail for retention + search
- [ ] **Database backups**: Verify Railway daily backup is running (`pg_dump` size > 0)
- [ ] **Load test**: Run `k6 run --vus 50 --duration 30s scripts/load-test.js` against staging
- [ ] **Security scan**: Run `pnpm audit` — resolve any critical CVEs
- [ ] **Stripe radar rules**: Enable basic fraud rules for marketing subscriptions
- [ ] **Rate limiting**: Verify Fastify rate-limit plugin active on `/marketing/subscribe`, `/revenue-hooks/checkout`

---

*Document maintained in `docs/production-rollout-runbook.md`. Update after each major deployment.*
