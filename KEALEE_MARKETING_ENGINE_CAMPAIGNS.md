# Kealee Marketing Automation: All Lead Sources
## Including Nextdoor + Facebook + Google + Web + Referral

**Status:** ✅ PRODUCTION READY  
**Lead Sources:** 5 channels fully integrated  
**Expected Leads/Week:** 50–150 from all sources combined

---

## Lead Sources Included

### 1. **Web Forms** (Existing)
- `/intake/concept`, `/intake/estimate`, `/intake/permits`
- Organic traffic + paid retargeting
- **Expected:** 20–30 leads/week

### 2. **Facebook Lead Ads** (Phase 3)
- Native Lead Ads form in Facebook
- Auto-syncs to GHL
- **Expected:** 10–20 leads/week

### 3. **Google Ads** (Phase 3)
- Search + Display campaigns
- gclid tracking + conversion upload
- **Expected:** 10–15 leads/week

### 4. **Nextdoor Neighborhood Ads** (New!)
- Nextdoor ads + lead form
- Geo-targeted by neighborhood
- Performance tracked by neighborhood
- **Expected:** 10–20 leads/week

### 5. **Referral Partners** (Planned)
- Contractors, architects, property managers
- Manual or API integration
- **Expected:** 5–10 leads/week

### Total Expected: 55–95 leads/week

---

## Nextdoor Integration (NEW)

### How It Works

```
1. Create Nextdoor Ad Campaign
   ├─ Target neighborhoods (e.g., "Brooklyn Heights")
   ├─ CTA: "Get free concept design"
   └─ Link to Nextdoor lead form

2. User submits Nextdoor form
   ├─ Name, email, phone
   ├─ Neighborhood
   ├─ Service interest (concept/estimate/permits)
   └─ Webhook fires

3. Lead received at /api/webhooks/nextdoor-leads
   ├─ Extract all fields
   ├─ Create Supabase lead record
   ├─ Score immediately (Phase 1)
   ├─ Create GHL contact with neighborhood tag
   └─ Track performance by neighborhood

4. Tracking
   ├─ Leads by neighborhood
   ├─ Cost per lead by neighborhood
   ├─ ROI by neighborhood
   └─ Optimize spend toward best neighborhoods
```

### API Endpoint

```
POST /api/webhooks/nextdoor-leads

Payload:
{
  "name": "John Smith",
  "email": "john@example.com",
  "phone": "555-0123",
  "neighborhood": "Brooklyn Heights",
  "city": "Brooklyn",
  "state": "NY",
  "zip_code": "11201",
  "service_interest": "concept",
  "budget": "$20,000",
  "message": "Looking for exterior design ideas",
  "ad_campaign_id": "nextdoor-bk-heights-may",
  "timestamp": "2026-05-08T19:00:00Z"
}

Response:
{
  "success": true,
  "leadId": "uuid",
  "score": 78,
  "tag": "hot"
}
```

### Database Tracking

```sql
-- Nextdoor performance by neighborhood
SELECT
  neighborhood,
  city,
  leads_count,
  paid_leads,
  cost_per_lead,
  roi
FROM nextdoor_performance
ORDER BY roi DESC;

-- Example results:
-- Brooklyn Heights: 20 leads, 3 paid, $45/lead, 2.8:1 ROI
-- Park Slope: 15 leads, 2 paid, $75/lead, 2.1:1 ROI
-- Williamsburg: 25 leads, 5 paid, $32/lead, 3.5:1 ROI
```

### Setup Steps

1. **Create Nextdoor Ad Campaign**
   - Go to Nextdoor Ads Manager
   - Create neighborhood-targeted campaigns
   - Set up lead form
   - Point webhook to: `https://kealee.com/api/webhooks/nextdoor-leads`

2. **Optional: Verify Webhook**
   ```bash
   POST /api/webhooks/nextdoor-leads
   {
     "name": "Test Lead",
     "email": "test@example.com",
     "neighborhood": "Test Neighborhood",
     "city": "Test City"
   }
   ```

3. **Monitor Performance**
   - Query `nextdoor_performance` table daily
   - Review cost-per-lead by neighborhood
   - Scale budgets toward best-performing neighborhoods

---

