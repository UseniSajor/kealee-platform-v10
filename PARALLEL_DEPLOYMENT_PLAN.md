# Parallel Deployment Plan
## Marketing Automation + Lead Generation (Week of May 8–15, 2026)

**Status:** Ready to Execute  
**Timeline:** 5 working days (May 9–15)  
**Team Size:** 1–2 people recommended  
**Outcome:** Live system + first ad campaigns running

---

## Executive Summary

### What Happens This Week

```
AUTOMATION TRACK (Day 1–2)          LEAD GENERATION TRACK (Day 1–5)
├─ Deploy to Vercel              ├─ Build landing pages
├─ Set env vars                  ├─ Create lead capture forms
├─ Apply migrations              ├─ Set up email sequences
├─ Configure webhooks            ├─ Launch Facebook ads
├─ Test cron jobs                └─ Launch Google ads
└─ Go live!

BY END OF WEEK:
✅ System processing real leads
✅ SMS alerts working
✅ GHL syncing contacts
✅ Facebook ads running
✅ Google ads running
✅ First leads coming through both paths
```

---

## Track 1: Deploy Marketing Automation (Days 1–2)

### Day 1: Code Deployment

#### Morning (9 AM–12 PM)

```bash
# 1. All code already committed
# Verify latest deployment is "Ready" in Vercel
# Dashboard: https://vercel.com/dashboard

# Expected: Deployment 70f44570 shows "Ready" ✓

# 2. Check build succeeded
# If NOT ready → Check build logs for errors
# If ready → Continue to Day 1 afternoon
```

**Action Items:**
- [ ] Open Vercel dashboard
- [ ] Confirm deployment 70f44570 is "Ready"
- [ ] If not ready, check logs and fix errors
- [ ] Screenshot: Deployment ready

#### Afternoon (1 PM–5 PM)

```bash
# Run from terminal in workspace:

# 1. Verify environment variables in Vercel
# Go to: Settings → Environment Variables
# Should see 30+ variables
# Count them and verify

# 2. Set missing variables if needed
# Reference: ENV_VARS_QUICK_REFERENCE.md
# Copy all variables to Vercel dashboard

# 3. Trigger redeploy with new env vars
# Vercel → Deployments → Redeploy latest
# Wait for build to complete (5–10 min)
```

**Action Items:**
- [ ] Count env vars in Vercel (should be 30+)
- [ ] Add any missing vars from quick reference
- [ ] Trigger redeploy
- [ ] Wait for build to complete

### Day 2: Infrastructure Setup

#### Morning (9 AM–12 PM): Database Migrations

```bash
# Go to Supabase SQL Editor
# https://app.supabase.com/project/[YOUR_ID]/sql

# Run each migration one at a time, in order:

# MIGRATION 1: Phase 1 (Lead Scoring)
# File: _docs/migrations/001-marketing-phase1-schema.sql
# Copy entire SQL → Paste in editor → Click "Run"
# Wait for completion (should be <1s)

# MIGRATION 2: Phase 2 (AI Qualification)
# File: _docs/migrations/002-marketing-phase2-schema.sql
# Copy entire SQL → Paste in editor → Click "Run"

# MIGRATION 3: Phase 3 (Multi-channel)
# File: _docs/migrations/003-marketing-phase3-schema.sql
# Copy entire SQL → Paste in editor → Click "Run"

# MIGRATION 4: Campaigns
# File: _docs/migrations/004-marketing-campaigns-schema.sql
# Copy entire SQL → Paste in editor → Click "Run"

# Verify all succeeded (you'll see "Success" message)
```

**Action Items:**
- [ ] Apply migration 001 (Phase 1)
- [ ] Apply migration 002 (Phase 2)
- [ ] Apply migration 003 (Phase 3)
- [ ] Apply migration 004 (Campaigns)
- [ ] Screenshot: All migrations applied

#### Afternoon (1 PM–5 PM): Webhooks & Cron

