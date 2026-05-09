# 🏗️ KEALEE ARCHITECTURE CLARIFICATION

## Claude-Powered AI, Dual Service Model, and Pricing Structure

---

## PART 1: CLAUDE'S ROLE IN KEALEE PLATFORM

### What Claude Powers

```
CLAUDE (SONNET 4.6) POWERS:
═════════════════════════════════════════════════════════════════════

1. DESIGN BOT (DesignBot - Opus 4.6)
   ├─ Input: Customer intake + design preferences
   ├─ Output: 
   │  ├─ Floor plan (2D layout + dimensions)
   │  ├─ Renderings (3-4 perspective views)
   │  ├─ MEP preliminary specs (NOT full engineering)
   │  │  ├─ Electrical: Panel capacity, circuit summary
   │  │  ├─ Plumbing: Layout, trap sizes (basic)
   │  │  └─ HVAC: Tonnage estimate, basic routing
   │  ├─ Materials & finishes list
   │  ├─ Timeline estimate
   │  └─ Cost estimate
   └─ Confidence: 80-88%

2. ESTIMATE BOT (EstimateBot - Sonnet 4.6)
   ├─ Input: Design output + CTC catalog + regional data
   ├─ Output:
   │  ├─ Itemized cost breakdown
   │  ├─ Labor estimates (by trade)
   │  ├─ Material pricing
   │  ├─ Permit cost summary
   │  ├─ Regional multipliers applied
   │  ├─ Financing options
   │  └─ Confidence score
   └─ Uses: Claude for analysis + CTC data for pricing

3. PERMIT BOT (PermitBot - Sonnet 4.6)
   ├─ Input: Design output + jurisdiction DB + plans (if provided)
   ├─ Output:
   │  ├─ Permit determination
   │  ├─ Code compliance analysis
   │  ├─ Inspection schedule
   │  ├─ Timeline & cost
   │  └─ Submission readiness assessment
   └─ Executes: Portal APIs, form submission, status tracking

4. PLAN GENERATION SERVICE (NEW - Claude-Powered)
   ├─ Input: Customer intake + design concept (if exists)
   ├─ Output:
   │  ├─ PROFESSIONAL floor plans (permit-ready)
   │  ├─ FULL electrical specifications
   │  ├─ FULL plumbing specifications
   │  ├─ FULL HVAC specifications
   │  ├─ MEP schematics (detailed)
   │  ├─ Material schedules
   │  └─ Building department stamped versions
   └─ Used by: Permit submission (when client doesn't have plans)

WHAT CLAUDE DOES NOT DO:
├─ Stamp/certify plans (only licensed PEs/Architects)
├─ Generate full structural calcs (needs PE)
├─ Energy modeling (too complex for AI alone)
├─ Geotechnical analysis (requires site testing)
└─ Final code interpretation (human legal decision)

CLAUDE CONFIDENCE RANGES:
├─ Design concept: 80-88%
├─ Permit analysis: 85-95%
├─ Cost estimates: 75-85%
├─ Code compliance summary: 90-95%
└─ Plan quality assessment: 85-92%
```

---

## PART 2: DESIGN BOT OUTPUT SPECIFICATION

### What DesignBot Actually Produces

