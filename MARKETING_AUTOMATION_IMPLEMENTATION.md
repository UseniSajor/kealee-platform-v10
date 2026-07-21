# Marketing Automation Implementation Plan
**Document Date:** May 8, 2026  
**Target:** 3-phase rollout over 6 weeks  
**Owner:** 1 person + AI agents

---

## Phase 1: Core Lead Scoring + SMS Alert (Weeks 1–2)

### Scope
- Add lead scoring to Supabase
- Implement SMS alert on hot leads (Twilio)
- GHL contact auto-creation on paid intake
- Basic SMS workflow trigger in GHL

### Required ENV Variables
```
# Twilio (SMS)
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE=+1...                 # Your Twilio number
YOUR_SMS_NUMBER=+1...              # Your personal number (lead alerts)

# GHL (partially exist)
GHL_LOCATION_ID=...
GHL_API_KEY=...
GHL_WEBHOOK_SECRET=...             # For GHL → Supabase webhooks

# Resend (email backup)
RESEND_API_KEY=...                 # Already exist

# Cron auth
CRON_SECRET=...                    # For /api/cron/* jobs
```

### Tasks
1. **Supabase Schema** — Add columns to `public_intake_leads`:
   - `lead_score` (0–100)
   - `routing_tag` ('hot', 'medium', 'cold', 'nurture')
   - `ghl_contact_id` (nullable)
   - `sms_alert_sent_at` (nullable)

2. **Lead Scoring Logic** (`lib/marketing/lead-scorer.ts`):
   - Source weight: web=10, meta=8, organic=5
   - Budget weight: >$30k=+20, <$5k=-10
   - Timeline weight: ASAP=+15, 1month=+5
   - Service weight: concept=0, estimate=+10, permit=+5
   - Final bucket: score > 70 = 'hot', 50–70 = 'medium', < 50 = 'cold'

3. **Twilio Integration** (`lib/marketing/twilio-client.ts`):
   - Send SMS to you when hot lead arrives
   - Format: `"[Service] - [Name] - $[Budget] - [Timeline] - [Link to intake]"`

4. **GHL Contact Creation** (update `lib/marketing/ghl-client.ts`):
   - On paid intake: create contact in GHL with tags + custom fields
   - Map Supabase fields → GHL: budget, timeline, service, lead_source

5. **Webhook Listener** (`app/api/webhooks/ghl/route.ts`):
   - Accept GHL stage changes (e.g., "New Lead" → "Qualified")
   - Update Supabase `routing_tag` based on GHL stage
   - Log sync to `ghl_sync_log` table

6. **Cron Job** (`app/api/cron/lead-scoring/route.ts`):
   - Run every 5 min: score new leads, send SMS if hot
   - Log to `marketing_sync_log`

### Success Criteria
- ✅ Hot lead arrives → SMS within 2 min
- ✅ GHL contact created with all fields
- ✅ GHL stage changes → Supabase updated

---

## Phase 2: AI Qualification + Auto-Scheduling (Weeks 3–4)

### Scope
- Claude API integration for lead qualification
- Auto-schedule calls via Calendly + GHL
- Slack feed for lead monitoring
- Cold lead re-qualification loop

### Required ENV Variables
```
# AI qualification
ANTHROPIC_API_KEY=...              # Already exist

# Calendly
CALENDLY_API_TOKEN=...
CALENDLY_CALENDAR_UUID=...         # Your Calendly calendar

# Slack notifications
SLACK_WEBHOOK_URL=...              # #leads channel
SLACK_BOT_TOKEN=...                # For richer formatting

# GHL additional
GHL_WORKFLOW_ID_SMS_QUAL=...       # SMS qualification workflow
```

### Tasks
1. **AI Qualification** (`lib/marketing/ai-qualifier.ts`):
   - When SMS reply arrives, send to Claude
   - Prompt: score enthusiasm, budget fit, timeline, service fit
   - Return: `{ confidence: 0–100, recommendation: 'qualify'|'nurture'|'reject' }`

