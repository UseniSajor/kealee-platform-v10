/**
 * Deterministic rule applicability, footnotes and overrides.
 *
 * A rule existing in the ordinance says nothing about whether it governs THIS
 * project. Sec. 27-4205 publishes a front yard depth for RSF-65; whether that
 * number is the one you build to depends on the use, the lot geometry, whether
 * the lot is a corner, which overlays sit on top, and — very often — a footnote
 * that quietly replaces the table value for exactly your case.
 *
 * Three states, never two. `unknown` is a first-class answer and is NOT the
 * same as `false`: "this rule does not apply" and "we cannot tell whether this
 * rule applies" have completely different consequences, and conflating them is
 * how a project gets drawn to the wrong setback.
 */

import type { RuleConfidence } from './model'

// ── Project context ─────────────────────────────────────────────────────────

/**
 * What is known about a project. Every field is optional, and `undefined` means
 * UNKNOWN rather than absent — a condition that depends on an unknown fact
 * resolves to `unknown` and routes to a human.
 */
export interface ProjectContext {
  jurisdiction: string
  zone?: string
  overlays?: string[]
  use?: string
  buildingType?: string
  lotType?: 'corner' | 'interior' | 'through' | 'flag' | 'reversed_frontage'
  parcelStatus?: 'recorded' | 'unrecorded' | 'pending_subdivision'
  subdivisionStatus?: 'not_required' | 'preliminary' | 'final_approved' | 'required_not_started'
  frontageFt?: number
  lotWidthFt?: number
  lotAreaSqFt?: number
  proposedHeightFt?: number
  proposedStoreys?: number
  densityUnitsPerAcre?: number
  environmentalOverlays?: string[]
  historicOverlays?: string[]
  /** Granted relief. A variance changes which rule governs. */
  specialExceptions?: string[]
  variances?: string[]
  /** Date the application is measured against — usually the filing date. */
  applicationDate?: string
  nonconforming?: boolean
  grandfatheredUnder?: string | null
  /** Anything else a jurisdiction rule needs, kept open rather than forcing a schema change. */
  attributes?: Record<string, string | number | boolean | undefined>
}

// ── Conditions ──────────────────────────────────────────────────────────────

export type ConditionOutcome = 'match' | 'no_match' | 'unknown'

export type Condition =
  | { kind: 'always'; description?: string }
  | { kind: 'equals'; field: ContextField; value: string; description?: string }
  | { kind: 'oneOf'; field: ContextField; values: string[]; description?: string }
  | { kind: 'notOneOf'; field: ContextField; values: string[]; description?: string }
  | { kind: 'includes'; field: ListField; value: string; description?: string }
  | { kind: 'includesAny'; field: ListField; values: string[]; description?: string }
  | { kind: 'excludes'; field: ListField; value: string; description?: string }
  | { kind: 'numeric'; field: NumericField; op: '<' | '<=' | '>' | '>=' | '=='; value: number; description?: string }
  | { kind: 'range'; field: NumericField; min?: number; max?: number; description?: string }
  | { kind: 'boolean'; field: BooleanField; value: boolean; description?: string }
  | { kind: 'effectiveOn'; onOrAfter?: string; before?: string; description?: string }
  | { kind: 'allOf'; conditions: Condition[]; description?: string }
  | { kind: 'anyOf'; conditions: Condition[]; description?: string }
  | { kind: 'not'; condition: Condition; description?: string }
  /**
   * A condition the engine cannot decide — a discretionary judgement, a
   * "as determined by the Planning Director" clause. It always resolves to
   * `unknown`, which is the honest answer.
   */
  | { kind: 'discretionary'; description: string; resolvedBy: string }

export type ContextField =
  | 'zone' | 'use' | 'buildingType' | 'lotType' | 'parcelStatus' | 'subdivisionStatus'
  | 'grandfatheredUnder'
export type ListField =
  | 'overlays' | 'environmentalOverlays' | 'historicOverlays' | 'specialExceptions' | 'variances'
