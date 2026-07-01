import { describe, expect, it } from 'vitest'
import { isAgencyPartnerShellPath } from '../agency-partner-shell'

describe('isAgencyPartnerShellPath', () => {
  it('includes agency login and workspace only', () => {
    expect(isAgencyPartnerShellPath('/marketing/login')).toBe(true)
    expect(isAgencyPartnerShellPath('/marketing/workspace')).toBe(true)
  })

  it('excludes consumer portal picker and other marketing pages', () => {
    expect(isAgencyPartnerShellPath('/login')).toBe(false)
    expect(isAgencyPartnerShellPath('/auth/login')).toBe(false)
    expect(isAgencyPartnerShellPath('/marketplace')).toBe(false)
    expect(isAgencyPartnerShellPath('/admin/marketing/approvals')).toBe(false)
  })
})
