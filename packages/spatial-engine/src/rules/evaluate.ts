/**
 * Project evaluation against a jurisdiction rule pack.
 *
 * This is the hot path and the whole point of Phase 3C. The lookup is:
 *
 *   project → jurisdiction pack → rule identity → active certification →
 *   applicability → result
 *
 * No document is fetched, no HTML is parsed, no model is called. Extraction and
 * source refresh happen in the maintenance workflow, not here — which is what
 * makes this suitable for a request path and what stops the same R-55 front
 * setback being re-verified once per parcel forever.
 *
 * Review items are created only where a human is genuinely needed. A certified,
 * unchanged, deterministically-applicable rule produces no review item at all.
 */

import type { CertifiableRule, ReviewerRole } from './certification'
import { checkCertificationReuse, ruleTypeFamily, RULE_TYPE_CERTIFIERS } from './certification'
import type { ProjectContext, ApplicabilityResult } from './applicability'
import { evaluateApplicability } from './applicability'
import { authorityProfile } from './model'
import type { RulePack } from './pack'
import type { Discipline, ReviewItem } from '../review/disciplines'

// ── Outcomes ────────────────────────────────────────────────────────────────

export type RuleOutcome =
  /** Applied automatically. No human involved. */
  | 'APPLIED_CERTIFIED'
  /** Determined not to govern this project. No human involved. */
  | 'NOT_APPLICABLE'
  /** Usable for drafting, but a human must confirm before the package is relied on. */
  | 'REVIEW_REQUIRED'
  /** Cannot proceed at all until resolved. */
  | 'BLOCKED'

export type ReviewReasonCode =
  | 'RULE_NOT_CERTIFIED'
  | 'SOURCE_CHANGED'
  | 'APPLICABILITY_UNRESOLVED'
  | 'UNRESOLVED_FOOTNOTE'
  | 'OVERLAY_OVERRIDE'
  | 'SECONDARY_SOURCE_ONLY'
  | 'SOURCE_CONFLICT'
  | 'SOURCE_UNAVAILABLE'
  | 'CERTIFICATION_EXPIRED'
  | 'CERTIFICATION_REVOKED'
  | 'RULE_SUPERSEDED'
  | 'DISCRETIONARY_INTERPRETATION'
  | 'AMBIGUOUS_TABLE_STRUCTURE'

export interface RuleEvaluation {
  ruleIdentity: string
  ruleKey: string
  ruleType: string
  outcome: RuleOutcome
  /** The requirement to build to, when one was determined. */
  effectiveValue: string | null
  /** The base table value, kept distinct so a footnote override is visible. */
  baseValue: string | null
  applicability: ApplicabilityResult
  reviewReasons: { code: ReviewReasonCode; detail: string }[]
  /** True when this evaluation consumed an existing certification. */
  reusedCertification: boolean
  certificationId: string | null
  rationale: string
}

export interface ProjectRuleEvaluation {
  projectId: string
  jurisdiction: string
  packVersion: string
  evaluations: RuleEvaluation[]
  reviewItems: ReviewItem[]
  appliedAutomatically: number
  reviewRequired: number
  blocked: number
  notApplicable: number
  reusedCertifications: number
  /** No blocking rule outstanding. Not a claim that the jurisdiction approved anything. */
  regulatorilyResolved: boolean
  permitReadyBlocked: string[]
  summary: string
}

// ── Review routing ──────────────────────────────────────────────────────────

/**
 * Which discipline resolves which kind of question. Reuses the Phase 3B
 * discipline vocabulary rather than inventing a parallel one.
 */
const REASON_DISCIPLINE: Record<ReviewReasonCode, Discipline> = {
  RULE_NOT_CERTIFIED: 'land_use_planner',
  SOURCE_CHANGED: 'land_use_planner',
  APPLICABILITY_UNRESOLVED: 'land_use_planner',
  UNRESOLVED_FOOTNOTE: 'land_use_planner',
  OVERLAY_OVERRIDE: 'land_use_planner',
  SECONDARY_SOURCE_ONLY: 'land_use_planner',
  SOURCE_CONFLICT: 'land_use_planner',
  SOURCE_UNAVAILABLE: 'land_use_planner',
  CERTIFICATION_EXPIRED: 'land_use_planner',
  CERTIFICATION_REVOKED: 'land_use_planner',
  RULE_SUPERSEDED: 'land_use_planner',
  DISCRETIONARY_INTERPRETATION: 'land_use_planner',
  AMBIGUOUS_TABLE_STRUCTURE: 'land_use_planner',
}

/** Rule families whose questions belong to a technical discipline, not planning. */
const FAMILY_DISCIPLINE: Record<string, Discipline> = {
  stormwater: 'professional_engineer',
  sediment_control: 'professional_engineer',
  flood: 'professional_engineer',
  landscape: 'landscape_architect',
  tree_canopy: 'environmental_professional',
  environmental: 'environmental_professional',
  subdivision: 'land_use_planner',
  dimensional: 'land_use_planner',
  zoning: 'land_use_planner',
  overlay: 'land_use_planner',
  process: 'land_use_planner',
  reference: 'land_use_planner',
}

