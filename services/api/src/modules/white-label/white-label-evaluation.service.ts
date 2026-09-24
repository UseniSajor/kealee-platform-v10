import { prisma } from '../../lib/prisma'

const db = prisma as any

export type TenantEvaluationHandler = (input: Record<string, unknown>, context: {
  orgId: string
  moduleKey?: string
  promptVersion?: string
  modelVersion?: string
}) => Promise<unknown>

const handlers = new Map<string, TenantEvaluationHandler>()

export function registerTenantEvaluationHandler(moduleKey: string, handler: TenantEvaluationHandler) {
  handlers.set(moduleKey, handler)
  return () => handlers.delete(moduleKey)
}

function readPath(value: unknown, path: string): unknown {
  const parts = path.split('.').filter(Boolean)
  if (parts.some((part) => ['__proto__', 'prototype', 'constructor'].includes(part))) return undefined
  return parts.reduce<unknown>((current, part) => {
    if (!current || typeof current !== 'object') return undefined
    return (current as Record<string, unknown>)[part]
  }, value)
}

function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`
  if (value && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => `${JSON.stringify(key)}:${stable(item)}`).join(',')}}`
  }
  return JSON.stringify(value)
}

export function evaluateAssertions(output: unknown, expected: unknown, assertionsInput: unknown) {
  const assertions = assertionsInput && typeof assertionsInput === 'object'
    ? assertionsInput as Record<string, unknown>
    : {}
  const failures: string[] = []

  if (assertions.deepEquals === true && stable(output) !== stable(expected)) failures.push('Output did not deep-equal expected output')
  for (const path of Array.isArray(assertions.requiredPaths) ? assertions.requiredPaths : []) {
    if (typeof path === 'string' && readPath(output, path) == null) failures.push(`Required path missing: ${path}`)
  }
  const equals = assertions.equals && typeof assertions.equals === 'object' && !Array.isArray(assertions.equals)
    ? assertions.equals as Record<string, unknown>
    : {}
  for (const [path, value] of Object.entries(equals)) {
    if (stable(readPath(output, path)) !== stable(value)) failures.push(`Value mismatch at ${path}`)
  }
  const contains = assertions.contains && typeof assertions.contains === 'object' && !Array.isArray(assertions.contains)
    ? assertions.contains as Record<string, unknown>
    : {}
  for (const [path, value] of Object.entries(contains)) {
    const actual = readPath(output, path)
    if (typeof actual === 'string' && typeof value === 'string') {
      if (!actual.includes(value)) failures.push(`Text at ${path} did not contain expected value`)
    } else if (Array.isArray(actual)) {
      if (!actual.some((item) => stable(item) === stable(value))) failures.push(`Array at ${path} did not contain expected value`)
    } else failures.push(`Contains assertion could not be evaluated at ${path}`)
  }
  const numericWithin = assertions.numericWithin && typeof assertions.numericWithin === 'object' && !Array.isArray(assertions.numericWithin)
    ? assertions.numericWithin as Record<string, unknown>
    : {}
  for (const [path, rule] of Object.entries(numericWithin)) {
    const actual = Number(readPath(output, path))
    const record = rule as { expected?: number; tolerance?: number }
    if (!Number.isFinite(actual) || typeof record.expected !== 'number' || Math.abs(actual - record.expected) > (record.tolerance ?? 0)) {
      failures.push(`Numeric tolerance failed at ${path}`)
    }
  }
  return { passed: failures.length === 0, failures }
}

export async function executeTenantEvaluationRun(runId: string, expected?: { orgId: string; suiteId: string }) {
  const run = await db.tenantEvaluationRun.findUnique({
    where: { id: runId },
    include: { suite: { include: { cases: { where: { active: true }, orderBy: { createdAt: 'asc' } } } } },
  })
  if (!run) throw Object.assign(new Error('Evaluation run not found'), { statusCode: 404 })
  if (expected && (run.suiteId !== expected.suiteId || run.suite.orgId !== expected.orgId)) {
    throw Object.assign(new Error('Evaluation run not found'), { statusCode: 404 })
  }
  if (!['QUEUED', 'FAILED'].includes(run.status)) {
    throw Object.assign(new Error(`Evaluation run cannot execute from ${run.status}`), { statusCode: 409 })
  }

  await db.tenantEvaluationRun.update({ where: { id: runId }, data: { status: 'RUNNING', startedAt: new Date(), errorMessage: null } })
  const handler = run.suite.moduleKey ? handlers.get(run.suite.moduleKey) : undefined
  const results: Array<Record<string, unknown>> = []
  let passedCases = 0

  try {
    for (const testCase of run.suite.cases) {
      const input = testCase.input as Record<string, unknown>
      let output: unknown
      if (handler) {
        output = await handler(input, {
          orgId: run.suite.orgId,
          moduleKey: run.suite.moduleKey ?? undefined,
          promptVersion: run.promptVersion ?? undefined,
          modelVersion: run.modelVersion ?? undefined,
        })
      } else if (Object.prototype.hasOwnProperty.call(input, 'candidateOutput')) {
        output = input.candidateOutput
      } else {
        throw new Error(`No evaluation handler registered for module ${run.suite.moduleKey ?? 'unassigned'}`)
      }
      const assertionResult = evaluateAssertions(output, testCase.expectedOutput, testCase.assertions)
      if (assertionResult.passed) passedCases += 1
      results.push({ caseId: testCase.id, name: testCase.name, output, ...assertionResult })
    }

    const totalCases = run.suite.cases.length
    const score = totalCases ? passedCases / totalCases : 0
    const threshold = run.suite.accuracyThreshold == null ? 1 : Number(run.suite.accuracyThreshold)
    const status = score >= threshold ? 'PASSED' : 'FAILED'
    return db.tenantEvaluationRun.update({
      where: { id: runId },
      data: {
        status,
        passedCases,
        failedCases: totalCases - passedCases,
        totalCases,
        score,
        results,
        completedAt: new Date(),
      },
    })
  } catch (error) {
    await db.tenantEvaluationRun.update({
      where: { id: runId },
      data: { status: 'FAILED', errorMessage: error instanceof Error ? error.message : String(error), completedAt: new Date(), results },
    })
    throw error
  }
}