export type NumericField =
  | 'frontageFt' | 'lotWidthFt' | 'lotAreaSqFt' | 'proposedHeightFt' | 'proposedStoreys'
  | 'densityUnitsPerAcre'
export type BooleanField = 'nonconforming'

function scalar(ctx: ProjectContext, field: ContextField): string | undefined {
  const v = ctx[field] ?? (ctx.attributes?.[field] as string | undefined)
  return v == null ? undefined : String(v)
}
function list(ctx: ProjectContext, field: ListField): string[] | undefined {
  return ctx[field]
}
function numeric(ctx: ProjectContext, field: NumericField): number | undefined {
  const v = ctx[field] ?? (ctx.attributes?.[field] as number | undefined)
  return typeof v === 'number' && Number.isFinite(v) ? v : undefined
}

const norm = (s: string) => s.trim().toUpperCase()

export function evaluateCondition(c: Condition, ctx: ProjectContext): ConditionOutcome {
  switch (c.kind) {
    case 'always':
      return 'match'

    case 'discretionary':
      // Never guessed. This is the point of the kind existing.
      return 'unknown'

    case 'equals': {
      const v = scalar(ctx, c.field)
      return v === undefined ? 'unknown' : norm(v) === norm(c.value) ? 'match' : 'no_match'
    }

    case 'oneOf': {
      const v = scalar(ctx, c.field)
      if (v === undefined) return 'unknown'
      return c.values.some(x => norm(x) === norm(v)) ? 'match' : 'no_match'
    }

    case 'notOneOf': {
      const v = scalar(ctx, c.field)
      if (v === undefined) return 'unknown'
      return c.values.some(x => norm(x) === norm(v)) ? 'no_match' : 'match'
    }

    case 'includes': {
      const l = list(ctx, c.field)
      if (l === undefined) return 'unknown'
      return l.some(x => norm(x) === norm(c.value)) ? 'match' : 'no_match'
    }

    case 'includesAny': {
      const l = list(ctx, c.field)
      if (l === undefined) return 'unknown'
      return l.some(x => c.values.some(y => norm(y) === norm(x))) ? 'match' : 'no_match'
    }

    case 'excludes': {
      const l = list(ctx, c.field)
      if (l === undefined) return 'unknown'
      return l.some(x => norm(x) === norm(c.value)) ? 'no_match' : 'match'
    }

    case 'numeric': {
      const v = numeric(ctx, c.field)
      if (v === undefined) return 'unknown'
      switch (c.op) {
        case '<': return v < c.value ? 'match' : 'no_match'
        case '<=': return v <= c.value ? 'match' : 'no_match'
        case '>': return v > c.value ? 'match' : 'no_match'
        case '>=': return v >= c.value ? 'match' : 'no_match'
        case '==': return v === c.value ? 'match' : 'no_match'
      }
      return 'unknown'
    }

    case 'range': {
      const v = numeric(ctx, c.field)
      if (v === undefined) return 'unknown'
      if (c.min != null && v < c.min) return 'no_match'
      if (c.max != null && v > c.max) return 'no_match'
      return 'match'
    }

    case 'boolean': {
      const v = ctx[c.field]
      return v === undefined ? 'unknown' : v === c.value ? 'match' : 'no_match'
    }

    case 'effectiveOn': {
      if (!ctx.applicationDate) return 'unknown'
      const t = Date.parse(ctx.applicationDate)
      if (!Number.isFinite(t)) return 'unknown'
      if (c.onOrAfter && t < Date.parse(c.onOrAfter)) return 'no_match'
      if (c.before && t >= Date.parse(c.before)) return 'no_match'
      return 'match'
    }

    case 'allOf': {
      const rs = c.conditions.map(x => evaluateCondition(x, ctx))
      // A definite no_match settles it even if siblings are unknown.
      if (rs.includes('no_match')) return 'no_match'
      if (rs.includes('unknown')) return 'unknown'
      return 'match'
    }

    case 'anyOf': {
      const rs = c.conditions.map(x => evaluateCondition(x, ctx))
      // A definite match settles it even if siblings are unknown.
      if (rs.includes('match')) return 'match'
      if (rs.includes('unknown')) return 'unknown'
      return 'no_match'
    }

    case 'not': {
      const r = evaluateCondition(c.condition, ctx)
      return r === 'unknown' ? 'unknown' : r === 'match' ? 'no_match' : 'match'
    }
  }
}

