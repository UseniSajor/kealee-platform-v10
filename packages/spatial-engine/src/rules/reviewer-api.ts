/**
 * The reviewer-facing model.
 *
 * A reviewer certifying a rule is making a legal judgement, and they can only
 * make it if they can see the source text, the provenance, what the engine
 * inferred, and what it could not resolve. This assembles that view and defines
 * the actions that may be taken on it. The frontend is deferred; the contract
 * is not, because the audit obligations attach to the actions rather than to
 * whatever renders them.
 */

import type {
  CertifiableRule, CertificationRecord, Reviewer, RuleAuditEvent,
  CertificationGateResult, SourceReconciliation,
} from './certification'
import {
  evaluateCertificationGate, certifyRule, transitionRule, mayCertify,
  ruleAuditEvent, RuleTransitionError, ruleTypeFamily, RULE_TYPE_CERTIFIERS,
} from './certification'
import { assessProvenance, authorityProfile, evaluateConfidence, type ProvenanceAssessment } from './model'
import { describeCondition, type ProjectContext, type Condition, type RuleFootnote } from './applicability'
import type { SourceChange } from './change-detection'

// ── The view ────────────────────────────────────────────────────────────────

export interface RuleReviewView {
  ruleIdentity: string
  ruleKey: string
  ruleType: string
  version: number
  state: CertifiableRule['state']
  jurisdiction: string

  /** The rule as the engine understands it. */
  normalizedRule: {
    value: string | null
    codeSection: string | null
    table: string | null
    row: string | null
    column: string | null
    scope: Record<string, string>
  }

  /** Verbatim text and where to find it. */
  sourceExcerpt: {
    title: string
    url: string | null
    documentId: string | null
    section: string | null
    pageNumber: number | null
    excerpt: string | null
    /** Everything needed to reopen the exact text. */
    locator: string
  }

  provenance: CertifiableRule['provenance']
  provenanceAssessment: ProvenanceAssessment
  authority: ReturnType<typeof authorityProfile>

  confidence: CertifiableRule['confidence']
  confidenceGate: ReturnType<typeof evaluateConfidence>

  applicabilityLogic: {
    condition: string
    footnotes: { marker: string; text: string; effect: string; condition: string; mandatory: boolean }[]
    overriddenBy: { ruleIdentity: string; condition: string; reason: string }[]
    incompleteReason: string | null
  }

  sourceComparison: SourceReconciliation
  /** Zones and uses this certification would cover. */
  affectedScope: Record<string, string>
  unresolvedConditions: string[]
  sourceIssues: string[]

  /** Every prior certification, active or withdrawn. Never pruned. */
  certificationHistory: CertificationRecord[]
  auditHistory: RuleAuditEvent[]
  sourceChangeDiff: SourceChange[]

  /** What would happen if this reviewer pressed Certify right now. */
  gate: CertificationGateResult
  /** Actions this reviewer may take, given their role. */
  availableActions: ReviewerActionKind[]
}

export interface BuildReviewViewInput {
  rule: CertifiableRule
  reviewer: Reviewer
  currentSourceHash: string | null
  sourceExcerpt?: string | null
  certificationHistory?: CertificationRecord[]
  auditHistory?: RuleAuditEvent[]
  sourceChangeDiff?: SourceChange[]
  /** Optional project context, when the review was raised from a project. */
  context?: ProjectContext
  now?: Date
}

