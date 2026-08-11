import { describe, expect, it } from 'vitest'
import { getPermitServiceRecommendation } from '../permit-service-recommendation'

describe('permit service recommendation', () => {
  it('does not interrupt a permit intake that already has submission documents', () => {
    expect(getPermitServiceRecommendation('structural addition', true)).toBeNull()
  })

  it('routes site-affecting scopes to site-plan services', () => {
    expect(getPermitServiceRecommendation('Build a rear deck and addition', false)?.key).toBe('site-plan')
  })

  it('routes structural and complex scopes to professional drawings', () => {
    expect(getPermitServiceRecommendation('Remove a load-bearing wall', false)?.key).toBe('professional-drawings')
  })

  it('routes early scopes without plans to design concept services', () => {
    expect(getPermitServiceRecommendation('Refresh the main living area', false)?.key).toBe('design-concept')
  })
})
