# Kealee Platform - Quick Reference Guide
**Generated**: April 15, 2026 | **Explored**: Complete Codebase Architecture

---

## 📊 EXISTING MODELS AT A GLANCE

### Concept Flow
```
PreConProject (design phase project)
  ├─ id, ownerId, category (KITCHEN, BATHROOM, ADDITION)
  ├─ phase (INTAKE → DESIGN_STARTED → DESIGN_APPROVED → SRP_GENERATED → MARKETPLACE_READY)
  ├─ designPackageTier, suggestedRetailPrice, srpConfidence
  ├─ leadSaleEnabled, leadSalePrice (B2B feature)
  └─ designConcepts[] ← DesignConcept (name, style, estimatedCost, ownerRating)
```

### Estimation Flow
```
Estimate
  ├─ type (QUICK_BUDGET, CONCEPTUAL, PRELIMINARY, DETAILED, BID_ESTIMATE, etc.)
  ├─ status (DRAFT, IN_PROGRESS, UNDER_REVIEW, APPROVED, SENT, ACCEPTED)
  ├─ totalCost, costPerSqFt, aiGenerated, aiConfidence
  ├─ sections[] ← EstimateSection
  │   └─ lineItems[] ← EstimateLineItem (csiCode, quantity, unitCost, laborCost)
  └─ comparisons[] (EstimateComparison for bid analysis)
```

### Permit Flow
```
Permit
  ├─ permitNumber, permitType (BUILDING, ELECTRICAL, PLUMBING, MECHANICAL, etc.)
  ├─ status (DRAFT, AI_PRE_REVIEW, READY_TO_SUBMIT, SUBMITTED, UNDER_REVIEW, APPROVED, ISSUED)
  ├─ aiReviewScore, aiIssuesFound[], autoCorrections[], readyToSubmit
  ├─ jurisdictionRefNumber, jurisdictionStatus, submittedAt, approvedAt
  ├─ expedited, expeditedFee, expeditedGuaranteeDays
  ├─ submissions[] ← PermitSubmission (submissionType, submittedVia, confirmationNumber)
  ├─ corrections[] ← PermitCorrection (source, severity, assignedTo, dueDate)
  ├─ inspections[] ← Inspection (type, result, deficiencies[], completedAt)
  └─ events[] ← PermitEvent (eventType, description, occurredAt)
```

### Zoning Flow
```
ParcelZoning
  ├─ zoningCode (R-1, C-2, MU-3), zoningDesc, overlay
  ├─ maxDensity, maxHeight, maxFAR, maxLotCoverage, minLotSize
  ├─ setbacks (front, side, rear)
  ├─ allowedUses[], conditionalUses[], prohibitedUses[]
  ├─ parkingRatio
  ├─ aiAnalysis (JSON), complianceNotes
  └─ parcel (relationship)

Jurisdiction
  ├─ name, code (unique), state, county, city
  ├─ subscriptionTier, monthlyFee, subscriptionStatus
  ├─ integrationType, apiProvider, apiUrl, apiKey
  ├─ requiredDocuments (JSON), feeSchedule (JSON), formTemplates (JSON)
  ├─ avgReviewDays, firstTimeApprovalRate
  └─ permits[], staff[], templates[], zoningProfiles[]
```

---

## 🔌 PUBLIC ROUTE ENDPOINTS

### Estimation Service
| Method | Endpoint | Auth | Response |
|--------|----------|------|----------|
| POST | `/estimation/intake` | 🟢 None | EstimationIntakeResponse {intakeId, leadScore, tier, readinessState, flags} |
| POST | `/estimation/checkout` | 🟢 None | {ok, sessionId, url} (Stripe) |
| GET | `/estimation/{intakeId}/status` | 🟢 None | Intake status |

### Permit Service
| Method | Endpoint | Auth | Response |
|--------|----------|------|----------|
| POST | `/permits/intake` | 🟢 None | PermitIntakeResponse {intakeId, jurisdiction, readinessState, permitTypesNeeded} |
| POST | `/permits/checkout` | 🟢 None ⛔ Gated | {ok, sessionId, url} (Stripe) |
| GET | `/permits/{intakeId}/status` | 🟢 None | Intake status |

### Concept Service
| Method | Endpoint | Auth | Response |
|--------|----------|------|----------|
| POST | `/concepts/intake` | 🔴 Required | {ok, intakeId, score, route} |
| POST | `/concepts/checkout` | 🔴 Required ⛔ Gated | {ok, sessionId, url} (Stripe) |
| GET | `/concepts/orders` | 🔴 Required | Order[]  |
| GET | `/concepts/orders/:id` | 🔴 Required | Order detail |

**Legend**: 🟢 Public | 🔴 Authenticated | ⛔ Gated (via readinessState check)

---

## 💰 PRICING TIERS

