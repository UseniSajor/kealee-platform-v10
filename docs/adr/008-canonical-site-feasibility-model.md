# ADR 008: Canonical site intelligence and feasibility model

Status: Accepted
Date: 2026-07-30

## Decision

Kealee will extend its existing land, feasibility, engineering, document, and
site-plan workflow domains rather than introduce a separate CAD product or bot.

- OS-Land owns parcel-linked source datasets, provenance, terrain metadata, and
  site constraints.
- OS-Feasibility owns versioned, seeded scenarios, alternatives, metrics, and
  pro-forma/estimate references.
- OS-Engineering owns deterministic geometry calculations, validation runs,
  drawing artifacts, and the isolated BullMQ worker execution boundary.
- `SitePlanWorkflow` owns lifecycle gates and the professional handoff.
- Existing Land, Feasibility, Permit, and Engineering orchestration is reused.
  No CAD or site-feasibility agent is added.

Versioned GeoJSON with an explicit projected CRS and unit is the canonical
geometry business record. PostGIS geometry columns are indexed projections for
spatial querying and validation. They do not replace source GeoJSON or its
checksum. IFC is the canonical open BIM export; DXF is the initial layered CAD
exchange format. Native DWG and Civil 3D object generation are out of scope.

Every source dataset records provider, retrieval/effective dates, license,
checksum, CRS, units, confidence, and raw artifact reference. Every scenario
records the rule-set version, solver version, random seed, inputs, objectives,
metrics, warnings, and review state. Rule results cite their source references.

LLMs may extract candidate source facts or explain a deterministic result. They
cannot set geometry, dimensions, zoning values, setbacks, terrain, utilities,
or compliance results without a traceable input. Client-ready selection and
exports require an existing professional-review gate.

All feasibility surfaces and artifacts display:

> Preliminary feasibility / not for construction / subject to licensed professional review.

## Consequences

The API and web runtimes remain lightweight. GDAL, PDAL, GRASS GIS, QGIS,
IfcOpenShell, Blender/Bonsai, and optional FreeCAD processing must execute in
isolated worker images. The initial coherent slice supports projected GeoJSON
Polygon input, a uniform conceptual setback, two reproducible options, exact
metrics/rule results, and the existing GeoJSON/DXF/PDF artifact path.

The centroid-based initial setback algorithm is intentionally conceptual. It
must not be described as an offset survey boundary. Production support for
non-convex parcels, holes, multiple setback edges, and topology repair requires
the PostGIS/Shapely geometry implementation and regression fixtures.

## Migration and rollback

Migration `20260730160000_site_feasibility_vertical_slice` adds only new tables,
enums, indexes, and nullable/defaulted columns. It does not rewrite existing
scenario rows. PostGIS projections are conditional on the earlier activation
migration. Rollback must first stop the engineering worker, archive any created
scenario/source records, drop the five new tables, remove the added scenario
columns, then drop the six new enum types. Production migration is blocked
until the unfinished `20260721120000_supabase_schema_reconciliation` migration
is reconciled through the existing database runbook.
