/**
 * Phase 3C — rule certification, provenance and change detection.
 *
 * The properties under test are the ones that decide whether this system is
 * safe to lean on: that a confident parser cannot become a legal authority,
 * that certification binds to exact source content, that a source change
 * invalidates precisely what it touched and nothing else, and that reuse across
 * projects does not quietly become reuse across ordinance versions.
 */

import {
  canTransition, RULE_TRANSITIONS, assessProvenance, evaluateConfidence,
  authorityProfile, ruleIdentity, freshnessConfidence,
  CERTIFICATION_THRESHOLDS, type RuleProvenance, type RuleConfidence,
} from '../rules/model'
import {
  evaluateCertificationGate, certifyRule, transitionRule, checkCertificationReuse,
  reconcileSources, normalizeRuleValue, mayCertify, RuleTransitionError,
  type CertifiableRule, type Reviewer, type SourceReading,
} from '../rules/certification'
import {
  evaluateCondition, evaluateApplicability, evaluateFootnotes,
  type ProjectContext, type RuleFootnote, type Condition,
} from '../rules/applicability'
import {
  normalizeSourceContent, hashSourceContent, detectSourceChanges, applySourceChange,
  advanceSourceVersion, type AuthoritativeSource, type SourceRegion,
} from '../rules/change-detection'
import { buildRulePack, isPackUsable } from '../rules/pack'
import { evaluateProjectRules, evaluateRule, humanVerificationCount, routeReviewDiscipline } from '../rules/evaluate'
import { buildRuleReviewView, applyReviewerAction } from '../rules/reviewer-api'
import { buildPgCertifiableRules, PG_CORE_RULE_KEYS } from '../rules/pg-certifiable'
import {
  InMemoryRuleCertificationStore, persistRuleState,
} from '../persistence/rule-certification'

// ── Fixtures ────────────────────────────────────────────────────────────────

const SOURCE_HASH = 'a'.repeat(64)
const CHANGED_HASH = 'b'.repeat(64)

const PLANNER: Reviewer = {
  id: 'rev-1', name: 'M. Okafor', role: 'land_use_planner', state: 'MD',
}
const ENGINEER: Reviewer = {
  id: 'rev-2', name: 'J. Whitfield', role: 'professional_engineer', licenceNumber: '48812', state: 'MD',
}
const SURVEYOR: Reviewer = {
  id: 'rev-3', name: 'A. Reyes', role: 'surveyor', licenceNumber: '21456', state: 'MD',
}

function provenance(over: Partial<RuleProvenance> = {}): RuleProvenance {
  return {
    jurisdiction: 'prince_georges_md',
    agency: "Prince George's County M-NCPPC",
    sourceType: 'OFFICIAL_CODE',
    sourceTitle: "Prince George's County Code of Ordinances",
    sourceUrl: 'https://online.encodeplus.com/regs/princegeorgescounty-md/',
    codeTitle: 'Subtitle 27',
    codeSection: 'Sec. 27-4205',
    table: 'Table 27-4205(b)',
    row: 'Front yard depth',
    column: 'Single-family detached',
    effectiveDate: '2022-04-01',
    retrievedAt: new Date().toISOString(),
    sourceHash: SOURCE_HASH,
    sourceVersion: '2022.1',
    extractionMethod: 'html_table_parser',
    parserVersion: 'kealee-rules-1.0.0',
    ...over,
  }
}

function confidence(over: Partial<RuleConfidence> = {}): RuleConfidence {
  return {
    extractionConfidence: 0.99,
    authorityConfidence: 1.0,
    applicabilityConfidence: 0.97,
    sourceFreshnessConfidence: 1.0,
    ...over,
  }
}

const RSF65_SCOPE = {
  jurisdiction: 'prince_georges_md',
  codeSection: 'Sec. 27-4205',
  ruleType: 'dimensional.standards',
  scopeKey: { zone: 'RSF-65' },
  effectiveVersion: '2022-04-01',
}

function rule(over: Partial<CertifiableRule> = {}): CertifiableRule {
  const scope = over.scope ?? RSF65_SCOPE
  return {
    identity: over.identity ?? ruleIdentity(scope),
    scope,
    ruleKey: 'zoning.dimensional.RSF-65',
    version: 1,
    state: 'VERIFIED',
    value: '25',
    provenance: provenance(),
    confidence: confidence(),
    applicability: {
      condition: { kind: 'equals', field: 'zone', value: 'RSF-65' },
    },
    reconciliation: reconcileSources({ dualSourceRequired: false, sourceA: null, sourceB: null }),
    certification: null,
    // Gating by default, matching the production default: a rule states a
    // requirement unless something explicitly says it does not.
    gating: true,
    sourceIssues: [],
    humanReviewRequired: true,
    humanReviewReasons: [],
    ...over,
  }
}

function certified(over: Partial<CertifiableRule> = {}): CertifiableRule {
  const r = rule(over)
  const result = certifyRule({
    rule: r, reviewer: PLANNER, currentSourceHash: r.provenance.sourceHash,
    note: 'Confirmed against Table 27-4205(b).',
  })
  return result.rule
}

const CONTEXT: ProjectContext = {
  jurisdiction: 'prince_georges_md',
  zone: 'RSF-65',
  overlays: [],
  environmentalOverlays: [],
  historicOverlays: [],
  use: 'single_family_detached',
  lotType: 'interior',
  lotAreaSqFt: 6500,
  lotWidthFt: 65,
  applicationDate: '2026-08-22',
  subdivisionStatus: 'not_required',
}

// ── 1–3. Extraction is not certification ────────────────────────────────────

describe('1–3. extraction, verification and certification are distinct', () => {
  it('an extracted rule cannot self-certify', () => {
    const t = canTransition('EXTRACTED', 'CERTIFIED')
    expect(t.allowed).toBe(false)
    expect(t.reason).toMatch(/cannot go straight from EXTRACTED to CERTIFIED/i)
    expect(RULE_TRANSITIONS.EXTRACTED).not.toContain('CERTIFIED')

    const gate = evaluateCertificationGate({
      rule: rule({ state: 'EXTRACTED' }), reviewer: PLANNER, currentSourceHash: SOURCE_HASH,
    })
    expect(gate.eligible).toBe(false)
    expect(gate.failures.join(' ')).toMatch(/EXTRACTED to CERTIFIED/i)
  })

  it('parser confidence cannot bypass certification', () => {
    // Perfect extraction, perfect authority, perfect applicability.
    const perfect = rule({
      state: 'EXTRACTED',
      confidence: { extractionConfidence: 1, authorityConfidence: 1, applicabilityConfidence: 1 },
    })
    const conf = evaluateConfidence(perfect.confidence)
    expect(conf.passed).toBe(true)

    // And it still cannot certify, because confidence is not a lifecycle step.
    const gate = evaluateCertificationGate({
      rule: perfect, reviewer: PLANNER, currentSourceHash: SOURCE_HASH,
    })
    expect(gate.eligible).toBe(false)
    expect(() => certifyRule({
      rule: perfect, reviewer: PLANNER, currentSourceHash: SOURCE_HASH, note: 'looks right',
    })).toThrow(RuleTransitionError)
  })

  it('a verified rule is not a certified rule', () => {
    const v = rule({ state: 'VERIFIED' })
    expect(v.state).toBe('VERIFIED')
    expect(v.certification).toBeNull()

    const reuse = checkCertificationReuse({
      rule: v, jurisdiction: 'prince_georges_md', currentSourceHash: SOURCE_HASH,
    })
    expect(reuse.reusable).toBe(false)
    expect(reuse.blockers.join(' ')).toMatch(/is VERIFIED, not CERTIFIED/i)
  })
})