export function describeCondition(c: Condition): string {
  if (c.description) return c.description
  switch (c.kind) {
    case 'always': return 'always applies'
    case 'discretionary': return `discretionary determination by ${c.resolvedBy}`
    case 'equals': return `${c.field} = ${c.value}`
    case 'oneOf': return `${c.field} ∈ {${c.values.join(', ')}}`
    case 'notOneOf': return `${c.field} ∉ {${c.values.join(', ')}}`
    case 'includes': return `${c.field} contains ${c.value}`
    case 'includesAny': return `${c.field} contains any of {${c.values.join(', ')}}`
    case 'excludes': return `${c.field} does not contain ${c.value}`
    case 'numeric': return `${c.field} ${c.op} ${c.value}`
    case 'range': return `${c.field} in [${c.min ?? '−∞'}, ${c.max ?? '∞'}]`
    case 'boolean': return `${c.field} is ${c.value}`
    case 'effectiveOn': return `application date ${c.onOrAfter ? `on/after ${c.onOrAfter}` : ''}${c.before ? ` before ${c.before}` : ''}`.trim()
    case 'allOf': return c.conditions.map(describeCondition).join(' AND ')
    case 'anyOf': return c.conditions.map(describeCondition).join(' OR ')
    case 'not': return `NOT (${describeCondition(c.condition)})`
  }
}

// ── Footnotes, exceptions and overrides ─────────────────────────────────────

export type FootnoteEffect =
  /** Replaces the base value outright. */
  | 'replaces_value'
  /** Adjusts the base value (a delta or a multiplier stated in `adjustment`). */
  | 'modifies_value'
  /** Adds a requirement without changing the base value. */
  | 'adds_requirement'
  /** Exempts the project from the rule entirely. */
  | 'exempts'
  /** Points at another section that governs instead. */
  | 'cross_reference'
  /** States something a reviewer must weigh but the engine cannot apply. */
  | 'informational'

/**
 * A footnote, exception or conditional note attached to a rule.
 *
 * These are kept as structured objects rather than flattened into the value
 * string, because "45 (4)" is not the number 45 — it is 45 subject to footnote
 * 4, and footnote 4 might say 60 for your use.
 */
export interface RuleFootnote {
  id: string
  /** The marker as printed, e.g. "(4)". */
  marker: string
  /** The footnote text, verbatim. */
  text: string
  effect: FootnoteEffect
  /** When the footnote bites. `discretionary` when the ordinance does not say. */
  condition: Condition
  /** For replaces_value / modifies_value. */
  value?: string
  adjustment?: { operation: 'add' | 'subtract' | 'multiply' | 'set_minimum' | 'set_maximum'; amount: number }
  /** Section this footnote defers to, for cross_reference. */
  crossReferenceSection?: string
  /**
   * True when the footnote must be resolved before the rule can be used at all.
   * A footnote that can replace the value is mandatory by definition.
   */
  mandatory: boolean
}

export type FootnoteResolution = 'applies' | 'does_not_apply' | 'unresolved'

export interface FootnoteEvaluation {
  footnote: RuleFootnote
  resolution: FootnoteResolution
  reason: string
  /** The value after this footnote is applied, when it changes one. */
  resultingValue?: string
}

