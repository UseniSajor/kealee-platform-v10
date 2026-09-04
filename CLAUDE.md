# Kealee Platform v20 - Claude Code Context

This file preserves key context for Claude Code sessions working on this project.

## MULTI-AGENT SYNC — MANDATORY (do this before and after every session)

Multiple agents work on this repo simultaneously from different platforms (Claude Code, Antigravity, etc.). To stay in sync:

```bash
# START OF EVERY SESSION — pull before touching anything
git fetch origin && git pull origin main

# END OF EVERY SESSION — push after every commit
git push origin main
```

**Rules:**
- ALWAYS pull from `origin/main` before starting any work
- ALWAYS push to `origin/main` immediately after committing
- NEVER leave commits local-only — they block other agents
- If a merge conflict occurs, resolve it before pushing

## Project Overview

Kealee Platform v20 is a full-lifecycle construction development platform with 18 apps, 11 services, 34 packages, and 13 AI bots, built as a monorepo using pnpm workspaces. Evolved from v10 with formal service layers, Digital Development Twin System (DDTS), and KeaBot automation agents.

## AI Automation Layer (MANDATORY READING — prevents agent confusion)

**v20 and v30 are the same platform. v30 is NOT a separate system.**

v30 = v20 + parallel AI automation bots (DesignBot, EstimateBot, PermitBot, FloorplanBot) running via `os-ai-orch`. Same database, same pipeline, same data model. An "AI-automated order" is one where `formData.v30 === true`.

### What the `v30` prefix means in code

The `v30` prefix on JSONB keys and legacy function names is a **frozen historical label**, not a platform version indicator. Do not treat it as a separate system.

| Legacy identifier | What it actually means |
|---|---|
| `formData.v30 === true` | This order uses parallel AI bots |
| `formData.v30ConceptOutput` | Concept output written by DesignBot |
| `formData.v30FloorplanDeliverables` | Floorplan/CAD output from FloorplanBot |
| `formData.v30LandscapePremiumPlus` | Landscape package from LandscapeBot |
| `isV30IntakeFormData()` | `isAIAutomatedOrder()` — use the alias |
| `v30WorkspaceUrl()` | `getAutomatedWorkspaceUrl()` — use the alias |
| `v30TierLabel()` | `getAutomatedTierLabel()` — use the alias |

### Frozen rules — never change these

- **DB JSONB keys are frozen**: `v30ConceptOutput`, `v30FloorplanDeliverables`, `v30`, `v30Quote`, `v30ProjectId` are written by `os-ai-orch`. Do not rename them. Do not add DB migrations for these keys.
- **The v30 guard in `concept/generate` is sacred**: The check `if (formData.v30 || formData.v30SkipConceptGenerate)` prevents double-generating AI-automated orders. Never remove or weaken it.
- **`os-ai-orch` is the write authority**: All `v30*` fields in `form_data` are written by the orchestration service. Application code only reads them.

### For new code — use the aliases in `apps/portal-owner/lib/concept-output.ts`

```ts
// Prefer these in new code:
isAIAutomatedOrder(formData)       // was: isV30IntakeFormData
getAutomatedWorkspaceUrl(intakeId) // was: v30WorkspaceUrl
getAutomatedTierLabel(tier)        // was: v30TierLabel
getAutomatedConceptOutput(formData) // was: getConceptOutputFromFormData (v30 branch)
getAutomatedFloorplan(formData)    // was: parseV30FloorplanDeliverables
getAutomatedLandscape(formData)    // was: parseV30LandscapePackage
```

Existing code using the `v30`-prefixed function names is valid and does not need to be updated. Use aliases only in new code going forward.

## Repository Structure

```
Kealee-Platform v10/
├── apps/                    # Next.js frontend applications
│   ├── m-architect/         # Architect mini-app
│   ├── m-finance-trust/     # Finance/Trust mini-app
│   ├── m-marketplace/       # Marketplace mini-app
│   ├── m-ops-services/      # Operations Services mini-app
│   ├── m-permits-inspections/ # Permits & Inspections mini-app
│   ├── m-project-owner/     # Project Owner mini-app
│   ├── os-admin/            # Admin dashboard
│   └── os-pm/               # Project Management dashboard
├── packages/
│   ├── database/            # Prisma schema and database package
│   │   └── prisma/
│   │       └── schema.prisma  # Main Prisma schema
│   └── automation/
│       └── apps/            # Backend automation tools (15 apps)
│           ├── estimation-tool/     # APP-06: Construction estimation
│           ├── bid-engine/          # APP-01: Bid management
│           ├── cost-database/       # APP-02: Cost database
│           └── ...                  # Other automation apps
└── pnpm-lock.yaml
```