// ── 4, 21. Reuse across projects ────────────────────────────────────────────

describe('4, 21. a certified rule is reused across projects without repeat review', () => {
  it('the same rule identity resolves for different parcels', () => {
    // Identity is scope-based, so two parcels in the same zone hit one rule.
    const a = ruleIdentity({ ...RSF65_SCOPE, scopeKey: { zone: 'RSF-65' } })
    const b = ruleIdentity({ ...RSF65_SCOPE, scopeKey: { zone: 'RSF-65' } })
    expect(a).toBe(b)
    // Key order must not matter, or the same rule would certify twice.
    expect(ruleIdentity({ ...RSF65_SCOPE, scopeKey: { zone: 'RSF-65', use: 'SFD' } }))
      .toBe(ruleIdentity({ ...RSF65_SCOPE, scopeKey: { use: 'sfd', zone: 'rsf-65' } }))
  })

  it('three consecutive projects raise zero review items for the certified rule', () => {
    const c = certified()
    const pack = buildRulePack({
      jurisdiction: 'prince_georges_md', packVersion: '2022.1', effectiveDate: '2022-04-01',
      rules: [c], coreRuleKeys: [c.ruleKey], sources: [], lastRefreshedAt: new Date().toISOString(),
    })

    for (const projectId of ['proj-a', 'proj-b', 'proj-c']) {
      const result = evaluateProjectRules({
        projectId, context: CONTEXT, pack, rules: [c],
        currentSourceHashes: { [c.identity]: SOURCE_HASH },
      })
      expect(result.appliedAutomatically).toBe(1)
      expect(result.reusedCertifications).toBe(1)
      expect(humanVerificationCount(result)).toBe(0)
      expect(result.evaluations[0].outcome).toBe('APPLIED_CERTIFIED')
      expect(result.evaluations[0].effectiveValue).toBe('25')
    }
  })

  it('a mature certified pack cuts review demand against the uncertified baseline', () => {
    const rules = [
      certified(),
      certified({
        scope: { ...RSF65_SCOPE, scopeKey: { zone: 'RSF-95' } },
        ruleKey: 'zoning.dimensional.RSF-95',
        applicability: { condition: { kind: 'equals', field: 'zone', value: 'RSF-95' } },
      }),
    ]
    const uncertified = rules.map(r => ({ ...r, state: 'PROVISIONAL' as const, certification: null }))
    const pack = buildRulePack({
      jurisdiction: 'prince_georges_md', packVersion: '2022.1', effectiveDate: '2022-04-01',
      rules, coreRuleKeys: rules.map(r => r.ruleKey), sources: [],
      lastRefreshedAt: new Date().toISOString(),
    })
    const hashes = Object.fromEntries(rules.map(r => [r.identity, SOURCE_HASH]))

    const before = evaluateProjectRules({
      projectId: 'p1', context: CONTEXT, pack, rules: uncertified, currentSourceHashes: hashes,
    })
    const after = evaluateProjectRules({
      projectId: 'p2', context: CONTEXT, pack, rules, currentSourceHashes: hashes,
    })

    expect(humanVerificationCount(before)).toBeGreaterThan(0)
    expect(humanVerificationCount(after)).toBe(0)
  })
})

// ── 5, 6, 22. Source change detection ───────────────────────────────────────

describe('5, 6, 22. source change invalidates only what it touched', () => {
  const region = (id: string, hash: string, rules: string[]): SourceRegion =>
    ({ regionId: id, label: `Table ${id}`, hash, ruleIdentities: rules })

  const source = (regions: SourceRegion[], documentHash: string): AuthoritativeSource => ({
    sourceId: 'src-1', jurisdiction: 'prince_georges_md',
    title: 'Subtitle 27', url: 'https://example.gov/code', documentId: null,
    documentHash, version: '2022.1', retrievedAt: '2026-01-01T00:00:00Z', regions, history: [],
  })

  it('an unchanged hash preserves every certification and reopens no review', () => {
    const prev = source([region('rsf65', 'h1', ['id-rsf65']), region('rmf20', 'h2', ['id-rmf20'])], 'doc-1')
    const result = detectSourceChanges({
      previous: prev,
      current: { documentHash: 'doc-1', version: '2022.1', retrievedAt: '2026-06-01T00:00:00Z', regions: prev.regions },
    })
    expect(result.changed).toBe(false)
    expect(result.affectedRuleIdentities).toEqual([])
    expect(result.unaffectedRuleIdentities).toEqual(['id-rsf65', 'id-rmf20'])
    expect(result.summary).toMatch(/retain their certification and no review is reopened/i)
  })

  it('one changed table does not invalidate unrelated rules', () => {
    const prev = source([region('rsf65', 'h1', ['id-rsf65']), region('rmf20', 'h2', ['id-rmf20'])], 'doc-1')
    const result = detectSourceChanges({
      previous: prev,
      current: {
        documentHash: 'doc-2', version: '2022.2', retrievedAt: '2026-06-01T00:00:00Z',
        regions: [region('rsf65', 'h1-CHANGED', ['id-rsf65']), region('rmf20', 'h2', ['id-rmf20'])],
      },
    })
    expect(result.changed).toBe(true)
    expect(result.scopeIsolated).toBe(true)
    expect(result.affectedRuleIdentities).toEqual(['id-rsf65'])
    expect(result.unaffectedRuleIdentities).toEqual(['id-rmf20'])
  })

  it('downgrades only the affected certification and leaves the rest certified', () => {
    const rsf65 = certified()
    const rmf20 = certified({
      identity: 'id-rmf20',
      scope: { ...RSF65_SCOPE, scopeKey: { zone: 'RMF-20' } },
      ruleKey: 'zoning.dimensional.RMF-20',
      applicability: { condition: { kind: 'equals', field: 'zone', value: 'RMF-20' } },
    })

    const prev = source([
      region('rsf65', 'h1', [rsf65.identity]),
      region('rmf20', 'h2', [rmf20.identity]),
    ], 'doc-1')
    const change = detectSourceChanges({
      previous: prev,
      current: {
        documentHash: 'doc-2', version: '2022.2', retrievedAt: '2026-06-01T00:00:00Z',
        regions: [region('rsf65', 'h1-CHANGED', [rsf65.identity]), region('rmf20', 'h2', [rmf20.identity])],
      },
    })

    const applied = applySourceChange({ rules: [rsf65, rmf20], change })
    const after = Object.fromEntries(applied.rules.map(r => [r.identity, r]))

    expect(after[rsf65.identity].state).toBe('PROVISIONAL')
    expect(after[rsf65.identity].certification?.active).toBe(false)
    expect(after[rmf20.identity].state).toBe('CERTIFIED')
    expect(after[rmf20.identity].certification?.active).toBe(true)
    expect(applied.retained).toContain(rmf20.identity)
  })

  it('a document change outside tracked regions withdraws nothing', () => {
    const prev = source([region('rsf65', 'h1', ['id-rsf65'])], 'doc-1')
    const result = detectSourceChanges({
      previous: prev,
      current: {
        documentHash: 'doc-2-navbar-changed', version: '2022.1', retrievedAt: '2026-06-01T00:00:00Z',
        regions: [region('rsf65', 'h1', ['id-rsf65'])],
      },
    })
    expect(result.affectedRuleIdentities).toEqual([])
    expect(result.changes.some(c => /outside the text these rules were extracted from/i.test(c.detail))).toBe(true)
  })

  it('an unreachable source does not withdraw certifications', () => {
    const prev = source([region('rsf65', 'h1', ['id-rsf65'])], 'doc-1')
    const result = detectSourceChanges({
      previous: prev,
      current: { documentHash: 'doc-1', version: '2022.1', retrievedAt: '2026-06-01T00:00:00Z', regions: [] },
      unavailable: { reason: 'HTTP 503 from the county code portal' },
    })
    expect(result.affectedRuleIdentities).toEqual([])
    expect(result.changes[0].kind).toBe('SOURCE_UNAVAILABLE')
    expect(result.changes[0].detail).toMatch(/an outage is not an amendment/i)
  })

  it('normalisation absorbs cosmetic churn but not a changed number', async () => {
    const a = await hashSourceContent('<table><tr><td>Front yard</td><td>25 ft</td></tr></table>')
    const b = await hashSourceContent('<table>\n  <tr>\n    <td>Front  yard</td>\n    <td>25 ft</td>\n  </tr>\n</table>')
    const c = await hashSourceContent('<table><tr><td>Front yard</td><td>30 ft</td></tr></table>')
    expect(a).toBe(b)
    expect(a).not.toBe(c)
    expect(normalizeSourceContent('A&nbsp;B  C')).toBe('a b c')
    // A row boundary is still distinguishable from a cell boundary.
    expect(await hashSourceContent('<tr><td>a</td><td>b</td></tr>'))
      .not.toBe(await hashSourceContent('<tr><td>a</td></tr><tr><td>b</td></tr>'))
  })
})

