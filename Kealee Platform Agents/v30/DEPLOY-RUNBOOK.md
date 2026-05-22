# Kealee v30 — deploy runbook (P0)

## 1. Database

```bash
cd packages/database
npx prisma migrate deploy
npx prisma generate
```

Migration: `prisma/migrations/20260522120000_add_v30_models/`

## 2. Environment

### API (`services/api` / Railway)

| Variable | Required | Notes |
|----------|----------|--------|
| `KEALEE_V30_ENABLED` | yes | `true` |
| `KEALEE_V30_PUBLIC_USER_ID` | yes | `User.id` for public `/get-concept` projects |
| `ANTHROPIC_API_KEY` | yes | Live bots |
| `KEALEE_V30_LLM_ENABLED` | optional | `false` = dry-run stubs |

### web-main (Vercel)

| Variable | Required |
|----------|----------|
| `NEXT_PUBLIC_KEALEE_V30_ENABLED` | yes (`true`) |
| `KEALEE_V30_ENABLED` | yes |
| `INTERNAL_API_URL` | yes (Railway API base URL) |

## 3. Stripe

- Webhook endpoint: `https://<web-main>/api/webhooks/stripe`
- Events: `checkout.session.completed` (and existing v20 events)
- Metadata: `public_intake_v30` flow uses `triggerV30GenerationForIntake`

## 4. Setup check + smoke

```bash
pnpm v30:setup-check
pnpm v30:smoke

# Or against staging
node scripts/v30-smoke.mjs --api https://api-staging.kealee.com --web https://kealee.com
```

Manual path: `/get-concept` → quote → Stripe test checkout → `/concept/success?v30=1` → `/workspace/:intakeId`

## DesignBot (single path)

- **v30 paid flow:** `executeV30DesignBot` in `@kealee/kealee-agent-stack` only.
- **Blocked for v30:** `/api/concept/generate` returns cached `v30ConceptOutput` or HTTP 202 while generating.
- **v20 flow:** unchanged — `concept/generate` for `public_intake` (non-v30).

## 5. Optional microservices (P2)

| Service | Port | Health |
|---------|------|--------|
| `services/os-intake` | 3016 | `GET /health` |
| `services/os-ai-orch` | 3017 | `GET /health` |

Main API already embeds `@kealee/os-intake` and `@kealee/os-ai-orch` packages; standalone services are for Railway split deploy.
