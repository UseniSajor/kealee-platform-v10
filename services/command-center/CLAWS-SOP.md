# Kealee CLAWS Architecture — Standard Operating Procedure

## 1. Overview

The Command Center uses an **8-Claw hybrid architecture** where each Claw is a domain-specific microservice that communicates via events and processes work through BullMQ queues. All 8 Claws run in a single Node.js process but are logically isolated through guardrails, event ownership, and write permissions.

### The 8 Claws

| ID | Name | Directory | Domain |
|----|------|-----------|--------|
| A | Acquisition & PreCon | `claws/acquisition-precon/` | Bids, estimates, CTC integration |
| B | Contract & Commercials | `claws/contract-commercials/` | Contracts, change orders, payments |
| C | Schedule & Field Ops | `claws/schedule-field-ops/` | CPM scheduling, visits, inspections |
| D | Budget & Cost | `claws/budget-cost/` | Budget tracking, variance, forecasting |
| E | Permits & Compliance | `claws/permits-compliance/` | Permit tracking, QA inspections |
| F | Document Intelligence | `claws/document-intelligence/` | Document processing, OCR, search |
| G | Risk & Prediction | `claws/risk-prediction/` | Risk signals, predictions, decision support |
| H | Command & Orchestration | `claws/command-orchestration/` | Dashboard, cross-claw coordination |

---

## 2. Directory Structure

Each Claw follows this standard structure:

```
claws/<claw-name>/
  index.ts          # Claw class: extends BaseClaw, event router, worker registration
  workers/          # Decomposed handler classes (one file per domain)
    <domain>.ts     # WorkerHandlers class with handler methods
  ai/
    prompts.ts      # AI system prompts for this claw's domain
```

### Example: Claw D (Budget & Cost)

```
claws/budget-cost/
  index.ts                        # BudgetCostClaw class
  workers/
    budget-tracker.ts             # BudgetTrackerWorkerHandlers (seed, recalc, record, snapshot, CTC)
    variance-analyzer.ts          # VarianceAnalyzerWorkerHandlers (alerts, AI root cause)
    forecast-engine.ts            # ForecastEngineWorkerHandlers (earned value, AI forecast)
  ai/
    prompts.ts                    # VARIANCE_PROMPT, FORECAST_PROMPT
```

---

## 3. Core Infrastructure

### 3.1 BaseClaw (`claws/base-claw.ts`)

All Claws extend `BaseClaw` which provides:
- **`assertWritable(model)`** — Throws if the Claw tries to write a model it doesn't own
- **Self-loop prevention** — Events published by a Claw are not re-consumed by the same Claw
- **Cascade depth limiting** — Max 10 hops to prevent infinite event chains
- **Event envelope validation** — Ensures all published events conform to `KealeeEventEnvelope`

### 3.2 Event Bus (`packages/events/`)

- **Transport:** Redis Pub/Sub
- **Envelope:** `KealeeEventEnvelope` with `id`, `type`, `source`, `projectId`, `organizationId`, `payload`, `trigger`, `entity`, `timestamp`
- **Channels:** Domain-scoped (e.g., `budget.*`, `payment.*`) + `kealee.*` wildcard
- **Event creation:** Always use `createEvent()` from `@kealee/events` — never construct envelopes manually

### 3.3 Queue Registry (`packages/queue/`)

16 named queues across 8 Claws:

