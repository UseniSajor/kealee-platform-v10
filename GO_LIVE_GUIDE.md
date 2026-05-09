# "Go Live" Explained: Complete Deployment Guide
## What It Means & How to Do It

**Date:** May 8, 2026  
**Status:** Ready for Go-Live  
**Timeline:** Can go live TODAY (1–2 hours)

---

## 🎯 What "Go Live" Means

**"Go Live" = Launch to Production**

It means switching from testing/development to **real customers sending real leads through your system**.

Before go-live:
- ❌ You're testing with fake/manual leads
- ❌ Real customers see "under construction" or forms don't work
- ❌ No real leads flowing through
- ❌ No revenue being generated

After go-live:
- ✅ Real customers submitting real intakes
- ✅ Real leads being scored automatically
- ✅ Real SMS alerts hitting your phone
- ✅ Real deals closing
- ✅ Real revenue flowing in

---

## 📋 Go-Live Checklist (Before You Launch)

### Prerequisites (MUST Have)

- [ ] **Environment Variables Set** (all 30+ in Vercel)
  - GHL, Twilio, Calendly, Slack, etc.
  - See: `ENV_VARS_QUICK_REFERENCE.md`

- [ ] **Database Migrations Applied** (all 4)
  - Phase 1 schema
  - Phase 2 schema
  - Phase 3 schema
  - Campaign schema
  - In: Supabase SQL Editor

- [ ] **Webhooks Registered** (3 active)
  - GHL webhook: `POST /api/webhooks/ghl`
  - Facebook webhook: `POST /api/webhooks/facebook-leads`
  - Nextdoor webhook: `POST /api/webhooks/nextdoor-leads`
  - Reddit webhook: `POST /api/webhooks/reddit-leads`

- [ ] **Cron Jobs Configured** (3 jobs)
  - Every 5 min: `/api/cron/lead-scoring`
  - Every 12h: `/api/cron/requalify-cold`
  - Mon 8 AM: `/api/cron/generate-weekly-campaigns`
  - Using: EasyCron, Railway, or similar

- [ ] **Vercel Deployment** (latest ready)
  - Latest deployment shows "Ready"
  - No build errors in logs

- [ ] **Slack Channels** (created & configured)
  - `#leads` (hot leads posted here)
  - `#urgent` (urgent escalations)
  - `#alerts` (errors)

### Testing (MUST Pass)

- [ ] **Verification scripts pass**
  ```bash
  pnpm run activate:phase1
  pnpm run test:ghl
  pnpm run test:marketing-setup
  ```

- [ ] **Manual lead test passes**
  1. Go to: `https://kealee.com/intake/concept`
  2. Fill form (budget=$50k, timeline=ASAP, upload photo)
  3. Submit payment (use Stripe test card: 4242 4242 4242 4242)
  4. Wait 5 minutes
  5. Verify:
     - ✅ SMS alert received on YOUR_SMS_NUMBER
     - ✅ Lead appears in Supabase with score + tag
     - ✅ GHL contact created
     - ✅ Slack notification in #leads

- [ ] **Endpoint checks**
  ```bash
  # Dashboard works
  curl -H "x-kealee-ops: $CRON_SECRET" \
    https://kealee.com/api/admin/marketing/dashboard
  
  # Returns JSON with metrics
  ```

---

## 🚀 Go-Live Process (Step by Step)

### Phase 1: Pre-Launch (1 hour before)

#### 1. Final Environment Verification
```bash
# Check all env vars are set in Vercel (10 min)
Vercel Dashboard → Settings → Environment Variables
✅ Count variables (should be 30+)
✅ Redeploy latest (force rebuild to load new vars)
```

#### 2. Database Verification
```sql
-- In Supabase SQL Editor, run these 4 checks:

-- Check Phase 1 tables exist
SELECT COUNT(*) FROM ghl_sync_log;      -- Should return 0
SELECT COUNT(*) FROM sms_alert_log;     -- Should return 0

-- Check Phase 2 tables exist
SELECT COUNT(*) FROM lead_notes;        -- Should return 0
SELECT COUNT(*) FROM calendly_events;   -- Should return 0

-- Check Phase 3 table exists
SELECT COUNT(*) FROM nextdoor_performance;  -- Should return 0

-- Check campaigns table exists
SELECT COUNT(*) FROM marketing_campaigns;   -- Should return 0
```

#### 3. Webhook Verification
```bash
# Test each webhook endpoint manually (10 min)

# GHL webhook test
curl -X POST https://kealee.com/api/webhooks/ghl \
  -H "x-ghl-signature: test" \
  -d '{}'

# Facebook webhook test
curl -X POST https://kealee.com/api/webhooks/facebook-leads \
  -d '{}'

# Nextdoor webhook test
curl -X POST https://kealee.com/api/webhooks/nextdoor-leads \
  -d '{}'

# Reddit webhook test
curl -X POST https://kealee.com/api/webhooks/reddit-leads \
  -d '{}'

# All should return success or validation errors (not 500 errors)
```

