/**
 * build-estimate-ctc.mjs
 * ---------------------------------------------------------------------------
 * CTC-PRICED variant of the 5213 Call Place SE group-home estimate.
 *
 * Prices the SAME takeoff against the Construction Task Catalog (data/ctc/
 * ctc-tasks.json) using real CTC task numbers and their labor/material/
 * equipment splits, with a JOC-style adjustment factor. Every scope item the
 * 41-task CTC sample cannot reach is a clearly labeled allowance (ctc:null),
 * and the script reports exactly how much of the building CTC actually covers.
 *
 *   node docs/estimates/5213-call-place-se/scripts/build-estimate-ctc.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '../../../..');
const OUT = path.join(__dirname, '../output');
const CTC = JSON.parse(fs.readFileSync(path.join(REPO, 'data/ctc/ctc-tasks.json'), 'utf8'));
const TASK = new Map(CTC.tasks.map((t) => [t.taskNumber, t]));

// ── Project + pricing constants ─────────────────────────────────────────────
const GSF = 5920, BEDS = 14, BEDROOMS = 8, BATHS = 7;
const TARGET_PSF = 170, TARGET_TOTAL = 1006400;
// CTC prices are DMV-2026 (Maryland DGS base). JOC adjustment factor (contractor
// coefficient) for DC prevailing conditions on a small project — labeled assumption.
const ADJ = 1.10;
const OH = 0.12, PROFIT = 0.15, CONTINGENCY = 0.07, BONDS_INS = 0.015, PERMIT = 22000;

// Geometry (assumed — no drawings). Same basis as the marketplace-catalogue run.
const P = 158, EXT_WALL_LF = 474, EXT_WALL_SF = 4740, CELLAR_WALL_SF = 1422;
const FOOTPRINT = 1480, DRYWALL_SF = 20000;

// ── Line helpers ────────────────────────────────────────────────────────────
// CTC-priced line: pulls unit L/M/E from the catalogue task, applies ADJ.
function ctc(taskNumber, qty, opts = {}) {
  const t = TASK.get(taskNumber);
  if (!t) throw new Error(`CTC task not found: ${taskNumber}`);
  return {
    ctc: taskNumber, csi: t.csiCode, name: opts.as || t.description, unit: t.uom, qty,
    matUnit: +(t.materialCost * ADJ).toFixed(2),
    labUnit: +(t.laborCost * ADJ).toFixed(2),
    equipUnit: +(t.equipmentCost * ADJ).toFixed(2),
    subUnit: 0,
    lhrsUnit: t.laborHours || 0,
    allowance: false, conf: opts.conf || 'MED', basis: opts.basis || '', note: opts.note || '',
  };
}
// Allowance line: CTC sample has no matching task. DC all-in unit, mostly sub.
function allow(name, unit, qty, aUnit, opts = {}) {
  const s = opts.split || { sub: 1 };
  return {
    ctc: null, csi: opts.csi || '', name, unit, qty,
    matUnit: +(aUnit * (s.mat || 0)).toFixed(2), labUnit: +(aUnit * (s.lab || 0)).toFixed(2),
    equipUnit: +(aUnit * (s.equip || 0)).toFixed(2), subUnit: +(aUnit * (s.sub || 0)).toFixed(2),
    lhrsUnit: opts.lhrsUnit || 0, allowance: true, conf: opts.conf || 'LOW',
    basis: opts.basis || '', note: opts.note || 'CTC sample has no matching task', aUnit,
  };
}

// ── Takeoff, priced through CTC where possible ──────────────────────────────
const divisions = [
  ['01', 'General Conditions', [
    ctc('01-002', 2080, { as: 'PM & field supervision (12 mo)', basis: 'CALC full-time' }),
    ctc('01-001', 4, { as: 'Mobilization / demobilization (phased)', basis: 'ASSUMED' }),
    ctc('01-003', 12, { as: 'Temporary facilities & controls', basis: 'ASSUMED monthly' }),
    ctc('01-010', 200, { as: 'Construction waste disposal', basis: 'ASSUMED 200 CY' }),
    allow('Safety, testing & special inspections, survey, structural eng., closeout', 'ls', 1, 46000, { basis: 'ASSUMED' }),
  ]],
  ['02', 'Existing Conditions', [
    allow('Clearing, erosion control, existing-condition allowance', 'ls', 1, 36000, { basis: 'ASSUMED', note: 'CTC has demo tasks but scope is new-build site prep — no match' }),
  ]],
  ['03', 'Concrete', [
    ctc('03-010', CELLAR_WALL_SF, { as: 'Foundation wall forming (to 8 ft)', basis: 'CALC P×9' }),
    ctc('03-020', 4400, { as: 'Reinforcing steel #4 (footings/slab/walls)', basis: 'CALC ~4,400 lb' }),
    ctc('03-001', FOOTPRINT, { as: 'Cellar slab on grade (4")', basis: 'CALC footprint' }),
    ctc('03-001', 400, { as: 'Exterior concrete (areaway/stoop/steps)', basis: 'ASSUMED' }),
    allow('Foundation wall concrete placement + footings + elevator pit + waterproofing', 'ls', 1, 58000, { basis: 'ASSUMED', note: 'CTC forms rebar only; wall pour/pit/WP not in sample' }),
  ]],
  ['04', 'Masonry', [
    allow('Brick veneer, CMU, lintels, flashing (full division)', 'ls', 1, 94316, { basis: 'CALC/ASSUMED', note: 'CTC sample has ZERO Division 04 tasks' }),
  ]],
  ['06', 'Wood, Plastics & Rough Carpentry', [
    ctc('06-001', 900, { as: 'Interior partition framing 2x4', basis: 'ASSUMED 900 LF' }),
    { ...ctc('06-001', EXT_WALL_LF, { as: 'Exterior wall framing 2x4 base', basis: 'CALC 474 LF' }) },
    ctc('06-001.01', EXT_WALL_LF, { as: 'Add for 2x6 exterior framing', basis: 'CALC 474 LF' }),
    ctc('06-010', 1200, { as: 'Base trim, paint grade', basis: 'ASSUMED 1,200 LF' }),
    allow('Floor framing, subfloor + wall + roof sheathing, roof trusses, stairs, elevator shaft framing, blocking', 'ls', 1, 118000, { basis: 'CALC/ASSUMED', note: 'CTC sample framing = stud walls + trim only' }),
  ]],
  ['07', 'Thermal & Moisture Protection', [
    ctc('07-001', EXT_WALL_SF, { as: 'Batt insulation R-13 (exterior walls)', basis: 'CALC facade' }),
    allow('TPO/rigid roof, air barrier, gutters, firestopping, sealants', 'ls', 1, 44000, { basis: 'ASSUMED', note: 'Building has flat TPO roof; CTC sample only has asphalt shingles (N/A)' }),
  ]],
  ['08', 'Openings', [
    ctc('08-001', 45, { as: 'Interior doors — hollow-core pre-hung', basis: 'ASSUMED 45' }),
    ctc('08-001.01', 45, { as: 'Add for solid-core (R-2)', basis: 'ASSUMED 45' }),
    ctc('08-010', 34, { as: 'Vinyl double-hung windows', basis: 'ASSUMED 34' }),
    allow('Exterior steel doors, commercial hardware, glazing', 'ls', 1, 16000, { basis: 'ASSUMED', note: 'Not in CTC sample' }),
  ]],
  ['09', 'Finishes', [
    ctc('09-001', DRYWALL_SF, { as: 'Drywall 5/8" Type X', basis: 'ASSUMED 20,000 SF' }),
    ctc('09-010', DRYWALL_SF, { as: 'Interior painting, 2 coats', basis: 'ASSUMED 20,000 SF' }),
    ctc('09-020', 840, { as: 'Ceramic floor tile (baths)', basis: 'CALC 7 baths' }),
    ctc('09-030', 1600, { as: 'Suspended ACT (cellar/kitchen/support)', basis: 'ASSUMED' }),
    allow('LVP flooring (bedrooms/common) + finish carpentry + rated shaft drywall', 'ls', 1, 42000, { basis: 'ASSUMED', note: 'LVP not in CTC sample' }),
  ]],
  ['10', 'Specialties', [
    allow('Grab bars, toilet accessories, signage, extinguishers, specialties', 'ls', 1, 14134, { basis: 'ASSUMED', note: 'CTC sample has no Division 10' }),
  ]],
  ['12', 'Furnishings (built-in)', [
    allow('Vanities, casework, countertops, built-in millwork', 'ls', 1, 22339, { basis: 'ASSUMED', note: 'CTC sample has no Division 12' }),
  ]],
  ['21', 'Fire Suppression', [
    allow('NFPA-13 sprinkler system, standpipe, testing', 'sqft', GSF, 9.12, { basis: 'ASSUMED GSF', note: 'CTC sample has ZERO Division 21' }),
  ]],
  ['22', 'Plumbing', [
    ctc('22-011', 7, { as: 'Water closets', basis: 'CALC 7 baths' }),
    ctc('22-010', 10, { as: 'Lavatories / sinks', basis: 'CALC' }),
    ctc('22-001', 800, { as: 'Copper water piping 3/4"', basis: 'ASSUMED 800 LF' }),
    allow('Tubs/showers, DWV, gas, water heaters, commercial-kitchen rough-in, laundry', 'ls', 1, 58000, { basis: 'ASSUMED', note: 'Only WC/lav/water-pipe in CTC sample' }),
  ]],
  ['23', 'HVAC', [
    ctc('23-010', 4, { as: 'Split systems (3-ton, 14 SEER) ×4 zones', basis: 'STATED four splits' }),
    allow('Ductwork, controls, bath exhaust, kitchen hood/MUA, TAB', 'ls', 1, 62000, { basis: 'ASSUMED', note: 'CTC duct is per-lb (not usable here); rest not in sample' }),
  ]],
  ['26', 'Electrical', [
    ctc('26-030', 2, { as: 'Distribution panels 200A', basis: 'ASSUMED' }),
    ctc('26-001', 1500, { as: 'Conduit / raceway 3/4" EMT', basis: 'ASSUMED 1,500 LF' }),
    ctc('26-010', 220, { as: 'Wiring devices (receptacles)', basis: 'ASSUMED' }),
    ctc('26-020', 120, { as: 'LED lighting fixtures', basis: 'ASSUMED' }),
    allow('400A service, branch wiring, kitchen/elevator rough-in, emergency & exit lighting, smoke detectors', 'ls', 1, 62000, { basis: 'ASSUMED', note: 'CTC sample panel only goes to 200A' }),
  ]],
  ['27/28', 'Communications & Electronic Safety', [
    allow('Fire alarm (R-2), data, security/access/intercom', 'sqft', GSF, 6.15, { basis: 'ASSUMED GSF', note: 'CTC sample has no Div 27/28' }),
  ]],
  ['31', 'Earthwork', [
    ctc('31-001', 550, { as: 'Mass & foundation excavation', basis: 'CALC cellar' }),
    ctc('31-002', 180, { as: 'Backfill & compaction', basis: 'ASSUMED' }),
    allow('Haul-off / spoil disposal, stone base, fine grading', 'ls', 1, 30000, { basis: 'ASSUMED', note: 'Not in CTC sample' }),
  ]],
  ['32', 'Exterior Improvements', [
    ctc('32-010', 2000, { as: 'Sodding / restoration', basis: 'ASSUMED' }),
    allow('Walks/steps, drainage, hardscape, landscaping', 'ls', 1, 28000, { basis: 'ASSUMED' }),
  ]],
  ['33', 'Utilities', [
    allow('Water, sewer, gas, electrical service connections', 'ls', 1, 62000, { basis: 'ASSUMED', note: 'CTC sample has no Division 33' }),
  ]],
];

// ── Compute ─────────────────────────────────────────────────────────────────
let dMat = 0, dLab = 0, dEquip = 0, dSub = 0, dHrs = 0, ctcDirect = 0, allowDirect = 0;
const divOut = [];
for (const [num, name, lines] of divisions) {
  let m = 0, l = 0, e = 0, s = 0, h = 0, ctcT = 0, allowT = 0;
  const litems = lines.map((ln) => {
    const mat = ln.matUnit * ln.qty, lab = ln.labUnit * ln.qty, eq = ln.equipUnit * ln.qty, sub = ln.subUnit * ln.qty;
    const total = mat + lab + eq + sub, lhrs = (ln.lhrsUnit || 0) * ln.qty;
    m += mat; l += lab; e += eq; s += sub; h += lhrs;
    if (ln.allowance) allowT += total; else ctcT += total;
    return { ...ln, ext: { mat, lab, equip: eq, sub, total, lhrs } };
  });
  divOut.push({ num, name, lines: litems, mat: m, lab: l, equip: e, sub: s, hrs: h, total: m + l + e + s, ctcT, allowT });
  dMat += m; dLab += l; dEquip += e; dSub += s; dHrs += h; ctcDirect += ctcT; allowDirect += allowT;
}
const direct = dMat + dLab + dEquip + dSub;
const overhead = direct * OH, profit = direct * PROFIT, contingency = direct * CONTINGENCY;
const bondsIns = (direct + overhead + profit) * BONDS_INS;
const total = direct + overhead + profit + contingency + bondsIns + PERMIT;
const psf = total / GSF;
const coveragePct = (ctcDirect / direct) * 100;

// ── Console ─────────────────────────────────────────────────────────────────
const money = (n) => '$' + Math.round(n).toLocaleString();
console.log('='.repeat(78));
console.log('5213 CALL PLACE SE — CTC-PRICED ESTIMATE (data/ctc catalogue)');
console.log(`GSF ${GSF.toLocaleString()} | JOC adjustment factor ${ADJ} | CTC 2026 DMV pricing`);
console.log('='.repeat(78));
for (const d of divOut) {
  const cov = d.total > 0 ? Math.round((d.ctcT / d.total) * 100) : 0;
  console.log(`Div ${d.num.padEnd(5)} ${d.name.padEnd(38)} ${money(d.total).padStart(12)}  CTC-priced ${String(cov).padStart(3)}%`);
}
console.log('-'.repeat(78));
console.log(`Direct construction        ${money(direct).padStart(14)}`);
console.log(`  · CTC-priced (real tasks)${money(ctcDirect).padStart(14)}   ${coveragePct.toFixed(1)}% of direct`);
console.log(`  · Allowance (CTC gaps)   ${money(allowDirect).padStart(14)}   ${(100 - coveragePct).toFixed(1)}% of direct`);
console.log(`Overhead 12%               ${money(overhead).padStart(14)}`);
console.log(`Profit 15%                 ${money(profit).padStart(14)}`);
console.log(`Contingency 7%             ${money(contingency).padStart(14)}`);
console.log(`Bonds & insurance 1.5%     ${money(bondsIns).padStart(14)}`);
console.log(`Permit allowance           ${money(PERMIT).padStart(14)}`);
console.log(`TOTAL (excl elev+kitchen)  ${money(total).padStart(14)}   $${psf.toFixed(0)}/SF`);
console.log(`   material ${money(dMat)} | labor ${money(dLab)} | equip ${money(dEquip)} | sub ${money(dSub)} | ${Math.round(dHrs).toLocaleString()} lab-hrs`);
console.log(`\nTarget ${money(TARGET_TOTAL)} @ $${TARGET_PSF}/SF — variance ${money(total - TARGET_TOTAL)} (${((psf / TARGET_PSF - 1) * 100).toFixed(0)}% over)`);
console.log(`\nCTC COVERAGE: only ${coveragePct.toFixed(1)}% of direct cost maps to a real CTC task.`);
console.log(`The 41-task sample cannot price ${(100 - coveragePct).toFixed(0)}% of the building — the licensed`);
console.log(`full ~4,666-task catalog is required to remove the allowances.`);

// ── Exports ─────────────────────────────────────────────────────────────────
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'estimate-ctc.json'), JSON.stringify({
  meta: {
    project: '5213 Call Place SE, Washington DC 20019',
    catalogue: 'Construction Task Catalog (data/ctc/ctc-tasks.json) — 41-task DMV-2026 sample',
    adjustmentFactor: ADJ, markups: { OH: 12, profit: 15, contingency: 7, bondsIns: 1.5 },
    ctcCoveragePct: +coveragePct.toFixed(1),
    caveats: [
      'Priced against the 41-task CTC dev sample; ' + (100 - coveragePct).toFixed(0) + '% of direct is allowance.',
      'No measured takeoff (permit PDF absent); quantities assumed/calculated.',
      'JOC adjustment factor ' + ADJ + ' assumed for DC conditions.',
    ],
  },
  totals: { direct, ctcDirect, allowDirect, coveragePct: +coveragePct.toFixed(1), overhead, profit, contingency, bondsIns, permit: PERMIT, total, psf: +psf.toFixed(2), laborHours: Math.round(dHrs) },
  divisions: divOut,
}, null, 2));

const rows = [['Div', 'CSI', 'Item', 'CTC_Task', 'PricedBy', 'Unit', 'Qty', 'MatUnit', 'LabUnit', 'EquipUnit', 'SubUnit', 'LaborHrs', 'Extended', 'Note']];
for (const d of divOut) for (const ln of d.lines) rows.push([d.num, ln.csi || '', ln.name, ln.ctc || '', ln.allowance ? 'ALLOWANCE' : 'CTC', ln.unit, ln.qty,
  ln.matUnit, ln.labUnit, ln.equipUnit, ln.subUnit, Math.round(ln.ext.lhrs), Math.round(ln.ext.total), (ln.note || '').replace(/,/g, ';')]);
fs.writeFileSync(path.join(OUT, 'estimate-ctc-lineitems.csv'), rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n'));

console.log(`\nWrote: output/estimate-ctc.json, output/estimate-ctc-lineitems.csv`);