| Queue | Claw | Purpose |
|-------|------|---------|
| `BID_ENGINE` | A | Bid requests, contractor matching, scoring |
| `ESTIMATION_TOOL` | A | Project analysis, cost calculation, CTC |
| `CONTRACT_ENGINE` | B | Contract drafting, estimate attachment, execution |
| `CHANGE_ORDER` | B | CO evaluation, approval routing, schedule impact |
| `PAYMENT` | B | Pay apps, retainage, lien waivers, disbursement |
| `SMART_SCHEDULER` | C | CPM scheduling, weather reschedule, look-ahead |
| `VISIT_SCHEDULER` | C | Visit scheduling, route optimization |
| `BUDGET_TRACKER` | D | Budget seeding, variance, snapshots, forecasting |
| `PERMIT_TRACKER` | E | Portal status, deadline checks, phase evaluation |
| `QA_INSPECTOR` | E | Photo analysis, compliance checks |
| `DOC_PROCESSOR` | F | OCR, document classification, search indexing |
| `DOC_GENERATOR` | F | Template rendering, PDF generation |
| `PREDICTIVE_ENGINE` | G | Risk signal analysis, nightly assessment |
| `DECISION_SUPPORT` | G | Option generation, accept/reject processing |
| `COMMAND_DASHBOARD` | H | Dashboard aggregation, cross-claw queries |
| `ORCHESTRATOR` | H | Multi-claw coordination, workflow management |

### 3.4 AI Provider (`packages/ai/`)

- **Primary:** Claude (claude-sonnet-4-5-20250929) via `@anthropic-ai/sdk`
- **Fallback:** OpenAI (gpt-4o-mini) via `openai`
- **Usage:** `ai.reason({ task, context, systemPrompt })` — returns structured JSON
- **Each Claw has domain-specific prompts** in its `ai/prompts.ts` file

---

## 4. Worker Decomposition Pattern

### 4.1 Handler Class Convention

Each worker file exports a handler class with this signature:

```typescript
export class <Domain>WorkerHandlers {
  constructor(
    private prisma: PrismaClient,
    private ai: AIProvider,
    private eventBus: EventBus,
    private clawName: string,
    private assertWritable: (model: string) => void,
    // ... domain-specific prompts as needed
  ) {}

  async handle<JobName>(job: Job): Promise<void> {
    // 1. Assert writable models
    // 2. Extract event/payload from job.data
    // 3. Business logic + Prisma queries
    // 4. AI analysis if applicable
    // 5. Enqueue follow-up jobs if needed
    // 6. Publish event(s)
  }
}
```

### 4.2 Claw Index Pattern

The Claw `index.ts` instantiates handler classes in the constructor and delegates in `registerWorkers()`:

```typescript
export class MyClaw extends BaseClaw {
  private handlers: MyWorkerHandlers;

  constructor(eventBus: EventBus, prisma: PrismaClient) {
    super(eventBus, prisma, CLAW_CONFIG);
    const boundAssert = this.assertWritable.bind(this);
    this.handlers = new MyWorkerHandlers(prisma, ai, eventBus, name, boundAssert);
  }

  async handleEvent(event: KealeeEventEnvelope): Promise<void> {
    // Route events to queues
  }

  async registerWorkers(): Promise<void> {
    createWorker(KEALEE_QUEUES.MY_QUEUE, async (job: Job) => {
      switch (job.name) {
        case 'do-thing':
          await this.handlers.handleDoThing(job);
          break;
      }
    });
  }
}
```

---

## 5. Guardrails

### 5.1 Write Guards (Model Whitelist)

Each Claw declares a `writableModels` array in its config. The `assertWritable()` method throws if a Claw tries to write a model outside its whitelist. This prevents cross-domain data corruption.

| Claw | Writable Models |
|------|----------------|
| A | Estimate, EstimateSection, EstimateLineItem, BidRequest, BidInvitation, BidSubmission, ContractorBid |
| B | Contract, ContractAgreement, ChangeOrder, ChangeOrderLineItem, ChangeOrderApproval, Payment, ScheduledPayment |
| C | ScheduleItem, Visit, Inspection, DailyLog |
| D | BudgetItem, BudgetLine, BudgetEntry, BudgetTransaction, BudgetSnapshot, BudgetAlert, Prediction |
| E | Permit, PermitInspection, ComplianceCheck, QAResult |
| F | Document, DocumentVersion, DocumentTag |
| G | RiskSignal, Prediction, DecisionOption |
| H | DashboardWidget, SystemConfig (read-heavy, limited writes) |

### 5.2 Event Ownership

