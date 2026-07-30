import { prisma } from '@kealee/database'
import type { JurisdictionCheckResult, JurisdictionOutcome, RuleAuthority } from './jurisdiction-rules'
import { COMPILED_PREDICATES } from './compiled-predicates'

/**
 * Data-driven jurisdiction rule engine.
 *
 * A `RuleNode` condition tree (stored as JSON in `JurisdictionRuleVersion.requirements`)
 * replaces one jurisdiction's worth of hand-written TypeScript branching logic. Adding a
 * jurisdiction means inserting rows, not shipping a new evaluator.
 *
 * Professional-seal presence ("has this plan been approved/sealed") is intentionally never
 * expressed as a RuleNode — it's checked exactly once, authoritatively, by
 * `evaluateProfessionalRelease` at final submission. A seal-presence CHECK row would sit as a
 * permanent blocking finding throughout PLAN_GENERATION/COMPLIANCE_AUDIT, before any review has
 * happened, which is exactly what the seal must never do.
 */

export type JsonScalar = string | number | boolean

export type ConditionExpr =
  | { op: 'missing' | 'present'; field: string }
  | { op: 'eq' | 'neq'; field: string; value: JsonScalar }
  | { op: 'gt' | 'gte' | 'lt' | 'lte'; field: string; value: number }
  | { op: 'in'; field: string; values: JsonScalar[] }
  | { op: 'and' | 'or'; terms: ConditionExpr[] }
  | { op: 'not'; term: ConditionExpr }

export interface RuleLeaf {
  outcome: JurisdictionOutcome
  requirement: string
  blocksSubmission: boolean
  remediation?: string
  responsibleDiscipline: string
  /** Field names from the input bag to echo back into JurisdictionCheckResult.inputs. */
  includeInputs?: string[]
}

export type RuleNode =
  | { type: 'branch'; if: ConditionExpr; then: RuleNode; else: RuleNode }
  | ({ type: 'leaf' } & RuleLeaf)

export interface JurisdictionRuleRequirements {
  dslVersion: 1
  logic: RuleNode
}

/** Row shape this module needs from JurisdictionRuleVersion — kept minimal/decoupled from Prisma's generated type. */
export interface JurisdictionRuleVersionRow {
  ruleKey: string
  kind: 'CHECK' | 'INPUT_SCHEMA' | 'SOURCE_REGISTRY' | 'COMPILED'
  requirements: unknown
  agency: string
  sourceTitle: string
  sourceUrl: string
  effectiveDate: Date | null
  lastVerifiedAt: Date
}

export function evalCondition(expr: ConditionExpr, input: Record<string, unknown>): boolean {
  switch (expr.op) {
    case 'and': return expr.terms.every((t) => evalCondition(t, input))
    case 'or': return expr.terms.some((t) => evalCondition(t, input))
    case 'not': return !evalCondition(expr.term, input)
    case 'missing': return input[expr.field] === undefined || input[expr.field] === null
    case 'present': return input[expr.field] !== undefined && input[expr.field] !== null
    case 'eq': return input[expr.field] === expr.value
    case 'neq': return input[expr.field] !== expr.value
    case 'gt': return typeof input[expr.field] === 'number' && (input[expr.field] as number) > expr.value
    case 'gte': return typeof input[expr.field] === 'number' && (input[expr.field] as number) >= expr.value
    case 'lt': return typeof input[expr.field] === 'number' && (input[expr.field] as number) < expr.value
    case 'lte': return typeof input[expr.field] === 'number' && (input[expr.field] as number) <= expr.value
    case 'in': return expr.values.includes(input[expr.field] as JsonScalar)
  }
}

export function evalNode(node: RuleNode, input: Record<string, unknown>): RuleLeaf {
  return node.type === 'leaf' ? node : evalCondition(node.if, input) ? evalNode(node.then, input) : evalNode(node.else, input)
}

export function evaluateRuleVersion(rule: JurisdictionRuleVersionRow, input: Record<string, unknown>): JurisdictionCheckResult {
  let leaf: RuleLeaf
  if (rule.kind === 'COMPILED') {
    const { predicateKey } = rule.requirements as { predicateKey: string }
    const predicate = COMPILED_PREDICATES[predicateKey]
    if (!predicate) throw new Error(`No compiled predicate registered for key: ${predicateKey} (rule ${rule.ruleKey})`)
    leaf = predicate(input)
  } else {
    const req = rule.requirements as JurisdictionRuleRequirements
    leaf = evalNode(req.logic, input)
  }
  const authority: RuleAuthority = {
    agency: rule.agency,
    title: rule.sourceTitle,
    url: rule.sourceUrl,
    effectiveDate: rule.effectiveDate?.toISOString(),
    lastVerifiedDate: rule.lastVerifiedAt.toISOString(),
  }
  return {
    ruleKey: rule.ruleKey,
    outcome: leaf.outcome,
    requirement: leaf.requirement,
    inputs: Object.fromEntries((leaf.includeInputs ?? []).map((f) => [f, input[f]])),
    authority,
    responsibleDiscipline: leaf.responsibleDiscipline,
    remediation: leaf.remediation,
    blocksSubmission: leaf.blocksSubmission,
  }
}

/**
 * Queries active (kind='CHECK', not superseded) jurisdiction rules and evaluates all of them
 * against `input`. Replaces every call site that would previously have used a hardcoded
 * per-jurisdiction TypeScript rule pack — adding a jurisdiction means inserting rows here,
 * not shipping new code.
 */
export async function evaluateJurisdictionRules(
  jurisdictionCode: string,
  projectType: string,
  input: Record<string, unknown>,
): Promise<JurisdictionCheckResult[]> {
  const rows = await prisma.jurisdictionRuleVersion.findMany({
    where: {
      jurisdictionCode,
      kind: 'CHECK',
      supersededAt: null,
      OR: [{ projectTypes: { isEmpty: true } }, { projectTypes: { has: projectType } }],
    },
  })
  return rows.map((row) => evaluateRuleVersion(row, input))
}

/**
 * Throws unless the jurisdiction has at least one active, evaluable rule. Replaces
 * `assertJurisdictionAutomationReady` and the hardcoded DMV-only allowlist it enforced — any
 * jurisdiction with seeded CHECK rows becomes usable the moment those rows exist, not when
 * someone ships new TypeScript.
 */
export async function assertJurisdictionHasActiveRules(jurisdictionCode: string): Promise<void> {
  const count = await prisma.jurisdictionRuleVersion.count({
    where: { jurisdictionCode, kind: 'CHECK', supersededAt: null },
  })
  if (count === 0) {
    throw new Error(
      `No active compliance rules are seeded for jurisdiction ${jurisdictionCode}. ` +
      'Automated site-plan geometry generation cannot proceed until rules are seeded for this jurisdiction.',
    )
  }
}