## Key Technical Details

### Prisma Schema

- **Location**: `packages/database/prisma/schema.prisma`
- **Important**: The organization model is named `Org`, NOT `Organization`
- **Generate command**: `npx prisma generate` (run from packages/database/)

### Command Center Infrastructure Models (Added Jan 2026)

The following models were added for Command Center (APP-15):

1. **DashboardWidget** - User dashboard widgets with WidgetType enum
2. **JobQueue** - BullMQ job tracking with JobStatus enum
3. **JobSchedule** - Cron-based job scheduling
4. **SystemConfig** - Key-value system configuration
5. **IntegrationCredential** - Third-party service credentials with IntegrationService and IntegrationStatus enums
6. **AIConversation** - AI assistant conversation history

### Estimation Tool Package

- **Location**: `packages/automation/apps/estimation-tool/`
- **Build command**: `pnpm run build`
- **TypeScript config**: Uses CommonJS modules (`module: "NodeNext"`)
- **Key pattern**: Uses `require.main === module` for entry point detection (not `import.meta.url`)

### Build Commands

```bash
# Build estimation-tool
cd packages/automation/apps/estimation-tool
pnpm run build

# Generate Prisma client
cd packages/database
npx prisma generate

# Root level commands
pnpm install
pnpm run build
```

### Common Issues & Solutions

1. **Prisma JSON filter errors**: Don't use `metadata: { equals: null }` for JSON fields. Use post-query filtering instead.

2. **CommonJS import.meta error**: Use `require.main === module` instead of `import.meta.url` checks.

3. **Model naming**: Always check actual model names in schema.prisma (e.g., `Org` not `Organization`).

## Construction Domain Concepts

- **CSI MasterFormat**: Industry standard for organizing construction specs (division codes like "03" for Concrete)
- **Cost Databases**: RSMeans and similar databases for unit costs
- **Assemblies**: Pre-built groups of line items (e.g., "8-inch CMU Wall" assembly)
- **Takeoff**: Quantity extraction from construction plans
- **Value Engineering**: Cost optimization analysis

## Environment

- Node.js 20+
- pnpm package manager (v8.15.9 for Vercel compatibility)
- TypeScript 5.6+
- Prisma 5.22+

## MEMORY SYSTEM (MANDATORY)

All system knowledge is stored in the docs/ directory.

Primary folders:
- docs/audits/
- docs/decisions/
- docs/system/ (includes `concept-package-deliverables.md` — canonical tier deliverables; permit+zoning in all tiers)
- docs/prompts/
- docs/runbooks/

Before ANY change, Claude MUST:

1. Read:
   - docs/system/pipeline.md
   - docs/decisions/architecture.md (or closest equivalent)
   - docs/audits/latest.md (or newest audit)
2. Scan:
   - docs/decisions/
   - docs/system/
   - docs/audits/
3. Summarize:
   - current system state
   - known failures
   - critical rules

Rules:
- Do NOT ignore audits
- Do NOT override decisions
- Do NOT break execution pipeline
- Prefer existing patterns in repo

Execution pipeline is sacred:
User → Agent → CTA → Stripe → Webhook → ProjectOutput → Queue → Worker → Output → Upsell

## GEOSPATIAL & PROPERTY DATA — MANDATORY (PGAtlas is the authority)

**Read this before touching anything that needs an address, parcel, zoning,
terrain or jurisdiction. Do not execute first and reconcile later.**

For any DC · MD · VA property fact the county publishes, **PGAtlas is the
source of truth**. Query it. Do not ask the user, do not infer from intake
free text, and do not use a public geocoder.

| What | Endpoint (`gis.pgatlas.com/pgatlas/rest/services/…`) |
|---|---|
| Address locator | `Geocoders/Address/GeocodeServer` |
| Parcel | `Property/MapServer/15` |
| Zoning | `Zoning/MapServer/63` |
| 2-ft contours (NAVD88) | `Elevation/MapServer/1` |
| Street centrelines | `Transportation/MapServer/2` |
| **Municipal boundary** | `Administrative/MapServer/30` (buffers: 31 ¼mi, 32 ½mi, 33 1mi) |
| Soils | NOT PGAtlas — USDA SSURGO, area MD033 |

