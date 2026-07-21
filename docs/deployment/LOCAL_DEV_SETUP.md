# Local Development Setup — Complete Guide

This guide walks you through setting up a complete local development environment for production certification testing.

**Target time:** 30-45 minutes  
**Prerequisites:** Node 20+, pnpm, Docker (for Postgres)  
**Result:** Full local environment with Stripe test mode, Postgres, LLMs, and email ready to run all 8 certification flows

---

## Part 1: Database Setup (10 minutes)

### Option A: Docker Postgres (Recommended for testing)

```bash
# 1. Start Postgres container
docker run --name kealee-dev-db \
  -e POSTGRES_DB=kealee \
  -e POSTGRES_USER=kealee_dev \
  -e POSTGRES_PASSWORD=devpassword123 \
  -p 5432:5432 \
  -d postgres:15-alpine

# 2. Verify it's running
docker ps | grep kealee-dev-db

# 3. Save connection string for later
echo "DATABASE_URL=postgresql://kealee_dev:devpassword123@localhost:5432/kealee" >> ~/.env-kealee-dev
```

### Option B: Supabase Cloud (Skip docker, use managed DB)

```bash
# 1. Create Supabase project
# - Visit https://supabase.com/dashboard/projects
# - Create new project
# - Select region (us-east-1 recommended)
# - Wait for DB to be ready

# 2. Copy connection string
# - Project settings → Database → URI
# - Copy the full connection string
echo "DATABASE_URL=postgresql://postgres.[ID]:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres" >> ~/.env-kealee-dev
```

### Apply migrations

```bash
cd packages/database

# 1. Set database URL in this shell session
export $(grep DATABASE_URL ~/.env-kealee-dev)

# 2. Run migrations (applies all pending, including autonomous-runtime)
npx prisma migrate deploy

# 3. Generate Prisma client
npx prisma generate

# 4. Verify schema
npx prisma validate --schema prisma/schema.prisma
```

**Expected output:**
```
✓ Database schema created
✓ 15 migrations applied
✓ Prisma client generated
✓ Schema valid
```

---

## Part 2: Stripe Test Account Setup (10 minutes)

### Create Stripe Test Account

```bash
# 1. Go to https://dashboard.stripe.com/register
# - Sign up with your email
# - Verify email
# - Set up test mode (should be default)

# 2. Get test API keys
# - Dashboard → Developers → API keys
# - Copy Publishable key (pk_test_...)
# - Copy Secret key (sk_test_...)
# - Save to ~/.env-kealee-dev
echo "
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
" >> ~/.env-kealee-dev
```

### Create Revenue Products

```bash
# 1. Dashboard → Products → Create product

# Product A: Home Project Readiness Review
# Price: $299
# ID: STRIPE_PRICE_PACKAGE_A

# Product B: Project Launch Package  
# Price: $899
# ID: STRIPE_PRICE_PACKAGE_B

# Product C: Contractor Estimate & Permit
# Price: $699
# ID: STRIPE_PRICE_PACKAGE_C

# Product D: Developer Feasibility Express
# Price: $599
# ID: STRIPE_PRICE_PACKAGE_D

# Product E: Standalone Estimate
# Price: $149
# ID: STRIPE_PRICE_PACKAGE_E

# Product F: Standalone Permit Roadmap
# Price: $199
# ID: STRIPE_PRICE_PACKAGE_F

# Product G: Estimate + Permit Bundle
# Price: $299
# ID: STRIPE_PRICE_PACKAGE_G

# Product H: Design + Estimate + Permit
# Price: $1199
# ID: STRIPE_PRICE_PACKAGE_H

# 2. For each product:
# - Stripe dashboard → Create product
# - Add price in USD
# - Copy price ID (price_xxxxx)
# - Save to ~/.env-kealee-dev

echo "
STRIPE_PRICE_PACKAGE_A=price_YOUR_A
STRIPE_PRICE_PACKAGE_B=price_YOUR_B
STRIPE_PRICE_PACKAGE_C=price_YOUR_C
STRIPE_PRICE_PACKAGE_D=price_YOUR_D
STRIPE_PRICE_PACKAGE_E=price_YOUR_E
STRIPE_PRICE_PACKAGE_F=price_YOUR_F
STRIPE_PRICE_PACKAGE_G=price_YOUR_G
STRIPE_PRICE_PACKAGE_H=price_YOUR_H
" >> ~/.env-kealee-dev
```

### Set Up Webhook (for local testing)

