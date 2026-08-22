/**
 * The certification gate.
 *
 * One deterministic function decides whether a rule may become CERTIFIED, and
 * it returns itemised reasons when it says no. There is no silent fallback and
 * no override flag: if the gate fails, the rule stays where it is and a human
 * gets a review item saying exactly what is missing.
 *
 * A certification is bound to the exact source hash and version that was
 * reviewed. That binding is what makes reuse safe — and what makes a source
 * change automatically detach the certification instead of quietly carrying it
 * onto text nobody has read.
 */

import {
  type RuleState, type RuleConfidence, type RuleProvenance, type RuleScope,
  type SourceAuthority, type ConfidenceThresholds,
  CERTIFICATION_THRESHOLDS, canTransition, assessProvenance, authorityProfile,
  evaluateConfidence, ruleIdentity, freshnessConfidence,
} from './model'
import type { ApplicabilityModel, ApplicabilityResult } from './applicability'
import type { Discipline } from '../review/disciplines'

// ── Dual-source reconciliation ──────────────────────────────────────────────

export type ReconciliationStatus =
  | 'MATCH'
  | 'MISMATCH'
  | 'SINGLE_SOURCE_ONLY'
  | 'NOT_REQUIRED'
  | 'PENDING'

export interface SourceReading {
  label: string
  authority: SourceAuthority
  sourceUrl: string | null
  sourceHash: string | null
  retrievedAt: string
  /** The value as printed. */
  rawValue: string
  /** The value after normalisation, which is what gets compared. */
  normalizedValue: string
}

export interface SourceReconciliation {
  status: ReconciliationStatus
  sourceA: SourceReading | null
  sourceB: SourceReading | null
  match: boolean | null
  /** Present on MISMATCH. */
  discrepancy: string | null
  /** Recorded even when only one source exists — the fact itself matters. */
  note: string
  reconciledAt: string
}

/**
 * Normalises a printed value for comparison: "25 ft", "25'", "25 feet" and
 * "25.0" are the same requirement. Footnote markers are stripped for the
 * comparison only — they remain on the rule.
 */
export function normalizeRuleValue(raw: string): string {
  const withoutFootnotes = raw.replace(/\((\d+|[a-z])\)/gi, ' ')
  const numeric = withoutFootnotes.match(/-?\d+(?:\.\d+)?/g)
  if (numeric && numeric.length === 1) {
    return String(Number(numeric[0]))
  }
  return withoutFootnotes.replace(/\s+/g, ' ').trim().toUpperCase()
}

export interface ReconcileSourcesInput {
  /** True when this rule is configured as high-risk and needs two sources. */
  dualSourceRequired: boolean
  sourceA: SourceReading | null
  sourceB: SourceReading | null
  now?: string
}

export function reconcileSources(input: ReconcileSourcesInput): SourceReconciliation {
  const now = input.now ?? new Date().toISOString()
  const { sourceA, sourceB, dualSourceRequired } = input

  if (!dualSourceRequired) {
    return {
      status: 'NOT_REQUIRED', sourceA, sourceB, match: null, discrepancy: null,
      note: 'This rule is not configured as high-risk, so independent-source reconciliation is not required.',
      reconciledAt: now,
    }
  }
  if (!sourceA) {
    return {
      status: 'PENDING', sourceA: null, sourceB, match: null, discrepancy: null,
      note: 'Dual-source verification is required but no primary reading has been captured.',
      reconciledAt: now,
    }
  }
  if (!sourceB) {
    return {
      status: 'SINGLE_SOURCE_ONLY', sourceA, sourceB: null, match: null, discrepancy: null,
      note:
        `Only one authoritative representation exists (${sourceA.label}). Reconciliation is recorded as ` +
        'single-source rather than skipped — a reviewer must confirm that no second authoritative ' +
        'representation is published before certifying.',
      reconciledAt: now,
    }
  }

  const a = normalizeRuleValue(sourceA.normalizedValue)
  const b = normalizeRuleValue(sourceB.normalizedValue)
  const match = a === b
  return {
    status: match ? 'MATCH' : 'MISMATCH',
    sourceA, sourceB, match,
    discrepancy: match ? null : `${sourceA.label} reads ${sourceA.rawValue}; ${sourceB.label} reads ${sourceB.rawValue}.`,
    note: match
      ? `Both authoritative representations normalise to ${a}.`
      : 'The two authoritative representations disagree on the governing value. Certification is blocked ' +
        'until the conflict is resolved — one of them is wrong, or one has been amended and the other has not.',
    reconciledAt: now,
  }
}