### Rules that cost real time to learn

- **Pass the street address ALONE.** Appending city, state or ZIP returns ZERO
  candidates and the stage blocks. `1005 Rollins Ave` scores 100;
  `1005 Rollins Ave, Capitol Heights, MD` matches nothing. Verified against the
  live service.
- **Minimum locator score is 90.** The composite locator offered a DIFFERENT
  STREET at 77 for a valid address. A weak match sites the plan on the wrong
  lot and every downstream check still passes.
- **Jurisdiction comes from geometry, not from typing.** `Administrative/
  MapServer/30` says whether a parcel is inside incorporated limits. An
  incorporated lot is routed to KEALEE INTERNAL STAFF REVIEW — that is a Kealee
  workflow decision, not a claim about any municipality's own process.
  A town name in an intake field is an applicant's guess about their own
  address; the county's boundary layer is the answer.
- **Never fabricate a fallback.** If a layer does not answer, the output says
  so and the feature is absent. A fabricated parcel or elevation renders
  exactly like a real one and nothing downstream can tell them apart.
- **Do not use `gisdata.pgplanning.org` for elevation.** It is the open-data
  portal and has none; searching only it produced the false finding that the
  county publishes no contours.
- **`princegeorgescountymd.gov` blocks Anthropic egress IPs.** `WebFetch` gets
  403 where a local `curl` gets 200. Never conclude a public document is
  unreachable without trying locally.

### Known violation — do not copy this pattern

`resolveJurisdiction()` in `apps/web-main/lib/site-plan-rules.ts` regex-matches
intake free text against a hardcoded list of twenty PG town names. It runs in
the Stripe webhook, deliberately without network access. It is the one place in
the site-plan path that trusts a text box over the county, and it is a known
gap, not a pattern to follow.

Full detail: `docs/system/site-plan-commands.md` and
`docs/system/site-plan-generation.md`.

## AI CONTENT GENERATION — MANDATORY PROMPT RULES

All AI generation prompts (Replicate, Kling, Sora, Claude Vision, any model) that produce
platform content MUST be grounded in platform data. Generic prompts are forbidden.

### Every prompt MUST include context from at least one of:

1. **Schema / service type** — derive from `services-config.ts`, `INTAKE_PRICE_CENTS`, or
   the project's `projectPath` / `service_type` field (e.g. `kitchen_remodel`, `addition_expansion`)
2. **Platform rules / deliverables** — reference `docs/system/concept-package-deliverables.md`
   and `@kealee/core-rules` for tier, delivery days, and what is included
3. **Seed / jurisdiction data** — reference `ZoningProfile`, `Jurisdiction`, or `ParcelData`
   when relevant to the project location (DC · MD · VA)
4. **Form data / project context** — use `sqft`, `room_count`, `property_type`, `address`,
   `style_preference` from the intake `form_data` JSONB when available

### Forbidden in prompts:
- Generic "beautiful room" prompts with no service context
- Tax forms, spreadsheets, financial paperwork as imagery
- Non-construction stock content (business meetings, generic offices)
- Any image/video that does not show live residential or commercial construction content

### Platform AI providers (priority order):
1. `VIDEO_PROVIDER` env override → `sora-2-pro | sora-2 | veo-3.1 | kling-2.5`
2. `REPLICATE_API_TOKEN` → Kling 2.5 via Replicate (default production)
3. FLUX 1.1 Pro via Replicate for static renders

### v30 = AI live platform
v30 orders are fully AI-automated. DesignBot, EstimateBot, PermitBot, and FloorplanBot
run in parallel and write outputs to `form_data` JSONB. Every v30 concept delivery includes
AI-generated renders and (for Tier 2+) AI video. The platform is live and production-ready.

### Content categories required on all platform pages:
- Residential construction (kitchen, bathroom, addition, whole-home, deck, garden)
- Commercial construction (mixed-use, multi-unit, office, retail fit-out)
- Permit and inspection imagery (blueprints at job site, inspection signage, plan review)
- Active build sites (framing, MEP rough-in, finish work, exterior)