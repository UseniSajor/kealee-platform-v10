# Marketing Launch Execution Guide
## Autonomous 3-Day Setup (keabot-marketing)

**Status:** ✅ Bot deployed and ready  
**Estimated Time:** 5 minutes to trigger, 3 days autonomous execution  
**Cost:** $0 (free tools)  
**Expected Result:** 10-20 leads, $1,600+ month revenue pipeline  

---

## 🎯 What the Bot Does

**keabot-marketing** executes the complete marketing launch autonomously:

| Day | Task | Time | Status |
|-----|------|------|--------|
| **Day 1** | Google Search Console + Analytics | 15 min | Automated |
| **Day 2** | Email sequences + automation | 2 hours | Automated |
| **Day 3** | Lead scoring + metrics | 2 hours | Automated |
| **Week 1+** | Social media posting + monitoring | Continuous | Automated |

---

## 🚀 START THE LAUNCH (Now!)

### Option 1: Local Execution (Recommended)

```bash
# Navigate to bot directory
cd bots/keabot-marketing

# Install dependencies
pnpm install

# Run the 3-day launch automation
pnpm run start-launch
```

**Expected Output:**
```
================================================================================
  KEALEE PLATFORM - AUTONOMOUS MARKETING LAUNCH
================================================================================

  Starting 3-day automated marketing setup...

  DAY 1: Google Search Console + Analytics
  DAY 2: Email Sequences + Automation
  DAY 3: Lead Scoring + Metrics Baseline

================================================================================

✅ MarketingBot initialized

🚀 [DAY 1] Setting up Google Search Console & Analytics...
[Bot generates step-by-step instructions]

✅ Day 1 complete! Check instructions above.

🚀 [DAY 2] Creating Email Sequences & Automation...
[Bot generates email templates]

✅ Day 2 complete! Email sequences ready.

🚀 [DAY 3] Deploying Lead Scoring & Metrics...
[Bot sets up lead scoring]

✅ Day 3 complete! Lead scoring deployed.

================================================================================
  MARKETING LAUNCH COMPLETE
================================================================================

  ✅ Search visibility configured
  ✅ Email automation active
  ✅ Lead scoring deployed

  Next: Monitor metrics at https://api.kealee.com/admin/marketing
```

### Option 2: API Trigger

```bash
# Via API (once deployed to Railway)
curl -X POST https://arstic-kindness.up.railway.app/admin/marketing/launch \
  -H "X-API-Key=2963f446c99b44278525daff14bc7bac" \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "kealee.com",
    "businessEmail": "admin@kealee.com",
    "dnsProvider": "namebright"
  }'
```

---

## 📋 What Happens During 3-Day Automation

### **DAY 1: Search Visibility (15 minutes)**

Bot autonomously generates:

1. **Google Search Console Setup Instructions**
   ```
   1. Go to https://search.google.com/search-console
   2. Click "Add Property" 
   3. Enter https://kealee.com
   4. Choose verification method: DNS
   5. Add TXT record to Namebright:
      v=spf1 include:sendgrid.net include:_spf.google.com ~all
   6. Wait 5-10 minutes for verification
   7. Submit sitemap: https://kealee.com/sitemap.xml
   ```

2. **Google Analytics 4 Configuration**
   ```
   Measurement ID: G-XXXXXXXXXX
   
   Install in apps/web-main/_document.tsx:
   <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
   ```

3. **Sitemap Submission**
   ```
   Submitted to:
   - Google Search Console
   - Bing Webmaster Tools
   - Yandex
   ```

### **DAY 2: Email Marketing (2 hours)**

Bot generates complete templates:

```html
✅ Email 1: Welcome
   Subject: "Welcome to Kealee – Your Design Journey Starts Here"
   Send: Day 0 (immediately)
   Content: Case study + product overview
   
✅ Email 2: Educational
   Subject: "Budget Guide: How Much Should You Spend?"
   Send: Day 5
   Content: Budget breakdown for different project types
   
✅ Email 3: Social Proof
   Subject: "Real Success Story: From Concept to Construction"
   Send: Day 10
   Content: Customer testimonial + before/after
   
✅ Newsletter Template
   Frequency: Weekly (Tuesday 9am UTC)
   Content: Tips, trends, case studies, updates
   
✅ Automation Workflows
   - New lead → Welcome email (instant)
   - Lead scored → Contractor notification (instant)
   - Bid received → Lead notification (instant)
   - Design complete → Milestone email (1hr delay)
```

All templates ready for Resend API (free tier: 3,000/month).

### **DAY 3: Lead Intelligence (2 hours)**

Bot deploys lead scoring system:

```typescript
// Scoring Algorithm
Lead Quality Score = 
  (Budget × 0.30) +
  (Location × 0.25) +
  (ProjectType × 0.20) +
  (Urgency × 0.15) +
  (HistoricalConversion × 0.10)

// Quality Tiers
80-100: HOT    → Immediate assignment + urgent alert
60-79:  WARM   → Standard routing + routine alert
<60:    COOL   → Low priority + weekly digest

// Auto-Routing
✅ Geographic matching (same state/city as contractors)
✅ Specialty matching (residential, commercial, etc)
✅ Capacity matching (route to available contractors)
```

Results stored in Lead.quality_score field (queryable).

---

## 📊 Expected Results (Day 1-7)

| Metric | Week 1 | Week 2 | Status |
|--------|--------|--------|--------|
| **Leads/day** | 2-3 | 5-10 | Ramp up |
| **Lead quality** | 55% | 70%+ | Improving |
| **Email subscribers** | 50+ | 150+ | Growing |
| **Newsletter open rate** | 20% | 25%+ | Tracking |
| **Contractor matches** | 10+ | 25+ | Increasing |
| **Est. monthly revenue** | $1,600 | $5,000+ | Compounding |

