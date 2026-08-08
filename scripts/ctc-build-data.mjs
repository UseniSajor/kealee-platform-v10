/**
 * scripts/ctc-build-data.mjs
 * ---------------------------------------------------------------------------
 * Makes the Construction Task Catalog (CTC) a first-class, agent-accessible
 * data asset. Reads the authoritative source-of-truth (CTC_SAMPLE_TASKS in
 * packages/estimating/src/seed-ctc.ts) and emits queryable JSON:
 *
 *   data/ctc/ctc-tasks.json          rich canonical (L/M/E, modifiers, CSI)
 *   data/ctc/ctc-index.json          division -> {count, csiCodes, name}
 *   data/ctc-june-2023-tasks.json    legacy shape consumed by query_ctc_tasks.mjs
 *
 * No external deps. Node >= 18.
 *   node scripts/ctc-build-data.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '..');
const SEED = path.join(REPO, 'packages/estimating/src/seed-ctc.ts');

// ── Parse CTC_SAMPLE_TASKS out of the TS seed (source of truth) ─────────────
const seedText = fs.readFileSync(SEED, 'utf8');
const start = seedText.indexOf('CTC_SAMPLE_TASKS: CTCSeedTask[] = [');
if (start === -1) throw new Error('CTC_SAMPLE_TASKS not found in seed-ctc.ts');
const arrStart = seedText.indexOf('[', seedText.indexOf('=', start));
// find matching closing bracket
let depth = 0, i = arrStart, end = -1;
for (; i < seedText.length; i++) {
  if (seedText[i] === '[') depth++;
  else if (seedText[i] === ']') { depth--; if (depth === 0) { end = i; break; } }
}
const arrText = seedText.slice(arrStart, end + 1);
// The array is plain JS object-literal data (strings/numbers/bools) — safe to evaluate.
const tasks = new Function(`return ${arrText}`)();

const DIVISION_NAMES = {
  '01': 'General Requirements', '02': 'Existing Conditions', '03': 'Concrete',
  '04': 'Masonry', '05': 'Metals', '06': 'Wood, Plastics & Composites',
  '07': 'Thermal & Moisture Protection', '08': 'Openings', '09': 'Finishes',
  '10': 'Specialties', '11': 'Equipment', '12': 'Furnishings',
  '14': 'Conveying Equipment', '21': 'Fire Suppression', '22': 'Plumbing',
  '23': 'HVAC', '26': 'Electrical', '27': 'Communications',
  '28': 'Electronic Safety & Security', '31': 'Earthwork',
  '32': 'Exterior Improvements', '33': 'Utilities',
};

const PROVENANCE = {
  source: 'CTC_SAMPLE_TASKS (packages/estimating/src/seed-ctc.ts)',
  catalog: 'Construction Task Catalog® methodology — Gordian Group / Maryland DGS, June 2023',
  pricing: 'DMV region, 2026 basis (June-2023 base × 1.13 inflation adjustment)',
  coverage: 'DEV SAMPLE ONLY — representative tasks, not the full ~4,666-page priced Gordian catalog',
  licensing: 'The full Gordian CTC is proprietary and its redistribution is prohibited; only this Kealee-authored sample is included in the repo.',
};

// ── Rich canonical rows ─────────────────────────────────────────────────────
const rich = tasks.map((t) => ({
  taskNumber: t.taskNumber,
  csiDivision: t.csiDivision,
  csiCode: t.csiCode ?? null,
  description: t.description,
  uom: t.unit,
  unitCost: t.unitPrice ?? (t.laborCost + t.materialCost + t.equipmentCost),
  laborCost: t.laborCost ?? 0,
  materialCost: t.materialCost ?? 0,
  equipmentCost: t.equipmentCost ?? 0,
  laborHours: t.laborHours ?? null,
  isModifier: !!t.isModifier,
  modifierOf: t.modifierOf ?? null,
  modifierType: t.modifierType ?? null,
  modifierValue: t.modifierValue ?? null,
  category: t.category ?? null,
  divisionName: DIVISION_NAMES[t.csiDivision] ?? null,
}));

// ── Legacy shape for scripts/query_ctc_tasks.mjs ────────────────────────────
const legacy = tasks.map((t) => ({
  code: t.csiCode ? t.csiCode.replace(/\s+/g, '') + '-' + t.taskNumber.split('-').pop() : t.taskNumber,
  division: t.csiDivision,
  uom: (t.unit || '').toUpperCase(),
  description: t.description,
  unitCost2023: +( (t.unitPrice ?? (t.laborCost + t.materialCost + t.equipmentCost)) / 1.13).toFixed(2), // back out to 2023 base
  unitCost2026: t.unitPrice ?? (t.laborCost + t.materialCost + t.equipmentCost),
  demolitionCost2023: null,
  source: 'sample',
}));

// ── Division index ──────────────────────────────────────────────────────────
const index = {};
for (const r of rich) {
  const d = r.csiDivision;
  index[d] ??= { division: d, name: r.divisionName, count: 0, csiCodes: new Set(), tasks: [] };
  index[d].count++;
  if (r.csiCode) index[d].csiCodes.add(r.csiCode);
  index[d].tasks.push(r.taskNumber);
}
const indexOut = Object.values(index).sort((a, b) => a.division.localeCompare(b.division))
  .map((d) => ({ ...d, csiCodes: [...d.csiCodes] }));

// ── Write ───────────────────────────────────────────────────────────────────
fs.mkdirSync(path.join(REPO, 'data/ctc'), { recursive: true });
const canonical = {
  meta: {
    generatedFrom: 'scripts/ctc-build-data.mjs',
    generatedAt: new Date().toISOString(),
    taskCount: rich.length,
    divisions: indexOut.length,
    provenance: PROVENANCE,
    schema: 'taskNumber, csiDivision, csiCode, description, uom, unitCost, laborCost, materialCost, equipmentCost, laborHours, isModifier, modifierOf, modifierType, modifierValue, category, divisionName',
  },
  tasks: rich,
};
fs.writeFileSync(path.join(REPO, 'data/ctc/ctc-tasks.json'), JSON.stringify(canonical, null, 2));
fs.writeFileSync(path.join(REPO, 'data/ctc/ctc-index.json'), JSON.stringify({ provenance: PROVENANCE, divisions: indexOut }, null, 2));
fs.writeFileSync(path.join(REPO, 'data/ctc-june-2023-tasks.json'), JSON.stringify(legacy, null, 2));

console.log(`CTC data built: ${rich.length} tasks across ${indexOut.length} divisions`);
console.log('  data/ctc/ctc-tasks.json         (rich canonical)');
console.log('  data/ctc/ctc-index.json         (division index)');
console.log('  data/ctc-june-2023-tasks.json   (legacy shape for query_ctc_tasks.mjs)');
console.log('\nDivision coverage:');
for (const d of indexOut) console.log(`  Div ${d.division} ${String(d.name).padEnd(34)} ${d.count} task(s)`);
