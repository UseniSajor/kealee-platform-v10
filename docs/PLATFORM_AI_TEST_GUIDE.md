# Kealee Platform AI Test Guide

**Purpose**: Comprehensive end-to-end testing of the entire AI platform
**Target**: Full user journey from intake → concept → estimation → permits → checkout → fulfillment
**Mode**: PATCH MODE (uses existing test infrastructure)

---

## Quick Start

```bash
# Run full platform AI test
pnpm platform-ai-test

# Or with custom API URL
API_URL=http://production-api.example.com pnpm platform-ai-test
```

---

## Test Coverage

### 3 Test Scenarios

1. **HOMEOWNER (Kitchen Remodel)**
   - Location: DC (20024)
   - Budget: $50-100K
   - Tests: Standard residential flow
   - Expectations: All deliverables ✅

2. **DEVELOPER (Multi-Unit)**
   - Location: Prince George's County, MD
   - Budget: $1-2M
   - Tests: Complex project with zoning, architecture gates
   - Expectations: Full analysis + recommendations

3. **EDGE CASE (Weak Input)**
   - Location: DC, Incomplete description
   - Budget: Not specified
   - Tests: System graceful degradation
   - Expectations: NEEDS_MORE_INFO response (no hallucinations)

---

## Test Flow Per Scenario

### Step 1: Pre-Sale Chat
**Tests**: Customer question answering (chat bot)
- "Do I need a permit?"
- "How long takes this?"
- "What deliverables?"

**Validates**:
- ✅ Accurate answers
- ✅ No hallucinations
- ✅ Consistent with system capabilities

### Step 2: Concept Intake
**Tests**: DesignBot execution
```
POST /api/v1/concepts/intake
├─ Intake stored in database
├─ DesignBot triggered (BullMQ job)
└─ Results available in ProjectOutput table
```

**Validates**:
- ✅ Concept images generated (AI Vision or Stable Diffusion)
- ✅ Floorplan/DXF exported
- ✅ Scope summary exists
- ✅ Zoning snapshot present
- ✅ Complexity score calculated
- ✅ Confidence score included

### Step 3: Results Page
**Tests**: ResultsReadyBanner component

**Deliverables Checklist**:
- ✅ Concept Images & Design Direction
- ✅ Budget Range & Cost Estimate
- ✅ Feasibility Analysis & Zoning
- ✅ Permit Pathway & Requirements

**CTAs Visible**:
- ✅ "Get Permits" button ($299)
- ✅ "Find Contractor" button
- ✅ "Upgrade Design" (if applicable)

### Step 4: Estimation
**Tests**: EstimateBot execution
```
POST /api/v1/estimation/intake
├─ Cost range calculated
├─ Valuation analyzed
├─ Scope breakdown created
└─ Zoning adjustments applied
```

**Validates**:
- ✅ Price: Low/Mid/High range
- ✅ Breakdown: Labor, Materials, Contingency
- ✅ Zoning adjustments: Jurisdiction multipliers applied
- ✅ Timeline: Weeks to completion

### Step 5: Permit Flow
**Tests**: PermitBot execution
```
POST /api/v1/permits/intake
├─ Permit path determined
├─ Required documents listed
└─ Submission method defined
```

**Validates**:
- ✅ Simple vs Complex path selection
- ✅ Document requirements (structural, electrical, plumbing, etc.)
- ✅ Submission method: Self, Assisted, Kealee-Managed
- ✅ Timeline: Days to approval

### Step 6: Checkout
**Tests**: Stripe session creation
```
POST /api/v1/checkout/create-session
├─ Pricing calculated
├─ Stripe session created
└─ Metadata attached
```

**Validates**:
- ✅ "Starting at" pricing shown
- ✅ Final price calculated
- ✅ Metadata includes:
  - intakeId
  - serviceType (concept, estimation, permits)
  - tier (essential, professional, premium)

### Step 7: Webhook
**Tests**: Stripe webhook processing
```
checkout.session.completed
├─ Webhook signature verified
├─ Idempotency checked (no duplicates)
├─ Intake marked PAID
└─ BullMQ job enqueued
```

**Validates**:
- ✅ Signature verification (Stripe webhook security)
- ✅ Idempotency (24-hour deduplication window)
- ✅ No double-charging
- ✅ Job queued for fulfillment

### Step 8: Fulfillment
**Tests**: Bot execution & results delivery
```
BullMQ Job Processing
├─ Bot process starts
├─ AI generates deliverables
├─ Results saved to ProjectOutput
└─ User can view results
```

**Validates**:
- ✅ Job completes (not stuck/timeout)
- ✅ Retries on failure (exponential backoff)
- ✅ Results page updates automatically
- ✅ Notification sent to user

---

## Failure Mode Testing

### Scenario A: Missing Webhook Metadata
```json
{
  "type": "checkout.session.completed",
  "data": { "object": { /* no metadata */ } }
}
```
**Expected**: System logs error, continues (no crash)

### Scenario B: Queue Failure
- Bot process times out
- Redis unavailable
- Database error

**Expected**:
- Retry with exponential backoff
- Max 3 retries (configurable)
- After max retries: escalate to error queue
- User notified with next steps

### Scenario C: Partial Bot Output
- Bot generates some but not all deliverables
- Image generation fails, but scope exists
- Zoning unavailable, but permit path exists