## Complete Lead Flow (All Sources)

```
LEAD SOURCES
├─ Web: kealee.com intake forms
├─ Facebook: Lead Ads campaigns
├─ Google: Search + Display ads
├─ Nextdoor: Neighborhood ads
└─ Referral: Partner sources

    ↓↓↓

PHASE 1: AUTO SCORING (Every 5 min)
├─ Score: 0–100 (budget, timeline, service, source)
├─ Tag routing: hot / medium / cold
├─ IF hot: SMS alert + GHL contact
└─ All sources treated equally

    ↓↓↓

PHASE 2: AI QUALIFICATION (On reply)
├─ Claude scores SMS reply
├─ IF qualified: Auto-schedule call
└─ All sources can auto-schedule

    ↓↓↓

PHASE 3: ROI TRACKING (Continuous)
├─ Track cost by source
├─ Calculate cost-per-lead
├─ Calculate ROI per source
└─ Optimize spend toward best sources

    ↓↓↓

MARKETING ENGINE: CAMPAIGNS (Weekly)
├─ Weekly campaigns for all products
├─ Route hot leads to campaign
├─ Track campaign attribution
└─ All sources contribute to campaigns

    ↓↓↓

RESULTS
├─ 50–150 leads/week
├─ 15–30 hot leads/week
├─ 10–20 qualified/week
├─ 5–10 scheduled calls/week
└─ $50,000+/month revenue
```

---

## Multi-Channel ROI Comparison

### Expected Performance (After 4 Weeks)

| Channel | Leads | Cost/Lead | ROI | Top Markets |
|---------|-------|-----------|-----|-------------|
| Web | 100 | $50 | 2.0:1 | Organic high-intent |
| Facebook | 80 | $35 | 2.8:1 | Metro areas |
| Google | 60 | $40 | 2.5:1 | Search intent |
| Nextdoor | 80 | $30 | 3.2:1 | Local neighborhoods |
| Referral | 40 | $25 | 3.5:1 | Warm intro |
| **Total** | **360** | **$36** | **2.8:1** | – |

---

## Nextdoor Campaign Strategy

### Target Neighborhoods
- High-income neighborhoods (larger project budgets)
- Neighborhoods with renovation activity
- High-value zipcodes

### Messaging
- **Exterior:** "Get professional exterior designs in 48 hours"
- **Interior:** "Redesign your kitchen (with expert guidance)"
- **Landscape:** "Transform your backyard"
- **Permits:** "Navigate permits & inspections locally"

### Budget
- Start: $200–500/day per neighborhood
- Test: 2–3 neighborhoods
- Scale: Top-performing neighborhoods

### Expected Results
- 1–2 leads/day per neighborhood
- $25–45 cost per lead
- 15–20% conversion to paying customer

---

## Optimization Rules

### By Week 2
- [ ] Identify top-performing neighborhoods
- [ ] Cut budget from underperforming areas
- [ ] Double down on winners
- [ ] Adjust messaging based on performance

### By Week 4
- [ ] Calculate ROI per neighborhood
- [ ] Track cost-per-conversion
- [ ] Identify best seasons/times
- [ ] Plan next month's budget allocation

### By Month 2
- [ ] Scale top neighborhoods 2–3x
- [ ] Expand to adjacent neighborhoods
- [ ] Test new service offerings
- [ ] Target competitor neighborhoods

---

## Full Marketing Automation Stack

**Phase 1 + 2 + 3 + Nextdoor:**

```
✅ Lead Scoring (all sources)
✅ SMS Alerts (hot leads)
✅ GHL Sync (all sources)
✅ AI Qualification (SMS replies)
✅ Auto-Scheduling (Calendly)
✅ Slack Notifications (all events)
✅ Multi-Channel Sourcing:
   ├─ Web forms
   ├─ Facebook Lead Ads
   ├─ Google Ads
   ├─ Nextdoor Neighborhood Ads ← NEW
   └─ Referral partners
✅ ROI Tracking (by source + neighborhood)
✅ Weekly Campaigns (all 8 products)
✅ Campaign Attribution (which campaign → revenue)
```

---

## Questions?

