# Kealee Platform Architecture - Visual Guide
**April 15, 2026** | Complete Service Chain & Data Flow

---

## 1. MONOREPO STRUCTURE

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     KEALEE-PLATFORM-V10 (Monorepo)                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐  ┌──────────────┐   │
│  │   APPS      │  │  PACKAGES    │  │   SERVICES  │  │    BOTS      │   │
│  ├─────────────┤  ├──────────────┤  ├─────────────┤  ├──────────────┤   │
│  │ web-main    │  │ database     │  │ api         │  │ keabot-      │   │
│  │ os-admin    │  │ intake       │  │ command-    │  │ design       │   │
│  │ os-pm       │  │ ui           │  │ center      │  │ keabot-      │   │
│  │ os-ops      │  │ core-bots    │  │ marketplace │  │ estimate     │   │
│  │ m-permits   │  │ core-auth    │  │ keacore     │  │ keabot-      │   │
│  │ m-architect │  │ estimating   │  │ os-pay      │  │ permit       │   │
│  │ +10 more    │  │ +30 more     │  │ +12 more    │  │ +10 more     │   │
│  └─────────────┘  └──────────────┘  └─────────────┘  └──────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │  Shared: pnpm workspaces, TypeScript, Prisma, NextJS, Fastify     │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. SERVICE EXECUTION PIPELINE