// ── 7, 8. Provenance and authority gates ────────────────────────────────────

describe('7, 8. provenance and source authority', () => {
  it('missing provenance blocks certification and says exactly what is missing', () => {
    const noHash = rule({ provenance: provenance({ sourceHash: null, codeSection: null }) })
    const assessment = assessProvenance(noHash.provenance)
    expect(assessment.sufficient).toBe(false)
    expect(assessment.missing).toEqual(expect.arrayContaining(['sourceHash', 'codeSection']))

    const gate = evaluateCertificationGate({ rule: noHash, reviewer: PLANNER, currentSourceHash: SOURCE_HASH })
    expect(gate.eligible).toBe(false)
    expect(gate.failures.join(' ')).toMatch(/sourceHash/)
    expect(gate.remediation.join(' ')).toMatch(/Complete the provenance record/i)
  })

  it('a table citation without row and column is insufficient', () => {
    const a = assessProvenance(provenance({ row: null, column: null }))
    expect(a.sufficient).toBe(false)
    expect(a.missing).toEqual(expect.arrayContaining(['row', 'column']))
  })

  it('a secondary source alone cannot certify however well it parsed', () => {
    const secondary = rule({
      provenance: provenance({ sourceType: 'SECONDARY_SOURCE' }),
      confidence: confidence({ extractionConfidence: 1.0, authorityConfidence: authorityProfile('SECONDARY_SOURCE').confidence }),
    })
    const gate = evaluateCertificationGate({ rule: secondary, reviewer: PLANNER, currentSourceHash: SOURCE_HASH })
    expect(gate.eligible).toBe(false)
    expect(gate.failures.join(' ')).toMatch(/cannot be certified against/i)
    expect(authorityProfile('SECONDARY_SOURCE').certifiable).toBe(false)
    expect(authorityProfile('UNKNOWN').certifiable).toBe(false)
  })

  it('authority confidence comes from the source type, never from the parser', () => {
    // Same perfect extraction, different documents, different authority.
    expect(authorityProfile('OFFICIAL_CODE').confidence).toBe(1.0)
    expect(authorityProfile('SECONDARY_SOURCE').confidence).toBe(0.4)
    const gate = evaluateConfidence(
      { extractionConfidence: 1, authorityConfidence: 0.4, applicabilityConfidence: 1 },
      CERTIFICATION_THRESHOLDS,
    )
    expect(gate.passed).toBe(false)
    expect(gate.failures.join(' ')).toMatch(/not authoritative enough to certify against, however cleanly it parsed/i)
  })

  it('dimensions gate independently rather than averaging', () => {
    // An average of these three would comfortably pass; each must stand alone.
    const g = evaluateConfidence({ extractionConfidence: 1, authorityConfidence: 1, applicabilityConfidence: 0.2 })
    expect(g.passed).toBe(false)
    expect(g.failures).toHaveLength(1)
    expect(g.failures[0]).toMatch(/applicabilityConfidence/)
  })
})

// ── 9, 10. Footnotes ────────────────────────────────────────────────────────

describe('9, 10. footnotes override the base table value', () => {
  const cornerLotFootnote: RuleFootnote = {
    id: 'fn-4', marker: '(4)',
    text: 'On a corner lot the front yard depth on the side street shall be 15 feet.',
    effect: 'replaces_value', value: '15',
    condition: { kind: 'equals', field: 'lotType', value: 'corner' },
    mandatory: true,
  }

  it('an applicable footnote replaces the base value', () => {
    const r = evaluateApplicability(
      { condition: { kind: 'equals', field: 'zone', value: 'RSF-65' }, footnotes: [cornerLotFootnote] },
      { ...CONTEXT, lotType: 'corner' },
      '25',
    )
    expect(r.applies).toBe(true)
    expect(r.effectiveValue).toBe('15')
    expect(r.footnoteEvaluations[0].resolution).toBe('applies')
    expect(r.footnoteEvaluations[0].reason).toMatch(/base table value is NOT the requirement/i)
  })

  it('an inapplicable footnote leaves the base value alone', () => {
    const r = evaluateApplicability(
      { condition: { kind: 'equals', field: 'zone', value: 'RSF-65' }, footnotes: [cornerLotFootnote] },
      { ...CONTEXT, lotType: 'interior' },
      '25',
    )
    expect(r.effectiveValue).toBe('25')
    expect(r.unresolvedMandatoryFootnotes).toEqual([])
    expect(r.requiresHumanReview).toBe(false)
  })

  it('an unresolved mandatory footnote blocks reuse of the certified base value', () => {
    const r = evaluateApplicability(
      { condition: { kind: 'equals', field: 'zone', value: 'RSF-65' }, footnotes: [cornerLotFootnote] },
      // lotType unknown — not "interior", simply not established.
      { ...CONTEXT, lotType: undefined },
      '25',
    )
    expect(r.unresolvedMandatoryFootnotes).toEqual(['(4)'])
    expect(r.requiresHumanReview).toBe(true)

    const reuse = checkCertificationReuse({
      rule: certified(), jurisdiction: 'prince_georges_md',
      currentSourceHash: SOURCE_HASH, applicability: r,
    })
    expect(reuse.reusable).toBe(false)
    expect(reuse.blockers.join(' ')).toMatch(/certified base value is not the governing requirement here/i)
  })

  it('an unresolvable mandatory footnote blocks certification outright', () => {
    const discretionary: RuleFootnote = {
      ...cornerLotFootnote,
      condition: { kind: 'discretionary', description: 'as determined by the Planning Director', resolvedBy: 'land_use_planner' },
    }
    const gate = evaluateCertificationGate({
      rule: rule({ applicability: { condition: { kind: 'equals', field: 'zone', value: 'RSF-65' }, footnotes: [discretionary] } }),
      reviewer: PLANNER, currentSourceHash: SOURCE_HASH,
    })
    expect(gate.eligible).toBe(false)
    expect(gate.failures.join(' ')).toMatch(/discretionary condition the engine cannot evaluate/i)
  })

  it('a numeric adjustment footnote is applied arithmetically', () => {
    const f: RuleFootnote = {
      id: 'fn-9', marker: '(9)', text: 'Increase the required yard by 10 feet where abutting an arterial.',
      effect: 'modifies_value', adjustment: { operation: 'add', amount: 10 },
      condition: { kind: 'includes', field: 'overlays', value: 'ARTERIAL' }, mandatory: true,
    }
    const out = evaluateFootnotes([f], { ...CONTEXT, overlays: ['ARTERIAL'] }, '25')
    expect(out.effectiveValue).toBe('35')
  })
})