```bash
# 1. REGISTER WEBHOOKS

# GHL Webhook
# Dashboard: goHighLevel.com → Settings → Webhooks
# Add webhook:
#   URL: https://kealee.com/api/webhooks/ghl
#   Events: contact.updated, opportunity.stage_changed
#   Click "Activate"

# Facebook Webhook
# Dashboard: facebook.com/developers → Your App → Webhooks
# Add webhook:
#   URL: https://kealee.com/api/webhooks/facebook-leads
#   Verify Token: Any random string
#   Events: lead_ads_thru_page
#   Click "Subscribe"

# 2. CONFIGURE CRON JOBS

# Using EasyCron (easycron.com) or similar:

# Cron 1: Lead Scoring (every 5 minutes)
# URL: https://kealee.com/api/cron/lead-scoring
# Headers: x-kealee-ops: [CRON_SECRET]
# Frequency: */5 * * * *

# Cron 2: Requalify Cold (every 12 hours)
# URL: https://kealee.com/api/cron/requalify-cold
# Headers: x-kealee-ops: [CRON_SECRET]
# Frequency: 0 */12 * * *

# Cron 3: Generate Campaigns (Mon 8 AM ET)
# URL: https://kealee.com/api/cron/generate-weekly-campaigns
# Headers: x-kealee-ops: [CRON_SECRET]
# Frequency: 0 8 * * 1 (Monday 8 AM ET)
```

**Action Items:**
- [ ] Register GHL webhook
- [ ] Register Facebook webhook
- [ ] Set up 3 cron jobs in EasyCron
- [ ] Test each webhook (manual call to endpoint)
- [ ] Screenshot: All webhooks active

### Day 2 Evening: Verification

```bash
# Run verification script:
pnpm run activate:phase1

# Expected output:
# ✓ Environment variables present
# ✓ Database connections working
# ✓ Webhooks responding
# ✓ Cron jobs configured
# ✓ System ready for go-live

# If ANY test fails:
# 1. Screenshot the error
# 2. Check corresponding section in GO_LIVE_GUIDE.md
# 3. Fix and re-run
```

**Action Items:**
- [ ] Run `pnpm run activate:phase1`
- [ ] Verify all tests pass
- [ ] If fails, troubleshoot using GO_LIVE_GUIDE.md

---

## Track 2: Build Lead Generation (Days 1–5)

### Day 1: Landing Page Setup

#### Morning (9 AM–12 PM): Create Page Structure

```bash
# Create Next.js pages for landing pages:

mkdir -p apps/web-main/app/landing/{concept-design,cost-estimation,permits}

# Create files:
# apps/web-main/app/landing/concept-design/page.tsx
# apps/web-main/app/landing/cost-estimation/page.tsx
# apps/web-main/app/landing/permits/page.tsx

# Each file starts with basic structure:
# - Hero section
# - Problem section
# - Solution section
# - How it works
# - Pricing
# - CTA button
# - Social proof
# - FAQ
```

**Action Items:**
- [ ] Create landing page directories
- [ ] Create page.tsx files (skeleton)
- [ ] Commit to git

#### Afternoon (1 PM–5 PM): Build Concept Design Page

```bash
# Build full concept-design landing page
# Use template from LEAD_GENERATION_SYSTEM.md

# Key sections to implement:
# 1. Hero with CTA
# 2. Problem (expensive architects)
# 3. Solution (affordable + fast)
# 4. How It Works (4 steps)
# 5. Pricing ($299)
# 6. Social Proof (testimonials)
# 7. FAQ (5 common questions)
# 8. Final CTA

# Make it beautiful:
# - Use Tailwind for styling
# - Add images/icons
# - Responsive design (mobile first)
# - Fast loading (<3s)

# Expected time: 2–3 hours
```

**Action Items:**
- [ ] Design hero section
- [ ] Add problem/solution sections
- [ ] Create pricing card
- [ ] Add testimonials
- [ ] Add FAQ
- [ ] Style with Tailwind
- [ ] Test on mobile