Claws should only publish events within their domain. The event type prefix should match the Claw's responsibility:
- Claw A publishes `bid.*`, `estimate.*`
- Claw B publishes `contract.*`, `changeorder.*`, `payment.*`
- Claw D publishes `budget.*`, `prediction.costoverrun.*`

### 5.3 Self-Loop Prevention

`BaseClaw` automatically filters out events where `event.source === this.config.name`, preventing infinite loops where a Claw publishes an event that triggers itself.

### 5.4 Cascade Depth Limit

Events carry a `_depth` counter incremented on each hop. Maximum depth is **10**. If reached, the event is logged and dropped.

---

## 6. Adding a New Worker to an Existing Claw

### Step-by-step:

1. **Create the worker file** in `claws/<claw>/workers/<domain>.ts`
2. **Export a handler class** following the convention in Section 4.1
3. **Import the class** in `claws/<claw>/index.ts`
4. **Instantiate it** in the Claw constructor with `boundAssert`
5. **Add job routing** in `registerWorkers()` with a `case` in the switch statement
6. **Add event routing** in `handleEvent()` if the worker responds to new event types
7. **Update the whitelist** in `CLAW_CONFIG.writableModels` if the worker writes new models

### Checklist:
- [ ] Worker file created with handler class
- [ ] Handler class constructor accepts `prisma, ai, eventBus, clawName, assertWritable`
- [ ] All Prisma writes preceded by `this.assertWritable('ModelName')`
- [ ] Events created with `createEvent()` from `@kealee/events`
- [ ] Events include `trigger` field linking to the originating event
- [ ] Events include `entity` field identifying the affected record
- [ ] Follow-up jobs enqueued via `createQueue(KEALEE_QUEUES.X).add()`
- [ ] Worker registered in `registerWorkers()` switch statement
- [ ] Event types registered in `handleEvent()` if needed

---

## 7. Adding a New Claw

1. **Create directory:** `claws/<new-claw>/`
2. **Create `index.ts`** extending `BaseClaw` with:
   - `CLAW_CONFIG` (name, eventPatterns, writableModels)
   - `handleEvent()` event router
   - `registerWorkers()` with queue creation
3. **Create `workers/` directory** with handler files
4. **Create `ai/prompts.ts`** with domain-specific system prompts
5. **Register queues** in `packages/queue/src/queues.ts`
6. **Register event types** in `packages/events/src/event-types.ts`
7. **Register the Claw** in `claws/registry.ts` and `claws-entry.ts`

---

## 8. Business Rules Reference

### Change Order Approval Thresholds (Claw B)
| Amount | Tier | Action |
|--------|------|--------|
| <= $5,000 | PM_AUTO | Auto-approved by system |
| $5,001 - $25,000 | OWNER_REQUIRED | Requires project owner approval |
| > $25,000 | WRITTEN_SIGNOFF | Requires written sign-off |

### Budget Categories (Claw D)
7 standard categories: `LABOR`, `MATERIAL`, `EQUIPMENT`, `SUBCONTRACTOR`, `PERMITS`, `OVERHEAD`, `CONTINGENCY`

### Variance Alert Thresholds (Claw D)
| Metric | Threshold | Alert Type |
|--------|-----------|------------|
| Single category variance | > 15% | THRESHOLD_WARNING |
| Total project variance | > 10% | OVER_BUDGET |
| Category > 25% | — | Severity escalated to CRITICAL |
| Total > 20% | — | Severity escalated to CRITICAL |

### Retainage Rules (Claw B)
| Project Completion | Retainage Rate |
|-------------------|----------------|
| < 50% complete | 10% |
| >= 50% complete | 5% |

### Payment Disbursement Prerequisites (Claw B)
1. Contract must be in `EXECUTED` status
2. Retainage must be calculated
3. Lien waiver must be `RECEIVED` (if required)
4. Only then can disbursement proceed

### Budget Categorization (Claw D)
Priority order:
1. CTC assembly L/M/E breakdown (if available)
2. AI categorization via Claude
3. CSI MasterFormat division fallback
4. Description keyword matching
5. Default: `MATERIAL`

