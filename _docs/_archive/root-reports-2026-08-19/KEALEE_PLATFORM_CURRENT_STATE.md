# Kealee Platform Current State Document

This document defines the architecture, project structure, component maps, and unified lifecycle flow of the Kealee Platform. It serves as the single source of truth for design, development, and AI engineering tools to align with the platform's state.

---

## 1. Directory Structure & App Consolidation

The Kealee Platform is organized as a clean monorepo. Deprecated, redundant, or duplicate directories have been fully removed to prevent duplicate workflows.

### Workspace Structure:
- **`apps/web-main`**: The primary marketing site, intake, and public landing page for design concepts.
- **`apps/portal-owner`**: Homeowner/client portal for managing projects, budgets, and milestones.
- **`apps/portal-contractor`**: Contractor-specific interface for accepting assignments, uploading credentials, and viewing leads.
- **`apps/portal-developer`**: Developer-specific interface for feasibility analysis, land acquisition, and portfolio tracking.
- **`apps/os-admin`**: The unified administration and operations console (which consolidated the legacy `portal-admin`). Contains AI prompt registries, template editors, and global pricing configurations.
- **`apps/command-center`**: Internal operations view for overall system health, integrations, and manual agent routing.
- **`packages/ui`**: Shared UI component library exported across all applications.

### Deleted Redundant Applications:
- `apps/admin-console` (superseded by `os-admin`)
- `apps/portal-admin` (consolidated into `os-admin`)
- `apps/web` (legacy setting screens, superseded by `web-main`)
- `apps/portal-projects` (redundant redirect skeleton)
- `apps/portal-white-label` (legacy partner logs listing, moved into `os-admin`)

---

## 2. The 7-Stage Unified Lifecycle

Every screen, workflow, deliverable, and dashboard in the Kealee Platform must align to the following sequence:

$$\text{IDEA} \rightarrow \text{DESIGN} \rightarrow \text{ESTIMATE} \rightarrow \text{PERMIT} \rightarrow \text{CONTRACTOR} \rightarrow \text{EXECUTION} \rightarrow \text{COMPLETION}$$

### Lifecycle Phase Matrix:
1. **`IDEA`**: Initial scoping, feasibility analysis, or parcel acquisition.
2. **`DESIGN`**: Transforming ideas into drawings, floorplans, specs, and renderings.
3. **`ESTIMATE`**: Creating accurate bill of materials (BOM) and cost estimation calculations.
4. **`PERMIT`**: Filing, tracking, and municipal approval of permits.
5. **`CONTRACTOR`**: Finding and matching vetted local contractor partners.
6. **`EXECUTION`**: On-site construction, structural inspections, and daily logs.
7. **`COMPLETION`**: Final closeout, inspections, payments release, and digital twin handoff.

### Database Backwards Compatibility:
Legacy database phases are normalized client-side using `normalizePhase()` helpers.
- `FEASIBILITY` / `CONCEPT` / `LAND` $\rightarrow$ **`IDEA`**
- `DESIGN` $\rightarrow$ **`DESIGN`**
- `PRECONSTRUCTION` / `COSTING` $\rightarrow$ **`ESTIMATE`**
- `PERMITS` $\rightarrow$ **`PERMIT`**
- `CONTRACTOR_MATCH` $\rightarrow$ **`CONTRACTOR`**
- `CONSTRUCTION` / `INSPECTIONS` $\rightarrow$ **`EXECUTION`**
- `CLOSEOUT` / `COMPLETED` / `OPERATIONS` / `ARCHIVE` / `PAYMENTS` $\rightarrow$ **`COMPLETION`**

---

## 3. Revenue Funnel Progression

All user interfaces within the customer portals are designed to maximize progression through the primary revenue funnel. When a project is in a specific phase, portals actively render contextual calls-to-action (CTAs) directing the user to the next paid stage:

- **`IDEA`** $\rightarrow$ **CTA**: "Define Design Concept" (links to `/concepts`)
- **`DESIGN`** $\rightarrow$ **CTA**: "Request Cost Estimate" (links to `/services`)
- **`ESTIMATE`** $\rightarrow$ **CTA**: "Prepare & File Permits" (links to `/services`)
- **`PERMIT`** $\rightarrow$ **CTA**: "Match Vetted Contractors" (links to `/marketplace`)
- **`CONTRACTOR`** $\rightarrow$ **CTA**: "Launch Project Execution" (links to `/project/:id`)
- **`EXECUTION`** $\rightarrow$ **CTA**: "Monitor Construction Progress" (links to `/twin/:id`)
- **`COMPLETION`** $\rightarrow$ **CTA**: "Open Project Archive" (links to `/project/:id`)

---

## 4. Frozen Code & Integration Boundaries

Do not modify the following subsystems without explicit approval:
- **`apps/web-main/app/api/v30/*`**: The v30 core prompt and evaluation routes are frozen.
- **`os-ai-orch` routes**: Frozen orchestration backend modules.
- **Database Schema (`prisma/schema.prisma`)**: Fully locked unless migration is requested.
- **Auth & Payment Logic**: Integrating with external escrow, Stripe ACH, and Supabase auth is frozen.

---

## 5. Build & Verification Commands

All repository builds must use the local binary execution commands:
- **Install/Clean Cache**: `pnpm install`
- **Build Workspaces**: `.\node_modules\.bin\turbo run build`
- **Lint Workspaces**: `.\node_modules\.bin\turbo run lint`
- **Local Dev Server**: `pnpm dev`
