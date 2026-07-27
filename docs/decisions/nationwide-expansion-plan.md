# Nationwide Expansion Plan

**Date**: July 2026  
**Status**: Pre-Implementation  
**Scope**: Design Intake, Estimation, Permit Services  
**Current Market**: DC/MD/VA (DMV)  
**Target**: All 50 States + DC  

---

## Executive Summary

Kealee currently operates in 8 DMV jurisdictions (DC, Montgomery County MD, Prince George's County MD, Arlington County VA, Alexandria VA, Fairfax County VA, and 2 others). Current services are **jurisdiction-locked** at build time.

**Nationwide expansion requires:**
- Dynamic jurisdiction detection + configuration
- Multi-state cost database integration (RSMeans regional multipliers)
- State-level permit pathway management
- Compliance rule engine per state
- Regional pricing adjustments
- Contractor network expansion

**Revenue Impact**: 4-8x TAM increase (DMV ≈ 2M eligible homes, US ≈ 140M eligible homes)

---

## Current Architecture (DMV-Only)

### Jurisdiction Binding
```
File: packages/os-engineering/src/jurisdictions.ts
├── DMV_ENGINEERING_JURISDICTIONS (hardcoded array)
├── Jurisdictions: DC, Montgomery County MD, Prince George's County MD, 
│   Arlington County VA, Alexandria VA, Fairfax County VA
└── Status: "SOURCE_LOOKUP_REQUIRED" or "DETERMINISTIC_RULES" (pre-computed)
```

**Problem**: New jurisdictions require code changes + redeployment.

### Pricing (Flat, Nationwide)
```
File: packages/core-rules/src/pricing.ts
├── CONCEPT_KITCHEN_PRICE = 199 (flat)
├── CONCEPT_BATH_PRICE = 159 (flat)
├── PERMIT_STANDARD_PRICE = 799 (flat)
├── ESTIMATION_PRICE = 249 (flat)
└── PROFESSIONAL_DESIGN_BASE = 4995 (flat)
```

**Problem**: Ignores regional cost variation.
- Austin, TX average home: $250K (permit: $100-200)
- San Francisco, CA average home: $1.2M (permit: $800+)
- Cleveland, OH average home: $120K (permit: $50)

### Cost Database (DMV Sample)
```
File: data/ctc/ctc-tasks.json
├── Coverage: 41-task DEV SAMPLE (Gordian CTC)
├── Source: packages/estimating/src/seed-ctc.ts
└── Problem: No regional multipliers, sample coverage only
```

### Compliance (DMV-Only)
```
File: packages/compliance/src/jurisdiction-rules.ts
├── DC zoning rules (hardcoded)
├── Maryland setback rules (hardcoded)
├── Virginia floodplain rules (hardcoded)
└── Problem: No expansion mechanism
```

---

## What's Needed for Nationwide

### 1. Dynamic Jurisdiction System

**Current**: Hardcoded array in code  
**Needed**: Database-backed jurisdiction registry

```prisma
model Jurisdiction {
  id            String  @id
  code          String  @unique  // US-CA-SFO or US-CO-DENVER
  name          String
  state         String
  county        String?
  city          String?
  
  // Automation readiness
  automationStatus  String  // FULLY_AUTOMATED, SOURCE_LOOKUP, MANUAL
  
  // Sourcing
  sources       Json    // { zoning: url, permits: url, building: url }
  
  // Rules
  complianceRules Json  // { setbacks, lot_coverage, height_limits, ... }
  
  // Pricing adjustments
  costMultiplier Float  // 0.8 = 20% cheaper than national avg
  permitMultiplier Float
  
  // API endpoints
  zoneingApi    String?
  permitApi     String?
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@index([state])
  @@index([code])
}
```

**Implementation Effort**: 2-3 weeks
- Create Prisma model
- Build admin UI for jurisdiction management
- Migrate hardcoded DMV jurisdictions to DB
- Add fallback to hardcoded for missing jurisdictions

### 2. Regional Cost Database

**Current**: Single 41-task sample, no regional variance  
**Needed**: Multi-source cost data with regional adjusters

```prisma
model CostDatabase {
  id            String  @id
  jurisdiction  String  // References Jurisdiction.code
  source        String  // "RSMeans-2026", "Gordian-2026", "Local-Builder-2026"
  
  // Base costs
  tasks         Json    // { "26-030": { labor: 45, material: 120, ... } }
  
  // Regional multiplier (RSMeans standard)
  cityIndex     Float   // 100.0 = national average
  laborIndex    Float
  materialIndex Float
  
  // Effective dates
  effectiveDate DateTime
  expiresAt     DateTime?
  
  createdAt     DateTime @default(now())
}
```

**Implementation Effort**: 4-6 weeks
- RSMeans API integration (licensed data)
- Regional multiplier lookup by ZIP
- Fallback to national average if regional unavailable
- Cost database API endpoint `/api/estimation/database/`

**Data Sources**:
1. **RSMeans** (primary, licensed)
   - $0.30-0.50 per sq ft (annual subscription ~$5K)
   - City index database (235+ locations)
   - Labor/material/equipment breakdowns

2. **Gordian** (alternative, ~$10K/year)
   - Slightly lower cost than RSMeans
   - Similar coverage

3. **Local Builder Quotes** (fallback)
   - Crowdsourced from contractor network
   - Less accurate, zero license cost

### 3. State-Level Compliance Rules

**Current**: DMV hardcoded  
**Needed**: State-by-state rule matrix

```prisma
model ComplianceRule {
  id            String  @id
  jurisdiction  String  // Jurisdiction code
  ruleType      String  // "SETBACK", "LOT_COVERAGE", "HEIGHT_LIMIT", "PARKING"
  
  // Rule data
  ruleValue     String  // "10 feet from lot line" or "60% max"
  unitType      String  // "feet", "percent", "spaces_per_1000_sqft"
  
  // Application
  appliesTo     String[] // ["residential", "commercial", "mixed-use"]
  zoneTypes     String[] // ["R-1", "R-2", "C-1"] (state specific)
  
  // Source
  sourceCode    String  // "CA Title 24 § 102.1"
  sourceUrl     String
  lastVerified  DateTime
  
  createdAt     DateTime @default(now())
}
```

**Coverage Needed**:
- 50 states + DC = 51 legislatures
- Avg 3-5 major compliance categories per state
- ~200-250 rules total for MVP
- Budget: 1 full-time compliance researcher, 8-12 weeks

**Rule Categories** (MVP scope):
- Setback requirements (residential)
- Lot coverage limits (residential)
- Height limits (residential)
- Parking requirements (commercial)
- ADU rules (if applicable)
- Energy codes (varies by state)

### 4. Permit Pathway System

**Current**: DMV-specific filing paths  
**Needed**: State-by-state permit filing pathways

```prisma
model PermitPathway {
  id            String  @id
  jurisdiction  String
  projectType   String  // "addition", "kitchen_remodel", "new_construction"
  
  // Workflow
  steps         Json    // { 1: { name: "Initial Review", days: 5, cost: 100 }, ... }
  
  // Requirements
  requiredDocs  String[]  // ["site_plan", "elevation", "electrical_plan"]
  
  // Agency
  agency        String  // "DC Department of Buildings"
  agency_url    String
  contact       String?
  
  // Timeline
  averageDays   Int     // Processing time
  
  // Cost
  permitFee     Float
  
  createdAt     DateTime @default(now())
}
```

**Implementation**: 6-8 weeks
- Research permit workflows for each state's top 5 metros
- Build permit pathway database
- Wire into permit recommendation engine

### 5. Regional Pricing Adjustments

**Current**: Flat pricing across all regions  
**Needed**: Demand-based + cost-based pricing

```
Kitchen Concept Pricing Model:
─────────────────────────────────────────
Base Price: $199 (entry funnel)

Regional Adjustments:
├─ Tier 1 (High-demand metros): +$50-100
│  Examples: SF, NYC, Boston, LA, Seattle, DC
│  Justification: Higher customer LTV, premium market
│
├─ Tier 2 (Mid-demand metros): +$0-25
│  Examples: Denver, Austin, Phoenix, Tampa, Charlotte
│  Justification: Moderate market opportunity
│
└─ Tier 3 (Rural/lower-demand): -$30-50
   Examples: Nebraska, Iowa, Kansas, Mississippi
   Justification: Cost basis, lower willingness-to-pay

Result:
- SF/NYC: $299 (entry)
- Denver/Austin: $199 (standard)
- Rural: $149 (growth market)

Permit Pricing (based on actual permit fees + markup):
─────────────────────────────────────────────────
National avg permit fee: $500-700
Kealee service fee: $799 (flat today)

Adjustment by jurisdiction:
- DC permit: $200 → Kealee charges $799 (400% markup)
- CA permit: $1,200 → Kealee charges $1,499 (25% markup, loss leader)
- TX permit: $400 → Kealee charges $699 (75% markup)
```

**Implementation**: 2-3 weeks
- Build pricing adjustment lookup table in DB
- Update checkout and marketing pricing logic
- A/B test regional prices for demand elasticity

### 6. Contractor Network Expansion

**Current**: DMV contractors only  
**Needed**: National network

```prisma
model Contractor {
  id            String  @id
  // existing fields ...
  
  // Service area (NEW)
  serviceAreas  String[]  // ["US-CA-SFO", "US-CA-OAKLAND", "US-CA-BERKELEY"]
  states        String[]  // ["CA", "OR"]
  metros        String[]  // ["San Francisco", "Oakland"]
  
  // Licensing (NEW)
  licenses      Json  // { "CA": { license_number: "123456", issued: "2020-01-01" }, ... }
  
  createdAt     DateTime @default(now())
}

model ContractorReferral {
  id            String  @id
  projectId     String
  contractor    String  // Contractor ID
  jurisdiction  String  // Jurisdiction code
  
  // Matching logic
  matchScore    Float   // 0-100, based on availability, rating, license
  reasonDenied  String? // Why contractor not matched
  
  status        String  // OFFERED, CONTACTED, ACCEPTED, DECLINED
  
  createdAt     DateTime @default(now())
}
```

**Implementation**: Ongoing
- Recruit 5-10 contractors per metro (500+ total)
- Background checks and licensing verification
- Commission structure negotiation
- Timeline: 4-6 months to build sufficient density

---

## Revenue Impact Analysis

### Current DMV Revenue (Baseline)

**Market Size**: 
- ~2M eligible homes in DMV region
- ~5-8% conversion to concept (100K-160K customers/year potential)
- Current realized: ~1,000-2,000 customers/year (estimate)

**Current Mix** (conservative estimate):
- 40% concept only ($199 avg): $80K revenue/year
- 35% concept + estimation ($199 + $249): $156K revenue/year
- 15% full bundle ($199 + $249 + $799): $45K revenue/year
- 10% permit only ($799): $8K revenue/year

**DMV Total**: ~$289K/year (current)

### Nationwide Revenue (Projected)

**Market Size**:
- ~140M eligible homes in US
- 70x larger market than DMV
- Assumes same conversion rate

**Conservative Scenario** (5x TAM due to fragmentation, brand building):
- Year 1 (first 5 states): $500K-1M
- Year 2 (expansion to 25 states): $2M-4M
- Year 3 (national coverage): $5M-8M

**Moderate Scenario** (8x TAM, better market penetration):
- Year 1: $1M-2M
- Year 2: $4M-8M
- Year 3: $10M-15M

**Optimistic Scenario** (10x TAM, market leader positioning):
- Year 1: $2M-3M
- Year 2: $8M-12M
- Year 3: $15M-25M

### Unit Economics (Nationwide)

```
Average Customer LTV (subscription-free model):
├─ Concept: $199 (entry)
├─ Estimation: +$249
├─ Permit: +$799
├─ Contractor Match: $0 (affiliate/commission)
└─ Average LTV: $400-500 per customer

Gross Margin:
├─ Design concept generation (Replicate/OpenAI): 30-40% COGS
├─ Permit routing (human lawyer review): 50% COGS
├─ Estimation (cost data licensing): 20% COGS
├─ Contractor match (no COGS): 100%
└─ Blended margin: 55-65%

Adjusted Revenue Scenarios (with realistic conversion):
├─ Year 1 (5 states, 0.5% conversion): $800K revenue, $400K contribution
├─ Year 2 (15 states, 0.8% conversion): $3M revenue, $1.5M contribution
└─ Year 3 (nationwide, 1.2% conversion): $8M revenue, $4.5M contribution
```

### Cost of Nationwide Expansion

**One-Time Setup Costs**:
| Item | Cost | Timeline |
|------|------|----------|
| Jurisdiction DB & admin UI | $25K | 3 weeks |
| RSMeans API integration | $15K | 2 weeks |
| State compliance rules research | $40K | 8-10 weeks |
| Permit pathway system | $30K | 4-6 weeks |
| Regional pricing engine | $15K | 2 weeks |
| QA & testing | $20K | 2-3 weeks |
| **Subtotal** | **$145K** | **5-6 months** |

**Annual Ongoing Costs**:
| Item | Cost | Notes |
|------|------|-------|
| RSMeans data subscription | $6K/year | Updates + regional indices |
| Compliance researcher (0.5 FTE) | $30K/year | Keep rules current |
| Contractor support (0.5 FTE) | $30K/year | Onboarding & disputes |
| Permit law monitoring | $10K/year | State legislative changes |
| Legal review (general counsel hours) | $20K/year | Contract + compliance |
| **Subtotal** | **$96K/year** | |

**ROI Payback**:
- Setup cost: $145K
- Year 1 contribution margin: $400K
- **Payback: ~4 months**
- Year 3 cumulative contribution: $6.4M
- **3-year ROI: 44x**

---

## Phased Rollout Strategy

### Phase 0: Foundation (Months 1-2)

**Objective**: Build platform infrastructure for scalable geo-targeting

**Tasks**:
1. Create Jurisdiction table in Prisma
2. Migrate DMV jurisdictions to DB
3. Build admin UI for jurisdiction management
4. API endpoint: `GET /api/jurisdictions/{code}`
5. Intake form: Dynamic jurisdiction selector (address → auto-detect)

**Deliverables**:
- `packages/database/prisma/migrations/add-jurisdictions.sql`
- `apps/os-admin/app/jurisdictions/page.tsx`
- `apps/web-main/app/api/jurisdictions/route.ts`
- Tests passing: Jurisdiction lookup by address

**Cost**: $25K  
**Timeline**: 2 weeks

### Phase 1: Pilot (Months 3-4)

**Objective**: Validate model with 5 strategic metros

**Selected Markets** (first 5):
1. Austin, TX (high growth, tech-savvy, No 1 for construction)
2. Denver, CO (growth market, high willingness-to-pay)
3. Seattle, WA (high margins, strong contractor network)
4. Boston, MA (high LTV, established permit system)
5. Atlanta, GA (representative of Southeast)

**Tasks**:
1. Add 15-20 jurisdictions to DB (Austin metro, Denver metro, Seattle metro, Boston area, Atlanta area)
2. Integrate RSMeans API for regional cost multipliers
3. Research & add state compliance rules for TX, CO, WA, MA, GA
4. Build permit pathway system for top 5 project types
5. Launch regional pricing (Tier 2: +$0-25)
6. Recruit 50 contractors across 5 metros

**Deliverables**:
- Jurisdiction records for 5 metros in DB
- RSMeans cost lookup API: `GET /api/estimation/costs?jurisdiction=US-TX-AUSTIN`
- Permit pathways for 25 workflows (5 metros × 5 project types)
- Regional pricing live on checkout
- Contractor network: 10 per metro

**Cost**: $50K (3 weeks implementation + 2 weeks contractor recruitment)  
**Timeline**: 4 weeks  
**Revenue Impact**: $50K-150K (estimate, dependent on marketing spend)

### Phase 2: Regional Expansion (Months 5-8)

**Objective**: Expand to 15 metros covering all major regions

**Markets to Add**:
- West: San Francisco, Los Angeles, Phoenix, Las Vegas
- Midwest: Chicago, Minneapolis, Kansas City, St. Louis
- South: New Orleans, Nashville, Miami, Charlotte
- Northeast: New York, Philadelphia, DC (existing + neighboring)

**Tasks**:
1. Add 50+ jurisdictions to DB
2. Expand RSMeans regional multiplier coverage (all 235 RSMeans cities)
3. Research compliance rules for 10 additional states
4. Build permit pathways for 50+ additional workflows
5. Scale regional pricing (Tier 1/2/3 model)
6. Recruit 200+ contractors

**Deliverables**:
- Nationwide RSMeans cost lookup live
- Permit pathways for 75+ project type + jurisdiction combos
- Tiered regional pricing fully operational
- Contractor network: 200+ total

**Cost**: $60K (implementation) + $40K (compliance research)  
**Timeline**: 8 weeks  
**Revenue Impact**: $300K-800K (cumulative)

### Phase 3: National Coverage (Months 9-12)

**Objective**: Full 50-state + DC availability

**Markets to Add**:
- Remaining 30+ metros
- Rural areas (via online-only service model, lower touch)

**Tasks**:
1. Add remaining 200+ jurisdictions
2. Research compliance rules for all 50 states + DC
3. Build permit pathways for all project types (matrix ~500 rows)
4. Full regional pricing model live (all 51 states)
5. Contractor network build-out: 500+ total
6. Marketing & SEO for all major metros

**Deliverables**:
- Nation-wide availability for all 3 core services
- Admin dashboard showing coverage by state
- Contractor dashboard with booking system
- A/B testing framework for regional pricing optimization

**Cost**: $50K (final implementation)  
**Timeline**: 12 weeks  
**Revenue Impact**: $1M-3M+ (year-end cumulative)

---

## Technical Implementation Roadmap

### Week 1-2: Jurisdiction System
```
1. Create Jurisdiction Prisma model
2. Build admin CRUD UI
3. Migrate DMV jurisdictions
4. Add address → jurisdiction lookup (reverse geocode)
5. Wire into intake form
```

### Week 3-4: Cost Database
```
1. RSMeans API account setup + documentation
2. Create CostDatabase Prisma model
3. Build regional cost multiplier lookup
4. Fallback to national average logic
5. Create /api/estimation/costs endpoint
```

### Week 5-6: Compliance Rules
```
1. Compliance rule schema (Prisma model)
2. Start TX, CO, WA, MA, GA research
3. Build compliance rule lookup
4. Wire into permit recommendation engine
5. Create admin UI for rule management
```

### Week 7-8: Permit Pathways
```
1. PermitPathway Prisma model
2. Research top 5 metros × 5 project types
3. Build permit workflow UI
4. Create /api/permits/pathways endpoint
5. Add permit recommendation to checkout flow
```

### Week 9-10: Regional Pricing
```
1. Add costMultiplier, permitMultiplier to Jurisdiction model
2. Update pricing engine to read regional adjusters
3. A/B test framework
4. Marketing price display (regional prices on product pages)
5. Checkout flow validation
```

### Week 11-12: Contractor Network
```
1. Add serviceAreas, licenses to Contractor model
2. Build contractor onboarding flow
3. Create license verification (e.g., state licensing board API)
4. Implement matching algorithm (jurisdiction + rating + availability)
5. Marketing for contractor recruitment
```

---

## Go-to-Market Strategy

### Pre-Launch (Week 0)
- [ ] Announce "Expansion to 5 metros" in press release
- [ ] Launch landing page: "Kealee is coming to Austin, Denver, Seattle..."
- [ ] Build beta waitlist

### Phase 1 Launch (Week 4)
- [ ] Email current DMV customers: "Your service is available nationwide"
- [ ] Paid ads targeting Austin, Denver, Seattle (geo-targeted)
- [ ] Contractor recruitment campaign
- [ ] Launch regional pricing tiers

### Phase 2 Expansion (Week 12)
- [ ] Press release: "Expanding to 15 metros"
- [ ] Regional SEO campaign (city-specific landing pages)
- [ ] Paid search campaigns for each metro
- [ ] Local contractor partnerships

### Phase 3 National (Week 24)
- [ ] "Now available in all 50 states" campaign
- [ ] National TV/podcast ads
- [ ] Contractor marketplace launch
- [ ] "Best in [State]" marketing per state

---

## Risk Mitigation

### Risk: Permit Pathway Accuracy
**Mitigation**: Start with top 5 project types (80% of volume). Validated by lawyers in each jurisdiction. Fallback to manual review for edge cases.

### Risk: Regional Pricing Elasticity
**Mitigation**: A/B test pricing (±$50) before scaling. Use conversion rate and LTV as metric. Adjust quarterly.

### Risk: Contractor Quality Variance
**Mitigation**: Verified licensing, background checks. Customer reviews + rating system. Dispute resolution process.

### Risk: Compliance Rules Lag
**Mitigation**: Quarterly compliance researcher review. Monitor state legislative databases. Legal review for major changes.

### Risk: Cost Database Accuracy
**Mitigation**: RSMeans is industry standard. Supplement with local builder quotes. Allow customer reporting of price discrepancies.

---

## Success Metrics

### Year 1
- [ ] 5 metros launched and live
- [ ] 50,000+ customers served nationwide
- [ ] $500K-1M revenue
- [ ] 200+ contractors in network
- [ ] 80%+ customer satisfaction (NPS > 40)

### Year 2
- [ ] 15 metros live
- [ ] 200,000+ customers served
- [ ] $2M-4M revenue
- [ ] 500+ contractors
- [ ] NPS > 50

### Year 3
- [ ] Full 50-state coverage
- [ ] 1M+ customers served
- [ ] $5M-15M revenue
- [ ] 1,000+ contractors
- [ ] NPS > 60, industry-leading

---

## Conclusion

Nationwide expansion is **technically feasible** and **financially justified** with a 3-4x payback within first year.

**Key Decisions**:
1. **Go/No-Go**: Should we invest $145K over 6 months? (Recommendation: YES — ROI is 44x over 3 years)
2. **Market Selection**: Pilot 5 metros or go directly national? (Recommendation: Pilot 5 for validation)
3. **Pricing Strategy**: Uniform national pricing or regional tiers? (Recommendation: Tier model with demand/cost basis)
4. **Contractor Model**: Company-employed or affiliate network? (Recommendation: Affiliate with commission + reputation score)

**Next Step**: Approve Phase 0 (Foundation) to begin building infrastructure.

---

## Appendix: Current DMV Jurisdictions

- US-DC-DC (District of Columbia)
- US-MD-MONTGOMERY (Montgomery County, MD)
- US-MD-PRINCE_GEORGES (Prince George's County, MD)
- US-VA-ARLINGTON (Arlington County, VA)
- US-VA-ALEXANDRIA (City of Alexandria, VA)
- US-VA-FAIRFAX_COUNTY (Fairfax County, VA)
- US-VA-LOUDOUN_COUNTY (Loudoun County, VA) [inferred]
- US-MD-CHARLES_COUNTY (Charles County, MD) [inferred]

Total DMV coverage: ~2M eligible homes
