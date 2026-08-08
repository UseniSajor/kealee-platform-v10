# Missing Catalogue Data & Engine Defects — 5213 Call Place SE

Generated for the group-home (R-2) estimate. This documents (a) a genuine
engine defect found while running the estimate, and (b) the catalogue
assemblies Kealee should add so this building type can be estimated natively
instead of with temporary allowances.

> **No production catalogue or mapping data was modified.** All recommendations
> below are proposals requiring approval before seeding.

---

## 1. DEFECT — new-construction project types resolve to ~$0

`packages/estimating/src/project-type-mappings.ts` maps every new-construction
project type to assembly codes that **do not exist** in
`packages/estimating/src/seed-assemblies.ts` (`MARKETPLACE_ASSEMBLIES`, 616
codes). `EstimatingService.calculateSuggestedPrice()` silently skips unmatched
codes (`if (!assembly) continue`), so these types return a near-zero estimate.

Empirically executed (`scripts/run-engine.mjs` → `output/engine-run-diagnostics.json`):

| Project type | Mapped codes resolved | Result |
|---|---|---|
| `modular_home` | 0 / 11 | **$0** |
| `mixed_use_new` | 1 / 22 | unusable |
| `small_apartment_new` | 1 / 20 | unusable |
| `duplex_new` / `triplex_new` / `fourplex_new` / `townhouse_new` | 2 / 21 | unusable |
| `adu_new` | 2 / 19 | unusable |
| `kitchen_renovation` | 5 / 15 | partial |
| `bathroom_remodel` | 6 / 15 | partial |

**Root cause:** mapping uses a different code namespace than the catalogue.

| Mapping code (does not exist) | Correct catalogue code |
|---|---|
| `FND-SLAB-4IN` / `FND-SLAB-6IN` | `CONC-POUR-4` / `CONC-POUR-6` (+ `CONC-REBAR`) |
| `FRM-WALL-2X4` / `FRM-WALL-2X6` | `FRAME-WALL-2X4` / `FRAME-WALL-2X6` |
| `FRM-FLOOR-2X10` | `FRAME-FLOOR-2X10` |
| `FRM-ROOF-TRUSS` | `FRAME-ROOF-TRUSS` |
| `ROOF-SHINGLE-ARCH` | `ROOF-SHING-ARCH` |
| `ROOF-MEMBRANE` | `ROOF-FLAT-TPO` |
| `EXT-SIDING-LAP` | `SID-FC-LAP` / `SID-VINYL` |
| `MEP-ELEC-PANEL` | `ELEC-PNL-200` / `ELEC-PNL-400` |
| `MEP-PLUMB-ROUGH` | `PLUMB-DWV-LF` + `PLUMB-SUPPLY` (+ fixtures) |
| `MEP-HVAC-SPLIT` / `MEP-HVAC-MINI` | `HVAC-MINI-MULTI` / `HVAC-MINI-SINGLE` |
| `MEP-FIRE-SPRINK` | *(none — see §3, Div 21)* |
| `GEN-SITE-PREP` | *(none — add; use `SITEWORK` category)* |
| `GEN-CLEANUP` | `GEN-CLEANUP-ROUGH` / `GEN-CLEANUP-FINAL` |
| `GEN-PERMIT` / `GEN-DUMPSTER` | `GEN-PERMIT-RES` / `GEN-DUMP-30` |
| `KIT-CAB-STD` / `KIT-COUNT-GRAN` | `KIT-CAB-STD-BASE` / `KIT-CT-GRANITE` |
| `STOREFRONT-GLASS` / `MOD-UNIT-STD` | *(none — add)* |

**Recommended fix (not applied):** correct the code namespace in
`project-type-mappings.ts` for all new-construction types. This is a real bug
but was out of scope to change without approval; the estimate below does not
depend on it.

---

## 2. GAP — no R-2 / group-home / residential-care project type

`PROJECT_TYPE_ASSEMBLIES` has no institutional/congregate-care type. Proposed
addition (uses only real catalogue codes; qty per GSF or fixed):