```
┌───────────────────────────────────────────────────────────────────────────────┐
│                    KEALEE PLATFORM SERVICE CHAIN                             │
│                     (Design → Estimate → Permits)                            │
├───────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│   PHASE 1: DESIGN GENERATION                                                │
│   ┌─────────────────────────────────────────────────────────────────┐        │
│   │ INPUT: Intake Form                                              │        │
│   │ - Project type, dimensions, budget, photos, preferences        │        │
│   │ - Style preferences, goals, constraints                        │        │
│   │ - Contact info, timeline goals                                 │        │
│   │─────────────────────────────────────────────────────────────────│        │
│   │ PROCESSOR: DesignBot (bots/keabot-design/src/bot.ts)          │        │
│   │ - Claude Opus 4.6 model                                        │        │
│   │ - Tools: generate_design_concept, get_design_status           │        │
│   │ - Output: Floor plan, elevations, 3D renders, cost estimate   │        │
│   │─────────────────────────────────────────────────────────────────│        │
│   │ OUTPUT: DesignConceptId                                         │        │
│   │ - primaryImageUrl, floorPlanUrl, renderingsUrls[]             │        │
│   │ - estimatedCost, estimatedTimeline, estimatedMaterialCost     │        │
│   │ - readinessState: APPROVED | NEEDS_REVISION | READY_FOR_EST   │        │
│   └─────────────────────────────────────────────────────────────────┘        │
│                              ▼                                               │
│                         ┌─────────────┐                                     │
│                         │ Readiness   │                                     │
│                         │ Check?      │                                     │
│                         │ (APPROVED?) │                                     │
│                         └──────┬──────┘                                     │
│                             ┌──┴──┐                                         │
│                          NO │     │ YES                                     │
│                          ┌──▼──┐ │                                         │
│                          │ WAIT │ │                                         │
│                          └─────┘ │                                         │
│                                  ▼                                         │
│   PHASE 2: ESTIMATION (Cost Analysis)                                      │
│   ┌─────────────────────────────────────────────────────────────────┐      │
│   │ INPUT: Estimation Intake + DesignConceptId                     │      │
│   │ - Project scope detail(sketch/schematic/design/construction)   │      │
│   │ - Project stage (ideation/design/bidding/pricing)             │      │
│   │ - Estimated budget, architectural requirements                │      │
│   │ - Design drawings available? Contractor feedback?             │      │
│   │─────────────────────────────────────────────────────────────────│      │
│   │ GATING FUNCTION: gateEstimateOnDesign()                       │      │
│   │ Validates:                                                     │      │
│   │ ✓ designBotOutputId exists                                    │      │
│   │ ✓ hasDesignConcept = true                                     │      │
│   │ ✓ designConceptState in [APPROVED, READY_FOR_ESTIMATE]       │      │
│   │ Blocks: HTTP 402 Payment Required if conditions fail          │      │
│   │─────────────────────────────────────────────────────────────────│      │
│   │ PROCESSOR: EstimateBot (bots/keabot-estimate/src/bot.ts)      │      │
│   │ - Analyzes scope + location                                   │      │
│   │ - Looks up RSMeans costs                                      │      │
│   │ - Calculates labor + materials + contingency                 │      │
│   │ - Generates cost estimate by trade                            │      │
│   │─────────────────────────────────────────────────────────────────│      │
│   │ OUTPUT: EstimateId (Estimate model instance)                  │      │
│   │ - type: DETAILED, BID_ESTIMATE, etc.                         │      │
│   │ - totalCost, costPerSqFt, aiConfidence (0-100)               │      │
│   │ - sections[] (CSI MasterFormat divisions)                     │      │
│   │ - lineItems[] (material, labor, subcontractor costs)          │      │
│   │ - readinessState: READY_FOR_PERMIT | NEEDS_REVISION          │      │
│   │ - confidence_score: 80% (used in permit gating)              │      │
│   └─────────────────────────────────────────────────────────────────┘      │
│                              ▼                                               │
│                      ┌────────────────┐                                     │
│                      │ Confidence     │                                     │
│                      │ ≥ 60% AND      │                                     │
│                      │ Status Ready?  │                                     │
│                      └────────┬───────┘                                     │
│                             ┌─┴──┐                                         │
│                          NO │    │ YES                                     │
│                          ┌──▼──┐ │                                         │
│                          │ WAIT │ │                                         │
│                          └─────┘ │                                         │
│                                  ▼                                         │
│   PHASE 3: PERMIT GUIDANCE (Jurisdiction Compliance)                       │
│   ┌─────────────────────────────────────────────────────────────────┐      │
│   │ INPUT: Permit Intake + EstimateId                              │      │
│   │ - Jurisdiction (DC, PG, MC, ARL, ALX, FFC, BAL)                │      │
│   │ - Permit types (Building, Electrical, Plumbing, etc.)          │      │
│   │ - Project characteristics (renovation, addition, structural)   │      │
│   │ - Design docs available? Contractor selected?                  │      │
│   │ - relatedEstimateId: Links to estimation intake                │      │
│   │─────────────────────────────────────────────────────────────────│      │
│   │ GATING FUNCTION: gatePermitOnEstimate()                        │      │
│   │ Validates:                                                     │      │
│   │ ✓ estimateBotOutputId exists                                  │      │
│   │ ✓ hasEstimate = true                                          │      │
│   │ ✓ estimateState in [APPROVED, READY_FOR_PERMIT]              │      │
│   │ ✓ estimateConfidenceScore ≥ 60%                              │      │
│   │ Blocks: HTTP 402 + nextSteps if conditions fail               │      │
│   │ Returns: canRetry=true, retryAfterMs for retry logic          │      │
│   │─────────────────────────────────────────────────────────────────│      │
│   │ PROCESSOR: PermitBot (bots/keabot-permit/src/bot.ts)          │      │
│   │ - Looks up jurisdiction zoning + requirements                 │      │
│   │ - Validates permit types for jurisdiction                     │      │
│   │ - Checks compliance against local codes                       │      │
│   │ - Estimates permit fees + processing timeline                 │      │
│   │ - Identifies special requirements (historic, wetlands)        │      │
│   │─────────────────────────────────────────────────────────────────│      │
│   │ OUTPUT: PermitGuidanceId                                       │      │
│   │ - permittedUses[], conditionalUses[], prohibitedUses[]        │      │
│   │ - reviewDays estimate, expedited option available?            │      │
│   │ - requiredDocuments, feeSchedule, specialRequirements         │      │
│   │ - complianceFlags (historic_review, wetlands_approval, etc.)  │      │
│   │ - readinessState: READY_FOR_SUBMISSION | NEEDS_REVISION       │      │
│   └─────────────────────────────────────────────────────────────────┘      │
│                              ▼                                               │
│   PHASE 4: CHECKOUT & PAYMENT                                              │
│   ┌─────────────────────────────────────────────────────────────────┐      │
│   │ POST /permits/checkout (or /estimation/checkout)               │      │
│   │ - Validates readinessState = READY_FOR_CHECKOUT               │      │
│   │ - Validates tier selection (document_assembly, submission, etc)│      │
│   │ - Calls Stripe checkout.sessions.create()                     │      │
│   │ - Metadata: intakeId, userId, funnelSessionId, tier           │      │
│   │─────────────────────────────────────────────────────────────────│      │
│   │ OUTPUT: Stripe Session                                         │      │
│   │ - sessionId, url (for redirect)                               │      │
│   │ - Customer receives email confirmation                        │      │
│   └─────────────────────────────────────────────────────────────────┘      │
│                              ▼                                               │
│   PHASE 5: LEAD CAPTURE & FULFILLMENT                                      │
│   ┌─────────────────────────────────────────────────────────────────┐      │
│   │ Webhook: Stripe → API (payment_intent.succeeded)              │      │
│   │ - Lead moves to database from Redis                           │      │
│   │ - Status: ACTIVE (waiting for team to service)               │      │
│   │ - Assignment: Route to contractor/architect based on tier     │      │
│   │ - Notification: Email to customer with next steps            │      │
│   └─────────────────────────────────────────────────────────────────┘      │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. DATA FLOW: INTAKE → EXECUTION → CHECKOUT

```
PUBLIC USER SUBMITS INTAKE
│
├─ Request: POST /estimation/intake
│  ├─ Route Handler: public-estimation-intake.routes.ts
│  ├─ Validation: EstimationIntakeSchema (Zod)
│  └─ Response Immediately: { intakeId, leadScore, tier, readinessState }
│
├─ Redis Storage (7-day TTL)
│  ├─ Key: estimation_intake:{intakeId}
│  ├─ Value: {
│  │   ...intakeData,
│  │   intakeId,
│  │   funnelSessionId,
│  │   scoring: { total, tier, readinessState, flags },
│  │   createdAt
│  │ }
│  └─ TTL: 604,800 seconds (7 days)
│
├─ Lead Scoring Applied
│  ├─ scoreEstimationLead(intake)
│  ├─ Score: 0-100 based on scope + stage + contact + characteristics + budget
│  ├─ Tier: cost_estimate | certified_estimate | bundle (recommended)
│  ├─ Route: immediate (75+) | standard (50-74) | requires_followup (<50)
│  └─ ReadinessState: NEEDS_MORE_INFO | READY_FOR_ESTIMATE
│
├─ Later: User Clicks "Get Estimate" → /estimation/checkout
│  ├─ Request: POST /estimation/checkout { intakeId, tier, email, successUrl, cancelUrl }
│  ├─ Retrieve intake from Redis
│  ├─ Score check: readinessState must be READY_FOR_ESTIMATE
│  ├─ Create Stripe session:
│  │  ├─ mode: "payment"
│  │  ├─ line_items: [{ price_data: { currency: usd, unit_amount, product_data } }]
│  │  ├─ metadata: { source, tier, intakeId, userId, funnelSessionId, email }
│  │  ├─ success_url, cancel_url
│  │  └─ customer_email: user@example.com
│  ├─ Response: { ok: true, sessionId, url }
│  └─ Frontend redirects: window.location = session.url
│
├─ User Completes Payment (Stripe Hosted)
│  ├─ Customer enters card details
│  ├─ Stripe processes payment
│  ├─ Webhook: payment_intent.succeeded → Kealee API
│  └─ Backend moves lead to database, updates status to ACTIVE
│
└─ Lead Enters Command Center for Fulfillment
```

---

## 4. GATING MIDDLEWARE: REQUEST FLOW

```
POST /permits/checkout
  │
  ├─ Validate Request Schema (Zod)
  │  ├─ intakeId: string
  │  ├─ tier: enum
  │  ├─ email: email format
  │  └─ successUrl, cancelUrl: valid URLs
  │
  ├─ Retrieve Intake from Redis
  │  ├─ Key: permit_intake:{intakeId}
  │  ├─ If not found: 404 Not Found
  │  └─ Parse stored JSON
  │
  ├─ CHECK READINESS STATE
  │  │
  │  ├─ Is readinessState = 'NEEDS_ESTIMATE'?
  │  │  │
  │  │  └─ YES? Check relatedEstimateId
  │  │     │
  │  │     ├─ If missing: 
  │  │     │  └─ BLOCK: HTTP 402 Payment Required
  │  │     │     {
  │  │     │       error: 'BLOCKED_BY_GATE',
  │  │     │       code: 'MISSING_ESTIMATE',
  │  │     │       reason: 'Permit requires cost estimate',
  │  │     │       nextSteps: ['Go to Estimation', 'Get estimate', 'Return to permits'],
  │  │     │       canRetry: true
  │  │     │     }
  │  │     │
  │  │     └─ If provided:
  │  │        ├─ Verify estimate exists in database or Redis
  │  │        ├─ Check estimate.confidenceScore ≥ 60%
  │  │        └─ Check estimate.status in [APPROVED, READY_FOR_PERMIT]
  │  │
  │  └─ Is readinessState = 'READY_FOR_PERMIT_PREP'?
  │     └─ YES? Proceed to checkout
  │
  ├─ GATING PASSED ✓
  │  ├─ Create Stripe checkout session
  │  ├─ Store session in Redis with sessionId
  │  └─ Return { ok: true, sessionId, url }
  │
  └─ EOF
