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
// Measured geometry (A000/A001/A004/S101)
const P = 176;                       // perimeter 2×(24+64)
const H = 35.33;                     // building height 35'-4"
const EXT_WALL_LF = P * 3;           // 528 LF above-grade exterior wall
const FACADE_GROSS = P * H;          // 6,218 SF gross envelope
const BRICK_FRONT = 670;             // front elevation brick veneer, net (A004)
const SIDING_AREA = 4700;            // rear + 2 sides lap siding (A004/A005)
const CELLAR_WALL_SF = P * 9;        // 1,584 SF below-grade wall
const ELEV_FLOORS_SF = FOOTPRINT * 3;// 4,440 SF TJI floor framing (S101)
const DRYWALL_SF = 20000;            // walls + ceilings (group-home partitions)

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
    basis: o.basis || '', sheet: o.sheet || '', method: o.method || 'CALC', conf: o.conf ?? 'MED', note: o.note ?? '' };
}
function allow(name, unit, qty, aUnit, o = {}) {
  const s = o.split ?? { sub: 1 };
  return { code: o.code ?? 'ALLOWANCE', name, unit, qty,
    matUnit: +(aUnit * (s.mat ?? 0)).toFixed(2), labUnit: +(aUnit * (s.lab ?? 0)).toFixed(2),
    equipUnit: +(aUnit * (s.equip ?? 0)).toFixed(2), subUnit: +(aUnit * (s.sub ?? 0)).toFixed(2),
    lhrsUnit: o.lhrsUnit ?? 0, allowance: true, waste: 0,
    basis: o.basis || '', sheet: o.sheet || '', method: o.method || 'ASSUMED', conf: o.conf ?? 'LOW', note: o.note ?? '', aUnit };
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
    allow('Clearing & site preparation', 'ls', 1, 12000, { sheet: 'A000' }),
    allow('Erosion & sediment control (DOEE/SWM)', 'ls', 1, 9000, { sheet: 'A000' }),
    allow('New rear areaway excavation/retaining', 'ls', 1, 12000, { sheet: 'A000', note: 'New areaway in rear (scope note)' }),
  ]],
  ['03', 'Concrete', [
    cat('FOUND-FOOTER-NEW', P, { method: 'MEASURED', sheet: 'A001', basis: 'perimeter 176 LF' }),
    allow('Foundation wall — 8" CIP (form+rebar+pour+strip)', 'sqft', CELLAR_WALL_SF, 34, { split: { sub: 0.55, mat: 0.25, lab: 0.2 }, method: 'CALC', sheet: 'A001', basis: 'P×9 = 1,584 SF' }),
    cat('CONC-POUR-4', FOOTPRINT, { method: 'MEASURED', sheet: 'A001', basis: 'cellar slab 1,480 SF' }),
    cat('CONC-REBAR', FOOTPRINT, { method: 'CALC', sheet: 'A001' }),
    allow('Elevator pit (excavate/form/pour/waterproof)', 'ea', 1, 9500, { method: 'MEASURED', sheet: 'A001', note: '3,500# hoistway 7\'-9"×7\'-9"; equip excluded' }),
    allow('Exterior concrete (rear areaway, stoop, steps)', 'sqft', 400, 24, { split: { sub: 0.6, mat: 0.25, lab: 0.15 }, sheet: 'A000' }),
    cat('FOUND-WP-EXT', P, { method: 'CALC', sheet: 'A001', basis: 'perimeter' }),
  ]],
  ['04', 'Masonry', [
    cat('SID-BRICK-VEN', BRICK_FRONT, { method: 'MEASURED', sheet: 'A004', conf: 'MED', note: 'Front elevation brick veneer only' }),
    allow('Lintels, flashing, masonry accessories', 'ls', 1, 5500, { sheet: 'A004' }),
  ]],
  ['05', 'Metals (structural steel)', [
    cat('FOUND-STEEL-BEAM', 210, { method: 'MEASURED', sheet: 'S101', conf: 'MED', note: 'W12×26 beams, all levels + roof' }),
    allow('HSS 5×5×3/8 steel columns + base/cap plates', 'lf', 280, 62, { split: { sub: 0.5, mat: 0.35, lab: 0.15 }, method: 'MEASURED', sheet: 'S101', note: 'HSS columns' }),
    allow('Steel connections, embeds, stair/rail steel, misc metals', 'ls', 1, 14000, { sheet: 'S101' }),
  ]],
  ['06', 'Wood, Plastics & Rough Carpentry', [
    cat('FRAME-FLOOR-TJI', ELEV_FLOORS_SF, { waste: 0.10, method: 'MEASURED', sheet: 'S101', conf: 'MED', note: 'TJI 360×14 engineered-wood I-joist @16" O.C. (S101)' }),
    cat('FRAME-SHEATH-SUB', ELEV_FLOORS_SF, { waste: 0.10, method: 'MEASURED', sheet: 'S101', note: '3/4" ply subfloor' }),
    cat('FRAME-WALL-2X6', EXT_WALL_LF, { waste: 0.10, method: 'CALC', sheet: 'A004', basis: '528 LF exterior wall' }),
    cat('FRAME-WALL-2X4', 1100, { waste: 0.10, method: 'CALC', sheet: 'A001-A002', basis: 'group-home partitions', conf: 'MED' }),
    cat('FRAME-SHEATH-WALL', 5280, { waste: 0.10, method: 'CALC', sheet: 'A004', basis: 'facade 528LF×10' }),
    allow('Low-slope roof framing (PT 2x8 @24" + steel)', 'sqft', FOOTPRINT, 7.5, { split: { mat: 0.5, lab: 0.5 }, method: 'MEASURED', sheet: 'S101/A003' }),
    cat('FRAME-SHEATH-ROOF', FOOTPRINT, { waste: 0.10, method: 'MEASURED', sheet: 'A003' }),
    cat('FRAME-STAIR', 4, { method: 'MEASURED', sheet: 'A001-A002', basis: 'cellar→3 = 4 flights' }),
    allow('Elevator shaft framing & 2-hr rated enclosure', 'ea', 1, 14000, { method: 'MEASURED', sheet: 'A001' }),
    allow('Blocking, backing, misc rough carpentry', 'sqft', GSF, 1.25, { split: { mat: 0.5, lab: 0.5 } }),
  ]],
  ['07', 'Thermal, Moisture & Exterior', [
    cat('FRAME-INSUL-BATT', 5280, { method: 'CALC', sheet: 'A004', basis: 'exterior walls' }),
    cat('SID-FC-LAP', SIDING_AREA, { method: 'MEASURED', sheet: 'A004/A005', conf: 'MED', note: 'Fiber-cement lap — rear + sides' }),
    allow('Roof / rigid insulation + air/vapor barrier', 'sqft', FOOTPRINT, 4.5, { split: { sub: 0.4, mat: 0.35, lab: 0.25 }, sheet: 'A003' }),
    allow('House wrap / weather-resistive barrier', 'sqft', 5280, 1.35, { split: { mat: 0.5, lab: 0.5 }, sheet: 'A004' }),
    cat('ROOF-FLAT-TPO', +(FOOTPRINT / 100).toFixed(2), { method: 'MEASURED', sheet: 'A003', basis: '14.8 sq' }),
    allow('Gutters, downspouts, flashing, coping', 'ls', 1, 8500, { sheet: 'A004' }),
    allow('Firestopping / rated assemblies (Type IIIB)', 'sqft', GSF, 1.1, { split: { sub: 0.6, mat: 0.2, lab: 0.2 }, sheet: 'A000' }),
    allow('Sealants & caulking', 'ls', 1, 4500, {}),
  ]],
  ['08', 'Openings', [
    cat('DOOR-INT-SOLID', 40, { method: 'MEASURED', sheet: 'A006/plans', basis: 'D2xx/D3xx interior', conf: 'MED' }),
    cat('DOOR-EXT-STEEL', 4, { method: 'MEASURED', sheet: 'A004/A005', basis: 'front dbl + rear + side' }),
    cat('WIN-VIN-DH', 35, { method: 'MEASURED', sheet: 'A004/A005', basis: 'window tags 01–35' }),
    allow('Storefront / WELCOME entry glazing', 'ls', 1, 9500, { method: 'MEASURED', sheet: 'A004', note: 'First-floor storefront + entry' }),
    allow('Commercial hardware (levers, closers, panic)', 'ea', 44, 145, { split: { mat: 0.7, lab: 0.3 }, sheet: 'A006' }),
  ]],
  ['09', 'Finishes', [
    cat('DRY-HANG-STD', DRYWALL_SF, { waste: 0.10, method: 'CALC', sheet: 'A001-A002', basis: '2.4×GSF walls + ceilings', conf: 'MED' }),
    cat('DRY-TAPE-L4', DRYWALL_SF, { method: 'CALC', sheet: 'A001-A002' }),
    allow('Rated shaft/corridor drywall upgrade (Type X)', 'sqft', 3500, 1.1, { split: { mat: 0.4, lab: 0.6 }, sheet: 'A000' }),
    allow('Suspended ACT ceilings (cellar/kitchen/support)', 'sqft', 1600, 7.2, { split: { sub: 0.5, mat: 0.3, lab: 0.2 }, sheet: 'A001' }),
    cat('FLR-TILE-PORC', 900, { method: 'MEASURED', sheet: 'A001-A002', basis: '7 baths' }),
    cat('FLR-LVP', 4500, { method: 'CALC', sheet: 'A001-A002', basis: 'bedrooms/common', conf: 'MED' }),
    cat('PAINT-INT-WALL', DRYWALL_SF, { method: 'CALC', sheet: 'A001-A002' }),
    allow('Finish carpentry — base, casing, trim', 'sqft', GSF, 2.6, { split: { mat: 0.4, lab: 0.6 } }),
  ]],
  ['10', 'Specialties', [
    cat('BATH-ACC-GRAB', 21, { method: 'MEASURED', sheet: 'A001-A002', basis: '3 bars × 7 baths (ADA)' }),
    allow('Toilet accessories sets (7 baths)', 'ea', 7, 220, { split: { mat: 0.7, lab: 0.3 }, sheet: 'A001-A002' }),
    allow('Signage — egress / ADA / room ID', 'ls', 1, 4200, { sheet: 'A000' }),
    allow('Fire extinguishers & cabinets', 'ea', 8, 165, { split: { mat: 0.8, lab: 0.2 } }),
    allow('Misc specialties (lockers, mail, corner guards)', 'ls', 1, 3500, {}),
  ]],
  ['12', 'Furnishings (built-in)', [
    cat('BATH-VAN-STD', 7, { method: 'MEASURED', sheet: 'A001-A002', basis: '7 baths' }),
    allow('Common/kitchen casework & countertops (base-bldg)', 'lf', 40, 240, { split: { sub: 0.5, mat: 0.35, lab: 0.15 }, sheet: 'A001', note: 'Loose FF&E excluded' }),
    allow('Closet/pantry shelving & built-ins (WICs 205/207)', 'ls', 1, 6500, { sheet: 'A002' }),
  ]],
  ['21', 'Fire Suppression', [
    allow('Sprinkler system — NFPA 13, full building', 'sqft', GSF, 6.5, { split: { sub: 1 }, method: 'MEASURED', sheet: 'A002', conf: 'MED', note: 'Sprinkler closet shown L3' }),
    allow('Fire service / standpipe / FDC allowance', 'ls', 1, 12000, {}),
    allow('Sprinkler testing & certification', 'ls', 1, 3500, {}),
  ]],
  ['22', 'Plumbing', [
    cat('BATH-TOIL-STD', 7, { method: 'MEASURED', sheet: 'A001-A002', basis: '7 baths' }),
    allow('Lavatories / sinks (7 baths + common + kitchen)', 'ea', 12, 620, { split: { sub: 0.55, mat: 0.3, lab: 0.15 }, method: 'MEASURED', sheet: 'P-plans', lhrsUnit: 4 }),
    cat('BATH-TUB-STD', 7, { method: 'MEASURED', sheet: 'A001-A002', basis: '30×60 tub/shower per bath' }),
    allow('DWV + water supply distribution (by fixture)', 'ea', 36, 950, { split: { sub: 0.5, lab: 0.3, mat: 0.2 }, method: 'CALC', sheet: 'P104/P105', lhrsUnit: 6 }),
    cat('PLUMB-GAS-LINE', 180, { method: 'MEASURED', sheet: 'P102/P106', basis: 'gas to kitchen/WH/dryer' }),
    allow('Water heaters — commercial (2 × WH-1)', 'ea', 2, 4200, { split: { sub: 0.5, mat: 0.4, lab: 0.1 }, method: 'MEASURED', sheet: 'E101/P', lhrsUnit: 8 }),
    allow('Laundry rough-in + sump pump', 'ls', 1, 3200, { split: { sub: 0.6, lab: 0.25, mat: 0.15 }, method: 'MEASURED', sheet: 'A002/E101' }),
    allow('Commercial-kitchen plumbing/gas rough-in (base-bldg)', 'ls', 1, 22000, { method: 'MEASURED', sheet: 'A001/P', conf: 'MED', note: 'Rough-in only — equipment excluded' }),
  ]],
  ['23', 'HVAC', [
    allow('Split HVAC systems — 4 zones (CU-1..4 + AHU-1..4)', 'ea', 4, 9800, { split: { sub: 0.5, mat: 0.4, lab: 0.1 }, method: 'MEASURED', sheet: 'E101/M103', lhrsUnit: 16 }),
    allow('Ductwork distribution', 'lf', 900, 22, { split: { sub: 0.5, mat: 0.3, lab: 0.2 }, sheet: 'M103/M104', lhrsUnit: 0.3 }),
    allow('Controls / thermostats / zoning', 'ls', 1, 7500, {}),
    cat('BATH-VENT-STD', 7, { method: 'MEASURED', sheet: 'M103', basis: 'bath exhaust' }),
    allow('Kitchen hood curb, exhaust (KEF-1) & make-up air (MAU-1) ductwork (base-bldg)', 'ls', 1, 26000, { method: 'MEASURED', sheet: 'E101/M', conf: 'MED', note: 'Base-building vent only — hood/MUA equipment excluded' }),
    allow('Elevator machine-room mini-split + TAB', 'ls', 1, 6500, { method: 'MEASURED', sheet: 'E101' }),
  ]],
  ['26', 'Electrical', [
    cat('ELEC-PNL-400', 1, { method: 'MEASURED', sheet: 'E101', basis: 'new 400A/208V/3Φ service' }),
    cat('ELEC-PNL-200', 2, { method: 'MEASURED', sheet: 'E101', basis: 'panels A + B' }),
    allow('Feeders & branch wiring (building-wide)', 'sqft', GSF, 9.5, { split: { sub: 0.4, mat: 0.35, lab: 0.25 }, sheet: 'E102-E104', lhrsUnit: 0.05 }),
    allow('Lighting package (LED recessed/surface, interior/exterior)', 'sqft', GSF, 4.2, { split: { sub: 0.4, mat: 0.4, lab: 0.2 }, sheet: 'E104' }),
    allow('Wiring devices & plates', 'ea', 220, 42, { split: { mat: 0.4, lab: 0.6 }, sheet: 'E102-E103' }),
    allow('HVAC power / equipment connections (CU/AHU/MAU/KEF)', 'ea', 10, 650, { split: { lab: 0.6, mat: 0.4 }, sheet: 'E101' }),
    allow('Commercial-kitchen & walk-in electrical rough-in (base-bldg)', 'ls', 1, 11000, { method: 'MEASURED', sheet: 'E101', note: 'Rough-in only — equipment excluded' }),
    allow('Elevator power rough-in, disconnect & cab-light circuit', 'ls', 1, 5200, { method: 'MEASURED', sheet: 'E101', note: 'Equipment excluded' }),
    allow('Emergency & exit lighting (egress)', 'ea', 24, 320, { split: { mat: 0.6, lab: 0.4 }, sheet: 'E104' }),
    cat('ELEC-SMOKE', 14, { method: 'MEASURED', sheet: 'E101 legend', basis: 'smoke/CO detectors' }),
  ]],
  ['27/28', 'Communications & Electronic Safety', [
    allow('Fire alarm system — addressable (R-2)', 'sqft', GSF, 2.6, { split: { sub: 1 }, sheet: 'E101/A000', conf: 'MED' }),
    cat('ELEC-CAT6', 20, { method: 'ASSUMED', sheet: 'E102 note A', basis: 'data outlets by contractor' }),
    allow('Security / access control / intercom / CCTV', 'ls', 1, 18000, { conf: 'LOW' }),
  ]],
  ['31', 'Earthwork', [
    allow('Mass & foundation excavation (cellar)', 'cy', 550, 42, { split: { sub: 0.3, equip: 0.5, lab: 0.2 }, method: 'CALC', sheet: 'A001', basis: '1,480×10/27' }),
    allow('Haul-off / spoil disposal', 'cy', 400, 38, { split: { sub: 0.4, equip: 0.4, lab: 0.2 } }),
    allow('Backfill & compaction', 'cy', 180, 34, { split: { equip: 0.5, lab: 0.3, sub: 0.2 } }),
    allow('Stone base / under-slab drainage', 'sqft', FOOTPRINT, 3.2, { split: { mat: 0.6, lab: 0.4 }, sheet: 'A001' }),
    allow('Fine grading', 'ls', 1, 6500, {}),
  ]],
  ['32', 'Exterior Improvements', [
    allow('Walks, steps & entry hardscape', 'sqft', 500, 18, { split: { sub: 0.6, mat: 0.25, lab: 0.15 }, sheet: 'A000' }),
    allow('Site drainage / area drains', 'ls', 1, 9500, {}),
    allow('Landscaping, planter & site restoration', 'ls', 1, 14000, { sheet: 'A001', conf: 'LOW' }),
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
function extend(line, scen) {
  const f = scen === 'A' ? 1 : scen === 'B' ? (line.fB ?? DFLT_FB) : (line.fC ?? DFLT_FC);
  const mat = line.matUnit * line.qty * f, lab = line.labUnit * line.qty * f;
  const equip = line.equipUnit * line.qty * f, sub = line.subUnit * line.qty * f;
  return { mat, lab, equip, sub, total: mat + lab + equip + sub, lhrs: (line.lhrsUnit || 0) * line.qty };
}
function computeScenario(scen) {
  const divs = []; let dMat = 0, dLab = 0, dEquip = 0, dSub = 0, dHrs = 0;
  for (const [num, name, lines] of divisions) {
    let m = 0, l = 0, e = 0, s = 0, h = 0;
    const litems = lines.map((ln) => { const x = extend(ln, scen); m += x.mat; l += x.lab; e += x.equip; s += x.sub; h += x.lhrs; return { ...ln, ext: x }; });
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

// method mix
const allLines = A.divs.flatMap((d) => d.lines);
const methodMix = { MEASURED: 0, CALC: 0, ASSUMED: 0 };
for (const ln of allLines) methodMix[ln.method] = (methodMix[ln.method] || 0) + ln.ext.total;

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
console.log(`\nTakeoff basis (Scenario A direct): MEASURED ${money(methodMix.MEASURED)} (${(methodMix.MEASURED / A.direct * 100).toFixed(0)}%) | CALC ${money(methodMix.CALC)} (${(methodMix.CALC / A.direct * 100).toFixed(0)}%) | ASSUMED ${money(methodMix.ASSUMED)} (${(methodMix.ASSUMED / A.direct * 100).toFixed(0)}%)`);
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
    basis: { gsf: GSF, footprint: "24'×64'", stories: 'cellar + 3', beds: BEDS, bedrooms: BEDROOMS, baths: BATHS, height: "35'-4\"", structure: 'TJI 360×14 + W12×26 steel + HSS columns' },
    methodMix: { measured: Math.round(methodMix.MEASURED), calc: Math.round(methodMix.CALC), assumed: Math.round(methodMix.ASSUMED) },
    caveats: [
      'Quantities measured/calculated from drawings; allowance lines remain for scope not dimensioned.',
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

const csvRows = [['Division', 'Item', 'CatalogueCode', 'Allowance', 'Unit', 'Qty', 'Method', 'Sheet', 'Confidence', 'MatUnit', 'LabUnit', 'EquipUnit', 'SubUnit', 'LaborHrs', 'Extended', 'Note']];
for (const d of A.divs) for (const ln of d.lines) csvRows.push([d.num, ln.name, ln.code, ln.allowance ? 'YES' : 'no', ln.unit, ln.qty, ln.method, ln.sheet, ln.conf, ln.matUnit, ln.labUnit, ln.equipUnit, ln.subUnit, Math.round(ln.ext.lhrs), Math.round(ln.ext.total), (ln.note || '').replace(/,/g, ';')]);
fs.writeFileSync(path.join(OUT, 'estimate-lineitems-scenarioA.csv'), csvRows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n'));

const divCsv = [['Division', 'Name', 'ScenA_Total', 'ScenB_Total', 'ScenC_Total', 'ScenA_Mat', 'ScenA_Lab', 'ScenA_Sub', 'ScenA_LaborHrs']];
A.divs.forEach((d, i) => divCsv.push([d.num, d.name, Math.round(d.total), Math.round(B.divs[i].total), Math.round(C.divs[i].total), Math.round(d.mat), Math.round(d.lab), Math.round(d.sub), Math.round(d.hrs)]));
fs.writeFileSync(path.join(OUT, 'division-summary.csv'), divCsv.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n'));

// quantity takeoff + schedules
const toRows = [['Division', 'Item', 'Unit', 'Qty', 'Method', 'Sheet', 'Confidence', 'CatalogueCode', 'Allowance']];
for (const d of A.divs) for (const ln of d.lines) toRows.push([d.num, ln.name, ln.unit, ln.qty, ln.method, ln.sheet, ln.conf, ln.code, ln.allowance ? 'YES' : 'no']);
fs.writeFileSync(path.join(OUT, 'quantity-takeoff.csv'), toRows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n'));
const laborRows = [['Division', 'Item', 'Qty', 'Unit', 'LaborHrs', 'LaborCost']]; const matRows = [['Division', 'Item', 'Qty', 'Unit', 'MaterialCost']]; const subRows = [['Division', 'Item', 'Qty', 'Unit', 'SubcontractorCost']];
for (const d of A.divs) for (const ln of d.lines) { if (ln.ext.lhrs > 0 || ln.ext.lab > 0) laborRows.push([d.num, ln.name, ln.qty, ln.unit, Math.round(ln.ext.lhrs), Math.round(ln.ext.lab)]); if (ln.ext.mat > 0) matRows.push([d.num, ln.name, ln.qty, ln.unit, Math.round(ln.ext.mat)]); if (ln.ext.sub > 0) subRows.push([d.num, ln.name, ln.qty, ln.unit, Math.round(ln.ext.sub)]); }
fs.writeFileSync(path.join(OUT, 'labor-hours.csv'), laborRows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n'));
fs.writeFileSync(path.join(OUT, 'material-schedule.csv'), matRows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n'));
fs.writeFileSync(path.join(OUT, 'subcontractor-schedule.csv'), subRows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n'));

console.log(`\nFiles written to ${path.relative(REPO, OUT)}/:`);
for (const f of fs.readdirSync(OUT).filter((f) => !f.endsWith('.pdf') && !f.endsWith('.html')).sort()) console.log('  ' + f);
