/**
 * The rule-maintenance cycle.
 *
 * What matters is that the cycle is boring: with nothing changed it does
 * nothing, with one source changed it touches only that source's rules, and a
 * publisher outage never costs anyone a certification. The audit trail has to
 * come out complete, because that is the part nobody notices is missing until
 * it is needed.
 */

import {
  runMaintenanceCycle, sweepExpiredCertifications, assessPackHealth,
  ruleMaintenanceJob, RULE_MAINTENANCE_QUEUE, RULE_MAINTENANCE_SCHEDULE,
} from '../rules/maintenance'
import { certifyRule, reconcileSources, type CertifiableRule, type Reviewer } from '../rules/certification'
import { hashSourceContent, type AuthoritativeSource } from '../rules/change-detection'
import { sectionWindow, type RegionLocator, type FetchResult } from '../rules/source-refresh'
import { buildRulePack } from '../rules/pack'
import { InMemoryRuleCertificationStore } from '../persistence/rule-certification'

const PLANNER: Reviewer = { id: 'rev-1', name: 'M. Okafor', role: 'land_use_planner', state: 'MD' }
const HASH = 'a'.repeat(64)

const DOC_A = '<h2>Sec. 27-4202</h2><table><tr><td>Front yard</td><td>25 ft</td></tr></table>'
const DOC_B = '<h2>Sec. 27-4203</h2><table><tr><td>Side yard</td><td>8 ft</td></tr></table>'

function baseRule(id: string, key: string, over: Partial<CertifiableRule> = {}): CertifiableRule {
  return {
    identity: id,
    scope: { jurisdiction: 'prince_georges_md', codeSection: 'Sec. 27-4202',
             ruleType: 'dimensional.standards', scopeKey: { zone: 'RSF-65' }, effectiveVersion: '2022-04-01' },
    ruleKey: key, version: 1, state: 'VERIFIED', value: '25',
    provenance: {
      jurisdiction: 'prince_georges_md', agency: 'M-NCPPC', sourceType: 'OFFICIAL_CODE',
      granularity: 'table', sourceTitle: 'PG Code', sourceUrl: 'https://example.gov/a',
      codeSection: 'Sec. 27-4202', table: 'T', effectiveDate: '2022-04-01',
      retrievedAt: new Date().toISOString(), sourceHash: HASH, sourceVersion: '2022.1',
      extractionMethod: 'html_table_parser', parserVersion: 'kealee-rules-1.0.0',
    },
    confidence: { extractionConfidence: 1, authorityConfidence: 1, applicabilityConfidence: 0.97 },
    applicability: { condition: { kind: 'equals', field: 'zone', value: 'RSF-65' } },
    reconciliation: reconcileSources({ dualSourceRequired: false, sourceA: null, sourceB: null }),
    certification: null, gating: true, sourceIssues: [],
    humanReviewRequired: true, humanReviewReasons: [],
    ...over,
  }
}

function certify(rule: CertifiableRule, expiresAt?: string): CertifiableRule {
  return certifyRule({
    rule, reviewer: PLANNER, currentSourceHash: rule.provenance.sourceHash,
    note: 'Confirmed.', expiresAt,
  }).rule
}

const stub = (body: string | null, error?: string) => async (): Promise<FetchResult> => ({
  ok: body != null, status: body != null ? 200 : 503, body,
  error: error ?? null, fetchedAt: '2026-08-22T10:00:00Z',
  bytes: body ? Buffer.byteLength(body) : 0,
})