2. **Auto-Scheduling** (`lib/marketing/calendar-sync.ts`):
   - If qualification confidence > 75: suggest 3 available slots
   - Send SMS: "Great! Let's talk [Wed 2pm | Thu 10am | Fri 3pm]?"
   - Calendly creates event, GHL updates with meeting link

3. **Slack Feed** (`app/api/webhooks/leads-to-slack/route.ts`):
   - Daily digest: new leads (scoring + AI qualification + GHL stage)
   - Link to GHL contact + action buttons (Mark Won, Mark Lost, Reassign)

4. **Cold Lead Requalification** (`app/api/cron/requalify-cold/route.ts`):
   - Every 48h: check if cold lead showed activity (form revisit, email click)
   - If activity > threshold: bump score, retry SMS
   - Log re-engagement attempts

5. **Lead Context Sync** (expand `ghl-client.ts`):
   - Supabase `form_data` → GHL custom fields (budget, timeline, intake status)
   - GHL → Supabase sync log for auditing

### Success Criteria
- ✅ SMS reply → AI qualification within 30 sec
- ✅ Confident leads → auto-scheduled with Calendly link
- ✅ Slack shows 3–5 hot leads/day with context
- ✅ Cold leads re-engaged if activity detected

---

## Phase 3: Multi-Channel Scale (Weeks 5+)

### Scope
- Native Facebook Lead Ads sync (GHL-to-GHL, not via Supabase)
- Google Ads conversion tracking bi-directional
- Zapier + inbound SMS replies
- Full GHL workflow automation

### Required ENV Variables
```
# Facebook
META_APP_ID=...
META_APP_SECRET=...
FACEBOOK_PAGE_ACCESS_TOKEN=...

# Google Ads
GOOGLE_ADS_CUSTOMER_ID=...
GOOGLE_ADS_DEVELOPER_TOKEN=...
GOOGLE_CONVERSION_ID=...

# Zapier (user-configured, no env needed)
# Inbound SMS replies (GHL → Supabase)
```

### Tasks
1. **Facebook Lead Ads Native Sync** (decom Supabase middleman):
   - Configure GHL webhook in Facebook app
   - GHL auto-creates contact + opportunity + SMS workflow
   - Fallback: if GHL fails, log to Supabase for retry

2. **Google Ads Bi-directional** (`lib/marketing/google-ads-sync.ts`):
   - Supabase paid lead → mark conversion in GA4
   - GHL won deal → mark conversion in Google Ads
   - ROI tracking for optimization

3. **Zapier Integration** (user setup + docs):
   - Any web form → Zapier → Supabase + GHL
   - No code required; user can add sources

4. **Inbound SMS Replies**:
   - GHL SMS reply → webhook → Supabase `lead_notes`
   - AI auto-classifier: escalation level (urgent / followup / closed)
   - Slack alert for urgent replies

### Success Criteria
- ✅ Facebook leads auto-flow to GHL (no Supabase lag)
- ✅ Google Ads proves ROI
- ✅ Zapier allows non-technical user to add sources
- ✅ Inbound SMS replies tracked + escalated

---

## Database Schema Changes

### New Columns on `public_intake_leads`
```sql
ALTER TABLE public_intake_leads ADD COLUMN lead_score INTEGER DEFAULT 0;
ALTER TABLE public_intake_leads ADD COLUMN routing_tag TEXT DEFAULT 'pending';  -- 'hot'|'medium'|'cold'|'nurture'|'pending'
ALTER TABLE public_intake_leads ADD COLUMN ghl_contact_id TEXT;
ALTER TABLE public_intake_leads ADD COLUMN sms_alert_sent_at TIMESTAMPTZ;
ALTER TABLE public_intake_leads ADD COLUMN ai_qualification_score REAL;         -- 0–100
ALTER TABLE public_intake_leads ADD COLUMN ai_qualification_recommendation TEXT; -- 'qualify'|'nurture'|'reject'
```

