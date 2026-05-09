# Reddit Ads Integration Setup Guide
## Community-Targeted Lead Generation

**Status:** ✅ Ready to Deploy  
**Integration:** Reddit Ads → Kealee Platform  
**Expected Leads:** 5–15/week per subreddit  
**Target ROI:** 2.5:1+  

---

## Why Reddit?

✅ **Highly Targeted Communities** (r/HomeImprovement, r/DIY, r/Construction)  
✅ **Authentic Engagement** (users trust community recommendations)  
✅ **Niche Audiences** (contractors, DIY homeowners, designers)  
✅ **Lower CPC** (often cheaper than Facebook/Google)  
✅ **High Intent** (people already discussing projects)  
✅ **Trackable ROI** (measure by subreddit + category)  
✅ **B2B + B2C** (both consumers and professionals)

**Best Performing Subreddits for Kealee:**
- r/HomeImprovement (2M+ members, high intent)
- r/DIY (3M+ members, exploratory)
- r/Architecture (500k+ members, professionals)
- r/Construction (800k+ members, contractors)
- r/InteriorDesign (1M+ members, design-focused)
- r/Gardening (1M+ members, landscape)
- r/Homeowners (800k+ members, property owners)

---

## Setup Steps (30 Minutes)

### Step 1: Create Reddit Ads Account (5 min)

1. Go to https://www.redditadvertising.com
2. Sign up or log in with Reddit account
3. Set up advertiser profile
4. Add payment method (credit card)

### Step 2: Create First Ad Campaign (10 min)

1. **Campaign Settings**
   - Name: "Kealee Exterior Design - r/HomeImprovement"
   - Budget: $200–500/week (start small)
   - Duration: 7 days for testing

2. **Targeting**
   - Subreddit: r/HomeImprovement (start here)
   - Format: Link to lead form or external conversion
   - Placements: All (home feed, sidebar)

3. **Ad Creative**
   - Headline: "Get Professional Exterior Designs (Free Consultation)"
   - Description: "5 design concepts in 48 hours"
   - Image: Professional home exterior photo
   - CTA: "Learn More" or "Get Free Design"

4. **Lead Form** (Options)
   - **Option A:** Reddit native form (limited data)
   - **Option B:** External URL → Landing page with full form
   - **Recommended:** Option B (capture more data)

   External form URL:
   ```
   https://kealee.com/reddit-lead-form?utm_source=reddit&utm_medium=ads&utm_campaign=exteriordesign
   ```

5. **Webhook Configuration**
   - After form submission, webhook to:
   ```
   POST https://your-domain.com/api/webhooks/reddit-leads
   ```
   - Payload includes all form fields + subreddit metadata

### Step 3: Enable Webhook in Kealee (5 min)

Set environment variable in Vercel:

```
REDDIT_API_KEY=<your-reddit-api-key>
REDDIT_WEBHOOK_SECRET=<generate-random-32-chars>
```

(Optional if using external landing page - webhook URL is all you need)

### Step 4: Test Webhook (5 min)

Manually test webhook:

```bash
curl -X POST https://kealee.com/api/webhooks/reddit-leads \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Lead",
    "email": "test@example.com",
    "phone": "555-0123",
    "subreddit": "HomeImprovement",
    "subreddit_category": "exterior",
    "service_interest": "exterior",
    "budget": "$20,000",
    "engagement_level": "high",
    "ad_campaign_id": "reddit-ext-001"
  }'
```

Expected response:
```json
{
  "success": true,
  "leadId": "uuid-123",
  "score": 78,
  "tag": "hot"
}
```

### Step 5: Launch & Monitor (5 min)

1. Activate campaign in Reddit Ads Manager
2. Leads start flowing immediately
3. Check Kealee dashboard for incoming leads
4. Monitor Slack notifications

---

## Recommended Subreddit Strategy

### Tier 1: High ROI (Start Here)
- **r/HomeImprovement** (2M+ members)
  - Best audience fit
  - High budget projects
  - Expected: 5–10 leads/week
  - ROI: 3.5:1

- **r/InteriorDesign** (1M+ members)
  - Interior renovation focus
  - Professional designers present
  - Expected: 3–8 leads/week
  - ROI: 3:1

### Tier 2: Professionals
- **r/Architecture** (500k+ members)
  - Architect + designer audience
  - High-end projects
  - Expected: 2–5 leads/week
  - ROI: 3.5:1

- **r/Construction** (800k+ members)
  - Contractor focus
  - B2B opportunity
  - Expected: 3–7 leads/week
  - ROI: 2.8:1

### Tier 3: Extended Reach
- **r/DIY** (3M+ members)
  - Large audience, mixed intent
  - More exploratory
  - Expected: 3–5 leads/week
  - ROI: 2:1

- **r/Gardening** (1M+ members)
  - Landscape design
  - Expected: 2–4 leads/week
  - ROI: 2.5:1

---

## ROI Tracking

### Real-Time Dashboard

```sql
-- See leads by subreddit
SELECT
  subreddit,
  category,
  leads_count,
  paid_leads,
  revenue_generated,
  cost_per_lead,
  roi
FROM reddit_performance
ORDER BY roi DESC;
```

### Example Results After 2 Weeks

```
Subreddit           | Leads | Paid | Cost/Lead | ROI
r/HomeImprovement   | 25    | 5    | $40       | 3.5:1
r/InteriorDesign    | 18    | 4    | $45       | 3.2:1
r/Architecture      | 12    | 3    | $50       | 3:1
r/Construction      | 15    | 3    | $55       | 2.8:1
```

**Action:** Double r/HomeImprovement budget, test r/Gardening

---

## Budget Guidelines

### Small Test (Week 1)
- 3 subreddits × $70/day = $210/day total
- Expected: 15–20 leads/week
- Expected conversions: 3–5

