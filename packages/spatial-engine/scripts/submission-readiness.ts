/**
 * What is left before this set can be filed with Prince George's County.
 *
 *   pnpm tsx scripts/submission-readiness.ts \
 *     ../../output/site-plans/indian-queen-lots-53-56.twin.json \
 *     ../../output/site-plans/indian-queen-lots-53-56.submission.md
 *
 * The twin comes from a generator run with TWIN_JSON=... set. Reading the model
 * rather than the PDF is deliberate: the question "does the sheet carry a
 * drainage area map" is answered by the features that produced the sheet, not by
 * looking at ink.
 *
 * BUILDING_DRAWINGS and APPLICATION_ITEMS name what is already in hand, as
 * comma-separated refs, so the report reflects the real position rather than
 * assuming nothing exists:
 *
 *   BUILDING_DRAWINGS=E003-2,E003-5 APPLICATION_ITEMS=A.1,A.3 pnpm tsx ...
 */

import { readFileSync, writeFileSync } from 'fs'
import type { SiteTwin } from '../src/site-plan/site-twin'
import {
  buildSubmissionReadiness, renderSubmissionReadiness,
} from '../src/review/submission-package'

function main(): void {
  const [twinPath, outPath] = process.argv.slice(2)
  if (!twinPath) {
    console.error('usage: submission-readiness.ts <twin.json> [out.md]')
    console.error('       generate the twin with TWIN_JSON=... on a generator run')
    process.exit(2)
  }
  const twin = JSON.parse(readFileSync(twinPath, 'utf8')) as SiteTwin
  const lots = (twin as { projectLots?: { label: string; address: string }[] }).projectLots ?? []
  const project = lots.length
    ? `${lots.map(l => l.label).join(', ')} — ${lots[0].address.replace(/^\d+\s+/, '')}`
    : (twin.address ?? 'site')

  const split = (v: string | undefined) =>
    (v ?? '').split(',').map(x => x.trim()).filter(Boolean)

  const report = buildSubmissionReadiness({
    twin, project,
    buildingDrawingsInHand: split(process.env.BUILDING_DRAWINGS),
    applicationItemsInHand: split(process.env.APPLICATION_ITEMS),
  })

  console.log(`\nSUBMISSION READINESS — ${report.project}`)
  console.log(`${report.summary}\n`)

  for (const part of report.parts) {
    const carried = part.items.filter(i => i.status === 'carried').length
    console.log(`  ${part.title}  —  ${carried}/${part.items.length} carried`)
    console.log(`    ${part.division}`)
    for (const i of part.items) {
      const mark = i.status === 'carried' ? '[x]'
        : i.status === 'not_applicable' ? '[-]'
        : i.status === 'required_from_others' ? '[ ]' : '[!]'
      const tail = i.conditional ? '  (if applicable)' : ''
      console.log(`    ${mark} ${i.ref.padEnd(18)} ${i.requirement.slice(0, 88)}${tail}`)
      if (i.status !== 'carried') console.log(`        -> ${i.producer}: ${i.evidence.slice(0, 120)}`)
    }
    console.log('')
  }

  console.log(`  ${report.blocksSubmission.length} item(s) would stop the initial application:`)
  for (const i of report.blocksSubmission) {
    console.log(`    · ${i.ref}  ${i.requirement.slice(0, 96)}  [${i.producer}]`)
  }
  console.log('')
  for (const c of report.caveats) console.log(`  ! ${c}\n`)

  if (outPath) {
    writeFileSync(outPath, renderSubmissionReadiness(report))
    console.log(`  written: ${outPath}`)
  }
}

main()
