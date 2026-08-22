/**
 * A real source refresh against the live publishers.
 *
 * Everything up to now has been verified against fixtures. The locators were
 * confirmed by hand-probing the endpoints, and the maintenance cycle was tested
 * with synthesised documents — but the two have never met. This runs the actual
 * cycle against the actual county and FEMA endpoints, which is the only way to
 * find out whether a locator that matched during a probe still matches when the
 * engine drives it.
 *
 * DRY RUN BY DEFAULT. Nothing is persisted and no certification is withdrawn
 * unless `--commit` is passed, which is meaningless here anyway since the rules
 * start EXTRACTED and nothing is certified yet.
 *
 * Run:  npx tsx packages/spatial-engine/scripts/refresh-sources.ts
 *       npx tsx packages/spatial-engine/scripts/refresh-sources.ts --json
 */

import { buildPgCertifiableRules, PG_CORE_RULE_KEYS, PG_PACK_VERSION } from '../src/rules/pg-certifiable'
import { buildPgSourceBundles, pgRulesWithoutLocator } from '../src/jurisdictions/pg-source-locators'
import { buildPgFemaSources } from '../src/jurisdictions/fema-nfhl'
import { runMaintenanceCycle } from '../src/rules/maintenance'

const asJson = process.argv.includes('--json')
const h = (t: string) => { if (!asJson) console.log(`\n${'═'.repeat(76)}\n${t}\n${'═'.repeat(76)}`) }
const say = (...a: unknown[]) => { if (!asJson) console.log(...a) }

async function main() {
  const retrievedAt = new Date().toISOString()
  const rules = buildPgCertifiableRules({ retrievedAt })

  const county = buildPgSourceBundles(rules, { retrievedAt })
  const fema = buildPgFemaSources(rules, { retrievedAt })
  const bundles = [
    ...county.map(b => ({ source: b.source, locators: b.locators, publisher: 'county' })),
    ...fema.map(b => ({ source: b.source, locators: b.locators, publisher: 'FEMA' })),
  ]

  h('SOURCES')
  say(`${rules.length} rules, ${bundles.length} sources (${county.length} county, ${fema.length} FEMA)`)
  const uncovered = pgRulesWithoutLocator(rules)
  say(`${rules.length - uncovered.length}/${rules.length} rules have a locator; ${uncovered.length} do not.`)

  h('FETCHING — this hits the live publishers')
  const started = Date.now()

  // Every source starts with an empty documentHash, so the first refresh is a
  // baseline rather than a comparison: it establishes what "unchanged" means.
  const result = await runMaintenanceCycle({
    jurisdictionCode: 'prince_georges_md',
    rules,
    sources: bundles.map(b => ({ source: b.source, locators: b.locators })),
    coreRuleKeys: PG_CORE_RULE_KEYS,
    packVersion: PG_PACK_VERSION,
    effectiveDate: '2022-04-01',
    // No store: dry run. Nothing is written.
  })

  const elapsed = ((Date.now() - started) / 1000).toFixed(1)

  h('RESULT')
  say(`checked ${result.sourcesChecked} source(s) in ${elapsed}s`)
  say(`unreachable: ${result.sourcesUnreachable.length}`)
  say(`locators that failed to match: ${result.regionsUnlocatable.length}`)

  // The number that matters. A locator that matched during a hand-probe but not
  // here is a locator that does not work, and finding that out now is the point.
  const bySource = new Map(bundles.map(b => [b.source.sourceId, b]))
  h('PER SOURCE')
  const rows: Record<string, unknown>[] = []
  for (const id of bundles.map(b => b.source.sourceId)) {
    const b = bySource.get(id)!
    const unreachable = result.sourcesUnreachable.includes(id)
    const region = result.sources.find(s => s.sourceId === id)?.regions ?? []
    const hashed = region.length > 0
    const status = unreachable ? 'UNREACHABLE' : hashed ? 'hashed' : 'LOCATOR FAILED'
    rows.push({ sourceId: id, publisher: b.publisher, status, regions: region.length,
                hash: region[0]?.hash?.slice(0, 12) ?? null })
    say(`  ${status.padEnd(14)} ${b.publisher.padEnd(7)} ${id}` +
        (hashed ? `  ${region[0].hash.slice(0, 12)}…  (${region[0].ruleIdentities.length} rule(s))` : ''))
  }

  const failed = rows.filter(r => r.status === 'LOCATOR FAILED')
  const unreachable = rows.filter(r => r.status === 'UNREACHABLE')

  h('MAINTENANCE ITEMS')
  if (result.regionsUnlocatable.length === 0 && result.sourcesUnreachable.length === 0) {
    say('  none — every source was reached and every locator matched.')
  }
  for (const id of result.regionsUnlocatable) say(`  LOCATOR FAILED  ${id}`)
  for (const id of result.sourcesUnreachable) say(`  UNREACHABLE     ${id}`)

  h('PACK')
  say(`${result.packAfter.status} — ${result.packAfter.statusRationale}`)
  say(`health: ${result.health.grade}`)
  for (const a of result.health.actions) say(`  next: ${a}`)

  if (asJson) {
    console.log(JSON.stringify({
      retrievedAt, elapsedSeconds: Number(elapsed),
      sourcesChecked: result.sourcesChecked,
      unreachable: unreachable.map(r => r.sourceId),
      locatorFailures: failed.map(r => r.sourceId),
      sources: rows,
      packStatus: result.packAfter.status,
      health: result.health.grade,
    }, null, 2))
  }

  // A locator that no longer matches is a real failure worth a non-zero exit,
  // so this can be wired into a scheduled check. An unreachable publisher is
  // not — an outage is not an amendment, and failing the job for it would
  // train people to ignore the job.
  if (failed.length > 0) {
    say(`\n${failed.length} locator(s) failed to match live content. This is a real defect.`)
    process.exit(1)
  }
  say('\nEvery locator matched live content.')
}

main().catch(e => { console.error(e); process.exit(2) })
