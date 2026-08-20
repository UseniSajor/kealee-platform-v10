# Site Plan Engine — Phase 1 Repository Audit (Prince George's County, MD)

Date: 2026-08-20. Method: source inspection plus live probes of the actual GIS
endpoints. Nothing below is taken from prior completion reports.

## 1. Existing relevant modules

| Capability | Location | Verdict |
|---|---|---|
| Site-plan workflow schema | `packages/database/prisma/schema.prisma` — `SitePlanWorkflow`, `SitePlanStageExecution`, `SitePlanComplianceResult` | **Schema only, zero implementing code** |
| Professional review + sealing | `ProfessionalReviewRecord` (licenseNumber, licenseVerifiedAt, sourceContentHash, sealedContentHash, decision) | **Schema only** — but the design is correct and matches the no-auto-seal requirement |
| Versioned rule packs | `JurisdictionRuleVersion` (sourceUrl, section, effectiveDate, lastVerifiedAt, confidence, humanReviewRequired) | **Schema only** — matches the "never hard-code an unexplained requirement" rule |
| Site provenance | `SiteSourceDataset` (provider, sourceUrl, license, retrievedAt, effectiveDate, **crs**, **linearUnit**, checksum, confidence, version, supersedesId) | **Schema only.** Missing: horizontal datum, vertical datum, accuracy class, reliability level, responsible professional |
| Site constraints | `SiteConstraint` (geometryGeoJson, crs, linearUnit, severity, ruleReference, version) | **Schema only** |
| Terrain | `SiteTerrainModel` (DEM / point cloud / slope raster / contour artifacts, contourInterval, surfaceStatistics, processingVersion) | **Schema only** |
| Digital twin | `DigitalTwin`, `TwinSnapshot`, `TwinEvent`, `PropertyTwin`, `ProjectTwin` | **Operational** — enforced at 4 project-creation paths |
| ArcGIS client | `packages/spatial-engine/src/gis-client.ts` | **Operational** for DC / Montgomery / Fairfax / Arlington. **No PG County.** Redirect-aware, TLS-bypass fetch already written |
| Nationwide address → jurisdiction | `apps/web-main/lib/site-intelligence/authoritative-gis.ts` | **Operational in production**, incl. right-of-way buffer + candidate disambiguation |
| Parcel service | `services/os-land/src/parcel.service.ts` | Operational (business records, not geometry) |
| Vector PDF | `packages/concept-engine/src/pdf/render-concept-pdf.ts`, `pdfkit` 0.14/0.15, `pdf-lib`, `jspdf` | **Operational multi-page pattern to reuse** |
| IFC / BIM | `packages/core-bim` — ifc-parser, element-extractor, clash-detector, gltf-converter | **Present, unverified** |
| Storage / OCR | `packages/storage` — storage, ocr, image-processing | Operational |
| PG County jurisdiction record | `packages/seeds/src/jurisdictions/dmv.jurisdictions.seed.ts` + `prisma/seed-jurisdictions.ts` | **Operational** — DPIE, Accela `dpie.mypgc.us`, ProjectDox `eplans.mypgc.us` |

## 2. Operational / partial / mocked / missing

**Operational:** digital twin, storage, OCR, PDF generation, nationwide geocoding,
ArcGIS query pattern (4 non-PG jurisdictions), PG jurisdiction metadata.

**Partial:** provenance model (has CRS + linear unit; lacks datums, accuracy class,
reliability level, responsible professional).

**Schema-only — the single largest finding:** every site-plan table
(`site_plan_workflows`, `site_plan_stage_executions`, `site_plan_compliance_results`,
`professional_review_records`, `site_source_datasets`, `site_constraints`,
`site_terrain_models`, `jurisdiction_rule_versions`) exists in `schema.prisma`,
**appears in no migration**, and is referenced by **zero TypeScript**. These tables do
not exist in the live database.

