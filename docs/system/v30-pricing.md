# v30 dynamic pricing (real-time)

## Model

- **Not fixed tier cards** on `/get-concept` — price is computed from an active **formula** stored in `v30_pricing_formulas`.
- **Premium / Premium+** (concept tiers 2 & 3) always include **Floorplan** in feature sets (`featuresForConceptTier`).
- **Floorplan add-on** scales by scope (`kitchen`, `whole_house`, `garden_landscape`, etc.) and sqft for whole-home layouts.
- **Pascal does not** generate delivery floorplans — **FloorplanBot** (Claude) + optional Replicate Recraft for plan images.

## Real-time updates

| Action | Effect |
|--------|--------|
| `PATCH /v30/admin/pricing` | Updates active row; version increments |
| Next `POST /api/v30/intake` or API `/v30/intake` | Uses new formula immediately |
| No redeploy | Formula is read from DB per request |

Portal-admin: `/pricing` → proxy `PATCH /api/v30/admin/pricing` with JSON body.

## Floorplan scope costs (defaults in code, overridable in DB)

| Scope | Typical use | Default base |
|-------|-------------|--------------|
| `room` | Single room | $80 |
| `kitchen` | Kitchen remodel | $140 |
| `bath` | Bathroom | $100 |
| `addition` | Addition / ADU | $220 |
| `whole_house` | Whole home (+ $0.08/sqft) | $280 + sqft |
| `garden_landscape` | Garden, deck, landscape layout | $175 |
| `kitchen` | Kitchen remodel layout | $140 |
| `bath` | Bathroom remodel layout | $100 |
| `addition` | Addition / ADU site plan on lot | $220 |

Premium / Premium+ tiers include **FloorplanBot** for kitchen, bath, addition, whole-home, garden, interior, and exterior scopes. Lot GIS (geocode + satellite when `GOOGLE_MAPS_API_KEY` is set) runs for all layout-heavy paths, not only garden/additions.
| `exterior` | Facade / exterior | $130 |

Store overrides in `featureCosts.floorplanScopeCosts` on the active formula row, or PATCH `floorplanScopeCosts` in admin API.

## Env

- v30 quotes: `KEALEE_V30_ENABLED`, `INTERNAL_API_URL` (web-main → API for `/v30/pricing/active`)
- Legacy tier checkout (`/concept/confirm`): still uses `@kealee/core-rules` `getIntakePrice` until fully migrated to `useV30Pricing`

## Garden / landscape permits

- **No Permits feature** on quote unless **irrigation** (or water utility scope) is indicated.
- Implemented in `scope-rules.ts` → `adjustPackageFeaturesForScope`.

## Lot layout (GIS / satellite)

- Intake geocodes address via **Nominatim** → `v30LotContext` on quote.
- **Google Static Maps** satellite (`GOOGLE_MAPS_API_KEY`) when set — used as Recraft img2img backdrop.
- **Google Earth Pro**: import CAD bundle `geoJson` point or open coordinates from deliverables.
- Full GIS parcel boundaries require survey/CAD import in professional tools (upsell path).

## CAD export (Premium+)

- `CADExport` feature → DXF + layout JSON via `cad-export.ts`.
- Download: `GET /api/v30/cad/:intakeId`
- End-to-end: webhook poll → `finalizeV30FloorplanDeliverables` (Recraft site plan + CAD).

## Security

Rotate Anthropic keys exposed in git history; use `.env.v30.keys` only (gitignored).