export function buildRuleReviewView(input: BuildReviewViewInput): RuleReviewView {
  const { rule, reviewer } = input
  const p = rule.provenance
  const gate = evaluateCertificationGate({
    rule, reviewer, currentSourceHash: input.currentSourceHash, now: input.now,
  })

  const locatorParts = [
    p.codeTitle, p.codeSection, p.subsection, p.table,
    p.row ? `row "${p.row}"` : null,
    p.column ? `column "${p.column}"` : null,
    p.pageNumber != null ? `p. ${p.pageNumber}` : null,
    p.footnote ? `footnote ${p.footnote}` : null,
  ].filter(Boolean)

  const canCertify = mayCertify(reviewer, rule.scope.ruleType).allowed
  const availableActions: ReviewerActionKind[] = [
    'request_source_clarification',
    'add_interpretation_note',
  ]
  if (rule.state === 'EXTRACTED') availableActions.push('validate')
  if (rule.state === 'PROVISIONAL') availableActions.push('verify', 'reject')
  if ((rule.applicability.footnotes ?? []).some(f => f.condition.kind === 'discretionary')) {
    availableActions.push('resolve_footnote')
  }
  if (rule.state === 'VERIFIED') {
    availableActions.push('reject')
    if (canCertify) availableActions.push('certify')
  }
  if (rule.state === 'CERTIFIED') availableActions.push('revoke', 'mark_superseded')
  if (rule.state === 'PROVISIONAL' || rule.state === 'EXTRACTED') availableActions.push('revoke')

  return {
    ruleIdentity: rule.identity,
    ruleKey: rule.ruleKey,
    ruleType: rule.scope.ruleType,
    version: rule.version,
    state: rule.state,
    jurisdiction: rule.scope.jurisdiction,

    normalizedRule: {
      value: rule.value,
      codeSection: p.codeSection,
      table: p.table ?? null,
      row: p.row ?? null,
      column: p.column ?? null,
      scope: rule.scope.scopeKey,
    },

    sourceExcerpt: {
      title: p.sourceTitle,
      url: p.sourceUrl,
      documentId: p.sourceDocumentId ?? null,
      section: p.codeSection,
      pageNumber: p.pageNumber ?? null,
      excerpt: input.sourceExcerpt ?? null,
      locator: locatorParts.join(', ') || 'No locator recorded — this alone blocks certification.',
    },

    provenance: p,
    provenanceAssessment: assessProvenance(p),
    authority: authorityProfile(p.sourceType),

    confidence: rule.confidence,
    confidenceGate: evaluateConfidence(rule.confidence),

    applicabilityLogic: {
      condition: describeCondition(rule.applicability.condition),
      footnotes: (rule.applicability.footnotes ?? []).map(f => ({
        marker: f.marker,
        text: f.text,
        effect: f.effect,
        condition: describeCondition(f.condition),
        mandatory: f.mandatory,
      })),
      overriddenBy: (rule.applicability.overriddenBy ?? []).map(o => ({
        ruleIdentity: o.ruleIdentity,
        condition: describeCondition(o.condition),
        reason: o.reason,
      })),
      incompleteReason: rule.applicability.incompleteReason ?? null,
    },

    sourceComparison: rule.reconciliation,
    affectedScope: rule.scope.scopeKey,
    unresolvedConditions: rule.humanReviewReasons,
    sourceIssues: rule.sourceIssues,

    certificationHistory: input.certificationHistory ?? (rule.certification ? [rule.certification] : []),
    auditHistory: input.auditHistory ?? [],
    sourceChangeDiff: input.sourceChangeDiff ?? [],

    gate,
    availableActions,
  }
}

// ── Actions ─────────────────────────────────────────────────────────────────

export type ReviewerActionKind =
  | 'validate'
  | 'verify'
  | 'certify'
  | 'resolve_footnote'
  | 'reject'
  | 'revoke'
  | 'mark_superseded'
  | 'request_source_clarification'
  | 'add_interpretation_note'

export interface ReviewerAction {
  kind: ReviewerActionKind
  reviewer: Reviewer
  rule: CertifiableRule
  note: string
  currentSourceHash?: string | null
  certificationScope?: Record<string, string>
  expiresAt?: string | null
  supersededByIdentity?: string | null
  reviewItemId?: string | null
  rulePackVersion?: string | null
  now?: Date
  /**
   * For `resolve_footnote`: the reviewer has read the footnote in the ordinance
   * and is recording the condition under which it actually bites, replacing the
   * placeholder `discretionary` condition captured at extraction time.
   */
  footnoteResolution?: {
    marker: string
    condition: Condition
    /** Verbatim footnote text as printed, now that it has been read. */
    text?: string
    value?: string
    effect?: RuleFootnote['effect']
  }
}

export interface ReviewerActionResult {
  ok: boolean
  rule: CertifiableRule
  certification: CertificationRecord | null
  audit: RuleAuditEvent
  /** Present when the action was refused. Itemised, never a bare "denied". */
  failures: string[]
  message: string
}

/**
 * Applies a reviewer action.
 *
 * Refusals return `ok: false` with reasons rather than throwing, because every
 * one of them is a normal outcome a reviewer needs to read. Only a programming
 * error throws.
 */
