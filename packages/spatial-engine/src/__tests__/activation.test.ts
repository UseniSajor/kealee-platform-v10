/**
 * Phase 4 — activation: source refresh and the order boundary.
 *
 * The behaviours that matter here are about honesty at the edges. A county
 * portal that times out must not look like an amendment. A region locator that
 * stops matching must not hash to a stable empty string and read as "unchanged
 * forever". And an intake that never asked whether a lot is a corner must not
 * produce "interior" — it must produce "we do not know", which routes to a
 * human rather than silently applying the wrong setback.
 */

import {
  refreshSource, refreshAll, sectionWindow, type FetchResult, type RegionLocator,
} from '../rules/source-refresh'
import {
  hashSourceContent, type AuthoritativeSource,
} from '../rules/change-detection'
import { buildPgCertifiableRules } from '../rules/pg-certifiable'
import { certifyRule, reconcileSources, type CertifiableRule, type Reviewer } from '../rules/certification'
import { ruleIdentity } from '../rules/model'
import { buildRulePack } from '../rules/pack'
import {
  buildProjectContext, evaluateOrder, canProceedToProfessionalReview,
  SUPPORTED_JURISDICTIONS, type OrderFormData,
} from '../integration/site-plan-order'
// The server-safe entry point. Importing '../index' pulls in the React
// editor and cannot load outside a browser bundle.
import * as Engine from '../engine'

const PLANNER: Reviewer = { id: 'rev-1', name: 'M. Okafor', role: 'land_use_planner', state: 'MD' }
const SOURCE_HASH = 'a'.repeat(64)

const ORDINANCE = `
<html><body>
<h2>Sec. 27-4205 Intensity and dimensional standards</h2>
<table><tr><td>Front yard depth</td><td>25 ft</td></tr></table>
<h2>Sec. 27-4206 Accessory structures</h2>
<table><tr><td>Side yard</td><td>5 ft</td></tr></table>
</body></html>`

function stubFetch(body: string | null, error?: string): (u: string) => Promise<FetchResult> {
  return async () => ({
    ok: body != null, status: body != null ? 200 : 503, body,
    error: error ?? null, fetchedAt: '2026-08-22T10:00:00Z',
    bytes: body ? Buffer.byteLength(body) : 0,
  })
}

