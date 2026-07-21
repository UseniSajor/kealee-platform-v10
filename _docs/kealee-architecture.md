# Kealee Platform v10 — Architecture & Implementation Reference

> **Kealee Construction LLC | February 2026 | CONFIDENTIAL**
> Single source of truth for platform architecture, claw system, and AI layer.

---

## Table of Contents

1. [Platform Overview](#1-platform-overview)
2. [Monorepo Structure](#2-monorepo-structure)
3. [The 8-Claw System](#3-the-8-claw-system)
4. [Event Envelope & Bus](#4-event-envelope--bus)
5. [Shared Infrastructure](#5-shared-infrastructure)
6. [Claw A: Acquisition & PreCon](#6-claw-a-acquisition--precon)
7. [Claw B: Contract & Commercials](#7-claw-b-contract--commercials)
8. [Claw C: Schedule & Field Ops](#8-claw-c-schedule--field-ops)
9. [Claw D: Budget & Cost Control](#9-claw-d-budget--cost-control)
10. [Claw E: Permits & Compliance](#10-claw-e-permits--compliance)
11. [Claw F: Documents & Communication](#11-claw-f-documents--communication)
12. [Claw G: Risk, Prediction & Decisions](#12-claw-g-risk-prediction--decisions)
13. [Claw H: Command Center & Automation](#13-claw-h-command-center--automation)
14. [Kealee Messenger & @kealee AI Assistant](#14-kealee-messenger)
15. [AI Intelligence Layer](#15-ai-intelligence-layer)
16. [Cross-Claw Event Flow](#16-cross-claw-event-flow)
17. [Guardrails Enforcement](#17-guardrails-enforcement)
18. [User Access by Claw](#18-user-access-by-claw)
19. [Implementation Sequence](#19-implementation-sequence)
20. [Deployment & Scaling](#20-deployment--scaling)
21. [Team Scaling & Architecture Migration](#21-team-scaling)

---

## 1. Platform Overview

Kealee Platform v10 is an end-to-end construction management platform that offers:
- A contractor and professional design (architects/engineers) **marketplace** for homeowners, developers, business owners, property owners, and property managers
- Full **PM management software** for GCs, builders, and sub-contractors
- **Dashboards and basic project management** for clients/users (non-contractors)
- **AI-powered automation** via 8 domain-specific claws that think AND execute

### Revenue Model (43 Stripe Products)

| Category | Products | Pricing |
|----------|----------|---------|
| PM Packages | 4 tiers (A-D) | $1,750 - $16,500/mo |
| Architecture Packages | 4 tiers (A-D) | $2,500 - $35,000 one-time |
| Project Owner Packages | 4 tiers (A-D) | $49 - $999/mo |
| Permit Packages | 4 tiers (A-D) | $495 - $7,500 |
| Operations Services | 11 services | $125 - $595 each |
| Estimation Services | 7 services | $195 - $5,995 each |

---

## 2. Monorepo Structure

```
kealee-platform-v10/
├── apps/
│   ├── m-marketplace/             → Vercel (kealee.com) — marketing, sales, service hub
│   ├── m-project-owner/           → Vercel (pm.kealee.com) — client dashboards
│   ├── m-permits-inspections/     → Vercel (permits.kealee.com)
│   ├── m-ops-services/            → Vercel (ops.kealee.com) — client-facing services
│   ├── m-architect/               → Vercel (architect.kealee.com)
│   ├── os-pm/                     → Vercel (app.kealee.com) — PM tool system
│   └── os-admin/                  → Vercel (admin.kealee.com)
│
├── packages/
│   ├── database/                  → Prisma schema + client
│   ├── events/                    → Event bus (Redis Pub/Sub) + envelope
│   ├── queue/                     → BullMQ shared infra
│   ├── ai/                        → AIProvider (Claude primary + OpenAI fallback)
│   ├── shared/                    → Types, utils, constants
│   └── ui/                        → Shared React components
│
├── services/
│   ├── api/                       → Railway (api.kealee.com) — Fastify API
│   └── command-center/            → Railway — 8 claws + gateway
│       ├── claws/
│       │   ├── acquisition-precon/
│       │   ├── contract-commercials/
│       │   ├── schedule-field-ops/
│       │   ├── budget-cost/
│       │   ├── permits-compliance/
│       │   ├── docs-communication/
│       │   ├── risk-prediction/
│       │   └── command-automation/
│       ├── gateway/               → Fastify gateway mounting all claw routes
│       └── index.ts               → Boot registry, start all claws
│
├── docs/
│   ├── architecture/
│   │   ├── kealee-architecture.md ← THIS FILE
│   │   └── claude-code-prompt.md  ← Implementation prompt
│   └── README.md
│
├── scripts/                       → Deploy, test, setup scripts
└── .cursorrules                   → AI agent context rules
```

### Why Monorepo

Cursor indexes the ENTIRE platform in one project — Prisma schema, API routes, frontend components, event types, queue definitions. This is the #1 advantage as a solo builder. Switch to hybrid/polyrepo only at 3+ engineers with PR conflicts.

---

## 3. The 8-Claw System

### Design Principle: Each Claw Is Brain AND Hands

Claws are domain-specific services that **think AND execute**. No separate "mini-app" layer. Each claw:
- Owns specific Prisma models (ONLY writer)
- Has its own BullMQ workers (execution)
- Has its own AI reasoning (intelligence)
- Has its own API routes via gateway (interface)
- Subscribes to events from other claws (input)
- Publishes events for other claws (output)
- Enforces strict guardrails (governance)

### Claw Directory Pattern

```
claws/{claw-name}/
├── index.ts              → Claw class extending BaseClaw (events, config, guardrails)
├── workers/
│   ├── {worker-a}.ts     → BullMQ worker for specific jobs
│   └── {worker-b}.ts
├── routes/
│   └── {domain}.ts       → Fastify routes exposed via gateway
└── ai/
    └── prompts.ts         → Domain-specific AI system prompts
```

### Complete Claw Map

| Claw | Domain | Workers | Queues | AI |
|------|--------|---------|--------|-----|
| **A: Acquisition & PreCon** | Estimates, bids, contractor selection | bid-engine, estimation | bid-engine, estimation-tool | Plan analysis, cost prediction, bid scoring |
| **B: Contract & Commercials** | Contracts, change orders, payments | change-orders, payments | change-order, payment-processing | CO impact analysis, payment risk |
| **C: Schedule & Field Ops** | Schedule, visits, inspection timing | scheduler, visits, inspections | smart-scheduler, visit-scheduler, inspection-coordinator | CPM optimization, weather, resource leveling |
| **D: Budget & Cost Control** | Budgets, actuals, forecasts | budget-tracker | budget-tracker | Variance root cause, cost forecasting |
| **E: Permits & Compliance** | Permits, inspections pass/fail, QA | permit-tracker, qa-inspector | permit-tracker, qa-inspector | Jurisdiction analysis, photo QA (Vision) |
| **F: Docs & Communication** | Documents, messaging, notifications | doc-generator, comms-hub | document-generator, communication-hub | Report narratives, contract summaries |
| **G: Risk & Predictions** | Predictions, risk scores, decisions | predictive-engine, decision-support | predictive-engine, decision-support | Delay/cost/quality prediction, recommendations |
| **H: Command & Automation** | Tasks, jobs, dashboards, orchestration | task-orchestrator, job-scheduler | task-orchestrator, job-scheduler | Task prioritization, rule evaluation |

---

## 4. Event Envelope & Bus

### Standard Envelope (ALL events use this)

```typescript
// packages/events/src/envelope.ts

export interface KealeeEventEnvelope<T = Record<string, unknown>> {
  id: string;                    // evt_01J234ABCDEF
  type: string;                  // domain.subdomain.action
  source: string;                // which claw emitted it
  projectId: string;
  organizationId: string;
  entity?: { type: string; id: string };
  severity?: 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  payload: T;
  trigger?: { eventId: string; eventType: string };
  metadata: {
    correlationId: string;
    initiatorType: 'USER' | 'SYSTEM' | 'AI';
    initiatorId: string;
    version: string;
  };
  createdAt: string;
}
```

### Event Types by Domain

```
estimate.*          → Claw A publishes (created, updated, approved)
bid.*               → Claw A publishes (request.created, submissions.scored, contractor.recommended)
project.precon.*    → Claw A publishes (completed)

contract.*          → Claw B publishes (draft.created, executed)
changeorder.*       → Claw B publishes (created, submitted, approved, rejected)
payment.*           → Claw B publishes (request.created, disbursed)

schedule.*          → Claw C publishes (created, updated, criticalpath.changed)
sitevisit.*         → Claw C publishes (scheduled, completed)

budget.*            → Claw D publishes (seeded.from.estimate, updated, alert.variance.high)

permit.*            → Claw E publishes (created, status.changed, approved, expiring)
inspection.*        → Claw E publishes (required.compliance, failed.compliance, scheduled, passed, failed)
compliance.*        → Claw E publishes (alert.high)

document.*          → Claw F publishes (generated, signed)
communication.*     → Claw F publishes (sent, failed)

prediction.*        → Claw G publishes (created, costoverrun.created)
risk.*              → Claw G publishes (assessment.created, assessment.updated)
decision.*          → Claw G publishes (recommended, accepted, rejected)

task.*              → Claw H publishes (created, completed, failed)
system.*            → Claw H publishes (alert, metric.updated)
```

### Event Type Naming: `domain.subdomain.action`

---

## 5. Shared Infrastructure

### 5.1 Event Bus (Redis Pub/Sub)

```typescript
// packages/events/src/event-bus.ts
export class EventBus {
  private pub: Redis;
  private sub: Redis;
  private handlers = new Map<string, EventHandler[]>();

  async publish(event: KealeeEventEnvelope): Promise<void> {
    const channel = event.type.split('.').slice(0, 2).join('.');
    await this.pub.publish(channel, JSON.stringify(event));
    await this.pub.publish('kealee.*', JSON.stringify(event)); // wildcard for Claw H
  }

  subscribe(pattern: string, handler: EventHandler): void {
    // pattern matching: 'budget.*', 'schedule.*', etc.
  }
}
```

### 5.2 Queue Registry (BullMQ)

```typescript
// packages/queue/src/queue-registry.ts
export const KEALEE_QUEUES = {
  BID_ENGINE: 'bid-engine',
  ESTIMATION_TOOL: 'estimation-tool',
  CHANGE_ORDER: 'change-order',
  PAYMENT_PROCESSING: 'payment-processing',
  SMART_SCHEDULER: 'smart-scheduler',
  VISIT_SCHEDULER: 'visit-scheduler',
  INSPECTION_COORDINATOR: 'inspection-coordinator',
  BUDGET_TRACKER: 'budget-tracker',
  PERMIT_TRACKER: 'permit-tracker',
  QA_INSPECTOR: 'qa-inspector',
  DOCUMENT_GENERATOR: 'document-generator',
  COMMUNICATION_HUB: 'communication-hub',
  PREDICTIVE_ENGINE: 'predictive-engine',
  DECISION_SUPPORT: 'decision-support',
  TASK_ORCHESTRATOR: 'task-orchestrator',
  JOB_SCHEDULER: 'job-scheduler',
} as const;
```

### 5.3 BaseClaw Abstract Class

```typescript
// services/command-center/claws/base-claw.ts
export interface ClawConfig {
  name: string;
  eventPatterns: string[];
  writableModels: string[];
}

export abstract class BaseClaw {
  protected eventBus: EventBus;
  protected prisma: PrismaClient;
  protected config: ClawConfig;

  async start(): Promise<void> {
    for (const pattern of this.config.eventPatterns) {
      this.eventBus.subscribe(pattern, (event) => this.handleEventSafe(event));
    }
    await this.registerWorkers();
  }

  private async handleEventSafe(event: KealeeEventEnvelope): Promise<void> {
    if (event.source === this.config.name) return; // self-loop prevention
    await this.handleEvent(event);
  }

  abstract handleEvent(event: KealeeEventEnvelope): Promise<void>;
  abstract registerWorkers(): Promise<void>;

  protected assertWritable(model: string): void {
    if (!this.config.writableModels.includes(model)) {
      throw new Error(`[GUARDRAIL] ${this.config.name} cannot write to ${model}`);
    }
  }
}
```

---

## 6. Claw A: Acquisition & PreCon

**Mission:** Move deals from intake → estimate → bid → contractor selection.

### Config
```typescript
{
  name: 'acquisition-precon-claw',
  eventPatterns: ['project.*', 'estimation.*'],
  writableModels: ['Estimate', 'EstimateSection', 'EstimateLineItem',
                   'BidRequest', 'BidInvitation', 'BidSubmission', 'ContractorBid']
}
```

### Events

| Consumes | Publishes |
|----------|-----------|
| `project.created` | `estimate.created`, `estimate.updated`, `estimate.approved` |
| `project.precon.requested` | `bid.request.created`, `bid.submissions.scored` |
| `estimation.order.created` | `bid.contractor.recommended`, `project.precon.completed` |

### Workers
- **bid-engine:** Contractor matching (fair rotation 70% merit / 30% fairness), bid invitation management, bid scoring (price + timeline + rating + fit), bid analysis
- **estimation:** AI plan analysis from uploaded drawings, assembly-based cost calculation (17 models: MaterialCost, LaborRate, EquipmentRate, Assembly, AssemblyItem), regional cost indexing, historical comparables

### Guardrails
- ❌ Cannot alter budgets, contracts, or schedules
- ❌ Cannot execute payments
- ❌ Cannot modify project status beyond precon phase

---

## 7. Claw B: Contract & Commercials

**Mission:** Own contracts, change orders, and the commercial state of the job.

### Config
```typescript
{
  name: 'contract-commercials-claw',
  eventPatterns: ['project.*', 'estimate.*', 'bid.*', 'schedule.*'],
  writableModels: ['Contract', 'ChangeOrder', 'ChangeOrderLineItem', 'BudgetTransaction']
}
```

### Events

| Consumes | Publishes |
|----------|-----------|
| `project.precon.completed`, `estimate.approved` | `contract.draft.created`, `contract.executed` |
| `bid.contractor.recommended` | `changeorder.created`, `changeorder.submitted` |
| `schedule.updated` | `changeorder.approved`, `changeorder.rejected` |
| | `payment.request.created`, `payment.disbursed` |

### Workers
- **change-orders:** Pricing, AI scope impact analysis, schedule impact, approval routing (under $5K PM approves, $5-25K owner approves, over $25K written sign-off)
- **payments:** AIA-style pay applications, retainage tracking, lien waiver generation, Stripe Connect disbursements, draw scheduling

### Guardrails
- ❌ Cannot run budget prediction or schedule optimization
- ❌ Cannot auto-approve payments without explicit state transition + audit log
- ❌ Cannot modify schedule items or inspection results

---

## 8. Claw C: Schedule & Field Ops

**Mission:** Control the live schedule and field execution.

### Config
```typescript
{
  name: 'schedule-field-ops-claw',
  eventPatterns: ['contract.*', 'changeorder.*', 'weather.*', 'inspection.*'],
  writableModels: ['ScheduleItem', 'WeatherLog', 'SiteVisit', 'VisitChecklist']
}
```

### Events

| Consumes | Publishes |
|----------|-----------|
| `contract.executed` | `schedule.created`, `schedule.updated`, `schedule.criticalpath.changed` |
| `changeorder.approved` | `sitevisit.scheduled`, `sitevisit.completed` |
| `weather.alert` | `inspection.scheduled`, `inspection.timeline.impact` |
| `inspection.required` | |

### Workers
- **scheduler:** Critical path method (CPM), resource leveling across trades, predecessor/successor dependencies, float analysis, look-ahead schedules (2-week rolling), weather-delay auto-reschedule
- **visits:** PM availability matching, route optimization, weather/traffic factoring, daily reports with photo docs
- **inspections:** Timing coordination with permit requirements, reminder sequencing (48hr + 24hr)

### Guardrails
- ❌ Cannot approve/fail inspections (pass/fail belongs to Claw E)
- ❌ Cannot alter contract values
- ❌ Cannot modify budgets

---

## 9. Claw D: Budget & Cost Control

**Mission:** Maintain budgets, actuals, and cost forecasts.

### Config
```typescript
{
  name: 'budget-cost-claw',
  eventPatterns: ['estimate.*', 'changeorder.*', 'payment.*'],
  writableModels: ['BudgetItem', 'BudgetTransaction', 'Prediction']
}
```

### Events

| Consumes | Publishes |
|----------|-----------|
| `estimate.approved` | `budget.seeded.from.estimate`, `budget.updated` |
| `changeorder.approved` | `budget.alert.variance.high` |
| `payment.disbursed` | `prediction.costoverrun.created` |

### Workers
- **budget-tracker:** Seed budget from estimate (categories: LABOR, MATERIAL, EQUIPMENT, SUBCONTRACTOR, PERMITS, OVERHEAD, CONTINGENCY), recalculate on COs, record actuals from payments, earned value analysis (CPI/SPI), cost-to-complete forecasting, commitment tracking, cash flow projections, variance alerts with AI root cause analysis (>15% category or >10% total triggers alert)

### Guardrails
- ❌ Cannot modify contracts, change orders, or payment statuses
- ❌ Cannot alter schedules
- ❌ Cannot approve/reject permits or inspections

---

## 10. Claw E: Permits & Compliance

**Mission:** Keep permits, inspections, and code compliance on track. OWNS inspection pass/fail.

### Config
```typescript
{
  name: 'permits-compliance-claw',
  eventPatterns: ['project.*', 'document.*', 'schedule.*'],
  writableModels: ['Jurisdiction', 'Permit', 'Inspection']
}
```

### Events

| Consumes | Publishes |
|----------|-----------|
| `project.phase.changed` | `permit.created`, `permit.status.changed`, `permit.approved`, `permit.expiring` |
| `document.generated` | `inspection.required.compliance`, `inspection.failed.compliance` |
| `schedule.updated` | `compliance.alert.high` |

### Workers
- **permit-tracker:** Multi-jurisdiction requirements (DC vs MD vs VA), portal status checking (cron daily 6AM), document preparation, deadline monitoring, expiration tracking (30-day warning)
- **qa-inspector:** AI photo analysis (Claude Vision) for quality/safety issues, compliance checks against jurisdiction requirements, inspection pass/fail recording (THIS claw owns pass/fail authority)

### Guardrails
- ❌ Cannot auto-file permits or pay fees without explicit user trigger
- ❌ Cannot modify financial records, budgets, or payments
- ❌ Cannot alter schedules or contract terms

---

## 11. Claw F: Documents & Communication

**Mission:** Generate all docs, send all outbound comms, power Kealee Messenger. Pure representation layer.

### Config
```typescript
{
  name: 'docs-communication-claw',
  eventPatterns: ['contract.*', 'changeorder.*', 'permit.*', 'schedule.*', 'decision.*', 'budget.*'],
  writableModels: ['Document', 'DocumentTemplate', 'CommunicationLog', 'CommunicationTemplate',
                   'Conversation', 'Message', 'MessageAttachment', 'ConversationParticipant', 'MessageRead']
}
```

### Events

| Consumes | Publishes |
|----------|-----------|
| `contract.executed`, `changeorder.approved` | `document.generated`, `document.signed` |
| `permit.status.changed`, `schedule.updated` | `communication.sent`, `communication.failed` |
| `decision.recommended`, `budget.alert.variance.high` | |

### Workers
- **doc-generator:** Template rendering, PDF generation (AIA G702/G703, lien waivers, RFIs, submittals, meeting minutes, daily logs, punch lists, closeout packages), e-signatures, AI narrative generation
- **comms-hub:** Email (Resend), SMS (Twilio — notification only, links back to platform), in-app messaging (WebSocket), notification center, Kealee Messenger operations, @kealee AI assistant routing

### Guardrails
- ❌ Cannot mutate contracts, budgets, schedules, or any domain data
- ❌ Cannot make decisions or recommendations
- ❌ Cannot trigger financial transactions

---

## 12. Claw G: Risk, Prediction & Decisions

**Mission:** Aggregate signals into predictions and decision recommendations. READ-ONLY to all other domains.

### Config
```typescript
{
  name: 'risk-prediction-claw',
  eventPatterns: ['budget.*', 'schedule.*', 'permit.*', 'qualityissue.*', 'prediction.*', 'inspection.*'],
  writableModels: ['Prediction', 'RiskAssessment', 'DecisionLog', 'AIConversation']
}
```

### Events

| Consumes | Publishes |
|----------|-----------|
| `budget.updated`, `budget.alert.variance.high` | `risk.assessment.created`, `risk.assessment.updated` |
| `schedule.updated`, `schedule.criticalpath.changed` | `prediction.created` (DELAY, COSTOVERRUN, QUALITYISSUE, SAFETY) |
| `permit.status.changed`, `inspection.failed.compliance` | `decision.recommended`, `decision.accepted`, `decision.rejected` |

### Workers
- **predictive-engine:** Gather all project signals (budget variance, schedule float, permit status, inspection pass rate, CO frequency, weather history), run AI prediction models, confidence threshold >0.7 to create Prediction records, nightly full risk assessment (cron 5AM)
- **decision-support:** Generate 2-3 decision options with tradeoffs via AI, create DecisionLog with PENDING status, record acceptance (acceptedBy, acceptedAt, outcome)

### Guardrails
- ❌ Cannot directly edit contracts, budgets, schedules, or permits
- ❌ Cannot auto-execute decisions (MUST be explicitly accepted by user)
- ❌ Cannot trigger payments, filings, or external actions

---

## 13. Claw H: Command Center & Automation

**Mission:** Meta-orchestrator. Schedules jobs, routes tasks, powers dashboards. Monitors all claws.

### Config
```typescript
{
  name: 'command-automation-claw',
  eventPatterns: ['kealee.*'],  // ALL events
  writableModels: ['AutomationTask', 'JobQueue', 'JobSchedule',
                   'DashboardWidget', 'Notification', 'ActivityLog']
}
```

### Events

| Consumes | Publishes |
|----------|-----------|
| ALL events via `kealee.*` wildcard | `task.created`, `task.completed`, `task.failed` |
| | `system.alert`, `system.metric.updated` |

### Workers
- **task-orchestrator:** Log every event to ActivityLog (audit), evaluate automation rules per event type, create follow-up tasks, assign to PMs, track completion, escalate overdue (hourly cron)
- **job-scheduler:** Cron jobs — 5AM nightly risk (→ Claw G), 6AM permit status (→ Claw E), 7AM weather visits (→ Claw C), 8AM budget variance (→ Claw D), 6PM daily summary (→ Claw F), Monday 9AM weekly report

### Automation Rules

| Trigger Event | Action |
|--------------|--------|
| `inspection.failed.compliance` | Create task: "Schedule re-inspection", assign to PM |
| `budget.alert.variance.high` | Create task: "Review budget variance" + notify owner |
| `permit.expiring` | Create task: "Renew permit", urgent notification |
| `sitevisit.completed` | Create task: "Upload visit report", assign to PM |

### Guardrails
- ❌ Cannot make domain decisions
- ❌ Cannot override claw guardrails
- ❌ Cannot directly write to any domain-owned model

---

## 14. Kealee Messenger

### Strategic Requirement
ALL communication must stay inside Kealee. Prevents parties from bypassing platform fees, captures full audit trail for dispute resolution, keeps Kealee as indispensable project hub.

### Schema

```prisma
model Conversation {
  id              String                @id @default(cuid())
  projectId       String
  project         Project               @relation(fields: [projectId], references: [id])
  organizationId  String
  type            ConversationType
  name            String?
  participants    ConversationParticipant[]
  messages        Message[]
  isArchived      Boolean               @default(false)
  createdAt       DateTime              @default(now())
  updatedAt       DateTime              @updatedAt
}

model ConversationParticipant {
  id              String       @id @default(cuid())
  conversationId  String
  userId          String
  role            ParticipantRole
  lastReadAt      DateTime?
  isMuted         Boolean      @default(false)
  joinedAt        DateTime     @default(now())
}

model Message {
  id              String       @id @default(cuid())
  conversationId  String
  senderId        String
  content         String
  type            MessageType
  attachments     MessageAttachment[]
  replyToId       String?
  isEdited        Boolean      @default(false)
  isPinned        Boolean      @default(false)
  metadata        Json?
  readBy          MessageRead[]
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt
}

model MessageAttachment {
  id          String  @id @default(cuid())
  messageId   String
  fileName    String
  fileUrl     String
  fileType    String
  fileSize    Int
}

model MessageRead {
  id          String   @id @default(cuid())
  messageId   String
  userId      String
  readAt      DateTime @default(now())
  @@unique([messageId, userId])
}

enum ConversationType { DIRECT GROUP PROJECT_CHANNEL SUPPORT AI_ASSISTANT }
enum ParticipantRole { OWNER ADMIN MEMBER VIEWER }
enum MessageType { TEXT FILE IMAGE SYSTEM AI_RESPONSE CHANGE_ORDER PAYMENT RFI }
```

### Platform Lock-In Strategies

| Strategy | How |
|----------|-----|
| Auto-created project channels | `contract.executed` → Claw H creates Conversation with all parties |
| Context-rich messages | Messages embed COs, inspection results, payment status |
| File sharing in-thread | All docs shared with version tracking |
| @kealee AI assistant | Mention `@kealee` in any chat for project queries + actions |
| SMS/email = notification only | External says "You have a message in Kealee" with link, never the content |
| Contractual requirement | TOS requires all project comms through Kealee for escrow/dispute protection |
| Payment in conversation | Milestones, approvals, disbursements happen IN threads |

### @kealee AI Assistant

```
User: '@kealee what is the budget status?'
  → Gathers budget/schedule/permit data from Prisma
  → Calls Claude API with project context
  → Posts AI_RESPONSE message in thread

User: '@kealee schedule a site visit for Thursday'
  → Verifies user authority
  → Publishes sitevisit.scheduled event → Claw C processes

User: '@kealee approve change order CO-2024-015'
  → Verifies approval authority
  → Publishes changeorder.approved event → Claw B processes
```

---

## 15. AI Intelligence Layer

### Architecture
Claude (Anthropic) is primary. OpenAI is automatic fallback. AI THINKS inside claws — it does not RUN them.

### AIProvider

```typescript
// packages/ai/src/ai-provider.ts
export class AIProvider {
  private claude = new Anthropic();
  private openai = new OpenAI();

  async reason(params: {
    task: string;
    context: Record<string, unknown>;
    provider?: 'claude' | 'openai';
  }): Promise<unknown> {
    try {
      // Claude primary (claude-sonnet-4-5-20250929)
      // Auto-failover to OpenAI (gpt-4o-mini) on error
    } catch { return this.reason({ ...params, provider: 'openai' }); }
  }

  async analyzeImage(imageUrl: string, task: string) {
    // Always Claude Vision
  }
}
```

### AI Usage Per Claw

| Claw | AI Tasks |
|------|----------|
| A | Plan analysis, cost prediction from drawings, bid scoring |
| B | Change order scope impact analysis, payment risk |
| C | CPM optimization, weather impact prediction, resource leveling |
| D | Variance root cause analysis, cost-to-complete forecasting |
| E | Jurisdiction requirement analysis, photo QA (Vision API) |
| F | Report narratives, contract summaries, template filling, @kealee assistant |
| G | Delay/cost/quality prediction, risk scoring, decision recommendations |
| H | Task prioritization, automation rule evaluation |

---

## 16. Cross-Claw Event Flow

```
CHANGE ORDER APPROVED → 5 claws react

  os-pm [Approve button] → API → CLAW B (publishes changeorder.approved)
                                      │
         ┌──────────┬────────────┬────┴───────┬──────────┐
         ▼          ▼            ▼            ▼          ▼
      CLAW D     CLAW C      CLAW F      CLAW G     CLAW H
      Budget     Schedule    Docs         Risk       Command
      recalc     adjust      generate     reassess   create
      items      durations   CO letter    scores     follow-up
                             notify                  tasks
```

### Rules

| Rule | Description |
|------|-------------|
| One Publisher | Each event type has exactly ONE claw that can publish it |
| Many Subscribers | Multiple claws can consume the same event |
| Correlation Chain | `trigger.eventId` traces full causal chain |
| No Self-React | Claws never handle their own events |
| Idempotent | Every handler must be replay-safe |

---

## 17. Guardrails Enforcement

### Write Guard
```typescript
this.assertWritable('BudgetItem'); // throws if claw can't write
```

### Publish Guard
```typescript
const EVENT_OWNERSHIP = {
  'estimate.*': 'acquisition-precon-claw',
  'bid.*': 'acquisition-precon-claw',
  'contract.*': 'contract-commercials-claw',
  'changeorder.*': 'contract-commercials-claw',
  'payment.*': 'contract-commercials-claw',
  'schedule.*': 'schedule-field-ops-claw',
  'budget.*': 'budget-cost-claw',
  'permit.*': 'permits-compliance-claw',
  'inspection.*': 'permits-compliance-claw',
  'document.*': 'docs-communication-claw',
  'communication.*': 'docs-communication-claw',
  'prediction.*': 'risk-prediction-claw',
  'risk.*': 'risk-prediction-claw',
  'decision.*': 'risk-prediction-claw',
  'task.*': 'command-automation-claw',
  'system.*': 'command-automation-claw',
};
```

### Self-Loop Prevention
```typescript
if (event.source === this.config.name) return;
if (hopCount > 10) return; // max chain depth
```

---

## 18. User Access by Claw

| Claw / Feature | Homeowner/Client | GC Subscriber | Kealee PM | Kealee Admin |
|----------------|-----------------|---------------|-----------|-------------|
| A: Bids & Estimates | Sees results | Manages own | Full control | Full control |
| B: Contracts & COs | Approves COs | Creates/manages | Full control | Full control |
| C: Schedule & Visits | Sees schedule | Schedules visits | Full control | Full control |
| D: Budget | Summary view | Full tracking | Full control | Full control |
| E: Permits & Inspections | Sees status | Full tracking | Full control | Full control |
| F: Docs & Messenger | Receives docs, messages | Full comms | Full control | Full control |
| G: Predictions & Decisions | No access | Sees predictions | Full control | Full control |
| H: Tasks & Dashboard | No access | Task management | Full control | Full control |

---

## 19. Implementation Sequence

| Phase | What | Duration |
|-------|------|----------|
| **Phase 0: Foundation** | packages/events, packages/queue, packages/ai, BaseClaw, ClawRegistry, guardrails | 1 week |
| **Phase 1: Core** | Claw A (Acquisition) + Claw D (Budget) | 2 weeks |
| **Phase 2: Execution** | Claw B (Contracts) + Claw C (Schedule) | 2 weeks |
| **Phase 3: Compliance** | Claw E (Permits) | 1 week |
| **Phase 4: Intelligence** | Claw G (Risk/Predictions) | 2 weeks |
| **Phase 5: Communication** | Claw F (Docs/Comms + Messenger) | 2 weeks |
| **Phase 6: Orchestration** | Claw H (Command Center) | 2 weeks |
| **Phase 7: Integration** | Gateway, entry point, Messenger API routes, .cursorrules | 1 week |

---

## 20. Deployment & Scaling

| Component | Service | Notes |
|-----------|---------|-------|
| Command Center | Railway | Fastify gateway + all claw workers |
| Redis | Railway or Upstash | Pub/Sub for events, persistent for BullMQ |
| Database | Supabase (PostgreSQL) | Shared Prisma, PgBouncer pooling |
| File Storage | Supabase Storage | Documents, PDFs, photos |
| Frontends | Vercel | All m-* and os-* apps |
| Payments | Stripe | 43 products, Connect for contractors |
| AI | Anthropic + OpenAI | Claude primary, OpenAI fallback |

### Environment Variables
```bash
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
STRIPE_SECRET_KEY=sk_live_...
SUPABASE_URL=https://...
SUPABASE_SERVICE_KEY=...
RESEND_API_KEY=re_...
ANTHROPIC_API_KEY=sk-...
OPENAI_API_KEY=sk-...
```

---

## 21. Team Scaling

| Revenue | Team | Architecture |
|---------|------|-------------|
| $0-$50K MRR | You + VA + AI tools | Stay monorepo |
| $50-$150K | 2-3 engineers | Stay monorepo |
| $150-$500K | 4-6 | Consider hybrid (separate command-center repo) |
| $500K+ | 6-10+ | Polyrepo with @kealee/* published packages |
| $1M+ | 10-15+ | Full org chart, dedicated teams per domain |

> AI tools compress engineering needs ~3x. What costs competitors $3M/year, you match with 3 engineers + AI at $300K/year.

---

*© 2026 Kealee Construction LLC. All rights reserved.*
