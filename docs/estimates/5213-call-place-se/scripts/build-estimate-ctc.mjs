/**
 * build-estimate-ctc.mjs — CTC-priced version of the MEASURED 5213 Call Place
 * estimate.
 *
 * Reuses the exact measured takeoff, wage schedule, 6-month schedule, and
 * acceleration premium from output/estimate.json (produced by build-estimate.mjs),
 * and RE-PRICES each line against the Construction Task Catalog:
 *   - material + equipment  -> from the matched CTC task (current-year escalated)
 *   - labor                 -> CTC task labor-hours × your crew wage rate
 *   - unmatched lines        -> keep their marketplace/allowance value, flagged
 *
 * Catalog source (prefers the full import, falls back to the 41-task sample):
 *   data/ctc/ctc-cost-tasks.json   (full — from scripts/ctc/ctc_extract.py)
 *   data/ctc/ctc-tasks.json        (41-task sample)
 *
 *   node docs/estimates/5213-call-place-se/scripts/build-estimate-ctc.mjs
 *
 * The WSL/Antigravity agent only needs to run the CTC extract+load; this file
 * already wires the re-pricing. If coverage is low after loading the full
 * catalog, extend CROSSWALK below (catalogueCode -> { csi, kw }).
 */
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '../../../..');
const OUT = path.join(__dirname, '../output');
const DATA = path.join(REPO, 'data/ctc');
const ESCALATION = Number(process.env.CTC_ESCALATION || 1.13);

// ── Inputs ──────────────────────────────────────────────────────────────────
const E = JSON.parse(fs.readFileSync(path.join(OUT, 'estimate.json'), 'utf8'));
const wage = E.meta.laborWage, mk = E.meta.markups;
const GENERAL_RATE = wage.generalTradesRate, LICENSED_RATE = wage.licensedTradesRate;
const MASTER_LED = new Set(['21', '22', '23', '26', '27/28']);
const crewRate = (div) => (MASTER_LED.has(div) ? LICENSED_RATE : GENERAL_RATE);
const ACCEL = 0.08, GSF = E.meta.basis.gsf;

// CTC catalog (normalize full + sample shapes to current-year unit costs)
function loadCTC() {
  const full = path.join(DATA, 'ctc-cost-tasks.json');
  const sample = path.join(DATA, 'ctc-tasks.json');
  let src, isFull;
  if (fs.existsSync(full)) { src = JSON.parse(fs.readFileSync(full, 'utf8')); isFull = true; }
  else if (fs.existsSync(sample)) { src = JSON.parse(fs.readFileSync(sample, 'utf8')); isFull = false; }
  else { return { tasks: [], isFull: false, label: 'NONE' }; }
  const tasks = src.tasks.map((t) => {
    const esc = isFull ? ESCALATION : 1; // sample is already current-year
    return {
      taskNumber: t.taskNumber, csi: (t.csiCode || '').replace(/\s+/g, ' ').trim(),
      div: t.csiDivision, uom: (t.uom || '').toUpperCase(), desc: t.description || '',
      matCur: +(((t.materialCost2023 ?? t.materialCost) || 0) * esc).toFixed(2),
      equipCur: +(((t.equipmentCost2023 ?? t.equipmentCost) || 0) * esc).toFixed(2),
      lhrs: t.laborHours || 0,
    };
  });
  return { tasks, isFull, label: isFull ? `full (${tasks.length})` : `41-task sample (${tasks.length})` };
}
const CTC = loadCTC();

