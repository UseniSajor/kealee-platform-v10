# Phase 2 Implementation: AI Qualification + Auto-Scheduling + Slack Feed

## Summary

Phase 2 automates lead qualification using Claude AI, schedules calls on Calendly, and provides a real-time Slack feed for lead monitoring. Hot leads from Phase 1 are AI-qualified; if they show strong intent, calls are auto-scheduled with Calendly links sent via SMS.

## What's Included

### Core Components
- **`lib/marketing/ai-qualifier.ts`** — Claude API integration for SMS reply scoring
- **`lib/marketing/calendly-client.ts`** — Calendly availability + event creation
- **`lib/marketing/slack-client.ts`** — Slack notifications + daily digest
- **`app/api/cron/requalify-cold/route.ts`** — Cold lead re-engagement cron (48h interval)

### Database
- **New columns:** `ai_qualification_score`, `ai_qualification_recommendation`, `qualified_at`
- **New tables:** `lead_notes`, `calendly_events`
- **Migration:** `002-marketing-phase2-schema.sql`

## Environment Variables Required

**Claude API** (already exist from core):
```
ANTHROPIC_API_KEY=sk-...
```

**Calendly**:
```
CALENDLY_API_TOKEN=...      # From Calendly integration
CALENDLY_CALENDAR_UUID=...  # Your Calendly calendar ID
```

**Slack**:
```
SLACK_WEBHOOK_URL=...       # #leads channel webhook
SLACK_BOT_TOKEN=...         # Optional: for richer formatting
```

## Workflow: Phase 1 → Phase 2

### 1. Hot Lead Arrives (Phase 1)
```
Lead submitted → Lead scored (>75) → SMS alert sent
"[Service] - [Name] - $[Budget] - [Timeline] - https://..."
```

### 2. User Replies to SMS
```
User: "Yeah, interested. Looking to start in 2 weeks"
```

### 3. AI Qualification (Phase 2)
```
Claude analyzes reply:
- Intent: Clear (Qualify)
- Urgency: Strong (2 weeks)
- Tone: Professional
→ Recommendation: QUALIFY (75-85% confidence)
```

### 4. Auto-Schedule or Nurture
```
If confidence >= 75:
  - Fetch Calendly availability (next 3 days)
  - Send SMS: "Great! Pick a time: [Wed 2pm | Thu 10am | Fri 3pm]?"
  - Create Calendly event when they click slot

If confidence < 75:
  - Add to nurture sequence
  - Tag as "medium" in GHL
  - Re-check in 24h
```

### 5. Slack Feed
```
Every hot/medium lead posted to #leads with:
- Lead name, service, budget, score
- GHL link
- Quick action buttons (Call, Skip, View)

Daily digest: Summary of leads that day
```

## Setup Instructions

### 1. Deploy Phase 2 Database Schema

```sql
-- Run in Supabase:
_docs/migrations/002-marketing-phase2-schema.sql
```

### 2. Set Up Calendly Integration

1. Go to Calendly → Settings → Integrations
2. Create a new API token
3. Copy the token to `CALENDLY_API_TOKEN`
4. Find your calendar UUID:
   ```bash
   curl -H "Authorization: Bearer $CALENDLY_API_TOKEN" \
     https://api.calendly.com/users/me
   # Copy the "uri" field and extract the UUID
   ```
5. Set `CALENDLY_CALENDAR_UUID`

### 3. Set Up Slack Webhook

1. Go to your Slack workspace → Apps → Manage Apps
2. Create a new app or open existing Kealee app
3. Enable "Incoming Webhooks"
4. Create webhook for `#leads` channel
5. Copy the webhook URL to `SLACK_WEBHOOK_URL`

### 4. Enable Cron Jobs

Set up cron triggers (Vercel, Railway, EasyCron, etc.) for:

```bash
# Every 5 minutes (same as Phase 1)
POST /api/cron/lead-scoring
x-kealee-ops: $CRON_SECRET

# Every 48 hours
POST /api/cron/requalify-cold
x-kealee-ops: $CRON_SECRET

# Optional: Daily digest (once per day)
POST /api/webhooks/leads-to-slack?action=digest
x-kealee-ops: $CRON_SECRET
```