**Expected**:
```json
{
  "status": "PARTIAL",
  "message": "Processing in progress",
  "completedSteps": ["scope", "zoning"],
  "pendingSteps": ["images", "estimate"]
}
```

---

## Test Assertions

### Customer Perspective (Frontend)
```
✅ Pages load: /concept, /estimation, /permits
✅ Forms enforce required fields
✅ No 500 errors on submission
✅ Results page shows real outputs (not mock)
✅ CTAs are clickable and functional
✅ Payment redirects to Stripe
```

### System Perspective (Backend)
```
✅ Intake stored with all fields
✅ Bot executed within timeout (30s default)
✅ Results saved to database (not just memory)
✅ Webhook signature verified
✅ Idempotency enforced (no duplicates)
✅ Metrics tracked (intake → paid → delivered)
✅ Errors logged and escalated
```

---

## Expected Output

### Success Report
```
🚀 KEALEE PLATFORM AI TEST SUITE
================================

SCENARIO 1: HOMEOWNER (KITCHEN REMODEL)
✅ Concept Intake Submission
✅ Concept Images Generated (3 images)
✅ Scope Summary Exists
✅ Zoning/Feasibility Data
✅ Results Page Banner: All 4 deliverables
✅ CTA: Get Permits Button
✅ CTA: Find Contractor Button
✅ Estimation Trigger
✅ Permit Intake
✅ Stripe Session Creation
✅ Webhook Signature Verification
...

SYSTEM TEST RESULTS
===================

📊 Test Summary
  Total Tests: 45
  ✅ Passed:   42
  ❌ Failed:   0
  ⏭️  Skipped:  3

🎯 Concept Engine
  Status: PASS ✅
  Deliverables Generated: YES

💰 Estimation Engine
  Status: PASS ✅
  Pricing Usable: YES

📋 Permit System
  Status: PASS ✅
  Path Valid: YES

🛒 Checkout
  Status: PASS ✅

🔔 Webhook
  Status: PASS ✅

✨ Fulfillment
  Status: PASS ✅

💡 Critical Failures
  ✅ None - System is safe

📈 User Experience Score
  Clarity:  9/10
  Speed:    8/10
  Trust:    9/10
  Overall:  9/10

🚀 Production Readiness
  Status: ✅ READY
```

### Failure Report (Example)
```
SYSTEM TEST RESULTS
===================

❌ FAILED TESTS:
  🔥 SCENARIO 1: Concept Images Generated - No images generated
  🔥 SCENARIO 1: Stripe Session Creation - Error: Invalid API key
  🔥 SCENARIO 2: Webhook Idempotency - Duplicate processing detected

📈 User Experience Score
  Clarity:  6/10   ← Vague error messages
  Speed:    5/10   ← 15s+ per step
  Trust:    4/10   ← Partial failures
  Overall:  5/10

🚀 Production Readiness
  Status: ⚠️ NOT READY
  Blockers: 3 failed tests
```

---

## Running in CI/CD

### GitHub Actions Example
```yaml
name: Platform AI Test
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
      redis:
        image: redis:7

    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Start services
        run: docker-compose up -d

      - name: Run Platform AI Tests
        run: pnpm platform-ai-test
        env:
          API_URL: http://localhost:3001
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
          REDIS_URL: redis://localhost:6379

      - name: Upload test report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: test-results.json
```

---

## Test Automation Goals

✅ **Self-Testing AI Platform**: System validates its own behavior
✅ **Real User Simulation**: Tests act like paying customers
✅ **Comprehensive Coverage**: All critical paths tested
✅ **Failure Tolerance**: Graceful degradation verified
✅ **Production-Ready**: Safe to deploy after passing

---

## Maintenance

### Update Tests When:
- New bot added (extend test scenarios)
- API contract changes (update assertions)
- New failure modes discovered (add edge cases)
- Pricing logic changes (update validation)

### Example: Add New Service Type
```typescript
{
  name: 'SCENARIO 4: STRUCTURAL RENOVATION',
  intake: {
    projectType: 'structural_work',
    location: '22202', // Arlington, VA
    budgetRange: '200k_500k',
    description: 'Load-bearing wall removal, foundation inspection',
    // ...
  },
  expectations: {
    conceptImages: true,
    budgetRange: true,
    feasibility: true,
    permitPath: true, // Architect mandatory!
  },
}
```

---

## Troubleshooting

### Test fails with "API not running"
```bash
# Make sure services are running
docker-compose up -d

# Verify API health
curl http://localhost:3001/health
```

### Test times out
```bash
# Increase timeout (default: 10s per request)
API_URL=http://localhost:3001 NODE_OPTIONS="--max-old-space-size=4096" pnpm platform-ai-test
```

### Webhook tests fail
```bash
# Check Stripe webhook signature is valid
# See: services/api/src/modules/webhooks/stripe-webhook-security.service.ts
# Ensure STRIPE_WEBHOOK_SECRET is set
```

---

## Success Criteria

✅ **All scenarios pass** (42+ tests)
✅ **No critical failures** (payment, delivery blocked)
✅ **UX score > 8** (clear, fast, trustworthy)
✅ **Zero hallucinations** (edge case handled gracefully)
✅ **Idempotency verified** (no duplicate charges)

---

**Status**: Ready for CI/CD integration
**Next**: Run after every deployment to catch regressions
