# Construction Estimate — 5213 Call Place SE, Washington DC 20019

**New-construction detached group home / residential care facility (R-2), Type IIIB**
Cellar + 3 above-grade stories · 1,480 SF footprint · **5,920 GSF** · ~35'-4" tall
~8 bedrooms · 14 beds · 7 bathrooms · 1 commercial kitchen · 1 passenger elevator

Produced through the Kealee estimating catalogue (`packages/estimating`,
`MARKETPLACE_ASSEMBLIES`, DC-Baltimore 2024-25) and the engine's markup
structure. Reproduce with:

```bash
node docs/estimates/5213-call-place-se/scripts/run-engine.mjs      # engine + defect proof
node docs/estimates/5213-call-place-se/scripts/build-estimate.mjs  # this estimate + exports
```

---

## ⚠️ Read first — scope of what was possible

1. **No permit PDF was available.** `/mnt/data/5213 E Call Place Permit Set.pdf`
   does not exist in this environment. **No measured takeoff was performed.**
   Every quantity is **CALCULATED** from the stated building basis or **ASSUMED**
   as a gross-area allowance, flagged per line in `output/quantity-takeoff.csv`.
   Confidence is **LOW–MED** throughout. Drawing/sheet references cannot be
   recorded because no drawings were accessible.
2. **The Kealee catalogue cannot natively price this building.** No group-home
   project type exists, the new-construction mappings are broken (→ $0), and the
   catalogue lacks institutional assemblies (elevator, sprinkler, fire alarm,
   commercial-kitchen rough-in, CMU, structural masonry). See
   `MISSING-CATALOGUE-ITEMS.md`. 40 lines use **real catalogue codes**; 66 are
   **labeled temporary allowances**.
3. **Not persisted to the database.** No `DATABASE_URL` / Prisma client is
   available here, so a `QuickEstimate` DB record was **not** created. The exact
   persistence path is documented in §"Database record" below.

---

## A. Executive summary

| Scenario | Total (excl. elevator + kitchen equip) | $/GSF | vs $170/SF target |
|---|--:|--:|--:|
| **A — Catalogue Market** | **$2,176,715** | **$368** | +116% |
| **B — Value-Engineered** | **$1,890,245** | **$319** | +88% |
| **C — Minimum Viable** | **$1,627,484** | **$275** | +62% |
| Target | $1,006,400 | $170 | — |

**Excluded equipment (shown separately, not in any total above):**
Elevator equipment allowance **$138,000** · Commercial-kitchen equipment
allowance **$120,500**.

**Recommended construction target: ~$275–$300/GSF ($1.63M–$1.78M base building).**
The **$170/SF ($1,006,400) target is not achievable** for a cellar+3, elevatored,
sprinklered, masonry-façade R-2 group home in Washington DC without deleting
code-required life-safety, accessibility, or structural scope. Even an aggressive
legitimate value-engineering pass (Scenario B) lands at **$319/SF**, and a
stripped minimum-viable code-compliant build (Scenario C) at **$275/SF**. The
gap is driven by small-building diseconomies of scale (5,920 SF absorbing a full
elevator, sprinkler system, commercial-kitchen rough-in, and 7 baths), the DC
regional factor (1.15), and masonry construction — not by excess finish quality.

---

## A2. CTC-catalogue cross-check (independent second pricing)

The same takeoff was re-priced against the **Construction Task Catalog**
(`data/ctc/ctc-tasks.json`, DMV-2026, JOC adjustment factor 1.10) —
`scripts/build-estimate-ctc.mjs`, exports `output/estimate-ctc.json` +
`output/estimate-ctc-lineitems.csv`.

| | Marketplace catalogue (Scenario A) | CTC catalogue |
|---|--:|--:|
| Total (excl. elevator + kitchen) | $2,176,715 | **$2,234,427** |
| $/GSF | $368 | **$377** |
| Delta | — | **+2.7%** |

Two unrelated catalogues landing within **2.7%** corroborates the ~$2.2M /
~$370-per-SF result and reinforces that **$170/SF is not achievable** for this
building. **But only 45.7% of direct cost maps to a real CTC task** — the
41-task sample cannot price 54% of the building (all of Div 04, 10, 12, 21,
27/28, 33 and most of MEP), which remains allowance. The licensed full
~4,666-task Gordian catalog is required to replace those allowances with priced
CTC line items.

## B / C. Detailed line items & CSI division summary

Full line-item detail: `output/estimate-lineitems-scenarioA.csv` (106 lines).

