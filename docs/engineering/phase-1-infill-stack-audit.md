# Phase 1 Residential Infill Stack Audit

Date: 2026-07-23

Scope: one-to-six residential infill lots, initially Prince George's County, Maryland.

## Ownership decision

The existing `packages/os-engineering` package remains the civil-production boundary. It composes deterministic capabilities already implemented in `concept-engine`, `workflow-engine`, and `compliance`. It does not own parcel acquisition. `services/os-land` remains the source of property and GIS intelligence. Permit routing and professional assignment remain in their existing agent and marketplace modules. No `SitePlanAgent` was added.

The prior seven-stage `workflow-engine` site-plan state machine remains supported for compatibility. Phase 1 adds a detailed sixteen-stage engineering workflow inside `os-engineering`; the API can migrate orchestration incrementally without breaking existing workflow records.

## Reuse and completion matrix

| Required capability | Existing implementation | File/module | Status | Tests | Defect/gap | Action |
|---|---|---|---|---|---|---|
| Civil domain boundary | Package façade over concept, workflow and compliance | `packages/os-engineering` | Partial | Build only | Provider and Phase 1 tool contracts missing | Extend package; do not create agent |
| Parcel/property retrieval | Authenticated parcel routes and enrichment service | `services/os-land` | Partial | Existing service tests | No typed engineering handoff contract | Add reference/provenance contract in engineering |
| Digital Twin | Intake creation/update helpers and database models | `packages/intake`, database schema | Complete for reuse | Existing | Engineering results not typed | Reference twin/property source IDs; do not duplicate collection |
| Site-plan workflow | Idempotent seven-stage state machine and persisted stage execution | `packages/workflow-engine`, API site-plans | Partial | Existing workflow tests | Phase 1 requires sixteen stages and richer statuses | Add compatible detailed workflow model |
| Site-plan persistence | Workflow, stage, compliance, review and corrections | `schema-src/workflow/site-plans.prisma` | Partial | Schema validation | Missing versioned engineering artifacts/calculations/drawings | Extend existing site-plan domain |
| Upload/storage | Secure project document upload and object storage | `packages/storage`, site-plan API | Partial | Extraction integration test | Only PDF/JPG/PNG accepted by route; no engineering classifier | Add deterministic intake validation/classification |
| PDF/image extraction | Anthropic-assisted extraction with provenance and capped confidence | API site-plan extraction | Partial | 3 tests | Synchronous; no local OCR provider abstraction; limited elements | Add provider contract and deterministic normalization; queue remains required for deployment |
| Local OCR | Permit-app OCR placeholders | permit application code | Placeholder | None found | Not production PaddleOCR/Tesseract service | Add provider interface and fail-closed unavailable provider; do not silently call cloud |
| Survey parsing | Coordinate polylines extracted from PDF/image | site-plan API | Partial | 3 tests | Bearings, DMS, closure and topology absent | Implement deterministic survey tools |
| LandXML/CSV/DXF input | No canonical engineering parser found | — | Missing | None | Formats unsupported | Add validated parsers for CSV/LandXML and ASCII DXF; DWG requires conversion |
| Boundary reconstruction | No canonical implementation found | — | Missing | None | No closure/precision/topology | Implement in `os-engineering` |
| Geometry generation | Layered civil geometry, areas, GeoJSON | `concept-engine/civil-site-plan.ts` | Partial | 4 tests | No setbacks/envelope/footprint/conflict/LOD tools | Implement deterministic geometry tools |
| DXF | ASCII DXF site plan and architectural DXF writer | `concept-engine` | Partial | 4 tests | Site output lacks layer manifest validation/preview manifest | Extend manifest/validation while reusing generator |
| Vector PDF | Minimal vector PDF generator | `concept-engine/civil-site-plan.ts` | Partial | Header/output tests | Single sheet, basic title block | Add dynamic sheet/report manifest; retain vector output |
| Terrain/grading | No reusable civil terrain engine found | — | Missing | None | No surfaces, slope, contours, cut/fill | Implement deterministic point/surface screening calculations |
| Stormwater | PG trigger checks only | `packages/compliance` | Partial | PG tests indirect | No versioned runoff/BMP calculation framework | Implement unit-safe preliminary calculations |
| Erosion/sediment | Layer support and PG triggers | concept/compliance | Partial | Civil output tests | No candidate layout/quantities/validation | Implement candidate controls and conflict checks |
| PG County rules | Disturbance, earth movement, NPDES, woodland, environmental, ROW, infill, survey and release checks | `packages/compliance/jurisdiction-rules.ts` | Partial | Existing package tests | Missing explicit utilities, municipality, water/sewer, grade change, signed/sealed checks | Extend stable versioned checks |
| Professional review | Assignment lookup, license/expiry checks, redlines, immutable seal evidence and release guard | API, `m-engineer`, marketplace schema | Partial | Service guards and UI typecheck | Detailed Phase 1 statuses/package manifest incomplete | Add domain review package/status types; preserve seal prohibition |
| Permit handoff | Permit agent, permit packages and correction cycles | AI orchestrator/API/permit apps | Complete for reuse | Existing | Engineering handoff manifest not explicit | Add structured handoff output only |
| Queues/workers | BullMQ registry and workers | `packages/queue`, `services/worker` | Partial | Existing | No engineering queue names/processors | Register engineering queue; API must enqueue heavy provider jobs before scale |
| Feature flags | Site-plan automation flag | core config | Partial | Config tests | Missing Phase 1 granular flags | Add configuration flags with safe defaults |
| PostGIS | GIS migrations/data scripts exist | database GIS scripts/migrations | Partial | GIS source script | Production extension availability not guaranteed; engineering geometry stored as JSON | Add safe extension check/migration and indexed geometry columns where supported |
| UI: command center | Queue, upload/extraction, geometry generation and result display | `apps/command-center` | Partial | Typecheck | No complete terrain/stormwater/redline canvas | Extend data contract first; preserve existing UI |
| UI: professional | Review list, decision/redlines, source/sealed evidence | `apps/m-engineer` | Partial | Typecheck | No drawing-package manifest display | Extend API payload incrementally |
| UI: owner | No canonical owner site-plan order flow found | portal apps | Missing | None | Customer order/timeline incomplete | Phase 1 API contract first; owner UI remains a documented limitation |
| Observability/cost | Workflow events and timestamps | API/database | Partial | Existing | No engineering-specific cost records | Add versioned stage metrics/cost schema |