// ── Crosswalk: catalogue code -> target CSI prefix + boost keywords ─────────
const CROSSWALK = {
  'FOUND-FOOTER-NEW': { csi: '03', kw: ['footing', 'foundation', 'concrete'] },
  'CONC-POUR-4': { csi: '03', kw: ['slab', 'concrete', 'cast'] },
  'CONC-MESH': { csi: '03', kw: ['mesh', 'reinforc', 'wire'] },
  'FOUND-WP-EXT': { csi: '07', kw: ['waterproof', 'damp'] },
  'SID-BRICK-VEN': { csi: '04', kw: ['brick', 'masonry', 'veneer'] },
  'FOUND-STEEL-BEAM': { csi: '05', kw: ['steel', 'beam', 'structural'] },
  'FRAME-FLOOR-TJI': { csi: '06', kw: ['joist', 'i-joist', 'floor', 'framing'] },
  'FRAME-SHEATH-SUB': { csi: '06', kw: ['subfloor', 'sheathing', 'plywood'] },
  'FRAME-WALL-2X6': { csi: '06', kw: ['wall', 'framing', 'stud'] },
  'FRAME-WALL-2X4': { csi: '06', kw: ['wall', 'framing', 'stud', 'partition'] },
  'FRAME-SHEATH-WALL': { csi: '06', kw: ['sheathing', 'wall', 'osb'] },
  'FRAME-SHEATH-ROOF': { csi: '06', kw: ['sheathing', 'roof', 'osb'] },
  'FRAME-STAIR': { csi: '06', kw: ['stair', 'framing'] },
  'FRAME-INSUL-BATT': { csi: '07', kw: ['insulation', 'batt'] },
  'SID-FC-LAP': { csi: '07', kw: ['siding', 'lap', 'fiber', 'cement'] },
  'ROOF-FLAT-TPO': { csi: '07', kw: ['tpo', 'membrane', 'roof'] },
  'DOOR-INT-SOLID': { csi: '08', kw: ['door', 'interior', 'solid'] },
  'DOOR-EXT-STEEL': { csi: '08', kw: ['door', 'exterior', 'steel'] },
  'WIN-VIN-DH': { csi: '08', kw: ['window', 'vinyl', 'hung'] },
  'DRY-HANG-STD': { csi: '09', kw: ['drywall', 'gypsum', 'board'] },
  'DRY-TAPE-L4': { csi: '09', kw: ['drywall', 'finish', 'tape'] },
  'FLR-TILE-PORC': { csi: '09', kw: ['tile', 'porcelain', 'ceramic', 'floor'] },
  'FLR-LVP': { csi: '09', kw: ['vinyl', 'plank', 'resilient', 'lvp', 'floor'] },
  'PAINT-INT-WALL': { csi: '09', kw: ['paint', 'painting'] },
  'BATH-ACC-GRAB': { csi: '10', kw: ['grab', 'bar', 'accessor'] },
  'BATH-VAN-STD': { csi: '12', kw: ['vanity', 'casework', 'cabinet'] },
  'BATH-TOIL-STD': { csi: '22', kw: ['water closet', 'toilet'] },
  'BATH-TUB-STD': { csi: '22', kw: ['tub', 'bath', 'shower'] },
  'PLUMB-GAS-LINE': { csi: '22', kw: ['gas', 'pipe'] },
  'BATH-VENT-STD': { csi: '23', kw: ['fan', 'exhaust', 'vent'] },
  'ELEC-PNL-400': { csi: '26', kw: ['panel', 'board', 'service'] },
  'ELEC-PNL-200': { csi: '26', kw: ['panel', 'board'] },
  'ELEC-SMOKE': { csi: '28', kw: ['smoke', 'detector', 'alarm'] },
  'ELEC-CAT6': { csi: '27', kw: ['data', 'cat6', 'ethernet', 'communication'] },
};
const STOP = new Set(['the', 'and', 'for', 'with', 'of', 'a', 'to', 'in', 'on', 'per', 'or', 'new', 'std', 'standard', 'base', 'bldg', 'building', 'system', 'allowance']);
const tokens = (s) => (s || '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w));

// ── Match a takeoff line to the best CTC task ───────────────────────────────
function matchCTC(line, div) {
  if (!CTC.tasks.length) return null;
  const cw = CROSSWALK[line.code];
  const targetDiv = cw?.csi || (div === '27/28' ? '27' : div);
  const kw = new Set([...(cw?.kw || []), ...tokens(line.name)]);
  const uom = (line.unit || '').toUpperCase();
  let best = null, bestScore = 0;
  for (const t of CTC.tasks) {
    if (t.div !== targetDiv && !(div === '27/28' && (t.div === '27' || t.div === '28'))) continue;
    const desc = t.desc.toLowerCase();
    let score = 0;
    for (const w of kw) if (desc.includes(w)) score += 2;
    if (t.uom === uom) score += 2; else if (uomClass(t.uom) === uomClass(uom)) score += 1; else score -= 1;
    if (score > bestScore) { bestScore = score; best = t; }
  }
  return bestScore >= 3 ? best : null;   // require a real match
}
const uomClass = (u) => (['SF', 'SQFT'].includes(u) ? 'area' : ['LF', 'LNFT'].includes(u) ? 'len' : ['EA', 'EACH'].includes(u) ? 'ea' : u);

// ── Re-price ────────────────────────────────────────────────────────────────
let ctcDirect = 0, allowDirect = 0, matchedLines = 0, totalLines = 0;
const divs = [];
for (const d of E.scenarios.A.divs) {
  const lines = [];
  let m = 0, l = 0, e = 0, s = 0, h = 0;
  for (const ln of d.lines) {
    if (ln.code === 'ACCEL') continue; // recomputed after
    totalLines++;
    let mat = ln.ext.mat, lab = ln.ext.lab, equip = ln.ext.equip, sub = ln.ext.sub, lhrs = ln.ext.lhrs;
    let ctc = null;
    if (d.num !== '01' && !ln.allowance) {   // reprice self-perform trade lines
      ctc = matchCTC(ln, d.num);
      if (ctc) {
        mat = ctc.matCur * ln.qty;
        equip = ctc.equipCur * ln.qty;
        lhrs = ctc.lhrs * ln.qty;
        lab = lhrs * crewRate(d.num);
        sub = 0;
      }
    }
    const total = mat + lab + equip + sub;
    if (ctc) { matchedLines++; ctcDirect += total; } else allowDirect += total;
    m += mat; l += lab; e += equip; s += sub; h += lhrs;
    lines.push({ division: d.num, item: ln.name, unit: ln.unit, qty: ln.qty, method: ln.method, sheet: ln.sheet,
      ctcTask: ctc?.taskNumber || null, ctcDesc: ctc?.desc || null, pricedBy: ctc ? 'CTC' : (ln.allowance ? 'ALLOWANCE' : 'marketplace'),
      mat: Math.round(mat), laborHrs: Math.round(lhrs), laborRate: (d.num === '01' ? 'salaried' : '$' + crewRate(d.num) + '/hr'),
      labor: Math.round(lab), equip: Math.round(equip), sub: Math.round(sub), extended: Math.round(total) });
  }
  divs.push({ num: d.num, name: d.name, lines, mat: m, lab: l, equip: e, sub: s, hrs: h, total: m + l + e + s });
}
// acceleration on construction trade labor (Div 02-33)
const constrLabor = divs.filter((d) => d.num !== '01').reduce((a, d) => a + d.lab, 0);
const accel = constrLabor * ACCEL;
const d01 = divs.find((d) => d.num === '01');
d01.lines.push({ division: '01', item: `Schedule acceleration premium (${E.meta.basis.scheduleMonths}-mo, ${ACCEL * 100}% on trade labor)`, unit: 'ls', qty: 1, pricedBy: 'CALC', mat: 0, laborHrs: 0, laborRate: 'n/a', labor: Math.round(accel), equip: 0, sub: 0, extended: Math.round(accel) });
d01.lab += accel; d01.total += accel; allowDirect += accel; // premium is not CTC-priced

const direct = divs.reduce((a, d) => a + d.total, 0);
const overhead = direct * mk.overheadPct / 100, profit = direct * mk.profitPct / 100;
const contingency = direct * mk.contingencyPct_A / 100;
const bondsIns = (direct + overhead + profit) * mk.bondsInsPct / 100;
const permit = E.scenarios.A.permit;
const total = direct + overhead + profit + contingency + bondsIns + permit;
const coveragePct = (ctcDirect / direct) * 100;

// ── Report ──────────────────────────────────────────────────────────────────
const money = (n) => '$' + Math.round(n).toLocaleString();
console.log('='.repeat(78));
console.log('5213 CALL PLACE SE — CTC-PRICED (measured takeoff + owner wage/schedule)');
console.log(`CTC catalog: ${CTC.label} | escalation ×${ESCALATION} | wage gen $${GENERAL_RATE}/hr, MEP $${LICENSED_RATE}/hr`);
console.log('='.repeat(78));
for (const d of divs) {
  const cov = d.total > 0 ? Math.round((d.lines.filter((x) => x.pricedBy === 'CTC').reduce((a, x) => a + x.extended, 0) / d.total) * 100) : 0;
  console.log(`Div ${d.num.padEnd(5)} ${d.name.padEnd(36)} ${money(d.total).padStart(12)}  CTC ${String(cov).padStart(3)}%`);
}
console.log('-'.repeat(78));
console.log(`Direct ${money(direct)} | OH ${money(overhead)} | Profit ${money(profit)} | Cont ${money(contingency)} | B&I ${money(bondsIns)} | Permit ${money(permit)}`);
console.log(`TOTAL (excl elev+kitchen) ${money(total)}  $${(total / GSF).toFixed(0)}/SF`);
console.log(`\nCTC COVERAGE: ${coveragePct.toFixed(1)}% of direct priced from real CTC tasks (${matchedLines}/${totalLines} lines matched).`);
console.log(`Marketplace measured total was ${money(E.scenarios.A.total)} — CTC delta ${((total / E.scenarios.A.total - 1) * 100).toFixed(1)}%.`);
if (!CTC.isFull) console.log('NOTE: using the 41-task SAMPLE. Load the full catalog (scripts/ctc/) for real coverage.');

fs.writeFileSync(path.join(OUT, 'estimate-ctc.json'), JSON.stringify({
  meta: { project: E.meta.project, catalogue: `CTC ${CTC.label}`, escalation: ESCALATION,
    laborWage: wage, scheduleMonths: E.meta.basis.scheduleMonths, ctcCoveragePct: +coveragePct.toFixed(1),
    matchedLines, totalLines, generated: new Date().toISOString() },
  totals: { direct, overhead, profit, contingency, bondsIns, permit, total, psf: +(total / GSF).toFixed(2), ctcDirect, allowDirect },
  divisions: divs,
}, null, 2));
const rows = [['Division', 'Item', 'Unit', 'Qty', 'PricedBy', 'CTC_Task', 'CTC_Desc', 'Mat', 'LaborHrs', 'LaborRate', 'Labor', 'Equip', 'Sub', 'Extended']];
for (const d of divs) for (const ln of d.lines) rows.push([d.num, ln.item, ln.unit, ln.qty, ln.pricedBy, ln.ctcTask || '', (ln.ctcDesc || '').replace(/,/g, ';'), ln.mat, ln.laborHrs, ln.laborRate, ln.labor, ln.equip, ln.sub, ln.extended]);
fs.writeFileSync(path.join(OUT, 'estimate-ctc-lineitems.csv'), rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n'));
console.log('\nWrote: output/estimate-ctc.json, output/estimate-ctc-lineitems.csv');
