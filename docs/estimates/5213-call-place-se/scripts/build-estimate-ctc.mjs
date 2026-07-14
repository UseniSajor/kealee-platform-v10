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

// ── Complete crosswalk: EVERY takeoff line -> CTC keywords (+ div override).
// Keyed by exact line name so allowance lines (code='ALLOWANCE') map too.
// STRICT mode: a line prices ONLY from a matched CTC task — no marketplace or
// allowance placeholder. Unmatched lines are reported PENDING-CTC (not priced),
// to be resolved when the full catalog is loaded (or via an added keyword).
const NAME_CW = {
  // Div 01
  'Project Management – Weekly': { kw: ['project management', 'coordination', 'supervision'] },
  'Site superintendent (6 mo)': { kw: ['superintendent', 'supervision', 'field engineer'] },
  'Mobilization / demobilization': { kw: ['mobilization', 'demobilization'] },
  'Temporary Power': { kw: ['temporary', 'power', 'electric'] },
  'Temporary water / heat / enclosure': { kw: ['temporary', 'facilities', 'enclosure', 'heat'] },
  'Portable Toilet – Monthly': { kw: ['toilet', 'sanitary', 'portable'] },
  'Safety / OSHA / PPE program': { kw: ['safety', 'protection', 'barricade'] },
  'Dumpster – 30 Yard': { kw: ['waste', 'disposal', 'dumpster', 'debris'] },
  'Final Construction Cleanup': { kw: ['cleanup', 'cleaning', 'final clean'] },
  'Testing & special inspections (Type IIIB + steel)': { kw: ['testing', 'inspection'] },
  'Property Survey': { kw: ['survey', 'layout', 'staking'] },
  'Structural Engineering': { kw: ['engineering', 'design'] },
  'Closeout / as-builts / O&M / commissioning': { kw: ['closeout', 'commissioning', 'as-built'] },
  // Div 02 / 31 / 32 / 33 (sitework)
  'Clearing & site preparation': { kw: ['clearing', 'grubbing', 'site preparation'] },
  'Erosion & sediment control (DOEE/SWM)': { kw: ['erosion', 'sediment', 'silt fence'] },
  'New rear areaway excavation/retaining': { kw: ['excavation', 'areaway', 'retaining'] },
  'Mass & foundation excavation (cellar)': { kw: ['excavation', 'earth', 'machine'] },
  'Haul-off / spoil disposal': { kw: ['haul', 'disposal', 'spoil', 'off-site'] },
  'Backfill & compaction': { kw: ['backfill', 'compact'] },
  'Stone base / under-slab drainage': { kw: ['gravel', 'stone', 'aggregate', 'base course'] },
  'Fine grading': { kw: ['grading', 'fine grade'] },
  'Walks, steps & entry hardscape': { kw: ['sidewalk', 'walk', 'paving', 'concrete'] },
  'Site drainage / area drains': { kw: ['drain', 'drainage', 'area drain'] },
  'Landscaping, planter & site restoration': { kw: ['seed', 'sod', 'landscap', 'planting', 'mulch'] },
  'Domestic water service & tap': { kw: ['water service', 'water main', 'tap'] },
  'Sanitary sewer service & connection': { kw: ['sewer', 'sanitary', 'lateral'] },
  'Gas service & meter': { kw: ['gas service', 'gas main', 'meter'] },
  'Electrical service lateral / transformer coord (Pepco)': { kw: ['service', 'lateral', 'transformer'] },
  // Div 03
  'Drilled piers 18"Ø×30" (4-#5 vert, #3 ties)': { kw: ['pier', 'caisson', 'drilled', 'concrete'] },
  'Grade beams / foundation wall — 8" CIP': { kw: ['foundation', 'wall', 'cast-in-place', 'grade beam'] },
  'Elevator pit (excavate/form/pour/waterproof)': { kw: ['pit', 'concrete', 'elevator'] },
  'Exterior concrete (rear areaway, stoop, steps)': { kw: ['sidewalk', 'concrete', 'stoop', 'step'] },
  // Div 04
  'Lintels, flashing, masonry accessories': { kw: ['lintel', 'flashing', 'masonry'] },
  // Div 05
  'HSS 5×5×3/8 steel columns + base plates': { kw: ['column', 'steel', 'tube', 'structural'] },
  'Steel connections, embeds, stair/rail steel, misc metals': { kw: ['miscellaneous metal', 'steel', 'embed', 'railing'] },
  // Div 06
  'Low-slope roof framing (PT 2x8 @24" + steel)': { kw: ['roof', 'framing', 'rafter', 'joist'] },
  'Elevator shaft framing & 2-hr rated enclosure': { kw: ['shaft', 'framing', 'fire-rated'] },
  'Blocking, backing, misc rough carpentry': { kw: ['blocking', 'backing', 'rough carpentry'] },
  // Div 07
  'Roof / rigid insulation + air/vapor barrier': { kw: ['insulation', 'rigid', 'vapor'] },
  'House wrap / weather-resistive barrier': { kw: ['weather', 'barrier', 'wrap', 'building paper'] },
  'Gutters, downspouts, flashing, coping': { kw: ['gutter', 'downspout', 'coping'] },
  'Firestopping / rated assemblies (Type IIIB)': { kw: ['firestop', 'fire-rated', 'penetration'] },
  'Sealants & caulking': { kw: ['sealant', 'caulk', 'joint sealant'] },
  // Div 08
  'Storefront / WELCOME entry glazing': { kw: ['storefront', 'glazing', 'aluminum', 'curtain'] },
  'Commercial hardware (levers, closers, panic)': { kw: ['hardware', 'closer', 'panic', 'lockset'] },
  // Div 09
  'Rated shaft/corridor drywall upgrade (Type X)': { kw: ['gypsum', 'type x', 'shaft', 'fire-rated'] },
  'Suspended ACT ceilings (cellar/kitchen/support)': { kw: ['acoustical', 'ceiling', 'suspended'] },
  'Finish carpentry — base, casing, trim': { kw: ['trim', 'base', 'casing', 'molding'] },
  // Div 10
  'Toilet accessories sets (7 baths)': { kw: ['toilet accessor', 'dispenser', 'holder'] },
  'Signage — egress / ADA / room ID': { kw: ['sign', 'signage'] },
  'Fire extinguishers & cabinets': { kw: ['extinguisher', 'fire extinguisher'] },
  'Misc specialties (lockers, mail, corner guards)': { kw: ['corner guard', 'locker', 'mailbox'] },
  // Div 12
  'Common/kitchen casework & countertops (base-bldg)': { kw: ['casework', 'cabinet', 'countertop', 'millwork'] },
  'Closet/pantry shelving & built-ins': { kw: ['shelving', 'shelf', 'closet'] },
  // Div 21
  'Sprinkler system — NFPA 13, full building': { kw: ['sprinkler', 'fire protection', 'wet pipe'] },
  'Fire service / standpipe / FDC': { kw: ['standpipe', 'fire service', 'fire department connection'] },
  'Sprinkler testing & certification': { kw: ['sprinkler', 'test', 'flush'] },
  // Div 22
  'Lavatories / sinks (7 baths + common + kitchen)': { kw: ['lavatory', 'sink'] },
  'DWV + water supply distribution (by fixture)': { kw: ['pipe', 'waste', 'vent', 'water', 'copper'] },
  'Water heaters — commercial (2 × WH-1)': { kw: ['water heater'] },
  'Laundry rough-in + sump pump': { kw: ['laundry', 'standpipe', 'sump'] },
  'Commercial-kitchen plumbing/gas rough-in (base-bldg)': { kw: ['grease', 'floor drain', 'kitchen', 'gas'] },
  // Div 23
  'Split HVAC systems — 4 zones (CU-1..4 + AHU-1..4)': { kw: ['split system', 'condensing', 'air handler'] },
  'Ductwork distribution': { kw: ['duct', 'ductwork', 'sheet metal'] },
  'Controls / thermostats / zoning': { kw: ['thermostat', 'control'] },
  'Kitchen hood curb, exhaust (KEF-1) & make-up air (MAU-1) ductwork (base-bldg)': { kw: ['hood', 'exhaust', 'make-up air'] },
  'Elevator machine-room mini-split + TAB': { kw: ['split', 'mini-split', 'test balance'] },
  // Div 26
  'Feeders & branch wiring (building-wide)': { kw: ['wire', 'conductor', 'feeder', 'conduit', 'branch'] },
  'Lighting package (LED recessed/surface, interior/exterior)': { kw: ['light', 'fixture', 'led', 'luminaire'] },
  'Wiring devices & plates': { kw: ['receptacle', 'device', 'switch'] },
  'HVAC power / equipment connections (CU/AHU/MAU/KEF)': { kw: ['connection', 'disconnect', 'motor'] },
  'Commercial-kitchen & walk-in electrical rough-in (base-bldg)': { kw: ['kitchen', 'circuit', 'receptacle'] },
  'Elevator power rough-in, disconnect & cab-light circuit': { kw: ['elevator', 'feeder', 'disconnect'] },
  'Emergency & exit lighting (egress)': { kw: ['exit', 'emergency', 'egress'] },
  // Div 27/28
  'Fire alarm system — addressable (R-2)': { div: '28', kw: ['fire alarm', 'notification', 'addressable'] },
  'Security / access control / intercom / CCTV': { div: '28', kw: ['security', 'access control', 'camera'] },
};

