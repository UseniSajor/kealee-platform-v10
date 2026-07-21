# AI Voice, Sales, Support, and Site-Plan Repository Audit

Status: Phase 1 baseline  
Date: 2026-07-21  
Scope: Kealee Platform only; Kealee Construction is out of scope.

## Executive decision

Kealee already has most of the platform primitives required by this program. The implementation must extend the canonical agents, project/Digital Twin records, tool registry, workflow/event infrastructure, communications package, marketplace professional assignment, payments, documents, compliance rules, spatial engine, and observability. It must not introduce a second CRM, event bus, workflow engine, customer record, or a set of duplicate Voice/Sales/Support/SitePlan agents.

The platform can evolve into a vertical construction ERP: it already spans leads, customers, property intelligence, project delivery, permits, professionals, documents, payments, and operations. The missing ERP-grade layer is a single authoritative lifecycle with durable state transitions, accounting-quality controls, jurisdiction/professional governance, and production integrations.

There is no package or directory literally named `os-engineering` in this checkout. `apps/m-engineer` is a professional-services marketplace/UI surface, not an engineering calculation engine. It should be reused for customer and professional experiences. Deterministic civil/site calculations should extend `packages/spatial-engine`, `packages/core-rules`, and `packages/compliance` unless the separate `os-engineering` source is later added to the workspace.

## Audit method

The repository was searched across `apps`, `packages`, `services`, `bots`, Prisma schema sources, migrations, prompts, APIs, workers, queues, workflows, and documentation for voice/telephony, Twilio, messaging, CRM, leads, sales sequences, support, property/GIS, zoning, surveys, site plans, grading, stormwater, sediment control, permits, CAD, professional review/seals, documents, payments, and observability.

This document records code that exists in the checkout. A module's presence is not evidence that it is deployed, configured, externally certified, or safe for regulated production use.

## Canonical ownership

| Responsibility | Canonical owner | Implementation direction |
|---|---|---|
| Inbound channel intake and identity/property resolution | IntakeAgent / IntakeBot | Add voice channel tools and guarded identity resolution; do not add VoiceAgent. |
| Sales orchestration, recommendation, pricing, next action | CommandAgent or OwnerAgent, using catalog and specialist tools | Implement a durable sales state machine; do not rely on one prompt or create SalesAgent. The v30 `sales` bot becomes a specialist/tool-backed execution path. |
| Parcel, zoning, GIS, environmental constraints | LandAgent plus spatial engine | Extend with source/effective-date/confidence metadata and official-source adapters. |
| Buildable envelope and deterministic feasibility | FeasibilityAgent plus spatial/rules services | LLM explains results; deterministic services remain authoritative. |
| Jurisdiction and permit compliance | PermitAgent plus core rules/compliance | Add versioned jurisdiction rule packs and professional-determination outcomes. |
| Quotes and product matching | EstimateAgent plus existing product catalog | Preserve catalog-driven prices and separate third-party/professional/government fees. |
| Checkout, deposits, invoices, secure links | PaymentsAgent and existing payment integrations | Never accept raw card data through voice or model context. |
| Professional routing and regulated review | MarketplaceAgent and `m-engineer`/marketplace surfaces | Extend licenses, conflicts, redlines, approvals, seal custody, and version locking. |
| CRM pipeline, sequences, SLA, escalation | OperationsAgent and existing marketing/worker infrastructure | Reuse contacts, leads, sequences, suppression, queues, and scheduler. |
| Authenticated project status and customer support | OwnerAgent / SupportBot backed only by authoritative project tools | No invented statuses or dates; create cases/tasks for uncertainty. |
| Site-plan workflow orchestration | Existing workflow engine plus Land, Feasibility, Permit, Marketplace, Operations agents | A workflow is not a new agent. Implement seven resumable stages and gates. |

## Reuse matrix