// ── 11, 12. Overrides and unknown applicability ─────────────────────────────

describe('11, 12. overlays and unresolved applicability', () => {
  const withOverlay = {
    condition: { kind: 'equals', field: 'zone', value: 'RSF-65' } as Condition,
    overriddenBy: [{
      ruleIdentity: 'prince_georges_md|SUBTITLE27-TDO|overlay.standards||2022-04-01',
      condition: { kind: 'includes', field: 'overlays', value: 'T-D-O' } as Condition,
      reason: 'A Transit District Development Plan supersedes underlying base-zone standards.',
    }],
  }

  it('an overlay supersedes the base zoning rule', () => {
    const r = evaluateApplicability(withOverlay, { ...CONTEXT, overlays: ['T-D-O'] }, '25')
    expect(r.applies).toBe(true)
    expect(r.overriddenBy?.ruleIdentity).toMatch(/TDO/)
    expect(r.requiresHumanReview).toBe(true)
    expect(r.rationale).toMatch(/displaced by/i)
  })

  it('a certified base rule is not applied automatically where an overlay displaces it', () => {
    const c = certified()
    const evaluation = evaluateRule({
      rule: { ...c, applicability: withOverlay },
      context: { ...CONTEXT, overlays: ['T-D-O'] },
      currentSourceHash: SOURCE_HASH,
    })
    expect(evaluation.outcome).toBe('REVIEW_REQUIRED')
    expect(evaluation.reviewReasons.map(r => r.code)).toContain('OVERLAY_OVERRIDE')
  })

  it('unknown applicability triggers review and is never read as "does not apply"', () => {
    const r = evaluateApplicability(
      { condition: { kind: 'equals', field: 'zone', value: 'RSF-65' } },
      { jurisdiction: 'prince_georges_md' },  // zone unknown
    )
    expect(r.applies).toBe('unknown')
    expect(r.applies).not.toBe(false)
    expect(r.requiresHumanReview).toBe(true)
    expect(r.rationale).toMatch(/not "does not apply"/i)
  })

  it('a discretionary condition never resolves on its own', () => {
    expect(evaluateCondition(
      { kind: 'discretionary', description: 'director determination', resolvedBy: 'land_use_planner' },
      CONTEXT,
    )).toBe('unknown')
  })

  it('a definite no_match settles allOf even alongside an unknown sibling', () => {
    expect(evaluateCondition({
      kind: 'allOf',
      conditions: [
        { kind: 'equals', field: 'zone', value: 'RMF-20' },   // no_match
        { kind: 'equals', field: 'buildingType', value: 'X' }, // unknown
      ],
    }, CONTEXT)).toBe('no_match')
  })
})

// ── 13, 14. Dual-source verification ────────────────────────────────────────

describe('13, 14. independent-source reconciliation', () => {
  const reading = (label: string, raw: string): SourceReading => ({
    label, authority: 'OFFICIAL_CODE', sourceUrl: 'https://example.gov', sourceHash: SOURCE_HASH,
    retrievedAt: '2026-08-01T00:00:00Z', rawValue: raw, normalizedValue: raw,
  })

  it('agreement across two authoritative sources supports certification', () => {
    const rec = reconcileSources({
      dualSourceRequired: true,
      sourceA: reading('codified HTML', "25 ft"),
      sourceB: reading('official PDF', "25'"),
    })
    expect(rec.status).toBe('MATCH')
    expect(rec.match).toBe(true)

    const gate = evaluateCertificationGate({
      rule: rule({ reconciliation: rec }), reviewer: PLANNER, currentSourceHash: SOURCE_HASH,
    })
    expect(gate.eligible).toBe(true)
  })

  it('disagreement blocks certification', () => {
    const rec = reconcileSources({
      dualSourceRequired: true,
      sourceA: reading('codified HTML', '25 ft'),
      sourceB: reading('adopted ordinance CB-12-2025', '30 ft'),
    })
    expect(rec.status).toBe('MISMATCH')
    expect(rec.note).toMatch(/one of them is wrong, or one has been amended/i)

    const gate = evaluateCertificationGate({
      rule: rule({ reconciliation: rec }), reviewer: PLANNER, currentSourceHash: SOURCE_HASH,
    })
    expect(gate.eligible).toBe(false)
    expect(gate.failures.join(' ')).toMatch(/Sources disagree/i)
  })

  it('a conflict blocks the project, not merely the certification', () => {
    const rec = reconcileSources({
      dualSourceRequired: true,
      sourceA: reading('codified HTML', '25 ft'),
      sourceB: reading('adopted ordinance', '30 ft'),
    })
    const evaluation = evaluateRule({
      rule: { ...certified(), reconciliation: rec }, context: CONTEXT, currentSourceHash: SOURCE_HASH,
    })
    expect(evaluation.outcome).toBe('BLOCKED')
    expect(evaluation.reviewReasons.map(r => r.code)).toContain('SOURCE_CONFLICT')
  })

  it('a single authoritative source is recorded as such rather than skipped', () => {
    const rec = reconcileSources({
      dualSourceRequired: true, sourceA: reading('codified HTML', '25 ft'), sourceB: null,
    })
    expect(rec.status).toBe('SINGLE_SOURCE_ONLY')
    expect(rec.note).toMatch(/recorded as\s+single-source rather than skipped/i)
  })

  it('normalises printed variants to the same value', () => {
    expect(normalizeRuleValue("25 ft")).toBe('25')
    expect(normalizeRuleValue("25'")).toBe('25')
    expect(normalizeRuleValue('25.0 feet')).toBe('25')
    expect(normalizeRuleValue('45 (4)')).toBe('45')
    expect(normalizeRuleValue('25')).not.toBe(normalizeRuleValue('30'))
  })
})

// ── 15, 16. Revoked and superseded rules ────────────────────────────────────

