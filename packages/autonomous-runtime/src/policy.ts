import type { CompletionCriterion, RuntimeSnapshot, StepResult } from './types'

export class RuntimePolicyError extends Error {
  constructor(public readonly code: string, message: string) { super(message) }
}

export function assertBudget(snapshot: RuntimeSnapshot): void {
  const budget = snapshot.goal.budget
  if (!budget) return
  if (budget.tokenLimit != null && snapshot.tokensUsed >= budget.tokenLimit) {
    throw new RuntimePolicyError('TOKEN_BUDGET_EXHAUSTED', 'Token budget exhausted')
  }
  if (budget.costLimitCents != null && snapshot.costCents >= budget.costLimitCents) {
    throw new RuntimePolicyError('COST_BUDGET_EXHAUSTED', 'Cost budget exhausted')
  }
  if (budget.timeLimitMs != null && Date.now() - Date.parse(snapshot.startedAt) >= budget.timeLimitMs) {
    throw new RuntimePolicyError('TIME_BUDGET_EXHAUSTED', 'Time budget exhausted')
  }
  const attempts = Object.values(snapshot.steps).reduce((sum, step) => sum + step.attempts, 0)
  if (budget.maxSteps != null && attempts >= budget.maxSteps) {
    throw new RuntimePolicyError('STEP_BUDGET_EXHAUSTED', 'Step budget exhausted')
  }
}

export function criteriaSatisfied(criteria: CompletionCriterion[], result?: StepResult, now = new Date()): boolean {
  if (!criteria.length) return result?.status === 'complete'
  if (result?.status !== 'complete') return false
  const evidence = result.evidence ?? []
  return criteria.every(criterion => {
    if (!criterion.required) return true
    if (!criterion.evidenceTypes?.length) return true
    return criterion.evidenceTypes.some(type => evidence.some(item =>
      item.type === type && (!item.validUntil || Date.parse(item.validUntil) > now.getTime()),
    ))
  })
}

export function goalSatisfied(snapshot: RuntimeSnapshot, now = new Date()): boolean {
  return snapshot.goal.successCriteria.every(criterion => {
    if (!criterion.required) return true
    return Object.values(snapshot.steps).some(step =>
      criteriaSatisfied([criterion], step.result, now),
    )
  })
}
