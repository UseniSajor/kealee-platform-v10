# Storage Architecture Audit — Kealee Platform V20

**Date**: 2026-04-22
**Audit Status**: COMPLETE
**Mode**: PATCH MODE (Extend, don't rebuild)

---

## Executive Summary

The storage architecture has **partial implementation**:

✅ **Complete**:
- Supabase Storage client (`packages/storage/src/storage.ts`)
- File upload models (Postgres: `FileUpload`, `File`)
- Document models (Postgres: `Document`, `DocumentTemplate`)
- Seed/reference data infrastructure (`packages/seeds/`)
- Public intake routes (Concept, Estimation, Permits)

❌ **Missing**:
- **Concept intake persistence**: Data in Redis only, no Postgres model
- **Estimation intake persistence**: Data in Redis only, no Postgres model
- **Permit intake persistence**: `PermitServiceLead` exists, but no file storage integration
- **Bot output persistence**: No models for recording bot runs/outputs
- **File upload integration**: Storage client created but not wired to intakes

---

## PART 1: CURRENT STATE AUDIT

### 1.1 Storage Backends

#### Postgres ✅
- **Role**: Canonical source of truth
- **Status**: Configured and active
- **Usage**: Metadata, references, structured data
- **Connection**: Railway managed (`postgresql://...ballast.proxy.rlwy.net...`)

#### Redis ✅
- **Role**: Temporary cache & queue backend (BullMQ)
- **Status**: Configured and active
- **Usage**: Intake forms (7-day TTL), BullMQ jobs
- **Connection**: Railway managed

#### Supabase Storage (S3-compatible) ⚠️
- **Role**: Object storage for files
- **Status**: Client created, NOT fully wired
- **Buckets**:
  - `site-photos` (construction site images)
  - `receipts` (expense receipts)
  - `documents` (contracts, reports, SOWs)
  - `profiles` (avatars, logos)
  - `permits` (permit docs)
  - `designs` (architectural drawings)
- **Current Usage**: Image processing utilities exist but not integrated into intake flows

---

### 1.2 Intake Flow Analysis

#### ConceptIntake (Concept Pre-Design)
```
Frontend Form
    ↓
POST /public/pre-design/intake
    ↓
Redis (intakeId_concept:...) — 7-day TTL
    ↓
POST /public/pre-design/checkout (Stripe)
    ↓
❌ NOT persisted to Postgres (MISSING)
    ↓
❌ No file references stored (MISSING)
    ↓
Concept engine queue → ProjectConceptPreDesign (after generation)
```

**Current Postgres Models**:
- `ProjectConceptPreDesign` (output only, links to intakeId but no actual PublicIntakeLead)
- No intake lead model exists

**Missing**:
- Concept service lead/intake model
- File storage wiring

#### EstimationIntake (Cost Estimation)
```
Frontend Form
    ↓
POST /public/estimation/intake
    ↓
Redis (estimation_intake:...) — 7-day TTL
    ↓
POST /public/estimation/checkout (Stripe)
    ↓
❌ NOT persisted to Postgres (MISSING)
    ↓
❌ No file references stored (MISSING)
    ↓
Estimation engine queue → CostDatabase/Estimate (after generation)
```

**Current Postgres Models**:
- `CostDatabase`, `MaterialCost`, `LaborRate`, `EquipmentRate`, `Assembly`, `Estimate` (output models only)
- No intake lead model exists

**Missing**:
- Estimation service lead/intake model
- File storage wiring

#### PermitIntake (Permit Services)
```
Frontend Form
    ↓
POST /api/v1/permits/intake
    ↓
Redis + Postgres (PermitServiceLead) — ✅ partially persisted
    ↓
POST /api/v1/permits/checkout (Stripe)
    ↓
PermitServiceLead marked PAID
    ↓
❌ No file references stored (MISSING)
    ↓
Permit intake processing → Permit application
```

**Current Postgres Models**:
- `PermitServiceLead` ✅ (contact + lead metadata)
- `PermitServiceLeadNote` ✅
- `PermitServiceLeadActivity` ✅
- Missing: Files linked to PermitServiceLead

**Missing**:
- File storage integration
- Document uploads for permits

---

### 1.3 File Storage Analysis

#### Files Stored in Postgres
- **FileUpload** model: Tracks file metadata (name, size, mimetype, URL)
  - Links to: `projectId`, `leadId`, `milestoneId`
  - AI analysis results (photos), OCR results (receipts)
  - ✅ Proper design

- **File** model: Generic S3/R2 tracking
  - Status tracking (UPLOADING → COMPLETED)
  - ✅ Proper design

- **Document** model: Generated documents
  - fileUrl (S3 reference)
  - Signature/approval tracking
  - ✅ Proper design

#### Files Stored in Supabase/S3
- ✅ Site photos (via storage.ts)
- ✅ Receipts (via storage.ts)
- ✅ Documents (via storage.ts)
- ✅ Profiles (avatars, logos)
- ✅ Permits (bucket exists)
- ✅ Designs (bucket exists)

**Issue**: Storage client exists but NOT called from intake flows

---

### 1.4 Seed/Reference Data Analysis

#### Location: `packages/seeds/src/`

| Seed Type | File | Status | Storage |
|-----------|------|--------|---------|
| Jurisdictions (DMV) | `jurisdictions/dmv.jurisdictions.seed.ts` | ✅ | Postgres → retrieved at runtime |
| Intent Templates | `intent/intent.seed.ts` | ✅ | Postgres → used in agent context |
| Rules (Risk/Approval) | `rules/risk-approval-rules.seed.ts` | ✅ | Postgres → gate decisions |
| Service Catalog | `services/service-catalog.seed.ts` | ✅ | Postgres → service offerings |
| Tool Registry | `tools/tool-registry.seed.ts` | ✅ | Agent registry → no DB |
| Workflow Templates | `workflows/workflow-templates.seed.ts` | ✅ | Postgres → workflow definitions |
| Roles & Permissions | `roles/roles-permissions.seed.ts` | ✅ | Postgres → auth/RBAC |
| Prompts & Policies | `prompts/prompts-policies.seed.ts` | ✅ | In-memory registry → no DB |

**Assessment**:
- ✅ Structured data in Postgres (canonical source)
- ✅ In-memory lookup for agent use
- ❌ Long-form text (e.g., jurisdictional requirements, policy rationale) NOT indexed
- ❌ No separate retrieval model for RAG/search

---

### 1.5 Bot Output Persistence

**Current State**: ❌ NO MODELS

Where bot outputs currently go:
1. **In-memory**: Worker processors store results in memory
2. **Redis**: Some outputs cached via BullMQ
3. **Postgres**: Final results written to domain models (e.g., `ProjectConceptPreDesign.conceptSummary` as JSON)
4. **S3**: Generated files (PDFs, images)

**Missing**:
- `BotRun` model (tracks which bot ran, when, inputs, outputs)
- `BotOutput` model (structured recording of bot outputs)
- Execution context logging for agents
- Input → output traceability for audit

---

### 1.6 Current Payment Recording

✅ **Existing**:
- `ProjectConceptPreDesign.stripeSessionId`, `.stripePaymentId`, `.pricePaidCents`
- `PermitServiceLead` (PAID status)
- Payment webhook handling in Stripe routes

❌ **Missing**:
- Unified payment record model
- Link between intake lead and payment
- Payment refund tracking

---

## PART 2: ARCHITECTURE GAPS

### Gap 1: Concept Intake Persistence (HIGH PRIORITY)
```
Requirements:
- Create ConceptServiceLead model in Postgres
- Link to ProjectConceptPreDesign
- Store payment info
- Track file uploads

Tables needed:
- concept_service_leads (intakes)
- concept_service_lead_files (uploaded files from user)
- concept_service_lead_notes (internal notes)
- concept_service_lead_activities (status changes)
```

### Gap 2: Estimation Intake Persistence (HIGH PRIORITY)
```
Requirements:
- Create EstimationServiceLead model
- Link to Estimate/CostDatabase
- Store payment info
- Track uploaded design documents

Tables needed:
- estimation_service_leads (intakes)
- estimation_service_lead_files (uploaded files)
- estimation_service_lead_notes (internal notes)
```

### Gap 3: Permit File Storage Integration (HIGH PRIORITY)
```
Requirements:
- Link FileUpload to PermitServiceLead
- Wire Supabase upload to permit forms
- Track permit documents (architectural drawings, estimates, etc.)

Changes needed:
- Add permitServiceLeadId foreign key to FileUpload
- Create permits-specific upload routes
```

### Gap 4: Bot Output Persistence (MEDIUM PRIORITY)
```
Requirements:
- Track which bot ran (agent name, version)
- Store input context (what was submitted)
- Store output results (full JSON)
- Track execution time, cost
- Link to source (intake, project, user)

Tables needed:
- bot_runs (execution log)
- bot_run_inputs (JSON input snapshot)
- bot_run_outputs (JSON output snapshot)
- bot_run_errors (error tracking)
```

### Gap 5: Seed Data Retrieval Index (MEDIUM PRIORITY)
```
Requirements:
- Index long-form policy/jurisdiction text
- Enable RAG search for agent context
- Don't claim seed data trains LLM (it's runtime context only)

Changes needed:
- Add full-text search columns to jurisdiction/policy tables
- Create seed-search module for agent retrieval
- Document that seeds are reference data, not training data
```

---

## PART 3: RECOMMENDED PATCHES

### Phase 1: Core Intake Persistence (2 models, 1 migration)
1. ✅ `ConceptServiceLead` Prisma model + domain schema
2. ✅ `EstimationServiceLead` Prisma model + domain schema
3. ✅ Migration to create tables
4. ✅ Update public intake routes to persist after payment

### Phase 2: File Storage Integration (3 route updates)
1. ✅ Wire Supabase upload to concept intake
2. ✅ Wire Supabase upload to estimation intake
3. ✅ Wire Supabase upload to permit intake
4. ✅ Add file associations to intake leads

### Phase 3: Bot Output Persistence (4 models, 1 migration)
1. ✅ `BotRun`, `BotRunInput`, `BotRunOutput`, `BotRunError` models
2. ✅ Migration to create tables
3. ✅ Wire worker processors to log outputs
4. ✅ Add query utils for traceability

### Phase 4: Seed Data Search (1 model, 1 index)
1. ✅ Add full-text search to jurisdiction/policy tables
2. ✅ Create seed-search utility module
3. ✅ Wire to agent context retrieval

---

## Files to Create/Modify

### Create (Schema)
- `packages/database/schema-src/marketplace/concept-leads.prisma` (ConceptServiceLead + relations)
- `packages/database/schema-src/marketplace/estimation-leads.prisma` (EstimationServiceLead + relations)
- `packages/database/schema-src/foundation/bot-execution.prisma` (BotRun + outputs)

### Modify (Routes)
- `services/api/src/modules/concept/public-concept-intake.routes.ts` (persist to Postgres + files)
- `services/api/src/modules/estimation/public-estimation-intake.routes.ts` (persist to Postgres + files)
- `services/api/src/modules/permits/permit-intake.routes.ts` (wire file uploads)

### Modify (Schema)
- `packages/database/schema-src/documents/models.prisma` (add permitServiceLeadId to FileUpload)
- `packages/database/schema-src/marketplace/models.prisma` (add file/note/activity relations)

### Modify (Worker)
- `services/worker/src/index.ts` (add bot output logging)
- All processors in `services/worker/src/processors/` (wire to BotRun table)

### Create (Utilities)
- `packages/seeds/src/search/seed-search.ts` (full-text retrieval)
- `services/api/src/lib/bot-execution.ts` (logging helpers)

---

## Current Architecture Summary

| Component | Status | Details |
|-----------|--------|---------|
| **Postgres** | ✅ | Canonical source, 364 models, properly indexed |
| **Redis** | ✅ | Cache + BullMQ backend, intake temp storage |
| **Supabase Storage** | ⚠️ | Client ready, buckets ready, NOT wired to intakes |
| **Concept Intake** | ❌ | Redis only, no Postgres persistence |
| **Estimation Intake** | ❌ | Redis only, no Postgres persistence |
| **Permit Intake** | ⚠️ | PermitServiceLead exists, missing file integration |
| **File Models** | ✅ | FileUpload, File, Document all present |
| **Bot Outputs** | ❌ | Logged to Postgres domain models only, no traceability |
| **Seed Data** | ✅ | Stored in Postgres, accessed via registries |
| **Seed Search** | ❌ | No full-text index for RAG retrieval |

---

## Implementation Strategy (PATCH MODE)

1. **Reuse existing**:
   - ✅ Use Supabase storage client (`packages/storage/src/storage.ts`)
   - ✅ Extend FileUpload model (add FK columns, don't rebuild)
   - ✅ Use existing domain schema structure
   - ✅ Leverage seed infrastructure

2. **Extend without rebuilding**:
   - ✅ Add ConceptServiceLead + EstimationServiceLead to marketplace domain
   - ✅ Add BotRun + outputs to foundation domain
   - ✅ Don't refactor existing models

3. **Wire up missing pieces**:
   - ✅ Update intake routes to call Supabase storage
   - ✅ Persist intake data to Postgres after payment
   - ✅ Log bot runs to database

4. **Document non-training**:
   - ✅ Clarify that seed data is reference context, not training data
   - ✅ Add comments to seed models

---

## Next Steps

**Immediate**: Implement Phase 1 (Intake Persistence) — 2-4 hours
**Then**: Implement Phase 2 (File Integration) — 2-3 hours
**Then**: Implement Phase 3 (Bot Outputs) — 3-4 hours
**Then**: Implement Phase 4 (Seed Search) — 2 hours

**Total estimated time**: 10-15 hours (spreads across multiple sessions)

---

**Audit Complete** ✅
**Ready for implementation in PATCH MODE**