export function applyReviewerAction(action: ReviewerAction): ReviewerActionResult {
  const { rule, reviewer, kind } = action
  const now = (action.now ?? new Date()).toISOString()

  const noteEvent = (a: RuleAuditEvent['action'], reason: string) => ruleAuditEvent({
    ruleIdentity: rule.identity,
    jurisdiction: rule.scope.jurisdiction,
    ruleKey: rule.ruleKey,
    ruleVersion: rule.version,
    previousState: rule.state,
    newState: rule.state,
    action: a,
    actorId: reviewer.id,
    actorName: reviewer.name,
    actorRole: reviewer.role,
    occurredAt: now,
    reason,
    sourceHash: rule.provenance.sourceHash,
    sourceVersion: rule.provenance.sourceVersion,
    reviewItemId: action.reviewItemId ?? null,
    rulePackVersion: action.rulePackVersion ?? null,
    affectedProjectIds: [],
  })

  // Resolving a footnote is real work: a person read the ordinance and wrote
  // down when the footnote applies. It changes the model — which is the point —
  // and is audited like any other reviewer act. It cannot invent a condition
  // for a footnote that does not exist on the rule.
  if (kind === 'resolve_footnote') {
    const r = action.footnoteResolution
    const footnotes = rule.applicability.footnotes ?? []
    const target = r ? footnotes.find(f => f.marker === r.marker) : undefined
    if (!r || !target) {
      return {
        ok: false, rule, certification: rule.certification,
        audit: noteEvent('rejected', `No footnote ${r?.marker ?? '(unspecified)'} exists on this rule.`),
        failures: [`Footnote ${r?.marker ?? '(unspecified)'} is not present on ${rule.ruleKey}.`],
        message: 'Cannot resolve a footnote the rule does not carry.',
      }
    }
    const resolved: RuleFootnote = {
      ...target,
      condition: r.condition,
      text: r.text ?? target.text,
      value: r.value ?? target.value,
      effect: r.effect ?? target.effect,
    }
    const updated: CertifiableRule = {
      ...rule,
      applicability: {
        ...rule.applicability,
        footnotes: footnotes.map(f => (f.marker === r.marker ? resolved : f)),
      },
    }
    // Applicability confidence is a coverage measure: it rises when the model
    // genuinely covers more, and only then.
    const stillUnresolved = (updated.applicability.footnotes ?? [])
      .some(f => f.mandatory && f.condition.kind === 'discretionary')
    const withConfidence: CertifiableRule = {
      ...updated,
      confidence: {
        ...updated.confidence,
        applicabilityConfidence: stillUnresolved
          ? updated.confidence.applicabilityConfidence
          : Math.max(updated.confidence.applicabilityConfidence, 0.95),
      },
    }
    return {
      ok: true,
      rule: withConfidence,
      certification: rule.certification,
      audit: noteEvent('interpretation_noted',
        `Footnote ${r.marker} resolved by ${reviewer.name}: ${describeCondition(r.condition)}. ${action.note}`),
      failures: [],
      message: stillUnresolved
        ? `Footnote ${r.marker} resolved; other mandatory footnotes remain unresolved.`
        : `Footnote ${r.marker} resolved. Every mandatory footnote on this rule now has an evaluable condition.`,
    }
  }

  // Non-state-changing actions.
  if (kind === 'request_source_clarification' || kind === 'add_interpretation_note') {
    const a = kind === 'request_source_clarification' ? 'clarification_requested' : 'interpretation_noted'
    return {
      ok: true,
      rule: kind === 'request_source_clarification'
        ? {
            ...rule,
            humanReviewRequired: true,
            humanReviewReasons: [...new Set([...rule.humanReviewReasons, action.note])],
          }
        : rule,
      certification: rule.certification,
      audit: noteEvent(a, action.note),
      failures: [],
      message: kind === 'request_source_clarification'
        ? 'Clarification requested. The rule stays where it is and remains human-review-required.'
        : 'Interpretation note recorded against the rule.',
    }
  }

  if (kind === 'certify') {
    const auth = mayCertify(reviewer, rule.scope.ruleType)
    if (!auth.allowed) {
      return {
        ok: false, rule, certification: rule.certification,
        audit: noteEvent('rejected', `Certification attempt refused: ${auth.reason}`),
        failures: [auth.reason],
        message: `${reviewer.name} is not authorised to certify this rule.`,
      }
    }
    try {
      const result = certifyRule({
        rule, reviewer,
        currentSourceHash: action.currentSourceHash ?? null,
        note: action.note,
        certificationScope: action.certificationScope,
        expiresAt: action.expiresAt,
        reviewItemId: action.reviewItemId,
        rulePackVersion: action.rulePackVersion,
        now: action.now,
      })
      return {
        ok: true,
        rule: result.rule,
        certification: result.certification,
        audit: result.audit,
        failures: [],
        message:
          `Certified against source ${result.certification.sourceHash.slice(0, 16)}…. ` +
          'It will be reused on every future project in scope until that source changes.',
      }
    } catch (e) {
      const failures = e instanceof RuleTransitionError ? e.failures : [String(e)]
      return {
        ok: false, rule, certification: rule.certification,
        audit: noteEvent('rejected', `Certification refused: ${failures.join(' | ')}`),
        failures,
        message: 'Certification refused. Every unmet condition is listed; none of them can be overridden.',
      }
    }
  }

  const target =
    kind === 'validate' ? 'PROVISIONAL' as const
    : kind === 'verify' ? 'VERIFIED' as const
    : kind === 'reject' ? 'PROVISIONAL' as const
    : kind === 'revoke' ? 'REVOKED' as const
    : 'SUPERSEDED' as const

  // Verification is a human reading the value off the source. That act IS the
  // evidence the extraction was correct, so it settles extraction confidence —
  // a machine-parsed 0.88 becomes 1.0 once a person has confirmed the number.
  // It touches nothing else: authority still comes from the document, and
  // applicability still comes from how completely the conditions are modelled.
  const verified = kind === 'verify'
    ? { ...rule, confidence: { ...rule.confidence, extractionConfidence: 1 } }
    : rule

  try {
    const t = transitionRule({
      rule: verified, to: target,
      actor: { id: reviewer.id, name: reviewer.name, role: reviewer.role },
      reason: action.note,
      reviewItemId: action.reviewItemId,
      rulePackVersion: action.rulePackVersion,
      now,
    })
    return {
      ok: true,
      rule: kind === 'mark_superseded'
        ? { ...t.rule, supersededByIdentity: action.supersededByIdentity ?? null }
        : t.rule,
      certification: t.rule.certification,
      audit: t.audit,
      failures: [],
      message: `${rule.state} → ${target}.`,
    }
  } catch (e) {
    const reason = e instanceof RuleTransitionError ? e.message : String(e)
    return {
      ok: false, rule, certification: rule.certification,
      audit: noteEvent('rejected', reason),
      failures: [reason],
      message: reason,
    }
  }
}

