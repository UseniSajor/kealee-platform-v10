#!/usr/bin/env node
/**
 * scripts/ctc.mjs — agent-friendly Construction Task Catalog (CTC) accessor.
 * No dependencies. Reads data/ctc/ctc-tasks.json.
 *
 *   node scripts/ctc.mjs search <terms...>     keyword search (code + description)
 *   node scripts/ctc.mjs div <NN>              list all tasks in a CSI division
 *   node scripts/ctc.mjs show <taskNumber>     full L/M/E detail for one task
 *   node scripts/ctc.mjs divisions             division coverage summary
 *
 * "CTC" here = Construction Task Catalog (Gordian/Maryland DGS MasterFormat
 * priced tasks). NOT to be confused with the "Complete Total Cost" calculator
 * at services/ai-orchestrator/src/costing/ctc-calculator.ts.
 */
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const REPO = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');
const DATA = path.join(REPO, 'data/ctc/ctc-tasks.json');

if (!fs.existsSync(DATA)) {
  console.error('data/ctc/ctc-tasks.json missing — run: node scripts/ctc-build-data.mjs');
  process.exit(1);
}
const { meta, tasks } = JSON.parse(fs.readFileSync(DATA, 'utf8'));
const [cmd, ...args] = process.argv.slice(2);
const money = (n) => '$' + Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function row(t) {
  return `${t.taskNumber.padEnd(14)} ${String(t.uom).padEnd(4)} ${money(t.unitCost).padStart(12)}  ${t.description}`;
}

switch (cmd) {
  case 'search': {
    const terms = args.map((s) => s.toLowerCase());
    const hits = tasks.filter((t) => terms.every((term) => `${t.taskNumber} ${t.csiCode} ${t.description}`.toLowerCase().includes(term)));
    console.log(`# search "${args.join(' ')}" — ${hits.length} of ${tasks.length} tasks\n`);
    hits.forEach((t) => console.log(row(t)));
    break;
  }
  case 'div': {
    const d = String(args[0]).padStart(2, '0');
    const hits = tasks.filter((t) => t.csiDivision === d);
    console.log(`# Division ${d} — ${hits.length} tasks\n`);
    hits.forEach((t) => console.log(row(t)));
    break;
  }
  case 'show': {
    const t = tasks.find((x) => x.taskNumber === args[0]);
    if (!t) { console.error(`No task ${args[0]}`); process.exit(1); }
    console.log(JSON.stringify(t, null, 2));
    break;
  }
  case 'divisions': {
    const by = {};
    for (const t of tasks) (by[t.csiDivision] ??= { name: t.divisionName, n: 0 }).n++;
    console.log(`# CTC coverage — ${tasks.length} tasks (${meta.provenance.coverage})\n`);
    for (const d of Object.keys(by).sort()) console.log(`Div ${d}  ${String(by[d].name).padEnd(34)} ${by[d].n}`);
    break;
  }
  default:
    console.log(`CTC accessor — ${tasks.length} tasks (${meta.provenance.coverage})
Usage:
  node scripts/ctc.mjs search <terms...>
  node scripts/ctc.mjs div <NN>
  node scripts/ctc.mjs show <taskNumber>
  node scripts/ctc.mjs divisions`);
}
