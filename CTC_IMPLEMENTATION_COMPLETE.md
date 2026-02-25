# Construction Task Catalog (CTC) Integration — Complete

## Overview

The Gordian Construction Task Catalog (MD DGS Job Order Contracting) has been fully integrated into the Kealee Platform. This enables standardized, reference-based cost estimation across labor, materials, and equipment with built-in modifier support, connected via event-driven CLAWS automation.

**Result:** 54,760 CTC tasks imported across 33 CSI MasterFormat divisions, with full search, estimation, AI takeoff, and pre-construction workflow support.

---

## Phase 1 — Schema & Data Model

### Prisma Models

| Model | Purpose |
|-------|---------|
| `CostDatabase` | Stores cost reference databases (CTC is one source) with metadata: name, region, type, tier, visibility, methodology |
| `Assembly` | Individual cost items including CTC-specific fields: `ctcTaskNumber`, `ctcModifierOf`, `sourceDatabase` |
| `AssemblyItem` | Child items of assemblies (optional cost breakdown) |
| `CostCodeImportJob` | Tracks PDF import jobs with progress status, extracted data, and import results |
| `Estimate` | User-created estimates with `totalCost`, sections, and line items |
| `EstimateSection` | Grouped sections within an estimate |
| `EstimateLineItem` | Individual line items with `materialCostAmt`, labor, equipment costs |

**File:** `packages/database/prisma/schema.prisma`

---

## Phase 2 — CTC Parser Service

### `services/api/src/services/ctc-parser.service.ts` (20KB)

Specialized parser for the Gordian CTC PDF format:

1. **PDF Extraction** — Extracts text from the 3,500-page CTC catalog via `pdf-parse`
2. **Division Splitting** — Splits by CSI division boundaries into batches (~12 pages each, ~250 API calls)
3. **AI Parsing** — Uses Claude API with CTC-specific prompts to extract structured task data
4. **Database Insert** — Creates Assembly records with full metadata

**Capabilities:**
- Parses task numbers (e.g., `03-210`), descriptions, units, unit prices
- Handles modifier tasks (e.g., `03-210.01` adds/deducts cost from parent `03-210`)
- Breaks down costs into labor/material/equipment using trade-specific ratios
- Rate-limited at ~1 second between API calls

### `packages/estimating/src/seed-ctc.ts` (18KB)

Development seed script creating 60+ sample CTC tasks across 15+ CSI divisions for testing without running the full PDF import pipeline.

---

## Phase 3 — API Endpoints

### CTC Search & Browse (`estimation-extended.routes.ts`)

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/estimation/ctc/search` | Search CTC tasks by query, division, category, modifier status (paginated) |
| GET | `/estimation/ctc/divisions` | List all 33 CSI divisions with task counts |
| GET | `/estimation/ctc/tasks/:taskNumber` | Get specific task with its modifiers |
| POST | `/estimation/ctc/estimate` | Create estimate from CTC tasks with quantities and markup |

### PDF Import (`cost-code-pdf-import.routes.ts`)

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/estimation/pdf/upload` | Upload generic cost book PDF (AI processing) |
| POST | `/estimation/pdf/upload-ctc` | Upload CTC PDF (admin-only, 100MB max) |
| GET | `/estimation/pdf/jobs` | List import jobs with status tracking |
| GET | `/estimation/pdf/jobs/:id` | Get job progress and extracted data |
| DELETE | `/estimation/pdf/jobs/:id` | Cancel/delete import job |

### AI Takeoff (`estimation-extended.routes.ts`)

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/estimation/takeoff/upload` | Upload construction plan file |
| POST | `/estimation/takeoff/:planId/extract` | Extract quantities from plan |
| POST | `/estimation/takeoffs` | Create takeoff session |
| GET | `/estimation/takeoffs` | List user's takeoff sessions |
| GET | `/estimation/takeoffs/:id` | Get takeoff detail |
| POST | `/estimation/takeoffs/:id/measurements` | Add measurement to takeoff |
| GET | `/estimation/takeoffs/:id/summary` | Get summary (area, length, counts) |

### Estimate CRUD (`estimation-extended.routes.ts`)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/estimation/estimates` | List user's estimates |
| POST | `/estimation/estimates` | Create new estimate |
| GET | `/estimation/estimate/:id` | Get estimate with sections and line items |
| POST | `/estimation/estimate/:id/line-items` | Add line item to estimate |
| DELETE | `/estimation/estimate/:id/line-items/:lineItemId` | Delete line item |