async function sourceFor(id: string, doc: string, marker: string, ruleIds: string[]) {
  const { normalizeSourceContent } = await import('../rules/change-detection')
  const locator: RegionLocator = {
    regionId: `region-${id}`, label: `Region ${id}`, ruleIdentities: ruleIds,
    extract: sectionWindow(marker, 5000),
  }
  const slice = locator.extract(normalizeSourceContent(doc)) as string
  const source: AuthoritativeSource = {
    sourceId: id, jurisdiction: 'prince_georges_md', title: `Source ${id}`,
    url: `https://example.gov/${id}`, documentId: null,
    documentHash: await hashSourceContent(doc), version: '2022.1',
    retrievedAt: '2026-01-01T00:00:00Z',
    regions: [{ regionId: `region-${id}`, label: `Region ${id}`,
                hash: await hashSourceContent(slice, { stripHtml: false }), ruleIdentities: ruleIds }],
    history: [],
  }
  return { source, locators: [locator] }
}

/** Two sources, one rule each, both certified. */
async function scenario(opts: { docA?: string; docB?: string; expiresAt?: string } = {}) {
  const ruleA = certify(baseRule('id-a', 'zoning.dimensional.RSF-65'), opts.expiresAt)
  const ruleB = certify(baseRule('id-b', 'zoning.dimensional.CN'))
  const a = await sourceFor('src-a', DOC_A, 'sec. 27-4202', ['id-a'])
  const b = await sourceFor('src-b', DOC_B, 'sec. 27-4203', ['id-b'])
  return {
    rules: [ruleA, ruleB],
    sources: [a, b],
  }
}

/** Runs a cycle against fixture documents — no network involved. */
async function runWithDocs(
  s: Awaited<ReturnType<typeof scenario>>,
  docs: [string | null, string | null],
  store?: InMemoryRuleCertificationStore,
) {
  return runMaintenanceCycle({
    jurisdictionCode: 'prince_georges_md',
    rules: s.rules,
    sources: s.sources.map((src, i) => ({
      source: src.source,
      locators: src.locators,
      fetchOptions: { fetchImpl: stub(docs[i]) },
    })),
    coreRuleKeys: ['zoning.dimensional.RSF-65'],
    packVersion: '2022.1',
    effectiveDate: '2022-04-01',
    store,
    queueFor: PLANNER,
    now: new Date('2026-08-22T10:00:00Z'),
  })
}

// ── Expiry sweep ────────────────────────────────────────────────────────────

describe('expired certifications', () => {
  it('lapses a certification past its review-by date', () => {
    const rule = certify(baseRule('id-a', 'k'), '2026-01-01T00:00:00Z')
    const out = sweepExpiredCertifications([rule], new Date('2026-08-22'))
    expect(out.expired).toHaveLength(1)
    expect(out.rules[0].state).toBe('PROVISIONAL')
    expect(out.rules[0].certification?.active).toBe(false)
    expect(out.audits[0].reason).toMatch(/returns to PROVISIONAL until it is re-read/i)
  })

  it('leaves a certification with a future expiry alone', () => {
    const rule = certify(baseRule('id-a', 'k'), '2027-01-01T00:00:00Z')
    const out = sweepExpiredCertifications([rule], new Date('2026-08-22'))
    expect(out.expired).toHaveLength(0)
    expect(out.rules[0].state).toBe('CERTIFIED')
  })

  it('leaves a certification with no expiry alone', () => {
    const out = sweepExpiredCertifications([certify(baseRule('id-a', 'k'))], new Date('2030-01-01'))
    expect(out.expired).toHaveLength(0)
    expect(out.rules[0].state).toBe('CERTIFIED')
  })

  it('does not touch a rule that was never certified', () => {
    const out = sweepExpiredCertifications([baseRule('id-a', 'k')], new Date('2030-01-01'))
    expect(out.expired).toHaveLength(0)
    expect(out.rules[0].state).toBe('VERIFIED')
  })
})

// ── Health ──────────────────────────────────────────────────────────────────