/**
 * The maintenance queue: rules a jurisdiction owner should work through, worst
 * first. This is the list that replaces per-project rule review.
 */
export interface MaintenanceQueueEntry {
  ruleIdentity: string
  ruleKey: string
  state: CertifiableRule['state']
  /** How many projects would stop needing review if this rule were certified. */
  projectImpact: number
  blockers: string[]
  authorisedRoles: string[]
  priority: number
}

export function buildMaintenanceQueue(input: {
  rules: CertifiableRule[]
  reviewer: Reviewer
  currentSourceHashes: Record<string, string | null>
  /** Rule identity → number of projects currently raising a review item for it. */
  projectImpact?: Record<string, number>
}): MaintenanceQueueEntry[] {
  const entries: MaintenanceQueueEntry[] = []

  for (const rule of input.rules) {
    if (rule.state === 'CERTIFIED' && !rule.humanReviewRequired) continue
    if (rule.state === 'SUPERSEDED' || rule.state === 'REVOKED') continue

    const gate = evaluateCertificationGate({
      rule,
      reviewer: input.reviewer,
      currentSourceHash: input.currentSourceHashes[rule.identity] ?? rule.provenance.sourceHash,
    })
    const impact = input.projectImpact?.[rule.identity] ?? 0
    entries.push({
      ruleIdentity: rule.identity,
      ruleKey: rule.ruleKey,
      state: rule.state,
      projectImpact: impact,
      blockers: gate.failures,
      authorisedRoles: RULE_TYPE_CERTIFIERS[ruleTypeFamily(rule.scope.ruleType)] ?? [],
      // Nearly-certifiable rules blocking many projects come first — that is
      // where an hour of reviewer time removes the most repeated work.
      priority: impact * 10 - gate.failures.length,
    })
  }

  return entries.sort((a, b) => b.priority - a.priority)
}
