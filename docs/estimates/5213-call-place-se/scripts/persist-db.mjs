/**
 * persist-db.mjs — persist this estimation session into Postgres.
 *
 * Emits SQL (schema + inserts) modeled on the Prisma QuickEstimate table
 * (packages/database/prisma/schema.prisma -> @@map("quick_estimates")), plus a
 * companion estimate_line_items table for the full measured breakdown.
 * Run the emitted SQL with psql against $DATABASE_URL.
 *
 *   node docs/estimates/5213-call-place-se/scripts/persist-db.mjs > /tmp/persist.sql
 *   psql "$DATABASE_URL" -f /tmp/persist.sql
 */
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '../output');
const J = JSON.parse(fs.readFileSync(path.join(OUT, 'estimate.json'), 'utf8'));

const jq = (obj) => `$json$${JSON.stringify(obj)}$json$::jsonb`;
const sqlStr = (s) => `$str$${s ?? ''}$str$`;
const num = (n) => (n == null ? 'NULL' : Number(n).toFixed(2));

// Stable UUIDs so re-running is idempotent (fixed namespace for this project).
const IDS = { A: '5213ca11-0000-4000-a000-0000000000a1', B: '5213ca11-0000-4000-a000-0000000000b2', C: '5213ca11-0000-4000-a000-0000000000c3' };

let sql = `-- 5213 Call Place SE — estimation session persistence
BEGIN;

CREATE TABLE IF NOT EXISTS quick_estimates (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "projectId"   text,
  "leadId"      text,
  "createdBy"   text,
  "projectType" text NOT NULL,
  sqft          numeric(10,2),
  location      text NOT NULL,
  "qualityTier" text NOT NULL DEFAULT 'mid',
  description   text,
  "materialTotal" numeric(12,2) NOT NULL,
  "laborTotal"    numeric(12,2) NOT NULL,
  subtotal        numeric(12,2) NOT NULL,
  overhead        numeric(12,2) NOT NULL,
  profit          numeric(12,2) NOT NULL,
  contingency     numeric(12,2) NOT NULL,
  "grandTotal"    numeric(12,2) NOT NULL,
  "priceLow"      numeric(12,2) NOT NULL,
  "priceMid"      numeric(12,2) NOT NULL,
  "priceHigh"     numeric(12,2) NOT NULL,
  breakdown       jsonb NOT NULL,
  assumptions     jsonb,
  status          text NOT NULL DEFAULT 'draft',
  "createdAt"     timestamptz NOT NULL DEFAULT now()
);

DROP TABLE IF EXISTS estimate_line_items;
CREATE TABLE IF NOT EXISTS estimate_line_items (
  id            bigserial PRIMARY KEY,
  "estimateId"  uuid NOT NULL REFERENCES quick_estimates(id) ON DELETE CASCADE,
  division      text NOT NULL,
  item          text NOT NULL,
  "catalogueCode" text,
  "isAllowance" boolean NOT NULL DEFAULT false,
  unit          text,
  qty           numeric(14,3),
  method        text,
  "dimensionBasis" text,
  sheet         text,
  confidence    text,
  "matUnit"     numeric(14,2),
  "labUnit"     numeric(14,2),
  "equipUnit"   numeric(14,2),
  "subUnit"     numeric(14,2),
  "laborHours"  numeric(12,2),
  extended      numeric(14,2),
  note          text
);

-- idempotent re-run: clear prior rows for these fixed ids
DELETE FROM estimate_line_items WHERE "estimateId" IN ('${IDS.A}','${IDS.B}','${IDS.C}');
DELETE FROM quick_estimates WHERE id IN ('${IDS.A}','${IDS.B}','${IDS.C}');

`;

const assumptions = {
  ...J.meta, target: J.target, exclusions: { elevatorTotal: J.exclusions.elevatorTotal, kitchenTotal: J.exclusions.kitchenTotal },
  ownerSummary: J.ownerSummary,
};

for (const scen of ['A', 'B', 'C']) {
  const S = J.scenarios[scen];
  const breakdown = {
    scenario: scen,
    divisions: S.divs.map((d) => ({ division: d.num, name: d.name, total: Math.round(d.total), material: Math.round(d.mat), labor: Math.round(d.lab), equipment: Math.round(d.equip), subcontractor: Math.round(d.sub), laborHours: Math.round(d.hrs) })),
    markups: { direct: Math.round(S.direct), overhead: Math.round(S.overhead), profit: Math.round(S.profit), contingency: Math.round(S.contingency), bondsIns: Math.round(S.bondsIns), permit: S.permit },
    total: Math.round(S.total), psf: +S.psf.toFixed(2),
  };
  sql += `INSERT INTO quick_estimates (id,"projectType",sqft,location,"qualityTier",description,"materialTotal","laborTotal",subtotal,overhead,profit,contingency,"grandTotal","priceLow","priceMid","priceHigh",breakdown,assumptions,status) VALUES (
  '${IDS[scen]}', 'group_home_new', ${J.meta.basis.gsf}, 'DC', '${scen === 'A' ? 'mid' : scen === 'B' ? 'value-engineered' : 'minimum'}',
  ${sqlStr(`5213 Call Place SE — R-2 group home — Scenario ${scen} (measured takeoff, ${J.meta.basis.stories})`)},
  ${num(S.material)}, ${num(S.labor)}, ${num(S.direct)}, ${num(S.overhead)}, ${num(S.profit)}, ${num(S.contingency)}, ${num(S.total)},
  ${num(J.scenarios.C.total)}, ${num(J.scenarios.A.total)}, ${num(J.scenarios.A.total * 1.1)},
  ${jq(breakdown)}, ${jq(assumptions)}, 'draft');
`;
}

// line items for the recommended Scenario A
for (const d of J.scenarios.A.divs) for (const ln of d.lines) {
  sql += `INSERT INTO estimate_line_items ("estimateId",division,item,"catalogueCode","isAllowance",unit,qty,method,"dimensionBasis",sheet,confidence,"matUnit","labUnit","equipUnit","subUnit","laborHours",extended,note) VALUES (
  '${IDS.A}', '${d.num}', ${sqlStr(ln.name)}, ${sqlStr(ln.code)}, ${ln.allowance}, ${sqlStr(ln.unit)}, ${ln.qty}, ${sqlStr(ln.method)}, ${sqlStr(ln.dim || ln.basis || '')}, ${sqlStr(ln.sheet)}, ${sqlStr(ln.conf)},
  ${num(ln.matUnit)}, ${num(ln.labUnit)}, ${num(ln.equipUnit)}, ${num(ln.subUnit)}, ${num(ln.ext.lhrs)}, ${num(ln.ext.total)}, ${sqlStr(ln.note)});
`;
}

sql += `COMMIT;
`;
process.stdout.write(sql);