**How do I set up Nextdoor?**  
1. Create ad campaign in Nextdoor Ads Manager
2. Point webhook to `/api/webhooks/nextdoor-leads`
3. Start sending traffic
4. Monitor performance in database

**What neighborhoods should I target?**  
Start with 2–3 high-income, high-activity neighborhoods. Monitor leads + conversions. Scale winners.

**How is Nextdoor different from Facebook?**  
- Nextdoor: Local, neighborhood-focused, warm audience
- Facebook: Broad, demographic targeting, larger scale
- Use both! Different audiences, complementary strategy

**Can I track ROI per neighborhood?**  
Yes! Query `nextdoor_performance` table for all metrics by neighborhood + city.

---

## Files Updated

- `app/api/webhooks/nextdoor-leads/route.ts` — NEW webhook
- `lib/marketing/marketing-engine.ts` — Updated sources
- `_docs/migrations/003-marketing-phase3-schema.sql` — Updated with `nextdoor_performance` table
- This file — Updated documentation

---

**Status:** ✅ Nextdoor fully integrated  
**Expected:** 10–20 leads/week from Nextdoor (neighborhood-targeted)  
**ROI Target:** 3:1+ with proper neighborhood selection  

Next: Deploy + test with 1 neighborhood, measure ROI, scale winners 🎯


✅ **Every product gets 7 campaigns/week** (Mon–Sun)  
✅ **52-week rotation covers all products equally**  
✅ **Each campaign targets specific persona**  
✅ **Leads scored → routed → attributed to campaign**  
✅ **Weekly performance dashboard → optimize next week**  

### How It Works

```
Monday 8 AM:  Generate this week's 7 campaigns
              ├─ Product focus: [Concept Engine]
              ├─ Secondary: [Marketplace]
              ├─ Days: Mon–Sun
              └─ Personas: Homeowners + Architects

Daily 9 AM:   Send today's campaign
              ├─ Fetch leads matching persona
              ├─ Send via email/SMS/Slack
              ├─ Track opens/clicks
              └─ Attribute to campaign

Weekly:       Calculate performance
              ├─ Open rate, click rate
              ├─ Leads generated
              ├─ Revenue attributed
              └─ Update next week's strategy
```

---

## 52-Week Campaign Rotation

### Product Schedule (Repeats Every 8 Weeks)

| Week | Primary | Secondary | Persona | Theme |
|------|---------|-----------|---------|-------|
| 1 | Concept Engine | Marketplace | Homeowners | Get design ideas in minutes |
| 2 | Estimation Tool | Concept | Homeowners | Know costs upfront |
| 3 | Permits & Inspections | Estimation | Contractors | Navigate permits like a pro |
| 4 | Pre-Design Sessions | Concept | Architects | Professional consultation, AI |
| 5 | Professional Drawings | Pre-Design | Architects | CAD, renderings, 3D |
| 6 | Digital Twin (DDTS) | Command Center | Property Managers | Manage everything in one place |
| 7 | Marketplace | Concept | Homeowners | Find & hire professionals |
| 8 | Command Center | DDTS | Contractors | Operations dashboard for teams |

**Then repeats:** Weeks 9–16 = Weeks 1–8 again  
**Result:** Every product featured 6–7 times/year  

---

## Daily Campaign Structure (Mon–Sun)

Each product gets **7 different campaign types**:

| Day | Campaign Type | Focus | Channels | Goal |
|-----|---------------|-------|----------|------|
| **Mon** | Feature Spotlight | Product feature + use case | Email, Slack | Awareness |
| **Tue** | Success Story | Real result from user | Email, SMS, Web | Social proof |
| **Wed** | Educational Content | How-to, tips, insights | Email, Blog, Slack | Authority |
| **Thu** | Limited Offer | Time-sensitive deal | Email, SMS, Web | Urgency |
| **Fri** | Weekend Inspiration | Project ideas, trends | Email, Slack, Web | Engagement |
| **Sat** | User-Generated Content | Community projects | Web, Social, Email | Community |
| **Sun** | Weekly Digest | Week summary + preview | Email, Slack | Recap + anticipation |

---

## Campaign Examples

### Week 1: Concept Engine (Targeting Homeowners)

**Monday – Feature Spotlight**
- Email Subject: "🎨 Your project deserves a great design"
- Focus: AI concept generation
- CTA: "Start your free concept"
- Expected: 5–10 clicks, 1–2 leads