| Capability | Existing module/evidence | Reuse as-is | Extension required | Missing/proposed implementation |
|---|---|---:|---:|---|
| Agent runtime, planning, execution, memory | `packages/core-agents` | Partial | Yes | Add scoped tools/policies; retain canonical agent identities. |
| Tool registration and input validation | `packages/core-tools/src/registry.ts` | Partial | Yes | Standard authorization hooks, typed errors, idempotency enforcement, events, audits, provenance. |
| v30 bot registry/orchestration | `packages/kealee-agent-stack/src/v30/bots.ts`, `orchestrator.ts` | Partial | Yes | Replace dry-run fallback in production paths; reconcile specialist bots with canonical agents. |
| Workflow checks/gates | `packages/workflow-engine`; Prisma `WorkflowStage`, `WorkItem`, `WorkflowEvent` | Partial | Yes | Site-plan and sales state definitions, transition guards, leases, retries, stage outputs, review gates. |
| Event infrastructure | `packages/events`, `packages/core-events` | No, pending consolidation decision | Yes | Select the deployed canonical bus; add event contracts without creating a third event system. |
| SMS and WhatsApp transport | `packages/communications/src/sms.ts` | Partial | Yes | Consent, quiet hours, suppression, status callbacks, inbound messages, retries, redaction, unified history. |
| Twilio voice | No inbound/outbound voice or ConversationRelay implementation found | No | — | Provider abstraction, signed webhooks/WebSocket sessions, calls, callbacks, warm transfer, AMD, recording policy. |
| Conversation transcripts/summaries | `CommunicationLog` and message records provide a base | No | Yes | Encrypted transcript/session models, summaries, retention, RBAC, PII/payment redaction. |
| Lead/contact/CRM data | Existing `Lead` and service-specific lead/contact records; marketing contact/sequence schema | Partial | Yes | Establish authoritative mappings/dedupe and avoid another CRM. |
| Automated marketing sequences | Existing marketing sequence/enrollment/message-attempt/suppression/consent/attribution tables and worker scheduler | Partial | Yes | Product/jurisdiction templates, voice steps, conversion stop rules, pause/takeover, analytics. |
| Apollo import | Automated import worker, persisted cursor/lease, audience hash, caps, suppression, monitoring | Yes after deployment | Operational only | Deployment is blocked by Railway's unpaid/trial-expired account state. |
| Customer support | v30 SupportBot, project records, messages, notification services | Partial | Yes | Authoritative status tool, cases, SLA/escalation, confidence policy, staff approval, CSAT. |
| Digital Twin | Prisma `PropertyTwin`, `LeadTwin`, `ProjectTwin`, `CapitalTwin`, `DigitalTwin` | Partial | Yes | Store links and derived observations with source/confidence; do not duplicate authoritative status. |
| Parcel/GIS | `packages/spatial-engine`, v30 `lot-gis.ts`, existing property/parcel/zoning models | Partial | Yes | Official adapters, source versioning, legal-status labels, environmental layers, outage behavior. |
| Rules/compliance | `packages/core-rules`, `packages/compliance`, compliance models | Partial | Yes | Versioned jurisdiction schema, six-result vocabulary, source/effective dates, blocking semantics. |
| Prince George's County package | Scattered DMV endpoints and permit/zoning content | No | Yes | Official-source verified rule pack and scenario fixtures; never treat GIS as surveyed boundary. |
| Concept DXF | `packages/kealee-agent-stack/src/v30/cad-export.ts` | Yes for concept output only | Yes | Add units/CRS/layers/entities/validation; retain explicit non-survey/non-permit disclaimer. |
| CAD geometry and export foundation | `packages/concept-engine/src/autocad-engine` has a geometry kernel, constraint solver, DXF writer, converter, 3D/MEP/export pipeline, orchestrators, and tests | Partial | Yes | Reuse as the primary geometry foundation; add civil/site layers, CRS/units, survey provenance, grading/drainage calculations, vector PDF, quantities, and revision lineage. |
| DWG interoperability | No supported DWG SDK/service found | No | — | Optional Autodesk Platform Services or ODA adapter for DWG fidelity/conversion; keep provider abstraction. |
| Survey/document extraction | Core documents and storage exist | Partial | Yes | OCR/vector extraction, bearings/distances/contours/seals metadata, confidence and professional verification queue. |
| Professional assignment | Existing `ProfessionalAssignment` and marketplace rotation/license/insurance fields | Partial | Yes | Jurisdiction licenses, conflicts, scope/fee, redlines, decisions, seal records, chain of custody, expiry. |
| Permit lifecycle | Permit/submission/correction/event/activity models and permit app | Partial | Yes | Package assembly, validations, staff-assisted submission, comment classification, reapproval, resubmission. |
| Payments | Existing PaymentsAgent/payment integrations | Partial | Yes | Productized site-plan checkout/deposits and separately itemized third-party/government fees. |
| Documents | `packages/core-documents`, `Document`, `GeneratedDocument` | Partial | Yes | Immutable sealed versions, lineage, access policy, retention, permit package manifests. |
| Worker/queues | `services/worker` with BullMQ, queues, cron, health | Partial | Yes | Durable voice callbacks, sequences, document processing, compliance runs, SLA timers, retries/DLQ. |
| Observability/audit | `packages/observability`, `packages/audit`, agent observability | Partial | Yes | Voice latency, workflow duration, confidence, overrides, compliance failures, professional and permit metrics. |
| Customer/staff/professional UI | Owner portals, Command Center, marketplace/`m-engineer` apps | Partial | Yes | Extend existing surfaces; do not create standalone duplicate portals. |

