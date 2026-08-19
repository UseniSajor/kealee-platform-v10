# Kealee Marketing Automation: Complete Deployment Guide

**Status:** Ready for Full Production Deployment  
**Date:** May 8, 2026  
**Target:** Automate all lead processing, scoring, scheduling, and ROI tracking

---

## Quick Deploy Checklist (30 minutes to Phase 1 live)

- [ ] **5 min:** Set environment variables in Vercel
- [ ] **5 min:** Run database migrations in Supabase
- [ ] **5 min:** Register GHL webhook
- [ ] **5 min:** Enable cron job (every 5 min)
- [ ] **5 min:** Run verification: `pnpm run activate-phase1`
- [ ] **5 min:** Test with manual lead submission
- [ ] **Go live!**

---

## 6-Week Deployment Timeline

### Week 1: Phase 1 Live (Lead Scoring + SMS)
- Mon: Set environment variables
- Tue: Apply database migrations
- Wed: Register webhooks + cron job
- Thu: Verification + testing
- Fri: Go live with real traffic

**Expected:** 5–10 hot leads/day, SMS alerts, GHL contacts

### Week 2: Phase 1 Optimization
- Monitor scoring accuracy
- Adjust weights based on lead quality
- Gather GHL workflow IDs

**Expected:** Stable lead flow, accurate scoring

### Week 3–4: Phase 2 Live (AI Qualification + Calendly)
- Deploy AI qualifier
- Set up Calendly integration
- Enable Slack feed
- Test auto-scheduling

**Expected:** 50%+ of hot leads auto-scheduled

### Week 5–6: Phase 3 Live (Multi-Channel + ROI)
- Set up Facebook Lead Ads
- Configure Google Ads tracking
- Enable inbound SMS escalation
- Launch ROI dashboard

**Expected:** 100–150 leads/week, ROI tracked, 2:1+ return

---

## PHASE 1: Complete Activation

### Step 1: Environment Variables (Vercel Settings)

Go to Vercel Dashboard → Settings → Environment Variables

**Production environment:**

```
GHL_API_KEY=<your-ghl-api-key>
GHL_LOCATION_ID=<your-ghl-location-id>
GHL_WEBHOOK_SECRET=<create-random-secret-32-chars>

TWILIO_ACCOUNT_SID=<your-twilio-sid>
TWILIO_AUTH_TOKEN=<your-twilio-token>
TWILIO_PHONE=+1xxxxxxxxxx
YOUR_SMS_NUMBER=+1xxxxxxxxxx

CRON_SECRET=<create-random-secret-32-chars>
```

**Get these from:**
- **GHL:** GoHighLevel App → Settings → API Keys
- **Twilio:** Twilio Console → Account SID, Auth Token, Phone Numbers
- **YOUR_SMS_NUMBER:** Your personal cell phone (receives hot lead alerts)

### Step 2: Database Migrations (Supabase)

1. Go to Supabase Dashboard → SQL Editor
2. Copy entire contents of: `_docs/migrations/001-marketing-phase1-schema.sql`
3. Paste into SQL editor
4. Click "Run"
5. Verify tables created: `ghl_sync_log`, `sms_alert_log`
6. Verify columns added to `public_intake_leads`

### Step 3: GHL Webhook Registration

1. Log in to GoHighLevel
2. Go to App Settings → Integrations → Webhooks
3. Create new webhook:
   - **URL:** `https://kealee.com/api/webhooks/ghl` (your domain)
   - **Secret:** Use `GHL_WEBHOOK_SECRET` from Step 1
   - **Events:** Select "Contact Updated", "Opportunity Stage Changed"
4. Save and test webhook

### Step 4: Enable Cron Job

Choose your deployment platform:

**Vercel (Recommended):**
- Use external cron service: EasyCron, Cronitor, or UpTime Robot
- Endpoint: `POST https://kealee.com/api/cron/lead-scoring`
- Frequency: Every 5 minutes
- Headers: `x-kealee-ops: <CRON_SECRET>`

**Railway:**
- Create trigger in Railway dashboard
- Endpoint: `/api/cron/lead-scoring`
- Frequency: Every 5 minutes

**Setup link:** https://www.easycron.com (Free tier: up to 60 jobs/hour)

### Step 5: Verification

Run activation script:

```bash
pnpm run activate-phase1
```

This checks:
- ✅ All environment variables set
- ✅ GHL API connectivity
- ✅ Twilio SMS working
- ✅ Supabase database ready
- ✅ Displays next steps