// legacy code-keyed crosswalk (catalogue-coded lines)
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
  'FLR-TILE-PORC': { csi: '09', kw: ['tile', 'porcelain', 'ceramic'] },
  'FLR-LVP': { csi: '09', kw: ['vinyl', 'plank', 'resilient', 'lvp'] },
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
  const cw = NAME_CW[line.name] || CROSSWALK[line.code];
  const targetDiv = cw?.div || cw?.csi || (div === '27/28' ? '27' : div);
  const distinctive = cw?.kw || [];               // crosswalk-specific, high-signal terms
  const generic = tokens(line.name);              // name tokens, lower signal
  const uom = (line.unit || '').toUpperCase();
  let best = null, bestScore = 0;
  for (const t of CTC.tasks) {
    if (t.div !== targetDiv && !(div === '27/28' && (t.div === '27' || t.div === '28'))) continue;
    const desc = t.desc.toLowerCase();
    const distinctiveHits = distinctive.filter((w) => desc.includes(w)).length;
    // When a crosswalk exists, require at least one distinctive keyword — this
    // stops false matches like LVP -> ceramic tile that only share "floor".
    if (cw && distinctiveHits === 0) continue;
    let score = distinctiveHits * 3;
    for (const w of generic) if (desc.includes(w)) score += 1;
    if (t.uom === uom) score += 2; else if (uomClass(t.uom) === uomClass(uom)) score += 1; else score -= 2;
    if (score > bestScore) { bestScore = score; best = t; }
  }
  return bestScore >= 3 ? best : null;   // require a real match
}
const uomClass = (u) => (['SF', 'SQFT'].includes(u) ? 'area' : ['LF', 'LNFT'].includes(u) ? 'len' : ['EA', 'EACH'].includes(u) ? 'ea' : u);