---

## 9. Event Flow Examples

### Estimate Approved -> Budget Seeded
```
estimate.approved (Claw A publishes)
  -> Claw D handleEvent() routes to BUDGET_TRACKER queue
    -> seed-budget-from-estimate job
      -> Creates BudgetItem + BudgetTransaction for each category
      -> Enqueues create-snapshot
      -> Publishes budget.seeded.from.estimate
```

### Change Order Flow
```
project.change.requested
  -> Claw B routes to CHANGE_ORDER queue
    -> evaluate-change-order
      -> AI scope/cost analysis
      -> Creates ChangeOrder + ChangeOrderLineItems
      -> Enqueues route-approval
        -> Determines tier (PM_AUTO / OWNER / WRITTEN)
        -> Creates ChangeOrderApproval
        -> Publishes changeorder.approved or changeorder.approval.pending

changeorder.approved
  -> Claw D routes to BUDGET_TRACKER queue
    -> recalculate-for-change-order
      -> AI categorization of CO line items
      -> Updates BudgetItems, BudgetLines, BudgetTransactions
      -> Enqueues check-variance-alerts + create-snapshot
      -> Publishes budget.updated
```

### Payment Disbursement Flow
```
project.payapp.submitted
  -> Claw B routes to PAYMENT queue
    -> process-pay-app (AI risk assessment)
      -> Creates Payment record
      -> Enqueues calculate-retainage
        -> 10% or 5% based on completion
        -> Enqueues generate-lien-waiver
          -> Sets lienWaiverStatus: PENDING
          -> Publishes payment.lienwaiver.requested

(External: lien waiver received)
  -> disburse-payment
    -> Verifies lien waiver RECEIVED
    -> Sets status: DISBURSEMENT_INITIATED
    -> Publishes payment.disbursed

payment.disbursed
  -> Claw D routes to BUDGET_TRACKER queue
    -> record-actual-from-payment
      -> Updates BudgetItem actuals
      -> Enqueues check-variance-alerts
      -> Publishes budget.updated
```

---

## 10. Files Modified in Worker Decomposition

### Claw A — Acquisition & PreCon
| File | Change |
|------|--------|
| `index.ts` | Imports + delegates to BidEngineWorkerHandlers, EstimationWorkerHandlers |
| `workers/bid-engine.ts` | **Created** — 3 handlers: createBidRequest, matchContractors, scoreSubmissions |
| `workers/estimation.ts` | **Created** — 4 handlers: analyzeProject, calculateCosts, ctcImportCompleted, takeoffConfirmed |

### Claw B — Contract & Commercials
| File | Change |
|------|--------|
| `index.ts` | Imports + delegates to ContractEngineWorkerHandlers, ChangeOrderWorkerHandlers, PaymentWorkerHandlers |
| `workers/contract-engine.ts` | **Created** — 3 handlers: draftContract, attachEstimate, executeContract |
| `workers/change-orders.ts` | **Created** — 3 handlers: evaluateChangeOrder, routeApproval, assessScheduleImpact |
| `workers/payments.ts` | **Created** — 4 handlers: processPayApp, calculateRetainage, generateLienWaiver, disbursePayment |

### Claw D — Budget & Cost
| File | Change |
|------|--------|
| `index.ts` | Imports + delegates to BudgetTrackerWorkerHandlers, VarianceAnalyzerWorkerHandlers, ForecastEngineWorkerHandlers |
| `workers/budget-tracker.ts` | **Created** — 5 handlers: seedBudgetFromEstimate, recalculateForChangeOrder, recordActualFromPayment, createSnapshot, ctcEstimateReady + resolveCategory helper |
| `workers/variance-analyzer.ts` | **Created** — 1 handler: checkVarianceAlerts (alerts + AI root cause + predictions) |
| `workers/forecast-engine.ts` | **Created** — 1 handler: generateForecast (earned value + AI trend analysis) |

### Claws C, E, F, G, H
Already decomposed into workers — no changes needed.
