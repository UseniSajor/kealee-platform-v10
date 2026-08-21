/**
 * Versioned jurisdiction rule packs.
 *
 * A pack is the unit a jurisdiction is maintained as. Its status is computed
 * from its members rather than declared, so a pack cannot advertise itself as
 * CERTIFIED while its core rules sit unverified.
 *
 * The distinction that makes this work is CORE versus SUPPORTING. A pack may be
 * CERTIFIED with unresolved supporting rules — the §25-128 canopy table, for
 * instance — provided every core rule is certified and every unresolved rule
 * stays explicitly human-review-required. What it may not do is hide them.
 */

import type { CertifiableRule } from './certification'
import type { RuleState } from './model'

export type RulePackStatus =
  | 'DRAFT'
  | 'PARTIALLY_CERTIFIED'
  | 'CERTIFIED'
  | 'STALE'
  | 'SUPERSEDED'

/** Rules a package cannot be produced without. */
export type RuleTier = 'core' | 'supporting'

export interface RulePackMember {
  ruleIdentity: string
  ruleKey: string
  tier: RuleTier
  state: RuleState
  humanReviewRequired: boolean
}

export interface SourceIssue {
  sourceId: string | null
  ruleKey: string
  issue: string
  raisedAt: string
  /** Why it cannot simply be fixed — usually "the document is not published". */
  blocker: string
}

export interface RulePack {
  jurisdiction: string
  packVersion: string
  effectiveDate: string
  status: RulePackStatus
  /** Source id → version and hash the pack was built against. */
  sources: { sourceId: string; title: string; version: string; documentHash: string; retrievedAt: string }[]
  members: RulePackMember[]
  certifiedCount: number
  verifiedCount: number
  provisionalCount: number
  extractedCount: number
  supersededCount: number
  revokedCount: number
  humanReviewRequiredCount: number
  coreCount: number
  coreCertifiedCount: number
  unresolvedSourceIssues: SourceIssue[]
  lastRefreshedAt: string | null
  lastCertifiedAt: string | null
  /** Certified ÷ (certified + everything still in play). */
  certificationCoverage: number
  /** Certified ÷ core. The number that decides whether the pack is CERTIFIED. */
  coreCertificationCoverage: number
  statusRationale: string
}

export interface BuildPackInput {
  jurisdiction: string
  packVersion: string
  effectiveDate: string
  rules: CertifiableRule[]
  /** Rule keys that are core. Everything else is supporting. */
  coreRuleKeys: string[]
  sources: RulePack['sources']
  unresolvedSourceIssues?: SourceIssue[]
  lastRefreshedAt?: string | null
  supersededByVersion?: string | null
  /** Refreshes older than this make the pack STALE. */
  staleAfterDays?: number
  now?: Date
}