### Day 2: Landing Pages (Continued)

#### Morning (9 AM–12 PM): Build Cost Estimation Page

```bash
# Use same structure as concept-design page
# But change for cost estimation use case:

# Hero: "Know the Real Cost Before You Start"
# Problem: Contractor quotes are all over the place
# Solution: AI-powered cost breakdown
# Pricing: $99–499 depending on project size
# CTA: "Get Your Estimate"

# Expected time: 2 hours
```

**Action Items:**
- [ ] Build cost-estimation/page.tsx
- [ ] Add specific copy for estimation
- [ ] Style and test

#### Afternoon (1 PM–5 PM): Build Permits Page

```bash
# Same structure again:

# Hero: "Navigate Permits Without the Headache"
# Problem: Permits are confusing / slow / expensive
# Solution: AI-guided permit preparation
# Pricing: $199–699
# CTA: "Start Permit Process"

# Expected time: 2 hours
```

**Action Items:**
- [ ] Build permits/page.tsx
- [ ] Add specific copy for permits
- [ ] Style and test
- [ ] Commit all 3 pages

### Day 3: Lead Capture Infrastructure

#### Morning (9 AM–12 PM): Email Capture Setup

```bash
# 1. Create lead capture API endpoint

# File: apps/web-main/app/api/lead-capture/route.ts
# Functionality:
#   - Accept POST with email + magnet_type
#   - Save to Supabase email_captures table
#   - Send welcome email via Resend
#   - Return success

# 2. Create free resource pages

# File: apps/web-main/app/free/
#   └── design-ideas/page.tsx (email capture → send PDF)
#   └── cost-checklist/page.tsx (email capture → send PDF)
#   └── permit-guide/page.tsx (email capture → send PDF)

# 3. Create email templates

# File: apps/web-main/lib/marketing/email-templates/
#   └── welcome.tsx
#   └── followup-day1.tsx
#   └── followup-day3.tsx
```

**Action Items:**
- [ ] Create lead capture endpoint
- [ ] Create free resource pages
- [ ] Create email templates
- [ ] Test lead capture (submit email → check Supabase)

#### Afternoon (1 PM–5 PM): Email Automation

```bash
# 1. Create email sequence handler

# File: apps/web-main/app/api/cron/send-email-sequences/route.ts
# Functionality:
#   - Run every 6 hours
#   - Check for leads needing email
#   - Send welcome (immediately)
#   - Send day 1 followup
#   - Send day 3 followup

# 2. Create email service

# File: apps/web-main/lib/marketing/email-service.ts
# Functions:
#   - sendWelcomeEmail()
#   - sendDay1Email()
#   - sendDay3Email()
```

**Action Items:**
- [ ] Build email sequence cron job
- [ ] Build email service
- [ ] Test: Submit lead → Check emails
- [ ] Commit email infrastructure

### Day 4: Facebook Ads Setup

#### Morning (9 AM–12 PM): Ad Account Setup

```bash
# 1. Go to Meta Ads Manager
# https://business.facebook.com/adsmanager

# 2. Create new campaign
# - Campaign name: "Concept Design - Q2 2026"
# - Objective: "Leads"
# - Budget: $300/week

# 3. Create audience
# - Age: 35–65
# - Income: $75k+
# - Interests: Home improvement, design, real estate
# - Geographic: US metros (start with top 10)

# 4. Create lead form
# - Name
# - Email
# - Phone
# - Project type (dropdown)
# - Budget range
# - Timeline
# - Interested in (checkbox)

# 5. Connect webhook
# - Kealee webhook: https://kealee.com/api/webhooks/facebook-leads
# - Test connection
```

**Action Items:**
- [ ] Create Facebook ad account
- [ ] Create ad campaign
- [ ] Define audience
- [ ] Create lead form
- [ ] Connect webhook

#### Afternoon (1 PM–5 PM): Create Ad Variations

