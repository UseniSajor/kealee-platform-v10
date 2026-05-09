# Kealee Platform: Marketing Engine
## Weekly Product Campaigns for All Products

**Status:** Ready to Deploy  
**Campaign Frequency:** 7 campaigns/week × 52 weeks/year = 364 campaigns  
**Products Covered:** 8 core products + variants  
**Personas Targeted:** 4 buyer personas  
**Expected Result:** 50+ qualified leads/week from campaigns  

---

## System Overview

Kealee Platform transforms into a **marketing engine** where:

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
