# AI Voice, Sales, Support, and Site-Plan Architecture

Status: Phase 1 architecture baseline  
Date: 2026-07-21

## Decisions

### Runtime ownership

Canonical Kealee agents own business decisions. Twilio, email, web chat, CAD, GIS, and permit portals are adapters and never agents. Long-running sales, support, and site-plan processes use the existing workflow records and worker service; tools remain registered through `@kealee/core-tools`.

The v30 bot registry is a specialist execution surface. Production callers must supply a real executor and fail closed if one is unavailable; the existing dry-run completion behavior is test/development-only.

### Events and jobs

`@kealee/core-events` is the canonical integration event bus because the API already uses it and it provides Redis Streams, consumer groups, dead-letter handling, and sagas. `@kealee/events` remains for backward compatibility but receives no new program events. Database workflow events are the durable domain audit/state history; Redis events notify downstream consumers. A transactional outbox is required for consequential state changes so database commits and event publication cannot diverge.

BullMQ in `services/worker` owns delayed/retried work: outbound contact, callbacks, sequence touchpoints, transcript post-processing, document extraction, compliance runs, SLA timers, and provider retries. Jobs use stable idempotency keys and dead-letter monitoring.

### Data ownership

| Domain | Authority |
|---|---|
| Contact, lead, opportunity | Existing CRM/contact/lead records; adapters resolve rather than copy. |
| Consent and suppression | Existing marketing consent/suppression data, extended to purpose, channel, source, timestamp, jurisdiction, and recording consent. |
| Project/property status | Existing Project, Property/Parcel, Permit, professional assignment, document, and Digital Twin relationships. |
| Communication | New session/transcript/summary records linked to existing customer, lead, project, and provider IDs. |
| Workflow | Existing workflow stage/work-item/event pattern, extended with typed definitions and stage payload schemas. |
| Jurisdiction facts | Immutable rule versions and sources; derived check results reference the exact version and inputs. |
| Site-plan geometry | Structured, versioned geometry/calculation records; documents are rendered artifacts, not the source of truth. |
| Sealed work | Immutable document version plus professional decision and seal record controlled by the licensed professional. |

### Provider boundaries

`CommunicationsProvider` exposes inbound session creation, outbound call, SMS/WhatsApp, transfer, callback, termination, status events, and signature verification. Twilio is the first implementation. Business logic consumes normalized events and never imports the Twilio SDK directly.

`PropertySourceProvider` returns observations with source URL/identifier, retrieval time, effective date when known, official/legal status, confidence, geometry CRS, and warnings.

`CadProvider` accepts validated structured geometry and emits supported interchange artifacts. The existing `packages/concept-engine/src/autocad-engine` geometry kernel, constraints, DXF writer, converter, and orchestrators are the primary implementation foundation. They must be extended for civil/site layers, CRS/units, survey provenance, grading/drainage, GeoJSON/vector PDF, quantities, and revisions. Optional Autodesk Platform Services or ODA adapters may provide DWG conversion/automation; no provider may apply a professional seal.

`PermitSubmissionProvider` supports capability discovery. When automation is unavailable or unauthorized, the same workflow emits a staff instruction packet and evidence-upload task instead of simulating submission.

### Authorization and tool contract

Every new tool must have:

- Zod input/output schemas and stable typed error codes;
- tenant, actor, role, project, and purpose authorization before data access;
- an idempotency key for writes or explicit non-idempotent designation;
- audit actor, correlation/trace, source, and before/after metadata;
- transactional state mutation plus outbox event for consequential writes;
- source/confidence metadata for property, jurisdiction, extraction, and calculated results;
- redacted logs and testable provider fakes.

### Workflow state machines

Sales uses guarded states: `NEW`, `IDENTIFYING`, `QUALIFYING`, `PROPERTY_RESEARCH`, `RECOMMENDING`, `AWAITING_DOCUMENTS`, `AWAITING_CHECKOUT`, `AWAITING_CONSULTATION`, `CONVERTED`, `NURTURE`, `HUMAN_TAKEOVER`, `DISQUALIFIED`, `OPTED_OUT`, `CLOSED`. Conversion, opt-out, suppression, invalid contact, disqualification, and human takeover stop automated sales delivery.

