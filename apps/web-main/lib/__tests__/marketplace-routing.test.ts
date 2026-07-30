import { describe, expect, it } from 'vitest'
import { getMarketplaceAudience } from '@/lib/marketplace-routing'

describe('getMarketplaceAudience', () => {
  it.each([
    ['/contractors', null, 'contractor'],
    ['/contractors/subscribe', null, 'contractor'],
    ['/developers', null, 'developer'],
    ['/developers/start', null, 'developer'],
    ['/intake/cost_estimate', 'contractor', 'contractor'],
    ['/intake/cost_estimate', 'developer', 'developer'],
    ['/intake/cost_estimate', 'service-provider', 'service-provider'],
  ])('routes %s (%s) to the %s marketplace', (pathname, client, audience) => {
    expect(getMarketplaceAudience(pathname, client)).toBe(audience)
  })

  it.each([
    ['/intake/cost_estimate', null],
    ['/intake/cost_estimate', 'owner'],
    ['/intake/certified_estimate', 'owner'],
    ['/concept', null],
    ['/estimate', null],
    ['/permits', null],
  ])('keeps project-owner route %s outside professional marketplace redirects', (pathname, client) => {
    expect(getMarketplaceAudience(pathname, client)).toBeNull()
  })
})
