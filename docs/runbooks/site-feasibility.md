# Site intelligence and feasibility

## Runtime boundaries

The API validates tenancy, persists provenance, and enqueues work. The existing
engineering worker performs deterministic site-fit calculations. Heavy
GIS/BIM jobs use `services/engineering-worker/Dockerfile.gis-bim`; never add
QGIS, Blender, or FreeCAD to a web/API deployment.

Required existing environment:

- `DATABASE_URL`
- `DIRECT_URL` for controlled migration execution
- `REDIS_URL`
- storage variables already consumed by `@kealee/storage`
- `ENGINEERING_JOB_TIMEOUT_MS` and `ENGINEERING_WORKER_CONCURRENCY`

Optional worker overrides:

- `ENGINEERING_PYTHON`
- `ENGINEERING_PROCESSOR`
- `ENGINEERING_GIS_WORKER_IMAGE`
- provider-specific parcel, zoning, flood, soils, and terrain credentials

Provider adapters must return source URL, license, retrieved/effective date,
CRS, units, checksum, confidence, and jurisdiction. An unavailable provider is
a structured missing-source result, never sample data.

## Initial flow

1. Start or select the existing project site-plan workflow.
2. Upload a projected GeoJSON Polygon in feet and identify its CRS.
3. Supply at least one authoritative zoning/rule URL and explicitly mark
   whether a human verified it.
4. The API creates a versioned source dataset and feasibility scenario.
5. BullMQ runs the seeded deterministic solver and persists two alternatives
   plus idempotent validation runs.
6. The owner UI compares exact metrics and rule warnings.
7. Existing engineering drawing jobs generate layered DXF/vector PDF/report
   artifacts; GeoJSON is retained on each option.
8. Existing professional review must approve the selected concept before it is
   client-ready. Approval is distinct from professional sealing.

Every result must display: “Preliminary feasibility / not for construction /
subject to licensed professional review.”

## Migration safety

Do not deploy the new migration while Prisma reports an unfinished earlier
migration. Reconcile migration history, activate PostGIS, test against a clone,
then run the normal migrate-deploy path. Validate extension, geometry columns,
GiST indexes, RLS, tenant access, and rollback backup before production.
