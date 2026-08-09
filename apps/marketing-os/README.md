# Kealee Marketing OS

`apps/marketing-os` is the national marketing intelligence and automation domain inside the Kealee monorepo. It does not replace `web-main`, Command Center, Supabase CRM, Resend, Stripe, the existing media generators, or the workflow/worker services.

## Ownership

- **Marketing OS:** national market data, SEO/content/media/social orchestration, AI-search entities, citations, agent runs, job ledger, and growth dashboard.
- **web-main:** public Kealee product and conversion experience.
- **Command Center:** cross-platform operational administration.
- **Supabase:** canonical records, RLS, content versions, job state, performance, and attribution.
- **BullMQ/Redis:** durable Marketing OS execution.
- **Trigger.dev / n8n:** external schedules and workflow entrypoints; both enqueue the same BullMQ jobs.
- **Existing lifecycle:** leads continue through `public_intake_leads`, Resend, Stripe, and Kealee portals.

## Production setup

1. Apply `packages/database/migrations/20260609_marketing_os.sql`.
2. Configure `apps/marketing-os/.env.local` from `.env.example`.
3. Run the dashboard: `pnpm --filter @kealee/marketing-os dev`.
4. Run the worker separately: `pnpm --filter @kealee/marketing-os worker`.
5. Configure Trigger.dev, Vercel Cron, or Railway Cron to call:
   - `POST /api/cron/market.ingest`
   - `POST /api/cron/analytics.rollup`
   - `POST /api/cron/search.monitor`
   with `Authorization: Bearer $MARKETING_OS_CRON_SECRET`.
6. Configure n8n to sign the exact JSON body with HMAC SHA-256 using `MARKETING_OS_N8N_WEBHOOK_SECRET` and send the hex digest as `x-kealee-signature`.

## Source ingestion

Create sources using `POST /api/sources`. Supported production adapters:

- `json_api`
- `csv_http`
- `arcgis_featureserver`

Each source declares an allowlisted destination table, records path, field mapping, static fields, and unique key. Raw fetches are content-hashed in `marketing_os_source_documents`; normalized rows are upserted and every run is audited.

No geography, market, content, performance, or social records are seeded as demo data. Agent and workflow rows in the migration are system configuration.

## Publishing safeguards

- Public guide routes render only `published` content and the current immutable version.
- Social and content publication defaults to approval-required or risk-based.
- Provider calls fail closed when credentials are missing.
- Customer purchase/rendering data remains outside Marketing OS media tables.
- All factual content is designed to carry source citations and confidence.