Expected output:
```
✅ GHL location connected: "Your Location"
✅ Twilio account connected
   Name: Kealee SMS
   Balance: $XX.XX
   Phone: +1234567890

✅ Phase 1 activation complete!
```

### Step 6: Test with Manual Lead

1. Go to: `https://kealee.com/intake/concept` (or `/estimate` or `/permits`)
2. Fill form:
   - Name: "Test Lead"
   - Email: your email
   - Budget: $50,000
   - Timeline: ASAP
   - Upload any photo
3. Submit and complete payment

**Wait 5 minutes for cron job to run**

Expected:
- ✅ SMS alert to `YOUR_SMS_NUMBER` within 2 min
- ✅ Supabase: `lead_score = 80+`, `routing_tag = 'hot'`
- ✅ GHL: New contact created with tags
- ✅ `ghl_sync_log`: Record of sync with success

### Step 7: Go Live!

Once test passes:

1. Enable cron job to run continuously
2. Enable GHL webhook (should already be active)
3. Start directing real traffic to `/intake/*` forms
4. Monitor: Check GHL + SMS alerts daily
5. After 50 leads: Review scoring accuracy, adjust weights if needed

---

## PHASE 2: AI Qualification + Calendly (Week 3–4)

### Step 1: Calendly Integration

1. Go to Calendly → Settings → Integrations → API Tokens
2. Create API token, copy value
3. Find your calendar UUID:
   ```bash
   curl -H "Authorization: Bearer <token>" \
     https://api.calendly.com/users/me | grep -i uri
   ```
4. Set Vercel environment:
   ```
   CALENDLY_API_TOKEN=<token>
   CALENDLY_CALENDAR_UUID=<uuid>
   ```

### Step 2: Slack Webhook

1. Go to Slack → Your Workspace → Apps
2. Create or open "Kealee" app
3. Enable Incoming Webhooks
4. Create new webhook for `#leads` channel
5. Copy webhook URL to Vercel:
   ```
   SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
   ```

### Step 3: Deploy Database Migration

In Supabase SQL Editor, run:

```sql
-- _docs/migrations/002-marketing-phase2-schema.sql
```

Creates: `lead_notes`, `calendly_events` tables

### Step 4: Enable Features

In Vercel environment, set:

```
PHASE2_ENABLED=true
```

### Step 5: Test Phase 2

1. Submit hot lead (same as Phase 1 test)
2. You receive SMS alert
3. Reply to SMS: "Yeah, interested, next week works"
4. System receives reply, Claude qualifies it
5. You receive Calendly availability SMS
6. Click slot → event created
7. Check Slack: New notification with lead + call time

---

## PHASE 3: Multi-Channel + ROI (Week 5–6)

### Facebook Lead Ads Setup

1. Go to Facebook Business Manager → Ads Manager
2. Create Lead Ads campaign
3. Add custom form fields (service, budget, timeline)
4. Configure webhook:
   - URL: `https://kealee.com/api/webhooks/facebook-leads`
   - Secret: Set `META_WEBHOOK_VERIFY_TOKEN`

### Google Ads Setup

1. Go to Google Ads → Tools → Conversions
2. Create conversion action "Lead - Paid"
3. Note the conversion ID
4. Set Vercel environment:
   ```
   GOOGLE_CONVERSION_ID=...
   ```

### Deploy Phase 3

In Supabase SQL Editor, run:

```sql
-- _docs/migrations/003-marketing-phase3-schema.sql
```

---

## Monitoring & Health Checks

### Daily Checklist

```
✅ Check Slack #leads channel (hot leads posted)
✅ Check Supabase: new leads appearing with scores
✅ Check GHL: contacts created + tagged
✅ Check SMS logs: delivery rate > 95%
✅ Check ghl_sync_log: no errors
```

### Weekly Review

```sql
-- Top performing scoring
SELECT routing_tag, COUNT(*) as count
FROM public_intake_leads
WHERE created_at > now() - interval '7 days'
GROUP BY routing_tag;

-- SMS delivery rate
SELECT 
  COUNT(*) as total,
  COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent,
  ROUND(COUNT(CASE WHEN status = 'sent' THEN 1 END)::float / COUNT(*) * 100, 2) as rate
FROM sms_alert_log
WHERE sent_at > now() - interval '7 days';

-- GHL sync success
SELECT 
  action,
  COUNT(*) as count,
  COUNT(CASE WHEN error_message IS NULL THEN 1 END) as success
FROM ghl_sync_log
WHERE created_at > now() - interval '7 days'
GROUP BY action;
```