```bash
# Create 3 ad variations:

# AD 1 (Pain-focused)
# Headline: "Tired of Expensive Architect Meetings?"
# Body: [From LEAD_GENERATION_SYSTEM.md]
# Image: Before/after home design

# AD 2 (Solution-focused)
# Headline: "Your Dream Design, 48 Hours"
# Body: [From LEAD_GENERATION_SYSTEM.md]
# Image: Beautiful modern home design

# AD 3 (FOMO-focused)
# Headline: "Your Neighbors Are Redesigning"
# Body: [From LEAD_GENERATION_SYSTEM.md]
# Image: Happy homeowners

# 1. Create/gather images
# 2. Write headlines and body copy
# 3. Create ads in Facebook Ads Manager
# 4. Set landing page: https://kealee.com/landing/concept-design
# 5. Add UTM parameters: ?utm_source=facebook&utm_medium=lead_ad&utm_campaign=concept_q2
```

**Action Items:**
- [ ] Gather ad images
- [ ] Write ad copy variations
- [ ] Create ads in Facebook manager
- [ ] Set landing page URLs with UTM
- [ ] Start ads (small daily budget $50 to test)

### Day 5: Google Ads Setup

#### Morning (9 AM–12 PM): Google Ads Account

```bash
# 1. Go to Google Ads
# https://ads.google.com

# 2. Create new campaign
# - Type: Search
# - Name: "Concept Design - Home Design"
# - Budget: $50/day
# - Landing page: https://kealee.com/landing/concept-design

# 3. Create ad groups
# Group 1: "Home Design Concepts"
# Keywords:
#   - home design concepts
#   - 3D home design
#   - AI home designer
#   - interior design ideas
#   - kitchen design ideas

# Group 2: "Home Renovation"
# Keywords:
#   - home renovation cost
#   - renovation cost calculator
#   - home remodel costs
#   - how much does a renovation cost

# 4. Create ads
# Ad 1: Design Concepts
# Ad 2: Cost Estimation
```

**Action Items:**
- [ ] Create Google Ads account
- [ ] Create campaigns
- [ ] Add keywords (high intent)
- [ ] Create ad copy

#### Afternoon (1 PM–5 PM): Launch & Monitor

```bash
# 1. Launch campaigns
# - Facebook: $50/day (monitoring mode)
# - Google: $50/day (monitoring mode)

# 2. Set up tracking
# - UTM parameters on all links
# - Google Analytics connected
# - Conversion tracking enabled

# 3. Create dashboard
# - Open Google Analytics
# - Create custom dashboard:
#   - Landing page traffic
#   - Conversion rate
#   - Cost per lead
#   - Source breakdown

# 4. First monitoring
# - Check dashboard every 2 hours
# - Look for initial clicks/leads
# - Monitor spend
```

**Action Items:**
- [ ] Launch Facebook ads
- [ ] Launch Google ads
- [ ] Set up analytics
- [ ] Create monitoring dashboard
- [ ] Screenshot: Ads running

---

## Parallel Timeline

### Day 1 (Thursday, May 9)
```
AUTOMATION TRACK                    LEAD GENERATION TRACK
9 AM    → Verify Vercel deploy      9 AM    → Create landing page structure
12 PM   → Confirm env vars          12 PM   → Build concept design page
1 PM    → Redeploy with new vars    1 PM    → Continue styling
5 PM    → Env vars set              5 PM    → Concept page complete
```

### Day 2 (Friday, May 10)
```
AUTOMATION TRACK                    LEAD GENERATION TRACK
9 AM    → Run migrations 001–004    9 AM    → Build cost estimation page
12 PM   → All migrations complete   12 PM   → Build permits page
1 PM    → Register webhooks         1 PM    → Continue styling
3 PM    → Configure cron jobs       3 PM    → All 3 pages complete
5 PM    → Test webhooks             5 PM    → Commit pages
```

