# SESSION 13 - ARCHITECTURE DIAGRAM

## Complete User Flow

```
USER FLOW - ESTIMATION PATH
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

                           🗂️  FRONTEND
                    
1. User visits /estimate
   ├─ See pricing cards (cost_estimate $595, certified $1,850, bundle $1,100)
   ├─ Click "Order Detailed Estimate"
   └─ Route to /intake/estimation?tier=cost_estimate
   
2. User fills DynamicIntakeForm @ /intake/estimation
   ├─ Contact info: name, email, phone
   ├─ Project details: scope, stage, drawings, complexity
   └─ Submit → Save to sessionStorage + route to /estimation/review
   
3. User reviews @ /estimation/review
   ├─ See project summary
   ├─ Choose tier (radio buttons)
   ├─ Click "Proceed to Payment"
   └─ Trigger checkout flow
   
   
                         🔌  CHECKOUT FLOW
                    
4. Checkout handler (onClick "Proceed to Payment)
   ├─ POST /api/estimation/intake
   │  └─ Validate intake data with EstimationIntakeSchema
   │  └─ Score lead (0-100): scope completeness, stage, contact info, etc.
   │  └─ Return: { intakeId, leadScore, tier, readinessState }
   │  └─ Store in Redis: estimation_intake:{intakeId} (7-day TTL)
   │
   ├─ POST /api/estimation/checkout
   │  └─ Lookup intake in Redis
   │  └─ Create Stripe session:
   │     ├─ line_items: { price: $595/$1,850/$1,100, quantity: 1 }
   │     └─ metadata: { source: "estimation", packageTier, intakeId, customerEmail }
   │  └─ Return: { sessionId, url }
   │
   └─ Redirect to Stripe checkout URL
   
5. User pays @ Stripe
   ├─ Enter card details
   ├─ Confirm payment
   └─ Stripe processes & redirects to /estimation/success
   
6. Success page @ /estimation/success
   └─ Display "Payment Received"
   

                        🤖  BOT EXECUTION (Async)
                    
7. Stripe webhook POST to backend
   ├─ Event: checkout.session.completed
   ├─ Extract metadata: { intakeId, packageTier, customerEmail }
   ├─ Publish event: "estimation.intake.completed"
   └─ EnqueueJob: { type: "generate_estimate", intakeId, tier }
   
8. EstimateBot processes
   ├─ Read EstimateBot input (from intakeId lookup)
   ├─ Generate cost breakdown (by CSI division)
   ├─ Validate with RSMeans data
   ├─ Return EstimateBotOutput:
   │  ├─ costBreakdown: [ { division, items: [{desc, cost}], subtotal }, ... ]
   │  ├─ summary: { directCosts, contingency, GC overhead, margin, total }
   │  ├─ confidence: 0-100
   │  ├─ readinessForPermit: true/false
   │  └─ permitBotInput: { estimateId, totalCost, csiDivisions, ... }
   │
   └─ Store result in database (EstimateRequest model)
   

                          📊 DATA MODELS
                    
┌─ EstimationIntake (what user submits)
│  ├─ contact: { name, email, phone, role }
│  ├─ project: {
│  │  ├─ projectScope: interior_remodel | exterior_renovation | addition | etc.
│  │  ├─ projectStage: pre_design | schematic | design_dev | construction_docs | etc.
│  │  ├─ scopeDetail: verbal | sketch | schematic | design | construction_docs
│  │  ├─ csiDivisions: [concrete, structural_steel, wood_plastics, thermal, ...]
│  │  ├─ costSourcePreference: rsmeans | market_survey | historical
│  │  └─ estimatedBudget: optional string
│  ├─ requiresArchitecturalReview: boolean
│  ├─ requiresEngineeringReview: boolean
│  └─ tierPreference: cost_estimate | certified_estimate | bundle
│
└─ EstimationIntakeResponse (what endpoint returns)
   ├─ intakeId: unique identifier
   ├─ leadScore: 0-100
   ├─ tier: recommended based on score
   ├─ readinessState: READY_FOR_ESTIMATE | NEEDS_MORE_INFO
   ├─ flags: { requiresArchitect, requiresEngineer, complexityLevel, estimatedTurnaround }
   └─ estimatedPrice: cost in cents


USER FLOW - PERMIT PATH
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. User visits /permits
   ├─ See jurisdiction selector + permit service tiers
   └─ Click "Get Submitted" → /intake/permits?tier=submission
   
2. User selects jurisdiction @ /intake/permits
   ├─ Dropdown: DC, PG County, Montgomery, Arlington, Alexandria, Fairfax, Baltimore
   └─ After selection, DynamicIntakeForm appears
   
3. User fills form
   ├─ Contact info
   ├─ Project details + permit types needed
   ├─ Project characteristics (renovation, addition, structural changes, etc.)
   └─ Submit → Save to sessionStorage + route to /permits/review
   
4. User reviews @ /permits/review
   ├─ Display selected jurisdiction + agency info + review timeline
   ├─ Display project summary
   ├─ Choose service tier (document_assembly $495, submission $795, tracking $1,495, ...)
   └─ Click "Proceed to Payment"
   
5. Checkout flow (same as estimation)
   ├─ POST /api/permits/intake
   │  ├─ Validate + score lead
   │  ├─ ⚠️ GATING: If readinessState="NEEDS_ESTIMATE" → HTTP 400
   │  │         "Must provide related cost estimate. Get estimate first."
   │  └─ Else: Return intakeId + tier
   │
   ├─ POST /api/permits/checkout
   │  ├─ Create Stripe session
   │  └─ metadata: { source: "permits", packageTier, intakeId, jurisdiction }
   │
   └─ Redirect to Stripe → /permits/success after payment
   
6. PermitBot processes (async)
   ├─ Read PermitBotInput (from intakeId lookup)
   ├─ Route by jurisdiction:
   │  ├─ DC → use DC DOB rules (14 days review, expedited available)
   │  ├─ PG → use PG County rules (21 days, no expedited)
   │  ├─ Montgomery → use Montgomery County rules (21 days, expedited)
   │  └─ etc. for all 7 jurisdictions
   │
   ├─ Generate PermitBotOutput:
   │  ├─ permitRequirements: [
   │  │  {
   │  │    permitType: building_permit | electrical | plumbing | etc.
   │  │    agency: DC DOB | PG DPS | etc.
   │  │    requiredDocuments: [application, drawings, cost estimate, proof of ownership, ...]
   │  │    timeline: { submissionReady, expeectedReview, estimatedIssuance }
   │  │    riskFactors: [historic district review, wetlands mitigation, ...]
   │  │  }
   │  ]
   │  ├─ jurisdictionSpecificGuidance: {
   │  │  agency, submissionMethod (online | in_person | email),
   │  │  reviewDaysStandard, reviewDaysExpedited, contactInfo
   │  │}
   │  └─ estimatedPermitCosts: { applicationFees, inspectionFees, total }
   │
   └─ Store result in database (PermitServiceLead model)


CHAIN GATING ARCHITECTURE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

                    DesignBot
                        ↓
                    (generates design)
                        ↓
                  EstimateBotInput
                  (with design data)
                        ↓
               ┌─ Gate: DesignBot output exists? ──┐
               │ Gate: Output state = APPROVED?      │
               │ Gate: Design complete?              │
               │ (Ready for estimation)              │
               │                                     │
         YES ──→ EstimateBot executes ────────  NO ──→ HTTP 402 "Need Design"
                        ↓                             nextSteps: ["Complete Design"]
                  (generates estimate)
                EstimateBotOutput with:
                  - cost breakdown
                  - confidence score (0-100)
                  - readinessForPermit: true/false
                  - permitBotInput
                        ↓
               ┌─ Gate: EstimateBot complete? ──┐
               │ Gate: Confidence ≥ 60%?         │
               │ Gate: Output state = APPROVED?  │
               │ (Ready for permitting)          │
               │                                 │
         YES ──→ PermitBot executes ──────  NO ──→ HTTP 402 "Low Confidence"
                        ↓                        nextSteps: ["Revise Estimate"]
               (generates permit package)
               PermitBotOutput with:
                  - jurisdiction-specific docs
                  - inspection schedule
                  - submission timeline
                  - estimated costs


LEAD SCORING ALGORITHM - ESTIMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

       Category              Points      Logic
       ────────────────────────────────────────────────────
       Scope completeness      0-30    construction_docs=30
         (detail level)                 design_drawing=25
                                        schematic_drawing=20
                                        sketch=10
       
       Project stage           0-20    construction_docs/bidding/pricing=20
         (readiness)                   design_development=15
                                        schematic=10
       
       Contact info            0-20    name+email+phone=15
         (completeness)                email only=10
       
       Project type            0-20    interior/exterior remodel=15
         (characteristics)             addition/mep_upgrade=12
       
       Budget provided         0-10    yes=5
       
       ────────────────────────────────────────────────────
       TOTAL SCORE             0-100
       
       Score ≥ 75 → tier: "certified_estimate" (confidence high)
       Score 50-74 → tier: "cost_estimate" (standard)
       Score < 50 → tier: "cost_estimate" + readinessState: "NEEDS_MORE_INFO"


LEAD SCORING ALGORITHM - PERMITS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

       Category              Points      Logic
       ────────────────────────────────────────────────────
       Jurisdiction            0-20    expedited available=15
         (complexity)                   no expedited=10
       
       Contact info            0-15    complete=15
         (completeness)                email only=10
       
       Project clarity         0-30    design docs=20
       (drawings + contractor)          contractor selected=10
       
       Complexity factors      -5 to -10  structural change=-5
         (deducted)                      historic district=-5
                                         wetlands=-10
       
       Permit count            0-20    1 permit=15
         (scope)                       2-3 permits=10
                                        4+ permits=5
       
       ────────────────────────────────────────────────────
       TOTAL SCORE             0-100
       
       Score ≤ 30 → tier: "inspection_coordination" (complex)
       Score ≤ 45 → tier: "tracking" (moderate complexity)
       Score ≤ 60 → tier: "submission" (standard)
       Score > 60 → tier: "document_assembly" (simple)
       
       If NO related estimate → readinessState: "NEEDS_ESTIMATE"


DATABASE & REDIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Redis (7-day TTL):
├─ estimation_intake:{intakeId} → full intake data + scoring
├─ permit_intake:{intakeId} → full intake data + scoring  
├─ estimation_session:{sessionId} → { intakeId, tier }
└─ permit_session:{sessionId} → { intakeId, tier, jurisdiction }

Database (Prisma):
├─ EstimationRequest (to be created or similar)
│  ├─ intakeId: string (FK)
│  ├─ userId: string (FK to auth)
│  ├─ tier: string (cost_estimate | certified | bundle)
│  ├─ leadScore: number
│  ├─ stripeSessionId: string
│  ├─ status: submitted | processing | completed | failed
│  └─ createdAt, updatedAt
│
└─ PermitServiceLead (existing model)
   ├─ intakeId: string (FK)
   ├─ userId: string (FK to auth)
   ├─ jurisdiction: string
   ├─ tier: string (document | submission | tracking | inspection_coordination)
   ├─ leadScore: number
   ├─ stripeSessionId: string
   ├─ status: submitted | processing | completed | failed
   └─ createdAt, updatedAt


DEPLOYMENT CHECKLIST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Before pushing to production:

Backend:
☐ routes registered in services/api/src/index.ts
☐ schemas exported from packages/intake/index.ts
☐ Stripe keys set in env: STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY
☐ APP_URL set to production domain
☐ Redis configured and accessible
☐ Database migrations run (if needed for new models)
☐ Webhook endpoint configured to POST?

Frontend:
☐ API_URL env var points to production backend
☐ /estimation/success page created
☐ /permits/success page created
☐ /estimation/checkout-cancelled page created (optional)
☐ /permits/checkout-cancelled page created (optional)
☐ DynamicIntakeForm component compatible with estimation/permits schemas

Testing:
☐ E2E flow: /estimate → checkout → Stripe test mode → success
☐ E2E flow: /permits → checkout → Stripe test mode → success
☐ Gating test: Permit checkout without estimate returns 400
☐ Lead scoring verified for edge cases
☐ Stripe webhook tested locally