### Monthly ROI Review

```sql
SELECT
  COUNT(*) as total_leads,
  COUNT(CASE WHEN routing_tag = 'hot' THEN 1 END) as hot_leads,
  COUNT(CASE WHEN routing_tag = 'hot' THEN 1 END)::float / COUNT(*) as hot_pct,
  COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_leads,
  COUNT(CASE WHEN ai_qualification_recommendation = 'qualify' THEN 1 END) as qualified
FROM public_intake_leads
WHERE created_at > now() - interval '30 days';
```

---

## Dashboard Access

View real-time metrics:

```bash
curl -H "x-kealee-ops: $CRON_SECRET" \
  https://kealee.com/api/admin/marketing/dashboard
```

Response shows:
- Today: leads, hot leads, SMS sent, GHL synced
- Weekly: total leads, hot %, trends
- Monthly: paid leads, revenue, ROI
- By source: Facebook, Google, Web, etc.

---

## Troubleshooting

### SMS Not Sending

**Check:**
1. Twilio balance > $0.01
2. `YOUR_SMS_NUMBER` is international format: `+1...`
3. Logs: `SELECT * FROM sms_alert_log WHERE status='failed'`

**Fix:**
- Reload Twilio credentials
- Verify phone numbers exact format

### GHL Contact Not Creating

**Check:**
1. `GHL_API_KEY` is correct
2. `GHL_LOCATION_ID` is correct
3. Logs: `SELECT * FROM ghl_sync_log WHERE action='error'`

**Fix:**
- Re-verify credentials from GHL app settings
- Check GHL location is active

### Cron Job Not Running

**Check:**
1. EasyCron/Cronitor shows job running
2. Logs: Check if endpoint returns 200 OK

**Fix:**
- Add job to EasyCron manually
- Verify `CRON_SECRET` matches exactly
- Test endpoint manually: `curl -H "x-kealee-ops: $CRON_SECRET" https://kealee.com/api/cron/lead-scoring`

---

## Success Metrics

### Phase 1 (Week 1–2)
- ✅ 20+ leads/week appearing
- ✅ 15–20% scoring as "hot"
- ✅ SMS alerts within 2 minutes
- ✅ 100% of hot leads synced to GHL
- ✅ 80%+ scoring accuracy (manual review)

### Phase 2 (Week 3–4)
- ✅ 30–40% SMS response rate
- ✅ 75%+ AI qualification accuracy
- ✅ 50%+ of qualified leads auto-scheduled
- ✅ Daily Slack digest delivered

### Phase 3 (Week 5–6)
- ✅ 100–150 total leads/week
- ✅ Multi-channel tracking working
- ✅ ROI dashboard live
- ✅ 2:1+ revenue to spend ratio

---

## Rollback Procedures

**If Phase 1 causes issues:**
1. Disable cron job (remove from EasyCron)
2. Disable GHL webhook
3. Stop SMS alerts
4. Leads still stored in Supabase, no data loss

**If Phase 2 causes issues:**
1. Disable requalify-cold cron
2. Disable Slack notifications
3. Disable AI qualifier
4. Fall back to manual qualification

**If Phase 3 causes issues:**
1. Disable Facebook webhook
2. Disable Google conversion tracking
3. Continue with Phases 1–2

---

## Support

- **Quick Questions:** Check `COMPLETE_MARKETING_AUTOMATION_GUIDE.md`
- **Phase 1 Help:** `PHASE1_IMPLEMENTATION_README.md`
- **Phase 2 Help:** `PHASE2_IMPLEMENTATION_README.md`
- **Phase 3 Help:** `PHASE3_IMPLEMENTATION_README.md`
- **Config Reference:** `lib/marketing/kealee-config.ts`

---

## Next Steps After Going Live

**Week 2:**
- [ ] Review scoring accuracy (80%+?)
- [ ] Identify top-performing source channels
- [ ] Gather feedback from manual lead review

**Week 4:**
- [ ] Review AI qualification accuracy
- [ ] Check Calendly show rate
- [ ] Plan Facebook/Google budget

**Week 6:**
- [ ] Review ROI by channel
- [ ] Optimize spend toward best channels
- [ ] Plan next optimization round

---

**Ready to deploy? Start with Step 1 above!**

Expected: 30 min to Phase 1 live, 6 weeks to full automation

Questions? See the detailed READMEs or run `pnpm run activate-phase1` for guidance.
