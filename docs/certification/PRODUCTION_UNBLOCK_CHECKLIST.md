# Production Certification Unblock Checklist

**Status:** Static verification complete (TypeScript, Prisma, contract tests all pass). Runtime verification blocked on 5 service configurations.

**Target:** Complete all 8 test flows in the certification matrix and mark production-ready.

**Last updated:** 2026-07-20  
**Commit:** 3606acde (autonomous runtime, revenue products, and agent provider routing)

---

## TL;DR — What's Blocking Production

Five services must be configured and tested before the platform can go live:

1. **Stripe (Test Mode)** — payment processing, test webhooks
2. **Postgres/Supabase** — runtime database + migrations
3. **OpenAI API** — primary LLM for design, estimate, zoning, permit automation
4. **Anthropic API** — fallback LLM for all v30 bots
5. **Resend Email** — transactional emails (payment confirmation, ready notifications)

Each must be in a test/staging environment with real (but sandboxed) credentials.

---

## Service Setup Checklist

### 1. Stripe Test Mode ⚠️ CRITICAL

**What it does:** Processes payments for revenue products, creates checkout sessions, sends webhook events  
**Blocking:** Server-authoritative checkout, Stripe webhook signature verification, transaction deduplication  
**Verification command:** `pnpm exec vitest run apps/web-main/lib/__tests__/revenue-products.test.ts`

#### Setup steps

1. **Get Stripe test credentials**
   ```bash
   # From https://dashboard.stripe.com/test/apikeys
   export STRIPE_SECRET_KEY="sk_test_..."  # Secret key (for server)
   export STRIPE_WEBHOOK_SECRET="whsec_..."  # Webhook signing secret
   export STRIPE_PUBLISHABLE_KEY="pk_test_..."  # Public key (for frontend)
   ```

2. **Create test Products and Prices**
   - Dashboard → Products → Create product for each of 8 revenue products (see matrix below)
   - Capture the Price IDs
   - Export them:
   ```bash
   export STRIPE_PRICE_PACKAGE_A="price_..."
   export STRIPE_PRICE_PACKAGE_B="price_..."
   export STRIPE_PRICE_PACKAGE_C="price_..."
   export STRIPE_PRICE_PACKAGE_D="price_..."
   export STRIPE_PRICE_PACKAGE_E="price_..."
   export STRIPE_PRICE_PACKAGE_F="price_..."
   export STRIPE_PRICE_PACKAGE_G="price_..."
   export STRIPE_PRICE_PACKAGE_H="price_..."
   ```

3. **Enable webhook delivery in test mode**
   - Dashboard → Webhooks → Add endpoint
   - Endpoint URL: `http://127.0.0.1:3101/api/webhooks/stripe` (local) or `https://<deployed-api>/api/webhooks/stripe`
   - Events to send:
     - `checkout.session.completed`
     - `charge.succeeded`
     - `charge.failed`
   - Capture the signing secret in `STRIPE_WEBHOOK_SECRET`

4. **Validation**
   ```bash
   # Start your dev environment
   cd apps/web-main
   pnpm run dev  # Starts on :3101

   # In another terminal, run the test suite
   pnpm exec vitest run lib/__tests__/revenue-products.test.ts

   # Expected output: 11/11 tests passed
   ```

---

### 2. Postgres/Supabase Database ⚠️ CRITICAL

**What it does:** Stores all persistent state (intakes, transactions, outputs, autonomous runs)  
**Blocking:** Autonomous goal/run creation, output synchronization, transaction deduplication  
**Verification command:** `pnpm --filter @kealee/database exec prisma validate --schema prisma/schema.prisma`

#### Setup steps

1. **Create a Supabase project or local Postgres instance**
   - **Option A (Cloud):** https://supabase.com → Create project → Copy connection string
   - **Option B (Local):** Docker Compose or native Postgres
   ```bash
   # Example local Postgres
   docker run --name kealee-test-db -e POSTGRES_PASSWORD=testpass \
     -p 5432:5432 postgres:15 -d
   ```

2. **Set DATABASE_URL**
   ```bash
   export DATABASE_URL="postgresql://user:password@localhost:5432/kealee"
   # Or from Supabase:
   # postgresql://postgres.[project-id]:[password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
   ```

3. **Apply autonomous-runtime migration**
   ```bash
   cd packages/database
   npx prisma migrate deploy  # Applies ALL pending migrations
   # Or targeted:
   npx prisma migrate resolve --applied 20260720210000_autonomous_runtime
   ```

4. **Validate schema**
   ```bash
   cd packages/database
   npx prisma validate --schema prisma/schema.prisma
   # Expected: ✓ Schema valid
   ```

5. **Generate Prisma client**
   ```bash
   cd packages/database
   npx prisma generate
   ```

6. **Verification**
   ```bash
   # Run a focused database test
   cd apps/web-main
   pnpm exec vitest run lib/__tests__/autonomous-runtime.test.ts

   # Expected: ✓ All tests passed (requires live DB)
   ```

---

### 3. OpenAI API (Primary LLM) ⚠️ CRITICAL