```

---

## 5. DATABASE SCHEMA RELATIONSHIPS

```
┌────────────────────────────────────────────────────────────────────┐
│                        DATABASE ENTITIES                          │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  PreConProject                                                     │
│  ├─ id (PK)                                                        │
│  ├─ ownerId (FK → User)                                           │
│  ├─ phase: DESIGN_STARTED                                        │
│  ├─ designPackageTier                                            │
│  └─ designConcepts: DesignConcept[]                              │
│     │                                                             │
│     ├─ DesignConcept (1-to-M)                                    │
│     │  ├─ id (PK)                                                │
│     │  ├─ preConProjectId (FK)                                   │
│     │  ├─ name, style, estimatedCost                             │
│     │  ├─ primaryImageUrl, floorPlanUrl, renderingsUrls[]        │
│     │  └─ isSelected, ownerRating                                │
│     │                                                             │
│     └─ [After Award] → projectId (FK → Project)                  │
│        │                                                          │
│        └─ Project                                                │
│           ├─ id (PK)                                            │
│           ├─ organizationId (FK)                                │
│           ├─ estimateId (FK → Estimate)                         │
│           └─ permits: Permit[] (1-to-M)                         │
│              │                                                   │
│              ├─ Permit (1-to-M)                                 │
│              │  ├─ id (PK)                                      │
│              │  ├─ projectId (FK)                               │
│              │  ├─ jurisdictionId (FK → Jurisdiction)           │
│              │  ├─ permitType: BUILDING | ELECTRICAL | ...      │
│              │  ├─ status: DRAFT → APPROVED → ISSUED            │
│              │  ├─ aiReviewScore                                │
│              │  ├─ submissions: PermitSubmission[]              │
│              │  ├─ corrections: PermitCorrection[]              │
│              │  ├─ inspections: Inspection[]                    │
│              │  └─ events: PermitEvent[]                        │
│              │     │                                             │
│              │     ├─ Inspection (1-to-M)                       │
│              │     │  ├─ id (PK)                                │
│              │     │  ├─ permitId, projectId, jurisdictionId    │
│              │     │  ├─ inspectionType: FOOTING, FOUNDATION    │
│              │     │  ├─ scheduledDate, completedAt             │
│              │     │  ├─ result: PASS | FAIL | ...              │
│              │     │  ├─ deficiencies (JSON)                    │
│              │     │  └─ preparationItems, findings             │
│              │     │                                             │
│              │     └─ PermitEvent (1-to-M)                      │
│              │        ├─ eventType: STATUS_CHANGE, DOCUMENT_UPL │
│              │        ├─ occurredAt                              │
│              │        └─ metadata                                │
│              │                                                   │
│              └─ Jurisdiction (M-to-1 FK)                        │
│                 ├─ id (PK)                                      │
│                 ├─ name, code (unique), state, county           │
│                 ├─ requiredDocuments (JSON)                     │
│                 ├─ feeSchedule (JSON)                           │
│                 ├─ avgReviewDays                                │
│                 ├─ zoningProfiles: ZoningProfile[]              │
│                 └─ staff: JurisdictionStaff[]                   │
│                    └─ parcelZoning: ParcelZoning[] ──┐          │
│                       ├─ zoningCode                 │          │
│                       ├─ allowedUses[]             │          │
│                       └─ maxHeight, maxFAR, etc.  │          │
│                                                   │          │
│  Estimate (from project.estimateId) ◄─────────────┘          │
│  ├─ id (PK)                                                  │
│  ├─ projectId (FK → Project)                                │
│  ├─ type: DETAILED | BID_ESTIMATE | ...                     │
│  ├─ status: DRAFT → APPROVED → SENT → ACCEPTED              │
│  ├─ totalCost, costPerSqFt                                  │
│  ├─ aiGenerated, aiConfidence (0-100)                       │
│  ├─ sections: EstimateSection[] (CSI divisions)             │
│  │  └─ lineItems: EstimateLineItem[] (trade-specific)       │
│  │     ├─ csiCode, description                              │
│  │     ├─ quantity, unit, unitCost, totalCost               │
│  │     ├─ laborCost, materialCostAmt                         │
│  │     └─ wasteFactor, markup, discount                     │
│  │                                                           │
│  └─ comparisons: EstimateComparison[] (for bid analysis)    │
│                                                              │
└────────────────────────────────────────────────────────────────────┘
```

---

## 6. TECHNOLOGY STACK

```
┌───────────────────────────────────────────────────────────────────┐
│                    TECHNOLOGY STACK                              │
├───────────────────────────────────────────────────────────────────┤
│                                                                   │
│  FRONTEND                     BACKEND                  DATABASE  │
│  ├─ Next.js 14+              ├─ Fastify              ├─ PostgreSQL
│  ├─ React 18+                ├─ TypeScript 5.6+      ├─ Redis (cache)
│  ├─ Tailwind CSS             ├─ Zod (validation)     ├─ Prisma ORM
│  ├─ TanStack Query           ├─ Stripe SDK           └─ pnpm lockfile
│  └─ DynamicIntakeForm        ├─ Anthropic Claude
│     (components from UI        │ (Claude Opus 4.6 for bots)
│      package)                ├─ OpenAI (embeddings)
│                              └─ Bull/BullMQ (job queue)
│
│  Additional Services:
│  ├─ AWS S3 (file storage)
│  ├─ SendGrid (email)
│  ├─ Slack (notifications)
│  └─ Supabase (auth backup)
│
│  Deployment:
│  ├─ Services: Railway / Render
│  ├─ Frontend: Vercel
│  ├─ Database: AWS RDS / Supabase
│  └─ Observability: Datadog / New Relic
│
└───────────────────────────────────────────────────────────────────┘
```

---

## 7. SCORING DECISION TREE

```
                    INTAKE SUBMITTED
                           │
                    Validation passed?
                        ├─ NO → 400 Bad Request
                        │
                        └─ YES
                             │
                ┌────────────┴────────────┐
                │                        │
         /estimation/intake        /permits/intake
         (PUBLIC)                  (PUBLIC)
                │                        │
    scoreEstimationLead()     scorePermitLead()
                │                        │
       ┌────────┴────────┐       ┌────────┴────────┐
       │                 │       │                 │
    ≥75              50-74      ≤30              31-45
   READY           READY       $2,495           $1,495
   (cert)          (cost)      (full coord)      (tracking)
   ↓               ↓            ↓                 ↓
 Tier:         Tier:         Tier:             Tier:
 certified_    cost_         inspection_       tracking
 estimate      estimate      coordination
       │                 │       │                 │
       └────────┬────────┘       └────────┬────────┘
              ...                    ...
         READY_FOR_EST         READY_FOR_PERMIT
             (if no                (if estimate
          missing errors)          linked)
              │                    │
         [Permit gate            [Estimate
           checks estimate]        gate checks]
              │                    │
         gatePermitOn         gateEstimate
         Estimate()           OnDesign()
              │                    │
         Blocked?              Blocked?
         "Need                  "Need
         estimate"              design"
              │                    │
         HTTP 402                HTTP 402
              │                    │
         404 redirect            404 redirect
         to /estimation          to /design