```ts
group_home_new: {
  name: 'Group Home / Residential Care (R-2)',
  defaultSqft: 5920,
  assemblies: [
    { code: 'GEN-PM-WEEKLY',    quantityPer: 'fixed', quantity: 52 },
    { code: 'GEN-ENGINEER',     quantityPer: 'fixed', quantity: 1 },
    { code: 'FOUND-FOOTER-NEW', quantityPer: 'sqft',  multiplier: 0.027 }, // ~perimeter LF
    { code: 'CONC-POUR-4',      quantityPer: 'sqft',  multiplier: 0.25 },  // cellar slab
    { code: 'CONC-REBAR',       quantityPer: 'sqft',  multiplier: 0.25 },
    { code: 'FOUND-WP-EXT',     quantityPer: 'sqft',  multiplier: 0.027 },
    { code: 'SID-BRICK-VEN',    quantityPer: 'sqft',  multiplier: 0.4 },
    { code: 'FRAME-FLOOR-2X10', quantityPer: 'sqft',  multiplier: 0.75 },
    { code: 'FRAME-WALL-2X6',   quantityPer: 'sqft',  multiplier: 0.08 },
    { code: 'FRAME-WALL-2X4',   quantityPer: 'sqft',  multiplier: 0.15 },
    { code: 'FRAME-SHEATH-WALL',quantityPer: 'sqft',  multiplier: 0.8 },
    { code: 'FRAME-ROOF-TRUSS', quantityPer: 'fixed', quantity: 20 },
    { code: 'FRAME-STAIR',      quantityPer: 'fixed', quantity: 4 },
    { code: 'FRAME-INSUL-BATT', quantityPer: 'sqft',  multiplier: 0.8 },
    { code: 'ROOF-FLAT-TPO',    quantityPer: 'sqft',  multiplier: 0.0025 },
    { code: 'DRY-HANG-STD',     quantityPer: 'sqft',  multiplier: 3.4 },
    { code: 'DRY-TAPE-L4',      quantityPer: 'sqft',  multiplier: 3.4 },
    { code: 'FLR-LVP',          quantityPer: 'sqft',  multiplier: 0.7 },
    { code: 'FLR-TILE-PORC',    quantityPer: 'fixed', quantity: 840 },
    { code: 'PAINT-INT-WALL',   quantityPer: 'sqft',  multiplier: 3.4 },
    { code: 'DOOR-INT-SOLID',   quantityPer: 'fixed', quantity: 45 },
    { code: 'DOOR-EXT-STEEL',   quantityPer: 'fixed', quantity: 3 },
    { code: 'WIN-VIN-DH',       quantityPer: 'fixed', quantity: 34 },
    { code: 'BATH-TOIL-STD',    quantityPer: 'fixed', quantity: 7 },
    { code: 'BATH-TUB-STD',     quantityPer: 'fixed', quantity: 7 },
    { code: 'BATH-VAN-STD',     quantityPer: 'fixed', quantity: 7 },
    { code: 'BATH-ACC-GRAB',    quantityPer: 'fixed', quantity: 21 },
    { code: 'PLUMB-GAS-LINE',   quantityPer: 'fixed', quantity: 180 },
    { code: 'HVAC-MINI-MULTI',  quantityPer: 'fixed', quantity: 4 },
    { code: 'BATH-VENT-STD',    quantityPer: 'fixed', quantity: 7 },
    { code: 'ELEC-PNL-400',     quantityPer: 'fixed', quantity: 1 },
    { code: 'ELEC-PNL-200',     quantityPer: 'fixed', quantity: 2 },
    { code: 'ELEC-SMOKE',       quantityPer: 'fixed', quantity: 14 },
    { code: 'ELEC-CAT6',        quantityPer: 'fixed', quantity: 20 },
    { code: 'GEN-DUMP-30',      quantityPer: 'fixed', quantity: 10 },
    { code: 'GEN-CLEANUP-FINAL',quantityPer: 'sqft',  multiplier: 1.0 },
  ],
}
```

This resolves ~40 real catalogue codes but still leaves the institutional
scope in §3 uncovered.

---

## 3. NEW ASSEMBLIES to add to `MARKETPLACE_ASSEMBLIES`

The catalogue is residential-remodel oriented. The following scope has **no
assembly** and was priced as a labeled temporary allowance in this estimate.
Full machine-readable list: `output/missing-catalogue-items.json` (66 allowance
lines). Highest-priority additions:

| Div | Proposed code | Assembly | Unit |
|---|---|---|---|
| 01 | `GEN-SUPER-MONTHLY` | Site superintendent (monthly) | mo |
| 01 | `GEN-MOBILIZATION` | Mobilization / demobilization | ls |
| 01 | `GEN-TESTING-SI` | Testing & special inspections | ls |
| 03 | `CONC-WALL-CIP-8` | 8" cast-in-place foundation wall (form+rebar+pour) | sqft |
| 03 | `CONC-ELEV-PIT` | Elevator pit | ea |
| 04 | `MAS-CMU-8` | 8" CMU wall (loadbearing/backup) | sqft |
| 04 | `MAS-LINTEL` | Steel lintels & masonry flashing | ls |
| 06 | `FRAME-ELEV-SHAFT` | Elevator hoistway framing + rated enclosure | ea |
| 07 | `SEV-FIRESTOP` | Firestopping / rated assemblies (Type III) | sqft |
| 09 | `CEIL-ACT` | Suspended acoustical ceiling | sqft |
| 14 | `ELEV-HYDRO-2STOP` *(excluded)* | Passenger elevator equipment + install | ea |
| 21 | `FIRE-SPRINK-NFPA13` | Wet sprinkler system, NFPA 13 | sqft |
| 21 | `FIRE-STANDPIPE` | Fire service / standpipe / FDC | ls |
| 22 | `PLUMB-COMKIT-ROUGH` | Commercial-kitchen plumbing/gas rough-in | ls |
| 23 | `HVAC-SPLIT-DUCTED` | Ducted split system (cond + air handler) | ea |
| 23 | `HVAC-KIT-HOOD-BASE` | Kitchen hood curb + exhaust/MUA ductwork (base-bldg) | ls |
| 26 | `ELEC-SERVICE-400` | Electrical service & metering | ea |
| 26 | `ELEC-EMERG-EGRESS` | Emergency / exit / egress lighting | ea |
| 28 | `FA-ADDRESSABLE-R2` | Addressable fire alarm (R-2) | sqft |
| 28 | `SEC-ACCESS-CONTROL` | Security / access control / intercom | ls |
| 31 | `EARTH-EXCAV-CELLAR` | Mass & foundation excavation | cy |
| 33 | `UTIL-WATER-SVC` / `UTIL-SEWER-SVC` / `UTIL-GAS-SVC` | Utility service connections | ls |

Each proposed assembly should carry low/mid/high material & labor, `laborHoursPerUnit`,
and the shared DC-Baltimore `regionMultiplier`, matching the existing schema in
`seed-assemblies.ts`.