## Material gaps and risks

1. The v30 orchestrator defaults to successful dry-run stubs when no executor is provided. Production workflow code must fail closed when its live executor is absent.
2. `packages/communications/src/sms.ts` defaults to Twilio's test number when a sender is absent. Production validation must reject missing sender configuration rather than silently using a test value.
3. The v30 DXF exporter creates minimal concept-only R12 linework. The more capable concept-engine AutoCAD pipeline is the preferred foundation, but its current floor-plan/MEP focus is not evidence of survey-grade civil calculations or permit readiness.
4. Nominatim/Google imagery resolution in `lot-gis.ts` does not establish boundaries or official jurisdiction facts. Official parcel, record plat, survey, and agency sources must retain provenance and legal status.
5. The repository contains both `packages/events` and `packages/core-events`, and several overlapping agent/bot generations. Deployment entrypoints must be traced before consolidation; destructive consolidation is out of scope without compatibility tests.
6. Existing professional assignment data does not implement complete multi-jurisdiction license verification, seal custody, or immutable sealed document release.
7. Existing permit and compliance data provides a base but is not evidence of a current, source-versioned Prince George's County package.
8. Railway deployment is externally blocked by the account billing state. No code change can make the pending Apollo deployment live until billing is restored.

## Data strategy

Extend existing Prisma schema sources and Supabase marketing schema rather than duplicating records:

- Project/property/permit/professional/site-plan authority remains in the existing project database and Digital Twin relationships.
- Marketing sequences, consents, suppressions, attempts, attribution, and import cursors remain in the existing marketing schema.
- New communication sessions reference existing contacts/users/leads/projects and retain provider identifiers, consent evidence, redacted transcript data, retention policy, and audit metadata.
- New site-plan workflow records reference the existing project, property/parcel, documents, permits, professional assignments, and workflow events.
- Jurisdiction rules are immutable/versioned records with source authority, effective and verification dates, supersession, confidence, and human-review requirements.
- Derived facts never overwrite surveyed, recorded, agency-verified, or professionally certified facts without an explicit verified transition and audit record.

Schema changes must be introduced through repository schema sources and reviewable migrations. Existing uncommitted schema work in this checkout is treated as user-owned and will not be swept into this program's commits.

## CAD/engineering decision

An AutoCAD license or API is not mandatory for the first production increment. Kealee does need a deterministic vector/geometry service. The preferred boundary is:

1. Kealee owns structured geometry, units/coordinate reference systems, calculations, rule results, revisions, provenance, and DXF/GeoJSON/vector-PDF generation.
2. `m-engineer` and MarketplaceAgent own professional engagement and review experiences.
3. A licensed professional controls regulated judgments and final signed/sealed releases.
4. A replaceable CAD provider adapter may use Autodesk Platform Services or ODA when native DWG translation, Autodesk cloud automation, or professional redlining interoperability is required.
5. Raster/image generation is never authoritative plan geometry.

## Security and release constraints

- Verify every Twilio HTTP and WebSocket request using the provider's current signing requirements.
- Keep provider credentials server-side; validate required production configuration at startup.
- Enforce tenant/project authorization before lookup, transcript, document, payment, professional, or permit actions.
- Store channel consent, source, timestamp, permitted purpose, quiet hours, recording disclosure, and do-not-contact state.
- Redact card data and sensitive personal data before model context, logs, transcripts, and analytics.
- No permit guarantee, official zoning claim, survey representation, professional approval, signature, or seal may be generated by AI.
- Consequential submission and release actions require human/professional approval unless an explicit authorized policy exists.

## Phase routing

- Phase 2 extends communications, core tools, IntakeAgent, worker queues, audit, and observability for Twilio voice.
- Phase 3 extends canonical sales ownership and existing marketing sequences; the v30 SalesBot remains a specialist execution path, not a second CRM owner.
- Phase 4 extends Owner/Support/Operations paths for authoritative customer service and SLA cases. The `m-engineer` surface is reused where engineering-professional status is presented.
- Phase 5 extends core rules/compliance/spatial services for versioned jurisdiction packs. If a separate `os-engineering` module is supplied, it will be assessed against these contracts before adoption.
- Phases 6–7 add the seven-stage workflow, deterministic geometry, professional control, and permit correction loop.
- Phase 8 extends existing customer, Command Center, and professional/marketplace surfaces and verifies the full flow.

## Phase 1 exit criteria

Before Phase 2 implementation begins, the architecture record must settle the canonical event bus/deployment path, database ownership for each new record, provider interfaces, authorization/audit contract, workflow transition model, and feature-flag behavior. Current official Twilio and jurisdiction sources must be captured during their implementation phases, with verification dates and tests; old repository prose is not sufficient authority.