## AI Qualification Logic

Claude evaluates SMS replies on:

| Factor | Weight | Scoring |
|--------|--------|---------|
| Intent Clarity | 30% | "Yes" = 100%, "Maybe" = 50%, "No" = 0% |
| Urgency | 25% | "ASAP" = 100%, "1mo" = 50%, "TBD" = 25% |
| Budget Fit | 20% | Within stated range = 100%, borderline = 50% |
| Service Fit | 15% | Perfect match = 100%, partial = 50% |
| Tone | 10% | Professional = 100%, casual = 75%, spam = 0% |

**Result:** Weighted confidence score (0–100)

**Actions:**
- **≥75% (Qualify):** Auto-schedule call
- **50–74% (Nurture):** Add to drip sequence, re-check in 24h
- **<50% (Reject):** Move to cold list, re-engage after 7d

## Calendly Auto-Scheduling

When a lead is qualified:

1. Fetch next 3 available 30-min slots
2. Send SMS: `"Great! Let's talk: 1) Wed 2pm | 2) Thu 10am | 3) Fri 3pm?"`
3. When user replies (Phase 3 SMS parsing):
   - Create Calendly event
   - Send confirmation SMS with Calendly link
   - Update `calendly_events` table
   - Notify you in Slack

## Slack Feed Design

### Individual Lead Alert
```
🟢 HOT LEAD: John Smith
Service: Estimate | Budget: $15k–$25k | Score: 82/100
Actions: [View in GHL] [Call] [Skip]
```

### Daily Digest
```
📊 Daily Lead Digest (8 new)
🔥 Hot: 2 | ⚡ Medium: 4 | ❄️ Cold: 2

Top leads today:
1. Jane Doe (permit) - $50k+ - 88/100
2. Bob Johnson (estimate) - $10k - 76/100
3. Alice Brown (concept) - Budget TBD - 52/100
```

## Monitoring & Troubleshooting

### Check AI Qualification
```sql
SELECT * FROM public_intake_leads
WHERE ai_qualification_score IS NOT NULL
ORDER BY ai_qualification_score DESC;
```

### Check Calendly Events
```sql
SELECT l.name, c.scheduled_at, c.status
FROM calendly_events c
JOIN public_intake_leads l ON c.intake_id = l.id
ORDER BY c.scheduled_at DESC;
```

### Check Lead Notes
```sql
SELECT * FROM lead_notes
WHERE note_type IN ('sms_reply', 'ai_classification')
ORDER BY created_at DESC;
```

### Slack Webhook Test
```bash
curl -X POST $SLACK_WEBHOOK_URL \
  -H 'Content-Type: application/json' \
  -d '{"text":"Test message from Kealee"}'
```

## Phase 2 Success Metrics

| Metric | Target |
|--------|--------|
| AI qualification accuracy | >80% (manual review) |
| Auto-scheduled calls (qualified leads) | >50% |
| Calendly integration uptime | 99%+ |
| Slack alert latency | <30 sec |
| Daily digest frequency | 1x/day, 100% delivery |

## Integration with Phase 1

Phase 2 **depends on** Phase 1:
- Uses `lead_score` and `routing_tag` from Phase 1
- Triggers from Phase 1's SMS alert to the lead
- Updates `ghl_contact_id` and GHL custom fields
- Logs all actions to `ghl_sync_log` and `lead_notes`

## Next: Phase 3

Once Phase 2 runs for 1–2 weeks:
- Review auto-scheduled call show rate
- Validate AI qualification accuracy
- Gather Facebook + Google Ads credentials

Then proceed to **Phase 3: Multi-Channel Scale**
- Native Facebook Lead Ads sync (GHL-to-GHL)
- Google Ads bi-directional conversion tracking
- Inbound SMS reply parsing + escalation

See `MARKETING_AUTOMATION_IMPLEMENTATION.md` for Phase 3 details.