export function buildRulePack(input: BuildPackInput): RulePack {
  const now = input.now ?? new Date()
  const core = new Set(input.coreRuleKeys)

  const members: RulePackMember[] = input.rules.map(r => ({
    ruleIdentity: r.identity,
    ruleKey: r.ruleKey,
    tier: core.has(r.ruleKey) ? 'core' : 'supporting',
    state: r.state,
    humanReviewRequired: r.humanReviewRequired,
  }))

  const count = (s: RuleState) => members.filter(m => m.state === s).length
  const certifiedCount = count('CERTIFIED')
  const supersededCount = count('SUPERSEDED')
  const revokedCount = count('REVOKED')

  const coreMembers = members.filter(m => m.tier === 'core')
  const coreCertifiedCount = coreMembers.filter(m => m.state === 'CERTIFIED').length

  // Retired rules are excluded from coverage: a pack should not look worse for
  // having correctly retired a rule the county deleted.
  const inPlay = members.filter(m => m.state !== 'SUPERSEDED' && m.state !== 'REVOKED')
  const certificationCoverage = inPlay.length === 0 ? 0 : Number((certifiedCount / inPlay.length).toFixed(4))
  const coreCertificationCoverage = coreMembers.length === 0 ? 0 : Number((coreCertifiedCount / coreMembers.length).toFixed(4))

  const lastCertifiedAt = input.rules
    .map(r => r.certification?.certifiedAt)
    .filter((d): d is string => Boolean(d))
    .sort()
    .pop() ?? null

  const staleAfterDays = input.staleAfterDays ?? 180
  const ageDays = input.lastRefreshedAt
    ? (now.getTime() - Date.parse(input.lastRefreshedAt)) / 86_400_000
    : Infinity
  const isStale = ageDays > staleAfterDays

  let status: RulePackStatus
  let statusRationale: string

  if (input.supersededByVersion) {
    status = 'SUPERSEDED'
    statusRationale = `Replaced by pack version ${input.supersededByVersion}.`
  } else if (certifiedCount === 0) {
    status = 'DRAFT'
    statusRationale =
      `No rule in this pack is certified yet. ${members.length} rule(s) extracted; every one of them ` +
      'requires human verification before it can be applied without review.'
  } else if (isStale) {
    status = 'STALE'
    statusRationale = input.lastRefreshedAt
      ? `The sources were last refreshed ${Math.round(ageDays)} days ago, beyond the ${staleAfterDays}-day ` +
        'window. Certifications stand but currency is unproven — refresh before relying on them.'
      : 'The sources have never been refreshed since the pack was built.'
  } else if (coreMembers.length > 0 && coreCertifiedCount === coreMembers.length) {
    status = 'CERTIFIED'
    const unresolved = members.filter(m => m.humanReviewRequired).length
    statusRationale =
      `All ${coreMembers.length} core rule(s) are certified. ` +
      (unresolved > 0
        ? `${unresolved} supporting rule(s) remain human-review-required and are listed explicitly — a ` +
          'certified pack does not mean every rule in it is settled.'
        : 'No rule in the pack requires human review.')
  } else {
    status = 'PARTIALLY_CERTIFIED'
    statusRationale =
      `${certifiedCount} of ${inPlay.length} rule(s) certified, but ${coreMembers.length - coreCertifiedCount} ` +
      'core rule(s) are not. The pack cannot be relied on unattended until every core rule is certified.'
  }

  return {
    jurisdiction: input.jurisdiction,
    packVersion: input.packVersion,
    effectiveDate: input.effectiveDate,
    status,
    sources: input.sources,
    members,
    certifiedCount,
    verifiedCount: count('VERIFIED'),
    provisionalCount: count('PROVISIONAL'),
    extractedCount: count('EXTRACTED'),
    supersededCount,
    revokedCount,
    humanReviewRequiredCount: members.filter(m => m.humanReviewRequired).length,
    coreCount: coreMembers.length,
    coreCertifiedCount,
    unresolvedSourceIssues: input.unresolvedSourceIssues ?? [],
    lastRefreshedAt: input.lastRefreshedAt ?? null,
    lastCertifiedAt,
    certificationCoverage,
    coreCertificationCoverage,
    statusRationale,
  }
}

/** Packs a project may rely on without a blanket manual review of every rule. */
export const MATURE_PACK_STATUSES: RulePackStatus[] = ['CERTIFIED', 'PARTIALLY_CERTIFIED']

export function isPackUsable(pack: RulePack): { usable: boolean; reason: string } {
  if (pack.status === 'SUPERSEDED') {
    return { usable: false, reason: `Pack ${pack.packVersion} has been superseded. Load the current pack.` }
  }
  if (pack.status === 'DRAFT') {
    return {
      usable: true,
      reason:
        'A DRAFT pack is usable for drafting, but every rule in it raises a human-review item. That is the ' +
        'pre-certification baseline, not a failure.',
    }
  }
  if (pack.status === 'STALE') {
    return {
      usable: true,
      reason:
        'A STALE pack keeps its certifications — staleness is unproven currency, not a known amendment — ' +
        'but a source refresh should be run before a permit submission relies on it.',
    }
  }
  return { usable: true, reason: pack.statusRationale }
}
