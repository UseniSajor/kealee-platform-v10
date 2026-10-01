/**
 * Rebuild the cad-plot sheet set from a saved twin, without re-running the
 * subdivision engine (~15 min on /mnt/c). Use after a change to the sheet set,
 * the checklist, the street profile or the L.O.D. logic.
 *
 *   pnpm tsx scripts/rebuild-sheetset.ts <twin.json> <plat-record.json> <previous.sheetset.json> <out.sheetset.json>
 *
 * The twin must come from the same inputs: generate-subdivision.ts with
 * TWIN_JSON=... set. The tract (boundary of record) is read from the previous sheet set.
 */
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { buildSheetSet } from '../src/sheets/sheetset'

const [twinPath, recPath, prevPath, outPath] = process.argv.slice(2)
if (!twinPath || !recPath || !prevPath || !outPath) {
  console.error('usage: rebuild-sheetset.ts <twin.json> <plat-record.json> <previous.sheetset.json> <out.sheetset.json>')
  process.exit(1)
}
const twin = JSON.parse(readFileSync(twinPath, 'utf8'))
const platRecord = JSON.parse(readFileSync(recPath, 'utf8'))
const tract = JSON.parse(readFileSync(prevPath, 'utf8')).tract as [number, number][]
if (!tract?.length) { console.error('no tract in twin'); process.exit(1) }
const set = buildSheetSet({ twin, tract, platRecord, detailDir: join(__dirname, '..', 'assets', 'details') })
writeFileSync(outPath, JSON.stringify(set))
console.log(`sheet set ${set.sheets.length} sheets · checklist ${set.checklist.rows.filter(r => r.status === 'O').length} O -> ${outPath}`)