#### 4. Cron Job Verification
```bash
# Test each cron endpoint once manually (10 min)

# Lead scoring cron
curl -X POST https://kealee.com/api/cron/lead-scoring \
  -H "x-kealee-ops: $CRON_SECRET"

# Should return JSON: { "processed": 0, "hotCount": 0, ... }

# If it returns 200 OK, cron endpoint is working!
```

#### 5. Team Notification (5 min)
- Notify team: "Going live in 1 hour"
- Ask them to monitor Slack #leads
- Have backup phone number for SMS alerts

### Phase 2: The Launch (Flip the Switch)

#### 1. Enable Real Traffic (Go-Live Moment!)
```
STOP blocking intake forms or redirecting users
ENABLE Stripe to process LIVE (not test) charges
ENABLE real leads to flow through
```

**What happens:**
- Real users fill out forms
- Real payments process
- Real leads enter Supabase
- Phase 1 automation starts scoring them
- Your phone gets SMS alerts for hot leads

#### 2. Monitor First Hour
```
✅ Check Slack #leads channel (should see new leads appearing)
✅ Check Supabase: SELECT COUNT(*) FROM public_intake_leads  
   (should increase)
✅ Check your phone for SMS alerts (expect 1–3 in first hour)
✅ Check Vercel logs for any errors
```

#### 3. Test a Lead Submission
```
1. Have team member submit real intake
2. Fill: budget=$25k, timeline=ASAP, service=concept
3. Pay with personal Stripe card ($99–299)
4. Verify:
   ✅ Lead appears in Supabase within 1 min
   ✅ SMS alert hits your phone within 2 min
   ✅ GHL contact created within 5 min
   ✅ Slack notification posted
```

### Phase 3: Post-Launch (First Week)

#### 1. Daily Monitoring
```
Each morning (5 min):
- Check Slack #leads for overnight leads
- Run Supabase query:
  SELECT COUNT(*) FROM public_intake_leads 
  WHERE DATE(created_at) = TODAY();
- Verify SMS alerts received
- Check Vercel logs for errors
```

#### 2. Weekly Review (After Week 1)
```sql
-- Run this to see first week performance
SELECT
  COUNT(*) as total_leads,
  COUNT(CASE WHEN routing_tag = 'hot' THEN 1 END) as hot_leads,
  COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid,
  COUNT(CASE WHEN ghl_contact_id IS NOT NULL THEN 1 END) as ghl_synced
FROM public_intake_leads
WHERE created_at > now() - interval '7 days';

-- Expected:
-- total_leads: 20–50
-- hot_leads: 3–10
-- paid: 2–5
-- ghl_synced: 20–50 (should be 100%)
```

---

## 🛑 What NOT to Do on Launch Day

❌ **Don't:** Make code changes (code freezing)  
❌ **Don't:** Change environment variables without testing  
❌ **Don't:** Disable webhooks  
❌ **Don't:** Pause cron jobs  
❌ **Don't:** Test with real Stripe charges without monitoring  
❌ **Don't:** Change Twilio/GHL credentials  
❌ **Don't:** Launch when you won't be monitoring  

---

## 🆘 Troubleshooting During Launch

### Problem: No leads appearing

**Symptoms:** 
- Forms still converting
- But no leads in Supabase

**Solutions:**
1. Check Stripe webhook is processing payments
2. Check webhook logs in Vercel
3. Check Supabase connection string in env vars
4. Verify database migrations ran

### Problem: SMS not sending

**Symptoms:**
- Leads scoring
- But no SMS alerts

**Solutions:**
1. Check Twilio balance > $0.01
2. Check YOUR_SMS_NUMBER format (+1...)
3. Check Twilio API credentials correct
4. Check Vercel logs for Twilio errors

### Problem: GHL contacts not creating

**Symptoms:**
- Leads scoring
- But ghl_contact_id is NULL

**Solutions:**
1. Check GHL_API_KEY correct
2. Check GHL_LOCATION_ID correct
3. Check GHL location is active
4. Check API rate limits not exceeded

### Problem: Cron not running

**Symptoms:**
- Leads in Supabase with NULL lead_score
- No SMS alerts

**Solutions:**
1. Check cron job is active in EasyCron/Railway
2. Check cron endpoint is accessible
3. Check CRON_SECRET matches
4. Run manually: `curl -X POST https://kealee.com/api/cron/lead-scoring -H "x-kealee-ops: $CRON_SECRET"`

---

## 🔄 Rollback Procedures (If Something Goes Wrong)

### Quick Rollback (If in first 1 hour)

