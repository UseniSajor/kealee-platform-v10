import { describe, it, expect } from 'vitest'
import { roleHasScope, isExternalMarketingRole } from '../access-roles'

describe('access-roles marketing agency', () => {
  it('marketing_agency role lacks intelligence scope', () => {
    expect(roleHasScope('marketing_agency', 'read:intelligence')).toBe(false)
    expect(roleHasScope('marketing_agency', 'read:marketing_assets')).toBe(true)
    expect(roleHasScope('marketing_agency', 'write:marketing_assets')).toBe(true)
  })

  it('marketing_partner no longer has intelligence scope', () => {
    expect(roleHasScope('marketing_partner', 'read:intelligence')).toBe(false)
    expect(roleHasScope('marketing_partner', 'read:marketing_leads_summary')).toBe(true)
  })

  it('external marketing roles are flagged', () => {
    expect(isExternalMarketingRole('marketing_agency')).toBe(true)
    expect(isExternalMarketingRole('ops')).toBe(false)
  })
})
