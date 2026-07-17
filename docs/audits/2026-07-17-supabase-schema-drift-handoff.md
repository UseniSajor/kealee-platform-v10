# Session Handoff — Supabase schema drift + pricing bug — 2026-07-17

**Read this first if you're a new Claude Code session picking up this work.**
Previous session hit a hard wall: needed direct Postgres access to Supabase to
fix a live pricing/data-loss bug, had none, and the Supabase MCP server that
was set up to solve that is stuck pending an approval step that only surfaces
on a fresh `claude` session startup — which is why this handoff exists.

## Step 0 — unblock the MCP connection (do this first)

```
claude mcp list
```

If `supabase` shows `⏸ Pending approval (run 'claude' to approve)`, you (the
new session) should have already been prompted to approve it on startup —
confirm it now shows `✔ Connected`. If tools still aren't available, search
for them (`supabase` keyword) before doing anything else below. Everything
past this point assumes the Supabase MCP tools are live.

## The bug that started this (confirmed, root cause found, NOT yet fixed)

Customer selected **Whole Home Concept, Premium+ (tier 3)** — correct price
**$1,699**. Stripe checkout charged **$595** instead (the flat/no-tier
fallback price for that product) with no discount applied.

**Root cause:** `POST /api/intake` (`apps/web-main/app/api/intake/route.ts`)
fails to insert into `public_intake_leads` with:

```
null value in column "id" of relation "public_intake_leads" violates not-null constraint
```

The route has a silent fail-open fallback (lines ~84–90) that returns a
**fake `randomUUID()`** with `fallback: true` when the insert fails, so
checkout "succeeds" from the customer's point of view. But since no real row
exists for that fake ID:
- `/api/intake/checkout` can't look up the selected tier → falls back to flat
  pricing (exactly the $595 observed).
- The Stripe webhook afterward can't update a row that doesn't exist → the
  paid order is **never recorded**. No concept generation, no deliverable
  email. Customer is charged and gets nothing on the backend.

This is **live and active** — every tiered purchase through this path right
now is likely mispriced and/or silently lost.

## Confirmed database state (via PostgREST OpenAPI introspection, since no
direct Postgres access existed yet — `GET {SUPABASE_URL}/rest/v1/` with the
service-role key, checking each table's `properties.id.default`)

`public_intake_leads.id` has **no** `DEFAULT gen_random_uuid()`, even though
the original migration defines it correctly:
`packages/database/supabase/migrations/20260506_public_intake_leads.sql` line 8:
`id UUID PRIMARY KEY DEFAULT gen_random_uuid()`.

Checked all tables referenced via `DEFAULT gen_random_uuid()` /
`DEFAULT uuid_generate_v4()` across the 14 files in
`packages/database/supabase/migrations/*.sql`. Of ~50 table names found:

- **Only 7 actually exist** in the live `public` schema. The other ~44 return
  PostgREST `PGRST205 Could not find the table` (with "did you mean" hints
  pointing at differently-named tables that DO exist) — meaning those
  migrations were **never applied**, a separate/bigger issue from the missing
  default.
- Of the 7 that exist, **4 have the same missing-default bug**:
  `public_intake_leads`, `agent_sessions`, `bot_prompts`, `keabot_events`.
- 3 are fine (default present): `marketing_drip_queue`,
  `parcel_outreach_queue`, `parcel_outreach_targets`.

## Immediate fix — run via the Supabase MCP tools now that they're available

```sql
ALTER TABLE public_intake_leads ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE agent_sessions       ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE bot_prompts          ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE keabot_events        ALTER COLUMN id SET DEFAULT gen_random_uuid();
```

Additive only — restores a missing default, touches no existing data. Low risk.

**Before running:** check https://status.supabase.com and/or Supabase's own
in-dashboard incident banner ("We are investigating a technical issue") the
user saw today — worth correlating timing in case this is an active platform
incident rather than a one-off drift, which would change the fix.

## After the immediate fix — verify it actually worked

```bash
curl -sS -X POST https://www.kealee.com/api/intake \
  -H "Content-Type: application/json" \
  -d '{
    "projectPath": "whole_home_concept",
    "clientName": "Debug Test",
    "contactEmail": "tim.chamberlain24@gmail.com",
    "contactPhone": null,
    "projectAddress": "123 Test St",
    "formData": { "tier": 3, "description": "debug pricing test" }
  }'
```

Should return a real `intakeId` **without** `"fallback": true`. Then confirm
`/api/intake/checkout` resolves $1,699 for that intake+tier (read-only check
of the resolved price — do not actually complete a Stripe payment; the
existing internal-test $5 promo code `PREMIUMPLUS5`, allowlisted to
`tim.chamberlain24@gmail.com`, can be used if an end-to-end paid test is
wanted).

**Cleanup:** delete the test intake row created during the original
investigation — `intakeId 93bb3d72-bd72-4d40-bd07-7c1d1096430a`, was created
via the same curl pattern above before the fix existed, so it's also a fake
`fallback:true` row with no real data behind it (may not even exist as a row
at all, given the bug — check first).