```
DESIGN BOT TIER 1 & 2 OUTPUT (Limited MEP):
═════════════════════════════════════════════════════════════════════

VISUAL DELIVERABLES:
├─ 2D Floor Plan
│  ├─ Layout with dimensions (to scale)
│  ├─ Room labels & square footage
│  ├─ Door/window placement & sizing
│  ├─ Fixture locations (sinks, toilets, appliances)
│  ├─ Material change lines (tile to wood, etc)
│  └─ Title block with project info
│  
├─ 3-4 Perspective Renderings
│  ├─ Kitchen/main area view
│  ├─ Bathroom view (if applicable)
│  ├─ Overall space view
│  └─ Style/finish visualization
│
└─ Material Board
   ├─ Flooring samples
   ├─ Cabinet finishes
   ├─ Countertop colors
   ├─ Backsplash options
   └─ Appliance selections

PRELIMINARY MEP SPECS (NOT FULL ENGINEERING):
├─ ELECTRICAL
│  ├─ Main panel capacity requirement (e.g., "150A or 200A")
│  ├─ New circuit summary (e.g., "2x 20A appliance circuits")
│  ├─ Outlet count & locations (approximate)
│  ├─ Lighting fixture types & count
│  ├─ Switch placement
│  └─ Load calculation (approximate, not PE-stamped)
│  
├─ PLUMBING
│  ├─ Water supply line diameter (e.g., "¾ inch main")
│  ├─ Hot water heater sizing estimate
│  ├─ Drain routing diagram (simple)
│  ├─ Trap sizes (standard sizing, not calculated)
│  ├─ Vent locations (approximate)
│  └─ Fixture count & types
│  
└─ HVAC
   ├─ Cooling/heating load estimate (BTU/tonnage)
   ├─ Equipment type recommendation (mini-split, etc)
   ├─ Duct routing (schematic only)
   ├─ Return air locations
   └─ Thermostat placement

WHAT IS NOT INCLUDED (Requires Professional Engineering):
├─ ❌ Electrical: Load calculations per NEC, wire sizing, AFCI requirements
├─ ❌ Plumbing: Pressure & gravity drainage calcs, code-specific venting
├─ ❌ HVAC: Detailed psychrometric charts, ductwork sizing per ASHRAE
├─ ❌ Structural: Beam sizing, load paths, PE stamp
├─ ❌ Energy modeling: Code compliance (IECC, etc)
├─ ❌ Accessibility: ADA compliance verification
└─ ❌ Any PE/Architect stamp or certification

DESIGN BOT USE CASE:
├─ Client has existing engineer/architect stamped plans
├─ Client wants: Visualization + material options + rough MEP summary
├─ Next step: Take stamped plans to PermitBot for filing
└─ Limitation: Cannot submit to building dept without full engineering
```

### Design Bot Architecture

```
DESIGN BOT EXECUTION:
═════════════════════════════════════════════════════════════════════

INPUT:
├─ Customer intake form
│  ├─ Service type (kitchen, bathroom, addition)
│  ├─ Space dimensions & layout
│  ├─ Current condition
│  ├─ Desired finishes
│  ├─ Budget
│  └─ Style preferences
│
├─ Optional: Reference images or sketches
└─ Optional: Existing floor plan (image)

CLAUDE ANALYSIS (Sonnet 4.6):
├─ Parse customer requirements
├─ Analyze space constraints
├─ Suggest layout options
├─ Recommend materials based on budget
├─ Estimate MEP needs (rough)
└─ Generate JSON specification

RENDERING ENGINE (Separate - Not Claude):
├─ Use specification to create 2D plan
├─ Generate perspective views
├─ Apply materials/colors
├─ Output PNG/JPG images

FINAL DELIVERABLE:
├─ 1x 2D Floor Plan (PDF)
├─ 3x Perspective Renderings (PNG)
├─ 1x Material Board (PDF)
├─ 1x Specifications Summary (JSON + PDF)
└─ Estimated timeline & cost

TIME TO DELIVER: 2-4 hours
COST: Tier 1 = $99, Tier 2 = $349, Tier 3 = $599
```

---

## PART 3: PERMIT SUBMISSION PATHS

### Path A: Client Has Plans (Lower Price)