**What it does:** Primary LLM for design, estimate, zoning, permit automation (v30 bots)  
**Fallback to:** Anthropic Claude API (configured next)  
**Model:** `gpt-5.6-sol` (production) or `gpt-4-turbo` (testing if 5.6 unavailable)  
**Blocking:** v30 bot execution, provider routing, property intelligence  
**Verification command:** `npm run test-v30-routing` (once configured)

#### Setup steps

1. **Create OpenAI API key**
   - Visit https://platform.openai.com/account/api-keys
   - Create API key
   ```bash
   export OPENAI_API_KEY="sk-proj-..."
   export KEALEE_OPENAI_PRIMARY_MODEL="gpt-5.6-sol"  # Or gpt-4-turbo
   ```

2. **Add to .env.local (web-main)**
   ```bash
   # apps/web-main/.env.local
   OPENAI_API_KEY=sk-proj-...
   KEALEE_OPENAI_PRIMARY_MODEL=gpt-5.6-sol
   ```

3. **Verify model availability**
   ```bash
   # Quick Python check
   python3 -c "
   import openai
   openai.api_key = '$OPENAI_API_KEY'
   models = openai.Model.list()
   print([m.id for m in models.data if 'gpt-5' in m.id or 'gpt-4' in m.id])
   "
   ```

4. **Test bot execution**
   ```bash
   # This will hit OpenAI with a minimal request
   curl -X POST http://127.0.0.1:3101/api/agents/design \
     -H 'Content-Type: application/json' \
     -d '{"projectPath":"kitchen_remodel","sqft":250}'

   # Expected: HTTP 200, response from gpt-5.6-sol
   ```

---

### 4. Anthropic API (Fallback LLM) ⚠️ CRITICAL

**What it does:** Fallback LLM when OpenAI fails or is unavailable  
**Model:** `claude-sonnet-4-20250514` (or latest stable)  
**Blocking:** Bot execution resilience, design/estimate/zoning/permit fallback  
**Verification command:** See OpenAI section (auto-routes to Claude if OpenAI fails)

#### Setup steps

1. **Create Anthropic API key**
   - Visit https://console.anthropic.com/account/keys
   - Create new key
   ```bash
   export ANTHROPIC_API_KEY="sk-ant-..."
   ```

2. **Add to .env.local (web-main)**
   ```bash
   # apps/web-main/.env.local
   ANTHROPIC_API_KEY=sk-ant-...
   ```

3. **Test fallback behavior**
   ```bash
   # Disable OpenAI temporarily
   unset OPENAI_API_KEY

   # Call bot endpoint — should route to Claude
   curl -X POST http://127.0.0.1:3101/api/agents/design \
     -H 'Content-Type: application/json' \
     -d '{"projectPath":"kitchen_remodel","sqft":250}'

   # Expected: HTTP 200, response from claude-sonnet-4-20250514
   ```

---

### 5. Resend Email Service ⚠️ CRITICAL

**What it does:** Transactional emails (payment confirmation, project ready, notifications)  
**Blocking:** Email delivery, owner notification flow, production telemetry  
**Verification command:** `pnpm exec vitest run lib/__tests__/stripe-webhook-handler.test.ts`

#### Setup steps

1. **Create Resend account and API key**
   - Visit https://resend.com → Sign up → Create API key
   ```bash
   export RESEND_API_KEY="re_..."
   export RESEND_FROM_EMAIL="noreply@kealee.com"  # Must be verified domain
   ```

2. **Verify sender domain (production only)**
   - Resend dashboard → Add domain → Add DNS records → Verify
   - For testing, use Resend's default test domain or sandbox

3. **Add to .env.local**
   ```bash
   # apps/web-main/.env.local
   RESEND_API_KEY=re_...
   RESEND_FROM_EMAIL=noreply@kealee.com
   ```

4. **Test email delivery**
   ```bash
   # Run the webhook test which includes email verification
   pnpm exec vitest run lib/__tests__/stripe-webhook-handler.test.ts

   # Expected: 6/6 tests passed, including email hooks
   ```

---

## Runtime Test Matrix

Once all 5 services are configured, run through this certification matrix in Stripe **test mode**:

| Flow | Product(s) | Bots | DB | Email | Owner Portal |
|------|-----------|------|----|----|---|
| 1. Home Project Readiness Review | home-readiness | estimate, zoning | Create intake, run, outputs | Payment confirmation | Render concept + roadmap |
| 2. Project Launch Package | launch-full | design, estimate, zoning, permit | Create intake, run, outputs | Payment + ready | Render all outputs |
| 3. Contractor Estimate & Permit | contractor-ep | estimate, zoning, permit | Create intake, run, outputs | Payment + ready | Render roadmap |
| 4. Developer Feasibility Express | developer-feas | estimate, zoning, permit | Create intake, run, outputs | Payment + ready | Render all outputs |
| 5. Standalone Estimate | standalone-estimate | estimate | Create intake, run, outputs | Payment + ready | Render estimate |
| 6. Standalone Permit Roadmap | standalone-permit | zoning, permit | Create intake, run, outputs | Payment + ready | Render roadmap |
| 7. Estimate + Permit Bundle | bundle-ep | estimate, zoning, permit | Create intake, run, outputs | Payment + ready | Render all outputs |
| 8. Design + Estimate + Permit | bundle-full | design, estimate, zoning, permit | Create intake, run, outputs | Payment + ready | Render all outputs |

