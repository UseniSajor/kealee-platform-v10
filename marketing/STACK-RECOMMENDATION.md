# Kealee marketing stack recommendation (repo + schema + v30)

**Decision:** Run marketing **without GoHighLevel**. Use what is already wired in this monorepo first; add external CRM/email CDPs only when volume forces it.

**MarketingBot role:** Platform growth (traffic, leads, conversions) — **not** a homeowner “marketing kit” and **not** a post-payment v30 deliverable.

---

## 1. What you already have (use this)

| Layer | Tool / module | Repo location | Role |
|-------|----------------|---------------|------|
| **Site & checkout** | Next.js `web-main` (Vercel) | `apps/web-main/` | Funnels: `/concept`, `/estimate`, `/permits`, Stripe checkout |
| **Lead store** | Supabase `public_intake_leads` | `packages/database/supabase/migrations/`, Prisma `PublicIntakeLead` | Single lead + paid-intake record; `form_data` JSON for v30 + concept |
| **Lead scoring** | In-app scorer + cron | `apps/web-main/lib/marketing/lead-scorer.ts`, `/api/cron/lead-scoring` | `leadScore`, `leadTier`, `leadRoute` on intake rows |
| **Email nurture** | **Resend** + drip queue | `/api/leads/marketing`, `/api/cron/marketing-drip` | Welcome + Day 1/3/7 drips (`marketing_drip_queue`) |
| **Payments** | **Stripe** (live) | Webhooks `apps/web-main/app/api/webhooks/stripe/` | `paid` → triggers `v30-trigger` (DesignBot parallel run) |
| **Campaign config** | Marketing engine | `apps/web-main/lib/marketing/marketing-engine.ts` | Product/persona campaigns; cron `send-daily-campaigns` |
| **Ads (partial)** | Meta + Google | `lib/marketing/meta-ads.ts`, `google-ads.ts`, lead webhooks | Paid traffic → lead APIs |
| **Ops planning** | **MarketingBot** (API) | `services/api/.../marketing.bot.ts`, CC `/marketing` | Playbooks, CTAs, lead-capture ideas |
| **Ops commands** | Command registry | `apps/command-center/lib/marketing-commands.ts` | Pipelines: content → lead → full-funnel |
| **Alerts** | Twilio + Slack | `lib/marketing/twilio-client.ts`, `slack-client.ts` | Hot leads to humans |
| **Pricing** | `@kealee/core-rules` | `packages/core-rules/src/pricing.ts` | Never hardcode prices in marketing copy |

### Prisma / Supabase fields to lean on

```
public_intake_leads
├── contact_email, project_path, source, status
├── lead_score, lead_tier, lead_route     ← scoring + routing
├── stripe_session_id, paid_at          ← conversion events
├── metadata (JSON)                       ← UTM, channel, bot source
└── form_data (JSON)                      ← tier, v30ProjectId, conceptOutput, v30Quote

marketing_campaigns / marketing_leads     ← campaign microsite (apps/marketing)
marketing_drip_queue                      ← Resend sequences (SQL in CC route comments)
```

---

## 2. v30 alignment (customer vs marketing)

| Bot | When | Marketing relevance |
|-----|------|-------------------|
| **IntakeBot** | Pre-payment | Dynamic quote; sets tier/features — drives **what** they buy |
| **DesignBot … ProjectBot** | Post-payment (parallel) | **Product delivery** after Stripe — not marketing |
| **MarketingBot** | **Ops only** (`V30_OPS_BOT_TYPES`) | Campaign plans via CC/API — **do not** run on every paid intake |
| **SalesBot** | Post-payment | Objections + upsell copy — pairs with estimate/permit CTAs |

**Recommended funnel after concept payment:**

1. Portal deliverables + workspace (`/workspace/[intakeId]`) — design, estimate preview, permits tab  
2. Owner portal **Estimate & permits** (`/services`) — links to web-main estimate/permit intakes  
3. Resend sequences triggered by **status** changes (not GHL workflows)  
4. Stripe for each upsell SKU (prices from `core-rules`)

---

## 3. Recommended stack (no GHL) — by priority

### Tier A — Default (already in repo; finish wiring)

| Tool | Why | Action |
|------|-----|--------|
| **Supabase** | CRM-of-record for leads/intakes; v30 state in `form_data` | Promote `marketing_drip_queue` to checked-in migration; index `source`, `status`, `lead_tier` |
| **Resend** | Transactional + drip; already used | Keep welcome + 3-step nurture; add post-`paid` + post-`concept_ready` templates |
| **Stripe** | Source of truth for conversion | Webhook → update intake + fire `triggerV30GenerationForIntake` + optional Resend “receipt + next steps” |
| **web-main crons** | No third-party automation bill | `marketing-drip`, `lead-scoring`, `sequences`, `send-daily-campaigns` on Vercel cron |
| **Command Center** | Human runs MarketingBot | `/marketing` + `POST /api/marketing/commands` |
| **API MarketingBot** | Same playbook shape as v30 prompt | `POST /bots/marketing-bot/execute` |

**Internal handoff instead of GHL tags:**

- `metadata.tags: string[]` on `public_intake_leads`  
- `form_data.funnelStage: 'lead' | 'mql' | 'paid_concept' | 'estimate_interest' | 'permit_interest'`  
- Resend: one audience or template variables per stage (no Klaviyo required at start)

### Tier B — Light add-ons (good fit, minimal new vendors)

