# Kealee Platform v10 — Claude Code Implementation Prompt

> **USAGE:** Paste this ENTIRE prompt into Claude Code or Cursor AI chat.
> It builds the complete 8-claw system in one shot.
> Before running: ensure `docs/architecture/kealee-architecture.md` is in your repo.

---

## PROMPT — START

```
Read docs/architecture/kealee-architecture.md fully before writing any code.

Build the complete Kealee Claws system. Create ALL files below in order.
Follow every guardrail, event ownership rule, and naming convention from the architecture doc.
Use existing Prisma schema — do NOT recreate models that already exist, only add missing ones.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 0: FOUNDATION PACKAGES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FILE: packages/events/package.json
- name: "@kealee/events"
- dependencies: ioredis

FILE: packages/events/src/envelope.ts
- Export KealeeEventEnvelope<T> interface with ALL fields:
  id, type, source, projectId, organizationId, entity?, severity?, payload, trigger?, metadata, createdAt

FILE: packages/events/src/event-types.ts
- Export EVENT_TYPES const object with every event type organized by domain:
  estimate.* (created, updated, approved)
  bid.* (request.created, submissions.scored, contractor.recommended)
  project.precon.* (completed)
  contract.* (draft.created, executed)
  changeorder.* (created, submitted, approved, rejected)
  payment.* (request.created, disbursed)
  schedule.* (created, updated, criticalpath.changed)
  sitevisit.* (scheduled, completed)
  budget.* (seeded.from.estimate, updated, alert.variance.high)
  permit.* (created, status.changed, approved, expiring)
  inspection.* (required.compliance, failed.compliance, scheduled, passed, failed)
  compliance.* (alert.high)
  document.* (generated, signed)
  communication.* (sent, failed)
  prediction.* (created, costoverrun.created)
  risk.* (assessment.created, assessment.updated)
  decision.* (recommended, accepted, rejected)
  task.* (created, completed, failed)
  system.* (alert, metric.updated)

FILE: packages/events/src/create-event.ts
- Export createEvent<T>() helper
- Auto-generate evt_ prefixed ID using randomUUID
- Auto-set correlationId from trigger.eventId if present
- Default initiatorType: 'SYSTEM', version: '1.0.0'

FILE: packages/events/src/event-bus.ts
- Export EventBus class using ioredis
- Separate pub/sub Redis connections from REDIS_URL env
- publish(): send to domain channel AND kealee.* wildcard
- subscribe(): pattern matching with handler registry Map<string, EventHandler[]>

FILE: packages/events/src/index.ts
- Barrel export everything

FILE: packages/queue/package.json
- name: "@kealee/queue"
- dependencies: bullmq, ioredis

FILE: packages/queue/src/queue-registry.ts
- Export KEALEE_QUEUES const with all 16 queue names:
  BID_ENGINE, ESTIMATION_TOOL, CHANGE_ORDER, PAYMENT_PROCESSING,
  SMART_SCHEDULER, VISIT_SCHEDULER, INSPECTION_COORDINATOR,
  BUDGET_TRACKER, PERMIT_TRACKER, QA_INSPECTOR,
  DOCUMENT_GENERATOR, COMMUNICATION_HUB,
  PREDICTIVE_ENGINE, DECISION_SUPPORT,
  TASK_ORCHESTRATOR, JOB_SCHEDULER

FILE: packages/queue/src/connection.ts
- Export getRedisConnection() from REDIS_URL
- Export createQueue(name) with default job options:
  attempts: 3, backoff exponential 1000ms, removeOnComplete: 1000, removeOnFail: 5000
- Export createWorker(name, processor, concurrency=5) helper with error logging and graceful shutdown

FILE: packages/queue/src/index.ts
- Barrel export

FILE: packages/ai/package.json
- name: "@kealee/ai"
- dependencies: @anthropic-ai/sdk, openai

FILE: packages/ai/src/ai-provider.ts
- Export AIProvider class:
  - Private claude (Anthropic) and openai (OpenAI) clients
  - reason({ task, context, schema?, provider?, model? }):
    - Default: claude with claude-sonnet-4-5-20250929
    - System prompt: "You are a construction management AI assistant for the Kealee platform."
    - Auto-failover: if claude throws, retry with openai gpt-4o-mini
    - Return parsed text content
  - analyzeImage(imageUrl, task): always Claude Vision API
  - parseResponse(): extract text from either API format

FILE: packages/ai/src/construction-prompts.ts
- Export domain-specific system prompts for each claw:
  ACQUISITION_PROMPT, CONTRACT_PROMPT, SCHEDULE_PROMPT, BUDGET_PROMPT,
  PERMIT_PROMPT, DOCS_PROMPT, RISK_PROMPT, COMMAND_PROMPT
- Each prompt should be 2-3 sentences describing the domain expertise.
  Example: "You are an expert construction estimator. Analyze project scope, materials, labor rates,
  and regional cost indexes to produce accurate estimates. Consider historical data and assembly costs."

FILE: packages/ai/src/index.ts
- Barrel export

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 0B: CLAW FRAMEWORK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FILE: services/command-center/package.json
- name: "@kealee/command-center"
- dependencies: @kealee/events, @kealee/queue, @kealee/ai, @kealee/database (or @prisma/client)

FILE: services/command-center/claws/base-claw.ts
- Export ClawConfig interface: name, eventPatterns[], writableModels[]
- Export abstract BaseClaw:
  - constructor(eventBus, prisma, config)
  - start(): subscribe to all patterns, call registerWorkers(), log startup
  - handleEventSafe(): skip self-source events, skip if hop count > 10
  - abstract handleEvent(event)
  - abstract registerWorkers()
  - assertWritable(model): throw if model not in writableModels

FILE: services/command-center/claws/registry.ts
- Export ClawRegistry:
  - register(claw), startAll(), getClaw(name), getAll(), healthCheck()

FILE: services/command-center/claws/guardrails.ts
- Export EVENT_OWNERSHIP: domain prefix → claw name (see architecture doc section 17)
- Export validateEventPublish(event): throw if source doesn't own event type
- Export CLAW_WRITE_PERMISSIONS: claw name → allowed model names[]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 1-6: ALL 8 CLAWS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

For EACH claw below, create the directory structure:
  services/command-center/claws/{name}/
  ├── index.ts      → Claw class extending BaseClaw
  ├── workers/      → BullMQ worker files
  ├── routes/       → Fastify route handlers
  └── ai/prompts.ts → Domain AI prompts

Use the config (name, eventPatterns, writableModels), events (consumes/publishes),
workers, and guardrails EXACTLY as specified in kealee-architecture.md sections 6-13.

CLAW A: services/command-center/claws/acquisition-precon/
- index.ts: AcquisitionPreConClaw
- workers/bid-engine.ts: contractor matching, fair rotation (70/30), bid scoring (price+timeline+rating+fit), invitations
- workers/estimation.ts: AI plan analysis, assembly-based costs, regional indexing, historical comparables
- routes/bids.ts: CRUD for bid requests, submissions, scoring results
- routes/estimates.ts: CRUD for estimates, sections, line items
- ai/prompts.ts: ACQUISITION_PROMPT

CLAW B: services/command-center/claws/contract-commercials/
- index.ts: ContractCommercialsClaw
- workers/change-orders.ts: pricing, AI scope impact, schedule impact, approval routing ($5K/$25K thresholds)
- workers/payments.ts: pay apps, retainage, lien waivers, Stripe Connect disbursement
- routes/contracts.ts: contract CRUD, execution, pay apps
- ai/prompts.ts: CONTRACT_PROMPT

CLAW C: services/command-center/claws/schedule-field-ops/
- index.ts: ScheduleFieldOpsClaw
- workers/scheduler.ts: CPM, resource leveling, float analysis, weather-delay reschedule
- workers/visits.ts: availability, route optimization, weather/traffic
- workers/inspections.ts: timing coordination, reminders 48hr+24hr
- routes/schedule.ts: schedule CRUD, visits, look-ahead
- ai/prompts.ts: SCHEDULE_PROMPT

CLAW D: services/command-center/claws/budget-cost/
- index.ts: BudgetCostClaw
- workers/budget-tracker.ts: seed from estimate (7 categories), recalc on COs, record actuals, variance check (>15% category or >10% total), AI root cause analysis
- routes/budget.ts: budget items, transactions, forecasts
- ai/prompts.ts: BUDGET_PROMPT

CLAW E: services/command-center/claws/permits-compliance/
- index.ts: PermitsComplianceClaw
- workers/permit-tracker.ts: jurisdiction requirements (DC/MD/VA), status polling, deadline monitoring
- workers/qa-inspector.ts: Claude Vision photo analysis, compliance checks, pass/fail recording
- routes/permits.ts: permit CRUD, inspection results
- ai/prompts.ts: PERMIT_PROMPT

CLAW F: services/command-center/claws/docs-communication/
- index.ts: DocsCommunicationClaw
- workers/doc-generator.ts: template rendering, PDF generation, e-signatures, AI narratives
- workers/comms-hub.ts: email (Resend), SMS notification (Twilio, link-back only), in-app (WebSocket), notification center
- workers/kealee-messenger.ts: @kealee detection, project context gathering, AI query + action routing
- routes/documents.ts: document CRUD, templates
- routes/messenger.ts: conversations, messages, participants, read receipts
- ai/prompts.ts: DOCS_PROMPT

CLAW G: services/command-center/claws/risk-prediction/
- index.ts: RiskPredictionClaw
- workers/predictive-engine.ts: gather signals, run AI predictions (DELAY, COSTOVERRUN, QUALITYISSUE, SAFETY), confidence >0.7 threshold, nightly cron
- workers/decision-support.ts: generate 2-3 options with tradeoffs, track acceptance
- routes/predictions.ts: predictions, risk assessments, decision logs
- ai/prompts.ts: RISK_PROMPT

CLAW H: services/command-center/claws/command-automation/
- index.ts: CommandAutomationClaw (subscribes to kealee.*)
- workers/task-orchestrator.ts: log ALL events to ActivityLog, evaluate automation rules, create follow-up tasks, hourly overdue check
- workers/job-scheduler.ts: cron schedule (5AM risk, 6AM permits, 7AM weather, 8AM budget, 6PM summary, Monday reports)
- workers/automation-rules.ts: rule definitions — inspection.failed → re-inspect task, budget.alert → review task, permit.expiring → renew task, sitevisit.completed → upload report task
- routes/tasks.ts: task CRUD, dashboard widgets, activity log
- ai/prompts.ts: COMMAND_PROMPT

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 7: GATEWAY & ENTRY POINT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FILE: services/command-center/gateway/index.ts
- Fastify server that mounts all claw route files under prefixed paths:
  /api/claws/acquisition/* → Claw A routes
  /api/claws/contracts/*   → Claw B routes
  /api/claws/schedule/*    → Claw C routes
  /api/claws/budget/*      → Claw D routes
  /api/claws/permits/*     → Claw E routes
  /api/claws/docs/*        → Claw F routes
  /api/claws/risk/*        → Claw G routes
  /api/claws/command/*     → Claw H routes
  /api/messenger/*         → Claw F messenger routes
- Health check endpoint: GET /health

FILE: services/command-center/index.ts
- Import all 8 claw classes
- main() async:
  - Init Redis, PrismaClient, EventBus
  - Create all 8 claw instances
  - Register in ClawRegistry
  - registry.startAll()
  - Start gateway server
  - Graceful shutdown on SIGTERM/SIGINT

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 8: PRISMA SCHEMA ADDITIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Check the existing schema.prisma. ONLY add models that don't exist yet.
Models likely needed (verify first):

For Kealee Messenger:
  Conversation, ConversationParticipant, Message, MessageAttachment, MessageRead
  Enums: ConversationType, ParticipantRole, MessageType

For claws (if missing):
  BudgetItem, BudgetTransaction, Prediction, RiskAssessment, DecisionLog,
  AIConversation, AutomationTask, JobQueue, JobSchedule, DashboardWidget,
  ActivityLog, Jurisdiction, VisitChecklist, CommunicationLog,
  CommunicationTemplate, DocumentTemplate

Add proper relations to existing User and Project models.
Do NOT modify existing models unless adding a relation field.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 9: .cursorrules
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FILE: .cursorrules (at repo root)

Content:
# Kealee Platform v10 — Cursor Rules

## Read First
- docs/architecture/kealee-architecture.md

## Claw Guardrails (NEVER VIOLATE)
- Each claw ONLY writes to its designated Prisma models (use assertWritable)
- Each event type has ONE claw publisher (see EVENT_OWNERSHIP in guardrails.ts)
- Claws never react to their own events
- Claw G is READ-ONLY to other domains
- Claw F is a PURE REPRESENTATION LAYER — never mutates domain data
- Claw H ORCHESTRATES but never makes domain decisions

## Event System
- All events use KealeeEventEnvelope from packages/events
- Created via createEvent() helper
- Type naming: domain.subdomain.action
- Always include trigger for causal chain
- Always include projectId + organizationId

## AI
- All AI calls through packages/ai/AIProvider
- Claude primary, OpenAI fallback
- Vision tasks always Claude
- AI thinks inside workers — does not run claws

## Communication
- ALL project communication inside Kealee Messenger
- External SMS/email = notification link only, never content
- @kealee mentions route through Claw F kealee-messenger worker

## Queue Processing
- All heavy work in BullMQ queues, not request handlers
- 3 retries with exponential backoff
- Queue names in packages/queue/queue-registry.ts

## Database
- Shared Prisma in packages/database
- Always scope by organizationId
- Use transactions for multi-model writes within a claw

## Stack
- Frontend: Next.js on Vercel
- API: Fastify on Railway
- Command Center: Node.js + BullMQ on Railway
- DB: PostgreSQL (Supabase) via Prisma
- Cache/Events: Redis
- Payments: Stripe (43 products)
- AI: Anthropic Claude + OpenAI
- Files: Supabase Storage

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Build all files now. Follow the architecture doc exactly.
Every claw worker must call assertWritable() before any Prisma write.
Every event must use createEvent() with proper trigger chain.
Every claw must enforce its guardrails — no exceptions.
```

## PROMPT — END

---

## Notes

- **This is ONE prompt.** Paste the entire block between START and END into Claude Code.
- Claude Code may need to process this in chunks — that's fine, it will continue where it left off.
- If Cursor has a character limit, split at the `━━━` phase dividers. Run Phase 0 first, then 0B, then 1-6, then 7-9.
- After running, verify:
  1. `packages/events/src/` exists with all files
  2. `packages/queue/src/` exists with all files
  3. `packages/ai/src/` exists with all files
  4. `services/command-center/claws/` has 8 directories each with index.ts + workers/ + routes/
  5. `.cursorrules` exists at repo root
- Run `npx prisma migrate dev --name add_claw_models` after Phase 8

---

*© 2026 Kealee Construction LLC. All rights reserved.*