```bash
# 1. Install Stripe CLI
# macOS:
brew install stripe/stripe-cli/stripe

# Windows (in WSL or Git Bash):
wget -q https://dl.stripe.com/stripe_cli_linux_x86_64.tar.gz
tar -xvzf stripe_cli_linux_x86_64.tar.gz
sudo mv stripe /usr/local/bin/

# Linux:
curl https://raw.githubusercontent.com/stripe/stripe-cli/master/install.sh | bash

# 2. Login to Stripe CLI
stripe login

# 3. Forward webhooks to local machine
# Keep this running in a terminal while testing:
stripe listen --forward-to localhost:3101/api/webhooks/stripe

# 4. Copy the webhook signing secret from output:
# > Ready! Your webhook signing secret is whsec_test_...
echo "STRIPE_WEBHOOK_SECRET=whsec_test_YOUR_SECRET_HERE" >> ~/.env-kealee-dev
```

**Expected output:**
```
✓ Webhook signing secret saved
✓ Ready to accept webhook events
✓ Forwarding to localhost:3101/api/webhooks/stripe
```

---

## Part 3: LLM API Keys (5 minutes)

### OpenAI

```bash
# 1. Visit https://platform.openai.com/account/api-keys
# 2. Create new secret key
# 3. Save to ~/.env-kealee-dev
echo "
OPENAI_API_KEY=sk-proj-YOUR_KEY_HERE
KEALEE_OPENAI_PRIMARY_MODEL=gpt-5.6-sol
" >> ~/.env-kealee-dev

# 4. Verify key works
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY" | grep -q gpt-5.6-sol && echo "✓ OpenAI key valid"
```

### Anthropic

```bash
# 1. Visit https://console.anthropic.com/account/keys
# 2. Create new API key
# 3. Save to ~/.env-kealee-dev
echo "ANTHROPIC_API_KEY=sk-ant-YOUR_KEY_HERE" >> ~/.env-kealee-dev

# 4. Verify key works (optional)
curl https://api.anthropic.com/v1/models \
  -H "x-api-key: $ANTHROPIC_API_KEY" | grep -q claude && echo "✓ Anthropic key valid"
```

---

## Part 4: Email Service (Resend) — (3 minutes)

### Set up Resend

```bash
# 1. Visit https://resend.com/signup
# 2. Create account and verify email
# 3. Dashboard → API Keys → Create API key
# 4. Save to ~/.env-kealee-dev
echo "
RESEND_API_KEY=re_YOUR_KEY_HERE
RESEND_FROM_EMAIL=test@resend.dev
" >> ~/.env-kealee-dev

# Note: use Resend's default test domain (test@resend.dev) for testing
# Production setup requires verifying your own domain
```

---

## Part 5: Build Local .env File (2 minutes)

### Copy environment to apps/web-main

```bash
# 1. Create .env.local in web-main
touch apps/web-main/.env.local

# 2. Copy all variables
cat ~/.env-kealee-dev >> apps/web-main/.env.local

# 3. Add next-specific variables
echo "
# Next.js frontend
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:3101
NEXT_PUBLIC_SUPABASE_ANON_KEY=test-key
NEXT_PUBLIC_API_URL=http://127.0.0.1:3101
NEXT_PUBLIC_APP_URL=http://127.0.0.1:3101
KEALEE_V30_ENABLED=true
NODE_ENV=development
APP_ENV=development
" >> apps/web-main/.env.local

# 4. Verify file
head -20 apps/web-main/.env.local
```

---

## Part 6: Start Development Environment (5 minutes)

### Terminal 1: Start Stripe webhook listener

```bash
# Keep this running in a dedicated terminal
stripe listen --forward-to localhost:3101/api/webhooks/stripe

# Output should show:
# > Ready! Your webhook signing secret is whsec_test_...
```

### Terminal 2: Start Next.js dev server

```bash
cd apps/web-main
pnpm install  # If not already done
pnpm run dev

# Output should show:
# > Local:        http://127.0.0.1:3101
# ✓ Ready in 5.2s
```

### Terminal 3: Run tests to verify setup

```bash
cd apps/web-main

# 1. Check TypeScript
NODE_OPTIONS=--max-old-space-size=4096 \
pnpm exec tsc --noEmit --pretty false

# 2. Run revenue product tests
pnpm exec vitest run lib/__tests__/revenue-products.test.ts

# 3. Run owner portal tests
pnpm exec vitest run lib/__tests__/owner-portal-presentation.test.ts

# 4. Run Stripe webhook tests
pnpm exec vitest run lib/__tests__/stripe-webhook-handler.test.ts
```

**Expected output:**
```
✓ TypeScript compilation successful
✓ revenue-products.test.ts → 11/11 passed
✓ owner-portal-presentation.test.ts → 10/10 passed
✓ stripe-webhook-handler.test.ts → 6/6 passed
```

---

## Part 7: Run Certification Matrix (10-15 minutes)

Once development environment is running, test each of the 8 flows:

### Flow 1: Home Project Readiness Review

