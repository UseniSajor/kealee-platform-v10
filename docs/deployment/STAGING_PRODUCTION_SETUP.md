# Staging & Production Infrastructure Setup

This guide covers deploying the certified platform to staging and production environments.

**Prerequisites:** Complete [LOCAL_DEV_SETUP.md](./LOCAL_DEV_SETUP.md) first — you'll use the same credentials but point to cloud services.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│ Next.js Apps (web-main, portals)                                │
│ ├─ Payment flows → Stripe API                                   │
│ ├─ Database → Supabase Postgres                                 │
│ └─ Jobs → Redis queue                                           │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ API Service (Railway)                                           │
│ ├─ Webhook handler (Stripe signatures)                          │
│ ├─ v30 bot orchestration (OpenAI/Claude)                        │
│ └─ Output sync (intake + reports)                               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ External Services                                               │
│ ├─ Stripe (live payments)                                       │
│ ├─ Supabase Postgres (replicated)                               │
│ ├─ OpenAI API (primary LLM)                                     │
│ ├─ Anthropic API (fallback)                                     │
│ ├─ Resend (email)                                               │
│ ├─ Redis Cloud (job queue)                                      │
│ └─ S3/R2 (file storage)                                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Part 1: Supabase Postgres (Production Database)

### Create Managed Postgres

```bash
# 1. Visit https://supabase.com/dashboard/projects
# 2. Create new project
#    - Organization: your Kealee org
#    - Name: kealee-staging (or kealee-prod)
#    - Region: us-east-1 (same as API service)
#    - Database password: [save securely]
#    - Pricing: Pro (for prod), Free (for staging)

# 3. Wait for database to be ready (5-10 minutes)

# 4. Get connection strings
# - Project → Settings → Database → URI
# - Connection pooler (recommended for serverless): select "Session"
# - Save both URLs:
DATABASE_URL_DIRECT="postgresql://postgres:[password]@aws-0-[region].supabase.com:5432/postgres"
DATABASE_URL_POOLER="postgresql://postgres:[password]@aws-0-[region].pooler.supabase.com:6543/postgres"
```

### Apply Migrations

```bash
# 1. From local machine, apply migrations to staging
export DATABASE_URL="$DATABASE_URL_POOLER"

cd packages/database
npx prisma migrate deploy

# 2. Verify schema
npx prisma validate --schema prisma/schema.prisma

# Expected:
# ✓ 15 migrations applied
# ✓ AutonomousGoal, AutonomousRun tables created
# ✓ RevenueProduct, ProductCreditLedger tables created
```

### Backup Strategy

```bash
# 1. Enable automated backups in Supabase
# - Dashboard → Settings → Backups
# - Backup frequency: Daily (staging), Hourly (prod)
# - Retention: 7 days (staging), 30 days (prod)

# 2. Test restore procedure
# - Create backup manually
# - Verify you can download .sql dump

# 3. Document restore process in runbook
```

---

## Part 2: Stripe Production Setup

### Upgrade to Production Account

```bash
# 1. In Stripe dashboard (https://dashboard.stripe.com)
# 2. Dashboard → Settings → Account settings
# 3. Request live mode access (takes 1-2 business days)
# 4. Once approved, request activation

# 2. Get production API keys
# - Developers → API keys
# - Copy Secret key: sk_live_...
# - Copy Publishable key: pk_live_...
# - NEVER commit these to version control

echo "STRIPE_SECRET_KEY_PROD=sk_live_..." 
echo "STRIPE_PUBLISHABLE_KEY_PROD=pk_live_..." 
# Store in secure credential manager
```

### Set Up Production Webhooks

```bash
# 1. Dashboard → Developers → Webhooks
# 2. Add endpoint:
#    - URL: https://api.kealee.com/api/webhooks/stripe (your production domain)
#    - Events: checkout.session.completed, charge.succeeded, charge.failed
#    - API version: Latest

# 3. Secure webhook secret
# - Copy signing secret: whsec_live_...
# - Add to Railway production environment only
# - Never log or expose
```

### Enable Restricted API Keys (Recommended)