```
PATH A: CLIENT PROVIDES EXISTING PLANS
═════════════════════════════════════════════════════════════════════

CUSTOMER SITUATION:
├─ Already has architect-designed plans
├─ Plans are stamped by PE/Architect
├─ Plans include full MEP specifications
├─ Wants: Just help filing permits + coordination

INTAKE PROCESS (/permits-only):
├─ Customer uploads existing plans (PDF/images)
├─ Contractor info, timeline, budget
├─ Simple 3-step form (5 minutes)
└─ No design work needed

PERMITBOT PROCESS (30 minutes):
├─ Review uploaded plans for completeness
├─ Extract key info from plans
├─ Query jurisdiction database
├─ Determine required permits
├─ Fill out permit applications
├─ Generate submission package
├─ Submit to jurisdiction portals
└─ Create tracking record

PRICING TIERS (Plans Already Exist):
├─ Tier 1 (BASIC PERMITS)
│  ├─ Price: $99-199
│  ├─ Includes: Permit checklist, submission guidance
│  ├─ Customer submits their own permits
│  └─ Support: Email only
│
├─ Tier 2 (PROFESSIONAL PERMITS)
│  ├─ Price: $349
│  ├─ Includes: Full application prep, portal submission, status tracking
│  ├─ PermitBot files all permits
│  ├─ Inspection coordination
│  ├─ Plan review response coordination
│  └─ Support: Phone & email
│
└─ Tier 3 (PREMIUM PERMITS)
   ├─ Price: $599
   ├─ Includes: Everything in Tier 2
   ├─ Plus: Expedited processing ($250 extra)
   ├─ Plus: Construction administration (weekly check-ins)
   ├─ Plus: Inspection day presence
   └─ Support: 24/7 dedicated coordinator

REVENUE MODEL (Path A):
├─ Cost to Kealee: ~$20 (API calls, cloud)
├─ Price to customer: $99-599
├─ Margin: 80-95%
└─ Fastest to revenue (30 min to file)

IDEAL FOR:
├─ Contractors with existing relationships
├─ Homeowners with stamped plans
├─ Investors/developers
├─ Anyone who has hired an architect
```

### Path B: Kealee Generates Plans (Higher Price)

```
PATH B: KEALEE GENERATES PERMIT-READY PLANS
═════════════════════════════════════════════════════════════════════

CUSTOMER SITUATION:
├─ No existing plans
├─ Wants: Full design + permits bundled
├─ Willing to pay for professional plans
├─ Wants: All-in-one solution

PROCESS WORKFLOW:
├─ STEP 1: Design Concept (2-4 hours)
│  ├─ DesignBot generates layout + renderings
│  ├─ Customer reviews and approves design
│  └─ Output: Preliminary floor plan + materials
│
├─ STEP 2: Plan Enhancement (4-8 hours)
│  ├─ Manual designer/architect review
│  ├─ Add detailed dimensions
│  ├─ Add engineering annotations
│  ├─ Ensure code compliance
│  └─ Output: Stamped-ready floor plan
│
├─ STEP 3: MEP Specification Generation (8-16 hours)
│  ├─ FULL Electrical:
│  │  ├─ Load calculations per NEC
│  │  ├─ Wire sizing & breaker selection
│  │  ├─ AFCI/GFCI placement per code
│  │  ├─ Panel upgrades (if needed)
│  │  ├─ Outlet/switch placement
│  │  └─ One-line diagram
│  │
│  ├─ FULL Plumbing:
│  │  ├─ Pressure & gravity drainage calcs
│  │  ├─ Trap sizing per IRC
│  │  ├─ Vent stack routing
│  │  ├─ Supply line sizing
│  │  ├─ Hot water system sizing
│  │  └─ Fixture schedule
│  │
│  └─ FULL HVAC:
│     ├─ Load calculation (heating/cooling)
│     ├─ Equipment selection & sizing
│     ├─ Ductwork sizing per ASHRAE
│     ├─ CFM calculations per room
│     ├─ Return air planning
│     └─ Controls & thermostat placement
│
├─ STEP 4: PE/Architect Stamp (2-4 hours)
│  ├─ Licensed professional reviews
│  ├─ Verifies code compliance
│  ├─ Adds professional stamp/signature
│  └─ Output: Permit-ready, court-admissible plans
│
└─ STEP 5: Permit Submission (0.5 hours)
   ├─ PermitBot submits stamped plans
   ├─ Handles all jurisdiction requirements
   ├─ Receives application numbers
   └─ Begins tracking

KEALEE PLAN GENERATION SERVICE PRICING:
├─ TIER 1: BASIC PLAN PACKAGE
│  ├─ Price: $1,200-1,500
│  ├─ Includes:
│  │  ├─ Design concept (DesignBot)
│  │  ├─ Professional floor plan (architect)
│  │  ├─ Basic MEP sketches (preliminary)
│  │  ├─ Material schedule
│  │  └─ Permit submission (Tier 2)
│  └─ Timeline: 5-7 days
│
├─ TIER 2: PROFESSIONAL PLAN PACKAGE
│  ├─ Price: $2,500-3,500
│  ├─ Includes:
│  │  ├─ Design concept (DesignBot)
│  │  ├─ Professional floor plan (architect)
│  │  ├─ FULL Electrical specification (PE-reviewed)
│  │  ├─ FULL Plumbing specification (PE-reviewed)
│  │  ├─ FULL HVAC specification (PE-reviewed)
│  │  ├─ Material & finish schedule
│  │  ├─ Building notes & code references
│  │  ├─ PE/Architect stamp
│  │  └─ Permit submission (Tier 3)
│  └─ Timeline: 10-14 days
│
└─ TIER 3: COMPLETE DESIGN + PERMITS PACKAGE
   ├─ Price: $4,500-6,500
   ├─ Includes:
   │  ├─ Everything in Professional Plan Package
   │  ├─ Full design consultation (architect)
   │  ├─ 3-4 design options reviewed
   │  ├─ Rendering improvements (multiple versions)
   │  ├─ Custom structural notes (if needed)
   │  ├─ Energy code compliance verification
   │  ├─ Accessibility review (ADA compliance)
   │  ├─ Premium Permit Tier (Tier 3 permits)
   │  ├─ Expedited processing ($250 included)
   │  └─ Construction administration (4 weeks included)
   └─ Timeline: 14-21 days

COST STRUCTURE (Path B - Plans):
├─ DesignBot: ~$5 (API calls)
├─ Rendering: ~$50 (cloud resources)
├─ Manual design work: $400-800 (architect time)
├─ MEP specifications: $600-1,200 (engineer time)
├─ PE/Architect stamp: $300-500 (licensing)
├─ Total COGS: $1,355-2,555
│
├─ TIER 1 Price: $1,200-1,500 → Margin: NEGATIVE (-$155 to +$145)
│  └─ Strategy: Tier 1 is loss-leader for customer acquisition
│
├─ TIER 2 Price: $2,500-3,500 → Margin: $945-2,145 (38-46% margin)
│  └─ Most profitable tier
│
└─ TIER 3 Price: $4,500-6,500 → Margin: $1,945-3,945 (43-61% margin)
   └─ Premium customers, highest value

IDEAL FOR:
├─ Homeowners without existing plans
├─ Those wanting full design + permits
├─ Investment/development projects
├─ Anyone willing to pay for convenience
```