### Day 3 (Monday, May 12)
```
AUTOMATION TRACK                    LEAD GENERATION TRACK
9 AM    → Run activate:phase1       9 AM    → Build email capture
12 PM   → All tests pass            12 PM   → Create free resource pages
→ Ready for go-live!                1 PM    → Build email templates
                                    5 PM    → Email capture complete
```

### Day 4 (Tuesday, May 13)
```
AUTOMATION TRACK                    LEAD GENERATION TRACK
→ Monitor & troubleshoot            9 AM    → Set up Facebook ads
                                    12 PM   → Create ad variations
                                    1 PM    → Start Facebook ads
                                    5 PM    → Facebook ads running
```

### Day 5 (Wednesday, May 14)
```
AUTOMATION TRACK                    LEAD GENERATION TRACK
→ Ongoing monitoring                9 AM    → Set up Google ads
                                    12 PM   → Launch Google ads
                                    5 PM    → Both ad systems running
```

---

## Daily Checklist

### Day 1 (Thursday, May 9)

**Automation:**
- [ ] Vercel deployment ready
- [ ] Environment variables confirmed (30+)
- [ ] Redeploy triggered with new vars
- [ ] Redeploy completed successfully

**Lead Generation:**
- [ ] Landing page structure created
- [ ] Concept design page built
- [ ] Page styled and mobile-responsive
- [ ] Changes committed to git

### Day 2 (Friday, May 10)

**Automation:**
- [ ] Migration 001 applied
- [ ] Migration 002 applied
- [ ] Migration 003 applied
- [ ] Migration 004 applied
- [ ] GHL webhook registered
- [ ] Facebook webhook registered
- [ ] Cron jobs configured (3 total)
- [ ] All webhooks tested

**Lead Generation:**
- [ ] Cost estimation page built
- [ ] Permits page built
- [ ] All 3 pages styled
- [ ] All changes committed

### Day 3 (Monday, May 12)

**Automation:**
- [ ] `pnpm run activate:phase1` passes all tests
- [ ] System ready for go-live ✅

**Lead Generation:**
- [ ] Email capture endpoint built
- [ ] Free resource pages created
- [ ] Email templates created
- [ ] Email capture tested
- [ ] Changes committed

### Day 4 (Tuesday, May 13)

**Automation:**
- [ ] Monitoring: Check Vercel logs
- [ ] Monitoring: Check Slack notifications
- [ ] Monitoring: Check Supabase tables

**Lead Generation:**
- [ ] Facebook ads account created
- [ ] Audience defined
- [ ] Lead form created
- [ ] Ad variations created
- [ ] Facebook ads launched
- [ ] Daily spend: $50

### Day 5 (Wednesday, May 14)

**Automation:**
- [ ] Ongoing monitoring

**Lead Generation:**
- [ ] Google Ads account created
- [ ] Campaigns created
- [ ] Ad copy written
- [ ] Google ads launched
- [ ] Daily spend: $50
- [ ] Analytics dashboard created
- [ ] Monitoring setup

---

## Go-Live Sequence (End of Day 3)

### 3 PM Monday, May 12: The Switch

```bash
# 1. Run final verification
pnpm run activate:phase1
# Expected: All tests pass ✓

# 2. Enable real traffic
# In web-main form configuration:
#   STRIPE_MODE=live
#   ENABLE_REAL_INTAKE=true

# 3. Deploy
git push origin main
# Wait for Vercel: ~5 min

# 4. Verify with dashboard
curl -H "x-kealee-ops: $CRON_SECRET" \
  https://kealee.com/api/admin/marketing/dashboard

# 5. Submit test lead
# Go to: https://kealee.com/intake/concept
# Fill form, submit payment (your card)

# 6. Verify automation worked
# - Check SMS on your phone (within 2 min)
# - Check GHL for new contact (within 5 min)
# - Check Slack #leads channel (should post)

# IF ALL ✓: YOU'RE LIVE! 🎉
```

---