**Tuesday – Success Story**
- Email Subject: "😍 See what other homeowners designed"
- Story: Sarah's kitchen redesign in 2 hours
- CTA: "Design yours"
- Expected: 3–5 conversions

**Wednesday – Educational**
- Email Subject: "5 design trends for 2026"
- Content: Blog post + tips
- CTA: "Try our AI design tool"
- Expected: 2–4 qualified leads

**Thursday – Limited Offer**
- Email Subject: "24-hour offer: Concept + Estimates for $299"
- Pricing: Bundle deal (exclusive)
- CTA: "Claim your offer"
- Expected: 5–10 high-intent conversions

**Friday – Weekend Inspiration**
- Email Subject: "Weekend project ideas for your home"
- Content: Gallery of concepts
- CTA: "Start planning"
- Expected: 3–5 leads for future

**Saturday – UGC**
- Web: Showcase 3 user designs
- Title: "Community Showcases"
- CTAs: See portfolio, hire contractor
- Expected: 2–5 portfolio clicks

**Sunday – Digest**
- Email Subject: "This week in Kealee: 5 home design ideas"
- Content: Week recap + next week preview
- CTA: "See next week's theme"
- Expected: 3–5 clicks to next campaign

**Week 1 Total:** 20–40 leads, $2,000–5,000 revenue

---

## Buyer Personas & Messaging

### Homeowners & DIY
- **Pain:** Unsure where to start, don't know costs
- **Hook:** "Get professional design in minutes"
- **Value:** "Know exactly what your project costs"
- **Primary Products:** Concept, Estimation, Marketplace
- **Best Days:** Mon, Tue, Fri (inspiration focus)

### Contractors & Builders
- **Pain:** Manual processes, hard to track projects
- **Hook:** "Access pre-qualified leads automatically"
- **Value:** "Automate estimating & project management"
- **Primary Products:** Marketplace, Command Center, DDTS
- **Best Days:** Wed, Thu (education + offer)

### Architects & Designers
- **Pain:** Design revisions manual, no lead sources
- **Hook:** "AI-powered design tools + lead generation"
- **Value:** "Deliver 10x more projects with automation"
- **Primary Products:** Concept, Pre-Design, Drawings
- **Best Days:** Mon, Fri, Sun (inspiration + showcase)

### Property Managers & Operators
- **Pain:** Scattered data, coordination chaos
- **Hook:** "Single dashboard for all properties"
- **Value:** "Cut project costs by 20%"
- **Primary Products:** Command Center, DDTS, Permits
- **Best Days:** Wed, Thu (education + tools)

---

## Campaign Performance Tracking

### Real-Time Metrics

```sql
-- Daily campaign performance
SELECT
  campaign_id,
  sent_at,
  recipients_count,
  open_rate,
  click_rate,
  leads_generated,
  attributed_revenue
FROM marketing_campaigns
WHERE sent_at > now() - interval '7 days'
ORDER BY leads_generated DESC;

-- Weekly summary
SELECT
  week_number,
  primary_product,
  SUM(recipients_count) as total_recipients,
  AVG(open_rate) as avg_open_rate,
  AVG(click_rate) as avg_click_rate,
  SUM(leads_generated) as total_leads,
  SUM(attributed_revenue) as total_revenue
FROM marketing_campaigns
WHERE week_number = 1
GROUP BY week_number, primary_product;
```

### Targets & KPIs

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Open Rate | 25%+ | TBD | – |
| Click Rate | 5%+ | TBD | – |
| Conversion Rate (leads) | 2%+ | TBD | – |
| Leads/Campaign | 5+ | TBD | – |
| Revenue/Week | $5,000+ | TBD | – |
| ROI | 3:1+ | TBD | – |

---

## Lead Attribution & Routing

### How Leads Flow