### Estimation Tiers
```
cost_estimate ($595)         → Human-reviewed, RSMeans breakdown, 3-day turnaround
certified_estimate ($1,850)  → Licensed estimator sign-off, 5-day turnaround
bundle ($1,100+)             → Estimate + Permit Package, 5-day turnaround
```

### Permit Service Tiers
```
document_assembly ($495)     → We prepare all permit documents, 2-day turnaround
submission ($795)            → Assembly + submission to agency, 1-day turnaround
tracking ($1,495)            → Full service + review coordination, 3-day turnaround
inspection_coordination ($2,495) → Through issuance + inspection, 7-day turnaround
```

### Concept Tiers (Authenticated)
```
essential ($585)                    → AI Concept Design Package
professional ($775)                 → Priority ($585 + $195)
premium ($999)                      → Premium Concept Package
white_glove ($1,999)                → White Glove Concept Package
```

---

## 📐 LEAD SCORING FORMULA

### Estimation Lead Score (0-100)
```
= Scope Completeness (0-30)      [construction_docs: 30, design: 25, schematic: 20, sketch: 10]
+ Project Stage (0-20)            [construction/bidding: 20, design_dev: 15, schematic: 10]
+ Contact Completeness (0-20)     [name+email+phone: 15, email: 10]
+ Project Characteristics (0-20)  [interior/exterior: 15, addition: 12]
+ Budget Info (0-10)              [provided: 5]

Readiness State:
  ≥75  → READY_FOR_ESTIMATE (recommend: certified_estimate)
  50-74 → READY_FOR_ESTIMATE (recommend: cost_estimate)
  <50   → NEEDS_MORE_INFO
```

### Permit Lead Score (0-100)
```
= Jurisdiction Complexity (0-20)  [expedited: 15, standard: 10]
+ Contact Completeness (0-15)     [name+email+phone: 15, email: 10]
+ Project Clarity (0-30)          [has docs: 20, has contractor: 10]
+ Permit Count (0-20)             [1 permit: 15, 2-3: 10, 4+: 5]
- Penalties (NEGATIVE POINTS)     [structural: -5, historic: -5, wetlands: -10]

Tier Selection (inverse: lower score = higher tier):
  ≤30   → inspection_coordination ($2,495)
  31-45 → tracking ($1,495)
  46-60 → submission ($795)
  61+   → document_assembly ($495)

Readiness State:
  with estimate → READY_FOR_PERMIT_PREP
  no estimate   → NEEDS_ESTIMATE
```

---

## 🔗 CHAIN GATING: THE SERVICE PIPELINE

### Execution Chain
```
1. INTAKE SUBMITTED
   ↓
2. DesignBot Triggered (Automatic)
   ├─ Input: Project type, dimensions, preferences
   ├─ Output: DesignConceptId + readinessState
   └─ State: APPROVED | READY_FOR_ESTIMATE | NEEDS_REVISION
   ↓
3. User Requests Cost Estimate
   ├─ gateEstimateOnDesign() validates:
   │  ├─ designBotOutputId exists?
   │  ├─ hasDesignConcept = true?
   │  └─ designConceptState in [APPROVED, READY_FOR_ESTIMATE]?
   ├─ If blocked: HTTP 402 + nextSteps
   └─ If allowed: proceeds
   ↓
4. EstimateBot Triggered
   ├─ Input: DesignConcept + location/scope
   ├─ Output: EstimateId + readinessState + confidence_score
   └─ State: APPROVED | READY_FOR_PERMIT | NEEDS_REVISION
   ↓
5. User Requests Permit Prep (Checkout)
   ├─ gatePermitOnEstimate() validates:
   │  ├─ estimateBotOutputId exists?
   │  ├─ hasEstimate = true?
   │  ├─ estimateState in [APPROVED, READY_FOR_PERMIT]?
   │  └─ estimateConfidenceScore ≥ 60%?
   ├─ If blocked: HTTP 402 + nextSteps
   └─ If allowed: creates Stripe session
   ↓
6. User Completes Payment
   ↓
7. PermitBot Triggered
   ├─ Input: Estimate + jurisdiction
   ├─ Output: PermitGuidanceId + permittedUses + compliance_flags
   └─ Ready for submission

Gating Returns: { blocked, reason, code, nextSteps, canRetry, retryAfterMs }
```

### Readiness States (Standardized Enum)
```
NOT_READY                          → Initial state
NEEDS_MORE_INFO                    → Needs more data before proceeding
READY_FOR_ESTIMATE                 → Design ready, can request estimate
READY_FOR_PERMIT_REVIEW            → Estimate ready, can request permits
REQUIRES_DESIGN_HANDOFF            → Needs architect review
REQUIRES_ARCHITECT                 → Architect approval needed
REQUIRES_ENGINEER                  → Structural engineer needed
READY_FOR_CHECKOUT                 → Can proceed to payment
```