**Missing entirely:** no `os-engineering` module; no CAD/DXF writer (`ezdxf` and
equivalents absent — the only DXF hits are file-type detection and a v30 floorplan
export); no LandXML; no PostGIS extension in use (GeoJSON in JSONB, with a comment
saying PostGIS is "populated as an indexed projection by the migration when
available" — that migration does not exist); no LiDAR/PDAL; no survey parser
(PDF/DWG/CSV/LandXML/LAS); no hydrology/SWMM; no sheet-template engine; no
PG County rule pack.

**Stale data defect found:** the seeded PG GIS URL `pgcgis.mypgc.us` **has no DNS
record**. The seed's own note says "verify subdomains annually" — it was not. The
live M-NCPPC endpoint is `https://gisdata.pgplanning.org/arcgis/rest/services`
(ArcGIS 11.5), verified working.

## 3. Live PG County data path — verified this session

- Census geocoder → `4500 Rhode Island Ave, Brentwood, MD 20722` → Prince George's
  County, FIPS 24033.
- **CORRECTION (same session):** `Map_Services/C_I_Z/MapServer/6` "Plan 2035 Zoning"
  returns `R-55`, `U-L-I`, `C-M` — these are **superseded pre-2022 codes**. Prince
  George's County replaced its Zoning Ordinance effective **1 April 2022**. Building a
  rule pack on that layer would have encoded the wrong ordinance.
  The correct source is
  `Applications/ZoningCertificationLetter/MapServer`:
  **layer 59 `Zoning (Full Description)` = current (2022)**, and
  layer 65 `Zoning Prior (Full Description)` = the legacy ordinance, retained for
  nonconforming-use and vested-rights analysis.
  Verified side by side on the same envelope: current returned `AG`, `IE`, `LMUTC`,
  `NAC`, `RMF-20`; prior returned `R-55`, `U-L-I`, `M-U-I`, `O-S`, `R-10`.
- Also live and queryable: `Applications/ZoningCertificationLetter` (address points,
  Chesapeake Bay Critical Area Overlay, Transit District Overlay, Planned Community,
  Special Exception), `Applications/Stream_and_Wetland_Buffer_Identifier` (ESA
  wetlands/stream/river, primary buffers, Environmental Strategy Areas),
  `Applications/Easement_Viewer`, `Applications/DPIE_Permits`.

**Critical CRS finding:** these layers are **EPSG:2248 (NAD83 Maryland State Plane,
US survey feet)** and the server does **not** honour `inSR=4326`. Queries must be
submitted in 2248. A point-in-polygon test on a geocoded address returns 0 hits
because the geocode lands on the street centerline (right-of-way) — the same
behaviour already handled in `authoritative-gis.ts` with a search buffer plus
customer confirmation. Reprojection must use PROJ/proj4 or an authoritative
geometry service; hand-rolled datum math is prohibited by the spec and by good sense.

## 4. Shortest production sequence

1. **Migrate what already exists.** Generate the missing migration for the eight
   site-plan tables. Nothing else can be built until they exist.
2. **Extend provenance** on `SiteSourceDataset`: `horizontalDatum`, `verticalDatum`,
   `accuracyClass`, `reliabilityLevel` (0/1/2), `responsibleProfessionalId`.
3. **PG County connector** in `packages/spatial-engine/src/gis-client.ts` — add
   `prince_georges_md` pointing at `gisdata.pgplanning.org`, with EPSG:2248 handling
   and the buffer/candidate pattern. Fix the dead `pgcgis.mypgc.us` seed URL.
4. **Reliability gate + 5,000 sq ft disturbance classifier** — pure logic over the
   twin; no CAD needed; unblocks the applicability and missing-information reports.
5. **Reports 1–3** (applicability, missing-information, source & accuracy). These are
   deliverable, saleable, and carry no drafting risk.
6. **C-000 / C-100 / C-200** via `pdfkit`, driven from the twin.
7. Everything else (C-300…C-900, L-100, TCP/NRI, LandXML, DXF, SWMM).

## 5. Dependencies and licenses

Needed, not yet installed: `proj4` (MIT), `@turf/turf` (MIT), `ezdxf` (MIT, Python —
requires a Python sidecar or a JS DXF writer such as `@tarikjabiri/dxf`, MIT),
`pdal`/`laz-perf` (BSD), `geotiff` (MIT). Already present: `pdfkit` (MIT), `pdf-lib`
(MIT), `sharp` (Apache-2.0). PostGIS (GPL-2.0) would run server-side only, which does
not affect application licensing.

## 6. Test plan

Geometry (projection round-trip against the authoritative geometry service; ring
closure; area vs. recorded acreage), regulatory (each rule cites a live source URL and
a `lastVerifiedAt`; dead-URL check in CI — this audit found one), gate (disturbance
classifier boundary cases at 4,999 / 5,000 / 5,001 sq ft), provenance (no object
without source + CRS + datum + reliability level), refusal (permit-ready is
unreachable without Level 2 data; no seal without a `ProfessionalReviewRecord`),
cross-sheet (a single twin edit regenerates every affected sheet), and visual PDF
regression.

## Honest scope note

This specification is a civil-engineering CAD/GIS platform. Steps 1–5 are days.
Steps 6–7 — grading surfaces, drainage basins, SWM sizing, sediment control, CAD
export — are months, and the output is only lawful when a Maryland-licensed surveyor
and PE review and seal it. Kealee can produce a genuinely useful *preconstruction
site intelligence and coordination* package quickly; it cannot self-certify
engineering.