| Div | Description | Scenario A | Scenario B | Scenario C | A labor-hrs |
|---|---|--:|--:|--:|--:|
| 01 | General Conditions | $250,495 | $220,435 | $190,376 | 523 |
| 02 | Existing Conditions | $36,000 | $31,680 | $27,360 | 0 |
| 03 | Concrete | $138,198 | $121,614 | $105,030 | 381 |
| 04 | Masonry | $94,316 | $82,998 | $71,680 | 600 |
| 06 | Wood / Rough Carpentry | $155,418 | $136,768 | $118,117 | 785 |
| 07 | Thermal & Moisture | $50,861 | $44,757 | $38,654 | 84 |
| 08 | Openings | $65,663 | $57,783 | $49,904 | 210 |
| 09 | Finishes | $193,330 | $170,131 | $146,931 | 1,620 |
| 10 | Specialties | $14,134 | $12,438 | $10,742 | 21 |
| 12 | Furnishings (built-in) | $22,339 | $19,658 | $16,977 | 21 |
| 21 | Fire Suppression | $53,980 | $47,502 | $41,025 | 0 |
| 22 | Plumbing | $89,789 | $79,014 | $68,239 | 354 |
| 23 | HVAC | $99,371 | $87,446 | $75,522 | 352 |
| 26 | Electrical | $134,991 | $118,792 | $102,593 | 359 |
| 27/28 | Comms & Electronic Safety | $36,417 | $32,047 | $27,677 | 20 |
| 31 | Earthwork | $55,656 | $48,977 | $42,299 | 0 |
| 32 | Exterior Improvements | $32,500 | $28,600 | $24,700 | 0 |
| 33 | Utilities | $62,000 | $54,560 | $47,120 | 0 |
| | **Direct construction** | **$1,585,456** | **$1,395,202** | **$1,204,947** | **5,329** |

**Markups (mirroring `EstimatingService`: OH 12% / Profit 15% / Contingency 7%¹):**

| | Scenario A | Scenario B | Scenario C |
|---|--:|--:|--:|
| Direct construction | $1,585,456 | $1,395,202 | $1,204,947 |
| GC overhead (12%) | $190,255 | $167,424 | $144,594 |
| GC profit (15%) | $237,818 | $209,280 | $180,742 |
| Contingency (7% / 5% / 5%) | $110,982 | $69,760 | $60,247 |
| Bonds & insurance (1.5%) | $30,203 | $26,579 | $22,954 |
| Permit allowance (DCRA) | $22,000 | $22,000 | $14,000 |
| **TOTAL** | **$2,176,715** | **$1,890,245** | **$1,627,484** |
| **$/GSF** | **$368** | **$319** | **$275** |

¹ Overhead & profit are applied to the full direct cost (including subcontractor
value) per standard general-contractor practice — an extension of the engine's
base (which applies them to material + labor only) documented here for audit.
Contingency reduced to 5% in B/C as design certainty is assumed higher.

**Cost composition (Scenario A):** Material $408,802 · Labor $574,694 ·
Equipment $20,690 · Subcontractor $581,270 · **5,329 labor-hours**.
Schedules: `output/labor-hours.csv`, `output/material-schedule.csv`,
`output/subcontractor-schedule.csv`.

---

## D–I. Supporting schedules (generated files)

| Deliverable | File |
|---|---|
| D. Catalogue-item mapping (code, unit, rates) | `output/estimate-lineitems-scenarioA.csv` |
| E. Quantity takeoff (basis + confidence) | `output/quantity-takeoff.csv` |
| F. Labor-hours report | `output/labor-hours.csv` |
| G. Material schedule | `output/material-schedule.csv` |
| H. Equipment schedule | in `estimate.json` (equip column) |
| I. Subcontractor schedule | `output/subcontractor-schedule.csv` |
| K. Missing-catalogue-item report | `output/missing-catalogue-items.json` + `MISSING-CATALOGUE-ITEMS.md` |
| N. Estimate audit trail | `estimate.json.meta` + `engine-run-diagnostics.json` |
| O. JSON export | `output/estimate.json` |
| P. CSV export | 6 CSV files in `output/` |

---

## J. Exclusions & allowances (excluded-cost schedule)

**Excluded from the base-building total (owner to procure separately):**

**Elevator — $138,000 allowance**
Equipment ($68k), cab/doors/landing entrances ($22k), rails/controls/fixtures
($18k), installation ($24k), testing & DCRA certification ($6k).
*Included in base building:* elevator pit (Div 03), hoistway shaft framing +
2-hr rated enclosure (Div 06), electrical power rough-in & disconnect (Div 26).

**Commercial kitchen equipment — $120,500 allowance**
Type I hood ($14k), Ansul suppression ($6.5k), make-up-air unit if
equipment-scoped ($12k), walk-in refrigerator ($11k), walk-in freezer ($13k),
cooking equipment ($28k), dishwasher ($9k), stainless prep equipment ($12k),
loose/owner-furnished FF&E ($15k).
*Included in base building:* kitchen plumbing/gas rough-in (Div 22, $22k),
electrical rough-in (Div 26, $9.5k), hood curb + exhaust/MUA ductwork (Div 23,
$26k), and kitchen wall/floor/ceiling finishes (Div 09).