```bash
# 1. For frontend access, create restricted key:
# - Developers → Restricted API keys
# - Permissions: read/write checkout sessions only
# - IP restrictions: your frontend domain
# - Expiry: 1 year (set reminder to rotate)

# 2. Use this key for NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (safer than full key)
```

---

## Part 3: LLM Provider Keys (Production)

### OpenAI Production Tier

```bash
# 1. Visit https://platform.openai.com/account/api-keys
# 2. Create separate production key (do not share test key)
# 3. Set usage limits:
#    - Dashboard → Billing → Usage limits
#    - Set hard limit (e.g., $500/month)
#    - Enable email alerts

# 4. Store securely (never commit):
export OPENAI_API_KEY_PROD="sk-proj-..."

# 5. Optional: Create team/sub-account for dedicated billing
# - Organization settings → Teams
# - Create "Kealee Production" team
# - Assign API key to team for cleaner billing
```

### Anthropic Production Tier

```bash
# 1. Visit https://console.anthropic.com/account/keys
# 2. Create separate production key
# 3. Set usage limits:
#    - Account settings → Usage limits
#    - Set monthly budget (e.g., $1000/month)

# 4. Store securely:
export ANTHROPIC_API_KEY_PROD="sk-ant-..."
```

---

## Part 4: Email (Resend) Production Domain

### Verify Custom Domain

```bash
# 1. Resend dashboard → Domains
# 2. Add custom domain: noreply@kealee.com
# 3. Verify DNS records:
#    - Add DKIM records to your DNS
#    - Add SPF record: "v=spf1 include:resend.com ~all"
#    - Add DMARC record

# 4. DNS example (for Route53):
#    Type: CNAME
#    Name: k1._domainkey.noreply.kealee.com
#    Value: [provided by Resend]

# 5. Verify in Resend dashboard (waits for DNS propagation)
# 6. Once verified, enable authentication:
#    - Resend dashboard → Domains → kealee.com → Enable

# 7. Get production API key (different from test)
export RESEND_API_KEY_PROD="re_..."
```

### Email Warmup

```bash
# 1. Before sending to real customers:
# - Gradually increase email volume
# - Start: 10 emails/day → 50 → 200 → 1000
# - Spread over 1-2 weeks

# 2. Monitor deliverability:
# - Resend dashboard → Emails
# - Watch bounce rate (should be < 0.5%)
# - Watch spam complaints (should be 0)

# 3. If issues found:
# - Check domain reputation (mxtoolbox.com)
# - Verify SPF/DKIM/DMARC setup
# - Review email content for spam triggers
```

---

## Part 5: Redis Cache (Job Queue)

### Redis Cloud Setup

```bash
# 1. Visit https://redis.com/try-free/
# 2. Create Redis Cloud account
# 3. Create database:
#    - Cloud: AWS
#    - Region: same as Supabase (us-east-1)
#    - Database: 30 GB (staging), 100 GB+ (prod)
#    - Throughput: baseline (OK for start)

# 4. Get connection string
# - Databases → Your database → Connectivity
# - Copy connection string
export REDIS_URL="redis://:[PASSWORD]@[HOST]:[PORT]"

# 5. Test connection
redis-cli -u $REDIS_URL PING
# Should return: PONG
```

### Job Queue Configuration

```bash
# In services/api or worker service, configure BullMQ:

# 1. Connection settings
#    - host: parsed from REDIS_URL
#    - port: parsed from REDIS_URL
#    - password: parsed from REDIS_URL
#    - maxRetriesPerRequest: null (for blocking ops)

# 2. Job defaults
#    - attempts: 3
#    - backoff: exponential (2000ms * 2^attempts)
#    - removeOnComplete: true

# 3. Monitor queue health
#    - Redis commander: npm install redis-commander
#    - run: redis-commander --redis-url $REDIS_URL
#    - Verify jobs are processing
```

---

## Part 6: File Storage (S3 or R2)

### AWS S3 Setup (Alternative: Cloudflare R2)