---

## PART 4: COMBINED PRICING MATRIX

### All Possible Customer Scenarios

```
SCENARIO MATRIX:
═════════════════════════════════════════════════════════════════════

SCENARIO 1: "I have stamped plans, just need permits filed"
├─ Uses: Permits-Only path (Path A)
├─ Price: $99-599 (Tier 1-3)
├─ Time: 30 min to file
├─ Kealee work: 30 minutes
├─ Kealee margin: 80-95%
└─ Best for: Contractors, existing relationships

SCENARIO 2: "I want design concept + rough estimate, I'll get my own plans"
├─ Uses: Design Concept only
├─ Price: $99-599 (Tier 1-3 concept)
├─ Time: 2-4 hours
├─ Kealee work: 2-4 hours (DesignBot)
├─ Kealee margin: 85-90%
└─ Best for: Budget-conscious, have architect contact

SCENARIO 3: "I want full design + permits + everything"
├─ Uses: Plan Generation (Path B) + Permits (Tier 3)
├─ Price: $4,500-6,500
├─ Time: 14-21 days
├─ Kealee work: 40-60 hours (design + permits)
├─ Kealee margin: 43-61%
└─ Best for: Willing to invest in complete solution

SCENARIO 4: "I want professional plans + permits, mid-tier"
├─ Uses: Plan Generation TIER 2 + Permits (Tier 3)
├─ Price: $2,500-3,500 + $599 = $3,099-4,099
├─ Time: 10-14 days (plans) + 0 (permits incl)
├─ Kealee work: 25-35 hours
├─ Kealee margin: 38-46% on plans, 90%+ on permits
└─ Best for: Sweet spot between value & cost

SCENARIO 5: "I have design concept, need professional plans + permits"
├─ Uses: Design Concept ($349) + Plan Enhancement ($1,500-2,500) + Permits ($599)
├─ Price: $349 + $1,500-2,500 + $599 = $2,448-3,448
├─ Time: 4 hours (concept) + 10-14 days (plans) + 0 (permits)
├─ Kealee work: Design existing + 20-30 hours new work
├─ Kealee margin: Mixed (high on concept, medium on plans)
└─ Best for: Customer already has design idea
```