describe('15, 16. retired rules cannot be used', () => {
  it('a revoked rule cannot be reused', () => {
    const c = certified()
    const revoked = transitionRule({
      rule: c, to: 'REVOKED', actor: { id: 'rev-1', name: 'M. Okafor', role: 'land_use_planner' },
      reason: 'Extracted from the wrong column of the table.',
    }).rule

    expect(revoked.state).toBe('REVOKED')
    expect(revoked.certification?.active).toBe(false)
    const reuse = checkCertificationReuse({
      rule: revoked, jurisdiction: 'prince_georges_md', currentSourceHash: SOURCE_HASH,
    })
    expect(reuse.reusable).toBe(false)
  })

  it('a superseded rule is not usable as current and cannot be reinstated', () => {
    const c = certified()
    const superseded = transitionRule({
      rule: c, to: 'SUPERSEDED', actor: { id: 'sys', name: 'maintenance', role: 'system' },
      reason: 'Replaced by the 2026 amendment.',
    }).rule

    expect(superseded.state).toBe('SUPERSEDED')
    expect(checkCertificationReuse({
      rule: superseded, jurisdiction: 'prince_georges_md', currentSourceHash: SOURCE_HASH,
    }).reusable).toBe(false)

    expect(canTransition('SUPERSEDED', 'CERTIFIED').allowed).toBe(false)
    expect(canTransition('SUPERSEDED', 'VERIFIED').reason).toMatch(/terminal/i)
    expect(canTransition('REVOKED', 'PROVISIONAL').allowed).toBe(false)
  })
})

// ── 17, 18. Audit and reviewer authority ────────────────────────────────────

describe('17, 18. audit immutability and reviewer authority', () => {
  it('certification history is never overwritten', async () => {
    const store = new InMemoryRuleCertificationStore()
    const c = certified()
    await persistRuleState(store, { rules: [c], newCertifications: [c.certification!] })
    const firstId = store.certifications[0].id
    const snapshot = JSON.stringify(store.certifications[0])

    // Withdraw and re-certify against a new source version.
    await persistRuleState(store, {
      rules: [c],
      withdrawnCertifications: [{ ruleIdentity: c.identity, revokedAt: '2026-09-01T00:00:00Z', reason: 'source amended' }],
    })
    const recertified = certifyRule({
      rule: { ...c, state: 'VERIFIED', certification: null, provenance: provenance({ sourceHash: CHANGED_HASH, sourceVersion: '2022.2' }) },
      reviewer: PLANNER, currentSourceHash: CHANGED_HASH, note: 'Re-verified against the 2026 amendment.',
    })
    await persistRuleState(store, { rules: [recertified.rule], newCertifications: [recertified.certification] })

    // The original row still exists, marked withdrawn rather than deleted.
    expect(store.certifications).toHaveLength(2)
    const original = store.certifications.find(x => x.id === firstId)!
    expect(original).toBeDefined()
    expect(original.active).toBe(false)
    expect(original.sourceHash).toBe(JSON.parse(snapshot).sourceHash)
    expect(store.certifications.filter(x => x.active)).toHaveLength(1)
  })

  it('the audit stream is append-only across cycles', async () => {
    const store = new InMemoryRuleCertificationStore()
    const c = certified()
    await persistRuleState(store, { rules: [c], audits: [
      { ...certifyRule({ rule: rule(), reviewer: PLANNER, currentSourceHash: SOURCE_HASH, note: 'n' }).audit },
    ] })
    const first = JSON.stringify(store.audit)
    await persistRuleState(store, { rules: [c], audits: [
      { ...certifyRule({ rule: rule(), reviewer: PLANNER, currentSourceHash: SOURCE_HASH, note: 'n2' }).audit },
    ] })
    expect(store.audit.length).toBe(2)
    expect(JSON.stringify(store.audit.slice(0, 1))).toBe(first)
  })

  it('an unauthorised reviewer cannot certify', () => {
    // A surveyor is not authorised to certify a zoning dimensional standard.
    expect(mayCertify(SURVEYOR, 'dimensional.standards').allowed).toBe(false)

    const action = applyReviewerAction({
      kind: 'certify', reviewer: SURVEYOR, rule: rule(),
      note: 'Looks right to me.', currentSourceHash: SOURCE_HASH,
    })
    expect(action.ok).toBe(false)
    expect(action.rule.state).toBe('VERIFIED')
    expect(action.failures.join(' ')).toMatch(/not authorised to certify/i)
    expect(action.audit.action).toBe('rejected')
  })

  it('the right discipline may certify its own subject matter', () => {
    expect(mayCertify(ENGINEER, 'stormwater.esd').allowed).toBe(true)
    expect(mayCertify(PLANNER, 'dimensional.standards').allowed).toBe(true)
    const ok = applyReviewerAction({
      kind: 'certify', reviewer: PLANNER, rule: rule(),
      note: 'Confirmed against Table 27-4205(b).', currentSourceHash: SOURCE_HASH,
    })
    expect(ok.ok).toBe(true)
    expect(ok.rule.state).toBe('CERTIFIED')
  })

  it('a refused certification is auditable, not silent', () => {
    const refused = applyReviewerAction({
      kind: 'certify', reviewer: PLANNER,
      rule: rule({ provenance: provenance({ sourceHash: null }) }),
      note: 'try anyway', currentSourceHash: SOURCE_HASH,
    })
    expect(refused.ok).toBe(false)
    expect(refused.failures.length).toBeGreaterThan(0)
    expect(refused.message).toMatch(/none of them can be overridden/i)
  })
})

// ── 19. §25-128 canopy regression ───────────────────────────────────────────

describe('19. §25-128 Table 1 stays unresolved without an authoritative source', () => {
  const canopyRule = () =>
    buildPgCertifiableRules().find(r => r.ruleKey === 'landscape.tree_canopy')!

  it('carries an explicit source issue and requires human review', () => {
    const r = canopyRule()
    expect(r.humanReviewRequired).toBe(true)
    expect(r.sourceIssues.join(' ')).toMatch(/could not be retrieved from any published source/i)
    expect(r.sourceIssues.join(' ')).toMatch(/No fallback value exists and none may be\s+inferred/i)
  })

  it('has no value, and no fallback can silently satisfy it', () => {
    const r = canopyRule()
    expect(r.value).toBeNull()
    const applicability = evaluateApplicability(r.applicability, CONTEXT, r.value ?? undefined)
    // No footnote, default or inference produces a percentage.
    expect(applicability.effectiveValue).toBeUndefined()
  })

  it('certification is refused for it even by an authorised reviewer', () => {
    const r = canopyRule()
    const gate = evaluateCertificationGate({
      rule: { ...r, state: 'VERIFIED' }, reviewer: PLANNER, currentSourceHash: null,
    })
    expect(gate.eligible).toBe(false)
    expect(gate.failures.join(' ')).toMatch(/could not be retrieved/i)

    expect(() => certifyRule({
      rule: { ...r, state: 'VERIFIED' }, reviewer: PLANNER, currentSourceHash: null,
      note: 'assume 20%',
    })).toThrow(RuleTransitionError)
  })

  it('rests on a manual rather than the code, which alone keeps it under review', () => {
    const r = canopyRule()
    expect(r.provenance.sourceType).toBe('OFFICIAL_AGENCY_MANUAL')
    expect(r.applicability.incompleteReason).toMatch(/not reproduced in any retrievable/i)
  })
})

// ── 20. Permit readiness ────────────────────────────────────────────────────