// ── Reviewer authority ──────────────────────────────────────────────────────

export type ReviewerRole = Discipline | 'jurisdiction_reviewer' | 'rule_maintainer'

export interface Reviewer {
  id: string
  name: string
  role: ReviewerRole
  /** Licence number where the role requires one. */
  licenceNumber?: string
  state?: string
}

/**
 * Who may certify which class of rule. Certifying a stormwater standard is an
 * engineering judgement; certifying a zoning setback is a planning one. A
 * generic "admin" is not on any list.
 */
export const RULE_TYPE_CERTIFIERS: Record<string, ReviewerRole[]> = {
  dimensional: ['land_use_planner', 'professional_engineer', 'jurisdiction_reviewer'],
  zoning: ['land_use_planner', 'jurisdiction_reviewer'],
  overlay: ['land_use_planner', 'jurisdiction_reviewer'],
  subdivision: ['land_use_planner', 'professional_engineer', 'jurisdiction_reviewer'],
  stormwater: ['professional_engineer', 'jurisdiction_reviewer'],
  sediment_control: ['professional_engineer', 'jurisdiction_reviewer'],
  landscape: ['landscape_architect', 'environmental_professional', 'jurisdiction_reviewer'],
  tree_canopy: ['landscape_architect', 'environmental_professional', 'jurisdiction_reviewer'],
  environmental: ['environmental_professional', 'jurisdiction_reviewer'],
  flood: ['professional_engineer', 'jurisdiction_reviewer'],
  process: ['land_use_planner', 'rule_maintainer', 'jurisdiction_reviewer'],
  reference: ['rule_maintainer', 'land_use_planner', 'jurisdiction_reviewer'],
}

/** The rule-type family a rule key belongs to, for reviewer authority. */
export function ruleTypeFamily(ruleType: string): string {
  const head = ruleType.split('.')[0]
  return head in RULE_TYPE_CERTIFIERS ? head : 'reference'
}

export function mayCertify(reviewer: Reviewer, ruleType: string): { allowed: boolean; reason: string } {
  const family = ruleTypeFamily(ruleType)
  const allowedRoles = RULE_TYPE_CERTIFIERS[family] ?? []
  if (allowedRoles.includes(reviewer.role)) {
    return { allowed: true, reason: `${reviewer.role} may certify ${family} rules.` }
  }
  return {
    allowed: false,
    reason:
      `${reviewer.role} is not authorised to certify ${family} rules. ` +
      `Authorised roles: ${allowedRoles.join(', ') || 'none configured'}.`,
  }
}

// ── Certification record ────────────────────────────────────────────────────

export interface CertificationRecord {
  id: string
  ruleIdentity: string
  jurisdiction: string
  ruleKey: string
  ruleVersion: number
  reviewerId: string
  reviewerName: string
  reviewerRole: ReviewerRole
  reviewerLicenceNumber: string | null
  certifiedAt: string
  /** The exact source this certification was granted against. */
  sourceHash: string
  sourceVersion: string
  note: string
  /** What the certification covers — zones, uses, the conditions reviewed. */
  certificationScope: Record<string, string>
  /** Optional expiry, for jurisdictions that amend on a known cycle. */
  expiresAt: string | null
  active: boolean
  revokedAt: string | null
  revokedReason: string | null
}