### Revenue Projections by Service

```
MONTHLY REVENUE PROJECTIONS (at 100 projects/month):
═════════════════════════════════════════════════════════════════════

PATH A: PERMITS ONLY (60% of projects)
├─ 60 projects/month
├─ Mix: 20x Tier 1 ($150 avg) + 30x Tier 2 ($349) + 10x Tier 3 ($599)
├─ Revenue: $20K (Tier 1) + $10.5K (Tier 2) + $6K (Tier 3) = $36.5K
├─ COGS: $20 × 60 = $1,200
├─ Gross profit: $35.3K
├─ Margin: 96.7%

PATH B PLAN GENERATION (35% of projects):
├─ 35 projects/month
├─ Mix: 5x Tier 1 ($1,350 avg) + 20x Tier 2 ($3,000) + 10x Tier 3 ($5,500)
├─ Revenue: $6,750 + $60K + $55K = $121.75K
├─ COGS: $1,900 × 35 = $66.5K
├─ Gross profit: $55.25K
├─ Margin: 45.3%

DESIGN CONCEPT ONLY (5% of projects):
├─ 5 projects/month
├─ Mix: 2x Tier 1 ($99) + 2x Tier 2 ($349) + 1x Tier 3 ($599)
├─ Revenue: $198 + $698 + $599 = $1,495
├─ COGS: $100
├─ Gross profit: $1,395
├─ Margin: 93.3%

TOTAL MONTHLY (100 projects):
├─ Permits-only revenue: $36.5K
├─ Plans revenue: $121.75K
├─ Design-only revenue: $1.5K
├─ TOTAL REVENUE: $159.75K
├─ TOTAL COGS: $67.8K
├─ GROSS PROFIT: $91.95K
├─ GROSS MARGIN: 57.5%

ANNUAL PROJECTION (1,200 projects):
├─ Revenue: $1,917K
├─ COGS: $814K
├─ Gross profit: $1,103K
├─ Gross margin: 57.5%
```

---

## PART 5: WHAT CLAUDE ACTUALLY DOES (Detailed)

### By Bot and Task

```
CLAUDE'S ACTUAL ROLE IN EACH COMPONENT:
═════════════════════════════════════════════════════════════════════

DESIGN BOT (Claude Opus 4.6):
├─ DOES (100% Claude):
│  ├─ Analyzes customer intake preferences
│  ├─ Generates layout recommendations
│  ├─ Calculates space efficiency
│  ├─ Suggests material options within budget
│  ├─ Estimates rough MEP needs
│  ├─ Creates cost estimate from CTC data
│  ├─ Generates JSON spec for floor plan
│  └─ Produces JSON for renderings
│
└─ DOES NOT (Separate tools/humans):
   ├─ Render images (separate graphics engine)
   ├─ Create full MEP specs (engineer does)
   ├─ Structural design (PE required)
   ├─ Energy modeling (specialized software)
   └─ Add PE/Architect stamp (licensed person only)

ESTIMATE BOT (Claude Sonnet 4.6):
├─ DOES (Claude + Data):
│  ├─ Analyzes design for material quantities
│  ├─ Queries CTC catalog (local pricing)
│  ├─ Applies regional multipliers (DC +11.8%)
│  ├─ Calculates labor hours by trade
│  ├─ Determines permit costs by jurisdiction
│  ├─ Generates financing options
│  ├─ Creates detailed cost breakdown
│  └─ Assigns confidence score
│
└─ DOES NOT:
   ├─ Source actual contractor quotes (future feature)
   ├─ Lock in pricing
   └─ Provide binding estimates

PERMIT BOT (Claude Sonnet 4.6):
├─ DOES (Claude + APIs):
│  ├─ Analyzes project for permit requirements
│  ├─ Reviews code compliance against jurisdiction DB
│  ├─ Determines inspection schedule
│  ├─ Evaluates zoning compliance
│  ├─ Generates permit roadmap
│  ├─ Routes API calls to jurisdiction portals
│  ├─ Monitors status (daily polling)
│  ├─ Analyzes plan review comments (Claude)
│  ├─ Suggests revisions (Claude)
│  └─ Logs all actions (audit trail)
│
└─ DOES NOT:
   ├─ Interpret building department decisions legally
   ├─ Negotiate with building dept
   ├─ Overrule building official
   └─ Provide legal opinion

PLAN GENERATION SERVICE (Claude + Human + PE):
├─ STEP 1: Claude Input (15%)
│  ├─ Analyzes design requirements
│  ├─ Generates MEP layout recommendations
│  ├─ Identifies code-compliance issues
│  └─ Creates specifications template
│
├─ STEP 2: Human Architect (35%)
│  ├─ Reviews Claude output
│  ├─ Creates professional floor plan
│  ├─ Adds architectural details
│  ├─ Ensures buildability
│  └─ Quality control
│
├─ STEP 3: Professional Engineer (40%)
│  ├─ Creates full electrical specification (NEC-compliant)
│  ├─ Creates full plumbing specification (IRC-compliant)
│  ├─ Creates full HVAC specification (ASHRAE-compliant)
│  ├─ Performs load calculations
│  ├─ Sizes equipment
│  ├─ Stamps plans (legal liability)
│  └─ Provides engineering certifications
│
└─ STEP 4: Claude Supporting (10%)
   ├─ Quality checks against codes
   ├─ Verifies compliance
   └─ Generates documentation

CRITICAL DISTINCTION:
├─ Claude generates PRELIMINARY MEP specs (design tier)
├─ Professional ENGINEER creates FINAL MEP specs (permit tier)
├─ Claude cannot provide PE stamp (legal requirement)
└─ Plans with Claude specs alone = NOT permit-ready
```

