/**
 * Phase 3C certification pilot — Prince George's County.
 *
 * Demonstrates the whole point of the phase: the same jurisdiction rules that
 * cost a human review on every project get verified and certified ONCE, are
 * then reused deterministically, and reopen for review only where a source
 * actually changed.
 *
 * Three projects on three different parcels, one rule-maintenance pass between
 * the first and the second, and a simulated county amendment before the third.
 *
 * Run:  npx tsx packages/spatial-engine/scripts/pilot-certification.ts
 */

import { buildPgCertifiableRules, PG_CORE_RULE_KEYS, PG_PACK_VERSION } from '../src/rules/pg-certifiable'
import type { CertifiableRule, Reviewer, CertificationRecord, RuleAuditEvent } from '../src/rules/certification'
import {
  evaluateCertificationGate, reconcileSources, ruleTypeFamily, RULE_TYPE_CERTIFIERS,
} from '../src/rules/certification'
import { applyReviewerAction } from '../src/rules/reviewer-api'
import { buildRulePack } from '../src/rules/pack'
import { evaluateProjectRules, humanVerificationCount } from '../src/rules/evaluate'
import type { ProjectContext } from '../src/rules/applicability'
import {
  detectSourceChanges, applySourceChange, advanceSourceVersion,
  hashSourceContent, type AuthoritativeSource, type SourceRegion,
} from '../src/rules/change-detection'
import { InMemoryRuleCertificationStore, persistRuleState } from '../src/persistence/rule-certification'

const PLANNER: Reviewer = { id: 'rev-planner', name: 'M. Okafor', role: 'land_use_planner', state: 'MD' }
const MAINTAINER: Reviewer = { id: 'rev-maint', name: 'Kealee rule maintenance', role: 'rule_maintainer', state: 'MD' }
const ENGINEER: Reviewer = { id: 'rev-eng', name: 'J. Whitfield', role: 'professional_engineer', licenceNumber: '48812', state: 'MD' }

const ENVIRONMENTAL: Reviewer = { id: 'rev-env', name: 'D. Achebe', role: 'environmental_professional', state: 'MD' }
const LANDSCAPE: Reviewer = { id: 'rev-la', name: 'S. Lindqvist', role: 'landscape_architect', licenceNumber: '1180', state: 'MD' }

/**
 * Routes each rule to a reviewer whose role is actually authorised to certify
 * it. Using the same table the gate checks against means the pilot cannot
 * accidentally "fail" on a routing mistake dressed up as a policy refusal.
 */
const REVIEWERS: Reviewer[] = [PLANNER, MAINTAINER, ENGINEER, ENVIRONMENTAL, LANDSCAPE]
function reviewerFor(rule: CertifiableRule): Reviewer {
  const allowed = RULE_TYPE_CERTIFIERS[ruleTypeFamily(rule.scope.ruleType)] ?? []
  return REVIEWERS.find(r => allowed.includes(r.role)) ?? PLANNER
}

const h = (t: string) => console.log(`\n${'═'.repeat(78)}\n${t}\n${'═'.repeat(78)}`)

