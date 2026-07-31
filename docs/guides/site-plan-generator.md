# Site-Plan Generator User Guide

The generator creates a versioned civil site-plan package as PDF, DXF, and GeoJSON from coordinate geometry derived from a plat, survey, or verified site dataset. It operates inside the seven-stage site-plan workflow and records generation metadata in the project audit history.

## What you receive from a plat or survey

The PDF contains the plan name, revision, classification, units, coordinate reference system, north arrow, scaled-to-sheet linework, layer labels, source/authority/confidence entries, calculated areas, and the applicable concept or professional-release warning. DXF and GeoJSON retain the coordinate-accurate geometry for CAD and GIS use.

The package can show property boundaries, existing and proposed structures, setbacks, easements, rights-of-way, contours, utilities, storm drainage, stormwater facilities, erosion controls, limits of disturbance, tree/woodland areas, floodplain, stream buffers, wetlands, and annotations—but only when those features are present in the supplied or extracted geometry. The generator does not invent a missing feature.

A recorded plat, GIS layer, or unverified extraction produces concept output. A current boundary/topographic survey can support a permit-ready workflow only after its geometry is verified, compliance blockers are resolved, and a licensed professional approves the controlled artifact. Uploading a document does not itself create a new survey or apply a seal.

## Before you start

An administrator must set `SITE_PLAN_AUTOMATION_ENABLED=true` and keep `PROFESSIONAL_REVIEW_REQUIRED=true`. Your account must have an `admin`, `super_admin`, `pm`, or `operations` role. The project must already have a site-plan workflow, and operations must advance it to `PLAN_GENERATION` and start that stage.

Prepare source geometry for the property boundary and any available structures, setbacks, easements, contours, utilities, buffers, or disturbance limits. Every geometry item needs:

- coordinates in one declared coordinate reference system (CRS);
- a supported civil layer;
- a source document or official dataset identifier;
- the source retrieval timestamp;
- an authority classification and confidence from 0 to 1.

Do not label GIS or aerial-screened geometry as surveyed geometry.

## First-hour portal delivery

When intake is accepted and the configured parcel, zoning, and permit sources are available, the portal may publish these automated outputs within one hour without human interaction:

- project summary and stated site goal;
- jurisdiction, parcel, and source-status record;
- preliminary zoning, overlay, setback, and likely permit-path requirements;
- known constraints, assumptions, confidence, limitations, and open questions; and
- a readiness checklist showing which documents and reviews are complete, pending, or still required.

These are source-based preliminary outputs. They do not represent a boundary survey, professional verification, permit approval, seal, or permit submission. The full site-plan drawing package, concept imagery, video, and any professional review remain on their stated multi-day or scoped timeline.

## Generate through Command Center

1. Sign in to Kealee Command Center.
2. Select **Site Plans** in the navigation.
3. Find the project. The **Generate** button becomes available only during the Plan Generation stage.
4. Select **Generate**.
5. Enter a plan name and the CRS, such as `EPSG:2248` for an appropriate Maryland State Plane workflow. Confirm the CRS against the source data; do not copy the example blindly.
6. Paste the geometry JSON. Replace the example boundary, `sourceId`, timestamp, authority, and coordinates with the project data.
7. Select **Generate concept**.
8. Download the PDF, DXF, and GeoJSON artifacts. Store them in the controlled project document workflow before advancing the stage.

The initial UI intentionally produces `CONCEPT` output. It carries the warning `CONCEPT ONLY — NOT A BOUNDARY SURVEY OR PERMIT-READY PLAN`.

## Geometry example

```json
[
  {
    "id": "property-boundary",
    "layer": "BOUNDARY",
    "vertices": [
      { "x": 0, "y": 0 },
      { "x": 100, "y": 0 },
      { "x": 100, "y": 80 },
      { "x": 0, "y": 80 }
    ],
    "closed": true,
    "authority": "SURVEYED",
    "sourceId": "project-survey-document-id",
    "sourceRetrievedAt": "2026-07-22T18:00:00.000Z",
    "confidence": 1
  }
]
```

Supported layers include `BOUNDARY`, `EASEMENTS`, `RIGHT-OF-WAY`, `EXISTING-CONTOURS`, `PROPOSED-CONTOURS`, `EXISTING-STRUCTURES`, `PROPOSED-STRUCTURES`, `SETBACKS`, `UTILITIES`, `STORM-DRAIN`, `SWM-BMP`, `EROSION-CONTROL`, `LIMIT-OF-DISTURBANCE`, `TREE-SAVE`, `WOODLAND-CLEARING`, `FLOODPLAIN`, `STREAM-BUFFER`, `WETLAND`, and `ANNOTATIONS`.

## API usage

Operations integrations can call:

```http
POST /api/site-plans/{workflowId}/generate
Authorization: Bearer {accessToken}
Content-Type: application/json
```

```json
{
  "idempotencyKey": "project-123-revision-1",
  "name": "Project 123 site plan",
  "units": "FEET",
  "crs": "EPSG:2248",
  "revision": 1,
  "surveyVerified": false,
  "requestedClassification": "CONCEPT",
  "geometry": []
}
```

Use a stable, unique idempotency key for each workflow revision. The response contains `artifact.pdfBase64`, `artifact.dxf`, `artifact.geoJson`, calculated polygon-area quantities, warnings, and an audit summary.

## Permit-ready release

API clients may request `PERMIT_READY` only after all of these conditions are true:

1. all plan geometry is `OFFICIAL`, `SURVEYED`, `VERIFIED`, or `PROFESSIONALLY_CERTIFIED`;
2. `surveyVerified` is true;
3. a valid `professionalApprovalId` is supplied;
4. blocking compliance findings are resolved;
5. the professional separately reviews and seals the immutable deliverable.

Generation alone never applies a professional seal and never submits a permit. A licensed professional uses the **Site Plan Reviews** page in m-engineer to request revisions or reject the work. Approval and sealing use the controlled signing workflow. Customers can follow authoritative progress in Owner Portal under **Site Plans**.

## Corrections

When an agency issues comments, operations records a correction cycle, assigns each comment, generates a new numbered revision, obtains renewed professional approval, and attaches resubmission evidence. Never modify or replace a previously sealed artifact in place.

## Common errors

- **Site-plan automation is disabled**: enable the server-side feature flag and restart the API.
- **Plan generation stage must be started**: advance and start `PLAN_GENERATION` through the workflow event API.
- **Geometry lacks provenance**: add `sourceId` and an ISO-8601 `sourceRetrievedAt` value.
- **Permit-ready output contains unverified geometry**: correct the authority classification only after verification; do not bypass the gate.
- **Operations access denied**: use an authorized role in the workflow's organization.