### New Tables
```sql
-- GHL sync audit log
CREATE TABLE ghl_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intake_id UUID REFERENCES public_intake_leads(id),
  ghl_contact_id TEXT,
  action TEXT,                    -- 'create'|'update'|'stage_move'|'error'
  ghl_response JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- SMS alert log
CREATE TABLE sms_alert_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intake_id UUID REFERENCES public_intake_leads(id),
  message TEXT,
  sent_at TIMESTAMPTZ DEFAULT now(),
  status TEXT                     -- 'sent'|'failed'|'bounced'
);

-- Lead notes (for AI qualification + inbound SMS replies)
CREATE TABLE lead_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intake_id UUID REFERENCES public_intake_leads(id),
  note TEXT,
  note_type TEXT,                -- 'sms_reply'|'ai_classification'|'manual'
  ai_classified_as TEXT,         -- 'urgent'|'followup'|'closed'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Calendly sync
CREATE TABLE calendly_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intake_id UUID REFERENCES public_intake_leads(id),
  calendly_event_id TEXT,
  scheduled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## Implementation Order

### Week 1
- [ ] Add schema columns + new tables
- [ ] Implement lead scorer (lib/marketing/lead-scorer.ts)
- [ ] Add Twilio client (lib/marketing/twilio-client.ts)
- [ ] Build `/api/cron/lead-scoring` cron job
- [ ] Test: submit intake, expect SMS alert in < 2 min

### Week 2
- [ ] Update GHL client for contact creation + custom fields
- [ ] Build GHL webhook listener (`/api/webhooks/ghl`)
- [ ] Create `ghl_sync_log` audit
- [ ] Verify GHL contact created with all fields
- [ ] Test: GHL stage move → Supabase update

### Week 3–4
- [ ] AI qualifier (Claude API + prompt)
- [ ] Calendly integration
- [ ] Auto-scheduling SMS + calendar link
- [ ] Slack feed (`/api/webhooks/leads-to-slack`)
- [ ] Cold lead requalification cron

### Week 5+
- [ ] Facebook native sync (GHL-to-GHL)
- [ ] Google Ads bi-directional
- [ ] Zapier setup + docs
- [ ] Inbound SMS replies + escalation

---

## Rollout Strategy

**Week 1–2:** Test with 5–10 manual submissions. You get SMS alerts; verify auto-creation in GHL.  
**Week 3–4:** Enable for Meta Lead Ads. Let AI qualify a few leads; review confidence scores.  
**Week 5+:** Add Facebook native sync + Google Ads. Monitor ROI.

---

## Known Gaps

- GHL workflows not yet in env vars (need to extract from GHL app)
- Calendly calendar UUID not yet captured (user setup required)
- Slack bot token optional (can start with webhooks only)
- SMS replies inbound handler not yet built (Phase 3)

---

## Owner Checklist Before Week 1

- [ ] Verify GHL location ID + API key work (test with existing ghl-client.ts)
- [ ] Buy Twilio credits (~$20 for testing)
- [ ] Get Twilio account SID, auth token, phone number
- [ ] Determine personal SMS number for alerts
- [ ] Gather GHL workflow IDs (if any pre-built workflows exist)
- [ ] Optional: set up Calendly calendar + get UUID + API token

---

## Success Metrics

| Phase | KPI | Target |
|-------|-----|--------|
| 1 | SMS latency | < 2 min |
| 1 | GHL contact creation success rate | 100% |
| 2 | AI qualification confidence (hot leads) | > 75% |
| 2 | Auto-scheduled calls | 50% of qualified leads |
| 3 | Multi-channel lead volume | +100% (after Phase 1) |
| 3 | Close rate (GHL won vs total) | Monitor baseline |

