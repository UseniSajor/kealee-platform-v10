# Nextdoor Ads Integration Setup Guide
## Neighborhood-Targeted Lead Generation

**Status:** ✅ Ready to Deploy  
**Integration:** Nextdoor Lead Ads → Kealee Platform  
**Expected Leads:** 10–20/week per neighborhood  
**Target ROI:** 3:1+

---

## Why Nextdoor?

✅ **Hyper-Local Targeting** (neighborhood, block level)  
✅ **Warm Audience** (trusted neighbors, high intent)  
✅ **Easy Lead Form** (native Nextdoor form)  
✅ **High Conversion** (local, know their area)  
✅ **Trackable ROI** (measure by neighborhood)  
✅ **Cost Effective** ($20–50/lead typically)  

Nextdoor performs **best** in:
- High-income neighborhoods ($100k+ household income)
- Urban/suburban areas (strong community)
- Markets with renovation activity
- Zip codes with high home values

---

## Setup Steps (30 Minutes)

### Step 1: Set Up Nextdoor Ads Account (5 min)

1. Go to https://ads.nextdoor.com
2. Sign up or log in
3. Set up advertiser profile
4. Add payment method

### Step 2: Create First Ad Campaign (10 min)

1. **Campaign Settings**
   - Name: "Kealee Exterior Design - [Neighborhood]"
   - Budget: $200–500/day (start small, scale winners)
   - Duration: 7 days for testing

2. **Targeting**
   - Select neighborhoods to test (start with 2–3)
   - Recommended: high-income areas in your market
   - Examples: "Brooklyn Heights", "Park Slope", "Williamsburg"

3. **Ad Creative**
   - Headline: "Get Professional Exterior Designs in 48 Hours"
   - Description: "Free consultation + 5 design concepts"
   - Image: Professional home exterior photo
   - CTA Button: "Get Free Design"

4. **Lead Form**
   - Nextdoor creates native form (no external redirect)
   - Fields to capture:
     - Name (required)
     - Email (required)
     - Phone (optional)
     - Message (optional)
     - Budget (optional, custom field)
     - Service interest (optional, custom field)

5. **Webhook Configuration**
   - After form submission, Nextdoor webhooks to:
   ```
   POST https://your-domain.com/api/webhooks/nextdoor-leads
   ```
   - Payload includes all form fields + metadata
   - Kealee Platform auto-routes to Phase 1 scoring

### Step 3: Enable Webhook in Kealee (5 min)

Set environment variable in Vercel:

```
NEXTDOOR_API_KEY=<your-nextdoor-api-key>
```

(Optional, only if using Nextdoor API directly)

### Step 4: Test Webhook (5 min)

Manually test webhook:

```bash
curl -X POST https://kealee.com/api/webhooks/nextdoor-leads \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Lead",
    "email": "test@example.com",
    "phone": "555-0123",
    "neighborhood": "Park Slope",
    "city": "Brooklyn",
    "state": "NY",
    "zip_code": "11215",
    "service_interest": "exterior",
    "budget": "$20,000",
    "ad_campaign_id": "nextdoor-ps-test"
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

1. Activate campaign in Nextdoor Ads Manager
2. Leads start flowing immediately
3. Check Kealee dashboard for incoming leads
4. Monitor Slack notifications

---

## Neighborhood Selection Strategy

### Tier 1: High Priority (Start Here)
These neighborhoods typically have:
- High home values ($500k+)
- Active renovation interest
- Good lead quality

**Examples by Market:**
- **New York:** Brooklyn Heights, Park Slope, Williamsburg, Upper West Side
- **Los Angeles:** Pacific Palisades, Brentwood, Santa Monica, Westwood
- **San Francisco:** Pacific Heights, Marina District, Nob Hill
- **Chicago:** Lincoln Park, Lakeview, Gold Coast
- **Seattle:** Capitol Hill, Queen Anne, Ballard
- **Boston:** Back Bay, Beacon Hill, Cambridge

### Tier 2: Secondary (After Week 1)
- Medium home values ($300k–500k)
- Growing renovation activity
- Good conversion potential

### Strategy
1. **Week 1:** Test 3 neighborhoods with $300 budget each
2. **Week 2:** Review ROI, scale top 2, pause bottom 1
3. **Week 3+:** Expand winners, test new neighborhoods

---

## ROI Tracking

### Real-Time Dashboard

```sql
-- See leads by neighborhood
SELECT
  neighborhood,
  city,
  leads_count,
  paid_leads,
  revenue_generated,
  cost_per_lead,
  roi
FROM nextdoor_performance
ORDER BY roi DESC;
```

### Example Results After 2 Weeks

```
Neighborhood          | Leads | Paid | Cost/Lead | ROI
Park Slope            | 15    | 3    | $50       | 2.8:1
Brooklyn Heights      | 20    | 5    | $40       | 3.5:1
Williamsburg          | 12    | 2    | $60       | 2.1:1
```

**Action:** Double Park Slope budget, cut Williamsburg

---

## Budget Guidelines

### Small Test (Week 1)
- 3 neighborhoods × $100/day = $300/day total
- Expected: 30–40 leads/week
- Expected leads to paid: 5–10

### Growth (Week 2–4)
- Scale top 2 neighborhoods: $200–300/day each
- Add 2 new test neighborhoods: $100/day each
- Total: $500–800/day

### Optimization (Week 5+)
- Scale top neighborhoods: $500–1,000/day each
- Maintain test neighborhoods: $100/day each
- Total: $1,000–2,000/day (depending on performance)

---

## Lead Flow Example

### Scenario: Park Slope, Brooklyn

```
Thursday 2:00 PM
User sees Nextdoor ad: "Get Professional Exterior Designs in 48 Hours"
User clicks: "Get Free Design"

