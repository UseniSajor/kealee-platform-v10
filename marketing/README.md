# Kealee marketing (repo)

Platform growth for **traffic → leads → paid concept / estimate / permit → build** — not a customer-facing product.

| Doc | Purpose |
|-----|---------|
| [STACK-RECOMMENDATION.md](./STACK-RECOMMENDATION.md) | **Start here** — tools & stack vs current repo, schema, v30 |
| [KEALEE-v30-MARKETING-PLAN-WITHOUT-GHL.md](./KEALEE-v30-MARKETING-PLAN-WITHOUT-GHL.md) | Long-form alternative architecture (Zoho/Klaviyo/Segment) — reference only |
| [email-templates/welcome.html](./email-templates/welcome.html) | HTML reference for Resend |

Implementation code lives in `apps/web-main/lib/marketing/`, `apps/command-center/`, and `packages/kealee-agent-stack/src/v30/`.

## Start a campaign

**Command Center:** Marketing → **Start campaign** button (orange bar at top). Options: dry run, regenerate week.

Requires on Command Center: `CRON_SECRET` (or `KEALEE_OPS_SECRET`) and `NEXT_PUBLIC_SITE_URL=https://kealee.com`.

```bash
# After deploy + RESEND_API_KEY + Supabase migration 20260523_marketing_campaigns.sql
curl -X POST https://kealee.com/api/marketing/campaign/start \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"generate":true,"send":true}'

# Local
node scripts/start-marketing-campaign.mjs
node scripts/start-marketing-campaign.mjs --dry-run
```

Generates 7 daily campaigns for the current week (concept → estimate → permit funnel) and sends **today’s** email to `public_intake_leads` with `status=new` via Resend.

## Phase 3 (implemented)

- UTM capture: `UtmCaptureRoot` in web-main layout → `sessionStorage` → intake APIs
- GA4: client `trackEvent` + server Measurement Protocol (`GA4_API_SECRET`)
- CC funnel dashboard: `/api/command-center/marketing` (all sources, UTM breakdown)

## Phase 1–2 (implemented)

- SQL: `packages/database/migrations/20260522_marketing_drip_queue.sql`
- `GHL_ENABLED=false` by default — see `apps/web-main/.env.example`
- Resend lifecycle: welcome, post-payment, drip 1–4, concept-ready → estimate upsell queue
