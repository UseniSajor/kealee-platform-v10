# os-engineering Phase 1 Runbook

1. Enable `SITE_PLAN_AUTOMATION_ENABLED`, `ENGINEERING_INFILL_PHASE1_ENABLED` and only the provider-specific flags that are configured.
2. Keep `ENGINEERING_PROFESSIONAL_REVIEW_REQUIRED=true`.
3. Verify PostGIS, run reviewed Prisma migrations and confirm RLS/no browser grants.
4. Create a site-plan workflow with a supported jurisdiction.
5. Upload and scan source documents; verify duplicate hash and project ownership.
6. Review OCR/extracted values beside the source document.
7. Verify boundary closure, topology, units, CRS and datum.
8. Run geometry, terrain, stormwater, sediment and compliance tools.
9. Generate DXF/vector PDF/report package.
10. Assign a licensed professional, resolve redlines, upload the independently sealed artifact and release only after all guards pass.

On failure, retain stage inputs/audit history, retry with the same idempotency key, and never delete prior verified revisions. Provider jobs should be cancelled through the worker and temporary files cleaned.

The production database image must be PostgreSQL 17 compatible and include
PostGIS (the Railway reference image is `postgis/postgis:17-3.5`). Before an
in-place image change, create a custom-format `pg_dump` on the persistent volume
and validate it with `pg_restore --list`. Confirm the service is healthy before
running `CREATE EXTENSION postgis`, then verify `PostGIS_Full_Version()`, the
engineering geometry GiST index, RLS, and pre-migration row counts. Revert the
service image if startup fails; do not attempt an ephemeral package install in a
running database container.
