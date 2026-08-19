# Kealee Marketing Automation: Monitoring & Logs Guide
## Where to Check Everything

**Date:** May 8, 2026  
**Status:** Complete Monitoring Setup  

---

## 🔍 Real-Time Monitoring Locations

### 1. Vercel Logs (Deployment & Errors)

**URL:** `https://vercel.com/your-account/kealee-platform-v10/deployments`

**What to check:**
- Deployment status (should be "Ready")
- Build logs (errors during build)
- Function logs (runtime errors)
- Edge logs (middleware issues)

**How to access:**
1. Click latest deployment
2. Click "Logs" tab
3. Select "Runtime logs" or "Build logs"
4. Search for errors

---

### 2. Supabase Logs (Database & API)

**URL:** `https://app.supabase.com/project/[project-id]/logs`

**What's available:**
- Database queries
- API requests
- Authentication
- Real-time subscriptions
- Errors

**How to access:**
1. Go to Supabase Dashboard
2. Click "Logs" (left sidebar)
3. View by type:
   - API → REST API calls
   - Realtime → Subscriptions
   - Database → SQL queries
   - Auth → Login attempts

---

### 3. Supabase Database Tables (Data Tracking)

**Direct table queries:** (Run in Supabase SQL editor)

#### Phase 1: Lead Scoring
```sql
-- Recent scored leads
SELECT 
  id, name, email, lead_score, routing_tag, created_at
FROM public_intake_leads
WHERE lead_score IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

-- Today's hot leads
SELECT COUNT(*) as hot_leads_today
FROM public_intake_leads
WHERE routing_tag = 'hot'
AND created_at > now() - interval '24 hours';

-- SMS alert log
SELECT 
  intake_id, message, status, sent_at, error_message
FROM sms_alert_log
ORDER BY sent_at DESC
LIMIT 20;

-- GHL sync status
SELECT 
  intake_id, action, ghl_contact_id, error_message, created_at
FROM ghl_sync_log
ORDER BY created_at DESC
LIMIT 20;
```

#### Phase 2: AI Qualification
```sql
-- Qualified leads
SELECT 
  id, name, ai_qualification_score, ai_qualification_recommendation, qualified_at
FROM public_intake_leads
WHERE ai_qualification_score IS NOT NULL
ORDER BY qualified_at DESC
LIMIT 10;

-- Lead notes (SMS replies)
SELECT 
  intake_id, note, note_type, ai_classified_as, created_at
FROM lead_notes
WHERE note_type = 'sms_reply'
ORDER BY created_at DESC
LIMIT 20;

-- Calendly events scheduled
SELECT 
  intake_id, scheduled_at, status, guest_email
FROM calendly_events
ORDER BY scheduled_at DESC
LIMIT 10;
```

#### Phase 3: Multi-Channel ROI
```sql
-- Leads by source
SELECT 
  source_channel, COUNT(*) as count
FROM public_intake_leads
WHERE created_at > now() - interval '7 days'
GROUP BY source_channel
ORDER BY count DESC;

-- Campaign performance
SELECT 
  campaign_id, sent_at, recipients_count, open_rate, click_rate, leads_generated, attributed_revenue
FROM marketing_campaigns
WHERE sent_at > now() - interval '7 days'
ORDER BY attributed_revenue DESC;

-- Weekly summary
SELECT 
  week_number, total_campaigns, total_sent, average_open_rate, average_click_rate, total_leads, total_revenue
FROM campaign_weekly_summary
ORDER BY week_number DESC
LIMIT 4;

-- Nextdoor performance
SELECT 
  neighborhood, city, leads_count, paid_leads, cost_per_lead, roi
FROM nextdoor_performance
ORDER BY roi DESC;
```

---

### 4. API Dashboard Endpoints (Real-Time Metrics)

**Real-time dashboard:**
```bash
curl -H "x-kealee-ops: $CRON_SECRET" \
  https://kealee.com/api/admin/marketing/dashboard
```

**Response shows:**
```json
{
  "phase1": {
    "leadsToday": 12,
    "hotLeadsToday": 3,
    "hotPercentageToday": "25%",
    "smsAlertsSent": 3,
    "ghlContactsCreated": 12
  },
  "phase2": {
    "aiQualifiedToday": 1,
    "calendlyEventsScheduled": 1
  },
  "weekly": {
    "totalLeads": 50,
    "hotLeads": 8,
    "hotPercentage": "16%"
  }
}
```

---

### 5. Slack Notifications (Real-Time Alerts)

**Channels to check:**
- `#leads` — Hot leads, daily digest
- `#urgent` — Urgent replies, escalations
- `#alerts` — Errors, failures

**What appears:**
- New hot leads (auto-posted)
- Qualified leads (AI score)
- Scheduled calls (Calendly)
- Errors from cron jobs
- SMS alerts

---

