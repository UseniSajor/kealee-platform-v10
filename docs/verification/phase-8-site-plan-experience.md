# Phase 8 Site-Plan Experience Verification

Date: 2026-07-22  
Status: Implemented locally; production deployment not performed

## Delivered surfaces

- Owner Portal displays authoritative seven-stage site-plan status, documents, approvals, and blockers.
- Command Center provides an organization-scoped operations queue and concept generator.
- m-engineer provides assignment-scoped professional review, rejection, and revision-request controls.
- The API provides authenticated workflow creation, transitions, generation, professional decisions, and operations status.
- The generator returns a printable vector PDF, DXF, GeoJSON, quantities, provenance, confidence, classification, and regulated-use warnings.

## Safety gates

- Automation fails closed unless `SITE_PLAN_AUTOMATION_ENABLED=true`.
- Generation requires an operations role, matching tenant, active `PLAN_GENERATION` stage, and idempotency key.
- Permit-ready output requires verified survey geometry, a current professional approval belonging to the workflow, immutable source/sealed evidence, and zero blocking compliance findings.
- Finalized professional decisions cannot be overwritten by a repeated or concurrent request.
- Generation does not apply a seal or represent a permit submission.

## Verification results

- Command Center TypeScript and production build: passed.
- API unit tests: 39 passed across 6 files, including 4 civil site-plan generation tests.
- Whitespace/error-marker validation (`git diff --check`): passed.
- API ESLint: unavailable because the API workspace has no discoverable ESLint configuration.
- m-engineer strict TypeScript and production build: passed after restoring its package dependencies and correcting legacy CSS/middleware types.
- concept-engine strict TypeScript and build: passed after updating legacy phase 2–4 callers to the current typed 3D geometry API.
- Production deployment and live provider/credential tests: not performed.

## Operational activation

Before production use, resolve the repository-wide build blockers, apply the site-plan database migration, set the feature flags, verify role and tenant claims, and run one sandbox project through concept generation, compliance, professional review, immutable release, and a simulated correction cycle.

Usage instructions: [Site-Plan Generator User Guide](../guides/site-plan-generator.md).