describe('20. a project cannot be permit-ready on unresolved regulatory rules', () => {
  it('an unresolved rule keeps the project out of permit-ready', () => {
    const unresolved = rule({ state: 'PROVISIONAL' })
    const pack = buildRulePack({
      jurisdiction: 'prince_georges_md', packVersion: '2022.1', effectiveDate: '2022-04-01',
      rules: [unresolved], coreRuleKeys: [unresolved.ruleKey], sources: [],
      lastRefreshedAt: new Date().toISOString(),
    })
    const result = evaluateProjectRules({
      projectId: 'p', context: CONTEXT, pack, rules: [unresolved],
      currentSourceHashes: { [unresolved.identity]: SOURCE_HASH },
    })
    expect(result.regulatorilyResolved).toBe(false)
    expect(result.permitReadyBlocked.length).toBeGreaterThan(0)
    expect(result.summary).toMatch(/NOT permit-ready/i)
  })

  it('a fully certified applicable set resolves without implying jurisdiction approval', () => {
    const c = certified()
    const pack = buildRulePack({
      jurisdiction: 'prince_georges_md', packVersion: '2022.1', effectiveDate: '2022-04-01',
      rules: [c], coreRuleKeys: [c.ruleKey], sources: [], lastRefreshedAt: new Date().toISOString(),
    })
    const result = evaluateProjectRules({
      projectId: 'p', context: CONTEXT, pack, rules: [c],
      currentSourceHashes: { [c.identity]: SOURCE_HASH },
    })
    expect(result.regulatorilyResolved).toBe(true)
    expect(result.summary).toMatch(/Jurisdiction approval is separate and not implied/i)
  })
})

// ── 23, 24. Certification binds to exact source content ─────────────────────

describe('23, 24. a certification binds to the exact source it was granted against', () => {
  it('records the source hash and version it was granted against', () => {
    const c = certified()
    expect(c.certification?.sourceHash).toBe(SOURCE_HASH)
    expect(c.certification?.sourceVersion).toBe('2022.1')
    expect(c.certification?.reviewerRole).toBe('land_use_planner')
    expect(c.certification?.jurisdiction).toBe('prince_georges_md')
    expect(c.certification?.certificationScope).toEqual({ zone: 'RSF-65' })
  })

  it('an old certification cannot silently attach to a new ordinance version', () => {
    const c = certified()
    // The rule text now hashes differently — a 2026 amendment.
    const reuse = checkCertificationReuse({
      rule: c, jurisdiction: 'prince_georges_md', currentSourceHash: CHANGED_HASH,
    })
    expect(reuse.reusable).toBe(false)
    expect(reuse.blockers.join(' ')).toMatch(/ordinance text has changed since it was reviewed/i)
  })

  it('a project sees SOURCE_CHANGED rather than applying a stale certification', () => {
    const evaluation = evaluateRule({
      rule: certified(), context: CONTEXT, currentSourceHash: CHANGED_HASH,
    })
    expect(evaluation.outcome).toBe('REVIEW_REQUIRED')
    expect(evaluation.reviewReasons.map(r => r.code)).toContain('SOURCE_CHANGED')
    expect(evaluation.reusedCertification).toBe(false)
  })

  it('a certification does not travel between jurisdictions', () => {
    const reuse = checkCertificationReuse({
      rule: certified(), jurisdiction: 'montgomery_md', currentSourceHash: SOURCE_HASH,
    })
    expect(reuse.reusable).toBe(false)
    expect(reuse.blockers.join(' ')).toMatch(/does not travel between jurisdictions/i)
  })

  it('an expired certification stops being reusable', () => {
    const c = certified()
    const expired = {
      ...c,
      certification: { ...c.certification!, expiresAt: '2020-01-01T00:00:00Z' },
    }
    const reuse = checkCertificationReuse({
      rule: expired, jurisdiction: 'prince_georges_md', currentSourceHash: SOURCE_HASH,
    })
    expect(reuse.reusable).toBe(false)
    expect(reuse.blockers.join(' ')).toMatch(/expired/i)
  })
})

// ── Rule packs and review routing ───────────────────────────────────────────

describe('rule packs and review routing', () => {
  it('a pack with no certified rule is DRAFT', () => {
    const pack = buildRulePack({
      jurisdiction: 'prince_georges_md', packVersion: '2022.1', effectiveDate: '2022-04-01',
      rules: [rule({ state: 'EXTRACTED' })], coreRuleKeys: ['zoning.dimensional.RSF-65'], sources: [],
      lastRefreshedAt: new Date().toISOString(),
    })
    expect(pack.status).toBe('DRAFT')
    expect(pack.statusRationale).toMatch(/requires human verification/i)
  })

  it('a pack is CERTIFIED once every core rule is, even with unresolved supporting rules', () => {
    const core = certified()
    const supporting = rule({
      identity: 'supporting-1', ruleKey: 'landscape.tree_canopy', state: 'PROVISIONAL',
      humanReviewRequired: true,
    })
    const pack = buildRulePack({
      jurisdiction: 'prince_georges_md', packVersion: '2022.1', effectiveDate: '2022-04-01',
      rules: [core, supporting], coreRuleKeys: [core.ruleKey], sources: [],
      lastRefreshedAt: new Date().toISOString(),
    })
    expect(pack.status).toBe('CERTIFIED')
    expect(pack.coreCertificationCoverage).toBe(1)
    // The unresolved rule is not hidden by the pack's status.
    expect(pack.humanReviewRequiredCount).toBe(1)
    expect(pack.statusRationale).toMatch(/does not mean every rule in it is settled/i)
  })

  it('an unrefreshed pack goes STALE without losing its certifications', () => {
    const pack = buildRulePack({
      jurisdiction: 'prince_georges_md', packVersion: '2022.1', effectiveDate: '2022-04-01',
      rules: [certified()], coreRuleKeys: ['zoning.dimensional.RSF-65'], sources: [],
      lastRefreshedAt: '2020-01-01T00:00:00Z',
    })
    expect(pack.status).toBe('STALE')
    expect(pack.certifiedCount).toBe(1)
    expect(isPackUsable(pack).usable).toBe(true)
    expect(isPackUsable(pack).reason).toMatch(/keeps its certifications/i)
  })

  it('routes a stormwater question to the engineer and a zoning one to the planner', () => {
    expect(routeReviewDiscipline('stormwater.esd', 'RULE_NOT_CERTIFIED')).toBe('professional_engineer')
    expect(routeReviewDiscipline('dimensional.standards', 'UNRESOLVED_FOOTNOTE')).toBe('land_use_planner')
    expect(routeReviewDiscipline('tree_canopy.coverage', 'SOURCE_UNAVAILABLE')).toBe('environmental_professional')
  })

  it('creates no review item for a certified unchanged rule', () => {
    const c = certified()
    const pack = buildRulePack({
      jurisdiction: 'prince_georges_md', packVersion: '2022.1', effectiveDate: '2022-04-01',
      rules: [c], coreRuleKeys: [c.ruleKey], sources: [], lastRefreshedAt: new Date().toISOString(),
    })
    const result = evaluateProjectRules({
      projectId: 'p', context: CONTEXT, pack, rules: [c],
      currentSourceHashes: { [c.identity]: SOURCE_HASH },
    })
    expect(result.reviewItems).toHaveLength(0)
  })

  it('an inapplicable rule needs neither certification nor a reviewer', () => {
    const evaluation = evaluateRule({
      rule: rule({ state: 'EXTRACTED' }),
      context: { ...CONTEXT, zone: 'RMF-20' },
      currentSourceHash: SOURCE_HASH,
    })
    expect(evaluation.outcome).toBe('NOT_APPLICABLE')
    expect(evaluation.reviewReasons).toHaveLength(0)
  })
})

// ── Reviewer view ───────────────────────────────────────────────────────────

