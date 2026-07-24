# Phase 1 Infill Architecture

`os-land` resolves property identity and government-source facts into the Digital Twin. `os-engineering` consumes referenced, provenance-bearing inputs and performs deterministic survey, geometry, terrain, drainage, sediment-control and drawing calculations. Permit and Marketplace agents consume structured results; they do not calculate geometry.

The Phase 1 workflow has sixteen ordered, idempotent stages in `packages/os-engineering/src/phase1.ts`. Existing seven-stage workflow records remain compatible. Heavy provider tasks belong on the existing BullMQ worker infrastructure. Calculation functions remain synchronous and deterministic so workers and tests can call the same implementation.

Business data is stored by Prisma. Versioned geometry is stored as GeoJSON plus an indexed PostGIS projection. Verification creates a new version; it never overwrites the source value. Public-schema engineering tables have RLS enabled and receive no browser-role grants.

DXF/vector PDF generation reuses `concept-engine`. Civil 3D is an optional professional final-authoring environment and is not required for Phase 1.
