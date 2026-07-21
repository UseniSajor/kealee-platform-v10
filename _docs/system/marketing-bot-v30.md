# MarketingBot — platform growth (not a customer product)

See also: [`marketing/STACK-RECOMMENDATION.md`](../../marketing/STACK-RECOMMENDATION.md) for the full tool stack vs repo/schema/v30.

## What MarketingBot is

MarketingBot drives **Kealee platform** outcomes:

- **Traffic** — ads, SEO, social (DMV)
- **Leads** — capture → `public_intake_leads`
- **Paid conversions** — concept → estimate → permit → **build on platform**

There is **no** homeowner “marketing kit” deliverable.

## Recommended stack (no GHL)

| Layer | Tool |
|-------|------|
| CRM / leads | Supabase `public_intake_leads` |
| Email | Resend + `marketing_drip_queue` |
| Payments | Stripe webhooks |
| Automation | Vercel crons + BullMQ |
| Ops UI | Command Center `/marketing` |
| Planning bot | API `marketing-bot` + v30 prompt (ops only) |

**Do not use GHL by default.** Legacy GHL code remains in `services/api` behind env flags only.

## v30 boundary

| Runs on paid intake? | Bots |
|----------------------|------|
| Yes | design, estimate, zoning, floorplan, permit, video, contractor, sales, project |
| **No** | **marketing**, support (`V30_OPS_BOT_TYPES`) |

## Key APIs

- `POST /api/leads/marketing` — bot/channel lead capture + welcome email + drip schedule  
- `GET /api/cron/marketing-drip` — send scheduled drips (Resend)  
- `POST /bots/marketing-bot/execute` — campaign playbook (API)  
- `POST /api/marketing/commands` — Command Center command registry  
- Stripe webhook → `triggerV30GenerationForIntake` (v30)

## Env

| Variable | Purpose |
|----------|---------|
| `RESEND_API_KEY` | Email |
| `MARKETING_BOT_API_KEY` | Secure `/api/leads/marketing` |
| `CRON_SECRET` | Vercel cron auth |
| `KEALEE_V30_ENABLED` | Post-paid bot generation |
| `GHL_API_KEY` | **Optional legacy — not recommended** |