### 6. Application Logs (Errors & Debug)

**In Next.js** (Server-side logging):
```bash
# View logs in Vercel
1. Vercel Dashboard
2. Deployment → Logs
3. Filter: "ERROR" or "WARN"
```

**Check for:**
- GHL API errors
- Twilio SMS failures
- Claude API timeouts
- Database connection issues
- Webhook failures

---

## 📊 Monitoring Dashboards

### Phase 1 Health Check (Daily)

```sql
-- Run this daily to check Phase 1 status
SELECT
  DATE(created_at) as date,
  COUNT(*) as total_leads,
  COUNT(CASE WHEN routing_tag = 'hot' THEN 1 END) as hot_leads,
  COUNT(CASE WHEN routing_tag = 'hot' THEN 1 END)::float / COUNT(*) * 100 as hot_percent,
  COUNT(CASE WHEN ghl_contact_id IS NOT NULL THEN 1 END) as ghl_synced,
  (SELECT COUNT(*) FROM sms_alert_log WHERE sent_at::date = DATE(now()) AND status = 'sent') as sms_sent
FROM public_intake_leads
WHERE created_at > now() - interval '24 hours'
GROUP BY DATE(created_at);
```

**Expected results:**
- Total leads: 5–10+ per day
- Hot leads: 1–3 per day
- Hot percent: 15–25%
- GHL synced: 100%
- SMS sent: > 95%

### Phase 2 Health Check (Daily)

```sql
-- Run this daily to check Phase 2 status
SELECT
  COUNT(DISTINCT intake_id) as sms_replies,
  COUNT(CASE WHEN ai_classification_score > 75 THEN 1 END) as qualified_replies,
  (SELECT COUNT(*) FROM calendly_events WHERE created_at::date = DATE(now())) as calendly_scheduled,
  COUNT(DISTINCT CASE WHEN ai_classified_as = 'urgent' THEN intake_id END) as urgent_replies
FROM lead_notes
WHERE note_type = 'sms_reply'
AND created_at > now() - interval '24 hours';
```

**Expected results:**
- SMS replies: 2–5 per day
- Qualified: 1–2 per day
- Calendly scheduled: 1+ per day
- Urgent: 0–1 per day

### Phase 3 Health Check (Daily)

```sql
-- Run this daily to check Phase 3 status
SELECT
  source_channel,
  COUNT(*) as count,
  COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid,
  ROUND(COUNT(CASE WHEN status = 'paid' THEN 1 END)::float / COUNT(*) * 100, 2) as conversion_pct
FROM public_intake_leads
WHERE created_at > now() - interval '24 hours'
GROUP BY source_channel
ORDER BY count DESC;
```

**Expected results:**
- Web: 3–5 leads
- Facebook: 2–5 leads
- Google: 1–3 leads
- Nextdoor: 1–3 leads
- Conversion: 10–20%

---

## 🚨 Error Logs to Check

### Check for SMS Failures
```sql
SELECT 
  intake_id, error_message, sent_at
FROM sms_alert_log
WHERE status = 'failed'
ORDER BY sent_at DESC
LIMIT 10;

-- If errors, check:
-- 1. Twilio balance
-- 2. YOUR_SMS_NUMBER format (+1...)
-- 3. Rate limits
```

### Check for GHL Sync Failures
```sql
SELECT 
  intake_id, action, error_message, created_at
FROM ghl_sync_log
WHERE error_message IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

-- If errors, check:
-- 1. GHL_API_KEY valid
-- 2. GHL location active
-- 3. API rate limits
```

### Check for Webhook Failures
```bash
# In Vercel logs, search for:
- "Webhook error"
- "POST /api/webhooks" with 400/500 errors
- "Facebook webhook signature mismatch"
- "Nextdoor payload invalid"
```

### Check for Cron Job Failures
```bash
# In Vercel logs, search for:
- "Unauthorized" (check CRON_SECRET)
- "Database connection failed"
- "No campaigns scheduled"
- "Cannot read property" (code errors)

# Or query manually:
curl -H "x-kealee-ops: $CRON_SECRET" \
  https://kealee.com/api/cron/lead-scoring
```

---

## 📈 Weekly Reporting Queries

### Weekly Summary
```sql
SELECT
  'Week ' || EXTRACT(WEEK FROM now()) as week,
  COUNT(*) as total_leads,
  COUNT(CASE WHEN routing_tag = 'hot' THEN 1 END) as hot_leads,
  COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_leads,
  COUNT(CASE WHEN ai_qualification_recommendation = 'qualify' THEN 1 END) as qualified,
  (SELECT COUNT(*) FROM calendly_events WHERE created_at > now() - interval '7 days') as meetings_scheduled
FROM public_intake_leads
WHERE created_at > now() - interval '7 days';
```

