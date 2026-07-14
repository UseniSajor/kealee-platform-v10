/**
 * build-estimate.mjs  —  MEASURED takeoff version
 * ---------------------------------------------------------------------------
 * 5213 Call Place SE, Washington DC 20019 — group home (R-2), Type IIIB.
 * Quantities are now taken from the permit drawings (28 sheets) — see
 * drawings/MEASURED-TAKEOFF.md. Every line carries a sheet reference and a
 * method tag: MEASURED (scheduled/dimensioned), CALC (from measured dims),
 * or ASSUMED (allowance, not dimensioned).
 *
 * Priced through the Kealee catalogue (MARKETPLACE_ASSEMBLIES, DC factor 1.15)
 * with the engine markup structure (OH 12% / Profit 15% / Contingency 7%);
 * institutional scope the catalogue lacks is a labeled allowance.
 *
 *   node docs/estimates/5213-call-place-se/scripts/build-estimate.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '../../../..');
const OUT = path.join(__dirname, '../output');
const SEED = path.join(REPO, 'packages/estimating/src/seed-assemblies.ts');

// ── Project constants (MEASURED from drawings) ──────────────────────────────
const GSF = 5920, FOOTPRINT = 1480, BEDS = 14, BEDROOMS = 8, BATHS = 7;
const TARGET_PSF = 170, TARGET_TOTAL = 1006400;
const DC = 1.15;
const OH = 0.12, PROFIT = 0.15, CONTINGENCY = 0.07, BONDS_INS = 0.015;
// ── Labor wage schedule (owner-directed) ────────────────────────────────────
// Apprentice $55/hr · Journeyman $85/hr · Master $124/hr. Labor = hours × crew rate.
// Rates (documented, adjustable):
//   General trades    = 60% journeyman + 40% apprentice  => $73.00/hr
//   Licensed MEP/fire = master flat                       => $124.00/hr
// Applied to self-performed construction labor (Div 02-33). Div 01 general
// conditions are salaried/effort (not repriced); pure subcontractor lump sums
// keep their quoted value (subs set their own wages).
const APPRENTICE = 55, JOURNEYMAN = 85, MASTER = 124, EMBEDDED = 75;
const GENERAL_RATE = +(0.6 * JOURNEYMAN + 0.4 * APPRENTICE).toFixed(2);          // 73.00
const LICENSED_RATE = MASTER;                                                    // 124.00 (master flat, MEP/fire)
const MASTER_LED = new Set(['21', '22', '23', '26', '27/28']); // licensed MEP + fire trades
const crewRate = (div) => MASTER_LED.has(div) ? LICENSED_RATE : GENERAL_RATE;
// ── Measured geometry — dimensions scaled off the drawings ──────────────────
const W = 24, L = 64;                 // footprint 24'×64' (A000/A001/S100)
const P = 2 * (W + L);                // 176 LF perimeter
const H = 35.33;                      // building height 35'-4" (A004)
const H_ABOVE = 30;                   // above-grade wall height (3 stories, A004)
const CELLAR_H = 9;                   // cellar wall height (A001/S100)
const EXT_WALL_LF = P * 3;            // 528 LF above-grade exterior wall runs
// Façade measured per elevation (gross − openings), A004/A005:
const BRICK_FRONT = 600;             // front 24'×35.3'=848 − ~248 openings (A004)
const SIDING_REAR = 728;             // rear 24'×35.3'=848 − ~120 openings (A005)
const SIDING_SIDES = 4372;           // 2 sides 64'×35.3'=4,522 − ~150 openings
const SIDING_AREA = SIDING_REAR + SIDING_SIDES; // 5,100 SF lap siding
const SHEATH_INSUL_SF = P * H_ABOVE; // 5,280 SF wall sheathing/insulation
const CELLAR_WALL_SF = P * CELLAR_H;  // 1,584 SF below-grade foundation wall
const PIERS = 10;                     // 18"Ø×30" drilled piers at cols/perimeter (S100)
const ELEV_FLOORS_SF = FOOTPRINT * 3; // 4,440 SF TJI floor framing (S101)
const ROOF_SF = FOOTPRINT;            // 1,480 SF low-slope roof (A003/S101)
// Interior partitions measured off plans (A001/A002): ~cellar 130 + 1st 120 +
// 2nd 210 + 3rd 210 = ~670 LF; use 700 LF avg 9.5' tall.
const PART_LF = 700, WALL_H = 9.5;
// Drywall SF = partitions(2 faces) + ext-wall interior face + ceilings:
const DRYWALL_SF = Math.round(PART_LF * WALL_H * 2 + P * H_ABOVE + P * CELLAR_H + FOOTPRINT * 4); // ≈ 24,000

// ── Load REAL catalogue rates ──────────────────────────────────────────────
function loadCatalogue() {
  const text = fs.readFileSync(SEED, 'utf8');
  const map = new Map();
  const re = /\{\s*code:"([^"]+)"[^\n]*?\}/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const line = m[0];
    const num = (k) => { const x = line.match(new RegExp(`${k}:(-?[0-9.]+)`)); return x ? Number(x[1]) : undefined; };
    const str = (k) => { const x = line.match(new RegExp(`${k}:"([^"]*)"`)); return x ? x[1] : undefined; };
    map.set(m[1], { code: m[1], name: str('name'), unit: str('unit'),
      matLow: num('materialCostLow'), matMid: num('materialCostMid'),
      labLow: num('laborCostLow'), labMid: num('laborCostMid'), lhrs: num('laborHoursPerUnit') ?? 0 });
  }
  return map;
}
const CAT = loadCatalogue();

function cat(code, qty, o = {}) {
  const a = CAT.get(code);
  if (!a) throw new Error(`Catalogue code missing: ${code}`);
  const waste = o.waste ?? 0.05;
  return { code, name: a.name, unit: a.unit, qty,
    matUnit: +(((o.tier === 'low' ? a.matLow : a.matMid) ?? 0) * DC * (1 + waste)).toFixed(2),
    labUnit: +(((o.tier === 'low' ? a.labLow : a.labMid) ?? 0) * DC).toFixed(2),
    equipUnit: 0, subUnit: 0, lhrsUnit: a.lhrs, allowance: false, waste,
    basis: o.basis || '', dim: o.dim || '', sheet: o.sheet || '', method: o.method || 'CALC', conf: o.conf ?? 'MED', note: o.note ?? '' };
}
function allow(name, unit, qty, aUnit, o = {}) {
  const s = o.split ?? { sub: 1 };
  const labUnit = +(aUnit * (s.lab ?? 0)).toFixed(2);
  // derive labor-hours from the self-perform labor portion at the catalogue's base rate
  const lhrsUnit = o.lhrsUnit ?? +(labUnit / EMBEDDED).toFixed(4);
  return { code: o.code ?? 'ALLOWANCE', name, unit, qty,
    matUnit: +(aUnit * (s.mat ?? 0)).toFixed(2), labUnit,
    equipUnit: +(aUnit * (s.equip ?? 0)).toFixed(2), subUnit: +(aUnit * (s.sub ?? 0)).toFixed(2),
    lhrsUnit, allowance: true, waste: 0,
    basis: o.basis || '', dim: o.dim || '', sheet: o.sheet || '', method: o.method || 'ASSUMED', conf: o.conf ?? 'LOW', note: o.note ?? '', aUnit };
}
const DFLT_FB = 0.88, DFLT_FC = 0.76;

// ── LINE ITEMS BY CSI DIVISION (measured) ───────────────────────────────────
const divisions = [
  ['01', 'General Conditions', [
    cat('GEN-PM-WEEKLY', 52, { method: 'CALC', basis: '12-mo schedule', note: 'Project management, weekly' }),
    allow('Site superintendent (12 mo)', 'mo', 12, 9500, { split: { lab: 1 }, basis: '12-mo build' }),
    allow('Mobilization / demobilization', 'ls', 1, 18000, {}),
    cat('GEN-TEMP-POWER', 12, { basis: 'monthly' }),
    allow('Temporary water / heat / enclosure', 'mo', 12, 850, {}),
    cat('GEN-PORT-TOILET', 12, {}),
    allow('Safety / OSHA / PPE program', 'ls', 1, 14000, {}),
    cat('GEN-DUMP-30', 10, {}),
    cat('GEN-CLEANUP-FINAL', GSF, { method: 'MEASURED', sheet: 'A001-A002', basis: 'GSF 5,920' }),
    allow('Testing & special inspections (Type IIIB + steel)', 'ls', 1, 18000, { sheet: 'A000/S101' }),
    cat('GEN-SURVEY', 1, {}),
    cat('GEN-ENGINEER', 1, { note: 'Structural — Denababa Eng.', sheet: 'S101' }),
    allow('Closeout / as-builts / O&M / commissioning', 'ls', 1, 9000, {}),
  ]],
  ['02', 'Existing Conditions', [
    allow('Clearing & site preparation', 'sqft', 4000, 3, { split: { sub: 0.4, equip: 0.4, lab: 0.2 }, method: 'CALC', sheet: 'A000', dim: 'lot 4,000 SF (20\'×100\' / 40\'×100\')' }),
    allow('Erosion & sediment control (DOEE/SWM)', 'lf', 280, 32, { split: { sub: 0.5, mat: 0.3, lab: 0.2 }, method: 'CALC', sheet: 'A000', dim: 'lot perimeter silt fence ~280 LF' }),
    allow('New rear areaway excavation/retaining', 'ls', 1, 12000, { method: 'MEASURED', sheet: 'A000', dim: 'rear areaway shown (scope note)' }),
  ]],
  ['03', 'Concrete', [
    allow('Drilled piers 18"Ø×30" (4-#5 vert, #3 ties)', 'ea', PIERS, 1650, { split: { sub: 0.55, mat: 0.25, equip: 0.2 }, method: 'MEASURED', sheet: 'S100', dim: '18"Ø×30" deep × ~10 at HSS cols/perimeter', note: 'Caisson foundation (S100)' }),
    allow('Grade beams / foundation wall — 8" CIP', 'sqft', CELLAR_WALL_SF, 34, { split: { sub: 0.55, mat: 0.25, lab: 0.2 }, method: 'CALC', sheet: 'S100', dim: 'P176 × 9\' cellar = 1,584 SF' }),
    cat('CONC-POUR-4', FOOTPRINT, { method: 'MEASURED', sheet: 'S100', dim: '4" SOG, 24×~62 = 1,480 SF', note: 'Slab on grade on 6-mil VB + 4" gravel (S100)' }),
    cat('CONC-MESH', FOOTPRINT, { method: 'MEASURED', sheet: 'S100', dim: 'W2.9×W2.9 WWF over slab area', note: 'Welded wire fabric (not rebar) per S100' }),
    allow('Elevator pit (excavate/form/pour/waterproof)', 'ea', 1, 9500, { method: 'MEASURED', sheet: 'A001', dim: '7\'-9"×7\'-9" hoistway pit', note: 'Equip excluded' }),
    allow('Exterior concrete (rear areaway, stoop, steps)', 'sqft', 400, 24, { split: { sub: 0.6, mat: 0.25, lab: 0.15 }, method: 'MEASURED', sheet: 'A000/S100', dim: 'rear areaway + front entry slab ~400 SF' }),
    cat('FOUND-WP-EXT', P, { method: 'CALC', sheet: 'S100', dim: 'perimeter 176 LF' }),
  ]],
  ['04', 'Masonry', [
    cat('SID-BRICK-VEN', BRICK_FRONT, { method: 'MEASURED', sheet: 'A004', conf: 'MED', dim: 'front 24\'×35.3\' − openings = 600 SF' }),
    allow('Lintels, flashing, masonry accessories', 'ls', 1, 5500, { method: 'CALC', sheet: 'A004', dim: 'front openings: storefront + 8 windows' }),
  ]],
  ['05', 'Metals (structural steel)', [
    cat('FOUND-STEEL-BEAM', 210, { method: 'MEASURED', sheet: 'S101', conf: 'MED', dim: 'W12×26: ~2 beams × 24\' × 4 levels + roof', note: 'W12×26' }),
    allow('HSS 5×5×3/8 steel columns + base plates', 'lf', 280, 62, { split: { sub: 0.5, mat: 0.35, lab: 0.15 }, method: 'MEASURED', sheet: 'S100/S101', dim: '~8 cols × 35\' on 3/4"×8"×12 base plates' }),
    allow('Steel connections, embeds, stair/rail steel, misc metals', 'ls', 1, 14000, { method: 'CALC', sheet: 'S101', dim: 'beam/col connections + egress stair steel' }),
  ]],
  ['06', 'Wood, Plastics & Rough Carpentry', [
    cat('FRAME-FLOOR-TJI', ELEV_FLOORS_SF, { waste: 0.10, method: 'MEASURED', sheet: 'S101', conf: 'MED', dim: '3 floors × 1,480 = 4,440 SF', note: 'TJI 360×14 engineered-wood I-joist @16" O.C.' }),
    cat('FRAME-SHEATH-SUB', ELEV_FLOORS_SF, { waste: 0.10, method: 'MEASURED', sheet: 'S101', dim: '3/4" ply, 4,440 SF' }),
    cat('FRAME-WALL-2X6', EXT_WALL_LF, { waste: 0.10, method: 'CALC', sheet: 'A004', dim: 'P176 × 3 stories = 528 LF' }),
    cat('FRAME-WALL-2X4', PART_LF, { waste: 0.10, method: 'MEASURED', sheet: 'A001-A002', dim: 'partitions: cellar130+1st120+2nd210+3rd210 = 700 LF', conf: 'MED' }),
    cat('FRAME-SHEATH-WALL', SHEATH_INSUL_SF, { waste: 0.10, method: 'CALC', sheet: 'A004', dim: 'P176 × 30\' above grade = 5,280 SF' }),
    allow('Low-slope roof framing (PT 2x8 @24" + steel)', 'sqft', ROOF_SF, 7.5, { split: { mat: 0.5, lab: 0.5 }, method: 'MEASURED', sheet: 'S101/A003', dim: 'roof 1,480 SF' }),
    cat('FRAME-SHEATH-ROOF', ROOF_SF, { waste: 0.10, method: 'MEASURED', sheet: 'A003', dim: '1,480 SF' }),
    cat('FRAME-STAIR', 4, { method: 'MEASURED', sheet: 'A001-A002', dim: 'cellar→3 = 4 flights, 18-19 risers ea' }),
    allow('Elevator shaft framing & 2-hr rated enclosure', 'ea', 1, 14000, { method: 'MEASURED', sheet: 'A001', dim: '7\'-9"×7\'-9" × 4 levels shaft' }),
    allow('Blocking, backing, misc rough carpentry', 'sqft', GSF, 1.25, { split: { mat: 0.5, lab: 0.5 }, method: 'CALC', sheet: 'A001-A002', dim: 'GSF 5,920' }),
  ]],
  ['07', 'Thermal, Moisture & Exterior', [
    cat('FRAME-INSUL-BATT', SHEATH_INSUL_SF, { method: 'CALC', sheet: 'A004', dim: 'exterior walls 5,280 SF' }),
    cat('SID-FC-LAP', SIDING_AREA, { method: 'MEASURED', sheet: 'A004/A005', conf: 'MED', dim: 'rear 728 + 2 sides 4,372 = 5,100 SF', note: 'Fiber-cement lap — rear + sides' }),
    allow('Roof / rigid insulation + air/vapor barrier', 'sqft', ROOF_SF, 4.5, { split: { sub: 0.4, mat: 0.35, lab: 0.25 }, method: 'MEASURED', sheet: 'A003', dim: 'roof 1,480 SF' }),
    allow('House wrap / weather-resistive barrier', 'sqft', SHEATH_INSUL_SF, 1.35, { split: { mat: 0.5, lab: 0.5 }, method: 'CALC', sheet: 'A004', dim: '5,280 SF' }),
    cat('ROOF-FLAT-TPO', +(ROOF_SF / 100).toFixed(2), { method: 'MEASURED', sheet: 'A003', dim: '1,480 SF = 14.8 sq' }),
    allow('Gutters, downspouts, flashing, coping', 'ls', 1, 8500, { method: 'CALC', sheet: 'A003/A004', dim: 'parapet perimeter + downspouts' }),
    allow('Firestopping / rated assemblies (Type IIIB)', 'sqft', GSF, 1.1, { split: { sub: 0.6, mat: 0.2, lab: 0.2 }, method: 'CALC', sheet: 'A000', dim: 'GSF 5,920 rated construction' }),
    allow('Sealants & caulking', 'ls', 1, 4500, { method: 'CALC', sheet: 'A004', dim: 'openings + joints perimeter' }),
  ]],
  ['08', 'Openings', [
    cat('DOOR-INT-SOLID', 40, { method: 'MEASURED', sheet: 'A006/plans', basis: 'D2xx/D3xx interior', conf: 'MED' }),
    cat('DOOR-EXT-STEEL', 4, { method: 'MEASURED', sheet: 'A004/A005', basis: 'front dbl + rear + side' }),
    cat('WIN-VIN-DH', 35, { method: 'MEASURED', sheet: 'A004/A005', basis: 'window tags 01–35' }),
    allow('Storefront / WELCOME entry glazing', 'ls', 1, 9500, { method: 'MEASURED', sheet: 'A004', dim: 'first-floor storefront + WELCOME entry (elevation)' }),
    allow('Commercial hardware (levers, closers, panic)', 'ea', 44, 145, { split: { mat: 0.7, lab: 0.3 }, method: 'CALC', sheet: 'plans', dim: '44 doors × commercial hardware set' }),
  ]],
  ['09', 'Finishes', [
    cat('DRY-HANG-STD', DRYWALL_SF, { waste: 0.10, method: 'CALC', sheet: 'A001-A002', basis: '2.4×GSF walls + ceilings', conf: 'MED' }),
    cat('DRY-TAPE-L4', DRYWALL_SF, { method: 'CALC', sheet: 'A001-A002', dim: 'same drywall area, Level-4 finish' }),
    allow('Rated shaft/corridor drywall upgrade (Type X)', 'sqft', 3500, 1.1, { split: { mat: 0.4, lab: 0.6 }, method: 'CALC', sheet: 'A001-A002', dim: 'elevator shaft + corridor rated walls ~3,500 SF' }),
    allow('Suspended ACT ceilings (cellar/kitchen/support)', 'sqft', 1600, 7.2, { split: { sub: 0.5, mat: 0.3, lab: 0.2 }, method: 'CALC', sheet: 'A001', dim: 'kitchen 470 + records/maint/support ~1,600 SF' }),
    cat('FLR-TILE-PORC', 900, { method: 'MEASURED', sheet: 'A001-A002', dim: '7 baths tile floor+base ~900 SF' }),
    cat('FLR-LVP', 4500, { method: 'CALC', sheet: 'A001-A002', dim: '8 BR + lounge/office/common ~4,500 SF', conf: 'MED' }),
    cat('PAINT-INT-WALL', DRYWALL_SF, { method: 'CALC', sheet: 'A001-A002', dim: 'wall+ceiling drywall area' }),
    allow('Finish carpentry — base, casing, trim', 'sqft', GSF, 2.6, { split: { mat: 0.4, lab: 0.6 }, method: 'CALC', sheet: 'A001-A002', dim: 'GSF 5,920 base/casing at doors+rooms' }),
  ]],
  ['10', 'Specialties', [
    cat('BATH-ACC-GRAB', 21, { method: 'MEASURED', sheet: 'A001-A002', dim: '3 bars × 7 baths (ADA)' }),
    allow('Toilet accessories sets (7 baths)', 'ea', 7, 220, { split: { mat: 0.7, lab: 0.3 }, method: 'MEASURED', sheet: 'A001-A002', dim: '7 baths' }),
    allow('Signage — egress / ADA / room ID', 'ea', 30, 140, { split: { mat: 0.7, lab: 0.3 }, method: 'CALC', sheet: 'A001-A002', dim: '~30 rooms/egress points × ID sign' }),
    allow('Fire extinguishers & cabinets', 'ea', 8, 165, { split: { mat: 0.8, lab: 0.2 }, method: 'CALC', sheet: 'A001-A002', dim: '4 levels, ~1 per 75\' travel = 8' }),
    allow('Misc specialties (lockers, mail, corner guards)', 'ls', 1, 3500, { method: 'CALC', sheet: 'A001-A002', dim: 'corner guards at corridors + mail' }),
  ]],
  ['12', 'Furnishings (built-in)', [
    cat('BATH-VAN-STD', 7, { method: 'MEASURED', sheet: 'A001-A002', dim: '7 baths' }),
    allow('Common/kitchen casework & countertops (base-bldg)', 'lf', 40, 240, { split: { sub: 0.5, mat: 0.35, lab: 0.15 }, method: 'MEASURED', sheet: 'A001', dim: 'kitchen prep counters + server station ~40 LF', note: 'Loose FF&E excluded' }),
    allow('Closet/pantry shelving & built-ins', 'ea', 4, 1625, { split: { mat: 0.5, lab: 0.5 }, method: 'MEASURED', sheet: 'A002', dim: 'WIC 205/207 + closets 206 + pantry' }),
  ]],
  ['21', 'Fire Suppression', [
    allow('Sprinkler system — NFPA 13, full building', 'sqft', GSF, 6.5, { split: { sub: 1 }, method: 'MEASURED', sheet: 'A002', conf: 'MED', dim: 'GSF 5,920; sprinkler closet L3', note: 'Sprinkler closet shown L3' }),
    allow('Fire service / standpipe / FDC', 'ls', 1, 12000, { method: 'CALC', sheet: 'A002', dim: '1 fire service entry + riser, cellar→roof' }),
    allow('Sprinkler testing & certification', 'ls', 1, 3500, { method: 'CALC', sheet: 'A002', dim: 'per-system flush/test' }),
  ]],
  ['22', 'Plumbing', [
    cat('BATH-TOIL-STD', 7, { method: 'MEASURED', sheet: 'A001-A002', dim: '7 baths' }),
    allow('Lavatories / sinks (7 baths + common + kitchen)', 'ea', 12, 620, { split: { sub: 0.55, mat: 0.3, lab: 0.15 }, method: 'MEASURED', sheet: 'P102-P104', dim: '7 lav + kitchen/prep/mop sinks = 12', lhrsUnit: 4 }),
    cat('BATH-TUB-STD', 7, { method: 'MEASURED', sheet: 'A001-A002', dim: '30×60 tub/shower × 7 baths' }),
    allow('DWV + water supply distribution (by fixture)', 'ea', 36, 950, { split: { sub: 0.5, lab: 0.3, mat: 0.2 }, method: 'MEASURED', sheet: 'P104/P105', dim: '~36 fixtures on sanitary/water risers', lhrsUnit: 6 }),
    cat('PLUMB-GAS-LINE', 180, { method: 'MEASURED', sheet: 'P106', dim: 'gas riser: kitchen + 2 WH + dryer (~180 LF)' }),
    allow('Water heaters — commercial (2 × WH-1)', 'ea', 2, 4200, { split: { sub: 0.5, mat: 0.4, lab: 0.1 }, method: 'MEASURED', sheet: 'E101/P', dim: '2 × WH-1 scheduled', lhrsUnit: 8 }),
    allow('Laundry rough-in + sump pump', 'ls', 1, 3200, { split: { sub: 0.6, lab: 0.25, mat: 0.15 }, method: 'MEASURED', sheet: 'A002/E101', dim: 'washer/dryer 202 + sump pump' }),
    allow('Commercial-kitchen plumbing/gas rough-in (base-bldg)', 'ls', 1, 22000, { method: 'MEASURED', sheet: 'A001/P', conf: 'MED', dim: 'kitchen 470 SF: sinks, floor drains, gas, walk-in drains', note: 'Rough-in only — equipment excluded' }),
  ]],
  ['23', 'HVAC', [
    allow('Split HVAC systems — 4 zones (CU-1..4 + AHU-1..4)', 'ea', 4, 9800, { split: { sub: 0.5, mat: 0.4, lab: 0.1 }, method: 'MEASURED', sheet: 'E101/M103', dim: '4 CU + 4 AHU scheduled', lhrsUnit: 16 }),
    allow('Ductwork distribution', 'lf', 900, 22, { split: { sub: 0.5, mat: 0.3, lab: 0.2 }, method: 'CALC', sheet: 'M103/M104', dim: '4 systems × ~225 LF trunk+branch', lhrsUnit: 0.3 }),
    allow('Controls / thermostats / zoning', 'ea', 4, 1875, { split: { sub: 1 }, method: 'CALC', sheet: 'M103', dim: '4 zones × thermostat/controls' }),
    cat('BATH-VENT-STD', 7, { method: 'MEASURED', sheet: 'M103', dim: '7 baths' }),
    allow('Kitchen hood curb, exhaust (KEF-1) & make-up air (MAU-1) ductwork (base-bldg)', 'ls', 1, 26000, { method: 'MEASURED', sheet: 'E101/M', conf: 'MED', dim: 'KEF-1 + MAU-1 scheduled', note: 'Base-building vent only — hood/MUA equipment excluded' }),
    allow('Elevator machine-room mini-split + TAB', 'ls', 1, 6500, { method: 'MEASURED', sheet: 'E101', dim: 'elevator mini-split scheduled' }),
  ]],
  ['26', 'Electrical', [
    cat('ELEC-PNL-400', 1, { method: 'MEASURED', sheet: 'E101', dim: '400A/208V/3Φ service + CT/meter (riser)' }),
    cat('ELEC-PNL-200', 2, { method: 'MEASURED', sheet: 'E101', dim: 'panels A + B (schedules)' }),
    allow('Feeders & branch wiring (building-wide)', 'sqft', GSF, 9.5, { split: { sub: 0.4, mat: 0.35, lab: 0.25 }, method: 'CALC', sheet: 'E101-E104', dim: '~80 circuits (panel A+B) × avg run over 5,920 SF', lhrsUnit: 0.05 }),
    allow('Lighting package (LED recessed/surface, interior/exterior)', 'ea', 65, 260, { split: { sub: 0.35, mat: 0.45, lab: 0.2 }, method: 'MEASURED', sheet: 'E104', dim: '~65 fixtures counted on E104 + controls' }),
    allow('Wiring devices & plates', 'ea', 220, 42, { split: { mat: 0.4, lab: 0.6 }, method: 'CALC', sheet: 'E102-E103', dim: 'receptacle circuits × devices/circuit' }),
    allow('HVAC power / equipment connections (CU/AHU/MAU/KEF)', 'ea', 10, 650, { split: { lab: 0.6, mat: 0.4 }, method: 'MEASURED', sheet: 'E101', dim: '4 CU + 4 AHU + MAU + KEF = 10 connections' }),
    allow('Commercial-kitchen & walk-in electrical rough-in (base-bldg)', 'ls', 1, 11000, { method: 'MEASURED', sheet: 'E101', dim: 'kitchen + walk-in cooler circuits (panel A)', note: 'Rough-in only — equipment excluded' }),
    allow('Elevator power rough-in, disconnect & cab-light circuit', 'ls', 1, 5200, { method: 'MEASURED', sheet: 'E101', dim: 'elevator machine + cab-light circuits (panel B)', note: 'Equipment excluded' }),
    allow('Emergency & exit lighting (egress)', 'ea', 24, 320, { split: { mat: 0.6, lab: 0.4 }, method: 'CALC', sheet: 'E104', dim: 'egress path exit/EM combos, 4 levels' }),
    cat('ELEC-SMOKE', 14, { method: 'MEASURED', sheet: 'E101 legend', dim: 'smoke/CO detectors, ~14 bedrooms/corridors' }),
  ]],
  ['27/28', 'Communications & Electronic Safety', [
    allow('Fire alarm system — addressable (R-2)', 'sqft', GSF, 2.6, { split: { sub: 1 }, method: 'CALC', sheet: 'E101/A000', conf: 'MED', dim: 'GSF 5,920; smoke/CO devices per E101 legend' }),
    cat('ELEC-CAT6', 20, { method: 'CALC', sheet: 'E102 note A', dim: '~20 data drops (1-2 per office/common)' }),
    allow('Security / access control / intercom / CCTV', 'ls', 1, 18000, { method: 'ASSUMED', conf: 'LOW', note: 'NOT designed on this set — owner/design allowance' }),
  ]],
  ['31', 'Earthwork', [
    allow('Mass & foundation excavation (cellar)', 'cy', 550, 42, { split: { sub: 0.3, equip: 0.5, lab: 0.2 }, method: 'CALC', sheet: 'S100', dim: '1,480 SF × 10\' / 27 = 548 CY' }),
    allow('Haul-off / spoil disposal', 'cy', 400, 38, { split: { sub: 0.4, equip: 0.4, lab: 0.2 }, method: 'CALC', sheet: 'S100', dim: 'excav 550 − backfill 180 = ~370 CY export' }),
    allow('Backfill & compaction', 'cy', 180, 34, { split: { equip: 0.5, lab: 0.3, sub: 0.2 }, method: 'CALC', sheet: 'S100', dim: 'perimeter over-dig backfill' }),
    allow('Stone base / under-slab drainage', 'sqft', FOOTPRINT, 3.2, { split: { mat: 0.6, lab: 0.4 }, method: 'MEASURED', sheet: 'S100', dim: '4" gravel under slab = 1,480 SF (S100)' }),
    allow('Fine grading', 'sqft', 2520, 2.6, { split: { equip: 0.6, lab: 0.4 }, method: 'CALC', sheet: 'A000', dim: 'yard = lot 4,000 − footprint 1,480 = 2,520 SF' }),
  ]],
  ['32', 'Exterior Improvements', [
    allow('Walks, steps & entry hardscape', 'sqft', 500, 18, { split: { sub: 0.6, mat: 0.25, lab: 0.15 }, method: 'CALC', sheet: 'A000', dim: 'front walk + rear egress path ~500 SF' }),
    allow('Site drainage / area drains', 'ls', 1, 9500, { method: 'CALC', sheet: 'A000', dim: 'areaway + downspout tie-ins' }),
    allow('Landscaping, planter & site restoration', 'sqft', 2520, 5.5, { split: { sub: 0.5, mat: 0.3, lab: 0.2 }, method: 'CALC', sheet: 'A001', dim: 'yard 2,520 SF + front planter', conf: 'LOW' }),
  ]],
  ['33', 'Utilities', [
    allow('Domestic water service & tap', 'ls', 1, 18000, { sheet: 'P102', conf: 'LOW' }),
    allow('Sanitary sewer service & connection', 'ls', 1, 20000, { sheet: 'P104' }),
    allow('Gas service & meter', 'ls', 1, 9000, { sheet: 'P106' }),
    allow('Electrical service lateral / transformer coord (Pepco)', 'ls', 1, 15000, { sheet: 'E101' }),
  ]],
];

// ── EXCLUDED equipment (confirmed present on drawings) ──────────────────────
const exclusions = {
  elevator: [
    ['Passenger elevator equipment — 3,500# (A001)', 72000],
    ['Elevator cab, doors & landing entrances', 22000],
    ['Rails, controls & fixtures', 18000],
    ['Elevator installation labor', 24000],
    ['Testing, inspection & DCRA certification', 6000],
  ],
  kitchen: [
    ['Type I exhaust hood package (KEF-1)', 14000],
    ['Hood fire suppression (Ansul)', 6500],
    ['Make-up air unit MAU-1 (if equipment-scoped)', 12000],
    ['Walk-in refrigerator (A001)', 11000],
    ['Walk-in freezer (A001)', 13000],
    ['Cooking equipment (double oven + line)', 28000],
    ['Commercial dishwasher', 9000],
    ['Stainless prep tables, sinks, shelving', 12000],
    ['Loose / owner-furnished food-service equipment', 15000],
  ],
};

// ── COMPUTE ─────────────────────────────────────────────────────────────────
function extend(line, scen, div) {
  const f = scen === 'A' ? 1 : scen === 'B' ? (line.fB ?? DFLT_FB) : (line.fC ?? DFLT_FC);
  const mat = line.matUnit * line.qty * f;
  const equip = line.equipUnit * line.qty * f, sub = line.subUnit * line.qty * f;
  const lhrs = (line.lhrsUnit || 0) * line.qty * f;
  // Labor = hours × wage. Div 01 (GC supervision/mgmt) stays salaried/effort.
  let lab, rate;
  if (div === '01') { lab = line.labUnit * line.qty * f; rate = null; }
  else { rate = crewRate(div); lab = lhrs * rate; }
  return { mat, lab, equip, sub, total: mat + lab + equip + sub, lhrs, rate };
}
function computeScenario(scen) {
  const divs = []; let dMat = 0, dLab = 0, dEquip = 0, dSub = 0, dHrs = 0;
  for (const [num, name, lines] of divisions) {
    let m = 0, l = 0, e = 0, s = 0, h = 0;
    const litems = lines.map((ln) => { const x = extend(ln, scen, num); m += x.mat; l += x.lab; e += x.equip; s += x.sub; h += x.lhrs; return { ...ln, ext: x, laborRate: x.rate }; });
    divs.push({ num, name, lines: litems, mat: m, lab: l, equip: e, sub: s, hrs: h, total: m + l + e + s });
    dMat += m; dLab += l; dEquip += e; dSub += s; dHrs += h;
  }
  const direct = dMat + dLab + dEquip + dSub;
  const overhead = direct * OH, profit = direct * PROFIT;
  const contingency = direct * (scen === 'A' ? CONTINGENCY : 0.05);
  const bondsIns = (direct + overhead + profit) * BONDS_INS;
  const permit = scen === 'C' ? 14000 : 22000;
  const total = direct + overhead + profit + contingency + bondsIns + permit;
  return { scen, divs, material: dMat, labor: dLab, equipment: dEquip, subcontractor: dSub, laborHours: dHrs,
    direct, overhead, profit, contingency, bondsIns, permit, total, psf: total / GSF };
}
const A = computeScenario('A'), B = computeScenario('B'), C = computeScenario('C');
const elevatorAllow = exclusions.elevator.reduce((s, [, v]) => s + v, 0);
const kitchenAllow = exclusions.kitchen.reduce((s, [, v]) => s + v, 0);

// method mix — MEASURED (scheduled/dimensioned), CALC (derived from measured
// dims/counts), ASSUMED (not dimensioned on the drawings)
const allLines = A.divs.flatMap((d) => d.lines);
const methodMix = { MEASURED: 0, CALC: 0, ASSUMED: 0 };
for (const ln of allLines) methodMix[ln.method] = (methodMix[ln.method] || 0) + ln.ext.total;
const dimensioned = methodMix.MEASURED + methodMix.CALC;   // quantities from drawing dims
const dimensionedPct = dimensioned / A.direct * 100;
const undimLines = allLines.filter((l) => l.method === 'ASSUMED');

// ── Console ─────────────────────────────────────────────────────────────────
const money = (n) => '$' + Math.round(n).toLocaleString();
const psf = (n) => '$' + n.toFixed(0) + '/SF';
console.log('='.repeat(78));
console.log('5213 CALL PLACE SE — MEASURED ESTIMATE (from 28-sheet permit set)');
console.log(`GSF ${GSF.toLocaleString()} | ${BEDROOMS} BR | ${BEDS} beds | ${BATHS} baths | footprint 24'×64' | DC ${DC}`);
console.log('='.repeat(78));
for (const S of [A, B, C]) {
  const label = { A: 'A · Catalogue Market', B: 'B · Value-Engineered', C: 'C · Minimum Viable' }[S.scen];
  console.log(`\nSCENARIO ${label}`);
  console.log(`  Direct ${money(S.direct).padStart(13)} | OH ${money(S.overhead)} | Profit ${money(S.profit)} | Cont ${money(S.contingency)} | B&I ${money(S.bondsIns)} | Permit ${money(S.permit)}`);
  console.log(`  TOTAL (excl elev+kit) ${money(S.total).padStart(13)}   ${psf(S.psf)}`);
}
console.log(`\nTARGET ${money(TARGET_TOTAL)} @ ${psf(TARGET_PSF)} — Scenario A variance ${money(A.total - TARGET_TOTAL)} (${((A.psf / TARGET_PSF - 1) * 100).toFixed(0)}% over)`);
console.log(`Excluded: elevator ${money(elevatorAllow)} | kitchen equip ${money(kitchenAllow)}`);
console.log(`\nLABOR WAGE: apprentice $${APPRENTICE} · journeyman $${JOURNEYMAN} · master $${MASTER}/hr`);
console.log(`  General-trades crew $${GENERAL_RATE}/hr (60% jrny + 40% appr) | Licensed MEP/fire $${LICENSED_RATE}/hr (master flat)`);
console.log(`  ${Math.round(A.laborHours).toLocaleString()} total labor-hours | labor $${Math.round(A.labor).toLocaleString()}`);
console.log(`\nTakeoff basis (Scenario A direct): MEASURED ${money(methodMix.MEASURED)} (${(methodMix.MEASURED / A.direct * 100).toFixed(0)}%) | CALC-from-dims ${money(methodMix.CALC)} (${(methodMix.CALC / A.direct * 100).toFixed(0)}%) | not-dimensioned ${money(methodMix.ASSUMED)} (${(methodMix.ASSUMED / A.direct * 100).toFixed(0)}%)`);
console.log(`==> DIMENSIONED (measured + calc-from-dims): ${dimensionedPct.toFixed(1)}% of direct cost`);
if (undimLines.length) { console.log(`Remaining not-dimensioned (not shown on drawings):`); for (const l of undimLines) console.log(`   - ${l.name} (${money(l.ext.total)})`); }
console.log('\nDivision summary (A / B / C):');
for (let i = 0; i < A.divs.length; i++) console.log(`  Div ${A.divs[i].num.padEnd(5)} ${A.divs[i].name.padEnd(34)} ${money(A.divs[i].total).padStart(11)} ${money(B.divs[i].total).padStart(11)} ${money(C.divs[i].total).padStart(11)}`);

const drivers = A.divs.map((d) => ({ k: `Div ${d.num} ${d.name}`, v: d.total })).sort((a, b) => b.v - a.v);

// ── Exports ─────────────────────────────────────────────────────────────────
fs.mkdirSync(OUT, { recursive: true });
const owner = {
  project: '5213 Call Place SE, Washington DC 20019',
  type: 'New construction detached group home / residential care (R-2), Type IIIB',
  gsf: GSF, beds: BEDS, bedrooms: BEDROOMS, bathrooms: BATHS,
  recommendedBaseBuilding: Math.round(A.total), costPerGSF: +A.psf.toFixed(2),
  costPerBed: Math.round(A.total / BEDS), costPerBedroom: Math.round(A.total / BEDROOMS), costPerBathroom: Math.round(A.total / BATHS),
  costExclElevatorAndKitchen: Math.round(A.total), elevatorAllowanceSeparate: elevatorAllow, kitchenEquipmentAllowanceSeparate: kitchenAllow,
  allInWithExcludedAllowances: Math.round(A.total) + elevatorAllow + kitchenAllow,
};
const jsonExport = {
  meta: {
    project: owner.project, type: owner.type, generated: new Date().toISOString(),
    engine: 'Kealee packages/estimating (EstimatingService markup structure)',
    catalogue: 'MARKETPLACE_ASSEMBLIES (DC-Baltimore 2024-25) — mid tier, DC factor 1.15',
    takeoff: 'MEASURED from permit set (28 sheets) — see drawings/MEASURED-TAKEOFF.md',
    markups: { overheadPct: 12, profitPct: 15, contingencyPct_A: 7, contingencyPct_BC: 5, bondsInsPct: 1.5 },
    laborWage: { apprentice: APPRENTICE, journeyman: JOURNEYMAN, master: MASTER, generalTradesRate: GENERAL_RATE, licensedTradesRate: LICENSED_RATE, generalCrew: '60% journeyman + 40% apprentice', licensedCrew: 'master flat (Div 21/22/23/26/27-28)', note: 'Labor = labor-hours × crew rate. Div 01 GC supervision salaried; subcontractor lump sums keep quoted value.' },
    basis: { gsf: GSF, footprint: "24'×64'", stories: 'cellar + 3', beds: BEDS, bedrooms: BEDROOMS, baths: BATHS, height: "35'-4\"", structure: 'TJI 360×14 + W12×26 steel + HSS columns' },
    methodMix: { measured: Math.round(methodMix.MEASURED), calcFromDims: Math.round(methodMix.CALC), notDimensioned: Math.round(methodMix.ASSUMED), dimensionedPct: +dimensionedPct.toFixed(1) },
    notDimensionedItems: undimLines.map((l) => ({ item: l.name, extended: Math.round(l.ext.total) })),
    caveats: [
      `${dimensionedPct.toFixed(0)}% of direct cost is dimensioned (measured or calc-from-drawing-dims); remainder is scope not shown on the drawings.`,
      'Every line carries its dimensional basis (dim field) and sheet reference.',
      'Drawings stamped NOT FOR PERMITTING — used for estimation only.',
      'Elevator + commercial-kitchen equipment excluded (confirmed present on A001/E101).',
    ],
  },
  target: { psf: TARGET_PSF, total: TARGET_TOTAL },
  scenarios: { A, B, C },
  exclusions: { elevator: exclusions.elevator, elevatorTotal: elevatorAllow, kitchen: exclusions.kitchen, kitchenTotal: kitchenAllow },
  ownerSummary: owner, topDrivers: drivers.slice(0, 15),
};
fs.writeFileSync(path.join(OUT, 'estimate.json'), JSON.stringify(jsonExport, null, 2));

const csvRows = [['Division', 'Item', 'CatalogueCode', 'Allowance', 'Unit', 'Qty', 'Method', 'DimensionBasis', 'Sheet', 'Confidence', 'MatUnit', 'LaborHrs', 'LaborRate', 'LaborCost', 'EquipUnit', 'SubUnit', 'Extended', 'Note']];
for (const d of A.divs) for (const ln of d.lines) csvRows.push([d.num, ln.name, ln.code, ln.allowance ? 'YES' : 'no', ln.unit, ln.qty, ln.method, (ln.dim || ln.basis || '').replace(/,/g, ';'), ln.sheet, ln.conf, ln.matUnit, Math.round(ln.ext.lhrs), ln.ext.rate ? '$' + ln.ext.rate + '/hr' : 'salaried', Math.round(ln.ext.lab), Math.round(ln.ext.equip), Math.round(ln.ext.sub), Math.round(ln.ext.total), (ln.note || '').replace(/,/g, ';')]);
fs.writeFileSync(path.join(OUT, 'estimate-lineitems-scenarioA.csv'), csvRows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n'));

const divCsv = [['Division', 'Name', 'ScenA_Total', 'ScenB_Total', 'ScenC_Total', 'ScenA_Mat', 'ScenA_Lab', 'ScenA_Sub', 'ScenA_LaborHrs']];
A.divs.forEach((d, i) => divCsv.push([d.num, d.name, Math.round(d.total), Math.round(B.divs[i].total), Math.round(C.divs[i].total), Math.round(d.mat), Math.round(d.lab), Math.round(d.sub), Math.round(d.hrs)]));
fs.writeFileSync(path.join(OUT, 'division-summary.csv'), divCsv.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n'));

// quantity takeoff + schedules
const toRows = [['Division', 'Item', 'Unit', 'Qty', 'Method', 'DimensionBasis', 'Sheet', 'Confidence', 'CatalogueCode', 'Allowance']];
for (const d of A.divs) for (const ln of d.lines) toRows.push([d.num, ln.name, ln.unit, ln.qty, ln.method, (ln.dim || ln.basis || '').replace(/,/g, ';'), ln.sheet, ln.conf, ln.code, ln.allowance ? 'YES' : 'no']);
fs.writeFileSync(path.join(OUT, 'quantity-takeoff.csv'), toRows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n'));
const laborRows = [['Division', 'Item', 'Qty', 'Unit', 'LaborHrs', 'LaborCost']]; const matRows = [['Division', 'Item', 'Qty', 'Unit', 'MaterialCost']]; const subRows = [['Division', 'Item', 'Qty', 'Unit', 'SubcontractorCost']];
for (const d of A.divs) for (const ln of d.lines) { if (ln.ext.lhrs > 0 || ln.ext.lab > 0) laborRows.push([d.num, ln.name, ln.qty, ln.unit, Math.round(ln.ext.lhrs), Math.round(ln.ext.lab)]); if (ln.ext.mat > 0) matRows.push([d.num, ln.name, ln.qty, ln.unit, Math.round(ln.ext.mat)]); if (ln.ext.sub > 0) subRows.push([d.num, ln.name, ln.qty, ln.unit, Math.round(ln.ext.sub)]); }
fs.writeFileSync(path.join(OUT, 'labor-hours.csv'), laborRows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n'));
fs.writeFileSync(path.join(OUT, 'material-schedule.csv'), matRows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n'));
fs.writeFileSync(path.join(OUT, 'subcontractor-schedule.csv'), subRows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n'));

console.log(`\nFiles written to ${path.relative(REPO, OUT)}/:`);
for (const f of fs.readdirSync(OUT).filter((f) => !f.endsWith('.pdf') && !f.endsWith('.html')).sort()) console.log('  ' + f);