2:15 PM
Nextdoor lead form opens (native)
User fills:
- Name: John Smith
- Email: john@example.com
- Phone: (718) 555-0123
- Service: Exterior
- Budget: $25,000
- Message: "Looking for modern aesthetic"

2:20 PM
Webhook fires to: /api/webhooks/nextdoor-leads

2:21 PM
Kealee receives lead:
├─ Creates record in Supabase
├─ Scores: 82 (high budget, exterior = 15, Brooklyn = plus 5)
├─ Tags: HOT
├─ Creates GHL contact: "John Smith - Park Slope"
├─ Tags with: nextdoor, hot, park_slope, exterior
└─ Increments nextdoor_performance: park_slope leads += 1

2:22 PM
Phase 1 automation:
├─ SMS alert: "🔥 Hot! John Smith | Exterior | $25k | Park Slope"
└─ You see alert on phone

2:30 PM
You call John or send SMS: "Hi John! Great to see your interest in exterior design..."

---

Conversion path:
Lead → Scoring → Alert → Call → Concept → Estimate → Build
ROI tracked at each step by neighborhood
```

---

## Expected Performance Benchmarks

### Conservative Estimate (Weeks 1–2)
- Cost per lead: $45–60
- Lead to paid conversion: 10–15%
- Cost per customer: $300–400
- Customer lifetime value (if $2,000 service): 5–6x ROI

### Optimized (Week 3+)
- Cost per lead: $30–40 (better neighborhoods + messaging)
- Lead to paid conversion: 15–20%
- Cost per customer: $150–250
- Customer lifetime value: 8–12x ROI

### Top Performers (Month 2+)
- Cost per lead: $20–30 (scaled, optimized)
- Lead to paid conversion: 20%+
- Cost per customer: $100–150
- Customer lifetime value: 12–20x ROI

---

## Optimization Playbook

### Week 1: Foundation
- [ ] Deploy webhook (`/api/webhooks/nextdoor-leads`)
- [ ] Test 3 neighborhoods
- [ ] Send $900 total budget ($300/neighborhood)
- [ ] Collect baseline data
- [ ] Measure cost per lead

### Week 2: Scale Winners
- [ ] Analyze ROI by neighborhood
- [ ] Double budget for top performer
- [ ] Cut underperformers
- [ ] Add 2 new test neighborhoods
- [ ] Monitor conversion rates

### Week 3–4: Optimize
- [ ] Refine ad messaging based on performance
- [ ] Test different service offerings per neighborhood
- [ ] Expand geography
- [ ] Measure cost-per-conversion
- [ ] Calculate customer lifetime value

### Month 2: Scale
- [ ] Identify best neighborhoods (lowest cost-per-lead + highest conversion)
- [ ] Allocate 50% of budget to winners
- [ ] Test new markets
- [ ] Expand daily budget
- [ ] Target 100+ leads/week

---

## Troubleshooting

### Leads Not Arriving

**Check:**
1. Webhook URL in Nextdoor Ads Manager: `https://kealee.com/api/webhooks/nextdoor-leads`
2. Campaign status: "Active" in Nextdoor
3. Logs: Check `/api/webhooks/nextdoor-leads` for errors
4. Test manually (see Step 4 above)

**Fix:**
- Re-verify webhook URL (exact match)
- Check firewall/security rules
- Verify domain is publicly accessible

### Low Lead Quality

**Check:**
- Are leads scoring low in Phase 1?
- Are neighborhoods right fit?
- Is ad copy attracting right audience?

**Fix:**
- Pause low-performing neighborhoods
- Adjust budget estimates in lead form
- Change ad headline/copy
- Target different neighborhoods

### High Cost Per Lead

**Expected:** $30–60/lead initially  
**Target:** Drop to $20–40/lead after optimization

**Improvements:**
- Better neighborhood targeting
- Refined ad copy
- Scaled budgets (lower CPL at higher spend)
- Multiple ad variations

---

## Integration with Phase 1–3 Automation

Nextdoor leads flow through complete automation:

```
Nextdoor Webhook
    ↓
Phase 1 Scoring (automatic)
├─ Score 0–100
├─ Tag: hot/medium/cold
└─ Send SMS alert
    ↓
GHL Contact Creation (automatic)
├─ Create contact with neighborhood tag
├─ Add custom fields (neighborhood, city, zip)
└─ Track in ghl_sync_log
    ↓
Phase 2 AI Qualification (if SMS reply)
├─ Claude scores reply
├─ If qualified: Schedule Calendly slot
└─ Auto-confirm meeting
    ↓
Phase 3 ROI Tracking
├─ Track revenue by neighborhood
├─ Calculate cost-per-lead
└─ Optimize spend
```

---

## Files Updated

- `app/api/webhooks/nextdoor-leads/route.ts` — Webhook handler
- `_docs/migrations/003-marketing-phase3-schema.sql` — `nextdoor_performance` table
- `lib/marketing/marketing-engine.ts` — Added Nextdoor to sources

---

## Resources

- **Nextdoor Ads:** https://ads.nextdoor.com
- **Nextdoor Ads Help:** https://help.nextdoor.com/
- **Kealee Dashboard:** `/api/admin/marketing/dashboard`
- **Neighborhood Performance:** Query `nextdoor_performance` table

---

## Next Steps

1. Create Nextdoor Ads account
2. Deploy webhook (already live)
3. Set up first campaign (pick 3 neighborhoods)
4. Launch with $300–500 budget
5. Monitor performance daily
6. Optimize after week 1
7. Scale winners

---

**Expected Result:** 10–20 leads/week from Nextdoor  
**Timeline:** Live in 30 minutes  
**Payback Period:** 2–4 weeks (3:1 ROI)  

Let's capture neighborhood leads! 🎯