**For each flow, verify:**
- ✓ Signed webhook received and processed
- ✓ Duplicate webhook handled idempotently
- ✓ Transaction recorded (1 debit, no duplicates)
- ✓ All requested bots executed successfully
- ✓ Outputs merged into intake + homeowner report
- ✓ Payment confirmation email sent
- ✓ Ready-state email sent (when outputs complete)
- ✓ Owner portal renders with all outputs visible
- ✓ No output labeled as "professional approval" or "stamped" (only AI-generated designations)

---

## Environment File Template

Create `.env.local` in `apps/web-main/`:

```bash
# Core infrastructure
DATABASE_URL="postgresql://user:password@localhost:5432/kealee"
REDIS_URL="redis://localhost:6379"
NODE_ENV="development"
APP_ENV="development"

# Authentication
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGc..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGc..."
JWT_SECRET="your-jwt-secret"

# Payments
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_PRICE_PACKAGE_A="price_..."
STRIPE_PRICE_PACKAGE_B="price_..."
STRIPE_PRICE_PACKAGE_C="price_..."
STRIPE_PRICE_PACKAGE_D="price_..."
STRIPE_PRICE_PACKAGE_E="price_..."
STRIPE_PRICE_PACKAGE_F="price_..."
STRIPE_PRICE_PACKAGE_G="price_..."
STRIPE_PRICE_PACKAGE_H="price_..."

# LLMs
OPENAI_API_KEY="sk-proj-..."
KEALEE_OPENAI_PRIMARY_MODEL="gpt-5.6-sol"
ANTHROPIC_API_KEY="sk-ant-..."

# Email
RESEND_API_KEY="re_..."
RESEND_FROM_EMAIL="noreply@kealee.com"

# Feature flags
KEALEE_V30_ENABLED="true"
NEXT_PUBLIC_API_URL="http://127.0.0.1:3101"
NEXT_PUBLIC_APP_URL="http://127.0.0.1:3101"
```

---

## Validation Commands (Run These Sequentially)

```bash
# 1. TypeScript check
NODE_OPTIONS=--max-old-space-size=4096 \
pnpm --filter web-main exec tsc --noEmit --pretty false

# 2. Prisma schema validation
pnpm --filter @kealee/database exec prisma validate --schema prisma/schema.prisma

# 3. Revenue product tests (requires Stripe test key)
pnpm --filter web-main exec vitest run lib/__tests__/revenue-products.test.ts

# 4. Owner portal presentation tests (no DB required)
pnpm --filter web-main exec vitest run lib/__tests__/owner-portal-presentation.test.ts

# 5. Stripe webhook signature tests (no live webhooks required)
pnpm --filter web-main exec vitest run lib/__tests__/stripe-webhook-signature.test.ts

# 6. Agent stack build
pnpm --filter @kealee/kealee-agent-stack build

# 7. AI Orchestrator build
pnpm --filter @kealee/os-ai-orch build

# 8. Git cleanliness check
git diff --check
```

**Expected result:** All commands pass with no errors.

---

## Deployment Checklist

Once all tests pass:

1. **Create production Stripe account** — apply for live mode access
2. **Create production database** — Supabase or managed Postgres (not local)
3. **Rotate to production API keys**
   - OpenAI production key (separate from test)
   - Anthropic production key (separate from test)
   - Resend production domain (verified + warmup)
   - Stripe live keys + webhook secrets
4. **Update Railway/deployment environment variables** — per `docs/deployment/env-var-checklist.md`
5. **Run smoke tests in production** — one flow from the matrix (low-value test transaction)
6. **Monitor webhook delivery** — Stripe dashboard should show 200 responses
7. **Check email delivery** — Resend analytics should show 100% delivery
8. **Mark certification complete** — Update `PRODUCT_AUTOMATION_CERTIFICATION.md` with "Production ready" flag

---

## Support & Troubleshooting

### Stripe webhook not receiving events?
- Dashboard → Webhook Endpoint → Check "Recent events" tab
- Verify endpoint URL is publicly accessible (not localhost for production)
- Check `STRIPE_WEBHOOK_SECRET` matches dashboard value exactly

### Database migration fails?
- Ensure `DATABASE_URL` is set and Postgres is running
- Check `packages/database/prisma/migrations/` for pending migrations
- Run `npx prisma migrate status` to see what's pending

### OpenAI/Anthropic request times out?
- Verify API key is set and not expired
- Check internet connectivity
- Run minimal test: `curl https://api.openai.com/v1/models -H "Authorization: Bearer $OPENAI_API_KEY"`

### Resend emails not delivering?
- Check Resend dashboard for delivery status (not all email may go through in test mode)
- Verify `RESEND_FROM_EMAIL` is a verified domain
- Check test mode is enabled for staging

---

**Status:** Ready for infrastructure setup. Move to section C for guided setup.