### Top Performing Campaigns
```sql
SELECT
  campaign_id, product_id, persona_id,
  recipients_count, open_rate, click_rate, leads_generated, attributed_revenue
FROM marketing_campaigns
WHERE sent_at > now() - interval '7 days'
ORDER BY attributed_revenue DESC
LIMIT 10;
```

### ROI by Source
```sql
SELECT
  source_channel,
  COUNT(*) as leads,
  COUNT(CASE WHEN status = 'paid' THEN 1 END) as conversions,
  ROUND(COUNT(CASE WHEN status = 'paid' THEN 1 END)::float / COUNT(*) * 100, 2) as conversion_rate,
  ROUND(AVG(CASE WHEN status = 'paid' THEN 1500 ELSE 0 END), 2) as avg_deal_value
FROM public_intake_leads
WHERE created_at > now() - interval '7 days'
GROUP BY source_channel
ORDER BY avg_deal_value DESC;
```

---

## 🔔 Key Metrics to Monitor Daily

| Metric | Target | Where to Check |
|--------|--------|-----------------|
| Leads scored | 5–10+/day | Supabase table |
| Hot leads % | 15–20% | Supabase query |
| SMS delivery | 99%+ | sms_alert_log |
| GHL sync | 100% | ghl_sync_log |
| SMS replies | 2–5/day | lead_notes |
| Qualified % | 50%+ | AI scores |
| Meetings scheduled | 1+/day | calendly_events |
| Multi-channel volume | 20–30/day | source_channel |

---

## 🛠️ Troubleshooting Logs

### "Leads not scoring"
```sql
SELECT * FROM public_intake_leads
WHERE status = 'new' AND lead_score IS NULL
ORDER BY created_at DESC;

-- If empty, good! All leads scored.
-- If not empty, check Vercel logs for cron errors.
```

### "SMS not sending"
```sql
SELECT * FROM sms_alert_log
WHERE status IN ('failed', 'bounced')
ORDER BY sent_at DESC
LIMIT 5;

-- Check error message, verify Twilio account
```

### "No GHL contacts"
```sql
SELECT * FROM ghl_sync_log
WHERE action = 'error'
ORDER BY created_at DESC
LIMIT 5;

-- Check error message, verify GHL credentials
```

### "Campaigns not sending"
```sql
SELECT * FROM marketing_campaigns
WHERE status = 'scheduled'
AND scheduled_day = 'Monday';

-- Should transition to 'sent' at 9 AM
-- Check Vercel logs for send-daily-campaigns errors
```

---

## 📱 Mobile/Quick Checks

### Quick Terminal Check
```bash
# Test Phase 1
curl -H "x-kealee-ops: $CRON_SECRET" \
  https://kealee.com/api/admin/marketing/dashboard | jq .phase1

# Test Phase 2
curl -H "x-kealee-ops: $CRON_SECRET" \
  https://kealee.com/api/admin/marketing/dashboard | jq .phase2

# Test Phase 3
curl -H "x-kealee-ops: $CRON_SECRET" \
  https://kealee.com/api/admin/marketing/dashboard | jq .phase3
```

### Quick Supabase Check (Copy-paste these)

**Today's leads:**
```sql
SELECT COUNT(*) FROM public_intake_leads WHERE DATE(created_at) = TODAY();
```

**Today's hot leads:**
```sql
SELECT COUNT(*) FROM public_intake_leads WHERE routing_tag = 'hot' AND DATE(created_at) = TODAY();
```

**SMS sent today:**
```sql
SELECT COUNT(*) FROM sms_alert_log WHERE DATE(sent_at) = TODAY() AND status = 'sent';
```

---

## ✅ Daily Monitoring Checklist

- [ ] Check Vercel deployment (should be "Ready")
- [ ] Run: `SELECT COUNT(*) FROM public_intake_leads WHERE DATE(created_at) = TODAY()`
- [ ] Check Slack #leads channel (should have posts)
- [ ] Run daily summary query (see above)
- [ ] Check for any errors in Vercel logs
- [ ] Verify at least 1 hot lead scored today
- [ ] Verify SMS alerts being sent
- [ ] Monitor ROI by channel

---

## 📚 Monitoring Files

- `ENVIRONMENT_VARIABLES_COMPLETE.md` — Env vars (needed for API calls)
- `KEALEE_MARKETING_DEPLOYMENT.md` — Deployment setup
- `DEPLOYMENT_COMPLETE_SUMMARY.md` — Overall architecture

---

## 🚀 Summary

**Vercel Logs:** Real-time errors + deployment status  
**Supabase Tables:** Historical data, queries, analysis  
**API Dashboard:** Real-time metrics (1 API call)  
**Slack:** Notifications (real-time)  
**SQL Queries:** Custom analysis, health checks  

**Most important:** Check Supabase daily with the "Health Check" queries above.

---

**Status:** Monitoring system ready  
**Next:** Set up your daily monitoring routine!