```

---

## 8. DEPLOYMENT CHECKLIST

```
☐ Backend Services
  ☐ services/api environment variables (.env)
    - DATABASE_URL (PostgreSQL)
    - REDIS_URL (Redis connection)
    - STRIPE_SECRET_KEY
    - ANTHROPIC_API_KEY
    - OPENAI_API_KEY
    - AWS_S3_BUCKET credentials
  ☐ Run pnpm install (root)
  ☐ Generate Prisma client: npx prisma generate
  ☐ Seed database: npx prisma db seed
  ☐ Build API: pnpm run build --filter=@kealee/api
  ☐ Deploy to Railway/Render

☐ Frontend Apps
  ☐ apps/web-main environment (.env.local)
    - NEXT_PUBLIC_API_URL
    - NEXT_PUBLIC_STRIPE_KEY
  ☐ Build: pnpm run build --filter=web-main
  ☐ Deploy to Vercel

☐ Database
  ☐ PostgreSQL: Create database, apply migrations
  ☐ Run: npx prisma migrate deploy
  ☐ Verify all models present

☐ Bots
  ☐ Build: pnpm run build --filter=@kealee/bots
  ☐ Deploy workers to background job service
  ☐ Configure Anthropic model access

☐ Testing
  ☐ Intake → Scoring flow
  ☐ Stripe checkout integration
  ☐ Gating blocks (missing prerequisites)
  ☐ Redis storage and retrieval
  ☐ End-to-end path: intake → checkout → success Page

```

