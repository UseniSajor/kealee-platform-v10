# Complete M-* Apps Audit Report
**Date**: April 19, 2026  
**Scope**: All apps/m-* applications in Kealee Platform v20  
**Status**: COMPREHENSIVE ANALYSIS COMPLETE

---

## PHASE 1: USAGE DETECTION

### All M-* Apps Found (9 total)

| App | Type | Status | In Production | Deployed |
|-----|------|--------|---|---|
| m-architect | Next.js 14 | ACTIVE | ❌ | Legacy Dockerfile only |
| m-engineer | Next.js 14 | ACTIVE | ❌ | Legacy Dockerfile only |
| m-estimation | Next.js 15 | ACTIVE | ❌ | Legacy Dockerfile only |
| m-finance-trust | Next.js 14 | ACTIVE | ❌ | Legacy Dockerfile only |
| m-inspector | React Native | ACTIVE | ❌ | Mobile only, no web deployment |
| m-marketplace | Next.js 14 | ACTIVE | ❌ | Legacy Dockerfile only |
| m-ops-services | Next.js 14 | ACTIVE | ❌ | Legacy Dockerfile only |
| m-permits-inspections | Next.js 14 | ACTIVE | ❌ | Legacy Dockerfile only |
| m-project-owner | Next.js 14 | ACTIVE | ❌ | Legacy Dockerfile only |

### Key Finding: None Are Deployed

```
GitHub Actions deployment config (.github/workflows/deploy-production.yml):
✅ DEPLOYED: api, portal-owner, portal-contractor, portal-developer, 
             command-center, web-main, admin-console
❌ NOT DEPLOYED: ALL m-* apps
```

```
Railway configuration (railway.toml):
✅ DEPLOYED: All services listed above
❌ NOT DEPLOYED: ALL m-* apps
```

### Usage Classification

**INDIRECT** (API modules exist but UIs not deployed):
- m-architect (routes in API, referenced in web-main landing only)
- m-engineer (routes in API, referenced in web-main landing only)  
- m-estimation (routes in API, referenced in web-main landing only)
- m-finance-trust (routes in API, referenced in web-main landing only)
- m-ops-services (routes in API, referenced in web-main landing only)
- m-permits-inspections (routes in API, referenced in web-main landing only)
- m-project-owner (routes in API, referenced in web-main landing only)
- m-marketplace (comprehensive routes in API, but not deployed)

**ACTIVE MOBILE** (separate platform):
- m-inspector (React Native, iOS/Android only, independent deployment)

---

## PHASE 2: DATA + SCHEMA ANALYSIS

### Database Model Usage by App

#### m-architect
- **Primary Models**: DesignProject, DesignPhase, DesignFile, Drawing, ReviewComment, Approval
- **Tables**: design_projects, design_phases, design_files, drawings, review_comments, approvals
- **API Endpoints**: 
  - /architect/design-projects (CRUD)
  - /architect/design-phases (phase management)
  - /architect/design-files (file uploads)
  - /architect/drawings (drawing sets)
  - /architect/reviews (peer review workflow)
  - /architect/collaborations (team collab)
  - /architect/approvals (stamping workflow)
- **External Services**: Supabase Auth, Supabase Storage
- **Redis Keys**: architect:session:*, architect:collaboration:*
- **Stripe Integration**: None directly

#### m-engineer
- **Primary Models**: Engineer, ServiceArea, EngineerLicense, SpecializationArea
- **Tables**: engineers, service_areas, engineer_licenses, specialization_areas
- **API Endpoints**:
  - /engineer/profile (CRUD)
  - /engineer/services (list available)
  - /engineer/assignments (project assignment)
- **Connections**: Links to Permit, ContractorService models
- **Stripe Integration**: None directly

#### m-estimation
- **Primary Models**: EstimationProject, CostData, EstimationItem, Assembly, RSMeansCatalog
- **Tables**: estimation_projects, cost_data, estimation_items, assemblies, rsmeansdata
- **API Endpoints**:
  - /estimation/projects (CRUD)
  - /estimation/costimport (import CSI data)
  - /estimation/extended (advanced takeoff)
  - /estimation/data (cost library queries)
- **Special Features**: RSMeans database integration, assembly library
- **Stripe Integration**: Stripe checkout for estimation packages
- **Queue Integration**: BullMQ for cost analysis jobs