Also excluded: owner FF&E, furniture, window treatments, appliances beyond
base-building, and any hazardous-material abatement of existing structures
(unknown — no site data).

---

## L. Value-engineering recommendations (path to Scenario B, $319/SF)

Legitimate VE moves applied — **none delete code, life-safety, or accessibility scope**:

1. **Finishes (Div 09):** LVP in lieu of tile in bedrooms/common; Level-4 finish
   only where required; paint-grade trim. (~$23k)
2. **Masonry (Div 04):** brick veneer to street/return elevations only;
   fiber-cement or CMU+coating on non-visible elevations. (~$11k)
3. **General conditions (Div 01):** shared superintendent / working-foreman model
   for a 5,920 SF building; tighten 12-month schedule. (~$30k)
4. **HVAC (Div 23):** right-size to 4 zones; standard controls. (~$12k)
5. **Contingency:** 7% → 5% once design is fixed. (~$41k)
6. Competitive subcontractor buyout across MEP trades (2–3 bids/trade).

**Reaching $170/SF is not recommended** — the residual $149/SF gap after VE would
require removing the elevator, sprinkler system, or commercial-kitchen provisions,
all of which are code-required for an R-2 congregate-care occupancy in DC.

---

## M. Scenario comparison

| | A · Catalogue Market | B · Value-Engineered | C · Minimum Viable |
|---|---|---|---|
| Basis | Catalogue mid-tier rates | VE substitutions, 5% cont. | Catalogue low-tier, budget allowances |
| Finishes | Standard institutional | Durable/simplified | Basic durable |
| Total | $2,176,715 | $1,890,245 | $1,627,484 |
| $/GSF | $368 | $319 | $275 |
| $/bed (14) | $155,480 | $135,017 | $116,249 |
| Confidence | Low–Med | Low–Med | Low |
| Risk | Allowance-heavy | Buyout risk | Scope/quality risk |

---

## 15. Owner cash-flow summary (Scenario A base building)

| Metric | Value |
|---|--:|
| Base-building construction (excl. elevator + kitchen equip) | **$2,176,715** |
| Cost per GSF (5,920) | $368 |
| Cost per bed (14) | $155,480 |
| Cost per bedroom (8) | $272,089 |
| Cost per bathroom (7) | $310,959 |
| Separate elevator allowance | $138,000 |
| Separate kitchen-equipment allowance | $120,500 |
| **All-in incl. excluded allowances** | **$2,435,215** |

---

## Major assumptions

- Perimeter ~158 LF (≈40'×39' footprint); floor-to-floor 10'; façade gross ~4,740 SF.
- 3 elevated floors framed (4,440 SF); low-slope TPO roof over 1,480 SF.
- Drywall area ~20,000 SF (2.4× GSF walls + ceilings); interior partitions ~900 LF.
- 45 interior doors, 3 exterior doors, 34 windows, 7 tub/shower + 7 toilets +
  7 vanities, 10 lavatories/sinks, ~34 total plumbing fixtures.
- Four ducted split HVAC systems; NFPA-13 sprinklers; addressable R-2 fire alarm.
- 400A electrical service + two distribution panels.
- DC regional factor 1.15 (catalogue `regionMultiplier.DC`); 12-month schedule.

## Risks

- **Quantity risk is high** — no drawings were read; ±25–35% likely until a
  measured takeoff from the permit set is performed.
- Allowance-heavy (66 of 106 lines): elevator base-building interface, commercial
  kitchen rough-in, sprinkler, fire alarm, and site utilities are order-of-magnitude
  allowances pending drawings and trade bids.
- DC site/utility costs (Div 31/33) are highly parcel-specific and unverified.
- Type IIIB rated-assembly and special-inspection scope may increase once the
  code path and structural drawings are confirmed.

## Database record

Not created — no `DATABASE_URL`/Prisma client in this environment. To persist,
the live path is `EstimatingService.createEstimate()`
(`packages/estimating/src/estimating.service.ts`) → `prisma.quickEstimate.create`
→ table `quick_estimates`, viewable at the marketplace estimate route once a
`group_home_new` project type (see `MISSING-CATALOGUE-ITEMS.md`) is added and the
mapping defect is fixed. This estimate is exported to `output/estimate.json` in
the same shape (`materialTotal`, `laborTotal`, `subtotal`, `overhead`, `profit`,
`contingency`, `grandTotal`, `breakdown`, `assumptions`).