## Duplicate and obsolete work avoided

- No new agent was created.
- No replacement parcel/GIS service was created.
- The existing DXF/vector-PDF generator, workflow engine, compliance package, document storage, marketplace assignments, permit correction cycle, event bus and Prisma client remain canonical.
- Autodesk is retained only as an optional CAD-provider interface and is not required for Phase 1.
- GIS boundaries remain informational and are never promoted to surveyed geometry.
- The legacy ZIP-based zoning guesser is not used by engineering automation.

## Security and operational findings

- Uploaded engineering documents remain tenant/project associated and stored through the existing storage package.
- Heavy OCR/GIS/CAD work should run through the existing queue system; synchronous extraction is retained only as a compatibility route and must be moved behind the worker before high-volume production.
- Public-schema engineering tables require RLS before any Supabase Data API grants. Server-side Prisma access remains the current access path.
- The linked Supabase management project could be discovered, but direct database calls timed out during the audit. The configured Railway PostgreSQL database was reachable.

## Phase 1 implementation focus

The implementation following this audit closes the deterministic core: intake classification, provenance, survey parsing and closure, geometry/envelope/footprint/LOD, terrain screening, preliminary runoff/BMP calculations, sediment-control candidates, detailed workflow, drawing manifest/validation, PG checks, professional release guards, persistence contracts, tests and actual-state documentation.