describe('pack health', () => {
  const pack = (rules: CertifiableRule[], core: string[]) => buildRulePack({
    jurisdiction: 'prince_georges_md', packVersion: '2022.1', effectiveDate: '2022-04-01',
    rules, coreRuleKeys: core, sources: [], lastRefreshedAt: new Date().toISOString(),
  })

  it('is healthy when everything core is certified and nothing moved', () => {
    const rules = [certify(baseRule('id-a', 'k'))]
    const h = assessPackHealth({ pack: pack(rules, ['k']), rules, outcomes: [] })
    expect(h.grade).toBe('healthy')
    expect(h.automationRate).toBe(1)
  })

  it('is degraded while a core rule is uncertified', () => {
    const rules = [baseRule('id-a', 'k')]
    const h = assessPackHealth({ pack: pack(rules, ['k']), rules, outcomes: [] })
    expect(h.grade).toBe('degraded')
    expect(h.actions[0]).toMatch(/Certify the remaining core rules/i)
  })

  it('measures automation over gating rules only', () => {
    // An advisory rule was never going to need review; counting it would flatter.
    const rules = [
      certify(baseRule('id-a', 'k')),
      baseRule('id-b', 'advisory', { gating: false, state: 'EXTRACTED' }),
    ]
    const h = assessPackHealth({ pack: pack(rules, ['k']), rules, outcomes: [] })
    expect(h.automationRate).toBe(1)
  })
})

// ── The cycle ───────────────────────────────────────────────────────────────

describe('the maintenance cycle', () => {
  it('does nothing to the rules when no source changed', async () => {
    const s = await scenario()
    const out = await runWithDocs(s, [DOC_A, DOC_B])
    expect(out.sourcesChanged).toEqual([])
    expect(out.rulesDowngraded).toEqual([])
    expect(out.rules.every(r => r.state === 'CERTIFIED')).toBe(true)
  })

  it('clears staleness when the sources were actually reached', async () => {
    // The fixture was last retrieved in January against an August `now`, so the
    // pack starts STALE. Reaching the sources and finding them unchanged is
    // exactly what proves currency.
    const s = await scenario()
    const out = await runWithDocs(s, [DOC_A, DOC_B])
    expect(out.packBefore.status).toBe('STALE')
    expect(out.packAfter.status).toBe('CERTIFIED')
  })

  it('does NOT clear staleness when every source was unreachable', async () => {
    // "We could not check" must never become "we checked and it is fine".
    const s = await scenario()
    const out = await runWithDocs(s, [null, null])
    expect(out.sourcesUnreachable).toEqual(['src-a', 'src-b'])
    expect(out.packAfter.status).toBe('STALE')
    // and the certifications survive the outage regardless
    expect(out.rules.every(r => r.state === 'CERTIFIED')).toBe(true)
  })

  it('downgrades only the rules of the source that changed', async () => {
    const s = await scenario()
    const out = await runWithDocs(s, [DOC_A.replace('25 ft', '30 ft'), DOC_B])
    expect(out.sourcesChanged).toEqual(['src-a'])
    expect(out.rulesDowngraded.map(d => d.identity)).toEqual(['id-a'])

    const byId = Object.fromEntries(out.rules.map(r => [r.identity, r]))
    expect(byId['id-a'].state).toBe('PROVISIONAL')
    expect(byId['id-b'].state).toBe('CERTIFIED')
  })

  it('keeps every certification when a publisher is down', async () => {
    const s = await scenario()
    const out = await runWithDocs(s, [null, DOC_B])
    expect(out.sourcesUnreachable).toEqual(['src-a'])
    expect(out.rulesDowngraded).toEqual([])
    expect(out.rules.every(r => r.state === 'CERTIFIED')).toBe(true)
    expect(out.health.findings.some(f => f.code === 'SOURCES_UNREACHABLE')).toBe(true)
  })

  it('carries the source_changed audits through instead of dropping them', async () => {
    const s = await scenario()
    const out = await runWithDocs(s, [DOC_A.replace('25 ft', '30 ft'), DOC_B])
    // These come from applySourceChange inside refreshSource and used to be lost.
    expect(out.audits.length).toBeGreaterThan(0)
    expect(out.audits.some(a => a.action === 'source_changed')).toBe(true)
    expect(out.audits.every(a => a.ruleIdentity && a.reason)).toBe(true)
  })

  it('sweeps an expired certification in the same cycle', async () => {
    const s = await scenario({ expiresAt: '2026-01-01T00:00:00Z' })
    const out = await runWithDocs(s, [DOC_A, DOC_B])
    expect(out.certificationsExpired.map(e => e.identity)).toEqual(['id-a'])
    expect(out.rules.find(r => r.identity === 'id-a')!.state).toBe('PROVISIONAL')
    expect(out.rules.find(r => r.identity === 'id-b')!.state).toBe('CERTIFIED')
  })

  it('writes nothing on a dry run', async () => {
    const s = await scenario()
    const out = await runWithDocs(s, [DOC_A.replace('25 ft', '30 ft'), DOC_B])
    expect(out.dryRun).toBe(true)
    expect(out.summary).toMatch(/DRY RUN/i)
  })

  it('persists the cycle when a store is supplied', async () => {
    const store = new InMemoryRuleCertificationStore()
    const s = await scenario()
    const out = await runWithDocs(s, [DOC_A.replace('25 ft', '30 ft'), DOC_B], store)
    expect(out.dryRun).toBe(false)
    expect(store.rules.length).toBeGreaterThan(0)
    expect(store.audit.length).toBeGreaterThan(0)
    // The downgraded rule's certification is withdrawn, not deleted.
    expect(store.sourceChanges.length).toBeGreaterThan(0)
  })

  it('is idempotent — a second identical cycle changes nothing further', async () => {
    const s = await scenario()
    const first = await runWithDocs(s, [DOC_A, DOC_B])
    const second = await runMaintenanceCycle({
      jurisdictionCode: 'prince_georges_md',
      rules: first.rules,
      sources: first.sources.map((src, i) => ({
        source: src,
        locators: s.sources[i].locators,
        fetchOptions: { fetchImpl: stub([DOC_A, DOC_B][i]) },
      })),
      coreRuleKeys: ['zoning.dimensional.RSF-65'],
      packVersion: '2022.1', effectiveDate: '2022-04-01',
      now: new Date('2026-08-22T10:00:00Z'),
    })
    expect(second.rulesDowngraded).toEqual([])
    expect(second.sourcesChanged).toEqual([])
  })

  it('builds a maintenance queue for the reviewer', async () => {
    const s = await scenario()
    const out = await runWithDocs(s, [DOC_A.replace('25 ft', '30 ft'), DOC_B])
    expect(out.queue.some(q => q.ruleIdentity === 'id-a')).toBe(true)
    // The untouched certified rule is not in the queue.
    expect(out.queue.some(q => q.ruleIdentity === 'id-b')).toBe(false)
  })
})