**Option 1: Disable Stripe charges**
- Vercel Dashboard → Environment Variables
- Set: `STRIPE_DISABLED=true`
- Redeploy
- Forms still work, but no payments process
- ⏱️ Time: 5 minutes

**Option 2: Pause cron jobs**
- Disable cron jobs in EasyCron/Railway
- Leads still come in, but don't get scored
- ⏱️ Time: 2 minutes

**Option 3: Full rollback**
- Revert latest Vercel deployment
- Go back to previous "Ready" deployment
- ⏱️ Time: 1 minute

### Standard Rollback (If issues continue)

1. Disable cron jobs (stop scoring)
2. Disable webhooks (GHL, Facebook, Nextdoor, Reddit)
3. Set: `MAINTENANCE_MODE=true` in env vars
4. Redirect intake forms to "maintenance" page
5. Investigate issues (24–48 hours)
6. Re-launch when fixed

---

## ✅ Success Indicators

### First Hour (Should See)
- [ ] 1–3 leads submitted
- [ ] All leads have scores
- [ ] 1–3 SMS alerts sent
- [ ] 0–1 leads in GHL

### First Day (Should See)
- [ ] 5–10 leads submitted
- [ ] 1–3 hot leads
- [ ] 5–10 SMS alerts sent
- [ ] 5–10 GHL contacts created
- [ ] At least 1 Slack #leads notification

### First Week (Should See)
- [ ] 20–50 leads submitted
- [ ] 3–10 hot leads
- [ ] 20–30% hot lead percentage
- [ ] 20–50 GHL contacts
- [ ] 2–5 SMS replies
- [ ] 1+ Calendly meetings scheduled

---

## 📊 Live Dashboard Monitoring

### Monitor Continuously During Launch

```bash
# Run this every 5 minutes to see live metrics:
curl -H "x-kealee-ops: $CRON_SECRET" \
  https://kealee.com/api/admin/marketing/dashboard | jq '
  {
    leadsToday: .phase1.leadsToday,
    hotLeadsToday: .phase1.hotLeadsToday,
    smsAlertsSent: .phase1.smsAlertsSent,
    ghlContacts: .phase1.ghlContactsCreated
  }'

# Or just open browser and watch Supabase table:
# https://app.supabase.com/project/[id]/editor/[schema].public_intake_leads
# (refresh every 2 min, should see new rows appearing)
```

---

## 🎯 Go-Live Timing

### Best Time to Launch
- **Tuesday–Thursday** (avoid Monday chaos, Friday unpredictable)
- **9 AM–2 PM** (daytime monitoring, team available)
- **Avoid:** Nights, weekends, holidays, company events
- **Team:** Have 2 people monitoring for first 2 hours

### Expected Launch Duration
- Prerequisites check: **10 min**
- Final testing: **20 min**
- Actual launch: **1 min** (flip switch)
- First day monitoring: **1 hour** (active)
- First week monitoring: **5 min/day**

---

## 📋 Go-Live Command Reference

```bash
# Pre-launch verification (run in terminal)
pnpm run activate:phase1
pnpm run test:ghl
pnpm run test:marketing-setup

# Test dashboard
curl -H "x-kealee-ops: $CRON_SECRET" \
  https://kealee.com/api/admin/marketing/dashboard

# Check real-time metrics
curl -H "x-kealee-ops: $CRON_SECRET" \
  https://kealee.com/api/admin/marketing/dashboard | jq .phase1

# Monitor Supabase in browser:
# https://app.supabase.com/project/[id]/editor
# Query: SELECT * FROM public_intake_leads ORDER BY created_at DESC LIMIT 10
```

---

## 🚀 Summary

**"Go Live" = Switch from Testing to Production**

**Before Launch:**
1. ✅ Set all environment variables
2. ✅ Apply all database migrations
3. ✅ Register all webhooks
4. ✅ Configure cron jobs
5. ✅ Run verification scripts
6. ✅ Test with manual lead

**During Launch:**
1. 🎯 Enable real traffic (flip the switch)
2. 📱 Monitor Slack, SMS, Supabase
3. 🧪 Submit test lead
4. ✅ Verify scoring, alerts, GHL sync

**After Launch:**
1. 📊 Monitor daily (5 min)
2. 📈 Track metrics
3. 🔄 Troubleshoot any issues
4. 🎉 Celebrate your first real leads!

---

## 🎯 You're Ready!

Everything is built, tested, and documented. You can go live **TODAY** if you want.

**Next Steps:**
1. Follow this checklist
2. Run verification scripts
3. Test one manual lead
4. Enable real traffic
5. Monitor first hour
6. You're live! 🎉

---

**Status:** ✅ Ready to Go-Live  
**Time Required:** 1–2 hours  
**Next Action:** Check off the Pre-Launch Checklist above  

Let's go live! 🚀