function ruleFor(identity: string, over: Partial<CertifiableRule> = {}): CertifiableRule {
  const scope = {
    jurisdiction: 'prince_georges_md', codeSection: 'Sec. 27-4205',
    ruleType: 'dimensional.standards', scopeKey: { zone: 'RSF-65' }, effectiveVersion: '2022-04-01',
  }
  return {
    identity, scope, ruleKey: 'zoning.dimensional.RSF-65', version: 1,
    state: 'VERIFIED', value: '25',
    provenance: {
      jurisdiction: 'prince_georges_md', agency: 'M-NCPPC', sourceType: 'OFFICIAL_CODE',
      granularity: 'table', sourceTitle: 'PG Code', sourceUrl: 'https://example.gov/code',
      codeTitle: 'Subtitle 27', codeSection: 'Sec. 27-4205', table: 'Table 27-4205(b)',
      effectiveDate: '2022-04-01', retrievedAt: new Date().toISOString(),
      sourceHash: SOURCE_HASH, sourceVersion: '2022.1',
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

function certifiedRule(identity: string): CertifiableRule {
  return certifyRule({
    rule: ruleFor(identity), reviewer: PLANNER, currentSourceHash: SOURCE_HASH,
    note: 'Confirmed against Table 27-4205(b).',
  }).rule
}

async function sourceFor(rules: CertifiableRule[]): Promise<{ source: AuthoritativeSource; locators: RegionLocator[] }> {
  const locators: RegionLocator[] = [
    {
      regionId: 'sec-27-4205', label: 'Sec. 27-4205',
      ruleIdentities: rules.map(r => r.identity),
      extract: sectionWindow('sec. 27-4205', 200),
    },
  ]
  const { normalizeSourceContent } = await import('../rules/change-detection')
  const normalized = normalizeSourceContent(ORDINANCE)
  return {
    locators,
    source: {
      sourceId: 'pgc-27', jurisdiction: 'prince_georges_md', title: 'PG Code Subtitle 27',
      url: 'https://example.gov/code', documentId: null,
      documentHash: await hashSourceContent(ORDINANCE),
      version: '2022.1', retrievedAt: '2026-01-01T00:00:00Z',
      regions: [{
        regionId: 'sec-27-4205', label: 'Sec. 27-4205',
        hash: await hashSourceContent(sectionWindow('sec. 27-4205', 200)(normalized) as string, { stripHtml: false }),
        ruleIdentities: rules.map(r => r.identity),
      }],
      history: [],
    },
  }
}

// ── Export surface ──────────────────────────────────────────────────────────

describe('the package exposes the engine', () => {
  it('namespaces the large surfaces so nothing collides', () => {
    expect(typeof Engine.Survey.parseSurveyCsv).toBe('function')
    expect(typeof Engine.Rules.evaluateProjectRules).toBe('function')
    expect(typeof Engine.Rules.refreshSource).toBe('function')
    expect(typeof Engine.Persistence.persistIngestionCycle).toBe('function')
    expect(typeof Engine.SitePlanOrders.evaluateOrder).toBe('function')
  })

  it('still exports the Phase 1–2 site-plan surface flat', () => {
    expect(typeof Engine.createSiteTwin).toBe('function')
    expect(typeof Engine.calculateDisturbance).toBe('function')
    expect(typeof Engine.composeSheets).toBe('function')
  })
})

// ── Source refresh ──────────────────────────────────────────────────────────

describe('source refresh', () => {
  it('leaves certifications intact when the source is unchanged', async () => {
    const rules = [certifiedRule('id-1')]
    const { source, locators } = await sourceFor(rules)
    const out = await refreshSource({
      source, locators, rules, fetchOptions: { fetchImpl: stubFetch(ORDINANCE) },
    })
    expect(out.change?.changed).toBe(false)
    expect(out.downgraded).toHaveLength(0)
    expect(out.rules[0].state).toBe('CERTIFIED')
    expect(out.retained).toContain('id-1')
  })

  it('treats an unreachable portal as an outage, not an amendment', async () => {
    const rules = [certifiedRule('id-1')]
    const { source, locators } = await sourceFor(rules)
    const out = await refreshSource({
      source, locators, rules,
      fetchOptions: { fetchImpl: stubFetch(null, 'HTTP 503 from the county portal') },
    })
    expect(out.rules[0].state).toBe('CERTIFIED')
    expect(out.downgraded).toHaveLength(0)
    expect(out.maintenanceItems[0].code).toBe('SOURCE_UNAVAILABLE')
    expect(out.maintenanceItems[0].detail).toMatch(/an outage is not an amendment/i)
  })

  it('downgrades when the tracked section actually changes', async () => {
    const rules = [certifiedRule('id-1')]
    const { source, locators } = await sourceFor(rules)
    const amended = ORDINANCE.replace('25 ft', '30 ft')
    const out = await refreshSource({
      source, locators, rules, fetchOptions: { fetchImpl: stubFetch(amended) },
    })
    expect(out.change?.changed).toBe(true)
    expect(out.rules[0].state).toBe('PROVISIONAL')
    expect(out.rules[0].certification?.active).toBe(false)
    expect(out.downgraded).toHaveLength(1)
  })

  it('raises a maintenance item when a locator stops matching, and does not hash empty', async () => {
    const rules = [certifiedRule('id-1')]
    const { source } = await sourceFor(rules)
    const badLocator: RegionLocator[] = [{
      regionId: 'sec-27-4205', label: 'Sec. 27-4205',
      ruleIdentities: ['id-1'],
      extract: sectionWindow('sec. 99-9999', 200),   // renumbered away
    }]
    const out = await refreshSource({
      source, locators: badLocator, rules, fetchOptions: { fetchImpl: stubFetch(ORDINANCE) },
    })
    expect(out.unlocatableRegions).toContain('Sec. 27-4205')
    expect(out.maintenanceItems.some(m => m.code === 'REGION_LOCATOR_FAILED')).toBe(true)
    expect(out.maintenanceItems.find(m => m.code === 'REGION_LOCATOR_FAILED')!.detail)
      .toMatch(/would read as "unchanged forever"/i)
    // The rule is reconsidered rather than trusted.
    expect(out.rules[0].state).toBe('PROVISIONAL')
  })

  it('records a source with no URL rather than silently skipping it', async () => {
    const rules = [certifiedRule('id-1')]
    const { source, locators } = await sourceFor(rules)
    const out = await refreshSource({ source: { ...source, url: null }, locators, rules })
    expect(out.maintenanceItems[0].code).toBe('SOURCE_NOT_FETCHABLE')
    expect(out.rules[0].state).toBe('CERTIFIED')
  })

  it('isolates a failure in one source from the others', async () => {
    const rules = [certifiedRule('id-1')]
    const { source, locators } = await sourceFor(rules)
    const results = await refreshAll([
      { source, locators, rules, fetchOptions: { fetchImpl: stubFetch(null, 'boom') } },
      { source: { ...source, sourceId: 'other' }, locators, rules, fetchOptions: { fetchImpl: stubFetch(ORDINANCE) } },
    ])
    expect(results).toHaveLength(2)
    expect(results[0].maintenanceItems[0].code).toBe('SOURCE_UNAVAILABLE')
    expect(results[1].change?.changed).toBe(false)
  })
})

// ── Order boundary ──────────────────────────────────────────────────────────

describe('order → project context', () => {
  it('reports what the intake never asked instead of defaulting it', () => {
    const { context, unknownFields } = buildProjectContext(
      { address: '4500 Rhode Island Ave', zone: 'RSF-65' }, 'prince_georges_md',
    )
    expect(context.zone).toBe('RSF-65')
    // The dangerous one: never guessed.
    expect(context.lotType).toBeUndefined()
    expect(unknownFields).toContain('lotType')
    expect(unknownFields).toContain('overlays')
  })

  it('distinguishes "no overlays" from "never asked"', () => {
    const asked = buildProjectContext({ overlays: [] }, 'prince_georges_md')
    expect(asked.context.overlays).toEqual([])
    expect(asked.unknownFields).not.toContain('overlays')

    const notAsked = buildProjectContext({}, 'prince_georges_md')
    expect(notAsked.context.overlays).toBeUndefined()
    expect(notAsked.unknownFields).toContain('overlays')
  })

  it('maps a corner-lot flag without inventing one', () => {
    expect(buildProjectContext({ cornerLot: true }, 'j').context.lotType).toBe('corner')
    expect(buildProjectContext({ cornerLot: false }, 'j').context.lotType).toBe('interior')
    expect(buildProjectContext({}, 'j').context.lotType).toBeUndefined()
  })

  it('keeps an unrecognised value rather than dropping it', () => {
    const { context, unmappedValues } = buildProjectContext({ lotType: 'pie-shaped' }, 'j')
    expect(context.lotType).toBeUndefined()
    expect(unmappedValues).toEqual([{ field: 'lotType', value: 'pie-shaped' }])
  })

  it('parses numbers out of the strings an intake form actually submits', () => {
    const { context } = buildProjectContext(
      { lot_size: '6,500', lotWidthFt: '65', proposedHeightFt: 28 }, 'j',
    )
    expect(context.lotAreaSqFt).toBe(6500)
    expect(context.lotWidthFt).toBe(65)
    expect(context.proposedHeightFt).toBe(28)
  })
})

describe('order evaluation', () => {
  const formData: OrderFormData = {
    address: '4500 Rhode Island Ave, Brentwood, MD',
    zone: 'RSF-65', overlays: [], environmentalOverlays: [], historicOverlays: [],
    use: 'single_family_detached', cornerLot: false, lot_size: '6500',
    lotWidthFt: 65, subdivisionStatus: 'not_required', applicationDate: '2026-08-22',
  }

  function packFor(rules: CertifiableRule[]) {
    return buildRulePack({
      jurisdiction: 'prince_georges_md', packVersion: '2022.1', effectiveDate: '2022-04-01',
      rules, coreRuleKeys: rules.map(r => r.ruleKey), sources: [],
      lastRefreshedAt: new Date().toISOString(),
    })
  }

  it('applies a certified rule with no human review and states the requirement', () => {
    const rules = [certifiedRule('id-1')]
    const report = evaluateOrder({
      orderId: 'ord-1', formData, jurisdictionCode: 'prince_georges_md',
      rules, pack: packFor(rules), currentSourceHashes: { 'id-1': SOURCE_HASH },
    })
    expect(report.coverage).toBe('automated')
    expect(report.reviewItems).toHaveLength(0)
    expect(report.determinedRequirements[0].value).toBe('25')
    expect(report.determinedRequirements[0].codeSection).toBe('Sec. 27-4205')
    expect(report.regulatorilyResolved).toBe(true)
    expect(canProceedToProfessionalReview(report).ok).toBe(true)
  })

  it('never tells a customer the county approved anything', () => {
    const rules = [certifiedRule('id-1')]
    const report = evaluateOrder({
      orderId: 'ord-1', formData, jurisdictionCode: 'prince_georges_md',
      rules, pack: packFor(rules), currentSourceHashes: { 'id-1': SOURCE_HASH },
    })
    expect(report.customerSummary).toMatch(/County approval is a separate step/i)
    expect(report.customerSummary).toMatch(/preliminary/i)
  })

  it('drops to data-assisted and blocks review when a rule is uncertified', () => {
    const rules = [ruleFor('id-1', { state: 'PROVISIONAL' })]
    const report = evaluateOrder({
      orderId: 'ord-2', formData, jurisdictionCode: 'prince_georges_md',
      rules, pack: packFor(rules), currentSourceHashes: { 'id-1': SOURCE_HASH },
    })
    expect(report.coverage).toBe('data-assisted')
    expect(report.reviewItems.length).toBeGreaterThan(0)
    expect(report.regulatorilyResolved).toBe(false)
    const gate = canProceedToProfessionalReview(report)
    expect(gate.ok).toBe(false)
    expect(gate.blockers.length).toBeGreaterThan(0)
  })

  it('routes an unsupported jurisdiction to manual review without pretending', () => {
    const report = evaluateOrder({
      orderId: 'ord-3', formData: { ...formData, zone: 'R-60' },
      jurisdictionCode: 'montgomery_md', rules: [], pack: null, currentSourceHashes: {},
    })
    expect(report.coverage).toBe('manual-review')
    expect(report.evaluation).toBeNull()
    expect(report.determinedRequirements).toHaveLength(0)
    expect(report.customerSummary).toMatch(/prepare the zoning analysis by hand/i)
    expect(canProceedToProfessionalReview(report).ok).toBe(false)
    expect(SUPPORTED_JURISDICTIONS).not.toContain('montgomery_md')
  })

  it('surfaces the unanswered intake fields that caused a review item', () => {
    const rules = [certifiedRule('id-1')]
    const report = evaluateOrder({
      orderId: 'ord-4',
      formData: { zone: 'RSF-65' },  // almost nothing established
      jurisdictionCode: 'prince_georges_md',
      rules, pack: packFor(rules), currentSourceHashes: { 'id-1': SOURCE_HASH },
    })
    expect(report.unknownFields).toContain('lotType')
    expect(report.opsSummary).toMatch(/Intake did not establish/i)
  })

  it('shows when a footnote overrode the base table value', () => {
    const withFootnote = certifyRule({
      rule: ruleFor('id-1', {
        applicability: {
          condition: { kind: 'equals', field: 'zone', value: 'RSF-65' },
          footnotes: [{
            id: 'fn-4', marker: '(4)', text: 'Corner lots: 15 feet.',
            effect: 'replaces_value', value: '15',
            condition: { kind: 'equals', field: 'lotType', value: 'corner' },
            mandatory: true,
          }],
        },
      }),
      reviewer: PLANNER, currentSourceHash: SOURCE_HASH, note: 'ok',
    }).rule

    const report = evaluateOrder({
      orderId: 'ord-5', formData: { ...formData, cornerLot: true },
      jurisdictionCode: 'prince_georges_md',
      rules: [withFootnote], pack: packFor([withFootnote]),
      currentSourceHashes: { 'id-1': SOURCE_HASH },
    })
    expect(report.determinedRequirements[0].value).toBe('15')
    expect(report.determinedRequirements[0].basis).toMatch(/modified by an applicable footnote/i)
    expect(report.determinedRequirements[0].basis).toMatch(/base table value was 25/i)
  })

  it('a stale source hash sends the order back to review rather than applying it', () => {
    const rules = [certifiedRule('id-1')]
    const report = evaluateOrder({
      orderId: 'ord-6', formData, jurisdictionCode: 'prince_georges_md',
      rules, pack: packFor(rules), currentSourceHashes: { 'id-1': 'b'.repeat(64) },
    })
    expect(report.coverage).toBe('data-assisted')
    expect(report.reviewItems.length).toBeGreaterThan(0)
  })

  it('runs against the real PG rule set without touching the network', () => {
    const pgRules = buildPgCertifiableRules()
    const pack = buildRulePack({
      jurisdiction: 'prince_georges_md', packVersion: '2022.1', effectiveDate: '2022-04-01',
      rules: pgRules, coreRuleKeys: [], sources: [], lastRefreshedAt: new Date().toISOString(),
    })
    const report = evaluateOrder({
      orderId: 'ord-7', formData, jurisdictionCode: 'prince_georges_md',
      rules: pgRules, pack, currentSourceHashes: {},
    })
    expect(report.evaluation).not.toBeNull()
    expect(report.evaluation!.evaluations).toHaveLength(51)
    // Nothing is certified yet, so nothing is applied unattended.
    expect(report.determinedRequirements).toHaveLength(0)
    expect(report.regulatorilyResolved).toBe(false)
  })
})