/** Applies a footnote's adjustment to a numeric base value. */
function applyAdjustment(base: string, f: RuleFootnote): string | undefined {
  if (f.effect === 'replaces_value') return f.value
  if (f.effect !== 'modifies_value' || !f.adjustment) return undefined
  const n = Number(String(base).match(/-?\d+(\.\d+)?/)?.[0])
  if (!Number.isFinite(n)) return undefined
  const { operation, amount } = f.adjustment
  const out =
    operation === 'add' ? n + amount
    : operation === 'subtract' ? n - amount
    : operation === 'multiply' ? n * amount
    : operation === 'set_minimum' ? Math.max(n, amount)
    : Math.min(n, amount)
  return String(Number(out.toFixed(4)))
}

export function evaluateFootnotes(
  footnotes: RuleFootnote[],
  ctx: ProjectContext,
  baseValue?: string,
): { evaluations: FootnoteEvaluation[]; unresolvedMandatory: RuleFootnote[]; effectiveValue: string | undefined } {
  const evaluations: FootnoteEvaluation[] = []
  let effectiveValue = baseValue

  for (const f of footnotes) {
    const outcome = evaluateCondition(f.condition, ctx)
    if (outcome === 'unknown') {
      evaluations.push({
        footnote: f,
        resolution: 'unresolved',
        reason:
          `Cannot determine whether ${f.marker} applies: ${describeCondition(f.condition)}. ` +
          (f.mandatory
            ? 'This footnote can change the governing value, so the rule cannot be applied until it is resolved.'
            : 'The footnote does not change the value, but a reviewer should note it.'),
      })
      continue
    }
    if (outcome === 'no_match') {
      evaluations.push({
        footnote: f, resolution: 'does_not_apply',
        reason: `${f.marker} does not apply: ${describeCondition(f.condition)} is not met.`,
      })
      continue
    }

    const resulting = effectiveValue != null ? applyAdjustment(effectiveValue, f) : undefined
    if (resulting != null) effectiveValue = resulting
    evaluations.push({
      footnote: f,
      resolution: 'applies',
      resultingValue: resulting,
      reason:
        resulting != null
          ? `${f.marker} applies and changes the governing value to ${resulting}. ` +
            'The base table value is NOT the requirement for this project.'
          : `${f.marker} applies: ${f.text}`,
    })
  }

  const unresolvedMandatory = evaluations
    .filter(e => e.resolution === 'unresolved' && e.footnote.mandatory)
    .map(e => e.footnote)

  return { evaluations, unresolvedMandatory, effectiveValue }
}

// ── Applicability ───────────────────────────────────────────────────────────

export interface ApplicabilityModel {
  /** When this rule governs. */
  condition: Condition
  /**
   * Rules that override this one when their own condition matches — an overlay
   * standard displacing a base-zone standard, most commonly.
   */
  overriddenBy?: { ruleIdentity: string; condition: Condition; reason: string }[]
  footnotes?: RuleFootnote[]
  /** Set when the applicability logic is known to be incomplete. */
  incompleteReason?: string
}

export type Applies = true | false | 'unknown'

export interface ApplicabilityResult {
  applies: Applies
  applicabilityConfidence: number
  matchedConditions: string[]
  unresolvedConditions: string[]
  conflictingRules: string[]
  /** The rule that governs instead, when one displaces this rule. */
  overriddenBy: { ruleIdentity: string; reason: string } | null
  footnoteEvaluations: FootnoteEvaluation[]
  unresolvedMandatoryFootnotes: string[]
  /** The value after applicable footnotes, when the rule carries one. */
  effectiveValue: string | undefined
  requiresHumanReview: boolean
  rationale: string
}

/** Flattens a condition tree into per-leaf outcomes, for the matched/unresolved lists. */
function walk(c: Condition, ctx: ProjectContext, matched: string[], unresolved: string[]): void {
  if (c.kind === 'allOf' || c.kind === 'anyOf') {
    for (const sub of c.conditions) walk(sub, ctx, matched, unresolved)
    return
  }
  if (c.kind === 'not') { walk(c.condition, ctx, matched, unresolved); return }
  const outcome = evaluateCondition(c, ctx)
  if (outcome === 'match') matched.push(describeCondition(c))
  else if (outcome === 'unknown') unresolved.push(describeCondition(c))
}

