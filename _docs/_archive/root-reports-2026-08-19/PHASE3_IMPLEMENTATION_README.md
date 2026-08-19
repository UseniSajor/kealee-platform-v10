# Phase 3 Implementation: Multi-Channel Scale + ROI Tracking

## Summary

Phase 3 scales marketing automation across multiple channels: Facebook Lead Ads, Google Ads conversion tracking, and inbound SMS reply parsing. All leads flow into GHL automatically, with bi-directional ROI tracking to measure cost-per-lead and optimize spend.

## What's Included

### Core Components
- **`lib/marketing/google-ads-sync.ts`** — Google Ads conversion upload + ROI tracking
- **`app/api/webhooks/facebook-leads/route.ts`** — Facebook Lead Ads native sync (webhook)
- **`app/api/webhooks/inbound-sms/route.ts`** — Inbound SMS reply classification + escalation

### Database
- **New columns:** `gclid`, `facebook_lead_id`, `meta_form_id`, `source_channel`, `converted_to_deal_at`
- **New table:** `marketing_roi_metrics` (monthly ROI tracking)
- **Migration:** `003-marketing-phase3-schema.sql`

## Environment Variables Required

**Google Ads**:
```
GOOGLE_ADS_CUSTOMER_ID=1234567890
GOOGLE_ADS_DEVELOPER_TOKEN=...
GOOGLE_CONVERSION_ID=...            # Conversion ID from Google Ads
GOOGLE_ADS_ACCESS_TOKEN=...         # OAuth token (set via Vercel/Railway)
```

**Facebook / Meta**:
```
META_APP_ID=...
META_APP_SECRET=...
FACEBOOK_PAGE_ACCESS_TOKEN=...      # Page access token for Lead Ads
META_WEBHOOK_VERIFY_TOKEN=...       # Secret for webhook verification
```

**GHL Workflows** (from Phase 1):
```
GHL_WORKFLOW_ID_SMS_QUAL=...        # SMS qualification workflow
```

## Workflow: Phase 3 Multi-Channel

### Channel 1: Facebook Lead Ads → GHL (Native)

```
Facebook Lead Form Submitted
  ↓
Webhook to /api/webhooks/facebook-leads
  ↓
Extract fields (name, email, budget, timeline, service)
  ↓
Create/update GHL contact (tags: facebook, service_type)
  ↓
Trigger GHL SMS workflow (Phase 2)
  ↓
Lead routed to your SMS queue → hot/medium/cold response
```

**Setup:**
1. Create Lead Ads form in Facebook Business Manager
2. Configure webhook in app settings
3. Point to: `https://your-domain/api/webhooks/facebook-leads`
4. Verify token: `META_WEBHOOK_VERIFY_TOKEN`

### Channel 2: Google Ads → Supabase → GHL (Tracked for ROI)

```
Google Ads click → UTM params (gclid) → web-main intake form
  ↓
User submits intake with gclid preserved
  ↓
On paid lead: upload conversion to Google Ads
  ↓
Measure cost-per-lead, ROI
```

**Setup:**
1. Add Google Ads conversion tracking to intake forms (capture gclid)
2. Configure Google Ads API credentials
3. Enable OAuth consent in Google Cloud
4. Test: submit intake from Google Ads and verify conversion upload

### Channel 3: Inbound SMS Replies → Lead Notes → Slack Escalation

```
User replies to hot lead SMS alert
  ↓
Webhook from GHL/Twilio to /api/webhooks/inbound-sms
  ↓
Claude classifies urgency (urgent/escalate/followup/closed)
  ↓
Store in lead_notes table
  ↓
If urgent/escalate: post to Slack #urgent channel
```

**Setup:**
1. Configure GHL to webhook SMS replies
2. Point to: `https://your-domain/api/webhooks/inbound-sms`
3. Inbound SMS classified and escalated automatically

## ROI Tracking

Monthly dashboard: `/admin/marketing/roi` (build this)

**Metrics tracked:**
- Total leads (from all channels)
- Paid leads (Stripe purchases)
- Qualified leads (AI score >= 75%)
- Won deals (GHL status = won)
- Cost per lead: totalSpend / totalLeads
- Cost per qualified: totalSpend / qualifiedLeads
- Cost per deal: totalSpend / wonDeals
- ROI: (dealValue - spend) / spend

**Data sources:**
- Google Ads (spend, CPC)
- Meta (spend, CPL)
- Stripe (lead conversion)
- Supabase (lead scoring, routing)
- GHL (deal wins)

```sql
-- Monthly ROI snapshot
SELECT
  month_year,
  total_leads,
  paid_leads,
  qualified_leads,
  won_deals,
  cost_per_lead,
  cost_per_deal,
  roi
FROM marketing_roi_metrics
ORDER BY month_year DESC;
```

## Facebook Lead Ads Setup

### 1. Create Lead Ads Form

1. Facebook Business Manager → Ads Manager
2. Campaigns → Create → Lead Ads
3. Add custom fields: Service, Budget, Timeline
4. Submit to your landing page

### 2. Configure Webhook