| Tool | Why | When to add |
|------|-----|-------------|
| **Google Analytics 4** | Traffic + UTM | Already referenced; standardize events: `lead_submitted`, `checkout_started`, `purchase` |
| **Meta Conversions API** | Already have `google-conversion` pattern | Mirror for Meta lead/purchase events |
| **Calendly** | `lib/marketing/calendly-client.ts` exists | SQL/demo booking for high `lead_score` |
| **HubSpot free** | Only if sales wants a UI | Sync via webhook from API — optional |

### Tier C — Defer (from `KEALEE-v30-MARKETING-PLAN-WITHOUT-GHL.md`)

| Tool | Why defer |
|------|-----------|
| **GoHighLevel** | Replaced by Supabase + Resend + in-app scoring |
| **Klaviyo** | Resend + drip queue covers nurture until ~10k+ subscribers / heavy segmentation |
| **Segment CDP** | `form_data` + metadata sufficient until multi-app identity pain |
| **Zapier** | Use Stripe webhooks + BullMQ + crons instead of 14 Zaps |
| **Zoho full CRM** | API webhooks exist (`services/api/.../zoho/`) but only worth it if sales lives in Zoho daily |

---

## 4. What to remove or gate

| Item | Recommendation |
|------|----------------|
| **GHL** (`GHL_API_KEY`, `ghl-sync.service`) | **Disable by default**; set `GHL_ENABLED=false`. Keep code for legacy accounts only. |
| **v30 MarketingBot on paid intake** | Keep out of `V30_PARALLEL_BOT_TYPES` (already done) |
| **Customer “marketing kit” UI** | Removed from portal/workspace (already done) |
| **Duplicate lead tables** | Prefer `public_intake_leads` as canonical; use `marketing_leads` only for campaign microsite |

---

## 5. MarketingBot output shape (v30, no GHL)

Ops handoff should reference **in-repo systems**:

```json
{
  "opsHandoff": {
    "leadApi": "POST /api/leads/marketing",
    "drip": "marketing_drip_queue + /api/cron/marketing-drip",
    "conversionWebhook": "Stripe → apps/web-main/app/api/webhooks/stripe",
    "v30Generate": "POST /v30/public-intake/generate after paid",
    "portalUpsell": "/services (estimate, permits)",
    "tags": ["funnel-concept", "dmv-homeowner"],
    "recommendedAutomations": ["welcome_drip", "post_paid_v30", "estimate_upsell_7d"],
    "handoffToLeadBot": true
  }
}
```

No `ghlTags` / `ghl_drip` in new plans.

---

## 6. Implementation roadmap (4 weeks)

### Week 1 — Data & email (no new vendors)

- [x] Add SQL migration file for `marketing_drip_queue` under `packages/database/migrations/`  
- [x] Document env: `RESEND_API_KEY`, `MARKETING_BOT_API_KEY`, `CRON_SECRET`  
- [x] Post-payment Resend: “Your concept is generating” + concept-ready email (existing)  
- [x] Set `GHL_ENABLED=false` by default; hot leads → Slack/Twilio  

### Week 2 — Conversion tracking

- [x] GA4 events on intake submit + Stripe success (web-main)  
- [x] Store UTM in `metadata` on lead create (`lib/marketing/utm.ts` + `utm-metadata.ts`)  
- [x] Command Center dashboard: leads by `source`, `project_path`, UTM, conversion to `paid`  

### Week 3 — Upsell funnel

- [ ] Portal `/services` + email CTAs → estimate + permit paths (done in UI; align copy)  
- [x] Drip step 4 (Day 14): estimate upsell for `concept_ready` intakes  
- [ ] SalesBot + MarketingBot command `full-funnel` for ops campaigns  

### Week 4 — Paid traffic

- [ ] Meta/Google lead endpoints → `/api/leads/marketing` (already exist; test E2E)  
- [ ] Weekly campaigns via `marketing_campaigns` + cron (existing engine)  
- [ ] Review `lead_score` thresholds in `kealee-config.ts` (remove GHL block or mirror to metadata tags)  

---

## 7. Cost estimate (no-GHL path)

| Item | Monthly (indicative) |
|------|----------------------|
| Supabase | (existing plan) |
| Resend | $0–20 (low volume) |
| Vercel crons | (included) |
| Twilio | usage-based |
| Stripe | % of GMV |
| Claude (MarketingBot ops) | ~$5–30 |
| **Avoid** GHL ~$297, Klaviyo ~$50, Segment ~$100 until scale |

---

## 8. Summary

| Question | Answer |
|----------|--------|
| Best CRM? | **Supabase `public_intake_leads`** (+ Prisma for app features) |
| Best email? | **Resend** + `marketing_drip_queue` |
| Best automation? | **Stripe webhooks** + **Vercel crons** + **BullMQ** (workers) |
| Where does MarketingBot run? | **Command Center / API** — not on customer v30 package |
| v30 customer bots? | Design, estimate, zoning, permit, floorplan, video, contractor, sales, project |
| Use GHL? | **No** (legacy optional) |
| Use Klaviyo/Segment/Zapier now? | **No** — add at scale |

**Canonical code paths:** `apps/web-main/lib/marketing/`, `apps/web-main/app/api/leads/marketing/route.ts`, `packages/kealee-agent-stack/src/v30/prompts/marketing-bot.ts`, `_docs/system/marketing-bot-v30.md`.