## Bigger, not-yet-scoped follow-up work

1. **Reconcile the 14 SQL migration files against the live DB.** Don't
   blindly create all ~44 missing tables — check what application code
   actually reads/writes first (some may be for unused/future features,
   e.g. most of `marketing_os_*` — ~30 tables — looked unreferenced in a
   quick pass). Ask the user for direction before mass-creating tables.

2. **There's a second, separate schema layer:** `packages/database/prisma/schema.prisma`
   — **16,421 lines, 414 models**, camelCase naming (`InspectionAssignment`,
   `TaxForm`, etc. — visible in Supabase's Schema Visualizer, confirmed live
   in the `public` schema alongside the snake_case SQL-migration tables).
   Do NOT check this 414-model schema by hand — use Prisma's own
   introspection (`prisma db pull` / `prisma migrate status`) to diff it
   against the live DB in one pass.

   **Important open question, not yet resolved:** `DATABASE_URL` on both
   `web-main` and `kealee-platform-v10` Railway services points to Railway's
   own bundled Postgres (`postgres.railway...`), **not** Supabase. Whether
   Prisma is *supposed* to target Supabase's Postgres (matching what the
   Schema Visualizer showed) or intentionally lives on a separate Railway
   Postgres instance was never confirmed — verify directly rather than
   assume either way before doing any Prisma-side reconciliation.

3. **7 Supabase Storage buckets referenced in code, existence unverified:**
   `designs`, `documents`, `kealee-bim-models`, `organic`, `permits`,
   `receipts`, `site-photos`. No `supabase/config.toml` exists anywhere in
   the repo, so nothing declares these centrally — they're only referenced
   ad-hoc in application code (`bucket: '...'` string literals).

## Credentials / access already set up this session

- **Railway API token** (live): `cef3b213-12c0-44ff-8a95-fb34fd1cf9a8` — used
  throughout via `export RAILWAY_TOKEN=...` before each `railway` CLI call.
  Treat as sensitive — don't echo it in output.
- **Supabase**: URL `https://rkreqfpkxavqpsqexbfs.supabase.co`. Service-role
  key retrievable via `railway variables --service web-main --kv` (do not
  print it — pipe straight into an env var, matching the pattern used all
  session, e.g. `.supabase_creds` scratch file approach).
- **Supabase MCP server**: registered project-scoped in `.mcp.json`
  (`claude mcp add --scope project --transport http supabase
  "https://mcp.supabase.com/mcp?project_ref=rkreqfpkxavqpsqexbfs"`) — this is
  the way forward for direct DB access now, prefer it over raw psql/service-role
  workarounds.
- Supabase agent skills installed: `.agents/skills/supabase/` and
  `.agents/skills/supabase-postgres-best-practices/` (via `npx skills add
  supabase/agent-skills`) — read these before writing any SQL.

## Other work finished this session (context only, not blocking)

- Premium+ (tier 3) Design Concept CAD/DXF deliverable was completely
  missing — fixed end-to-end (generation, download routes, admin visibility,
  portal UI). Committed & deployed.
- Fixed 9 raw-error/dead-end UX spots across Design Concept / Estimation /
  Permits checkout flows. Committed & deployed.
- Fixed 12 crashed marketing-cron Railway services — root cause was a stale
  `@kealee/auth` package build (missing `ops-api-auth` export) plus
  `@kealee/intelligence` never being declared as a `web-main` dependency.
  Committed & deployed; crons now show `Completed`, not `Crashed`.
- Fixed `owner.kealee.com` DNS (missing CNAME) — now live.
- Built `PREMIUMPLUS5`, a $5 internal-test checkout override for Design
  Concept (all tiers) + Estimation + Permits, gated to
  `tim.chamberlain24@gmail.com`, capped at 5 uses (tracked via completed
  Stripe sessions, not a DB table). Removed Stripe's native duplicate promo
  field (wasn't backed by a real Stripe Promotion Code, always showed
  "invalid").
- Rotated the platform Stripe secret key (user-provided); set on `web-main`
  and `kealee-platform-v10`, both restarted successfully.
- Generated a 30s AI floorplan walkthrough video (Flux + Kling via Replicate)
  for "20 E Balmoral" (HousePlans.com Plan 892-23) — delivered.
- Started a **continuous 2-minute** (24-clip, last-frame-chained) version of
  the same walkthrough — 8/24 clips done, then hit a Replicate **402
  Insufficient Credit** error. Delivered the 40s partial result. Script is
  fully resumable (`apps/web-main/scripts/generate-balmoral-walkthrough-continuous.ts`)
  — once Replicate credit is topped up, re-running picks up exactly at
  segment 9, no wasted cost. Not yet resumed as of this handoff.
- Flagged that this Railway project rebuilds **every** service on any push to
  `main` (not scoped per-service) — recommended the user set "Watch Paths"
  per service in Railway's dashboard (not exposed via CLI). Not yet done.