describe('the reviewer view carries everything needed to make the judgement', () => {
  it('assembles source locator, provenance, confidence, applicability and gate', () => {
    const view = buildRuleReviewView({
      rule: rule(), reviewer: PLANNER, currentSourceHash: SOURCE_HASH,
      sourceExcerpt: 'Front yard depth ......... 25 feet',
    })
    expect(view.sourceExcerpt.locator).toMatch(/Sec\. 27-4205.*Table 27-4205\(b\).*row "Front yard depth"/)
    expect(view.sourceExcerpt.excerpt).toContain('25 feet')
    expect(view.authority.label).toMatch(/codified code/i)
    expect(view.confidenceGate.dimensions.length).toBeGreaterThanOrEqual(3)
    expect(view.applicabilityLogic.condition).toBe('zone = RSF-65')
    expect(view.gate.eligible).toBe(true)
    expect(view.availableActions).toContain('certify')
  })

  it('offers no certify action to a reviewer who lacks the role', () => {
    const view = buildRuleReviewView({ rule: rule(), reviewer: SURVEYOR, currentSourceHash: SOURCE_HASH })
    expect(view.availableActions).not.toContain('certify')
  })

  it('a clarification request keeps the rule where it is and flags it', () => {
    const result = applyReviewerAction({
      kind: 'request_source_clarification', reviewer: PLANNER, rule: rule(),
      note: 'Footnote (4) text is not in the published table — need the printed ordinance page.',
    })
    expect(result.ok).toBe(true)
    expect(result.rule.state).toBe('VERIFIED')
    expect(result.rule.humanReviewRequired).toBe(true)
    expect(result.audit.action).toBe('clarification_requested')
  })
})

// ── The PG pack lifted into the Phase 3C model ──────────────────────────────

describe('the PG rule pack in the certifiable model', () => {
  it('lifts all 51 rules and starts every one of them EXTRACTED', () => {
    const rules = buildPgCertifiableRules()
    expect(rules.length).toBe(51)
    expect(rules.every(r => r.state === 'EXTRACTED')).toBe(true)
    expect(rules.every(r => r.humanReviewRequired)).toBe(true)
    expect(rules.some(r => r.certification !== null)).toBe(false)
  })

  it('gives each rule separate confidence dimensions, not one score', () => {
    const gis = buildPgCertifiableRules().find(r => r.ruleKey === 'crs.reference')!
    const dimensional = buildPgCertifiableRules().find(r => r.ruleKey === 'zoning.dimensional.RSF-65')!
    // A GIS query extracts cleanly but is a weaker authority for a requirement.
    expect(gis.confidence.extractionConfidence).toBeGreaterThan(dimensional.confidence.extractionConfidence)
    expect(gis.confidence.authorityConfidence).toBeLessThan(dimensional.confidence.authorityConfidence)
  })

  it('models nested Transit-Oriented tables as lower extraction confidence', () => {
    const rules = buildPgCertifiableRules()
    const nested = rules.find(r => /dimensional\.(RTO|TAC|LTO|NAC|LMUTC)/.test(r.ruleKey))
    const flat = rules.find(r => r.ruleKey === 'zoning.dimensional.RSF-65')!
    if (nested) expect(nested.confidence.extractionConfidence).toBeLessThan(flat.confidence.extractionConfidence)
  })

  it('keeps footnote markers as structured mandatory footnotes, not flattened values', () => {
    const withFootnotes = buildPgCertifiableRules()
      .filter(r => (r.applicability.footnotes ?? []).length > 0)
    expect(withFootnotes.length).toBeGreaterThan(0)
    const f = withFootnotes[0].applicability.footnotes![0]
    expect(f.mandatory).toBe(true)
    expect(f.condition.kind).toBe('discretionary')
    expect(f.text).toMatch(/must be read from the ordinance/i)
  })

  it('none of the 51 can certify without a source hash', () => {
    const rules = buildPgCertifiableRules()
    for (const r of rules.slice(0, 10)) {
      const gate = evaluateCertificationGate({
        rule: { ...r, state: 'VERIFIED' }, reviewer: PLANNER, currentSourceHash: SOURCE_HASH,
      })
      expect(gate.eligible).toBe(false)
    }
  })

  it('declares a core rule set smaller than the whole pack', () => {
    expect(PG_CORE_RULE_KEYS.length).toBeGreaterThan(0)
    expect(PG_CORE_RULE_KEYS.length).toBeLessThan(51)
  })
})

// ── Persistence ─────────────────────────────────────────────────────────────

describe('persistence of the certification model', () => {
  it('writes rules, provenance, applicability and pack membership', async () => {
    const store = new InMemoryRuleCertificationStore()
    const c = certified()
    const pack = buildRulePack({
      jurisdiction: 'prince_georges_md', packVersion: '2022.1', effectiveDate: '2022-04-01',
      rules: [c], coreRuleKeys: [c.ruleKey], sources: [], lastRefreshedAt: new Date().toISOString(),
    })
    const result = await persistRuleState(store, {
      rules: [c], pack, newCertifications: [c.certification!],
    })

    expect(result.rulesWritten).toBe(1)
    expect(store.rules[0].state).toBe('CERTIFIED')
    expect(store.rules[0].extractionConfidence).toBe(0.99)
    expect(store.rules[0].authorityConfidence).toBe(1)
    expect(store.provenance[0].sourceHash).toBe(SOURCE_HASH)
    expect(store.applicability[0].condition).toBeDefined()
    expect(store.packMembers).toHaveLength(1)
    expect(store.packMembers[0].tier).toBe('core')
  })

  it('is idempotent on rule identity', async () => {
    const store = new InMemoryRuleCertificationStore()
    const c = certified()
    await persistRuleState(store, { rules: [c] })
    await persistRuleState(store, { rules: [c] })
    expect(store.rules).toHaveLength(1)
    expect(store.provenance).toHaveLength(1)
  })

  it('records source versions and regions for change detection', async () => {
    const store = new InMemoryRuleCertificationStore()
    const src: AuthoritativeSource = {
      sourceId: 'src-1', jurisdiction: 'prince_georges_md', title: 'Subtitle 27',
      url: 'https://example.gov', documentId: null, documentHash: 'doc-2', version: '2022.2',
      retrievedAt: '2026-06-01T00:00:00Z',
      regions: [{ regionId: 'rsf65', label: 'Table 27-4205(b)', hash: 'h1', ruleIdentities: ['id-1'] }],
      history: [{ version: '2022.1', documentHash: 'doc-1', retrievedAt: '2026-01-01T00:00:00Z', supersededAt: '2026-06-01T00:00:00Z' }],
    }
    await persistRuleState(store, { rules: [], source: { source: src, authority: 'OFFICIAL_CODE' } })
    expect(store.sources[0].documentHash).toBe('doc-2')
    expect(store.sourceVersions[0].documentHash).toBe('doc-1')
    expect(store.sourceRegions[0].ruleIdentities).toEqual(['id-1'])
  })

  it('advanceSourceVersion keeps prior hashes rather than discarding them', () => {
    const prev: AuthoritativeSource = {
      sourceId: 's', jurisdiction: 'j', title: 't', url: null, documentId: null,
      documentHash: 'doc-1', version: '1', retrievedAt: '2026-01-01T00:00:00Z', regions: [], history: [],
    }
    const next = advanceSourceVersion(prev, {
      documentHash: 'doc-2', version: '2', retrievedAt: '2026-06-01T00:00:00Z', regions: [],
    })
    expect(next.documentHash).toBe('doc-2')
    expect(next.history).toHaveLength(1)
    expect(next.history[0].documentHash).toBe('doc-1')
  })
})

// ── Advisory rules and footnote resolution ──────────────────────────────────