// ── Re-price — STRICT CTC-only. No marketplace/allowance placeholders: a line
// is priced ONLY from a matched CTC task; unmatched lines are PENDING-CTC ($0).
let ctcDirect = 0, matchedLines = 0, totalLines = 0, pendingLines = 0;
const divs = [];
for (const d of E.scenarios.A.divs) {
  const lines = [];
  let m = 0, l = 0, e = 0, s = 0, h = 0;
  for (const ln of d.lines) {
    if (ln.code === 'ACCEL') continue; // recomputed after
    totalLines++;
    const ctc = matchCTC(ln, d.num);   // every division, incl. Div 01, via CTC
    let mat = 0, lab = 0, equip = 0, sub = 0, lhrs = 0, pricedBy;
    if (ctc) {
      mat = ctc.matCur * ln.qty;
      equip = ctc.equipCur * ln.qty;
      lhrs = ctc.lhrs * ln.qty;
      lab = lhrs * crewRate(d.num);      // labor = CTC hours × owner wage
      pricedBy = 'CTC'; matchedLines++;
    } else {
      pricedBy = 'PENDING-CTC'; pendingLines++;   // no placeholder value
    }
    const total = mat + lab + equip + sub;
    ctcDirect += total;
    m += mat; l += lab; e += equip; s += sub; h += lhrs;
    lines.push({ division: d.num, item: ln.name, unit: ln.unit, qty: ln.qty, method: ln.method, sheet: ln.sheet,
      ctcTask: ctc?.taskNumber || null, ctcDesc: ctc?.desc || null, pricedBy,
      mat: Math.round(mat), laborHrs: Math.round(lhrs), laborRate: '$' + crewRate(d.num) + '/hr',
      labor: Math.round(lab), equip: Math.round(equip), sub: Math.round(sub), extended: Math.round(total) });
  }
  divs.push({ num: d.num, name: d.name, lines, mat: m, lab: l, equip: e, sub: s, hrs: h, total: m + l + e + s });
}
let allowDirect = 0; // strict mode: no allowances
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
const coveragePct = (matchedLines / totalLines) * 100; // count-based (pending lines are $0)