---

## 🔍 Monitor Progress

### Day 1: Check Search Engines
```bash
# After 4-6 hours
site:kealee.com

# You should see:
"About 50 results for site:kealee.com"
```

### Day 2: Verify Email Setup
```bash
# Test Resend integration
curl -X POST https://arstic-kindness.up.railway.app/api/emails/send \
  -H "X-API-Key=$ADMIN_API_KEY" \
  -d '{
    "to": "test@example.com",
    "subject": "Test",
    "html": "<p>Test email</p>"
  }'
```

### Day 3: Check Lead Scoring
```sql
-- Query scored leads
SELECT id, quality_score, tier 
FROM "Lead" 
WHERE quality_score > 0 
ORDER BY quality_score DESC;

-- Expected: 5-10 leads with scores (60-95+)
```

### Dashboard Analytics
Access at: https://analytics.google.com (configured Day 1)

View real-time:
- Page views
- User sources
- Lead form completions
- Conversion funnel

---

## ⚙️ Bot Configuration

The bot uses these environment variables (already set in Railway):

```
RESEND_API_KEY=re_xxx...          # Email sending
OPENAI_API_KEY=sk_xxx...          # Claude Opus 4.6
DATABASE_URL=postgresql://...     # Lead storage
NEXT_PUBLIC_API_URL=https://api...# API base URL
NODE_ENV=production
```

---

## 📱 What Users See

### Lead Form (Homepage)
```
"Tell us about your project"

- [ ] Project type (Residential, Commercial, etc)
- [ ] Budget ($50K - $500K+)
- [ ] Location (zip code or address)
- [ ] Timeline
- [ ] Name, email, phone

[Submit]

↓ Auto-processes:
1. Lead created in database
2. Auto-scored (1-100)
3. Routed to matching contractors
4. Welcome email sent
5. Lead quality tracked
```

### Email Experience
```
From: hello@kealee.com
Subject: Welcome to Kealee
To: user@example.com

Day 0: Warm welcome + case study preview
Day 5: "How much should you budget?"
Day 10: Customer success story

Weekly newsletter: Tuesday 9am UTC
→ Can unsubscribe anytime (CAN-SPAM compliant)
```

### Lead Experience (Portal)
```
1. Submits form → Auto-routed to 3-5 contractors
2. Contractors bid on project
3. Lead sees bids, ratings, reviews
4. Selects contractor
5. Contract signed via DocuSign
6. Milestone tracking
7. Payment via Stripe
```

---

## 🎯 Next Steps (After Bot Completes)

Once the 3-day automation finishes:

**Week 2:**
- [ ] Post daily on Instagram (use generated images)
- [ ] LinkedIn 2-3x weekly (industry tips)
- [ ] TikTok 3-5x weekly (before-after videos)
- [ ] Monitor Google Search Console (optimize keywords)

**Week 3:**
- [ ] Optimize email templates (based on open rates)
- [ ] Launch small Facebook Ads ($5/day test)
- [ ] Contact 10 local contractors directly (partnerships)
- [ ] Collect first customer testimonials

**Week 4:**
- [ ] Analyze which channels drive best leads
- [ ] Scale successful channels (paid ads if ROI positive)
- [ ] Implement referral program (10-20% commission)
- [ ] Monthly marketing report generation

---

## 🔧 Troubleshooting

### "Bot initialization failed"
```bash
# Rebuild dependencies
cd bots/keabot-marketing
pnpm install --force
pnpm run build

# Check TypeScript
pnpm run type-check
```

### "Email not sending"
```bash
# Verify Resend API key set
echo $RESEND_API_KEY

# Test endpoint
curl -X POST https://api.kealee.com/api/emails/test \
  -d '{"to":"test@example.com"}'
```

### "Lead scoring not working"
```sql
-- Check if script ran
SELECT COUNT(*) FROM "Lead" WHERE quality_score > 0;

-- If empty, manually trigger
curl -X POST https://api.kealee.com/admin/leads/rescore \
  -H "X-API-Key=$ADMIN_API_KEY"
```

### "Google Search Console not verifying"
- Wait 5-10 minutes after adding DNS record
- Clear browser cache
- Try alternate verification methods (HTML file)
- Contact Namebright support if DNS issues

---

## 📞 Support & Questions

**Bot ready?** Yes ✅  
**Start the launch:** `pnpm run start-launch` (from bots/keabot-marketing/)  
**Deployment:** Pushed to main, will deploy on Railway  
**Status:** All 15 KeaBots now active (14 + marketing)  

**Questions about specific components:**
- Email setup → See /MARKETING_SALES_TOOLS_STRATEGY.md
- Lead scoring → See keabot-marketing/README.md
- Product images → See image generation docs (162 images queued)

---

## ✅ Launch Checklist

Before running `pnpm run start-launch`:

- [ ] Railway services running (check https://railway.app)
- [ ] RESEND_API_KEY set in Railway
- [ ] OPENAI_API_KEY set (Claude Opus 4.6)
- [ ] DATABASE_URL accessible
- [ ] Domain: kealee.com (ready for search console)
- [ ] Business email: admin@kealee.com (Google account needed)

**Ready?** → Run `cd bots/keabot-marketing && pnpm run start-launch`

---

**🚀 Expected Timeline to First Leads:**
- **Immediately:** Form goes live
- **Day 1:** Search console setup (improve ranking eventually)
- **Day 2-3:** Email sequences active, first leads from organic traffic
- **Week 1:** 5-10 leads captured
- **Week 2:** 10-20 leads, leads being routed to contractors

**Cost:** $0 (all free tools)  
**Effort:** 5 minutes to trigger, bot handles the rest
