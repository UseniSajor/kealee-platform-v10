# SESSION 13 - PRODUCTION IMPLEMENTATION AUDIT & EXECUTION PLAN

**Date**: April 15, 2026  
**Goal**: Move KeaBot from test-only to production-ready with strict chain gating, jurisdiction awareness, and hardening against P0 gaps  
**Status**: RECONNAISSANCE PHASE

---

## AUDIT CHECKLIST

### Phase 1: Repository State Assessment ✓

- [x] Monorepo structure confirmed (apps/, services/, bots/, packages/)
- [x] Services identified: os-dev, os-feas, os-pm, os-pay, ai-learning, worker, api, marketplace, keacore, command-center, os-land, os-ops
- [x] Bot services identified: keabot-design, keabot-estimate, keabot-permit, keabot-feasibility, keabot-owner, keabot-gc, keabot-construction, etc.
- [x] Web apps identified: web (main), web-main, marketing, m-architect, m-estimation, portals
- [x] Core monorepo files present: pnpm-workspace.yaml, package.json, .env.example
- [ ] **NEXT**: Inspect actual implementations

### Phase 2: DesignBot Implementation Status

**Files to inspect**:
- bots/keabot-design/
- services/os-dev/
- API routes for /design
- Schema models: Project, Concept, ClassificationModel

**Current questions**:
- [ ] What's currently implemented in keabot-design?
- [ ] Does it accept public intake?
- [ ] What output structure does it produce?
- [ ] Is there validation?
- [ ] Are there gating checks for downstream bots?

### Phase 3: EstimateBot Status

**Files to inspect**:
- bots/keabot-estimate/ or bots/keabot-feasibility/
- services/os-feas/
- API routes for /estimate
- CTC catalog integration
- Locality factor / inflation handling

**Current questions**:
- [ ] Does it validate DesignBot output before running?
- [ ] What catalog is it using?
- [ ] Is inflation/locality logic implemented?
- [ ] What's the output structure?

### Phase 4: PermitBot Status

**Files to inspect**:
- bots/keabot-permit/
- Schema models: Jurisdiction, PermitType, PermitGuidance
- Jurisdiction-specific rulesets for 7 DMV jurisdictions

**Current questions**:
- [ ] Which jurisdictions are covered?
- [ ] Is there differentiated logic per jurisdiction?
- [ ] Does it validate EstimateBot output?
- [ ] What's the output quality?

### Phase 5: Website /concept Route

**Files to inspect**:
- apps/web/src/app/concept/ or similar
- Route handler
- Intake form
- Result rendering
- CTAs and routing

**Current questions**:
- [ ] Does /concept route exist?
- [ ] Is it public (no auth)?
- [ ] Does it wire to DesignBot?
- [ ] Does it support the full chain if user opts in?
- [ ] Are results rendered correctly?

### Phase 6: Chain Gating Logic

**Files to inspect**:
- orchestrator / agent runner logic
- response validation schemas
- dependency checks

**Current questions**:
- [ ] Is gating implemented?
- [ ] Is blocking explicit or silent?
- [ ] Are error codes structured?
- [ ] Are logs clear?

### Phase 7: Environment & Configuration

**Files to inspect**:
- .env.example
- services/.env templates
- bots/.env templates

**Current questions**:
- [ ] What env vars are required?
- [ ] Are LLM providers configured?
- [ ] Is cache/Redis configured?
- [ ] Are jurisdiction data sources configured?

### Phase 8: Observability & Metrics

**Current questions**:
- [ ] Is there structured telemetry?
- [ ] Are cache metrics tracked?
- [ ] Is token usage logged?
- [ ] Are latency metrics available?
- [ ] Can retry and fallback behavior be observed?

### Phase 9: Mock Data & Fallbacks

**Current questions**:
- [ ] Are there hardcoded concept responses?
- [ ] Are there stub estimates?
- [ ] Are there hardcoded permits?
- [ ] Can mock data be accidentally used in production flow?

### Phase 10: Testing & Smoke Tests

**Files to inspect**:
- Test files in each service
- Smoke test scripts
- Scenario test data

**Current questions**:
- [ ] What tests exist?
- [ ] Do they cover the chain?
- [ ] Are DMV jurisdictions tested?
- [ ] Is there a smoke test script?

---

## KNOWN GAPS TO ADDRESS (From Description)