// ── The rule ────────────────────────────────────────────────────────────────

export interface CertifiableRule {
  /** Deterministic identity from the scope. Same across projects. */
  identity: string
  scope: RuleScope
  ruleKey: string
  version: number
  state: RuleState
  /** The requirement as extracted, before footnotes. */
  value: string | null
  /** Structured payload for non-scalar rules. */
  payload?: unknown
  provenance: RuleProvenance
  confidence: RuleConfidence
  applicability: ApplicabilityModel
  reconciliation: SourceReconciliation
  certification: CertificationRecord | null
  /** Set when the rule is displaced by a newer version. */
  supersededByIdentity?: string | null
  /**
   * Whether this rule states a REQUIREMENT the jurisdiction reviews against.
   *
   * A source registry naming the GIS endpoint to query, or a model of how the
   * county's review process works, is reference material: getting it wrong
   * breaks the drawing, not the entitlement. Those are advisory — they never
   * gate permit readiness and never raise a project review item. Anything that
   * states a dimension, a buffer, a ratio or a procedure is gating, and the
   * field defaults to gating so a new rule family cannot become advisory by
   * being forgotten.
   */
  gating: boolean
  /** Why the rule is advisory, when it is. */
  advisoryReason?: string
  /** Recorded problems with the source itself — unavailable tables, dead links. */
  sourceIssues: string[]
  humanReviewRequired: boolean
  humanReviewReasons: string[]
}

// ── The gate ────────────────────────────────────────────────────────────────

export interface GateCondition {
  condition: string
  passed: boolean
  detail: string
}

export interface CertificationGateResult {
  eligible: boolean
  conditions: GateCondition[]
  failures: string[]
  /** What must happen next, in order. */
  remediation: string[]
}

export interface CertificationGateInput {
  rule: CertifiableRule
  reviewer: Reviewer
  /** The hash of the source as currently retrieved, to prove currency. */
  currentSourceHash: string | null
  thresholds?: ConfidenceThresholds
  now?: Date
}

/**
 * The central deterministic certification gate.
 *
 * Every condition is evaluated — the function does not short-circuit — so the
 * reviewer sees the whole list rather than fixing one problem at a time.
 */