```bash
# 1. AWS S3 bucket
# - Create bucket: kealee-uploads-prod
# - Region: us-east-1
# - Block public access: ON (serve through API)
# - Versioning: ON (recovery)
# - Encryption: AES-256

# 2. Create IAM user for API access
# - IAM → Users → Create user
# - Name: kealee-api-prod
# - Permissions: S3 full access to kealee-uploads-prod only

# 3. Create access keys
# - User → Security credentials → Create access key
# - Store securely:
export S3_ACCESS_KEY_ID="AKIA..."
export S3_SECRET_ACCESS_KEY="..."
export S3_BUCKET_NAME="kealee-uploads-prod"
export S3_REGION="us-east-1"

# 4. Test connectivity
# - Upload test file via API
# - Verify in AWS console
```

### Cloudflare R2 Setup (Recommended: lower cost + no egress fees)

```bash
# 1. Cloudflare account → R2
# 2. Create bucket: kealee-uploads-prod
# 3. Create API token:
#    - Dashboard → API tokens → Create custom token
#    - Permissions: R2 full access
#    - Zone/Account: Account (all zones)

# 4. Get endpoint
# - R2 → Bucket → Settings → Endpoint
# - Format: https://[id].r2.cloudflairstorage.com

# 5. Store credentials:
export R2_ENDPOINT="https://[id].r2.cloudflairstorage.com"
export R2_ACCESS_KEY_ID="..."
export R2_SECRET_ACCESS_KEY="..."
export R2_BUCKET_NAME="kealee-uploads-prod"

# 6. Cost: $0.015/GB storage + no egress fees (huge savings vs S3)
```

---

## Part 7: Railway Deployment (API Services)

### Create Railway Project

```bash
# 1. Visit https://railway.app/dashboard
# 2. Create new project
# 3. Add services from GitHub:
#    - services/api
#    - services/worker (background jobs)
#    - services/ai-learning (optional)

# 4. Configure environment variables
# - Add from Railway UI or via CLI:

railway link  # Links to your project
railway env   # View current env vars
railway env add STRIPE_SECRET_KEY sk_live_...
railway env add OPENAI_API_KEY sk-proj-...
railway env add DATABASE_URL $DATABASE_URL_POOLER
# ... add all vars from docs/deployment/env-var-checklist.md
```

### Health Checks & Monitoring

```bash
# 1. Configure health endpoint
# - Railway → Service → Settings
# - Health check: /healthz (every 30s)
# - Expected response: 200 OK

# 2. Set up error tracking
# - Enable Sentry for error monitoring
# - Dashboard → Integrations → Sentry
# - Add SENTRY_DSN to environment

# 3. Monitor logs
# railway logs -f services/api
# Watch for errors, webhook failures, bot execution issues
```

---

## Part 8: Next.js Apps Deployment (Vercel)

### Configure Vercel

```bash
# 1. Each app gets its own Vercel project
# - web-main (primary portal)
# - portal-owner (owner dashboard)
# - portal-contractor (contractor tools)

# 2. Connect Git:
# - Vercel → New project
# - Select repository: kealee-platform-v10
# - Select root directory: apps/web-main

# 3. Environment variables:
# - Copy from docs/deployment/env-var-checklist.md
# - Production-only secrets in Vercel UI (never commit)
# - NEXT_PUBLIC_* vars visible in frontend (safe)

# 4. Deploy
# - Push to main → automatic deploy
# - Monitor deployment logs
```

---

## Part 9: Certificate Completion Matrix

Run through all 8 certification flows **in production/staging environment**:

| Flow | Product | Status | Date | Notes |
|------|---------|--------|------|-------|
| 1. Home Project Readiness | home-readiness | [ ] | | estimate + zoning |
| 2. Project Launch Package | launch-full | [ ] | | all 4 bots |
| 3. Contractor Estimate & Permit | contractor-ep | [ ] | | estimate, zoning, permit |
| 4. Developer Feasibility | developer-feas | [ ] | | zoning, permit focus |
| 5. Standalone Estimate | standalone-estimate | [ ] | | estimate only |
| 6. Standalone Permit | standalone-permit | [ ] | | zoning + permit only |
| 7. Estimate + Permit Bundle | bundle-ep | [ ] | | bundled flow |
| 8. Design + Estimate + Permit | bundle-full | [ ] | | all bots, full output |