export function evaluateApplicability(
  model: ApplicabilityModel,
  ctx: ProjectContext,
  baseValue?: string,
): ApplicabilityResult {
  const matched: string[] = []
  const unresolved: string[] = []
  walk(model.condition, ctx, matched, unresolved)

  const outcome = evaluateCondition(model.condition, ctx)
  const applies: Applies = outcome === 'match' ? true : outcome === 'no_match' ? false : 'unknown'

  // Overrides are checked even when the base rule applies — that is exactly the
  // case where an overlay displacing it matters.
  const conflictingRules: string[] = []
  let overriddenBy: ApplicabilityResult['overriddenBy'] = null
  for (const o of model.overriddenBy ?? []) {
    const r = evaluateCondition(o.condition, ctx)
    if (r === 'match') {
      overriddenBy = { ruleIdentity: o.ruleIdentity, reason: o.reason }
      conflictingRules.push(o.ruleIdentity)
    } else if (r === 'unknown') {
      unresolved.push(`possible override by ${o.ruleIdentity}: ${describeCondition(o.condition)}`)
      conflictingRules.push(o.ruleIdentity)
    }
  }

  const footnotes = model.footnotes ?? []
  const fn = evaluateFootnotes(footnotes, ctx, baseValue)
  for (const e of fn.evaluations) {
    if (e.resolution === 'unresolved') unresolved.push(`footnote ${e.footnote.marker}: ${describeCondition(e.footnote.condition)}`)
    else if (e.resolution === 'applies') matched.push(`footnote ${e.footnote.marker} applies`)
  }

  // Confidence falls with each thing we could not resolve. It is a coverage
  // measure, not a belief — which is why it is deterministic.
  const totalLeaves = matched.length + unresolved.length
  let confidence = totalLeaves === 0 ? 1 : Number((matched.length / totalLeaves).toFixed(4))
  if (model.incompleteReason) confidence = Math.min(confidence, 0.5)
  if (applies === 'unknown') confidence = Math.min(confidence, 0.5)
  if (overriddenBy) confidence = Math.min(confidence, 0.6)

  const requiresHumanReview =
    applies === 'unknown' ||
    unresolved.length > 0 ||
    fn.unresolvedMandatory.length > 0 ||
    overriddenBy != null ||
    Boolean(model.incompleteReason)

  const rationale =
    applies === 'unknown'
      ? `Applicability could not be determined: ${unresolved.join('; ')}. Unknown applicability is not ` +
        '"does not apply" — it routes to a human.'
      : applies === false
        ? 'The rule does not govern this project on the facts supplied.'
        : overriddenBy
          ? `The rule applies but is displaced by ${overriddenBy.ruleIdentity}: ${overriddenBy.reason}`
          : fn.unresolvedMandatory.length
            ? `The rule applies, but ${fn.unresolvedMandatory.length} mandatory footnote(s) are unresolved, ` +
              'so the base table value cannot be treated as the requirement.'
            : unresolved.length
              ? 'The rule applies, with unresolved secondary conditions noted for review.'
              : 'The rule applies and every condition resolved deterministically.'

  return {
    applies,
    applicabilityConfidence: confidence,
    matchedConditions: matched,
    unresolvedConditions: unresolved,
    conflictingRules,
    overriddenBy,
    footnoteEvaluations: fn.evaluations,
    unresolvedMandatoryFootnotes: fn.unresolvedMandatory.map(f => f.marker),
    effectiveValue: fn.effectiveValue,
    requiresHumanReview,
    rationale,
  }
}

/** Folds the applicability result into the rule's confidence dimensions. */
export function withApplicabilityConfidence(c: RuleConfidence, r: ApplicabilityResult): RuleConfidence {
  return { ...c, applicabilityConfidence: Math.min(c.applicabilityConfidence, r.applicabilityConfidence) }
}
