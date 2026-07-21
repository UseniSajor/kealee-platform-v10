# Concept package deliverables (canonical)

**Source of truth (code):** `packages/core-rules/src/concept-package-deliverables.ts`

**Rule — do not violate:**

- **Permit and zoning are included in every tier** (Basic, Premium, Premium+).
- Depth increases by tier; **agency filing and PE-stamped drawings are not included** unless purchased as separate SKUs (`permit_path_only`, `professional_drawings`).
- Never remove permit/zoning from marketing copy, `conceptOutput.includes`, checkout, or portal “what’s included.”
- Import deliverables from `@kealee/core-rules` — do not duplicate lists in apps.

## API

| Function | Use |
|----------|-----|
| `getConceptPackageDeliverableLabelsForSlug(slug, tier)` | Checkout / service pages (`kitchen`, `bathroom`, …) |
| `getConceptPackageDeliverableLabelsForIntake(projectPath, tier)` | `concept/generate`, portal by `kitchen_remodel`, etc. |
| `getPermitZoningLabels(family, tier)` | Emails — always list permit + zoning |
| `getFullTierMatrix(family)` | Docs / QA — all three tiers |
| `CONCEPT_PACKAGE_RULES` | Immutable product rules |

## Permit + zoning by tier (all services)

### Basic (tier 1)

- Zoning & buildability snapshot (allowed use, setbacks, feasibility flag)
- Permit scope brief — disciplines flagged and likely permit types
- Estimated permit fees and review timeline (informational — DMV/AHJ ranges)
- AHJ submittal checklist (what reviewers typically ask for next)

### Premium (tier 2) — includes Basic permit/zoning plus

- Zoning deep-dive — variance/HOA flags, overlay districts, buildability notes
- Permit-ready scope pack — AHJ / HOA / lender coordination checklist
- Likely trade permits (electrical, plumbing, mechanical) mapped to scope

### Premium+ (tier 3) — includes Premium permit/zoning plus

- Permit package credit — applied toward stamped plans or Kealee filing add-on
- Entitlement & special-exception notes when scope triggers extra reviews
- Structural / PE review requirement flagged when jurisdiction requires it

## Full package by tier (building / kitchen default)

Counts: renders = `TIER_IMAGE_COUNT` (3 / 6 / 12). Video: none / 60s / 4 formats.

### Basic

All **permit + zoning (Basic)** rows above, plus:

- Design concept summary — style, palette, and key features
- PDF design report (print-ready)
- Floor plan / layout direction (family-specific label)
- MEP scope brief
- 3 photorealistic renders (1920×1080)
- BOM with line-item costs + budget comparison (Basic · Standard · Luxury)
- Design concept fee credit toward permit-ready drawings (building paths)
- Video upgrade callout (not included)
- Owner portal — lifetime access, PDF download
- 1 revision · email support

### Premium

All **permit + zoning (Premium)** rows, plus everything in Basic **except** the video upgrade callout, replaced by:

- 6 enhanced renders (2560×1440)
- 2D architectural floor plan with MEP layers (family-specific)
- Editable BOM + DMV-market cost ranges
- 60-second AI transformation / installation process video
- 3 revisions · 30-day email support

### Premium+

All **permit + zoning (Premium+)** rows, plus everything in Premium, upgraded:

- 12 photorealistic renders (4K)
- Multi-layer 3D floor plan + CAD (DWG/DXF) where applicable
- 4 video formats (60s · 30s · 15s · 10s) + HD/4K download
- 15-minute expert consultation call
- 3 revisions · 90-day email support

## Service families

| Family | Slugs / intake paths | Notes |
|--------|----------------------|--------|
| `kitchen` | `kitchen`, `kitchen_remodel` | Kitchen plan + MEP labels |
| `bathroom` | `bathroom`, `bathroom_remodel` | Bath plan + wet zone |
| `garden` | `garden`, `garden_concept` | Site/plant/irrigation; permit/zoning still included |
| `exterior` | `facade`, `deck`, `exterior_concept` | Elevations + exterior systems |
| `addition` | `addition`, `addition_expansion` | Site plan + structural brief at Premium+ |
| `whole-house` | `whole-house`, `whole_home_*` | Multi-room plan + phase plan |
| `design-only` | `design-services` | Mood board / palette — permit/zoning still included |
| `building` | default interior, `design_build`, bundle | Generic remodel copy |

Run `getFullTierMatrix('kitchen')` in a script to print the exact list for QA.

## Wiring checklist (when changing packages)

1. Edit `concept-package-deliverables.ts` only.
2. `pnpm --filter @kealee/core-rules build`
3. Verify: `concept/confirm`, `services/[slug]`, `concept/generate`, `concept-ready` email, portal deliverables header.
4. Update this doc if tier rules change.
