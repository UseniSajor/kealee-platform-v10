# SESSION 13 PHASE 1 - RAPID CODE AUDIT RESULTS

**Date**: April 15, 2026  
**Scope**: Verify canonical implementations, identify gaps, document execution path

---

## FINDINGS

### ✅ CONCEPT FLOW - ESTABLISHED & WORKING

**Public Route Pattern**:
- `POST /intake/public` → saves lead, scores lead, routes to tier
- `GET /intake/{intakeId}` → fetch intake
- `POST /intake/checkout` → creates Stripe session
- `POST /concepts/intake` → alternative concept-specific intake
- `POST /concepts/checkout` → alternative concept checkout

**Key Files**:
- [services/api/modules/intake/public-intake.routes.ts](https://file) — Main public intake handler
- [services/api/modules/concepts/concept-intake.routes.ts](https://file) — Concept-specific intake
- [services/api/modules/concept-engine/concept-engine.routes.ts](https://file) — Concept execution (floorplan, package generation)
- [services/api/modules/design/concept-validation.routes.ts](https://file) — Concept validation + DesignBot trigger

**Stripe Integration**:
- PACKAGE_PRICES defined in `concept-intake.routes.ts` lines 18-23
- `stripe.checkout.sessions.create()` at line 136+
- Metadata includes: source, packageTier, packageName, intakeId, userId, funnelSessionId, customerEmail

**Lead Scoring**:
- `scoreIntakeLead()` function in `concept-intake.routes.ts` 
- Produces: `{ total, tier, route, flags }`
- Used to determine tiers ("essential", "professional", "premium", "white_glove")

**Queue/Async**:
- BullMQ via Redis for async jobs
- Event: `design.concept.initiated` published on Redis
- DesignBot listens via event handler

**Frontend Pages**:
- [apps/web-main/app/estimate/page.tsx](https://file) — Exists but INCOMPLETE (old tier structure)
- [apps/web-main/app/permits/page.tsx](https://file) — May exist or need creation
- [apps/web-main/app/intake/[projectPath]/page.tsx](https://file) — Dynamic intake form using DynamicIntakeForm

---

### ⚠️ ESTIMATEBOT - PARTIAL IMPLEMENTATION

**Files**:
- [bots/keabot-estimate/src/bot.ts](https://file)

**Current State**:
- Base class: `KeaBot` from `@kealee/core-bots`
- Registered tools:
  - `retrieve_relevant_context` (RAG tool)
  - `create_estimate` (not fully wired)
  - `lookup_costs` (not fully wired)
  - `analyze_bid_comparison` (not fully wired)
- NO explicit dependency validation on DesignBot output
- NO jurisdiction-aware pricing
- NO structured readiness states
- NO explicit gating logic

**Missing**:
- Chain gating enforcement
- Structured output schema validation
- Locality/inflation factor application
- Confidence scoring
- Readiness scoring
- Valuation output for PermitBot

---

### ⚠️ PERMITBOT - PARTIAL IMPLEMENTATION

**Files**:
- [bots/keabot-permit/src/bot.ts](https://file)

**Current State**:
- Base class: `KeaBot`
- Registered tools:
  - `retrieve_relevant_context` with sourceType="JURISDICTION_GUIDE"
  - `check_requirements`
  - `track_permits`
  - `schedule_inspections`
- NO dependency validation on EstimateBot
- NO explicit 7 DMV jurisdiction coverage
- NO structured readiness states
- NO valuation-based routing

**Missing**:
- Jurisdiction routing (DC, PG County, Montgomery, Arlington, Alexandria, Fairfax, Baltimore City)
- Permit path differentiation per jurisdiction
- Dependency gating (EstimateBot required)
- Structured output schema with readiness
- Risk flag generation
- Service tier recommendation logic

---

### ⚠️ INTAKE SCHEMAS - NEED EXPANSION

**Files**:
- [packages/intake/src/schemas/intake-schemas.ts](https://file) (not found in search, may need creation)

**Current**:
- BaseContactSchema exists
- ExteriorConceptIntake exists
- WholeHomeRemodelIntake exists
- Others exist

**Needed**:
- EstimationIntake schema
- PermitIntake schema
- Chain gating schemas

---

### ❌ READINESS STATES - NOT IMPLEMENTED

Currently no standardized readiness enum across bots.

**Needed States**:
```
NOT_READY
NEEDS_MORE_INFO
READY_FOR_ESTIMATE
READY_FOR_PERMIT_REVIEW
REQUIRES_DESIGN_HANDOFF
REQUIRES_ARCHITECT
REQUIRES_ENGINEER
READY_FOR_CHECKOUT
```

---

### ❌ CHAIN GATING - NOT IMPLEMENTED

No explicit dependency enforcement between:
- DesignBot → EstimateBot
- EstimateBot → PermitBot

**Needed**:
- Validation middleware
- Structured error codes
- Explicit blocking (not silent)
- Response payload with gating reason

---

### ❌ OBSERVABILITY - MINIMAL

**Current**:
- Basic logging with fastify.log
- Error sanitization

**Missing**:
- Cache metrics (hit/miss)
- Token usage tracking
- Response latency tracking
- Fallback usage logging
- Provider source tracking
- Jurisdiction resolution tracking

---

### ❌ DMV JURISDICTION COVERAGE - NOT IMPLEMENTED

No jurisdiction-specific rules for:
- Washington, DC
- Prince George's County, MD
- Montgomery County, MD
- Arlington County, VA
- City of Alexandria, VA
- Fairfax County, VA
- Baltimore City, MD

---

## EXECUTION PLAN FOR PHASES 2-5

### PHASE 2: Public /estimation Flow
- [ ] Enhance `/estimation` page with production copy
- [ ] Create EstimationIntake schema
- [ ] Create `/intake/estimation` path
- [ ] Create `POST /estimation/intake` endpoint (pattern: `POST /intake/public`)
- [ ] Create `POST /estimation/checkout` endpoint
- [ ] Wire to EstimateBot execution (async job)

### PHASE 3: DesignBot Hardening
- [ ] Verify output schema includes EstimateBotInput fields
- [ ] Add explicit logging for schema validation
- [ ] Remove silent fallbacks
- [ ] Add structured error codes
- [ ] Add observability hooks (latency, token count)

### PHASE 4: Chain Gating
- [ ] Create gating middleware
- [ ] EstimateBot must validate DesignBot output present
- [ ] PermitBot must validate EstimateBot output present
- [ ] Make blocking explicit in response payload
- [ ] Add error codes

### PHASE 5: Jurisdiction Baseline
- [ ] Add 7 DMV jurisdictions to PermitBot data
- [ ] Create jurisdiction-aware routing logic
- [ ] Create readiness state enum
- [ ] Wire jurisdiction selector in `/permits` page
- [ ] Create `POST /permits/intake` endpoint
- [ ] Create `POST /permits/checkout` endpoint

---

## CANONICAL PATTERNS TO FOLLOW

### Public Intake Pattern
```ts
// POST /endpoint/intake (no auth)
→ Validate with Zod
→ Save to permitServiceLead (or equivalent)
→ Score lead (scoreIntakeLead function)
→ Return { intakeId, tier, route, etc. }

// POST /endpoint/checkout
→ Create Stripe session with metadata
→ Return { sessionId, url }

// Async execution:
→ Queue job via BullMQ
→ Emit Redis event
→ Bot listens and executes
→ Store result in database
```

### Stripe Metadata Pattern
```ts
{
  source: "estimation" | "permits",
  packageTier: string,
  packageName: string,
  intakeId: string,
  userId: string,
  funnelSessionId: string,
  customerEmail: string
}
```

### Lead Scoring Pattern
```ts
function scoreIntakeLead(data: Record<string, unknown>) {
  // Calculate total score (0-100)
  // Determine tier based on score
  // Return { total, tier, route, flags }
}
```

---

## FILES TO CREATE / MODIFY

### New Files
- [ ] `packages/intake/schemas/estimation-schemas.ts`
- [ ] `packages/intake/schemas/permit-schemas.ts`  
- [ ] `services/api/modules/estimation/estimation.routes.ts`
- [ ] `services/api/modules/permits/permits.routes.ts`
- [ ] `services/api/modules/gating/chain-gating.middleware.ts`
- [ ] `packages/shared/types/readiness.ts` (readiness state enum)
- [ ] `packages/jurisdictions/dmv-jurisdiction-rules.ts`
- [ ] `apps/web-main/app/intake/estimation/page.tsx`
- [ ] `apps/web-main/app/intake/permits/page.tsx`

### Modified Files
- [ ] `apps/web-main/app/estimate/page.tsx` (update copy/pricing)
- [ ] `apps/web-main/app/permits/page.tsx` (if exists, enhance)
- [ ] `bots/keabot-estimate/src/bot.ts` (add gating, schema validation)
- [ ] `bots/keabot-permit/src/bot.ts` (add jurisdiction logic, gating)
- [ ] `services/api/src/index.ts` (register new routes)

---

## READINESS ASSESSMENT

| Component | Status | Notes |
|-----------|--------|-------|
| Concept flow | ✅ Working | Well-established, proven |
| EstimateBot | ⚠️ Partial | Structure exists, needs gating + output schema |
| PermitBot | ⚠️ Partial | Structure exists, needs jurisdiction + gating |
| Public intake | ✅ Working | Pattern established, reusable |
| Stripe integration | ✅ Working | Pattern established, reusable |
| Lead scoring | ✅ Working | Can be extended for new paths |
| Jurisdiction coverage | ❌ Missing | Needed for PermitBot |
| Chain gating | ❌ Missing | Core requirement for Session 13 |
| Readiness states | ❌ Missing | Core requirement for Session 13 |
| Observability | ⚠️ Minimal | Logging exists, metrics needed |

---

**STATUS**: Phase 1 complete. Ready to proceed to Phase 2.

**Next**: Build `/estimation` page + intake + EstimateBot gating