```bash
# 1. Browser → http://127.0.0.1:3101/intake/whole_home_concept
# 2. Fill out intake form (property details, size, preferences)
# 3. Select "Home Project Readiness Review" product ($299)
# 4. Proceed to checkout
# 5. In Stripe test mode, use card: 4242 4242 4242 4242
# 6. Complete payment

# Expected:
# ✓ Payment successful
# ✓ Stripe webhook received and processed
# ✓ AutonomousRun created with estimate + zoning bots
# ✓ Outputs merged into homeowner report
# ✓ Email sent to homeowner
# ✓ Portal renders with results
```

### Flow 2-8: Repeat for each product

Repeat the above steps for each product in `docs/certification/PRODUCTION_UNBLOCK_CHECKLIST.md` matrix.

---

## Verification Checklist

- [ ] Docker Postgres running (`docker ps | grep kealee-dev-db`)
- [ ] Migrations applied (`npx prisma migrate status` shows all applied)
- [ ] Stripe test mode configured (can access dashboard)
- [ ] 8 revenue products created with price IDs
- [ ] Stripe webhook listener running locally
- [ ] OpenAI key valid and tested
- [ ] Anthropic key valid and tested
- [ ] Resend key valid and tested
- [ ] `.env.local` created with all variables
- [ ] Next.js dev server running on :3101
- [ ] TypeScript check passes
- [ ] All 11 revenue product tests pass
- [ ] All 10 owner portal tests pass
- [ ] At least 1 end-to-end flow completed successfully

---

## Troubleshooting

### Database connection fails
```bash
# Check if Postgres is running
docker ps | grep kealee-dev-db

# If not, restart
docker start kealee-dev-db

# Check connection
psql $DATABASE_URL -c "SELECT 1"
```

### Stripe webhook not receiving
```bash
# 1. Check Stripe CLI is still running
# 2. Check endpoint URL in dashboard matches localhost:3101
# 3. Test manually:
curl -X POST http://127.0.0.1:3101/api/webhooks/stripe \
  -H 'Content-Type: application/json' \
  -H "Stripe-Signature: t=$(date +%s),v1=test" \
  -d '{"type":"checkout.session.completed"}'

# Should receive 200 response
```

### LLM calls timing out
```bash
# Check API keys
echo $OPENAI_API_KEY
echo $ANTHROPIC_API_KEY

# Test connectivity
curl https://api.openai.com/v1/models -H "Authorization: Bearer $OPENAI_API_KEY"

# Check firewall/proxy settings if behind corporate network
```

### Tests failing with "DATABASE_URL not set"
```bash
# Ensure DATABASE_URL is exported in shell before running tests
export $(grep DATABASE_URL ~/.env-kealee-dev)

# Or set it permanently in shell rc file (~/.bashrc, ~/.zshrc)
echo "export $(grep DATABASE_URL ~/.env-kealee-dev)" >> ~/.bashrc
```

---

## Next Steps

Once all verification checks pass:

1. **Run all 8 certification flows** — see [PRODUCTION_UNBLOCK_CHECKLIST.md](./PRODUCTION_UNBLOCK_CHECKLIST.md#runtime-test-matrix)
2. **Create staging environment** — use same checklist with cloud services (Supabase, managed Stripe, etc.)
3. **Update certification doc** — mark flows as complete in [PRODUCT_AUTOMATION_CERTIFICATION.md](./PRODUCT_AUTOMATION_CERTIFICATION.md)
4. **Prepare production** — repeat with production Stripe account and live API keys

---

## Quick Start (TL;DR)

```bash
# 1. Database
docker run --name kealee-dev-db -e POSTGRES_DB=kealee -e POSTGRES_USER=kealee_dev \
  -e POSTGRES_PASSWORD=devpassword123 -p 5432:5432 -d postgres:15-alpine

export DATABASE_URL="postgresql://kealee_dev:devpassword123@localhost:5432/kealee"

cd packages/database
npx prisma migrate deploy && npx prisma generate

# 2. API Keys (from dashboards)
export OPENAI_API_KEY="sk-proj-..."
export ANTHROPIC_API_KEY="sk-ant-..."
export STRIPE_SECRET_KEY="sk_test_..."
export STRIPE_WEBHOOK_SECRET="whsec_test_..."
export RESEND_API_KEY="re_..."

# 3. Create .env.local
cat > apps/web-main/.env.local << EOF
DATABASE_URL=$DATABASE_URL
OPENAI_API_KEY=$OPENAI_API_KEY
ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY
STRIPE_SECRET_KEY=$STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET=$STRIPE_WEBHOOK_SECRET
RESEND_API_KEY=$RESEND_API_KEY
# ... [add all other vars from Part 5]
EOF

# 4. Start services
stripe listen --forward-to localhost:3101/api/webhooks/stripe &
cd apps/web-main && pnpm run dev

# 5. Test
pnpm exec vitest run lib/__tests__/revenue-products.test.ts
```

That's it! You're ready to run certification flows.