1. Meta App → Settings → Webhooks
2. Callback URL: `https://your-domain/api/webhooks/facebook-leads`
3. Verify token: Set `META_WEBHOOK_VERIFY_TOKEN`
4. Subscribe to: `leadgen` events
5. Test webhook:

```bash
curl -X POST https://your-domain/api/webhooks/facebook-leads \
  -H 'Content-Type: application/json' \
  -d @- <<'EOF'
{
  "entry": [{
    "messaging": [{
      "messaging_events": [{
        "lead_gen": {
          "form_id": "123456",
          "field_data": [
            {"name": "email", "value": "test@example.com"},
            {"name": "first_name", "value": "John"},
            {"name": "service_type", "value": "permit"}
          ]
        }
      }]
    }]
  }]
}
EOF
```

## Google Ads Setup

### 1. Enable Conversion Tracking

1. Google Ads → Tools & Settings → Conversions
2. Create conversion action: "Lead - Paid"
3. Tracking method: API upload
4. Note conversion ID

### 2. Get OAuth Credentials

1. Google Cloud Console → Create project
2. Enable: Google Ads API, Google Analytics 4 API
3. Create OAuth 2.0 credential (Desktop app)
4. Set refresh token in `GOOGLE_ADS_ACCESS_TOKEN`

### 3. Capture GCLID in Forms

Update intake forms to preserve `gclid` from UTM params:

```typescript
// In intake form component
useEffect(() => {
  const params = new URLSearchParams(window.location.search)
  const gclid = params.get('gclid')
  if (gclid) {
    setFormData(prev => ({ ...prev, gclid }))
  }
}, [])
```

## Inbound SMS Escalation

### Setup GHL SMS Webhook

1. GHL → Integrations → Webhooks
2. Create: SMS received
3. POST to: `https://your-domain/api/webhooks/inbound-sms`
4. Include: ghlContactId, message, timestamp

### Escalation Logic

```
User SMS → Claude classification:
  - URGENT: "I need this done TODAY" → Slack #urgent
  - ESCALATE: "This is broken!" → Slack #escalate + notify manager
  - FOLLOWUP: "Can you tell me more?" → lead_notes, manual follow-up
  - CLOSED: "Thanks, goodbye" → close lead
```

## Multi-Channel Lead Deduplication

When same person submits via multiple channels (Meta + Google Ads + web):

1. Match by email (primary)
2. Match by phone (secondary)
3. If duplicate: merge leads in Supabase + GHL
4. Update `source_channel` to reflect all origins
5. Prevent duplicate SMS alerts

```sql
-- Find duplicate leads
SELECT email, COUNT(*) as count
FROM public_intake_leads
WHERE email IS NOT NULL
GROUP BY email
HAVING COUNT(*) > 1;
```

## ROI Dashboard (To Build)

Create a dashboard at `/admin/marketing/roi-dashboard`:

```tsx
// Show:
- 30-day metrics (leads, spend, conversions, ROI)
- Channel breakdown (Facebook, Google, Organic, etc.)
- Cost per lead trend (30d, 90d, 12mo)
- Win rate by channel
- Export to CSV/Sheets
```

## Monitoring & Troubleshooting

### Facebook Webhook Not Firing

```bash
# Test webhook endpoint
curl -X GET "https://your-domain/api/webhooks/facebook-leads?hub.mode=subscribe&hub.verify_token=$META_WEBHOOK_VERIFY_TOKEN&hub.challenge=test123"
# Should return: test123
```

### Google Ads Conversion Not Uploading

```sql
-- Check for gclid in leads
SELECT COUNT(*), COUNT(gclid) FROM public_intake_leads
WHERE created_at > now() - interval '7 days';
```

### SMS Replies Not Classified

Check logs for Claude API errors. Verify ANTHROPIC_API_KEY is set.

## Phase 3 Success Metrics

| Metric | Target |
|--------|--------|
| Facebook lead volume | 50+ leads/week |
| Facebook lead quality | >= 50% convert to paid |
| Google Ads ROI | >= 2:1 (for every $1 spent, $2 revenue) |
| Inbound SMS escalation latency | < 1 min |
| Multi-channel deduplication accuracy | 99%+ |

## Rollout Schedule

**Week 1:** Facebook setup + testing (5–10 manual tests)
**Week 2:** Enable Facebook Lead Ads (live traffic)
**Week 3:** Google Ads setup + GCLID capture
**Week 4:** ROI dashboard live
**Week 5+:** Inbound SMS escalation, continuous optimization

## Next: Optimization & Analytics

Once all 3 phases are live (4–6 weeks):
- Review channel performance (which brings best leads?)
- Adjust scoring weights based on real conversion data
- A/B test SMS messaging
- Implement lead scoring rules by channel
- Scale highest-ROI channels

## Full 3-Phase Summary

| Phase | Lead Volume | Automation | Human Effort |
|-------|------------|-----------|--------------|
| 1 | Baseline | Scoring, SMS alerts | Manual qualification |
| 2 | +30% | AI qualification, auto-scheduling | Demo calls |
| 3 | +100% | Multi-channel, ROI tracking | Strategic optimization |

**Result:** 10–15 hot leads/week, auto-qualified, auto-scheduled, with clear ROI measurement.
