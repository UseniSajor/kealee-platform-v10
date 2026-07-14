/**
 * build-estimate.mjs
 * ---------------------------------------------------------------------------
 * Full CSI-division construction estimate for:
 *   5213 Call Place SE, Washington DC 20019
 *   New-construction detached group home / residential care (R-2), Type IIIB
 *   Cellar + 3 stories, 1,480 SF footprint, 5,920 GSF, ~35'-4" tall
 *   ~8 bedrooms / 14 beds / 7 bathrooms / 1 commercial kitchen / 1 elevator
 *
 * Runs THROUGH the Kealee catalogue + engine markup structure:
 *   - Catalogue-backed lines use REAL MARKETPLACE_ASSEMBLIES mid/low rates,
 *     parsed at runtime, DC region factor 1.15 (regionMultiplier.DC), + waste.
 *   - Institutional scope the catalogue does not carry is priced as a clearly
 *     labeled TEMPORARY ALLOWANCE (allowance:true) and listed in the
 *     missing-catalogue-item report. Nothing fabricated is presented as
 *     catalogue pricing.
 *   - Markups mirror EstimatingService: Overhead 12%, Profit 15%, Contingency 7%.
 *
 * NO measured takeoff was possible (permit PDF not present in this environment
 * at /mnt/data). Every quantity is ASSUMED or CALCULATED from the stated
 * building basis — flagged per line. Confidence is LOW-MED accordingly.
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

// ── Project constants ──────────────────────────────────────────────────────
const GSF = 5920, FOOTPRINT = 1480, BEDS = 14, BEDROOMS = 8, BATHS = 7;
const TARGET_PSF = 170, TARGET_TOTAL = 1006400;   // 170 * 5920
const DC = 1.15;                                   // regionMultiplier.DC
// Engine markup constants (packages/estimating/src/estimating.service.ts)
const OH = 0.12, PROFIT = 0.15, CONTINGENCY = 0.07;
const BONDS_INS = 0.015;                            // bonds + insurance (allowance)

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
    map.set(m[1], {
      code: m[1], name: str('name'), unit: str('unit'),
      matLow: num('materialCostLow'), matMid: num('materialCostMid'),
      labLow: num('laborCostLow'), labMid: num('laborCostMid'),
      lhrs: num('laborHoursPerUnit') ?? 0,
    });
  }
  return map;
}
const CAT = loadCatalogue();

// helper: catalogue-backed line (DC-adjusted). tier 'mid' for A, 'low' for C.
function cat(code, qty, opts = {}) {
  const a = CAT.get(code);
  if (!a) throw new Error(`Catalogue code missing: ${code} (would be a defect)`);
  const waste = opts.waste ?? 0.05;
  return {
    code, name: a.name, unit: a.unit, qty,
    matUnit: +(((opts.tier === 'low' ? a.matLow : a.matMid) ?? 0) * DC * (1 + waste)).toFixed(2),
    labUnit: +(((opts.tier === 'low' ? a.labLow : a.labMid) ?? 0) * DC).toFixed(2),
    equipUnit: 0, subUnit: 0,
    lhrsUnit: a.lhrs,
    allowance: false,
    waste, prod: opts.prod ?? 1.0,
    basis: opts.basis, conf: opts.conf ?? 'MED',
    note: opts.note ?? '',
  };
}
// helper: labeled allowance line (DC all-in direct unit, split mostly to sub).
function allow(name, unit, qty, aUnit, opts = {}) {
  const split = opts.split ?? { sub: 1, mat: 0, lab: 0, equip: 0 };
  return {
    code: opts.code ?? 'ALLOWANCE', name, unit, qty,
    matUnit: +(aUnit * (split.mat ?? 0)).toFixed(2),
    labUnit: +(aUnit * (split.lab ?? 0)).toFixed(2),
    equipUnit: +(aUnit * (split.equip ?? 0)).toFixed(2),
    subUnit: +(aUnit * (split.sub ?? 0)).toFixed(2),
    lhrsUnit: opts.lhrsUnit ?? 0,
    allowance: true,
    waste: 0, prod: 1.0,
    basis: opts.basis, conf: opts.conf ?? 'LOW',
    note: opts.note ?? '',
    aUnit,
  };
}

// Scenario factors: B = value-engineered, C = minimum viable. Applied to unit costs.
// Overridable per line via {fB, fC}. Defaults reflect typical VE / budget deltas.
const DFLT_FB = 0.88, DFLT_FC = 0.76;

// ── LINE ITEMS BY CSI DIVISION ─────────────────────────────────────────────
// qtyBasis: CALC (geometry) | ASSUMED (allowance/gross-area, no drawing)
const P = 158;                       // assumed building perimeter LF (~40x39 footprint)
const STORIES = 3;                   // above-grade
const FF = 10;                       // floor-to-floor ft (assumed)
const EXT_WALL_LF = P * STORIES;     // 474 LF exterior wall runs
const EXT_WALL_SF = P * 30;          // 4,740 SF above-grade facade gross
const CELLAR_WALL_SF = P * 9;        // 1,422 SF below-grade wall
const ELEV_FLOORS_SF = FOOTPRINT * 3;// 4,440 SF elevated floor framing
const DRYWALL_SF = 20000;            // 2.4xGSF wall + 1.0xGSF ceiling (assumed)

const divisions = [
  ['01', 'General Conditions', [
    cat('GEN-PM-WEEKLY', 52, { basis: 'CALC 12-mo schedule', conf: 'MED', note: 'Project management, weekly' }),
    allow('Site superintendent (12 mo)', 'mo', 12, 9500, { split: { lab: 1 }, basis: 'ASSUMED 12-mo build', note: 'Full-time super; not in catalogue' }),
    allow('Mobilization / demobilization', 'ls', 1, 18000, { basis: 'ASSUMED', note: 'CTC 01-001 analog' }),
    cat('GEN-TEMP-POWER', 12, { basis: 'ASSUMED monthly', note: 'Temporary power' }),
    allow('Temporary water / heat / enclosure', 'mo', 12, 850, { basis: 'ASSUMED' }),
    cat('GEN-PORT-TOILET', 12, { basis: 'ASSUMED monthly' }),
    allow('Safety / OSHA / PPE program', 'ls', 1, 14000, { basis: 'ASSUMED', note: 'Not in catalogue' }),
    cat('GEN-DUMP-30', 10, { basis: 'ASSUMED 10 pulls' }),
    cat('GEN-CLEANUP-FINAL', GSF, { basis: 'CALC GSF' }),
    allow('Testing & special inspections (Type IIIB)', 'ls', 1, 16000, { basis: 'ASSUMED', note: 'Concrete/masonry/firestop special inspections' }),
    cat('GEN-SURVEY', 1, { basis: 'ASSUMED' }),
    cat('GEN-ENGINEER', 1, { basis: 'ASSUMED', note: 'Structural engineering' }),
    allow('Closeout / as-builts / O&M / commissioning', 'ls', 1, 9000, { basis: 'ASSUMED' }),
  ]],
  ['02', 'Existing Conditions', [
    allow('Clearing & site preparation', 'ls', 1, 12000, { basis: 'ASSUMED — no site plan', conf: 'LOW' }),
    allow('Erosion & sediment control (DOEE/SWM)', 'ls', 1, 9000, { basis: 'ASSUMED DC SWM' }),
    allow('Existing-condition / unforeseen allowance', 'ls', 1, 15000, { basis: 'ASSUMED', note: 'Demo of any existing structure unknown' }),
  ]],
  ['03', 'Concrete', [
    cat('FOUND-FOOTER-NEW', P, { basis: 'CALC perimeter 158 LF', conf: 'MED' }),
    allow('Foundation wall — 8" CIP (form+rebar+pour+strip)', 'sqft', CELLAR_WALL_SF, 34, { split: { sub: 0.55, mat: 0.25, lab: 0.2 }, basis: 'CALC P x 9ft', note: 'Catalogue lacks CIP wall assembly (only FOUND-STEM-WALL/lf)' }),
    cat('CONC-POUR-4', FOOTPRINT, { basis: 'CALC cellar slab 1,480 SF', note: 'Cellar slab on grade' }),
    cat('CONC-REBAR', FOOTPRINT, { basis: 'CALC slab area' }),
    allow('Elevator pit (excavate/form/pour/waterproof)', 'ea', 1, 9500, { basis: 'ASSUMED 1 hoistway', note: 'Base-building — elevator EQUIP excluded' }),
    allow('Exterior concrete (areaway, stoop, steps)', 'sqft', 400, 24, { split: { sub: 0.6, mat: 0.25, lab: 0.15 }, basis: 'ASSUMED' }),
    cat('FOUND-WP-EXT', P, { basis: 'CALC perimeter', note: 'Exterior foundation waterproofing' }),
  ]],
  ['04', 'Masonry', [
    cat('SID-BRICK-VEN', 2400, { basis: 'CALC ~street+return facades', conf: 'LOW', note: 'Brick veneer — Type IIIB facade' }),
    allow('CMU backup / party & cellar walls', 'sqft', 800, 18, { split: { sub: 0.5, mat: 0.3, lab: 0.2 }, basis: 'ASSUMED', note: 'Catalogue has no CMU assembly' }),
    allow('Lintels, flashing, masonry accessories', 'ls', 1, 6500, { basis: 'ASSUMED' }),
  ]],
  ['06', 'Wood, Plastics & Rough Carpentry', [
    cat('FRAME-FLOOR-2X10', ELEV_FLOORS_SF, { waste: 0.10, basis: 'CALC 3 elevated floors x 1,480', conf: 'MED' }),
    cat('FRAME-SHEATH-SUB', ELEV_FLOORS_SF, { waste: 0.10, basis: 'CALC subfloor sheathing' }),
    cat('FRAME-WALL-2X6', EXT_WALL_LF, { waste: 0.10, basis: 'CALC exterior wall 474 LF' }),
    cat('FRAME-WALL-2X4', 900, { waste: 0.10, basis: 'ASSUMED interior partitions 900 LF', conf: 'LOW' }),
    cat('FRAME-SHEATH-WALL', EXT_WALL_SF, { waste: 0.10, basis: 'CALC facade gross 4,740 SF' }),
    cat('FRAME-ROOF-TRUSS', 20, { basis: 'CALC ~20 trusses @ 2ft OC', conf: 'LOW' }),
    cat('FRAME-SHEATH-ROOF', FOOTPRINT, { waste: 0.10, basis: 'CALC roof 1,480 SF' }),
    cat('FRAME-STAIR', 4, { basis: 'CALC cellar->3 = 4 runs' }),
    allow('Elevator shaft framing & 2-hr rated enclosure', 'ea', 1, 14000, { basis: 'ASSUMED', note: 'Base-building hoistway enclosure' }),
    allow('Blocking, backing, misc rough carpentry', 'sqft', GSF, 1.25, { split: { mat: 0.5, lab: 0.5 }, basis: 'ASSUMED GSF' }),
  ]],
  ['07', 'Thermal & Moisture Protection', [
    cat('FRAME-INSUL-BATT', EXT_WALL_SF, { basis: 'CALC exterior walls' }),
    allow('Roof / rigid insulation + air/vapor barrier', 'sqft', FOOTPRINT, 4.5, { split: { sub: 0.4, mat: 0.35, lab: 0.25 }, basis: 'CALC roof area' }),
    allow('House wrap / weather-resistive barrier', 'sqft', EXT_WALL_SF, 1.35, { split: { mat: 0.5, lab: 0.5 }, basis: 'CALC facade' }),
    cat('ROOF-FLAT-TPO', +(FOOTPRINT / 100).toFixed(2), { basis: 'CALC 14.8 squares', note: 'TPO low-slope roof' }),
    allow('Gutters, downspouts, flashing, coping', 'ls', 1, 8500, { basis: 'ASSUMED' }),
    allow('Firestopping / rated assemblies (Type IIIB)', 'sqft', GSF, 1.1, { split: { sub: 0.6, mat: 0.2, lab: 0.2 }, basis: 'ASSUMED GSF', note: 'Code-required; not in catalogue' }),
    allow('Sealants & caulking', 'ls', 1, 4500, { basis: 'ASSUMED' }),
  ]],
  ['08', 'Openings', [
    cat('DOOR-INT-SOLID', 45, { basis: 'ASSUMED 8 BR+7 BA+closets/utility', conf: 'LOW' }),
    cat('DOOR-EXT-STEEL', 3, { basis: 'ASSUMED entries/egress' }),
    cat('WIN-VIN-DH', 34, { basis: 'ASSUMED fenestration count', conf: 'LOW' }),
    allow('Commercial hardware upgrade (levers, closers, panic)', 'ea', 48, 145, { split: { mat: 0.7, lab: 0.3 }, basis: 'ASSUMED R-2 hardware' }),
    allow('Glazing / vision panels / borrowed lites', 'ls', 1, 3500, { basis: 'ASSUMED' }),
  ]],
  ['09', 'Finishes', [
    cat('DRY-HANG-STD', DRYWALL_SF, { waste: 0.10, basis: 'ASSUMED 2.4xGSF wall + ceiling', conf: 'LOW' }),
    cat('DRY-TAPE-L4', DRYWALL_SF, { basis: 'ASSUMED same area' }),
    allow('Rated shaft/corridor drywall upgrade (Type X)', 'sqft', 3500, 1.1, { split: { mat: 0.4, lab: 0.6 }, basis: 'ASSUMED' }),
    allow('Suspended ACT ceilings (cellar/kitchen/support)', 'sqft', 1600, 7.2, { split: { sub: 0.5, mat: 0.3, lab: 0.2 }, basis: 'ASSUMED' }),
    cat('FLR-TILE-PORC', 840, { basis: 'CALC 7 baths ~120 SF ea' }),
    cat('FLR-LVP', 4200, { basis: 'ASSUMED bedrooms/common', conf: 'LOW' }),
    cat('PAINT-INT-WALL', DRYWALL_SF, { basis: 'ASSUMED wall+ceiling area' }),
    allow('Finish carpentry — base, casing, trim', 'sqft', GSF, 2.6, { split: { mat: 0.4, lab: 0.6 }, basis: 'ASSUMED GSF' }),
  ]],
  ['10', 'Specialties', [
    cat('BATH-ACC-GRAB', 21, { basis: 'ASSUMED 3 bars x 7 baths', note: 'ADA/ANSI A117.1' }),
    allow('Toilet accessories sets (7 baths)', 'ea', 7, 220, { split: { mat: 0.7, lab: 0.3 }, basis: 'ASSUMED' }),
    allow('Signage — egress / ADA / room ID', 'ls', 1, 4200, { basis: 'ASSUMED R-2' }),
    allow('Fire extinguishers & cabinets', 'ea', 8, 165, { split: { mat: 0.8, lab: 0.2 }, basis: 'ASSUMED' }),
    allow('Misc specialties (lockers, mail, corner guards)', 'ls', 1, 3500, { basis: 'ASSUMED' }),
  ]],
  ['12', 'Furnishings (built-in)', [
    cat('BATH-VAN-STD', 7, { basis: 'CALC 7 baths' }),
    allow('Common/kitchen casework & countertops (base-bldg)', 'lf', 40, 240, { split: { sub: 0.5, mat: 0.35, lab: 0.15 }, basis: 'ASSUMED', note: 'Built-in millwork; loose FF&E excluded' }),
    allow('Closet/pantry shelving & built-ins', 'ls', 1, 6500, { basis: 'ASSUMED' }),
  ]],
  ['21', 'Fire Suppression', [
    allow('Sprinkler system — NFPA 13, full building', 'sqft', GSF, 6.5, { split: { sub: 1 }, basis: 'ASSUMED GSF', conf: 'LOW', note: 'No catalogue Div-21 assembly' }),
    allow('Fire service / standpipe / FDC allowance', 'ls', 1, 12000, { basis: 'ASSUMED' }),
    allow('Sprinkler testing & certification', 'ls', 1, 3500, { basis: 'ASSUMED' }),
  ]],
  ['22', 'Plumbing', [
    cat('BATH-TOIL-STD', 7, { basis: 'CALC 7 baths' }),
    allow('Lavatories / sinks (7 baths + common)', 'ea', 10, 620, { split: { sub: 0.55, mat: 0.3, lab: 0.15 }, basis: 'CALC', lhrsUnit: 4 }),
    cat('BATH-TUB-STD', 7, { basis: 'CALC bath/shower per bathroom' }),
    allow('DWV + water supply distribution (by fixture)', 'ea', 34, 950, { split: { sub: 0.5, lab: 0.3, mat: 0.2 }, basis: 'CALC ~34 fixtures', note: 'Aggregated DWV/supply', lhrsUnit: 6 }),
    cat('PLUMB-GAS-LINE', 180, { basis: 'ASSUMED gas distribution LF' }),
    allow('Water heaters — commercial (2 x 75-100 gal)', 'ea', 2, 4200, { split: { sub: 0.5, mat: 0.4, lab: 0.1 }, basis: 'ASSUMED', lhrsUnit: 8 }),
    allow('Laundry rough-in (2 stacks)', 'ea', 2, 1400, { split: { sub: 0.6, lab: 0.25, mat: 0.15 }, basis: 'ASSUMED' }),
    allow('Commercial-kitchen plumbing/gas rough-in (base-bldg)', 'ls', 1, 22000, { basis: 'ASSUMED', conf: 'LOW', note: 'Rough-in ONLY — kitchen equipment excluded' }),
  ]],
  ['23', 'HVAC', [
    allow('Split HVAC systems (4 zones, cond+AH+lineset)', 'ea', 4, 9800, { split: { sub: 0.5, mat: 0.4, lab: 0.1 }, basis: 'STATED four split systems', lhrsUnit: 16, note: 'Catalogue HVAC-MINI-MULTI analog, up-scoped to ducted split' }),
    allow('Ductwork distribution', 'lf', 900, 22, { split: { sub: 0.5, mat: 0.3, lab: 0.2 }, basis: 'ASSUMED', lhrsUnit: 0.3 }),
    allow('Controls / thermostats / zoning', 'ls', 1, 7500, { basis: 'ASSUMED' }),
    cat('BATH-VENT-STD', 7, { basis: 'CALC bath exhaust' }),
    allow('Kitchen exhaust hood curb, ductwork & make-up air (base-bldg)', 'ls', 1, 26000, { basis: 'ASSUMED', conf: 'LOW', note: 'Base-building ventilation ONLY — hood/MUA equipment excluded' }),
    allow('Test, adjust & balance', 'ls', 1, 4500, { basis: 'ASSUMED' }),
  ]],
  ['26', 'Electrical', [
    cat('ELEC-PNL-400', 1, { basis: 'ASSUMED 400A service' }),
    cat('ELEC-PNL-200', 2, { basis: 'ASSUMED distribution panels' }),
    allow('Feeders & branch wiring (building-wide)', 'sqft', GSF, 9.5, { split: { sub: 0.4, mat: 0.35, lab: 0.25 }, basis: 'ASSUMED GSF', conf: 'LOW', lhrsUnit: 0.05 }),
    allow('Lighting package (LED, interior/exterior)', 'sqft', GSF, 4.2, { split: { sub: 0.4, mat: 0.4, lab: 0.2 }, basis: 'ASSUMED GSF' }),
    allow('Wiring devices & plates', 'ea', 220, 42, { split: { mat: 0.4, lab: 0.6 }, basis: 'ASSUMED' }),
    allow('HVAC power / equipment connections', 'ea', 6, 650, { split: { lab: 0.6, mat: 0.4 }, basis: 'ASSUMED' }),
    allow('Commercial-kitchen electrical rough-in (base-bldg)', 'ls', 1, 9500, { basis: 'ASSUMED', note: 'Rough-in only — kitchen equipment excluded' }),
    allow('Elevator power rough-in & disconnect', 'ls', 1, 4800, { basis: 'ASSUMED', note: 'Base-building — elevator equipment excluded' }),
    allow('Emergency & exit lighting (egress)', 'ea', 24, 320, { split: { mat: 0.6, lab: 0.4 }, basis: 'ASSUMED R-2 egress' }),
    cat('ELEC-SMOKE', 14, { basis: 'ASSUMED 14 devices' }),
  ]],
  ['27/28', 'Communications & Electronic Safety', [
    allow('Fire alarm system — addressable (R-2)', 'sqft', GSF, 2.6, { split: { sub: 1 }, basis: 'ASSUMED GSF', conf: 'LOW', note: 'No catalogue Div-28 assembly' }),
    cat('ELEC-CAT6', 20, { basis: 'ASSUMED data drops' }),
    allow('Security / access control / intercom / CCTV', 'ls', 1, 18000, { basis: 'ASSUMED', conf: 'LOW' }),
  ]],
  ['31', 'Earthwork', [
    allow('Mass & foundation excavation (cellar)', 'cy', 550, 42, { split: { sub: 0.3, equip: 0.5, lab: 0.2 }, basis: 'CALC 1,480 x 10ft / 27', conf: 'LOW' }),
    allow('Haul-off / spoil disposal', 'cy', 400, 38, { split: { sub: 0.4, equip: 0.4, lab: 0.2 }, basis: 'ASSUMED' }),
    allow('Backfill & compaction', 'cy', 180, 34, { split: { equip: 0.5, lab: 0.3, sub: 0.2 }, basis: 'ASSUMED' }),
    allow('Stone base / under-slab drainage', 'sqft', FOOTPRINT, 3.2, { split: { mat: 0.6, lab: 0.4 }, basis: 'CALC footprint' }),
    allow('Fine grading', 'ls', 1, 6500, { basis: 'ASSUMED' }),
  ]],
  ['32', 'Exterior Improvements', [
    allow('Walks, steps & entry hardscape', 'sqft', 500, 18, { split: { sub: 0.6, mat: 0.25, lab: 0.15 }, basis: 'ASSUMED' }),
    allow('Site drainage / area drains', 'ls', 1, 9500, { basis: 'ASSUMED' }),
    allow('Landscaping & site restoration', 'ls', 1, 14000, { basis: 'ASSUMED', conf: 'LOW' }),
  ]],
  ['33', 'Utilities', [
    allow('Domestic water service & tap', 'ls', 1, 18000, { basis: 'ASSUMED DC Water', conf: 'LOW' }),
    allow('Sanitary sewer service & connection', 'ls', 1, 20000, { basis: 'ASSUMED DC Water' }),
    allow('Gas service & meter', 'ls', 1, 9000, { basis: 'ASSUMED Washington Gas' }),
    allow('Electrical service lateral / transformer coord', 'ls', 1, 15000, { basis: 'ASSUMED Pepco' }),
  ]],
];

// ── EXCLUDED equipment (NOT in base total) ─────────────────────────────────
const exclusions = {
  elevator: [
    ['Passenger elevator equipment (holed/holeless hydraulic or MRL)', 68000],
    ['Elevator cab, doors & landing entrances', 22000],
    ['Rails, controls & fixtures', 18000],
    ['Elevator installation labor', 24000],
    ['Testing, inspection & DCRA certification', 6000],
  ],
  kitchen: [
    ['Type I exhaust hood package', 14000],
    ['Hood fire suppression (Ansul)', 6500],
    ['Make-up air unit (if equipment-scoped)', 12000],
    ['Walk-in refrigerator', 11000],
    ['Walk-in freezer', 13000],
    ['Cooking equipment (range, ovens, fryer, griddle)', 28000],
    ['Commercial dishwasher', 9000],
    ['Stainless prep tables, sinks, shelving', 12000],
    ['Loose / owner-furnished food-service equipment', 15000],
  ],
};

// ── COMPUTE ────────────────────────────────────────────────────────────────
function extend(line, scen) {
  const f = scen === 'A' ? 1 : scen === 'B' ? (line.fB ?? DFLT_FB) : (line.fC ?? DFLT_FC);
  const mat = line.matUnit * line.qty * f;
  const lab = line.labUnit * line.qty * f;
  const equip = line.equipUnit * line.qty * f;
  const sub = line.subUnit * line.qty * f;
  const total = mat + lab + equip + sub;
  const lhrs = (line.lhrsUnit || 0) * line.qty;
  return { mat, lab, equip, sub, total, lhrs };
}

function computeScenario(scen) {
  const divs = [];
  let dMat = 0, dLab = 0, dEquip = 0, dSub = 0, dHrs = 0;
  for (const [num, name, lines] of divisions) {
    let m = 0, l = 0, e = 0, s = 0, h = 0;
    const litems = lines.map((ln) => {
      const x = extend(ln, scen);
      m += x.mat; l += x.lab; e += x.equip; s += x.sub; h += x.lhrs;
      return { ...ln, ext: x };
    });
    divs.push({ num, name, lines: litems, mat: m, lab: l, equip: e, sub: s, hrs: h, total: m + l + e + s });
    dMat += m; dLab += l; dEquip += e; dSub += s; dHrs += h;
  }
  const direct = dMat + dLab + dEquip + dSub;      // includes Div-01 general conditions
  const overhead = direct * OH;
  const profit = direct * PROFIT;
  const contingency = direct * (scen === 'B' ? 0.05 : scen === 'C' ? 0.05 : CONTINGENCY);
  const bondsIns = (direct + overhead + profit) * BONDS_INS;
  const permit = scen === 'C' ? 14000 : 22000;      // DCRA building permit allowance
  const total = direct + overhead + profit + contingency + bondsIns + permit;
  return {
    scen, divs,
    material: dMat, labor: dLab, equipment: dEquip, subcontractor: dSub, laborHours: dHrs,
    direct, overhead, profit, contingency, bondsIns, permit, total,
    psf: total / GSF,
  };
}

const A = computeScenario('A');
const B = computeScenario('B');
const C = computeScenario('C');

const elevatorAllow = exclusions.elevator.reduce((s, [, v]) => s + v, 0);
const kitchenAllow = exclusions.kitchen.reduce((s, [, v]) => s + v, 0);

// ── OUTPUT: console summary ────────────────────────────────────────────────
const money = (n) => '$' + Math.round(n).toLocaleString();
const psf = (n) => '$' + (n).toFixed(0) + '/SF';

console.log('='.repeat(78));
console.log('5213 CALL PLACE SE — GROUP HOME (R-2) — KEALEE CATALOGUE ESTIMATE');
console.log(`GSF ${GSF.toLocaleString()} | ${BEDROOMS} BR | ${BEDS} beds | ${BATHS} baths | DC factor ${DC}`);
console.log('='.repeat(78));
for (const S of [A, B, C]) {
  const label = { A: 'A · Catalogue Market', B: 'B · Value-Engineered (target)', C: 'C · Minimum Viable' }[S.scen];
  console.log(`\nSCENARIO ${label}`);
  console.log(`  Direct construction     ${money(S.direct).padStart(14)}`);
  console.log(`  Overhead (12%)          ${money(S.overhead).padStart(14)}`);
  console.log(`  Profit (15%)            ${money(S.profit).padStart(14)}`);
  console.log(`  Contingency             ${money(S.contingency).padStart(14)}`);
  console.log(`  Bonds & insurance       ${money(S.bondsIns).padStart(14)}`);
  console.log(`  Permit allowance        ${money(S.permit).padStart(14)}`);
  console.log(`  ---------------------------------------`);
  console.log(`  TOTAL (excl. elev+kit)  ${money(S.total).padStart(14)}   ${psf(S.psf)}`);
  console.log(`     material ${money(S.material)} | labor ${money(S.labor)} | equip ${money(S.equipment)} | sub ${money(S.subcontractor)} | ${Math.round(S.laborHours).toLocaleString()} lab-hrs`);
}
console.log(`\nTARGET: ${money(TARGET_TOTAL)} @ ${psf(TARGET_PSF)}`);
console.log(`Scenario A variance vs target: ${money(A.total - TARGET_TOTAL)} (${((A.psf/TARGET_PSF-1)*100).toFixed(1)}% over)`);
console.log(`\nEXCLUDED (shown separately, NOT in base):`);
console.log(`  Elevator equipment allowance:        ${money(elevatorAllow)}`);
console.log(`  Commercial kitchen equipment allow:  ${money(kitchenAllow)}`);

// Top cost drivers (Scenario A, by division)
const drivers = A.divs.map(d => ({ k: `Div ${d.num} ${d.name}`, v: d.total })).sort((a, b) => b.v - a.v);
console.log(`\nTOP COST DRIVERS (Scenario A, by division):`);
drivers.slice(0, 15).forEach((d, i) => console.log(`  ${String(i + 1).padStart(2)}. ${d.k.padEnd(42)} ${money(d.v).padStart(12)}  ${((d.v / A.direct) * 100).toFixed(1)}%`));

// ── OUTPUT: files ──────────────────────────────────────────────────────────
fs.mkdirSync(OUT, { recursive: true });

// Owner summary
const owner = {
  project: '5213 Call Place SE, Washington DC 20019',
  type: 'New construction detached group home / residential care (R-2), Type IIIB',
  gsf: GSF, beds: BEDS, bedrooms: BEDROOMS, bathrooms: BATHS,
  recommendedBaseBuilding: Math.round(A.total),
  costPerGSF: +A.psf.toFixed(2),
  costPerBed: Math.round(A.total / BEDS),
  costPerBedroom: Math.round(A.total / BEDROOMS),
  costPerBathroom: Math.round(A.total / BATHS),
  costExclElevatorAndKitchen: Math.round(A.total),
  elevatorAllowanceSeparate: elevatorAllow,
  kitchenEquipmentAllowanceSeparate: kitchenAllow,
  allInWithExcludedAllowances: Math.round(A.total) + elevatorAllow + kitchenAllow,
};

// Full JSON export
const jsonExport = {
  meta: {
    project: owner.project, type: owner.type,
    generated: new Date().toISOString(),
    engine: 'Kealee packages/estimating (EstimatingService markup structure)',
    catalogue: 'MARKETPLACE_ASSEMBLIES (DC-Baltimore 2024-25) — mid tier, DC region factor 1.15',
    markups: { overheadPct: 12, profitPct: 15, contingencyPct_A: 7, contingencyPct_BC: 5, bondsInsPct: 1.5 },
    basis: { gsf: GSF, footprint: FOOTPRINT, stories: 'cellar + 3', beds: BEDS, bedrooms: BEDROOMS, baths: BATHS },
    caveats: [
      'Permit PDF not present at /mnt/data in this environment — NO measured takeoff performed.',
      'All quantities ASSUMED or CALCULATED from stated building basis; confidence LOW-MED.',
      'No group-home project-type mapping exists; new-construction mappings resolve to $0 (see engine-run-diagnostics.json).',
      'Allowance lines (allowance:true) are NOT catalogue-priced — see missing-catalogue-item report.',
      'Not persisted to database: no DATABASE_URL / Prisma client in this environment.',
    ],
  },
  target: { psf: TARGET_PSF, total: TARGET_TOTAL },
  scenarios: { A, B, C },
  exclusions: { elevator: exclusions.elevator, elevatorTotal: elevatorAllow, kitchen: exclusions.kitchen, kitchenTotal: kitchenAllow },
  ownerSummary: owner,
  topDrivers: drivers.slice(0, 15),
};
fs.writeFileSync(path.join(OUT, 'estimate.json'), JSON.stringify(jsonExport, null, 2));

// CSV line-item export (Scenario A detail)
const csvRows = [['Division', 'CSI', 'Item', 'CatalogueCode', 'Allowance', 'Unit', 'Qty', 'QtyBasis', 'Confidence',
  'MatUnit', 'LabUnit', 'EquipUnit', 'SubUnit', 'Waste', 'LaborHrs', 'Extended', 'Note']];
for (const d of A.divs) {
  for (const ln of d.lines) {
    csvRows.push([d.num, d.num, ln.name, ln.code, ln.allowance ? 'YES' : 'no', ln.unit, ln.qty, ln.basis || '', ln.conf,
      ln.matUnit, ln.labUnit, ln.equipUnit, ln.subUnit, ln.waste, Math.round(ln.ext.lhrs), Math.round(ln.ext.total), (ln.note || '').replace(/,/g, ';')]);
  }
}
const csv = csvRows.map(r => r.map(c => `"${String(c)}"`).join(',')).join('\n');
fs.writeFileSync(path.join(OUT, 'estimate-lineitems-scenarioA.csv'), csv);

// Division summary CSV (all scenarios)
const divCsv = [['Division', 'Name', 'ScenA_Total', 'ScenB_Total', 'ScenC_Total', 'ScenA_Mat', 'ScenA_Lab', 'ScenA_Sub', 'ScenA_LaborHrs']];
A.divs.forEach((d, i) => divCsv.push([d.num, d.name, Math.round(d.total), Math.round(B.divs[i].total), Math.round(C.divs[i].total),
  Math.round(d.mat), Math.round(d.lab), Math.round(d.sub), Math.round(d.hrs)]));
fs.writeFileSync(path.join(OUT, 'division-summary.csv'), divCsv.map(r => r.map(c => `"${c}"`).join(',')).join('\n'));

// Quantity takeoff report CSV (basis + confidence, distinguishes measured/calc/assumed)
const toRows = [['Division', 'Item', 'Unit', 'Qty', 'QtyBasis', 'MeasuredCountedCalcAssumed', 'Confidence', 'CatalogueCode', 'Allowance']];
for (const d of A.divs) for (const ln of d.lines) {
  const kind = ln.allowance ? 'ASSUMED' : (String(ln.basis || '').startsWith('CALC') ? 'CALCULATED' : 'ASSUMED');
  toRows.push([d.num, ln.name, ln.unit, ln.qty, ln.basis || '', kind, ln.conf, ln.code, ln.allowance ? 'YES' : 'no']);
}
fs.writeFileSync(path.join(OUT, 'quantity-takeoff.csv'), toRows.map(r => r.map(c => `"${c}"`).join(',')).join('\n'));

// Missing-catalogue-item report (JSON) — every allowance line = a catalogue gap
const missing = [];
for (const d of A.divs) for (const ln of d.lines) if (ln.allowance) {
  missing.push({ division: d.num, item: ln.name, unit: ln.unit, dcUnitAllowance: ln.aUnit ?? null, note: ln.note || '', recommendedCatalogueAction: `Add assembly for "${ln.name}" (Div ${d.num})` });
}
fs.writeFileSync(path.join(OUT, 'missing-catalogue-items.json'), JSON.stringify({
  brokenMappingsDefect: 'New-construction PROJECT_TYPE_ASSEMBLIES reference codes absent from MARKETPLACE_ASSEMBLIES (FND-*, FRM-*, MEP-*, EXT-SIDING-LAP, ROOF-SHINGLE-ARCH, GEN-SITE-PREP, STOREFRONT-GLASS, MOD-*). Engine returns ~$0 for these types.',
  noGroupHomeType: 'No R-2 / group-home / residential-care project type exists in PROJECT_TYPE_ASSEMBLIES.',
  missingAssemblyCount: missing.length,
  missing,
}, null, 2));

// Labor-hours + material + subcontractor schedules (Scenario A)
const laborRows = [['Division', 'Item', 'Qty', 'Unit', 'LaborHrs', 'LaborCost']];
const matRows = [['Division', 'Item', 'Qty', 'Unit', 'MaterialCost']];
const subRows = [['Division', 'Item', 'Qty', 'Unit', 'SubcontractorCost']];
for (const d of A.divs) for (const ln of d.lines) {
  if (ln.ext.lhrs > 0 || ln.ext.lab > 0) laborRows.push([d.num, ln.name, ln.qty, ln.unit, Math.round(ln.ext.lhrs), Math.round(ln.ext.lab)]);
  if (ln.ext.mat > 0) matRows.push([d.num, ln.name, ln.qty, ln.unit, Math.round(ln.ext.mat)]);
  if (ln.ext.sub > 0) subRows.push([d.num, ln.name, ln.qty, ln.unit, Math.round(ln.ext.sub)]);
}
fs.writeFileSync(path.join(OUT, 'labor-hours.csv'), laborRows.map(r => r.map(c => `"${c}"`).join(',')).join('\n'));
fs.writeFileSync(path.join(OUT, 'material-schedule.csv'), matRows.map(r => r.map(c => `"${c}"`).join(',')).join('\n'));
fs.writeFileSync(path.join(OUT, 'subcontractor-schedule.csv'), subRows.map(r => r.map(c => `"${c}"`).join(',')).join('\n'));

console.log(`\nFiles written to ${path.relative(REPO, OUT)}/:`);
for (const f of fs.readdirSync(OUT).sort()) console.log('  ' + f);
