# ADR-005: Services as Fastify Plugins (Dual-Mode)

**Status:** Accepted
**Date:** 2026-03-09
**Context:** Extracting monolithic modules into separate services requires a gradual migration path

## Decision

Each OS service (os-land, os-feas, os-dev, os-pm, os-pay, os-ops, marketplace) can run in two modes:
1. **Standalone:** Own Fastify instance on a dedicated port (3010-3016)
2. **Mounted:** Registered as routes in the main API gateway

During transition, services run mounted in the main API. As they mature, they can be deployed standalone with the main API proxying to them.

## Route Convention

- Main API legacy routes: `/pm/*`, `/payments/*`, `/marketplace/*` (unchanged)
- New v1 routes: `/api/v1/land/*`, `/api/v1/feasibility/*`, `/api/v1/dev/*`, etc.
- Both sets of routes coexist — zero breaking changes for existing clients

## Rationale

- No big-bang migration — services extract gradually
- Existing v10 API routes continue working unchanged
- Easy local development: run `pnpm dev` on main API and all services are available
- Production flexibility: can scale individual services independently when needed

## Consequences

- Duplicate route registrations during transition (both inline and service routes)
- Must keep route behavior consistent between inline and standalone modes
- Service discovery needed when running in standalone mode (environment variables for service URLs)