---

## 📂 REPOSITORY STRUCTURE FOR NEW SERVICES

### ZoningBot Recommended Location
```
bots/keabot-zoning/                  ← Mirror KeaBotDesign pattern
├── src/
│   ├── bot.ts                       ← Main KeaBotZoning class
│   ├── zoning.types.ts              ← Type definitions
│   ├── zoning.prompts.ts            ← System prompt
│   ├── zoning.tools.ts              ← Tool definitions
│   ├── zoning.db.ts                 ← ParcelZoning + Jurisdiction queries
│   ├── compliance-checker.ts        ← Validation logic
│   └── index.ts                     ← Export bootstrap()
├── tests/
├── package.json
└── tsconfig.json
```

### API Endpoints for ZoningBot (Optional)
```
services/api/src/modules/zoning/
├── zoning.routes.ts
│   ├── GET  /zoning/{parcelId}
│   ├── POST /zoning/{parcelId}/analyze
│   ├── GET  /zoning/{parcelId}/compliance
│   └── POST /zoning/batch/analyze
│
├── zoning.service.ts               ← Business logic
├── zoning.validation.ts            ← Zoning validators
└── zoning.cache.ts                 ← Redis caching
```

---

## 🏗️ DATA FLOW: COMPLETE JOURNEY

```
┌─────────────────────────────────────────────────────────────────┐
│ CUSTOMER SUBMITS CONCEPT INTAKE                                 │
│ (Design preferences, room count, budget, photos)                │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │   DesignBot Action    │
         │  - Generate concepts  │
         │  - Floor plans        │
         │  - 3D renderings      │
         └─────────┬─────────────┘
                   │
        ┌──────────┴──────────┐
        │ Design Approved?    │
        └──────────┬──────────┘
                   │
        ┌──────────▼──────────┐
        │  ESTIMATE INTAKE    │
        │  - Scope detail     │
        │  - Project stage    │
        │  - Contact info     │
        └──────┬───────┬──────┘
               │       │ (optional: separate flow)
               │       │
    ┌──────────▼──┐   └────┐
    │ EstimateBot │        │ (User can link later)
    │ - Cost calc │        │
    │ - RSMeans   │        │
    │ - Timeline  │        │
    └──────┬──────┘        │
           │               │
    ┌──────▼───────────────┤
    │ PERMIT INTAKE        │
    │ - Jurisdiction       │
    │ - Permit types       │
    │ - Design docs        │
    │ - Related estimate ID◄┘ (GATING CHECK)
    └──────┬───────────────┘
           │ (readinessState check)
           │
    ┌──────▼─────────────┐
    │  PermitBot Action  │
    │  - Compliance chk  │
    │  - Permit guidance │
    │  - Timeline est    │
    └──────┬─────────────┘
           │
    ┌──────▼────────────┐
    │  Stripe Checkout  │
    └──────┬────────────┘
           │
    ┌──────▼──────────────┐
    │ Payment Processed   │
    │ Lead In Database    │
    └─────────────────────┘
```

---

## 🔧 INTEGRATION CHECKLIST

- [ ] Register `/estimation/intake` route in `services/api/src/index.ts`
- [ ] Register `/permits/intake` route in `services/api/src/index.ts`
- [ ] Export schemas from `@kealee/intake` package
- [ ] Wire gating middleware to `/estimation/checkout`
- [ ] Wire gating middleware to `/permits/checkout`
- [ ] Set `STRIPE_SECRET_KEY` environment variable
- [ ] Create Stripe price objects matching pricing tiers
- [ ] Test intake → checkout flow end-to-end
- [ ] Build `/intake/estimation` and `/intake/permits` pages
- [ ] Add webhook handler for Stripe events
- [ ] Verify Redis 7-day TTL working for intakes
- [ ] Test gating blocks when prerequisites missing

---

## 📖 REFERENCE FILES

| File | Purpose |
|------|---------|
| `CODEBASE_EXPLORATION_SUMMARY.md` | Complete detailed findings (8 sections) |
| `packages/database/prisma/schema.prisma` | All Prisma models (source of truth) |
| `services/api/src/modules/estimation/public-estimation-intake.routes.ts` | Estimation intake pattern |
| `services/api/src/modules/permits/public-permits-intake.routes.ts` | Permit intake pattern |
| `services/api/src/modules/gating/chain-gating.ts` | Gating logic and middleware |
| `services/api/src/modules/concepts/concept-intake.routes.ts` | Canonical concept pattern |
| `bots/keabot-design/src/bot.ts` | Bot pattern reference |
| `packages/intake/src/schemas/estimation-schemas.ts` | Estimation types |
| `packages/intake/src/schemas/permit-schemas.ts` | Permit types + DMV_JURISDICTIONS |