1. **Auth leakage into public concept flow** - /concept should not require auth
2. **Invalid routing** - Concept flow may not properly route to correct services
3. **Stale dataset usage** - Old jurisdiction/permit/BOM data may be in use
4. **Silent Redis/cache fallback** - Failures not surfaced
5. **Hidden mock data** - Fake estimates, permits, or BOMs silently used
6. **Bad gating** - Chain dependencies not enforced
7. **Broken handoff** - Bot outputs don't properly feed downstream bots
8. **Incomplete env handling** - Missing or incorrect environment configuration

---

## EXECUTION ROADMAP

### STEP 1: Audit & Baselines (Ongoing)
- [ ] Inspect existing code architecturally
- [ ] Identify canonical paths vs legacy/parallel implementations
- [ ] Build list of all Prisma models needed
- [ ] Identify all environment variables needed
- [ ] Document current gaps

### STEP 2: Standardize & Consolidate
- [ ] Choose canonical route patterns
- [ ] Consolidate duplicate code
- [ ] Remove stale implementations
- [ ] Establish shared types / schemas

### STEP 3: Implement DesignBot (Production)
- [ ] Create public /concept route
- [ ] Implement DesignBot orchestration
- [ ] Add validation and gating
- [ ] Add observability / metrics
- [ ] Test locally

### STEP 4: Implement EstimateBot (Production)
- [ ] Add dependency validation (requires DesignBot)
- [ ] Integrate CTC catalog
- [ ] Implement locality/inflation
- [ ] Add metrics
- [ ] Test locally

### STEP 5: Implement PermitBot (Production)
- [ ] Add 7 DMV jurisdictions with differentiated logic
- [ ] Add dependency validation (requires EstimateBot)
- [ ] Implement jurisdiction-aware rules
- [ ] Add metrics
- [ ] Test locally

### STEP 6: Implement Chain Gating
- [ ] Enforce strict dependencies
- [ ] Make gating explicit
- [ ] Add error codes
- [ ] Surface failures clearly
- [ ] Test gating failures

### STEP 7: Remove Mock Data
- [ ] Audit for hardcoded responses
- [ ] Audit for stub data
- [ ] Audit for silent fallbacks
- [ ] Replace with explicit dev flags or real data
- [ ] Log any fallback usage

### STEP 8: Add Observability
- [ ] Cache metrics (hit/miss, token savings)
- [ ] Latency tracking
- [ ] Retry & failure tracking
- [ ] Provider response source tracking
- [ ] Jurisdiction resolution tracking

### STEP 9: Run Scenario Tests
- [ ] Garden project in PG County
- [ ] Kitchen remodel in Montgomery County
- [ ] Landscape in Arlington VA
- [ ] Test in DC, Alexandria VA, Fairfax County, Baltimore City
- [ ] Validate outputs per scenario
- [ ] Validate jurisdiction-specific responses

### STEP 10: Smoke Test & P0 Validation
- [ ] Run full smoke suite
- [ ] Verify each P0 gap is addressed
- [ ] Test failures / edge cases
- [ ] Test offline / cache scenarios
- [ ] Test auth boundary

### STEP 11: Hardening & Fixes
- [ ] Fix any identified issues
- [ ] Add missing error handling
- [ ] Improve logging
- [ ] Address performance gaps
- [ ] Verify all tests pass

### STEP 12: Production Readiness
- [ ] Final build check
- [ ] Final test verification
- [ ] Documentation complete
- [ ] Env vars documented
- [ ] Commit ready

---

## FILE STRUCTURE TO EXPLORE

```
apps/web/
├── src/
│   ├── app/
│   │   ├── concept/          ← /concept route (needs exploration)
│   │   ├── design/
│   │   ├── estimate/
│   │   └── permit/
│   └── components/

services/
├── os-dev/                   ← DesignBot orchestration
├── os-feas/                  ← EstimateBot orchestration
├── os-pm/                    ← PermitBot orchestration
├── api/                      ← Main API router
└── keacore/                  ← Shared core logic

bots/
├── keabot-design/            ← DesignBot implementation
├── keabot-estimate/          ← EstimateBot implementation
├── keabot-feasibility/       ← Alt estimate bot?
└── keabot-permit/            ← PermitBot implementation

packages/
├── database/prisma/          ← Schema
├── types/                    ← Shared types
└── utils/                    ← Shared utilities
```

---

## NEXT ACTIONS

1. **Immediately**: Inspect keabot-design/src/index.ts or main entry
2. **Then**: Check api/src/routes for canonicalconceptpath
3. **Then**: Check apps/web for /concept route
4. **Then**: Audit existing bot outputs and schemas
5. **Then**: Start implementation in order of dependencies (DesignBot first)

---

**STATUS**: Ready for Phase 1 implementation audit

**EXECUTION BEGINS**: Next section