export function routeReviewDiscipline(ruleType: string, reason: ReviewReasonCode): Discipline {
  return FAMILY_DISCIPLINE[ruleTypeFamily(ruleType)] ?? REASON_DISCIPLINE[reason]
}

/** Reviewer roles authorised to certify a rule of this type — for the review item. */
export function authorisedCertifiers(ruleType: string): ReviewerRole[] {
  return RULE_TYPE_CERTIFIERS[ruleTypeFamily(ruleType)] ?? []
}

// ── Evaluation ──────────────────────────────────────────────────────────────

export interface EvaluateRuleInput {
  rule: CertifiableRule
  context: ProjectContext
  /** Current hash of the region this rule came from. */
  currentSourceHash: string | null
  now?: Date
}

export function evaluateRule(input: EvaluateRuleInput): RuleEvaluation {
  const { rule, context } = input
  const reviewReasons: RuleEvaluation['reviewReasons'] = []
  const add = (code: ReviewReasonCode, detail: string) => reviewReasons.push({ code, detail })

  const applicability = evaluateApplicability(rule.applicability, context, rule.value ?? undefined)

  // An advisory rule states no requirement, so there is nothing for a
  // jurisdiction reviewer to confirm and nothing to hold up a submission.
  if (rule.gating === false) {
    return {
      ruleIdentity: rule.identity,
      ruleKey: rule.ruleKey,
      ruleType: rule.scope.ruleType,
      outcome: 'NOT_APPLICABLE',
      effectiveValue: applicability.effectiveValue ?? rule.value,
      baseValue: rule.value,
      applicability,
      reviewReasons: [],
      reusedCertification: rule.state === 'CERTIFIED' && rule.certification != null,
      certificationId: rule.certification?.id ?? null,
      rationale:
        `Advisory rule — it states no requirement the jurisdiction reviews against. ` +
        `${rule.advisoryReason ?? ''}`.trim(),
    }
  }

  // A rule that plainly does not govern needs no certification and no human.
  if (applicability.applies === false) {
    return {
      ruleIdentity: rule.identity,
      ruleKey: rule.ruleKey,
      ruleType: rule.scope.ruleType,
      outcome: 'NOT_APPLICABLE',
      effectiveValue: null,
      baseValue: rule.value,
      applicability,
      reviewReasons: [],
      reusedCertification: false,
      certificationId: null,
      rationale: 'The rule does not govern this project, so its certification status is irrelevant here.',
    }
  }

  // ── Source-level problems block regardless of certification ──────────────
  let blocked = false
  if (rule.reconciliation.status === 'MISMATCH') {
    add('SOURCE_CONFLICT',
      `Two authoritative sources disagree on this requirement. ${rule.reconciliation.discrepancy ?? ''} ` +
      'Building to either value is a guess about which one the county will enforce.')
    blocked = true
  }
  if (rule.sourceIssues.length > 0) {
    add('SOURCE_UNAVAILABLE', rule.sourceIssues.join(' | '))
  }

  const authority = authorityProfile(rule.provenance.sourceType)
  if (!authority.certifiable) {
    add('SECONDARY_SOURCE_ONLY',
      `${authority.label}: ${authority.rationale} This requirement must be confirmed against the ` +
      'governing text before it is used.')
  }

  // ── Certification reuse ──────────────────────────────────────────────────
  const reuse = checkCertificationReuse({
    rule,
    jurisdiction: context.jurisdiction,
    currentSourceHash: input.currentSourceHash,
    applicability,
    now: input.now,
  })

  if (!reuse.reusable) {
    for (const b of reuse.blockers) {
      if (/source .* has changed|ordinance text has changed/i.test(b)) add('SOURCE_CHANGED', b)
      else if (/expired/i.test(b)) add('CERTIFICATION_EXPIRED', b)
      else if (/withdrawn/i.test(b)) add('CERTIFICATION_REVOKED', b)
      else if (/superseded/i.test(b)) add('RULE_SUPERSEDED', b)
      else if (/applicability is unresolved/i.test(b)) add('APPLICABILITY_UNRESOLVED', b)
      else if (/footnote/i.test(b)) add('UNRESOLVED_FOOTNOTE', b)
      else if (/displaced/i.test(b)) add('OVERLAY_OVERRIDE', b)
      else if (/not CERTIFIED|no certification record/i.test(b)) add('RULE_NOT_CERTIFIED', b)
      else add('RULE_NOT_CERTIFIED', b)
    }
  }

  // Discretionary conditions are never resolvable by the engine.
  const discretionary = applicability.unresolvedConditions.filter(c => /discretionary/i.test(c))
  if (discretionary.length) {
    add('DISCRETIONARY_INTERPRETATION',
      `${discretionary.length} condition(s) require a jurisdiction interpretation that is not reducible ` +
      `to deterministic logic: ${discretionary.join('; ')}`)
  }

  const outcome: RuleOutcome =
    blocked ? 'BLOCKED'
    : reviewReasons.length > 0 ? 'REVIEW_REQUIRED'
    : 'APPLIED_CERTIFIED'

  const reused = outcome === 'APPLIED_CERTIFIED' && rule.certification != null

  return {
    ruleIdentity: rule.identity,
    ruleKey: rule.ruleKey,
    ruleType: rule.scope.ruleType,
    outcome,
    effectiveValue: applicability.effectiveValue ?? rule.value,
    baseValue: rule.value,
    applicability,
    reviewReasons,
    reusedCertification: reused,
    certificationId: reused ? rule.certification!.id : null,
    rationale:
      outcome === 'APPLIED_CERTIFIED'
        ? `Applied from certification ${rule.certification?.id ?? 'n/a'} without human review: ` +
          reuse.reasons.join(' ')
        : outcome === 'BLOCKED'
          ? 'Blocked: the governing requirement cannot be determined from the sources available.'
          : `Review required: ${reviewReasons.map(r => r.code).join(', ')}.`,
  }
}