// ── Report ──────────────────────────────────────────────────────────────────
const money = (n) => '$' + Math.round(n).toLocaleString();
console.log('='.repeat(78));
console.log('5213 CALL PLACE SE — CTC-PRICED (measured takeoff + owner wage/schedule)');
console.log(`CTC catalog: ${CTC.label} | escalation ×${ESCALATION} | wage gen $${GENERAL_RATE}/hr, MEP $${LICENSED_RATE}/hr`);
console.log('='.repeat(78));
for (const d of divs) {
  const mtch = d.lines.filter((x) => x.pricedBy === 'CTC').length;
  const tot = d.lines.filter((x) => x.item.indexOf('acceleration') < 0).length;
  const pend = tot - mtch;
  console.log(`Div ${d.num.padEnd(5)} ${d.name.padEnd(34)} ${money(d.total).padStart(12)}  ${String(mtch).padStart(2)}/${tot} CTC${pend ? ` · ${pend} pending` : ''}`);
}
console.log('-'.repeat(78));
console.log(`Direct ${money(direct)} | OH ${money(overhead)} | Profit ${money(profit)} | Cont ${money(contingency)} | B&I ${money(bondsIns)} | Permit ${money(permit)}`);
console.log(`TOTAL (excl elev+kitchen) ${money(total)}  $${(total / GSF).toFixed(0)}/SF`);
console.log(`\nSTRICT CTC pricing — zero placeholders. ${matchedLines}/${totalLines} lines priced from real CTC tasks; ${pendingLines} PENDING-CTC (not priced).`);
console.log(`CTC-priced direct so far: ${money(ctcDirect - accel)} (+ ${money(accel)} accel). This total is INCOMPLETE until every line maps to a CTC task.`);
if (!CTC.isFull) {
  console.log('\n>>> Using the 41-task SAMPLE — this is why most lines are PENDING.');
  console.log('>>> Load the full CTC catalog (scripts/ctc/ + the two PDFs) and re-run;');
  console.log('>>> every line will then price from a real CTC task with no placeholders.');
}

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

// Missing-match report: construction lines with no CTC task (candidates for
// CROSSWALK tuning or full-catalog additions). Excludes Div 01 + pure allowances.
const missing = [];
for (const d of divs) for (const ln of d.lines) {
  if (d.num === '01' || ln.pricedBy === 'CALC') continue;
  if (ln.pricedBy !== 'CTC') missing.push({ division: d.num, item: ln.item, unit: ln.unit, pricedBy: ln.pricedBy, extended: ln.extended });
}
missing.sort((a, b) => b.extended - a.extended);
fs.writeFileSync(path.join(OUT, 'ctc-missing-matches.json'), JSON.stringify({
  meta: { catalogue: `CTC ${CTC.label}`, coveragePct: +coveragePct.toFixed(1), matched: matchedLines, total: totalLines, uncovered: missing.length },
  note: 'Lines not priced from a CTC task. With the full catalog most should match; extend CROSSWALK in build-estimate-ctc.mjs for any that still miss.',
  missing,
}, null, 2));
console.log(`\nWrote: output/estimate-ctc.json, output/estimate-ctc-lineitems.csv, output/ctc-missing-matches.json (${missing.length} uncovered)`);