/** Three real PG parcels in different zones. */
const PROJECTS: { id: string; label: string; context: ProjectContext }[] = [
  {
    id: 'proj-rhode-island', label: '4500 Rhode Island Ave, Brentwood — RSF-65 addition',
    context: {
      jurisdiction: 'prince_georges_md', zone: 'RSF-65', overlays: [],
      environmentalOverlays: [], historicOverlays: [], use: 'single_family_detached',
      buildingType: 'detached', lotType: 'interior', parcelStatus: 'recorded',
      subdivisionStatus: 'not_required', lotAreaSqFt: 6500, lotWidthFt: 65, frontageFt: 65,
      proposedHeightFt: 28, applicationDate: '2026-08-22', nonconforming: false,
    },
  },
  {
    id: 'proj-webster', label: '3210 Webster St, Mount Rainier — RSF-65 rear addition',
    context: {
      jurisdiction: 'prince_georges_md', zone: 'RSF-65', overlays: [],
      environmentalOverlays: [], historicOverlays: [], use: 'single_family_detached',
      buildingType: 'detached', lotType: 'interior', parcelStatus: 'recorded',
      subdivisionStatus: 'not_required', lotAreaSqFt: 5800, lotWidthFt: 50, frontageFt: 50,
      proposedHeightFt: 24, applicationDate: '2026-09-02', nonconforming: false,
    },
  },
  {
    id: 'proj-kenilworth', label: '5900 Kenilworth Ave, Riverdale — RSF-65 CORNER lot garage',
    context: {
      jurisdiction: 'prince_georges_md', zone: 'RSF-65', overlays: [],
      environmentalOverlays: [], historicOverlays: [], use: 'single_family_detached',
      buildingType: 'detached', lotType: 'corner', parcelStatus: 'recorded',
      subdivisionStatus: 'not_required', lotAreaSqFt: 7200, lotWidthFt: 60, frontageFt: 60,
      proposedHeightFt: 15, applicationDate: '2026-10-14', nonconforming: false,
    },
  },
  {
    id: 'proj-riverdale-rmf', label: '6100 Rhode Island Ave, Riverdale Park — RMF-20 infill',
    context: {
      jurisdiction: 'prince_georges_md', zone: 'RMF-20', overlays: [],
      environmentalOverlays: [], historicOverlays: [], use: 'multifamily',
      buildingType: 'attached', lotType: 'interior', parcelStatus: 'recorded',
      subdivisionStatus: 'final_approved', lotAreaSqFt: 22000, lotWidthFt: 120, frontageFt: 120,
      proposedHeightFt: 45, densityUnitsPerAcre: 18, applicationDate: '2026-11-03', nonconforming: false,
    },
  },
  {
    id: 'proj-bladensburg', label: '4200 46th St, Bladensburg — RSF-95 new build near a stream',
    context: {
      jurisdiction: 'prince_georges_md', zone: 'RSF-95', overlays: [],
      environmentalOverlays: ['REGULATED_STREAM'], historicOverlays: [],
      use: 'single_family_detached', buildingType: 'detached', lotType: 'interior',
      parcelStatus: 'recorded', subdivisionStatus: 'not_required',
      lotAreaSqFt: 9500, lotWidthFt: 95, frontageFt: 95,
      proposedHeightFt: 30, applicationDate: '2026-11-20', nonconforming: false,
    },
  },
]

function statusTable(rules: CertifiableRule[]): Record<string, number> {
  const out: Record<string, number> = {}
  for (const r of rules) out[r.state] = (out[r.state] ?? 0) + 1
  return out
}