// ── Job integration ─────────────────────────────────────────────────────────

describe('job integration reuses the existing queue', () => {
  it('produces a stable job id so duplicates cannot pile up', () => {
    const a = ruleMaintenanceJob('prince_georges_md', '2022.1')
    const b = ruleMaintenanceJob('prince_georges_md', '2022.1')
    expect(a.jobId).toBe(b.jobId)
    expect(a.queueName).toBe(RULE_MAINTENANCE_QUEUE)
    // (queueName, jobId) is unique on JobQueue, so enqueueing twice collapses.
  })

  it('separates jurisdictions and pack versions', () => {
    expect(ruleMaintenanceJob('prince_georges_md', '2022.1').jobId)
      .not.toBe(ruleMaintenanceJob('montgomery_md', '2022.1').jobId)
    expect(ruleMaintenanceJob('prince_georges_md', '2022.1').jobId)
      .not.toBe(ruleMaintenanceJob('prince_georges_md', '2026.1').jobId)
  })

  it('schedules weekly rather than daily', () => {
    // Counties amend on a scale of months; a daily fetch is load on a public
    // portal for no information gain.
    expect(RULE_MAINTENANCE_SCHEDULE.cronExpression).toBe('0 4 * * 1')
    expect(RULE_MAINTENANCE_SCHEDULE.description).toMatch(/Never runs on a request path/i)
  })
})
