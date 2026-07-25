/**
 * ctc-load-db.mjs — load the extracted CTC catalogs into Postgres.
 *
 * Reads data/ctc/ctc-cost-tasks.json (+ ctc-technical.json if present),
 * applies the 2023 -> current-year escalation, and emits SQL that creates the
 * schema (data/ctc/schema.sql) and seeds:
 *   ctc_cost_database · ctc_cost_tasks · ctc_technical_specs · ctc_assembly
 *
 *   node scripts/ctc/ctc-load-db.mjs > /tmp/ctc.sql
 *   psql "$DATABASE_URL" -f /tmp/ctc.sql
 *
 * Escalation: CTC is a June-2023 catalog. Repo convention is x1.13 for
 * 2023->2026 DMV (services/ai-orchestrator ctc-calculator; seed-ctc). Override
 * with CTC_ESCALATION / CTC_ESC_YEAR env vars.
 */
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import crypto from 'node:crypto';

const REPO = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '../..');
const DATA = path.join(REPO, 'data/ctc');
const ESCALATION = Number(process.env.CTC_ESCALATION || 1.13);   // 2023 -> 2026 DMV
const ESC_YEAR = Number(process.env.CTC_ESC_YEAR || 2026);
const DB_ID = 'CTC-2023';

const S = (s) => `$s$${s ?? ''}$s$`;
const N = (n) => (n == null || Number.isNaN(Number(n)) ? 'NULL' : Number(n).toFixed(4));
const B = (b) => (b ? 'true' : 'false');

const costFile = path.join(DATA, 'ctc-cost-tasks.json');
const techFile = path.join(DATA, 'ctc-technical.json');
if (!fs.existsSync(costFile)) {
  process.stderr.write(`Missing ${path.relative(REPO, costFile)} — run ctc_extract.py first.\n`);
  process.exit(1);
}
const cost = JSON.parse(fs.readFileSync(costFile, 'utf8'));
const tech = fs.existsSync(techFile) ? JSON.parse(fs.readFileSync(techFile, 'utf8')) : { specs: [] };

let sql = fs.readFileSync(path.join(DATA, 'schema.sql'), 'utf8') + '\nBEGIN;\n';
sql += `DELETE FROM ctc_assembly WHERE cost_database_id='${DB_ID}';\n`;
sql += `DELETE FROM ctc_technical_specs WHERE database_id='${DB_ID}';\n`;
sql += `DELETE FROM ctc_cost_tasks WHERE database_id='${DB_ID}';\n`;
sql += `DELETE FROM ctc_cost_database WHERE id='${DB_ID}';\n`;
sql += `INSERT INTO ctc_cost_database (id,name,source,region,base_year,escalation_year,escalation_factor,publisher,copyright_holder,licensee,rights_basis,platform_custodian,redistribution_allowed,is_master,cost_pdf,technical_pdf,task_count,spec_count)
VALUES ('${DB_ID}', ${S('Construction Task Catalog — Gordian/MD DGS (June 2023)')}, '${DB_ID}', 'MD-DC-VA', 2023, ${ESC_YEAR}, ${ESCALATION},
  ${S('The Gordian Group, Inc.')}, ${S('The Gordian Group, Inc.')}, ${S('Maryland Department of General Services')},
  ${S('License/contract authority must be verified by Kealee before production redistribution or external reuse.')},
  ${S('Kealee Services LLC')}, false, true,
  ${S(cost.meta?.source || '')}, ${S(tech.meta?.source || '')}, ${cost.tasks.length}, ${tech.specs.length});\n`;

for (const t of cost.tasks) {
  const escalated = t.unitPrice2023 == null ? null : +(t.unitPrice2023 * ESCALATION).toFixed(4);
  sql += `INSERT INTO ctc_cost_tasks (database_id,task_number,csi_code,csi_division,description,uom,unit_price_2023,labor_cost_2023,material_cost_2023,equipment_cost_2023,labor_hours,labor_rate_2023,labor_hours_method,labor_rate_source_task,labor_rate_trade,labor_rate_effective_date,escalation_factor,unit_price_current,is_modifier,modifier_of,modifier_type,modifier_value,page,source)
VALUES ('${DB_ID}', ${S(t.taskNumber)}, ${S(t.csiCode)}, ${S(t.csiDivision)}, ${S(t.description)}, ${S(t.uom)},
  ${N(t.unitPrice2023)}, ${N(t.laborCost2023)}, ${N(t.materialCost2023)}, ${N(t.equipmentCost2023)}, ${N(t.laborHours)},
  ${N(t.laborRate2023)}, ${S(t.laborHoursMethod)}, ${S(t.laborRateSourceTask)}, ${S(t.laborRateTrade)}, ${S(t.laborRateEffectiveDate)},
  ${ESCALATION}, ${N(escalated)}, ${B(t.isModifier)}, ${S(t.modifierOf)}, ${S(t.modifierType)}, ${N(t.modifierValue)}, ${t.page || 'NULL'}, '${DB_ID}')
  ON CONFLICT (database_id,task_number) DO NOTHING;\n`;

  // platform bridge: Assembly row (current-year, engine-ready)
  const id = crypto.createHash('sha1').update(DB_ID + t.taskNumber).digest('hex').slice(0, 32);
  sql += `INSERT INTO ctc_assembly (id,cost_database_id,ctc_task_number,csi_code,name,category,unit,unit_cost,labor_cost,material_cost,equipment_cost,labor_hours,source_database)
VALUES ('${id}', '${DB_ID}', ${S(t.taskNumber)}, ${S(t.csiCode)}, ${S(t.description)}, ${S('CTC_DIV_' + t.csiDivision)}, ${S(t.uom)},
  ${N(escalated)}, ${N(t.laborCost2023 * ESCALATION)}, ${N(t.materialCost2023 * ESCALATION)}, ${N(t.equipmentCost2023 * ESCALATION)}, ${N(t.laborHours)}, '${DB_ID}')
  ON CONFLICT (id) DO NOTHING;\n`;
}

for (const s of tech.specs) {
  sql += `INSERT INTO ctc_technical_specs (database_id,spec_number,csi_code,csi_division,title,body,page,source)
VALUES ('${DB_ID}', ${S(s.specNumber)}, ${S(s.csiCode)}, ${S(s.csiDivision)}, ${S(s.title)}, ${S(s.body)}, ${s.page || 'NULL'}, '${DB_ID}')
  ON CONFLICT (database_id,spec_number) DO NOTHING;\n`;
}

sql += 'COMMIT;\n';
process.stdout.write(sql);
process.stderr.write(`Prepared: ${cost.tasks.length} cost tasks + ${tech.specs.length} tech specs (escalation x${ESCALATION} -> ${ESC_YEAR}).\n`);