Support uses `OPEN`, `AUTHENTICATING`, `INVESTIGATING`, `WAITING_CUSTOMER`, `WAITING_STAFF`, `ESCALATED`, `RESOLVED`, `CLOSED`. Resolution requires an explicit criterion; message delivery alone cannot close a case.

Site-plan stages are `PARCEL_RESOLUTION`, `DOCUMENT_COLLECTION`, `FEASIBILITY`, `PLAN_GENERATION`, `COMPLIANCE_AUDIT`, `PROFESSIONAL_REVIEW`, and `SUBMISSION_CORRECTIONS`. Each stage stores prerequisites, assigned party, typed inputs/outputs, status, attempts, blockers, review decision, and audit history. Transitions use optimistic concurrency and idempotency. Regulated release requires a valid professional approval and immutable sealed version.

### Confidence and truth policy

Authoritative project status is read from typed records, never model memory. High-confidence verified data can be answered automatically. Medium confidence is qualified and creates verification work. Low confidence, legal interpretation, boundary determination, or regulated professional judgment requires human/professional confirmation.

Field values distinguish `ESTIMATED`, `EXTRACTED`, `GIS_SCREENED`, `OFFICIAL`, `SURVEYED`, `VERIFIED`, and `PROFESSIONALLY_CERTIFIED`. GIS geometry is never labeled a boundary survey. No AI output guarantees approval or represents a signature/seal.

## Feature flags

The shared configuration package will validate these server-side flags:

- `AI_VOICE_ENABLED`
- `AI_OUTBOUND_CALLING_ENABLED`
- `AI_SMS_ENABLED`
- `CONVERSATION_INTELLIGENCE_ENABLED`
- `SITE_PLAN_AUTOMATION_ENABLED`
- `PROFESSIONAL_REVIEW_REQUIRED`
- `PERMIT_SUBMISSION_AUTOMATION_ENABLED`
- `PG_COUNTY_RULE_PACK_ENABLED`

Defaults are off for external/consequential automation and on for professional review. A disabled dependency fails closed with a typed unavailable result; it never silently reports success.

Voice configuration includes `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_VOICE_NUMBER`, `TWILIO_MESSAGING_NUMBER`, `TWILIO_CONVERSATION_RELAY_URL`, `TWILIO_STATUS_CALLBACK_URL`, `TWILIO_RECORDING_ENABLED`, optional Conversation Intelligence service SID, and `VOICE_HUMAN_TRANSFER_NUMBER`. Required variables become mandatory only when their feature is enabled.

## Engineering-module routing

`apps/m-engineer` is reused for engineering service discovery and professional workflow UI. It is not currently a calculation module. Phases 4–5 use existing project/status services for customer support and `core-rules`/`compliance`/`spatial-engine` for deterministic jurisdiction analysis. If the intended `os-engineering` code is supplied later, adoption requires compatible typed inputs, deterministic/versioned outputs, source provenance, authorization, audit emission, tests, and no autonomous regulated approval.

## Deployment topology

Railway serves the frontend and backend in the current production direction; Vercel is not assumed active. HTTP/Twilio callbacks terminate at the API service. ConversationRelay uses an authenticated low-latency WebSocket endpoint. Workers consume durable queues/events. PostgreSQL stores authority and audits; Redis is transport/coordination, not the system of record.

Railway deployment is intentionally deferred while the account has an unpaid/trial-expired billing state. Code may be built, tested, and committed locally; it must not be represented as deployed until Railway accepts and health checks verify a deployment.

## Verification gates

Each phase requires focused unit and integration tests, schema migration validation, lint/typecheck/build for affected workspaces, provider sandbox/contract tests, and an update to the final verification report. Live calling, recording, payments, professional release, and permit submission remain disabled until credentials, consent policy, operational ownership, and production health checks are verified.