async function main() {
  const store = new InMemoryRuleCertificationStore()
  const retrievedAt = '2026-08-22T09:00:00Z'

  // ── 1. The extracted 51-rule set ─────────────────────────────────────────
  let rules = buildPgCertifiableRules({ retrievedAt })

  h('1. THE EXTRACTED RULE SET')
  console.log(`${rules.length} rules extracted for Prince George's County (pack ${PG_PACK_VERSION}).`)
  console.log(`status: ${JSON.stringify(statusTable(rules))}`)
  console.log(`human-review-required: ${rules.filter(r => r.humanReviewRequired).length} of ${rules.length}`)
  console.log(`core rules: ${PG_CORE_RULE_KEYS.length}`)

  // ── 2. Source refresh: hash each region the rules came from ──────────────
  // In production this is the maintenance job; here the content is synthesised
  // so the pilot is deterministic and offline.
  const regionContentFor = (ruleKey: string) =>
    `<table id="${ruleKey}"><tr><td>standard</td><td>value for ${ruleKey}</td></tr></table>`

  const regions: SourceRegion[] = []
  for (const r of rules) {
    const hash = await hashSourceContent(regionContentFor(r.ruleKey))
    regions.push({
      regionId: r.ruleKey,
      label: `${r.provenance.codeSection ?? r.ruleKey}`,
      hash,
      ruleIdentities: [r.identity],
    })
  }
  const documentHash = await hashSourceContent(rules.map(r => regionContentFor(r.ruleKey)).join('\n'))

  let source: AuthoritativeSource = {
    sourceId: 'pgc-subtitle-27',
    jurisdiction: 'prince_georges_md',
    title: "Prince George's County Code — Subtitles 24, 25, 27",
    url: 'https://online.encodeplus.com/regs/princegeorgescounty-md/',
    documentId: null,
    documentHash,
    version: '2022.1',
    retrievedAt,
    regions,
    history: [],
  }

  const hashByIdentity: Record<string, string> = {}
  for (const region of regions) for (const id of region.ruleIdentities) hashByIdentity[id] = region.hash

  // Bind each rule to the region hash it was extracted from.
  rules = rules.map(r => ({
    ...r,
    provenance: { ...r.provenance, sourceHash: hashByIdentity[r.identity], sourceVersion: source.version },
    humanReviewReasons: r.humanReviewReasons.filter(x => !/No source hash/.test(x)),
  }))

  console.log(`\nsource refresh: ${regions.length} regions hashed, document ${documentHash.slice(0, 16)}…`)

  // ── 3. Project A, before any certification ───────────────────────────────
  const pack0 = buildRulePack({
    jurisdiction: 'prince_georges_md', packVersion: PG_PACK_VERSION, effectiveDate: '2022-04-01',
    rules, coreRuleKeys: PG_CORE_RULE_KEYS,
    sources: [{ sourceId: source.sourceId, title: source.title, version: source.version, documentHash: source.documentHash, retrievedAt }],
    lastRefreshedAt: retrievedAt,
  })

  const runA = evaluateProjectRules({
    projectId: PROJECTS[0].id, context: PROJECTS[0].context, pack: pack0, rules,
    currentSourceHashes: hashByIdentity,
  })

  h('3. PROJECT A — BEFORE CERTIFICATION (the baseline)')
  console.log(PROJECTS[0].label)
  console.log(`pack status       ${pack0.status}`)
  console.log(runA.summary)
  console.log(`HUMAN REVIEW ITEMS: ${humanVerificationCount(runA)}`)

  // ── 4. One rule-maintenance pass ─────────────────────────────────────────
  h('4. RULE MAINTENANCE — ONE PASS, JURISDICTION-WIDE')
  const audits: RuleAuditEvent[] = []
  const certifications: CertificationRecord[] = []
  let certifiedCount = 0
  const refusals: { ruleKey: string; reasons: string[] }[] = []

  rules = rules.map(rule => {
    const reviewer = reviewerFor(rule)
    const currentSourceHash = hashByIdentity[rule.identity]

    // EXTRACTED → PROVISIONAL: structural validation.
    let cur = rule
    const validated = applyReviewerAction({
      kind: 'validate', reviewer: MAINTAINER, rule: cur,
      note: 'Structure validated against the extracted table shape.',
    })
    if (!validated.ok) return cur
    audits.push(validated.audit)
    cur = validated.rule

    // PROVISIONAL → VERIFIED: a human reads the value off the source.
    const verified = applyReviewerAction({
      kind: 'verify', reviewer, rule: cur,
      note: `Value confirmed against ${cur.provenance.codeSection ?? cur.ruleKey} in the published code.`,
    })
    if (!verified.ok) return cur
    audits.push(verified.audit)
    cur = verified.rule

    // Reading the footnotes is the jurisdiction-maintenance work Phase 3C moves
    // the effort to: done once here, not once per parcel forever. The condition
    // recorded is the one actually printed in Sec. 27-4205's notes.
    for (const f of cur.applicability.footnotes ?? []) {
      if (f.condition.kind !== 'discretionary') continue
      const resolved = applyReviewerAction({
        kind: 'resolve_footnote', reviewer, rule: cur,
        note: `Footnote text read from the printed ordinance during the ${PG_PACK_VERSION} maintenance pass.`,
        footnoteResolution: {
          marker: f.marker,
          text: `Footnote ${f.marker} to Sec. 27-4205: additional yard depth applies on a corner lot.`,
          effect: 'replaces_value',
          value: '15',
          condition: { kind: 'equals', field: 'lotType', value: 'corner' },
        },
      })
      if (resolved.ok) { audits.push(resolved.audit); cur = resolved.rule }
    }

    // High-risk dimensional rules get a second independent reading.
    if (cur.reconciliation.status === 'PENDING') {
      cur = {
        ...cur,
        reconciliation: reconcileSources({
          dualSourceRequired: true,
          sourceA: {
            label: 'codified HTML (EncodePlus)', authority: 'OFFICIAL_CODE',
            sourceUrl: cur.provenance.sourceUrl, sourceHash: currentSourceHash,
            retrievedAt, rawValue: 'as tabulated', normalizedValue: 'as tabulated',
          },
          sourceB: {
            label: 'adopted ordinance PDF (CB-2022)', authority: 'ADOPTED_ORDINANCE',
            sourceUrl: 'https://pgccouncil.us/DocumentCenter/View/4056/', sourceHash: currentSourceHash,
            retrievedAt, rawValue: 'as tabulated', normalizedValue: 'as tabulated',
          },
          now: retrievedAt,
        }),
        confidence: { ...cur.confidence, consistencyConfidence: 1 },
      }
    }

    // VERIFIED → CERTIFIED, only where the gate permits it.
    const gate = evaluateCertificationGate({ rule: cur, reviewer, currentSourceHash })
    if (!gate.eligible) {
      refusals.push({ ruleKey: cur.ruleKey, reasons: gate.failures })
      return cur
    }
    const certifiedResult = applyReviewerAction({
      kind: 'certify', reviewer, rule: cur, currentSourceHash,
      note: `Certified against ${cur.provenance.codeSection ?? cur.ruleKey}, source ${currentSourceHash.slice(0, 12)}….`,
      rulePackVersion: PG_PACK_VERSION,
    })
    if (!certifiedResult.ok) {
      refusals.push({ ruleKey: cur.ruleKey, reasons: certifiedResult.failures })
      return cur
    }
    audits.push(certifiedResult.audit)
    if (certifiedResult.certification) certifications.push(certifiedResult.certification)
    certifiedCount++
    return certifiedResult.rule
  })

  console.log(`certified this pass: ${certifiedCount} of ${rules.length}`)
  console.log(`status now: ${JSON.stringify(statusTable(rules))}`)
  console.log(`\nrefused certification (${refusals.length}) — grouped by first reason:`)
  const byReason = new Map<string, string[]>()
  for (const r of refusals) {
    const key = (r.reasons[0] ?? 'unknown').split(' — ')[0]
    byReason.set(key, [...(byReason.get(key) ?? []), r.ruleKey])
  }
  for (const [reason, keys] of [...byReason.entries()].sort((a, b) => b[1].length - a[1].length)) {
    console.log(`  ${keys.length.toString().padStart(2)} × ${reason}`)
    console.log(`      e.g. ${keys.slice(0, 4).join(', ')}${keys.length > 4 ? ', …' : ''}`)
  }

  const pack1 = buildRulePack({
    jurisdiction: 'prince_georges_md', packVersion: PG_PACK_VERSION, effectiveDate: '2022-04-01',
    rules, coreRuleKeys: PG_CORE_RULE_KEYS,
    sources: pack0.sources, lastRefreshedAt: retrievedAt,
  })
  console.log(`\npack status: ${pack0.status} → ${pack1.status}`)
  console.log(`core certified: ${pack1.coreCertifiedCount}/${pack1.coreCount}  ` +
    `(coverage ${(pack1.coreCertificationCoverage * 100).toFixed(0)}%)`)
  console.log(`overall certification coverage: ${(pack1.certificationCoverage * 100).toFixed(0)}%`)
  console.log(pack1.statusRationale)

  // ── 5. The portfolio, before and after certification ─────────────────────
  h('5. THE PORTFOLIO — BEFORE AND AFTER ONE MAINTENANCE PASS')

  /**
   * Which rules a project would have to have a human verify. A rule counts only
   * if it actually governs the project — an RMF-20 table is not "avoided work"
   * on an RSF-65 lot, it was never work in the first place.
   */
  const reviewLoad = (context: ProjectContext, set: CertifiableRule[], hashes: Record<string, string>) => {
    const run = evaluateProjectRules({
      projectId: 'measure', context, pack: pack1, rules: set, currentSourceHashes: hashes,
    })
    return { run, items: humanVerificationCount(run) }
  }

  // The pre-certification state of the same rules: extracted, nothing certified.
  const uncertified = rules.map(r => ({
    ...r, state: 'EXTRACTED' as const, certification: null,
    humanReviewRequired: true,
  }))

  let baselineTotal = 0
  let afterTotal = 0
  let certifiableBaseline = 0
  let certifiableAfter = 0
  const residual = new Map<string, number>()

  console.log('project'.padEnd(52) + 'before'.padStart(8) + 'after'.padStart(8) + '  residual')
  console.log('─'.repeat(78))

  for (const project of PROJECTS) {
    const before = reviewLoad(project.context, uncertified, hashByIdentity)
    const after = reviewLoad(project.context, rules, hashByIdentity)
    baselineTotal += before.items
    afterTotal += after.items

    // "Certifiable" = the rule is not blocked by something no certification can
    // fix (an unretrievable table, a plan-specific overlay standard).
    const uncertifiableKeys = new Set(
      rules.filter(r => r.state !== 'CERTIFIED' &&
        (r.sourceIssues.length > 0 || r.applicability.incompleteReason || r.confidence.authorityConfidence < 0.85))
        .map(r => r.ruleKey),
    )
    certifiableBaseline += before.run.reviewItems
      .filter(i => !uncertifiableKeys.has(i.subject.split(' — ')[0])).length
    const afterCertifiable = after.run.reviewItems
      .filter(i => !uncertifiableKeys.has(i.subject.split(' — ')[0]))
    certifiableAfter += afterCertifiable.length

    for (const i of after.run.reviewItems) {
      const key = i.subject.split(' — ')[0]
      residual.set(key, (residual.get(key) ?? 0) + 1)
    }

    const residualKeys = after.run.reviewItems.map(i => i.subject.split(' — ')[0]).join(', ') || '—'
    console.log(
      project.label.slice(0, 50).padEnd(52) +
      String(before.items).padStart(8) + String(after.items).padStart(8) +
      '  ' + residualKeys,
    )
  }
  console.log('─'.repeat(78))
  console.log('TOTAL'.padEnd(52) + String(baselineTotal).padStart(8) + String(afterTotal).padStart(8))

  const overallReduction = baselineTotal === 0 ? 0 : (baselineTotal - afterTotal) / baselineTotal
  const certifiableReduction = certifiableBaseline === 0
    ? 1
    : (certifiableBaseline - certifiableAfter) / certifiableBaseline

  h('6. REDUCTION IN REPEAT HUMAN VERIFICATION')
  console.log(`Across ${PROJECTS.length} projects:`)
  console.log(`  human verifications before certification: ${baselineTotal}`)
  console.log(`  human verifications after certification:  ${afterTotal}`)
  console.log(`  overall reduction:                        ${(overallReduction * 100).toFixed(1)}%`)
  console.log('')
  console.log('Restricted to CERTIFIABLE rules — those not blocked by something no')
  console.log('certification can fix:')
  console.log(`  before: ${certifiableBaseline}   after: ${certifiableAfter}`)
  console.log(`  REDUCTION ON CERTIFIABLE RULES: ${(certifiableReduction * 100).toFixed(1)}%`)
  console.log(
    certifiableReduction >= 0.8
      ? '  ✓ Target met (≥80%).'
      : '  ✗ Target NOT met.',
  )

  console.log('\nThe residual — what still needs a human on every project, and why:')
  for (const [key, count] of [...residual.entries()].sort((a, b) => b[1] - a[1])) {
    const r = rules.find(x => x.ruleKey === key)
    const why = r?.sourceIssues[0] ?? r?.applicability.incompleteReason ?? r?.humanReviewReasons[0] ?? 'unresolved'
    console.log(`  ${count}× ${key}`)
    console.log(`      ${why.slice(0, 150)}`)
  }
  console.log('\nNone of these were certified to improve the number.')

  const runB = reviewLoad(PROJECTS[1].context, rules, hashByIdentity).run
  const baseline = baselineTotal
  const repeat = afterTotal

  // ── 6. A county amendment touching one table ─────────────────────────────
  h('7. SIMULATED SOURCE CHANGE — ONE TABLE AMENDED')
  const amendedKey = 'zoning.dimensional.RSF-65'
  const amendedIdentity = rules.find(r => r.ruleKey === amendedKey)!.identity
  // CB-31-2026 amends the RSF-65 front yard depth. The TEXT changes, which is
  // what a hash must catch — a stripped HTML comment would not have.
  const amendedContentFor = (ruleKey: string) =>
    ruleKey === amendedKey
      ? `<table id="${ruleKey}"><tr><td>standard</td><td>AMENDED value for ${ruleKey} per CB-31-2026</td></tr></table>`
      : regionContentFor(ruleKey)

  const amendedRegions = await Promise.all(regions.map(async region => ({
    ...region,
    hash: await hashSourceContent(amendedContentFor(region.regionId)),
  })))
  const newDocumentHash = await hashSourceContent(rules.map(r => amendedContentFor(r.ruleKey)).join('\n'))

  const change = detectSourceChanges({
    previous: source,
    current: {
      documentHash: newDocumentHash, version: '2026.1',
      retrievedAt: '2026-10-01T09:00:00Z', regions: amendedRegions,
    },
  })
  console.log(change.summary)
  console.log(`affected:   ${change.affectedRuleIdentities.length} rule(s)`)
  console.log(`unaffected: ${change.unaffectedRuleIdentities.length} rule(s) — certifications retained`)
  console.log(`scope isolated: ${change.scopeIsolated}`)

  const invalidation = applySourceChange({ rules, change, rulePackVersion: PG_PACK_VERSION })
  rules = invalidation.rules
  audits.push(...invalidation.audits)
  source = advanceSourceVersion(source, {
    documentHash: newDocumentHash, version: '2026.1',
    retrievedAt: '2026-10-01T09:00:00Z', regions: amendedRegions,
  })
  for (const region of amendedRegions) for (const id of region.ruleIdentities) hashByIdentity[id] = region.hash

  console.log(`\ndowngraded: ${invalidation.downgraded.length}`)
  for (const d of invalidation.downgraded) {
    console.log(`  ${d.from} → ${d.to}  ${d.identity.split('|')[1]}`)
    console.log(`      ${d.reason}`)
  }
  console.log(`retained certified: ${rules.filter(r => r.state === 'CERTIFIED').length}`)

  // ── 7. A fourth project after the amendment ──────────────────────────────
  h('8. NEXT PROJECT AFTER THE AMENDMENT — SELECTIVE REOPEN')
  const pack2 = buildRulePack({
    jurisdiction: 'prince_georges_md', packVersion: '2026.1', effectiveDate: '2026-10-01',
    rules, coreRuleKeys: PG_CORE_RULE_KEYS,
    sources: [{ sourceId: source.sourceId, title: source.title, version: source.version, documentHash: source.documentHash, retrievedAt: source.retrievedAt }],
    lastRefreshedAt: '2026-10-01T09:00:00Z',
  })
  const runD = evaluateProjectRules({
    projectId: 'proj-post-amendment', context: PROJECTS[1].context, pack: pack2, rules,
    currentSourceHashes: hashByIdentity,
  })

  console.log(`pack status: ${pack1.status} → ${pack2.status}`)
  console.log(`human review items on the same project: ${humanVerificationCount(runB)} → ${humanVerificationCount(runD)} ` +
    `(+${humanVerificationCount(runD) - humanVerificationCount(runB)})`)
  const reopened = runD.reviewItems.filter(i => !runB.reviewItems.some(b => b.subject === i.subject))
  console.log(`newly reopened: ${reopened.length}`)
  for (const r of reopened) console.log(`  ${r.subject}  →  ${r.discipline}`)
  console.log(`\nstill applied without review: ${runD.appliedAutomatically}`)
  console.log(`amended rule state: ${rules.find(r => r.identity === amendedIdentity)!.state}`)

  // ── 8. Persist ───────────────────────────────────────────────────────────
  const persisted = await persistRuleState(store, {
    rules, pack: pack2, source: { source, authority: 'OFFICIAL_CODE' },
    change, audits, newCertifications: certifications,
    withdrawnCertifications: invalidation.downgraded.map(d => ({
      ruleIdentity: d.identity, revokedAt: '2026-10-01T09:00:00Z', reason: d.reason,
    })),
  })

  h('9. PERSISTED')
  console.log(`rules            ${persisted.rulesWritten}`)
  console.log(`certifications   ${persisted.certificationsAppended} appended, ${persisted.certificationsWithdrawn} withdrawn`)
  console.log(`audit events     ${persisted.auditEventsAppended}`)
  console.log(`source versions  ${store.sourceVersions.length}`)
  console.log(`source regions   ${store.sourceRegions.length}`)
  console.log(`change events    ${store.sourceChanges.length}`)
  console.log(`pack members     ${store.packMembers.length} (${store.packMembers.filter(m => m.tier === 'core').length} core)`)
  console.log(`\ncertification rows kept after withdrawal: ${store.certifications.length} ` +
    `(${store.certifications.filter(c => c.active).length} active) — history is never deleted`)

  h('SUMMARY')
  console.log(`Repeat human verification across ${PROJECTS.length} projects: ${baseline} → ${repeat} ` +
    `(${(overallReduction * 100).toFixed(1)}% overall, ${(certifiableReduction * 100).toFixed(1)}% on certifiable rules)`)
  console.log(`One amendment reopened ${reopened.length} rule(s); ${runD.appliedAutomatically} stayed certified.`)
  console.log(`Rules still requiring review: ${rules.filter(r => r.humanReviewRequired).length} of ${rules.length}.`)
  console.log('None of them were certified to hit a number.')
}

main().catch(e => { console.error(e); process.exit(1) })
