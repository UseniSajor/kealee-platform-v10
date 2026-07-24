# os-engineering Phase 1 Verification

Verified on 2026-07-23:

- Prisma modular schema merge and validation passed: 448 models, 253 enums.
- `@kealee/os-engineering` TypeScript build passed.
- Focused Vitest suite passed: 16 tests across Phase 1 calculations, DXF/vector PDF and document extraction.
- The Phase 1 persistence migration was applied to the configured production Railway PostgreSQL database.
- Nine engineering tables were verified with RLS enabled.
- PostGIS 3.3.7 was activated on the production Supabase PostgreSQL 17.6
  database in the `extensions` schema. GEOS 3.12.1, PROJ 9.4.0 and an SRID
  4326 geometry round trip were verified.
- The Supabase deployment contains all nine Phase 1 engineering tables,
  `engineering_geometries.spatialGeometry`, and the
  `engineering_geometries_spatial_gist_idx` GiST index.
- RLS is enabled on all nine engineering tables, and neither `anon` nor
  `authenticated` has direct table grants.
- Existing production site-plan tables and eight DMV source-registry rows were previously verified.
- The isolated engineering worker compiles and its Python processor passes
  byte-code compilation. It implements local PaddleOCR/Tesseract extraction,
  PROJ coordinate transformation, SciPy terrain/contours, drainage screening,
  DXF, SVG preview, vector PDF and report artifacts.
- Heavy extraction and generation routes enqueue typed BullMQ jobs. Drawing
  artifacts are stored through the existing private document service and exposed
  through project-authorized, expiring signed-download routes.
- Command-center TypeScript validation passed. The focused Phase 1 suite passed
  12/12 in the latest worker integration verification.
- A pre-PostGIS custom-format Railway backup was created and validated with
  `pg_restore --list` (3,982 entries).

The focused fixtures cover DMS/bearings, closure, topology, envelope/footprint, coverage, LOD, points/slope/cut-fill, runoff, BMP fit, sediment quantities, intake, sheets, workflow idempotency, eligibility disclaimers, extraction and release guards.

The isolated worker deployment remains blocked by Railway's `Your trial has
expired. Please select a plan` account gate. The owner ordering/timeline and
engineering UI are implemented locally, but a full browser-to-worker-to-
database production fixture cannot truthfully pass until the worker is
deployed. GeoJSON remains the versioned source representation, with PostGIS as
the indexed native spatial projection.