---

## PART 6: CUSTOMER JOURNEY & PRICING EXAMPLES

### Three Detailed Examples

```
EXAMPLE 1: CONTRACTOR WITH EXISTING PLANS
═════════════════════════════════════════════════════════════════════

CUSTOMER:
├─ Contractor doing kitchen remodel
├─ Has architect-stamped floor plans
├─ Has MEP specs from engineer
├─ Just needs: Permits filed

JOURNEY:
├─ Day 1: Visit /permits-only
├─ Day 1: Upload plans, fill 3-step form (5 min)
├─ Day 1: Select Tier 2 ($349)
├─ Day 1: Payment processed via Stripe
│
├─ Day 1 (30 min later): PermitBot autonomous execution
│  ├─ Analyzes uploaded plans
│  ├─ Generates permit applications
│  ├─ Submits to DC DCRA portal
│  ├─ Receives confirmation numbers
│  └─ Creates tracking dashboard
│
├─ Days 2-21: PermitBot continuous tracking (background)
│  ├─ Checks building dept daily
│  ├─ Monitors plan review status
│  ├─ Alerts if comments received
│  └─ No human work needed
│
└─ Day 21: Permits approved, ready for inspection

PRICING:
├─ Service cost: $349 (Tier 2 permits)
├─ Permit filing fees (to building dept): ~$500 (customer pays)
├─ Kealee COGS: ~$20
├─ Kealee margin: 94%
└─ Total customer investment: ~$850


EXAMPLE 2: HOMEOWNER WITHOUT PLANS
═════════════════════════════════════════════════════════════════════

CUSTOMER:
├─ Homeowner wants kitchen remodel
├─ No existing plans
├─ No architect/engineer contact
├─ Wants: Everything in one place

JOURNEY:
├─ Day 1: Visit /concept
├─ Day 1: Fill 4-step intake form (15 min)
├─ Day 1: Select Tier 2 design concept ($349)
│
├─ Day 1-2 (3 hours): DesignBot generates design
│  ├─ Floor plan with layout
│  ├─ 3-4 perspective renderings
│  ├─ Materials list
│  ├─ Preliminary MEP specs
│  └─ Cost estimate
│
├─ Day 2: Customer reviews, approves design
│
├─ Day 2: Customer chooses path:
│  ├─ Option A: "Take design to my architect" (STOP)
│  └─ Option B: "Have Kealee generate full plans for permits" (CONTINUE)
│
├─ Day 2: Select Professional Plan Package ($3,000)
│  └─ Total so far: $349 + $3,000 = $3,349
│
├─ Days 3-12 (10 days): Architect/Engineer work
│  ├─ Day 3-4: Architect creates professional floor plans
│  ├─ Day 5-10: Engineers create full MEP specs
│  ├─ Day 11-12: PE reviews and stamps all plans
│  └─ Customer reviews and approves
│
├─ Day 12: Permits tier selected (Tier 3 = $599)
│  └─ Total: $349 + $3,000 + $599 = $3,948
│
├─ Day 12 (30 min): PermitBot autonomous submission
│  ├─ Submits all permits to DC DCRA
│  ├─ Creates tracking dashboard
│  └─ Begins monitoring
│
└─ Days 13-40: Continuous tracking (automated)

PRICING:
├─ Design concept: $349
├─ Professional plans: $3,000
├─ Permit filing: $599
├─ Permit fees (customer pays): ~$500
├─ TOTAL KEALEE: $3,948
├─ TOTAL CUSTOMER: ~$4,448
│
├─ Kealee COGS:
│  ├─ Design: ~$55
│  ├─ Plans: ~$1,900
│  ├─ Permits: ~$20
│  └─ Total COGS: ~$1,975
│
└─ Kealee margin: 50% ($1,973 profit)


EXAMPLE 3: CONTRACTOR WHO TRUSTS KEALEE
═════════════════════════════════════════════════════════════════════

CUSTOMER:
├─ Contractor doing multi-project portfolio
├─ Does 2-3 projects/month
├─ Wants: Full-service, all-in-one

JOURNEY:
├─ Month 1, Project 1:
│  ├─ Visit /concept → Full design ($349)
│  ├─ Approve design
│  ├─ Proceed to plans ($3,000)
│  ├─ Proceed to permits ($599)
│  └─ Total: $3,948
│
├─ Month 1, Project 2:
│  ├─ Similar: $3,948
│  └─ Total this month: $7,896
│
├─ Month 2, Project 3:
│  ├─ Similar: $3,948
│  ├─ Running total: $11,844
│  └─ Contractor sees ROI, offers referrals
│
└─ Months 3+: Contractor becomes power user
   ├─ 2-3 projects/month × $3,948 = $7.9K-$11.8K/month
   ├─ All permits + plans handled by Kealee
   ├─ Contractor focuses only on construction
   └─ Contractor provides referrals to other contractors

PRICING:
├─ Average monthly spend: $9,000
├─ Annual spend: $108,000
├─ Kealee profit (at 50% margin): $54,000/year
└─ One contractor = sustains ~2 staff (at scale)
```