export function evaluateCertificationGate(input: CertificationGateInput): CertificationGateResult {
  const { rule, reviewer } = input
  const thresholds = input.thresholds ?? CERTIFICATION_THRESHOLDS
  const now = input.now ?? new Date()
  const conditions: GateCondition[] = []
  const remediation: string[] = []
  const add = (condition: string, passed: boolean, detail: string, fix?: string) => {
    conditions.push({ condition, passed, detail })
    if (!passed && fix) remediation.push(fix)
  }

  // 1. State — a rule must have been verified by a human first.
  const transition = canTransition(rule.state, 'CERTIFIED')
  add('Rule is in a state from which certification is permitted', transition.allowed, transition.reason,
    rule.state === 'EXTRACTED'
      ? 'Validate the extraction structurally (→ PROVISIONAL), then have a human confirm the value against the source (→ VERIFIED).'
      : rule.state === 'PROVISIONAL'
        ? 'A human must confirm the value against the source (→ VERIFIED) before it can be certified.'
        : `Cannot certify from ${rule.state}.`)

  // 2. Provenance sufficient to locate the governing language.
  const prov = assessProvenance(rule.provenance)
  add('Authoritative provenance is complete', prov.sufficient,
    prov.sufficient
      ? `Locatable at ${rule.provenance.codeSection} in ${rule.provenance.sourceTitle}.`
      : `Missing: ${prov.missing.join(', ')}.`,
    `Complete the provenance record: ${prov.missing.join(', ')}. Certification against incomplete provenance is refused.`)

  // 3. Source type permitted for certification.
  const authority = authorityProfile(rule.provenance.sourceType)
  add('Source type is permitted for certification', authority.certifiable,
    authority.certifiable
      ? `${authority.label} (authority ${authority.confidence.toFixed(2)}).`
      : `${authority.label} cannot be certified against. ${authority.rationale}`,
    'Retrieve the rule from the codified code, the adopted ordinance, or an official agency publication.')

  // 4-5. Confidence dimensions, each against its own threshold.
  const conf = evaluateConfidence(rule.confidence, thresholds)
  for (const d of conf.dimensions) {
    if (d.value == null) continue
    add(`${d.dimension} meets its threshold`, d.passed, d.detail,
      d.passed ? undefined : `Raise ${d.dimension} above ${d.threshold} or resolve why it is low.`)
  }

  // 6. Applicability must actually be modelled.
  const hasApplicability = Boolean(rule.applicability?.condition)
  const applicabilityComplete = hasApplicability && !rule.applicability.incompleteReason
  add('Applicability model is defined and complete', applicabilityComplete,
    !hasApplicability
      ? 'No applicability model. A rule with no stated conditions would be applied to every project indiscriminately.'
      : rule.applicability.incompleteReason
        ? `Applicability is modelled but incomplete: ${rule.applicability.incompleteReason}`
        : 'Applicability conditions are fully modelled.',
    'Model the conditions under which this rule governs before certifying it.')

  // 7. No unresolved mandatory footnote.
  const mandatoryFootnotes = (rule.applicability.footnotes ?? []).filter(f => f.mandatory)
  const footnotesModelled = mandatoryFootnotes.every(f => f.condition.kind !== 'discretionary')
  add('No unresolved mandatory footnote or exception', footnotesModelled,
    footnotesModelled
      ? `${mandatoryFootnotes.length} mandatory footnote(s), all with evaluable conditions.`
      : 'A mandatory footnote carries a discretionary condition the engine cannot evaluate. The base ' +
        'table value is not the requirement until a human resolves it.',
    'Resolve the discretionary footnote condition, or scope the certification to exclude the cases it covers.')

  // 8. Dual-source reconciliation, where required.
  const rec = rule.reconciliation
  const reconciliationOk = rec.status === 'MATCH' || rec.status === 'NOT_REQUIRED' || rec.status === 'SINGLE_SOURCE_ONLY'
  add('Independent-source reconciliation permits certification', reconciliationOk,
    rec.status === 'MISMATCH'
      ? `Sources disagree. ${rec.discrepancy}`
      : rec.status === 'PENDING'
        ? 'Dual-source verification is required for this rule but has not been performed.'
        : rec.note,
    rec.status === 'MISMATCH'
      ? 'Resolve which authoritative source governs before certifying.'
      : 'Capture the second authoritative reading, or record that none is published.')

  // 9. Source currency — the hash must match what is live now.
  const hashCurrent =
    input.currentSourceHash != null &&
    rule.provenance.sourceHash != null &&
    input.currentSourceHash === rule.provenance.sourceHash
  add('Source hash is current', hashCurrent,
    input.currentSourceHash == null
      ? 'The live source has not been re-fetched, so currency cannot be proven.'
      : rule.provenance.sourceHash == null
        ? 'The rule carries no source hash to compare.'
        : hashCurrent
          ? `Matches ${input.currentSourceHash.slice(0, 16)}….`
          : `Rule was extracted from ${rule.provenance.sourceHash.slice(0, 16)}… but the live source is now ` +
            `${input.currentSourceHash.slice(0, 16)}…. The text has changed since extraction.`,
    'Re-extract against the current source and re-verify before certifying.')

  // 10. No blocking source issue.
  const noSourceIssues = rule.sourceIssues.length === 0
  add('No unresolved source issue', noSourceIssues,
    noSourceIssues ? 'None recorded.' : rule.sourceIssues.join(' | '),
    'Resolve the recorded source issues — an unavailable table cannot be certified around.')

  // 11. Reviewer is authorised for this class of rule.
  const auth = mayCertify(reviewer, rule.scope.ruleType)
  add('Certifying reviewer holds the required role', auth.allowed, auth.reason,
    'Route this rule to a reviewer holding an authorised role.')

  // 12. Human verification actually happened. VERIFIED is that evidence.
  const verified = rule.state === 'VERIFIED'
  add('Required human verification has occurred', verified,
    verified
      ? 'The rule reached VERIFIED, which records that a human confirmed it against the source.'
      : `The rule is ${rule.state}. Certification requires a prior human verification step.`,
    'Have a qualified reviewer confirm the value against the source and record VERIFIED.')

  // 13. Freshness — not fatal on its own, but reported.
  const fresh = freshnessConfidence(rule.provenance.retrievedAt, now)
  add('Source retrieval is recent enough to certify', fresh >= thresholds.freshness,
    `Freshness ${fresh.toFixed(2)} (retrieved ${rule.provenance.retrievedAt.slice(0, 10)}).`,
    'Re-retrieve the source to confirm it is current.')

  const failures = conditions.filter(c => !c.passed).map(c => `${c.condition} — ${c.detail}`)
  return { eligible: failures.length === 0, conditions, failures, remediation }
}