### Pre-Construction (`precon.routes.ts`)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/precon/dashboard` | Owner's pre-con dashboard summary |
| GET | `/precon/fee-info` | Design package fee structure (BASIC/STANDARD/PREMIUM) |
| POST | `/precon/projects` | Create pre-con project |
| GET | `/precon/projects` | List projects with phase/category filtering |
| GET | `/precon/projects/:id` | Project details with design concepts and bids |
| POST | `/precon/projects/:id/pay-design-fee` | Initiate design process |

### Project Wizard (`estimation.routes.ts`)

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/estimation/project-wizard` | Full project creation: CTC task selection, estimate generation, optional bid request |

---

## Phase 4 — CLAWS Event Wiring

### Acquisition-Precon CLAW

**File:** `services/command-center/claws/acquisition-precon/index.ts`

Watches `project.*`, `estimation.*`, `ctc.*` events:

- `ctc.imported` — Triggers `ctc-import-completed` job to refresh project analysis
- `ctc.takeoff.confirmed` — Triggers `takeoff-confirmed` job to enable bid request creation
- Creates bid requests, contractor scoring, bid-to-contract automation

### Budget-Cost CLAW

**File:** `services/command-center/claws/budget-cost/index.ts`

Watches `estimate.*`, `changeorder.*`, `payment.*` events:

- Seeds budget from CTC-based estimates across 7 categories: LABOR, MATERIAL, EQUIPMENT, SUBCONTRACTOR, PERMITS, OVERHEAD, CONTINGENCY
- Tracks variance alerts (>15% category or >10% total)
- Cost forecasting and earned value metrics

---

## Phase 5 — Frontend Wiring

### m-estimation (Internal Estimation Tool, port 3009)

| Page | Path | Features |
|------|------|----------|
| CTC Browser | `/cost-database/ctc` | Division tree (01-33), keyword search, task details, add to estimate |
| Cost Import | `/cost-database/import` | CSV/PDF/CTC upload modes with job tracking |
| Estimate Wizard | `/estimates/new` | Multi-step wizard with CTC search, AI takeoff, scope analysis |
| Estimate Editor | `/estimates/[id]/edit` | Edit sections and line items with real API data |
| Dashboard | `/dashboard` | Charts derived from actual estimate data |

### m-ops-services (GC/Contractor Portal, port 3005)

| Page | Path | Features |
|------|------|----------|
| AI Takeoff | `/portal/estimation/ai-takeoff` | Upload plans, extract quantities, import to new estimate |
| Estimate Detail | `/portal/estimation/[id]` | View estimate with inline add/delete line items |
| New Estimate | `/portal/estimation/new` | Create estimate (imports from AI takeoff via sessionStorage) |

### m-project-owner (Owner Portal, port 3000)

| Page | Path | Features |
|------|------|----------|
| PreCon List | `/precon` | List pre-construction projects |
| PreCon Detail | `/precon/[id]` | Project details with Overview, Design Concepts, Bids, Timeline tabs |
| New Project | `/precon/new` | Create pre-con project |
| Fee Info | `/precon/fee-info` | Design package pricing tiers |

---

## Bug Fixes Applied

1. **CTC import handler** — Fixed `loadImportJobs()` → `fetchJobs()` call
2. **ScopeAnalysisStep** — Fixed double FormData wrapping in AI takeoff upload
3. **Estimate editor** — Removed mock fallback, shows proper error state on API failure
4. **Route conflict** — Renamed `POST /estimation/estimate` (CRUD) to `POST /estimation/estimates` to avoid collision with AI estimate generation route
5. **Auth across all apps** — Added `/auth/callback` routes, fixed `router.push()` → `window.location.href`, added Supabase env vars to m-estimation
6. **Next.js version mismatch** — Resolved m-estimation Next.js 15 vs root 14 conflict

---

## Architecture

```
Frontend (Next.js)          API (Fastify)              CLAWS (Event Handlers)
┌──────────────┐           ┌──────────────┐           ┌──────────────────┐
│ m-estimation │──────────>│ /estimation/ │──events──>│ acquisition-     │
│ m-ops-svc    │           │ /precon/     │           │   precon         │
│ m-proj-owner │           │              │           │ budget-cost      │
└──────────────┘           └──────┬───────┘           └──────────────────┘
                                  │
                           ┌──────┴───────┐
                           │  PostgreSQL   │
                           │  (Supabase)   │
                           │              │
                           │ CostDatabase │
                           │ Assembly     │
                           │ Estimate     │
                           └──────────────┘
```

---

## Verification

- API server: `http://localhost:3001` — All routes registered via `safeRegisterBlock()`
- CTC data: 54,760 tasks across 33 CSI divisions in production database
- All 3 frontend portals render login pages and connect to real API endpoints
- CLAWS event handlers wired for `ctc.imported` and `ctc.takeoff.confirmed`