---

## PART 7: CLAUDE COST BREAKDOWN

### What Kealee Pays Claude

```
CLAUDE API COSTS PER SERVICE:
═════════════════════════════════════════════════════════════════════

DESIGN CONCEPT (Opus 4.6):
├─ Input: ~800 tokens (customer intake)
├─ Output: ~1,500 tokens (JSON spec)
├─ Cost per call: ~$0.15 (cached pricing)
├─ Batch cost: 10 calls = $1.50
└─ Monthly (100 projects): ~$15 design cost

ESTIMATE BOT (Sonnet 4.6):
├─ Input: ~1,200 tokens (design + CTC lookup)
├─ Output: ~1,000 tokens (cost breakdown)
├─ Cost per call: ~$0.03 (Sonnet is cheaper)
├─ Batch cost: 10 calls = $0.30
└─ Monthly (100 projects): ~$3 estimate cost

PERMIT BOT ANALYSIS (Sonnet 4.6):
├─ Input: ~1,500 tokens (project + jurisdiction DB)
├─ Output: ~2,000 tokens (permit roadmap)
├─ Cost per call: ~$0.05
├─ Batch cost: 10 calls = $0.50
└─ Monthly (100 projects): ~$5 analysis cost

PERMIT BOT COMMENT HANDLING (Sonnet 4.6):
├─ Triggered only if plan review comments received (~20% of projects)
├─ Input: ~1,200 tokens (comments analysis)
├─ Output: ~800 tokens (revision suggestions)
├─ Cost per call: ~$0.03
├─ Monthly (20 projects): ~$1.50 cost

TOTAL MONTHLY CLAUDE COSTS (100 projects):
├─ Design: $15
├─ Estimates: $3
├─ Permits analysis: $5
├─ Comment handling: $1.50
└─ TOTAL: $24.50/month

COST PER PROJECT (Claude only):
├─ Design concept: $0.15
├─ Estimate: $0.03
├─ Permit analysis: $0.05
├─ Comment handling: $0.015 (only if triggered)
└─ Total: $0.23 per project (Claude API)

TOTAL KEALEE COGS (All components):
├─ Claude API: $0.23
├─ Portal APIs: $2 (authentication, submissions)
├─ Cloud infrastructure: $5 (compute, storage, bandwidth)
├─ PE/Architect labor (if generating plans): $400-800 (split across volume)
├─ Manual QA (5% of projects): $10
└─ Total per permit: ~$20 (without plans) to $500+ (with plans)
```