// ── Audit ───────────────────────────────────────────────────────────────────

export type RuleAuditAction =
  | 'extracted' | 'validated' | 'verified' | 'certified' | 'rejected' | 'revoked'
  | 'superseded' | 'source_changed' | 'reconciled' | 'clarification_requested'
  | 'interpretation_noted' | 'certification_reused'

export interface RuleAuditEvent {
  id: string
  ruleIdentity: string
  jurisdiction: string
  ruleKey: string
  ruleVersion: number
  previousState: RuleState | null
  newState: RuleState | null
  action: RuleAuditAction
  actorId: string
  actorName: string
  actorRole: ReviewerRole | 'system'
  occurredAt: string
  reason: string
  sourceHash: string | null
  sourceVersion: string | null
  reviewItemId: string | null
  rulePackVersion: string | null
  /** Projects that consumed this rule, where the event is project-driven. */
  affectedProjectIds: string[]
  metadata?: Record<string, unknown>
}

let auditSeq = 0
export function ruleAuditEvent(input: Omit<RuleAuditEvent, 'id' | 'occurredAt'> & { occurredAt?: string }): RuleAuditEvent {
  return {
    id: `rae_${Date.now().toString(36)}_${(++auditSeq).toString(36)}`,
    occurredAt: input.occurredAt ?? new Date().toISOString(),
    ...input,
  }
}

// ── Applying a transition ───────────────────────────────────────────────────

export class RuleTransitionError extends Error {
  constructor(readonly code: string, message: string, readonly failures: string[] = []) {
    super(message)
    this.name = 'RuleTransitionError'
  }
}

export interface CertifyResult {
  rule: CertifiableRule
  certification: CertificationRecord
  audit: RuleAuditEvent
}

/**
 * Grants certification. Throws with itemised failures rather than degrading —
 * a caller must not be able to ignore a refusal by accident.
 */