let itemSeq = 0

export interface EvaluateProjectInput {
  projectId: string
  context: ProjectContext
  pack: RulePack
  rules: CertifiableRule[]
  /** Current hash per source region, keyed by rule identity. Absent = unknown. */
  currentSourceHashes: Record<string, string | null>
  now?: Date
}

export function evaluateProjectRules(input: EvaluateProjectInput): ProjectRuleEvaluation {
  const evaluations = input.rules.map(rule =>
    evaluateRule({
      rule,
      context: input.context,
      // Falling back to the rule's own hash means "we have not refreshed", not
      // "it changed" — a refresh gap must not masquerade as an amendment.
      currentSourceHash: input.currentSourceHashes[rule.identity] ?? rule.provenance.sourceHash,
      now: input.now,
    }),
  )

  const reviewItems: ReviewItem[] = []
  for (const e of evaluations) {
    if (e.outcome === 'APPLIED_CERTIFIED' || e.outcome === 'NOT_APPLICABLE') continue
    // One item per rule, not one per reason — a reviewer resolves the rule.
    const primary = e.reviewReasons[0]
    if (!primary) continue
    reviewItems.push({
      id: `rule-rev-${++itemSeq}`,
      discipline: routeReviewDiscipline(e.ruleType, primary.code),
      sheet: null,
      subject: `${e.ruleKey} — ${primary.code.replace(/_/g, ' ').toLowerCase()}`,
      decision: 'PENDING',
      platformNote:
        e.reviewReasons.map(r => `[${r.code}] ${r.detail}`).join('\n') +
        `\n\nAuthorised to certify: ${authorisedCertifiers(e.ruleType).join(', ') || 'none configured'}.` +
        '\nResolving this at the jurisdiction level certifies the rule for every future project.',
    })
  }

  const appliedAutomatically = evaluations.filter(e => e.outcome === 'APPLIED_CERTIFIED').length
  const reviewRequired = evaluations.filter(e => e.outcome === 'REVIEW_REQUIRED').length
  const blocked = evaluations.filter(e => e.outcome === 'BLOCKED').length
  const notApplicable = evaluations.filter(e => e.outcome === 'NOT_APPLICABLE').length
  const reusedCertifications = evaluations.filter(e => e.reusedCertification).length

  // A project is never permit-ready on unresolved regulatory rules. Blocked and
  // review-required rules both count — a setback nobody has confirmed is not a
  // setback you can submit.
  const permitReadyBlocked = evaluations
    .filter(e => e.outcome === 'BLOCKED' || e.outcome === 'REVIEW_REQUIRED')
    .map(e => `${e.ruleKey}: ${e.reviewReasons[0]?.code ?? 'unresolved'}`)

  return {
    projectId: input.projectId,
    jurisdiction: input.context.jurisdiction,
    packVersion: input.pack.packVersion,
    evaluations,
    reviewItems,
    appliedAutomatically,
    reviewRequired,
    blocked,
    notApplicable,
    reusedCertifications,
    regulatorilyResolved: permitReadyBlocked.length === 0,
    permitReadyBlocked,
    summary:
      `${evaluations.length} rule(s) evaluated against ${input.pack.jurisdiction} pack ` +
      `${input.pack.packVersion} (${input.pack.status}). ` +
      `${appliedAutomatically} applied from certification with no human review, ` +
      `${notApplicable} not applicable, ${reviewRequired} need review, ${blocked} blocked. ` +
      (permitReadyBlocked.length === 0
        ? 'No unresolved regulatory rule. Jurisdiction approval is separate and not implied.'
        : `The project is NOT permit-ready: ${permitReadyBlocked.length} regulatory rule(s) unresolved.`),
  }
}

/** Human-verification demand for a project — the number Phase 3C exists to cut. */
export function humanVerificationCount(result: ProjectRuleEvaluation): number {
  return result.reviewItems.length
}