---

## SUMMARY: KEALEE ARCHITECTURE

```
CLAUDE'S ROLE:
═════════════════════════════════════════════════════════════════════

✓ DesignBot: Generates preliminary design + MEP concepts
✓ EstimateBot: Costs out projects using CTC data
✓ PermitBot: Analyzes permits, coordinates submissions
✓ Plan Enhancement: Reviews & improves architect-generated plans
✓ Exception Handling: Analyzes building dept comments
✓ Verification: Quality checks on all outputs

✗ Claude does NOT stamp plans (PE/Architect required)
✗ Claude does NOT provide structural engineering (PE required)
✗ Claude does NOT make legal decisions (human required)
✗ Claude does NOT charge separately (included in tier price)


TWO SERVICE MODELS:
═════════════════════════════════════════════════════════════════════

PATH A (60% of customers): Client has plans
├─ Price: $99-599 (permits only)
├─ Kealee work: 30 minutes
├─ Kealee margin: 80-95%
├─ Best for: Contractors, existing plans
└─ Revenue/project: $100-$600

PATH B (40% of customers): Kealee generates plans
├─ Price: $1,200-6,500 (plans + permits)
├─ Kealee work: 40-60 hours
├─ Kealee margin: 43-61%
├─ Best for: Homeowners, complete solution
└─ Revenue/project: $2,500-$5,500

BLENDED ECONOMICS (100 projects/month):
├─ Revenue: $160K
├─ COGS: $68K
├─ Gross profit: $92K
├─ Gross margin: 57.5%
├─ Work required: ~200 hours/month (architects/engineers)
└─ Claude cost: $0.23 per permit (+plan labor if needed)


WHAT CUSTOMERS PAY FOR:
═════════════════════════════════════════════════════════════════════

TIER 1 ($99-$199): Just need permits filed
├─ Minimal service: File permits to building dept
├─ Customer still has plans
└─ Kealee labor: 20-30 minutes

TIER 2 ($349-$599): Want coordination + filing
├─ Service: File permits + track status + coordinate inspections
├─ Customer has plans
└─ Kealee labor: 30 minutes + ongoing monitoring

TIER 3 ($599): Premium with expediting + construction admin
├─ Service: Everything in Tier 2 + expedited + weekly check-ins
├─ Customer has plans
└─ Kealee labor: 30 minutes + 2 hours/month for 3 months

PLAN GENERATION TIER 1 ($1,200-$1,500):
├─ Service: Design concept + basic professional plans + permits
├─ Architect work: 15-20 hours
├─ No full MEP engineering (uses DesignBot specs)
└─ Kealee labor: 20+ hours

PLAN GENERATION TIER 2 ($2,500-$3,500):
├─ Service: Design + full MEP engineering + PE stamp + permits
├─ Full professional engineering: 30-40 hours
└─ Kealee labor: 40+ hours

PLAN GENERATION TIER 3 ($4,500-$6,500):
├─ Service: Everything in Tier 2 + construction admin + expediting
├─ Full professional service: 50-60 hours
└─ Kealee labor: 60+ hours
```

EOF
cat /mnt/user-data/outputs/KEALEE-ARCHITECTURE-CLARIFICATION.md