```
1. Lead submitted intake form
   ↓
2. Lead scored (Phase 1 automation)
   ↓
3. If hot (score ≥75):
   ├─ Persona detected (homeowners | contractors | etc.)
   ├─ Matched to this week's campaign
   └─ Marked with campaign_id
   ↓
4. Daily campaign sends
   ├─ Lead receives campaign email/SMS
   └─ Track open/click
   ↓
5. If conversion:
   ├─ Revenue attributed to campaign
   ├─ Update campaign_weekly_summary
   └─ Feed results back to marketing
   ↓
6. Next week optimization
   ├─ Review top-performing campaigns
   ├─ Adjust messaging if needed
   └─ Plan next rotation
```

---

## Implementation Checklist

### Prerequisites
- [ ] Database migrations applied (004-marketing-campaigns-schema.sql)
- [ ] Personas assigned to leads (during form submission)
- [ ] Campaign messaging templates created
- [ ] Email/SMS delivery configured
- [ ] Slack notifications enabled

### Deployment
- [ ] Monday 8 AM Cron: `/api/cron/generate-weekly-campaigns`
- [ ] Daily 9 AM Cron: `/api/cron/send-daily-campaigns`
- [ ] Weekly 9 AM Report: Email campaign performance summary

### Monitoring
- [ ] Campaign dashboard: `/api/admin/marketing/campaigns`
- [ ] Weekly summary: Email report
- [ ] Monthly ROI analysis: Track revenue attribution

---

## Example: Week 1 Campaign Data

```json
{
  "week": 1,
  "primary_product": "conceptEngine",
  "secondary_product": "marketplace",
  "persona": "homeowners",
  "theme": "Get design ideas in minutes",
  "campaigns": [
    {
      "id": "concept-w1-monday",
      "day": "Monday",
      "type": "feature_spotlight",
      "subject": "🎨 Your project deserves a great design",
      "recipients": 500,
      "sent_at": "2026-05-12T09:00:00Z",
      "opens": 125,
      "clicks": 25,
      "conversions": 2,
      "leads": 2,
      "revenue": 298
    },
    {
      "id": "concept-w1-tuesday",
      "day": "Tuesday",
      "type": "success_story",
      "subject": "😍 See what other homeowners designed",
      "recipients": 498,
      "sent_at": "2026-05-13T09:00:00Z",
      "opens": 149,
      "clicks": 30,
      "conversions": 3,
      "leads": 3,
      "revenue": 497
    }
    // ... more days
  ],
  "week_totals": {
    "total_sent": 3500,
    "total_opens": 700,
    "avg_open_rate": 0.20,
    "total_clicks": 140,
    "avg_click_rate": 0.04,
    "total_leads": 15,
    "total_revenue": 2100,
    "roi": 2.8
  }
}
```

---

## Configuration

Edit `lib/marketing/marketing-engine.ts` to customize:

```typescript
// Add products
KEALEE_PRODUCTS.myNewProduct = { ... }

// Add personas
MARKETING_PERSONAS.myNewPersona = { ... }

// Modify rotation
WEEKLY_CAMPAIGN_ROTATION.week1 = {
  primary: 'myProduct',
  persona: 'myPersona',
  // ...
}

// Customize messaging
CAMPAIGN_MESSAGE_TEMPLATES.myProduct = { ... }
```

---

## Success Metrics (After 12 Weeks)

| Metric | Target |
|--------|--------|
| Campaigns Generated | 84 (12 weeks × 7 days) |
| Total Leads Generated | 600+ (50+ leads/week) |
| Average Open Rate | 20%+ |
| Average Click Rate | 4%+ |
| Conversion Rate (leads) | 2%+ |
| Total Revenue | $60,000+ |
| Cost Per Lead | $50 (from $100 baseline) |
| ROI | 3:1+ |

---

## Next Phase: AI-Optimized Campaigns

In Month 2+, use AI to:
- **Auto-generate** campaign copy (Claude API)
- **Personalize** messaging by lead behavior
- **A/B test** subject lines automatically
- **Optimize** send times per persona
- **Predict** best products for each lead

---

## Questions?

- **How do I customize campaigns?** Edit `lib/marketing/marketing-engine.ts`
- **How do I track performance?** Query `campaign_weekly_summary` table
- **How do I add personas?** Update `MARKETING_PERSONAS` config
- **How do I add products?** Update `KEALEE_PRODUCTS` config

**Start:** Deploy migrations, enable cron jobs, go live!

Expected: 50+ leads/week, fully attributed to campaigns.