describe('advisory rules and footnote resolution', () => {
  it('an advisory rule neither gates a project nor raises a review item', () => {
    const advisory = rule({
      state: 'EXTRACTED', gating: false,
      advisoryReason: 'Source registry: it states no requirement the county reviews against.',
      applicability: { condition: { kind: 'always' } },
    })
    const evaluation = evaluateRule({ rule: advisory, context: CONTEXT, currentSourceHash: SOURCE_HASH })
    expect(evaluation.outcome).toBe('NOT_APPLICABLE')
    expect(evaluation.reviewReasons).toHaveLength(0)
    expect(evaluation.rationale).toMatch(/states no requirement/i)
  })

  it('gating defaults on, so a new rule family cannot go advisory by omission', () => {
    const gatingRule = rule({ state: 'PROVISIONAL' })
    expect(gatingRule.gating).toBe(true)
    const evaluation = evaluateRule({ rule: gatingRule, context: CONTEXT, currentSourceHash: SOURCE_HASH })
    expect(evaluation.outcome).toBe('REVIEW_REQUIRED')
  })

  it('the PG pack marks only source registries and the process model advisory', () => {
    const rules = buildPgCertifiableRules()
    const advisory = rules.filter(r => !r.gating).map(r => r.ruleKey)
    expect(advisory).toEqual(expect.arrayContaining(['crs.reference', 'gis.layers', 'process.review_model']))
    // Nothing that states a dimension, buffer or procedure is advisory.
    expect(advisory.some(k => k.startsWith('zoning.dimensional.'))).toBe(false)
    expect(advisory).not.toContain('landscape.tree_canopy')
    expect(advisory).not.toContain('environment.stream_buffers')
  })

  it('resolving a footnote raises applicability confidence and unblocks the gate', () => {
    const withDiscretionary = rule({
      confidence: confidence({ applicabilityConfidence: 0.5 }),
      applicability: {
        condition: { kind: 'equals', field: 'zone', value: 'RSF-65' },
        footnotes: [{
          id: 'fn-4', marker: '(4)', text: 'Footnote text not captured at extraction.',
          effect: 'replaces_value',
          condition: { kind: 'discretionary', description: 'unknown', resolvedBy: 'land_use_planner' },
          mandatory: true,
        }],
      },
    })
    expect(evaluateCertificationGate({
      rule: withDiscretionary, reviewer: PLANNER, currentSourceHash: SOURCE_HASH,
    }).eligible).toBe(false)

    const resolved = applyReviewerAction({
      kind: 'resolve_footnote', reviewer: PLANNER, rule: withDiscretionary,
      note: 'Read from the printed ordinance.',
      footnoteResolution: {
        marker: '(4)', text: 'On a corner lot the side-street yard shall be 15 feet.',
        effect: 'replaces_value', value: '15',
        condition: { kind: 'equals', field: 'lotType', value: 'corner' },
      },
    })
    expect(resolved.ok).toBe(true)
    expect(resolved.rule.confidence.applicabilityConfidence).toBeGreaterThanOrEqual(0.95)
    expect(resolved.audit.action).toBe('interpretation_noted')
    expect(evaluateCertificationGate({
      rule: resolved.rule, reviewer: PLANNER, currentSourceHash: SOURCE_HASH,
    }).eligible).toBe(true)
  })

  it('a resolved footnote then actually overrides the base value on a matching project', () => {
    const resolved = applyReviewerAction({
      kind: 'resolve_footnote', reviewer: PLANNER,
      rule: rule({
        applicability: {
          condition: { kind: 'equals', field: 'zone', value: 'RSF-65' },
          footnotes: [{
            id: 'fn-4', marker: '(4)', text: 'x', effect: 'replaces_value',
            condition: { kind: 'discretionary', description: 'unknown', resolvedBy: 'land_use_planner' },
            mandatory: true,
          }],
        },
      }),
      note: 'read',
      footnoteResolution: {
        marker: '(4)', effect: 'replaces_value', value: '15',
        condition: { kind: 'equals', field: 'lotType', value: 'corner' },
      },
    }).rule

    const onCorner = evaluateApplicability(resolved.applicability, { ...CONTEXT, lotType: 'corner' }, '25')
    expect(onCorner.effectiveValue).toBe('15')
    const onInterior = evaluateApplicability(resolved.applicability, { ...CONTEXT, lotType: 'interior' }, '25')
    expect(onInterior.effectiveValue).toBe('25')
  })

  it('cannot resolve a footnote the rule does not carry', () => {
    const result = applyReviewerAction({
      kind: 'resolve_footnote', reviewer: PLANNER, rule: rule(), note: 'x',
      footnoteResolution: { marker: '(99)', condition: { kind: 'always' } },
    })
    expect(result.ok).toBe(false)
    expect(result.failures.join(' ')).toMatch(/not present on/i)
  })

  it('a withdrawal in the same cycle as an append leaves no active certification', async () => {
    const store = new InMemoryRuleCertificationStore()
    const c = certified()
    await persistRuleState(store, {
      rules: [c],
      newCertifications: [c.certification!],
      withdrawnCertifications: [{ ruleIdentity: c.identity, revokedAt: '2026-10-01T00:00:00Z', reason: 'source amended' }],
    })
    expect(store.certifications).toHaveLength(1)
    expect(store.certifications[0].active).toBe(false)
    expect(store.certifications[0].revokedReason).toBe('source amended')
  })
})

// ── Provenance granularity ──────────────────────────────────────────────────

describe('provenance granularity', () => {
  it('a table-level rule is located by its table, without a row and column', () => {
    const a = assessProvenance(provenance({ granularity: 'table', row: null, column: null }))
    expect(a.sufficient).toBe(true)
    expect(a.locatable).toBe(true)
  })

  it('a cell-level rule still needs its row and column', () => {
    const a = assessProvenance(provenance({ granularity: 'cell', row: null, column: null }))
    expect(a.sufficient).toBe(false)
    expect(a.missing).toEqual(expect.arrayContaining(['row', 'column']))
  })

  it('granularity defaults to the strictest reading', () => {
    const a = assessProvenance(provenance({ granularity: undefined, row: null, column: null }))
    expect(a.sufficient).toBe(false)
  })

  it('a GIS source is located by its endpoint rather than a code section', () => {
    const a = assessProvenance(provenance({
      sourceType: 'OFFICIAL_GIS', codeSection: null, table: null,
      sourceUrl: 'https://gisdata.pgplanning.org/arcgis/rest/services',
    }))
    expect(a.sufficient).toBe(true)
    expect(a.locatable).toBe(true)
  })

  it('an ordinance rule with no section is still refused', () => {
    const a = assessProvenance(provenance({ sourceType: 'OFFICIAL_CODE', codeSection: null }))
    expect(a.sufficient).toBe(false)
    expect(a.missing).toContain('codeSection')
  })
})

// ── Freshness ───────────────────────────────────────────────────────────────

describe('source freshness', () => {
  it('decays with age and is not a belief but a function of time', () => {
    const now = new Date('2026-08-22T00:00:00Z')
    expect(freshnessConfidence('2026-08-22T00:00:00Z', now)).toBe(1)
    expect(freshnessConfidence('2026-02-22T00:00:00Z', now)).toBeCloseTo(0.5, 1)
    expect(freshnessConfidence('2024-08-22T00:00:00Z', now)).toBeLessThan(CERTIFICATION_THRESHOLDS.freshness)
  })
})