### Growth (Week 2–4)
- Scale top 2: $150–200/day each
- Add 2 new subreddits: $70/day each
- Total: $440–640/day

### Optimization (Week 5+)
- Scale top subreddit: $500–1,000/day
- Maintain test subreddits: $70/day each
- Total: $640–1,140/day

---

## Lead Flow Example

### Scenario: r/HomeImprovement Ad

```
Thursday 3:00 PM
User scrolling r/HomeImprovement sees ad:
"Get Professional Exterior Designs (Free Consultation)"
User clicks: "Learn More"

3:05 PM
Landing page loads with form
User fills:
- Name: Jane Smith
- Email: jane@example.com
- Phone: (555) 234-0123
- Service: Exterior
- Budget: $25,000
- Message: "Looking for modern farmhouse aesthetic"

3:10 PM
Webhook fires to: /api/webhooks/reddit-leads

3:11 PM
Kealee receives lead:
├─ Creates record in Supabase
├─ Scores: 85 (high budget, exterior = 15, r/HomeImprovement = plus 10)
├─ Tags: HOT
├─ Creates GHL contact: "Jane Smith - r/HomeImprovement"
├─ Tags with: reddit, hot, HomeImprovement, exterior
└─ Increments reddit_performance: HomeImprovement leads += 1

3:12 PM
Phase 1 automation:
├─ SMS alert: "🔥 Hot! Jane Smith | Exterior | $25k | r/HomeImprovement"
└─ You see alert on phone

3:20 PM
You call Jane or send SMS: "Hi Jane! Great to see your interest..."

---

Lead conversion path:
Lead → Scoring → Alert → Call → Concept → Estimate → Build
ROI tracked at each step by subreddit
```

---

## Expected Performance

### Conservative (Weeks 1–2)
- Cost per lead: $40–60
- Lead to paid conversion: 10–15%
- Cost per customer: $300–400
- Customer lifetime value: 5–6x ROI

### Optimized (Week 3+)
- Cost per lead: $30–50
- Lead to paid conversion: 15–25%
- Cost per customer: $150–250
- Customer lifetime value: 8–12x ROI

### Top Performers (Month 2+)
- Cost per lead: $20–35 (r/HomeImprovement)
- Lead to paid conversion: 20%+
- Cost per customer: $100–150
- Customer lifetime value: 12–20x ROI

---

## Optimization Playbook

### Week 1: Foundation
- [ ] Deploy webhook (`/api/webhooks/reddit-leads`)
- [ ] Test 3 subreddits (r/HomeImprovement, r/InteriorDesign, r/DIY)
- [ ] Send $210 total budget ($70/subreddit)
- [ ] Collect baseline data
- [ ] Measure cost per lead

### Week 2: Scale Winners
- [ ] Analyze ROI by subreddit
- [ ] Double budget for top performer
- [ ] Pause underperformers
- [ ] Add 2 new test subreddits
- [ ] Monitor conversion rates

### Week 3–4: Optimize
- [ ] Refine ad creative based on engagement
- [ ] Test different audiences per subreddit
- [ ] Measure cost-per-conversion
- [ ] Calculate customer lifetime value
- [ ] Expand to new subreddits

### Month 2: Scale
- [ ] Identify best subreddits (lowest cost-per-lead + highest conversion)
- [ ] Allocate 50% of budget to winners
- [ ] Test new subreddit categories
- [ ] Expand daily budget
- [ ] Target 50+ leads/week

---

## Reddit Community Tips

✅ **DO:**
- Target specific subreddits (more targeted = better ROI)
- Use native Reddit tone (authentic, helpful)
- Show real project results
- Engage with community comments
- Test multiple subreddits

❌ **DON'T:**
- Spam all subreddits equally
- Use salesy language
- Post fake testimonials
- Ignore community guidelines
- Over-spend on low-ROI subreddits

---

## Integration with Phase 1–3 Automation

Reddit leads flow through complete automation:

```
Reddit Webhook
    ↓
Phase 1 Scoring (automatic)
├─ Score 0–100
├─ Tag: hot/medium/cold
└─ Send SMS alert
    ↓
GHL Contact Creation (automatic)
├─ Create contact with subreddit tag
├─ Add custom fields (subreddit, category, engagement)
└─ Track in ghl_sync_log
    ↓
Phase 2 AI Qualification (if SMS reply)
├─ Claude scores reply
├─ If qualified: Schedule Calendly slot
└─ Auto-confirm meeting
    ↓
Phase 3 ROI Tracking
├─ Track revenue by subreddit
├─ Calculate cost-per-lead
└─ Optimize spend by subreddit
```

---

## Files Updated

- `app/api/webhooks/reddit-leads/route.ts` — Webhook handler
- `_docs/migrations/003-marketing-phase3-schema.sql` — `reddit_performance` table
- `lib/marketing/marketing-engine.ts` — Added Reddit to sources

---

## Resources

- **Reddit Ads:** https://www.redditadvertising.com
- **Reddit Ads Help:** https://support.reddit.com/hc/en-us/categories/205379435
- **Subreddit Stats:** https://redditmetrics.com
- **Kealee Dashboard:** `/api/admin/marketing/dashboard`
- **Subreddit Performance:** Query `reddit_performance` table

---

## Next Steps

1. Create Reddit Ads account
2. Deploy webhook (already live)
3. Set up first campaign (pick r/HomeImprovement)
4. Launch with $210–350 budget (3 subreddits)
5. Monitor performance daily
6. Optimize after week 1
7. Scale winners

---

**Expected Result:** 5–15 leads/week from Reddit  
**Timeline:** Live in 30 minutes  
**Payback Period:** 2–4 weeks (2.5:1+ ROI)  

Let's capture Reddit community leads! 🎯