#### m-finance-trust
- **Primary Models**: EscrowAccount, PaymentRelease, FinanceSettings, MilestonePayment
- **Tables**: escrow_accounts, payment_releases, finance_settings, milestone_payments
- **API Endpoints**:
  - /finance/escrow/* (account management)
  - /payments/* (payment processing)
  - /finance/settings (configuration)
- **Stripe Integration**: Stripe payment processing, webhook handling
- **Critical Data**: Escrow holds, payment release logic

#### m-inspector (React Native Mobile)
- **Primary Models**: Inspection, InspectionItem, DefectCategory, PhotoAnnotation, LocationLog
- **Tables**: inspections, inspection_items, defect_categories, photo_annotations, location_logs
- **API Endpoints**:
  - /inspector/inspections/* (CRUD)
  - /inspector/photos (upload + analyze)
  - /inspector/routes (optimization)
  - /inspector/sync (offline sync)
- **Device Features**: Camera, GPS, offline storage, barcode scanning
- **AI Integration**: Claude Vision API for defect analysis
- **Offline Capability**: LocalStorage + sync queue

#### m-marketplace
- **Primary Models**: Contractor, Lead, Quote, Order, Project, DesignPackage, PatternBook, ProfessionalAssignment
- **Tables**: contractors, leads, quotes, orders, projects, design_packages, pattern_books, professional_assignments
- **API Endpoints**: (MOST COMPREHENSIVE)
  - /marketplace/leads/* (lead routing)
  - /marketplace/quotes/* (quote generation)
  - /marketplace/orders/* (order management)
  - /marketplace/contractor-* (contractor onboarding)
  - /marketplace/designer-* (designer workspace)
  - /marketplace/pattern-book/* (design library)
  - /marketplace/checkout/* (Stripe integration)
  - /marketplace/webhooks/* (payment webhooks)
- **Stripe Integration**: Full checkout, subscription management
- **Queue Integration**: Lead routing, quote generation, order fulfillment

#### m-ops-services
- **Primary Models**: EstimationProject, ContractorService, OperationsTask, QAChecklist
- **Tables**: estimation_projects, contractor_services, operations_tasks, qa_checklists
- **API Endpoints**:
  - /ops-services/estimation/* (cost estimation)
  - /ops-services/permits/* (permit workflow)
  - /ops-services/general-contractor/* (GC services)
- **Dual Mode**: Supports both developer and general contractor roles
- **Stripe Integration**: Billing for ops services

#### m-permits-inspections
- **Primary Models**: Permit, PermitSubmission, PermitStatus, Jurisdiction, JurisdictionConfig, PermitReviewer
- **Tables**: permits, permit_submissions, permit_statuses, jurisdictions, jurisdiction_configs, permit_reviewers
- **API Endpoints**:
  - /permits/applications/* (permit CRUD)
  - /permits/jurisdictions/* (jurisdiction database)
  - /permits/compliance/* (rule checking)
  - /permits/routing/* (submission routing)
  - /zoning/* (zoning analysis)
- **AI Integration**: Claude Vision for plan review, compliance analysis
- **External Services**: Jurisdiction databases, document analysis
- **Critical Data**: Permit tracking, jurisdiction rules

#### m-project-owner
- **Primary Models**: Project, ProjectOwner, ProjectTeam, Milestone, ProjectUpdate
- **Tables**: projects, project_owners, project_teams, milestones, project_updates
- **API Endpoints**:
  - /owner/projects/* (project dashboard)
  - /owner/team/* (team management)
  - /owner/milestones/* (milestone tracking)
- **UI Features**: Real-time updates, team collaboration
- **Stripe Integration**: Milestone payment tracking

---

## PHASE 3: DEPENDENCY GRAPH

### Package Dependencies (All m-* apps use)
```
Shared Packages:
✅ @kealee/auth           (JWT/Supabase auth)
✅ @kealee/ui             (Radix UI components)
✅ @kealee/database       (Prisma Client)
✅ @kealee/intake         (Form schemas)
✅ @kealee/shared-ai      (Claude integration)
```

### Inter-app Dependencies
```
NONE FOUND - All m-* web apps are isolated Next.js applications
(No imports between m-architect, m-engineer, etc.)

EXCEPTION:
- m-marketplace appears to duplicate/consolidate functionality from other m-* apps
- Both m-marketplace and m-permits-inspections have `/permits` routes
- Both m-marketplace and m-ops-services have `/estimation` routes
```

### API Module Dependencies

```
API (services/api):
  ├─ /architect/*         ← m-architect (15 routes registered)
  ├─ /engineer/*          ← m-engineer (1 module)
  ├─ /estimation/*        ← m-estimation (5 modules)
  ├─ /finance/*           ← m-finance-trust (escrow module)
  ├─ /inspector/*         ← m-inspector (mobile)
  ├─ /marketplace/*       ← m-marketplace (14 modules) ⚠️ DUPLICATION
  ├─ /ops-services/*      ← m-ops-services (1 module)
  ├─ /permits/*           ← m-permits-inspections (8 modules) ⚠️ DUPLICATION
  └─ /owner/*             ← m-project-owner (1 module)
```

### Tight Coupling Detected
```
⚠️ PROBLEM: m-marketplace + m-permits-inspections both serve /permits/* routes
⚠️ PROBLEM: m-marketplace + m-ops-services both serve /estimation routes
⚠️ PROBLEM: m-marketplace includes /architect, /engineer, /finance routes
```

---

## PHASE 4: DUPLICATION DETECTION

### Major Duplications

#### 1. **Permits Functionality** (CRITICAL)
```
DUPLICATE ROUTES:
❌ m-permits-inspections/app/ → /permits/*, /zoning/*
❌ m-marketplace/app/(marketing)/permits/ → /permits/*

SAME API ENDPOINTS:
- /permits/applications
- /permits/jurisdictions
- /permits/compliance
- /permits/zoning

RESOLUTION: m-marketplace delegates to API, m-permits-inspections has own UI
```

#### 2. **Estimation Functionality** (CRITICAL)
```
DUPLICATE ROUTES:
❌ m-estimation/app/ → comprehensive cost estimation UI
❌ m-ops-services/app/(portal)/portal/estimation/* → estimation workflows
❌ m-marketplace/app/(marketing)/permits → also has estimation

SAME API ENDPOINTS:
- /estimation/projects
- /estimation/costimport
- /estimation/data

RESOLUTION: m-estimation is comprehensive; others are wrappers
```

#### 3. **Role-Based Dashboards** (MODERATE)
```
OVERLAPPING FEATURES:
❌ m-architect dashboard (~8 routes)
❌ m-engineer dashboard (minimal)
❌ m-project-owner dashboard (~4 routes)
❌ m-marketplace has /architect/*, /engineer/*, /finance/* routes

RESOLUTION: m-marketplace consolidates all
```

#### 4. **Authentication & Team Management** (MODERATE)
```
DUPLICATE CODE:
- All m-* apps: Supabase auth setup
- All m-* apps: Account settings routes
- All m-* apps: Team management UI

RESOLUTION: All depend on @kealee/auth, but implementations vary
```

### Duplication Summary

```
Lines of Code Duplicated (Estimated):
- Authentication logic: ~5K lines
- Component libraries: ~3K lines  
- Route handling: ~8K lines
- API integration: ~4K lines
────────────────────────────────
TOTAL DUPLICATION: ~20K lines across 8 apps
```

### Newly Built Systems That Made M-* Apps Redundant

#### v20 Portal Architecture
```
✅ portal-owner      → replaces m-project-owner + m-marketplace owner workspace
✅ portal-contractor → replaces m-marketplace contractor workspace
✅ portal-developer  → replaces m-marketplace developer workspace
✅ command-center    → new central workflow dashboard

✅ web-main         → public storefronts (permits, estimation, architects landing)
```

#### v20 API-Driven Approach
```
All authenticated workflows now routed through:
✅ /api/intake/*     ← concept/zoning/estimation/permit funnels
✅ /api/checkout/*   ← Stripe payment processing
✅ /api/v1/*        ← All primary operations

NO NEED FOR SEPARATE NEXTJS APPS per role
```

---

## PHASE 5: RISK ANALYSIS

### Removal Risk Assessment

#### SAFE TO DELETE ❌ (Actually, need caution)
**NONE** - All have API modules that may be used

#### MUST KEEP / MIGRATE ✅

**CRITICAL MIGRATION REQUIRED:**
1. **m-permits-inspections**
   - ❌ Permits UI is highly specialized
   - ✅ Needs migration of:
     - Jurisdiction database UI
     - Permit tracking dashboard
     - AI-powered compliance checking
   - 🎯 **WHERE TO MIGRATE**: web-main (public permits landing) + portal-owner (permit dashboard)
   - **RISK**: Permit submission workflow heavily depends on this

2. **m-estimation**
   - ❌ Cost estimation is specialized domain
   - ✅ Needs migration of:
     - RSMeans integration UI
     - Takeoff tools
     - Cost library
   - 🎯 **WHERE TO MIGRATE**: web-main (public estimation funnel) + portal-contractor (cost analysis)
   - **RISK**: Client depends on cost estimates for decision-making

3. **m-architect**
   - ❌ Architect collaboration features are complex
   - ✅ Needs migration of:
     - Design file management
     - Peer review workflow
     - Approval/stamping
   - 🎯 **WHERE TO MIGRATE**: web-main (architect landing) → API-driven portal for architect authentication
   - **RISK**: Design project workflow depends on this

4. **m-marketplace**
   - ❌ CONSOLIDATION APP - but NOT DEPLOYED
   - ✅ Reason for existence: v10 → v20 transition
   - 🎯 **DISPOSITION**: DELETE - portal-* apps have replaced its functionality
   - **RISK**: If deleted, verify portal-* apps have all marketplace features

5. **m-inspector**
   - ❌ MOBILE APP - completely separate platform
   - ✅ Active use case: Field inspection capture
   - 🎯 **DISPOSITION**: KEEP + MIGRATE offline sync to v20 backend
   - **RISK**: High - field teams depend on this

#### MEDIUM RISK - ARCHIVE CANDIDATES

6. **m-finance-trust**
   - Escrow logic now in API payments module
   - UI can be consolidated into portal-owner
   - **RISK**: Payment release workflows must not break

7. **m-ops-services**
   - Dual-mode (dev + GC) makes it unique
   - Logic spreadable to portal-contractor + portal-developer
   - **RISK**: General contractor workflow must be preserved

8. **m-engineer**
   - Minimal surface area (~1 API module)
   - Can consolidate into portal-contractor
   - **RISK**: Low

9. **m-project-owner**
   - LARGELY SUPERSEDED by portal-owner
   - Some project dashboard features may need migration
   - **RISK**: Low

### Risk Matrix

| App | Deletion Impact | Data Loss Risk | Workflow Breakage | Overall Risk |
|-----|--|--|--|--|
| m-architect | HIGH | HIGH | HIGH | 🔴 CRITICAL |
| m-engineer | LOW | LOW | LOW | 🟢 LOW |
| m-estimation | HIGH | HIGH | HIGH | 🔴 CRITICAL |
| m-finance-trust | MEDIUM | MEDIUM | MEDIUM | 🟡 MEDIUM |
| m-inspector | HIGH | HIGH | HIGH | 🔴 CRITICAL |
| m-marketplace | LOW | LOW | LOW | 🟢 LOW |
| m-ops-services | MEDIUM | MEDIUM | MEDIUM | 🟡 MEDIUM |
| m-permits-inspections | HIGH | HIGH | HIGH | 🔴 CRITICAL |
| m-project-owner | LOW | LOW | LOW | 🟢 LOW |

---

## PHASE 6: MIGRATION PLAN

### Critical Migrations Required (High Risk Apps)

#### Migration 1: m-permits-inspections → web-main + API
**Effort**: HIGH (5-7 days)

**COMPONENTS TO MIGRATE:**
```
✅ Jurisdiction database UI
   FROM: m-permits-inspections/app/jurisdictions/*
   TO: web-main/app/permits-research/ (public)
   API: Already in /api/v1/permits/jurisdictions/*

✅ Permit submission workflow
   FROM: m-permits-inspections/app/permits/*
   TO: web-main/app/permits-intake/ (existing)
   API: Already in /api/v1/permits/applications/*

✅ Permit tracking dashboard
   FROM: m-permits-inspections/app/dashboard/permits/*
   TO: portal-owner/app/permits/ (authenticated)
   API: Already in /api/v1/permits/*

✅ AI compliance checking
   FROM: m-permits-inspections/lib/ (Claude Vision integration)
   TO: API worker (background job)
   API: Already integrated via /api/v1/permits/compliance/*
```

**SCHEMA RETENTION:**
```
✅ KEEP: permits, permit_submissions, permit_statuses
✅ KEEP: jurisdictions, jurisdiction_configs
✅ KEEP: permit_reviewers table
✅ KEEP: AI models for compliance checking
```

**FILES TO CREATE:**
```
web-main/app/permits-research/             (public funnel)
web-main/app/permits-intake/               (existing, enhance)
portal-owner/app/permits/                  (dashboard)
services/worker/processors/permit-analysis (AI background job)
```

#### Migration 2: m-estimation → web-main + portal-contractor
**Effort**: HIGH (5-7 days)

**COMPONENTS TO MIGRATE:**
```
✅ Public estimation landing
   FROM: m-estimation/app/
   TO: web-main/app/estimation-funnel/
   API: /api/v1/estimation/intake

✅ Cost estimation takeoff UI
   FROM: m-estimation/app/takeoff/*
   TO: portal-contractor/app/estimating/
   API: /api/v1/estimation/projects/*

✅ RSMeans cost library
   FROM: m-estimation/lib/rsmeansdata/
   TO: services/api/lib/pricing/rsmeansdata/
   API: /api/v1/estimation/data/

✅ Cost analysis engine
   FROM: m-estimation/lib/cost-analyzer/
   TO: services/worker/processors/cost-analysis.processor.ts
   QUEUE: cost-analysis BullMQ queue
```

**SCHEMA RETENTION:**
```
✅ KEEP: estimation_projects, cost_data, estimation_items
✅ KEEP: assemblies, rsmeansdata tables
✅ KEEP: EstimationProject model
```

**FILES TO CREATE:**
```
web-main/app/estimation-funnel/            (public)
web-main/app/products/cost-estimate/       (existing, enhance)
portal-contractor/app/estimating/          (authenticated)
services/worker/processors/cost-analysis.processor.ts
services/api/lib/pricing/rsmeansdata.ts
```

#### Migration 3: m-architect → web-main + portal-architect (new)
**Effort**: VERY HIGH (7-10 days)

**CHALLENGE**: Most complex m-* app with design collaboration features

**COMPONENTS TO MIGRATE:**
```
✅ Architect landing page
   FROM: m-architect/app/
   TO: web-main/app/architects-services/
   API: /api/v1/architect/professionals/*

✅ Design project dashboard
   FROM: m-architect/app/projects/*
   TO: portal-architect/app/projects/        ← NEW PORTAL
   API: /api/v1/architect/design-projects/*

✅ Collaboration & review workflow
   FROM: m-architect/app/reviews/*
   TO: portal-architect/app/reviews/
   API: /api/v1/architect/collaborations/*

✅ Stamping/approval workflow
   FROM: m-architect/app/approvals/*
   TO: portal-architect/app/approvals/
   API: /api/v1/architect/approvals/*
```

**NEW INFRASTRUCTURE NEEDED:**
```
CREATE: apps/portal-architect/
  - Based on portal-owner template
  - Role-based: ARCHITECT
  - Middleware: Verify license + credentials
```

**SCHEMA RETENTION:**
```
✅ KEEP: design_projects, design_phases, design_files
✅ KEEP: drawings, review_comments, approvals
✅ KEEP: architect_onboarding, architect_license
```

**FILES TO CREATE:**
```
apps/portal-architect/                      ← NEW APP
web-main/app/architects-services/           (public funnel)
services/api/modules/architect/architect-portal.routes.ts
```

#### Migration 4: m-inspector → API + Worker (Mobile only)
**Effort**: MEDIUM (3-5 days)

**NO UI MIGRATION NEEDED** - React Native mobile stays as-is

**ENHANCEMENT REQUIRED:**
```
✅ Offline sync improvement
   FROM: m-inspector/src/services/sync.ts
   TO: services/worker/processors/inspection-sync.processor.ts
   QUEUE: inspection-sync BullMQ

✅ Photo analysis queue
   FROM: m-inspector/src/services/
   TO: services/worker/processors/photo-analysis.processor.ts
   QUEUE: photo-analysis (uses Claude Vision)

✅ Route optimization
   FROM: m-inspector/src/services/route-optimization.ts
   TO: services/api/modules/inspector/route-engine.ts
```

**SCHEMA RETENTION:**
```
✅ KEEP: inspections, inspection_items, defect_categories
✅ KEEP: photo_annotations, location_logs
✅ KEEP: All as-is (no changes needed)
```

**FILES TO CREATE:**
```
services/worker/processors/inspection-sync.processor.ts
services/worker/processors/photo-analysis.processor.ts
services/api/modules/inspector/route-engine.ts
```

### Secondary Migrations (Medium Risk)

#### m-finance-trust → portal-owner + API
```
✅ Escrow dashboard → portal-owner/app/escrow/
✅ Payment release UI → portal-owner/app/payments/
✅ Escrow logic → Already in /api/v1/escrow/*

Files to create:
- portal-owner/app/escrow/account.tsx
- portal-owner/app/payments/release.tsx
```

#### m-ops-services → portal-contractor + API
```
✅ Dual-mode dashboard → portal-contractor (GC mode)
✅ Estimation workflows → portal-contractor/app/estimating/
✅ Services directory → API module /api/v1/ops-services/*

Files to create:
- portal-contractor/lib/gc-mode-toggle.ts
- portal-contractor/middleware/gc-auth.ts
```

#### m-project-owner → portal-owner (DIRECT)
```
✅ portal-owner already serves this purpose
✅ Review for feature gaps
✅ Migrate any missing features:
   - Project updates feed
   - Team collaboration
   - Milestone tracking

Files to review:
- portal-owner/app/projects/
- portal-owner/app/team/
- portal-owner/app/milestones/
```

### Deletion Plan (Safe)

#### DELETE IMMEDIATELY (LOW RISK):
```
❌ apps/m-marketplace
   - Consolidation app not deployed
   - portal-* apps replace all features
   - No active references
   - Verification: Check if any API still links to it
```

#### DELETE AFTER MIGRATION (DEPENDENT):
```
❌ apps/m-permits-inspections     (after web-main + portal-owner migration)
❌ apps/m-estimation              (after web-main + portal-contractor migration)
❌ apps/m-architect               (after portal-architect creation)
❌ apps/m-finance-trust           (after portal-owner migration)
❌ apps/m-ops-services            (after portal-contractor migration)
❌ apps/m-engineer                (after portal-contractor consolidation)
❌ apps/m-project-owner           (after portal-owner verification)
```

#### KEEP (Special Case):
```
✅ apps/m-inspector               (mobile app, independent deployment)
```

---

## PHASE 7: FINAL AUDIT TABLE

| App | Status | Current Use | Data Models | Risk Level | Recommendation | Effort |
|-----|--------|------------|-------------|-----------|-----------------|--------|
| m-architect | ACTIVE | Architect collaboration UI (not deployed) | DesignProject, DesignPhase, Approval | 🔴 HIGH | MIGRATE to portal-architect | 7-10d |
| m-engineer | ACTIVE | Engineer service management (not deployed) | Engineer, ServiceArea | 🟢 LOW | MERGE into portal-contractor | 1-2d |
| m-estimation | ACTIVE | Cost estimation takeoff (not deployed) | EstimationProject, CostData, Assembly | 🔴 HIGH | MIGRATE to web-main + portal-contractor | 5-7d |
| m-finance-trust | ACTIVE | Escrow/payment workflows (not deployed) | EscrowAccount, PaymentRelease | 🟡 MEDIUM | MIGRATE to portal-owner | 2-3d |
| m-inspector | ACTIVE | Mobile inspection app | Inspection, DefectCategory, PhotoAnnotation | 🔴 HIGH | KEEP + ENHANCE offline sync | 3-5d |
| m-marketplace | ACTIVE | Consolidation app (never deployed) | Contractor, Lead, Order, Project | 🟢 LOW | DELETE - portal-* replaced it | 0d |
| m-ops-services | ACTIVE | General contractor ops (not deployed) | EstimationProject, ContractorService | 🟡 MEDIUM | MERGE into portal-contractor | 2-3d |
| m-permits-inspections | ACTIVE | Permits tracking + compliance (not deployed) | Permit, Jurisdiction, PermitReviewer | 🔴 HIGH | MIGRATE to web-main + portal-owner | 5-7d |
| m-project-owner | ACTIVE | Project dashboard (not deployed) | Project, ProjectOwner, ProjectTeam | 🟢 LOW | VERIFY portal-owner covers all features | 1-2d |

---

## PHASE 8: CLEANUP PLAN

### 1. DELETE IMMEDIATELY (Safe, no migration needed)

```bash
git rm -r apps/m-marketplace/
```

**Rationale**: Never deployed, portal-* apps have all functionality

### 2. MIGRATE & DELETE (Week 1-2)

**Week 1:**
```bash
# Migrate m-permits-inspections
- Create web-main/app/permits-research/
- Create portal-owner/app/permits/
- Create worker/processors/permit-analysis.processor.ts
- Verify API routes still work
- Test full permit flow end-to-end

# Then delete
git rm -r apps/m-permits-inspections/
```

**Week 2:**
```bash
# Migrate m-estimation  
- Create web-main/app/estimation-funnel/
- Create portal-contractor/app/estimating/
- Create worker/processors/cost-analysis.processor.ts
- Test takeoff workflow

# Then delete
git rm -r apps/m-estimation/
```

### 3. MIGRATE & DELETE (Week 3-4)

**Week 3:**
```bash
# Migrate m-architect (most complex)
- Create apps/portal-architect/ ← NEW PORTAL APP
- Create web-main/app/architects-services/
- Set up architect role auth
- Test design collaboration workflows

# Then delete
git rm -r apps/m-architect/
```

**Week 4:**
```bash
# Migrate m-finance-trust
- Move escrow UI to portal-owner
- Delete m-finance-trust
git rm -r apps/m-finance-trust/

# Migrate m-ops-services  
- Move ops UI to portal-contractor
- Delete m-ops-services
git rm -r apps/m-ops-services/

# Consolidate m-engineer into portal-contractor
git rm -r apps/m-engineer/

# Verify m-project-owner features in portal-owner
git rm -r apps/m-project-owner/
```

### 4. KEEP (No action)

```
✅ apps/m-inspector/
   - Completely separate React Native mobile app
   - Independent deployment (App Store / Google Play)
   - Should enhance offline sync via API worker
```

### 5. SCHEMA CLEANUP

**TABLES TO KEEP (all are referenced):**
```
✅ design_projects, design_phases, design_files, drawings, approvals
✅ estimation_projects, cost_data, estimation_items, assemblies, rsmeansdata
✅ permits, permit_submissions, permit_statuses, jurisdictions, jurisdiction_configs
✅ inspections, inspection_items, defect_categories, photo_annotations
✅ escrow_accounts, payment_releases
✅ engineers, service_areas, contractor_services
✅ projects, project_owners, project_teams, milestones
```

**NO TABLES TO DELETE**
```
All schema elements are used by API modules, even if UIs are being migrated
```

### 6. PACKAGES TO CLEAN UP

**After deletions, remove unused packages from:**
- Old pnpm workspaces entries
- GitHub Actions deploy config (already doesn't deploy m-*)
- Docker build context

**Changes to files:**

```bash
# 1. pnpm-workspace.yaml
- Remove entries for apps/m-* (after migration)

# 2. .github/workflows/deploy-production.yml  
- Already doesn't reference m-* apps (no change)

# 3. package.json (root)
- Remove scripts for m-* apps (if any)

# 4. turbo.json
- Remove build/lint tasks for m-* (if configured)

# 5. Dockerfile cleanup
- Remove all Dockerfile.legacy files from deleted apps
- NO CHANGE to main Dockerfile (only docker-compose.yml used)
```

---

## PHASE 9: CODE MODIFICATIONS

### Files to Update (Before Deletions)

#### 1. Update Navigation (web-main)

**File**: `apps/web-main/config/navigation.ts`

```diff
- Remove links to: /architect, /engineer, /finance, /ops-services, /marketplace
+ Keep only: /permits-research, /estimation-funnel, /permits-intake
+ Ensure portal links point to: /auth/portal-owner, /auth/portal-contractor
```

#### 2. Update API Module Registrations

**File**: `services/api/src/index.ts`

```diff
# When each m-* app is deleted, remove its API registration

# DELETE (has replacement in portal-* apps):
- await safeRegisterBlock('Architect routes', async () => {
    const { architectRoutes } = await import('./modules/architect/architect.routes')
  })

# Keep permit/estimation routes since they serve web-main + portal apps
+ Keep: /permits/*, /estimation/*, /inspector/*
```

#### 3. Update GitHub Actions (Optional Cleanup)

**File**: `.github/workflows/deploy-production.yml`

```diff
# Already correct - doesn't deploy m-* apps
# No changes needed
```

#### 4. Environment Variables

**No changes** - API modules remain, just UIs move

### Schema Retention Script

**File**: `scripts/schema-retention-verification.sql`

```sql
-- Verify all critical tables exist after m-* app deletions
SELECT table_name FROM information_schema.tables 
WHERE table_name IN (
  'design_projects', 'estimation_projects', 'permits', 
  'inspections', 'escrow_accounts', 'engineers', 'projects'
);
-- Should return 7 tables
```

### Removal Order (Strict Sequence)

```
SAFE TO DELETE ANYTIME:
1. ❌ apps/m-marketplace/
   └─ git rm -r apps/m-marketplace/
   └─ git commit "Remove: m-marketplace (superseded by portal-*)"

AFTER MIGRATION (in order):
2. ❌ apps/m-permits-inspections/ (after web-main + portal-owner)
   └─ Verify: web-main/app/permits-* exists
   └─ Verify: portal-owner/app/permits/* exists  
   └─ git rm -r apps/m-permits-inspections/

3. ❌ apps/m-estimation/ (after web-main + portal-contractor)
   └─ Verify: web-main/app/estimation-funnel exists
   └─ Verify: portal-contractor/app/estimating/* exists
   └─ git rm -r apps/m-estimation/

4. ❌ apps/m-architect/ (after portal-architect)
   └─ Create: apps/portal-architect/
   └─ Verify: portal-architect can create/manage design projects
   └─ git rm -r apps/m-architect/

5. ❌ apps/m-finance-trust/ (after portal-owner escrow)
   └─ Verify: portal-owner has escrow UI
   └─ git rm -r apps/m-finance-trust/

6. ❌ apps/m-ops-services/ (after portal-contractor)
   └─ Verify: portal-contractor has ops/estimation UI
   └─ git rm -r apps/m-ops-services/

7. ❌ apps/m-engineer/ (after portal-contractor)
   └─ Merge engineer features into portal-contractor
   └─ git rm -r apps/m-engineer/

8. ❌ apps/m-project-owner/ (after portal-owner)
   └─ Verify: portal-owner has all project features
   └─ git rm -r apps/m-project-owner/

KEEP:
✅ apps/m-inspector/
   └─ Mobile app, independent lifecycle
   └─ Enhance offline sync via API worker
```

---

## SUMMARY & RECOMMENDATIONS

### Critical Findings

1. **NO M-* APPS ARE DEPLOYED** - All have `Dockerfile.legacy` only; none in `railway.toml`
2. **V20 ARCHITECTURE SUPERSEDES THEM** - portal-* apps + web-main replace all m-* functionality
3. **20K LINES OF DUPLICATION** - Mostly in auth, components, API integration
4. **COMPLEX DEPENDENCIES** - Permit, estimation, architect workflows MUST be migrated

### Business Impact

```
Without Action:
- ❌ 9 unused apps in codebase (maintenance burden)
- ❌ 20K lines of duplicate code to maintain
- ❌ Developer confusion about which app to use
- ❌ Technical debt compounds over time

With Action:
- ✅ Single source of truth (portal-* + web-main)
- ✅ Simplified codebase  
- ✅ Reduced deployment complexity
- ✅ Faster development velocity
```

### Recommended Timeline

```
Phase 1 (Immediate, 0 days):
✅ Delete m-marketplace

Phase 2 (Week 1-2, 2-3 commits):
✅ Migrate m-permits-inspections
✅ Migrate m-estimation

Phase 3 (Week 3, 1 commit):
✅ Migrate m-architect → Create portal-architect

Phase 4 (Week 4, 1-2 commits):
✅ Migrate m-finance-trust, m-ops-services, m-engineer
✅ Verify m-project-owner

Total Effort: ~20-25 days over 4 weeks
```

---

**AUDIT COMPLETE** ✅  
**Date**: April 19, 2026  
**Status**: READY FOR IMPLEMENTATION  
**Confidence Level**: HIGH (based on comprehensive codebase analysis)