export function certifyRule(input: CertificationGateInput & {
  note: string
  certificationScope?: Record<string, string>
  expiresAt?: string | null
  rulePackVersion?: string | null
  reviewItemId?: string | null
}): CertifyResult {
  const gate = evaluateCertificationGate(input)
  if (!gate.eligible) {
    throw new RuleTransitionError(
      'CERTIFICATION_REFUSED',
      `Certification refused for ${input.rule.identity}: ${gate.failures.length} condition(s) failed.`,
      gate.failures,
    )
  }

  const { rule, reviewer } = input
  const now = (input.now ?? new Date()).toISOString()
  const certification: CertificationRecord = {
    id: `cert_${rule.identity.replace(/[^a-z0-9]+/gi, '_').slice(0, 60)}_${Date.parse(now)}`,
    ruleIdentity: rule.identity,
    jurisdiction: rule.scope.jurisdiction,
    ruleKey: rule.ruleKey,
    ruleVersion: rule.version,
    reviewerId: reviewer.id,
    reviewerName: reviewer.name,
    reviewerRole: reviewer.role,
    reviewerLicenceNumber: reviewer.licenceNumber ?? null,
    certifiedAt: now,
    // Non-null by the gate: it fails when either side is missing.
    sourceHash: rule.provenance.sourceHash as string,
    sourceVersion: rule.provenance.sourceVersion as string,
    note: input.note,
    certificationScope: input.certificationScope ?? rule.scope.scopeKey,
    expiresAt: input.expiresAt ?? null,
    active: true,
    revokedAt: null,
    revokedReason: null,
  }

  const certified: CertifiableRule = {
    ...rule,
    state: 'CERTIFIED',
    certification,
    humanReviewRequired: false,
    humanReviewReasons: [],
  }

  return {
    rule: certified,
    certification,
    audit: ruleAuditEvent({
      ruleIdentity: rule.identity,
      jurisdiction: rule.scope.jurisdiction,
      ruleKey: rule.ruleKey,
      ruleVersion: rule.version,
      previousState: rule.state,
      newState: 'CERTIFIED',
      action: 'certified',
      actorId: reviewer.id,
      actorName: reviewer.name,
      actorRole: reviewer.role,
      occurredAt: now,
      reason: input.note,
      sourceHash: certification.sourceHash,
      sourceVersion: certification.sourceVersion,
      reviewItemId: input.reviewItemId ?? null,
      rulePackVersion: input.rulePackVersion ?? null,
      affectedProjectIds: [],
    }),
  }
}

/** Applies a non-certifying transition, rejecting illegal ones. */
export function transitionRule(input: {
  rule: CertifiableRule
  to: RuleState
  actor: { id: string; name: string; role: ReviewerRole | 'system' }
  reason: string
  reviewItemId?: string | null
  rulePackVersion?: string | null
  now?: string
}): { rule: CertifiableRule; audit: RuleAuditEvent } {
  const { rule, to } = input
  if (to === 'CERTIFIED') {
    throw new RuleTransitionError(
      'USE_CERTIFY_RULE',
      'Certification does not go through transitionRule — it must pass the certification gate. Use certifyRule().',
    )
  }
  const check = canTransition(rule.state, to)
  if (!check.allowed) {
    throw new RuleTransitionError('ILLEGAL_TRANSITION', check.reason)
  }

  const now = input.now ?? new Date().toISOString()
  // `to` cannot be CERTIFIED here (the throw above rules it out), so any
  // transition out of CERTIFIED withdraws the certification.
  const losingCertification = rule.state === 'CERTIFIED'
  const certification: CertificationRecord | null = rule.certification
    ? losingCertification
      ? { ...rule.certification, active: false, revokedAt: now, revokedReason: input.reason }
      : rule.certification
    : null

  const action: RuleAuditAction =
    to === 'REVOKED' ? 'revoked'
    : to === 'SUPERSEDED' ? 'superseded'
    : to === 'VERIFIED' ? 'verified'
    : to === 'PROVISIONAL' ? 'validated'
    : 'extracted'

  return {
    rule: {
      ...rule,
      state: to,
      certification,
      // Every state reachable through this function is one a project may not
      // apply automatically.
      humanReviewRequired: true,
      humanReviewReasons: [input.reason],
    },
    audit: ruleAuditEvent({
      ruleIdentity: rule.identity,
      jurisdiction: rule.scope.jurisdiction,
      ruleKey: rule.ruleKey,
      ruleVersion: rule.version,
      previousState: rule.state,
      newState: to,
      action,
      actorId: input.actor.id,
      actorName: input.actor.name,
      actorRole: input.actor.role,
      occurredAt: now,
      reason: input.reason,
      sourceHash: rule.provenance.sourceHash,
      sourceVersion: rule.provenance.sourceVersion,
      reviewItemId: input.reviewItemId ?? null,
      rulePackVersion: input.rulePackVersion ?? null,
      affectedProjectIds: [],
    }),
  }
}

