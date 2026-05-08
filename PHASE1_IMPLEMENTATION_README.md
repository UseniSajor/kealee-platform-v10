# Phase 1 Implementation: Lead Scoring + SMS Alerts + GHL Integration

## Summary

Phase 1 establishes the foundational lead scoring, SMS alerting, and GHL contact sync infrastructure. Once deployed, new leads automatically receive a score, hot leads trigger SMS alerts to your phone, and all leads are synced to GHL with proper tagging and metadata.

## What's Included

### Core Files
- **`lib/marketing/lead-scorer.ts`** — Lead scoring engine (0–100 scale, routing tags)
- **`lib/marketing/twilio-client.ts`** — SMS client for Twilio integration
- **`app/api/cron/lead-scoring/route.ts`** — Cron job (run every 5 min) to score leads, send SMS, create GHL contacts
- **`app/api/webhooks/ghl/route.ts`** — GHL webhook listener for contact/opportunity updates

### Setup & Testing
- **`scripts/test-ghl-connection.mjs`** — Test GHL API connectivity
- **`scripts/setup-marketing-phase1-check.mjs`** — Verify all Phase 1 requirements (GHL, Twilio, env vars)
- **`_docs/migrations/001-marketing-phase1-schema.sql`** — Database schema (new columns + tables)

### Documentation
- **`MARKETING_AUTOMATION_IMPLEMENTATION.md`** — Full 3-phase plan, success metrics, timeline

## Environment Variables Required

**GHL:**
```
GHL_API_KEY=...           # From GHL app settings
GHL_LOCATION_ID=...       # From GHL dashboard
```

**Twilio:**
```
TWILIO_ACCOUNT_SID=...    # From Twilio console
TWILIO_AUTH_TOKEN=...     # From Twilio console
TWILIO_PHONE=+1...        # Your Twilio phone number (must include country code)
YOUR_SMS_NUMBER=+1...     # Your personal number (receives alerts)
```

## Setup Instructions

### 1. Verify GHL Connection

```bash
cd apps/web-main
pnpm run test:ghl
```

Output should show your GHL location name, number of existing contacts, and available pipelines.

### 2. Verify Twilio & Full Setup

```bash
pnpm run test:marketing-setup
```

This checks:
- All required env vars are set
- GHL location is accessible
- Twilio account is active and has credits

### 3. Deploy Database Schema

Run the migration on your Supabase database:

```sql
-- Copy the contents of:
-- _docs/migrations/001-marketing-phase1-schema.sql

-- It adds:
-- - lead_score (INTEGER)
-- - routing_tag (TEXT: 'hot'|'medium'|'cold'|'nurture')
-- - ghl_contact_id (TEXT)
-- - sms_alert_sent_at (TIMESTAMPTZ)
-- And creates three new tables: ghl_sync_log, sms_alert_log, (for Phase 2: lead_notes)
```

### 4. Enable Cron Job

Your deployment platform (Vercel, Railway, etc.) needs to call `/api/cron/lead-scoring` every 5 minutes. The endpoint accepts:

```bash
POST https://your-domain/api/cron/lead-scoring
Authorization: Bearer $CRON_SECRET
```

or

```bash
POST https://your-domain/api/cron/lead-scoring
x-kealee-ops: $CRON_SECRET
```

**Vercel:** Use a third-party cron service (EasyCron, Cronitor, etc.) or serverless function.
**Railway:** Use Railway's cron trigger.

### 5. Register GHL Webhook

In your GHL app settings, register a webhook:

**URL:** `https://your-domain/api/webhooks/ghl`  
**Secret:** Set `GHL_WEBHOOK_SECRET` environment variable to match your GHL webhook secret  
**Events:** Contact updated, Opportunity stage changed

The webhook listener will sync GHL updates back to Supabase automatically.

### 6. Test Manually

Submit a test intake form (e.g., `/intake/concept`):
- Fill in details: service (concept/estimate/permit), budget, timeline, etc.
- Upload photos/documents
- Submit payment

**Expected:**
- Lead appears in `public_intake_leads` with `status='new'`
- Within 5 minutes: lead is scored (check `lead_score`, `routing_tag`)
- If score >= 75 (hot): you receive an SMS alert
- GHL contact created with all custom fields
- `ghl_sync_log` records the sync

## Lead Scoring Logic

```
Base score: 50

Source (weight: 0–10):
  - Referral: +12
  - Meta/Facebook: +10
  - Google: +8
  - Web/Organic: +5
  - Direct: +3
  - Unknown: +2

Budget (weight: 0–25):
  - >= $50k: +25
  - >= $30k: +20
  - >= $15k: +15
  - >= $5k: +10
  - >= $1k: +5
  - < $1k: -10

Timeline (weight: -5 to +20):
  - ASAP: +20
  - 1-2 weeks: +18
  - 1 month: +12
  - 2-3 months: +5
  - 3+ months: -5

Service (weight: 0–18):
  - Full-design: +18
  - Permit: +15
  - Estimate: +12
  - Concept: +5

Documents (weight: 0–10):
  - Has docs: +10
  - Has photo: +5

Routing tags:
  - Hot: score >= 75 (SMS alert sent, auto-scheduled)
  - Medium: 50–74 (nurture track)
  - Cold: 25–49 (re-engagement campaigns)
  - Nurture: < 25 (long-term follow-up)
```

## Verification Checklist

- [ ] All env vars set (`pnpm run test:marketing-setup` passes)
- [ ] Database schema deployed (new tables visible in Supabase)
- [ ] Cron job configured (calls `/api/cron/lead-scoring` every 5 min)
- [ ] GHL webhook registered (webhook secret set)
- [ ] Test intake submitted
- [ ] SMS alert received within 2 minutes
- [ ] GHL contact created with proper tags and custom fields
- [ ] `ghl_sync_log` and `sms_alert_log` have records

## Phase 1 Success Metrics

| Metric | Target |
|--------|--------|
| SMS latency | < 2 min after payment |
| GHL contact creation success | 100% |
| Lead score accuracy | Validated against manual review |
| Cron job uptime | 99%+ |

## Troubleshooting

**SMS alert not sent:**
- Check `sms_alert_log` table for errors
- Verify `YOUR_SMS_NUMBER` is in international format (+1...)
- Check Twilio account credits

**GHL contact not created:**
- Check `ghl_sync_log` for error messages
- Verify `GHL_API_KEY` and `GHL_LOCATION_ID` are correct
- Ensure GHL location has SMS phone number configured

**Lead not scored:**
- Check cron job is calling `/api/cron/lead-scoring`
- Verify `CRON_SECRET` matches deployment config
- Check server logs for scoring errors

## Next: Phase 2

Once Phase 1 is live for 1–2 weeks:
- Monitor SMS alert accuracy and response rates
- Review GHL contact sync completeness
- Gather pipeline IDs and workflow IDs from GHL

Then move to **Phase 2: AI Qualification + Auto-Scheduling**

See `MARKETING_AUTOMATION_IMPLEMENTATION.md` for full Phase 2 requirements.
