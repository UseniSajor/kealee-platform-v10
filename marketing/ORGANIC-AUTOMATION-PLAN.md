# Kealee organic marketing automation (no paid ads, no SaaS subscriptions)

**Goal:** Grow **concept → permit → drawings → build** using only assets you already pay for (hosting, Resend usage, Stripe %, Claude ops). Post-concept upsell is always permit, then professional drawings — not a standalone estimate funnel. No GoHighLevel, Klaviyo, paid Meta/Google boosts, or monthly marketing SaaS stacks.

**Canonical stack:** [STACK-RECOMMENDATION.md](./STACK-RECOMMENDATION.md) · **Saved assets:** [index.json](./index.json)

---

## 1. Ways to automate without subscriptions or paid ads

| Channel | Automation | Repo / cron | Cost |
|---------|------------|-------------|------|
| **Owned site + SEO** | Funnel pages, blog, UTM capture, GA4 | `apps/web-main`, `UtmCaptureRoot` | Vercel (existing) |
| **Email nurture** | Welcome + day 1/3/7/14 drips, weekly product email | Resend + `marketing_drip_queue` + `/api/cron/marketing-drip` | Pay per send (~$0) |
| **Weekly product campaigns** | 7-day rotation per product theme | `marketing-engine.ts` + `/api/cron/send-daily-campaigns` | Resend only |
| **Lead scoring & routing** | Hot → Slack/Twilio; tier in Supabase | `lead-scorer.ts`, `/api/cron/lead-scoring` | Twilio usage |
| **Reddit organic** | Value-first posts (no ad spend) | `reddit-organic.ts`, `/api/cron` patterns | Free |
| **LinkedIn organic** | Scheduled thought-leadership | `/api/cron/linkedin` | Free |
| **Instagram / Facebook organic** | Post slots (not paid boost) | `/api/cron/instagram`, `facebook` | Free |
| **Nextdoor / community** | Lead webhook | `/api/marketing/nextdoor-lead` | Free |
| **Referral & contractor network** | Marketplace + post-concept CTA | `web-main` services, portal | Platform fee on GMV |
| **Ops content (MarketingBot)** | Copy for email/social when human approves | Command Center `/marketing` | Claude API |
| **Conversion** | Stripe → v30 + lifecycle email | Stripe webhook, `lifecycle.ts` | Stripe % |

**Explicitly off by default:** GHL (`GHL_ENABLED=false`), paid ad APIs as *spend* (Meta/Google *lead webhooks* can stay for inbound if you run ads later—automation does not require ad budget).

---

## 2. 90-day organic plan (DMV homeowners)

### Phase A — Foundation (weeks 1–4)

| Week | Focus | Automation |
|------|--------|------------|
| 1 | Concept Engine hero + card media on homepage | Card media generate; `/concept` UTM `source=organic` |
| 2 | Permit upsell (DC/NoVA) | Drip step 4 `permit_upsell`; `/intake/permit_path_only` |
| 3 | Drawings upsell | Drip step 5 `drawings_upsell`; `/intake/professional_drawings` |
| 4 | Contractor match CTA | Email to intakes with permit/drawings interest |

**KPIs:** Leads/week, `paid` conversion %, cost per lead = $0 ad spend.

### Phase B — Rhythm (weeks 5–12)

- **Monday–Sunday:** Auto-generate week’s `marketing_campaigns` rows (`generate-weekly-campaigns` cron).
- **Daily:** Send today’s campaign email to `status=new` leads (`send-daily-campaigns`).
- **Organic social:** 2× Reddit help comments/week (manual or scripted drafts from MarketingBot); 1 LinkedIn post/week from CC Content tab.
- **Scoring:** Re-run lead scoring every 6h; hot leads → Slack.

### Phase C — Scale (weeks 13+)

- Repeat 8-week rotation with **concept → permit → drawings** as the upsell spine (weeks 1–3), then awareness for marketplace / ops tools.
- Add jurisdiction-specific landing snippets (Arlington, Fairfax, Montgomery).
- Partner: 3 contractor co-marketing emails (Resend, no new tool).

---

## 3. Funnel automation (no GHL)

```
Traffic (SEO, organic social, referral)
  → POST /api/leads/marketing  (public_intake_leads)
  → marketing_drip_queue (Resend)
  → lead_score / routing_tag
  → Stripe checkout (concept SKUs from core-rules)
  → webhook: paid → v30 bots + post-payment email
  → concept_ready → drip permit upsell (day 14) → drawings upsell (day 21)
  → permit / drawings intakes → SalesBot-ready metadata
```

Tag in `metadata` instead of GHL tags: `organic`, `reddit`, `email-campaign`, `referral`.

---

## 4. What humans still do (10 min/day)

1. Command Center → **Plans & library** tab: confirm this week’s theme.
2. **Start campaign** (or let cron run).
3. Approve 1 organic social post from **Content** tab.
4. Reply to hot leads in Slack.

---

## 5. Saved library (version controlled)

| Path | Contents |
|------|----------|
| [upsell-path.json](./upsell-path.json) | Canonical concept → permit → drawings |
| [plans/organic-2026-q2.json](./plans/organic-2026-q2.json) | This 90-day plan (machine-readable) |
| [stacks/in-repo-no-subscriptions.json](./stacks/in-repo-no-subscriptions.json) | Tool stack, no GHL |
| [stacks/organic-channels.json](./stacks/organic-channels.json) | Channel → cron → API map |
| [campaigns/rotation-8week.json](./campaigns/rotation-8week.json) | Product weekly rotation + message hooks |
| [campaigns/drip-sequence.json](./campaigns/drip-sequence.json) | Resend drip steps |
| [index.json](./index.json) | Catalog of all assets |

**Regenerate campaigns from engine:** `pnpm run generate:marketing-library`

**View in UI:** Command Center → Marketing → **Plans & library**

---

## 6. Environment (no new subscriptions)

```bash
RESEND_API_KEY=           # email
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
CRON_SECRET=              # crons + CC triggers
NEXT_PUBLIC_SITE_URL=https://kealee.com
GHL_ENABLED=false
```

Optional free tiers only: GA4, Google Search Console, Reddit/LinkedIn accounts.

---

## 7. Channel comparison (projects / sales / revenue)

| Channel | Projects | Leads | Sales | Revenue | Est. cost | ROI |
|---------|----------|-------|-------|---------|-----------|-----|
| **Organic (in-repo)** | Distinct `project_path` | All intakes | `status=paid` | Σ `payment_amount` | **$0** default | Highest when converting |
| **Paid ads** | Same | UTM `cpc` / `paid_social` | Same | Same | ~$120/sale placeholder | Track vs ad spend in Meta/Google |
| **Marketing SaaS** | Same | GHL/Klaviyo tags | Same | Same | ~$35/sale placeholder | Compare only if GHL enabled |

**Live view:** Command Center → Marketing → **Ops** tab (table at top).  
**API:** `GET /api/marketing/channel-comparison` (web-main + command-center).  
**Capture:** `metadata.marketingChannel` set on lead create from UTM (`utm-metadata.ts`).

---

## 8. Success metrics

| Metric | Target (organic) |
|--------|------------------|
| Marketing leads / week | +15% MoM |
| Lead → paid | Track in CC Ops tab |
| Email open rate | >25% (Resend) |
| Ad spend | $0 |
| Marketing SaaS | $0 (beyond Resend usage) |