// ── Reuse validity ──────────────────────────────────────────────────────────

export interface ReuseCheck {
  reusable: boolean
  reasons: string[]
  blockers: string[]
}

/**
 * Whether a certified rule may be applied to a project WITHOUT raising a new
 * human-verification item. Every condition in section 8 of the brief.
 */
export function checkCertificationReuse(input: {
  rule: CertifiableRule
  jurisdiction: string
  currentSourceHash: string | null
  applicability?: ApplicabilityResult
  now?: Date
}): ReuseCheck {
  const { rule } = input
  const reasons: string[] = []
  const blockers: string[] = []
  const now = input.now ?? new Date()

  if (rule.state !== 'CERTIFIED') {
    blockers.push(`The rule is ${rule.state}, not CERTIFIED.`)
  } else {
    reasons.push('The rule is CERTIFIED.')
  }

  const cert = rule.certification
  if (!cert) {
    blockers.push('No certification record is attached.')
  } else {
    if (!cert.active) blockers.push(`The certification was withdrawn: ${cert.revokedReason ?? 'no reason recorded'}.`)
    else reasons.push(`Certified by ${cert.reviewerName} (${cert.reviewerRole}) on ${cert.certifiedAt.slice(0, 10)}.`)

    if (cert.expiresAt && Date.parse(cert.expiresAt) < now.getTime()) {
      blockers.push(`The certification expired on ${cert.expiresAt.slice(0, 10)}.`)
    }
    if (cert.jurisdiction !== input.jurisdiction) {
      blockers.push(`Certified for ${cert.jurisdiction}, not ${input.jurisdiction}. A certification does not travel between jurisdictions.`)
    } else {
      reasons.push(`Jurisdiction matches (${input.jurisdiction}).`)
    }

    // The binding that makes reuse safe.
    if (input.currentSourceHash == null) {
      blockers.push('The current source hash is unknown, so the certification cannot be proven to still apply.')
    } else if (cert.sourceHash !== input.currentSourceHash) {
      blockers.push(
        `The certification is bound to source ${cert.sourceHash.slice(0, 16)}… but the current source is ` +
        `${input.currentSourceHash.slice(0, 16)}…. The ordinance text has changed since it was reviewed.`,
      )
    } else {
      reasons.push(`Source hash matches the certified version (${cert.sourceHash.slice(0, 16)}…).`)
    }
  }

  if (rule.supersededByIdentity) {
    blockers.push(`Superseded by ${rule.supersededByIdentity}.`)
  }
  if (rule.sourceIssues.length) {
    blockers.push(`Unresolved source issue: ${rule.sourceIssues.join(' | ')}`)
  }

  const a = input.applicability
  if (a) {
    if (a.applies === 'unknown') {
      blockers.push(`Applicability is unresolved: ${a.unresolvedConditions.join('; ')}`)
    } else if (a.applies === true) {
      if (a.overriddenBy) {
        blockers.push(`Displaced on this project by ${a.overriddenBy.ruleIdentity}: ${a.overriddenBy.reason}`)
      }
      if (a.unresolvedMandatoryFootnotes.length) {
        blockers.push(
          `Mandatory footnote(s) ${a.unresolvedMandatoryFootnotes.join(', ')} are unresolved on this project, ` +
          'so the certified base value is not the governing requirement here.',
        )
      }
      if (!a.overriddenBy && !a.unresolvedMandatoryFootnotes.length) {
        reasons.push('Applicability conditions resolved deterministically for this project.')
      }
    }
  }

  return { reusable: blockers.length === 0, reasons, blockers }
}

