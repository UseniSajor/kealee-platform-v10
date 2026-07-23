# Site-Plan Production Runbook

## Workflow

Create via `POST /api/site-plans/projects/:projectId`. Apply transitions through `POST /api/site-plans/:workflowId/events` with expected version and unique event ID.

Stages run sequentially: parcel resolution, document collection, feasibility, plan generation, compliance audit, professional review, and submission/corrections. Every stage records prerequisites, attempts, inputs/outputs, blockers, assignee, timestamps, and review state.

## Geometry

The concept-engine civil exporter owns structured geometry, CRS, units, layers, provenance, confidence, quantities, DXF, and GeoJSON. GIS/aerial geometry is always labeled screening/concept data. Permit-ready output rejects unverified survey geometry and missing professional approval.

Operator and API instructions are in [Site-Plan Generator User Guide](../guides/site-plan-generator.md).

## Compliance and release

Checks return PASS, WARNING, FAIL, NOT_APPLICABLE, MISSING_DATA, or PROFESSIONAL_DETERMINATION_REQUIRED. A blocking result prevents permit-ready labeling and submission.

`m-engineer`/Marketplace professionals control regulated review and sealing. Release requires jurisdiction-verified, unexpired license; APPROVED decision; professional-controlled seal action; distinct valid source/sealed hashes; and no compliance blocker.

## Submission

Use staff-assisted submission whenever a portal API is unavailable or unauthorized. Record exact instructions, authorization, fees, confirmation/reference, timestamps, and uploaded evidence. Never report a portal submission from an attempted browser action alone.

Agency comments enter a correction cycle, are classified/assigned, require response and revision references, then professional reapproval and resubmission evidence.
