import { describe, expect, it } from 'vitest'
import { evaluateAssertions } from '../white-label-evaluation.service'

describe('tenant evaluation assertions', () => {
  it('supports structural, required, contains, and numeric tolerance checks', () => {
    const result = evaluateAssertions(
      { recommendation: { decision: 'GO', price: 502_000 }, notes: 'Human review required', risks: ['zoning'] },
      undefined,
      {
        requiredPaths: ['recommendation.decision'],
        equals: { 'recommendation.decision': 'GO' },
        contains: { notes: 'Human review', risks: 'zoning' },
        numericWithin: { 'recommendation.price': { expected: 500_000, tolerance: 2_500 } },
      },
    )
    expect(result).toEqual({ passed: true, failures: [] })
  })

  it('returns actionable failures without throwing on malformed output', () => {
    const result = evaluateAssertions({}, undefined, {
      requiredPaths: ['recommendation.decision'],
      equals: { 'recommendation.decision': 'GO' },
    })
    expect(result.passed).toBe(false)
    expect(result.failures).toContain('Required path missing: recommendation.decision')
  })

  it('blocks prototype traversal in assertion paths', () => {
    const result = evaluateAssertions({}, undefined, { requiredPaths: ['__proto__.polluted'] })
    expect(result.passed).toBe(false)
    expect(({} as Record<string, unknown>).polluted).toBeUndefined()
  })
})
