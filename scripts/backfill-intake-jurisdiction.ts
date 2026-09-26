/**
 * Determines the jurisdiction of every existing order that has none, from its
 * project_address, the same way intake now does (U.S. Census geocoder → the
 * body that zones the land). Adds form_data.jurisdiction / jurisdictionCode by
 * JSONB MERGE and fills the jurisdiction columns; nothing else in the row is
 * rewritten. An address the geocoder cannot place is recorded as undetermined,
 * never defaulted.
 *
 *   DIRECT_URL=postgresql://... pnpm tsx scripts/backfill-intake-jurisdiction.ts [--dry-run]
 */
import { createRequire } from 'node:module'
import { determineJurisdiction } from '../packages/spatial-engine/src/jurisdictions/determination'

const require = createRequire(__filename)
const pg = require('../packages/database/node_modules/pg')

async function main() {
  const dry = process.argv.includes('--dry-run')
  const url = (process.env.DIRECT_URL ?? process.env.SUPABASE_DB_URL ?? '').replace(/\?.*$/, '')
  if (!url) throw new Error('Set DIRECT_URL')
  const c = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } })
  await c.connect()
  const { rows } = await c.query(
    `SELECT id, project_address FROM public_intake_leads
      WHERE jurisdiction IS NULL AND project_address IS NOT NULL AND btrim(project_address) <> ''
      ORDER BY created_at`)
  const tally: Record<string, number> = {}
  for (const r of rows) {
    let det = await determineJurisdiction(r.project_address, { timeoutMs: 10000 })
    for (let retry = 0; retry < 3 && /did not answer/.test(det.reason ?? ''); retry++) {
      await new Promise(res => setTimeout(res, 2000 * (retry + 1)))
      det = await determineJurisdiction(r.project_address, { timeoutMs: 15000 })
    }
    const key = det.determined ? det.code! : 'UNDETERMINED'
    tally[key] = (tally[key] ?? 0) + 1
    if (dry) continue
    await c.query(
      `UPDATE public_intake_leads
          SET form_data = COALESCE(form_data, '{}'::jsonb) || $2::jsonb,
              jurisdiction = $3::jsonb,
              jurisdiction_code = $4
        WHERE id = $1 AND jurisdiction IS NULL`,
      [r.id,
       JSON.stringify(det.determined ? { jurisdiction: det, jurisdictionCode: det.code } : { jurisdiction: det }),
       JSON.stringify(det),
       det.determined ? det.code : null])
  }
  console.log(`${rows.length} order(s) ${dry ? 'examined (dry run)' : 'determined'}:`, tally)
  await c.end()
}
main().catch(e => { console.error(e.message); process.exit(1) })
