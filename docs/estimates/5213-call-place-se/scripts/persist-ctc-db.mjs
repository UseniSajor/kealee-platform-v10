/**
 * persist-ctc-db.mjs — persist the CTC-priced estimate (output/estimate-ctc.json)
 * into Postgres: one quick_estimates row (qualityTier='ctc') + a companion
 * ctc_estimate_line_items table carrying the matched CTC task per line.
 *
 *   node .../scripts/persist-ctc-db.mjs > /tmp/ctc-est.sql
 *   psql "$DATABASE_URL" -f /tmp/ctc-est.sql
 */
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const OUT = path.join(path.dirname(url.fileURLToPath(import.meta.url)), '../output');
const J = JSON.parse(fs.readFileSync(path.join(OUT, 'estimate-ctc.json'), 'utf8'));
const ID = '5213ca11-0000-4000-a000-00000000c7c0'; // fixed id -> idempotent
const S = (s) => `$s$${s ?? ''}$s$`;
const N = (n) => (n == null || Number.isNaN(Number(n)) ? 'NULL' : Number(n).toFixed(2));

const breakdown = {
  catalogue: J.meta.catalogue, ctcCoveragePct: J.meta.ctcCoveragePct,
  divisions: J.divisions.map((d) => ({ division: d.num, name: d.name, total: Math.round(d.total),
    ctcPriced: Math.round(d.lines.filter((l) => l.pricedBy === 'CTC').reduce((a, l) => a + l.extended, 0)) })),
  totals: J.totals,
};

let sql = `BEGIN;
CREATE TABLE IF NOT EXISTS ctc_estimate_line_items (
  id bigserial PRIMARY KEY, "estimateId" uuid NOT NULL, division text, item text,
  unit text, qty numeric(14,3), priced_by text, ctc_task text, ctc_desc text,
  mat numeric(14,2), labor_hours numeric(12,2), labor_rate text, labor numeric(14,2),
  equip numeric(14,2), sub numeric(14,2), extended numeric(14,2)
);
DELETE FROM ctc_estimate_line_items WHERE "estimateId"='${ID}';
DELETE FROM quick_estimates WHERE id='${ID}';
INSERT INTO quick_estimates (id,"projectType",sqft,location,"qualityTier",description,
  "materialTotal","laborTotal",subtotal,overhead,profit,contingency,"grandTotal",
  "priceLow","priceMid","priceHigh",breakdown,assumptions,status)
VALUES ('${ID}','group_home_new', ${J.meta.scheduleMonths ? 5920 : 5920}, 'DC', 'ctc',
  ${S('5213 Call Place SE — CTC-priced (measured takeoff, owner wages, 6-mo, +accel)')},
  ${N(J.divisions.reduce((a, d) => a + d.mat, 0))}, ${N(J.divisions.reduce((a, d) => a + d.lab, 0))},
  ${N(J.totals.direct)}, ${N(J.totals.overhead)}, ${N(J.totals.profit)}, ${N(J.totals.contingency)}, ${N(J.totals.total)},
  ${N(J.totals.total * 0.9)}, ${N(J.totals.total)}, ${N(J.totals.total * 1.1)},
  $j$${JSON.stringify(breakdown)}$j$::jsonb, $j$${JSON.stringify(J.meta)}$j$::jsonb, 'draft');
`;
for (const d of J.divisions) for (const ln of d.lines) {
  sql += `INSERT INTO ctc_estimate_line_items ("estimateId",division,item,unit,qty,priced_by,ctc_task,ctc_desc,mat,labor_hours,labor_rate,labor,equip,sub,extended) VALUES (
  '${ID}', '${d.num}', ${S(ln.item)}, ${S(ln.unit)}, ${ln.qty || 0}, ${S(ln.pricedBy)}, ${S(ln.ctcTask)}, ${S(ln.ctcDesc)},
  ${N(ln.mat)}, ${N(ln.laborHrs)}, ${S(ln.laborRate)}, ${N(ln.labor)}, ${N(ln.equip)}, ${N(ln.sub)}, ${N(ln.extended)});\n`;
}
sql += 'COMMIT;\n';
process.stdout.write(sql);
process.stderr.write(`CTC estimate: $${Math.round(J.totals.total).toLocaleString()} (${J.meta.ctcCoveragePct}% CTC coverage) -> quick_estimates + ctc_estimate_line_items\n`);