For each:
- [ ] Payment processed in real Stripe account (or test mode if staging)
- [ ] Webhook received and signature verified
- [ ] AutonomousRun created with correct bot set
- [ ] Each bot executed successfully
- [ ] Outputs merged into homeowner report
- [ ] Email sent to homeowner email address
- [ ] Owner portal rendered correctly (all outputs visible)
- [ ] No security issues (no stamped/approved outputs unless human-verified)

---

## Production Readiness Checklist

Before going live to real customers:

- [ ] All 8 certification flows complete with real payment
- [ ] Email delivery rate > 99% (Resend dashboard)
- [ ] No errors in production logs (Railway, Sentry)
- [ ] Webhook signature verification passing
- [ ] Database backups tested and working
- [ ] LLM provider quotas set and monitored
- [ ] Stripe live mode active (not test mode)
- [ ] SSL certificates valid (HTTPS only)
- [ ] Security audit complete (no secrets in logs/errors)
- [ ] Disaster recovery plan documented
- [ ] On-call runbook created
- [ ] Customer support templates prepared

---

## Monitoring & On-Call

### Set Up Alerting

```bash
# 1. Stripe webhook delivery
# - Dashboard → Developers → Webhooks
# - Monitor "Recent events" for failures
# - Alert if event fails > 5 times

# 2. Database
# - Supabase → Monitoring → Database
# - Alert if connections spike or query time > 5s
# - Alert if storage > 80% capacity

# 3. API service
# - Railway → Metrics
# - Alert if error rate > 1%
# - Alert if response time > 2s
# - Alert if service down

# 4. Email delivery
# - Resend dashboard → Emails
# - Alert if bounce rate > 2%
# - Alert if delivery rate < 95%

# 5. LLM costs
# - OpenAI dashboard → Usage
# - Alert if daily spending > $100
# - Review billing daily in first month
```

### On-Call Runbook

Create `docs/runbooks/production-incidents.md` with:

1. **Stripe webhook failures**
   - Check signature verification
   - Verify STRIPE_WEBHOOK_SECRET matches
   - Replay webhook from Stripe dashboard

2. **LLM API timeouts**
   - Check provider status page (openai.com, anthropic.com)
   - Verify API keys are valid
   - Check rate limits

3. **Database connection errors**
   - Check DATABASE_URL is valid
   - Verify Supabase instance is running
   - Check connection pool exhaustion

4. **Email not delivering**
   - Check Resend dashboard for bounces
   - Verify SPF/DKIM/DMARC records
   - Check sender reputation

---

## Cost Estimation (Monthly)

| Service | Staging | Production | Notes |
|---------|---------|-----------|-------|
| Supabase Postgres | Free | $100-300 | Scales with storage/compute |
| Redis Cloud | Free | $30-60 | 30 GB → 100 GB |
| Stripe | Fees | 2.9% + $0.30/tx | ~$1000/month at $50K revenue |
| OpenAI | ~$20 | $200-500 | ~50 design + estimate calls/day |
| Anthropic | ~$5 | $50-150 | Fallback to Claude ~2x/day |
| Resend | $20 | $20+ | ~1000 emails/month |
| S3/R2 | $5 | $20-50 | File storage + delivery |
| Railway | $20 | $150-300 | 2-3 services, scaling |
| Vercel | Free | $20-50 | Next.js hosting |
| **TOTAL** | **~$95/mo** | **~$600-1600/mo** | Scales with customer volume |

---

## Maintenance Schedule

- **Daily:** Check error logs, email delivery metrics
- **Weekly:** Review API rate limits, database size, backup status
- **Monthly:** Update dependencies, review security patches, cost audit
- **Quarterly:** Full load test, disaster recovery drill, security review

---

## Rollback Procedure

If a deployment fails:

```bash
# 1. Identify issue (check Railway logs)
# 2. Rollback to previous commit:
git revert HEAD  # Creates new commit that undoes changes
git push origin main

# 3. Railway auto-deploys previous version
# 4. Verify service is healthy:
curl https://api.kealee.com/healthz

# 5. Investigate root cause before re-deploying
```

---

Next: Inform your team of production status via Slack/email with link to [PRODUCT_AUTOMATION_CERTIFICATION.md](./PRODUCT_AUTOMATION_CERTIFICATION.md).