## Success Criteria (End of Week)

### Automation Track
- [ ] Vercel deployment successful
- [ ] All 4 database migrations applied
- [ ] All 3 webhooks registered and responding
- [ ] All 3 cron jobs configured
- [ ] Verification script passes
- [ ] Test lead submitted
- [ ] SMS alert received
- [ ] GHL contact created
- [ ] Slack notification posted

### Lead Generation Track
- [ ] 3 landing pages live
- [ ] Email capture working
- [ ] Free resources available
- [ ] Facebook ads running ($50/day)
- [ ] Google ads running ($50/day)
- [ ] First leads coming in
- [ ] Analytics tracking working
- [ ] Ad performance visible

### Combined
- [ ] System processing leads from both tracks
- [ ] Automation routing leads correctly
- [ ] SMS alerts firing
- [ ] GHL syncing
- [ ] Campaigns generating
- [ ] Revenue coming in

---

## Resource List

### Required Access
- [ ] Vercel dashboard
- [ ] Supabase SQL editor
- [ ] goHighLevel account + API key
- [ ] Meta Ads Manager
- [ ] Google Ads account
- [ ] EasyCron (or similar for cron jobs)
- [ ] GitHub (for pushing code)

### Documentation References
- GO_LIVE_GUIDE.md (deploy automation)
- LEAD_GENERATION_SYSTEM.md (build lead gen)
- ENV_VARS_QUICK_REFERENCE.md (all variables)
- MONITORING_AND_LOGS_GUIDE.md (troubleshooting)

### Time Estimates
- Automation track: 8–10 hours (spread over 3 days)
- Lead generation track: 12–15 hours (spread over 5 days)
- Total: 20–25 hours of work
- Team size: 1–2 people
- Full-time: 5 days to complete

---

## Risk Mitigation

### If Automation Fails
- Pause cron jobs (leads still coming in, just not auto-processed)
- Disable webhooks (fallback to manual handling)
- Have fallback SMS phone (use personal while testing)

### If Landing Pages Are Slow
- Use Next.js Image optimization
- Minimize JavaScript
- Test with Google Lighthouse
- Deploy to CDN (Vercel handles this)

### If Ads Don't Get Leads
- Check landing page conversion (should be 15%+)
- Check form submission (should be 80%+)
- If low, A/B test different copy
- If high but no purchases, check pricing

### If Email Capture Fails
- Check Resend API key in env vars
- Check email templates are valid
- Check Supabase table for errors
- Manual test: Submit email → Check Supabase

---

## End of Week Report

By Friday, May 15, create this report:

```markdown
# Week 1 Results (May 9–15, 2026)

## Automation System
- Deployment: ✅ Live
- Migrations: ✅ 4/4 applied
- Webhooks: ✅ 3/3 active
- Cron jobs: ✅ 3/3 running
- Test leads processed: ✅ X leads
- SMS alerts sent: ✅ X alerts
- GHL contacts created: ✅ X contacts

## Lead Generation System
- Landing pages: ✅ 3/3 live
- Facebook ads: ✅ Running ($50/day)
- Google ads: ✅ Running ($50/day)
- First week leads: ✅ X leads
- Cost per lead: ✅ $XX
- Landing page conversion: ✅ X%

## Combined Results
- Total leads: ✅ X
- Leads processed: ✅ X
- Leads in GHL: ✅ X
- Revenue: ✅ $X
- Ready to scale: ✅ YES

## Issues Encountered
- [List any issues and how they were resolved]

## Next Week Plan
- [What to optimize, scale, or build]
```

---

## You're Ready!

Everything is built, documented, and ready to execute.

**This week:**
1. ✅ Deploy automation (Days 1–2)
2. ✅ Build landing pages (Days 1–5)
3. ✅ Launch ads (Days 4–5)
4. ✅ Go live! (Day 3)

**By Friday, May 15: Both systems running, first real leads flowing, revenue coming in.**

Let's execute! 🚀
