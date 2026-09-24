import { describe, expect, it } from 'vitest'
import { getRequestedOrgId, isPlatformRole, resolveOrganizationMembership } from '../tenant-context'
const memberships = [
  { orgId: 'a', roleKey: 'org_owner', org: { id: 'a', status: 'ACTIVE' } },
  { orgId: 'b', roleKey: 'org_viewer', org: { id: 'b', status: 'ACTIVE' } },
]
describe('explicit tenant selection', () => {
  it('does not select the first organization, even if there is only one', () => {
    expect(resolveOrganizationMembership({ orgMemberships: memberships.slice(0, 1) })).toBeUndefined()
    expect(resolveOrganizationMembership({ orgMemberships: memberships })).toBeUndefined()
  })
  it('selects only a matching active membership', () => {
    expect(resolveOrganizationMembership({ orgMemberships: memberships }, 'b')).toBe(memberships[1])
    expect(() => resolveOrganizationMembership({ orgMemberships: memberships }, 'c')).toThrow('membership required')
    expect(() => resolveOrganizationMembership({ orgMemberships: [{ ...memberships[0], org: { id: 'a', status: 'DISABLED' } }] }, 'a')).toThrow('membership required')
  })
  it('refuses forged org context for homeowner identities', () => {
    expect(() => resolveOrganizationMembership({ role: 'HOMEOWNER', orgMemberships: memberships }, 'a')).toThrow('shared projects')
    expect(resolveOrganizationMembership({ role: 'HOMEOWNER', orgMemberships: memberships })).toBeUndefined()
  })
  it('accepts matching selectors but rejects conflicts and malformed values', () => {
    expect(getRequestedOrgId({ headers: { 'x-kealee-org-id': 'a' }, params: { orgId: 'a' } })).toBe('a')
    expect(() => getRequestedOrgId({ headers: { 'x-kealee-org-id': 'a' }, body: { org_id: 'b' } })).toThrow('Conflicting')
    expect(() => getRequestedOrgId({ query: { orgId: ['a', 'b'] } })).toThrow('Invalid')
    expect(() => getRequestedOrgId({ body: { org_id: '' } })).toThrow('Invalid')
  })
  it('does not elevate organization admins to platform administrators', () => {
    expect(isPlatformRole('ADMIN')).toBe(false)
    expect(isPlatformRole('org_admin')).toBe(false)
    expect(isPlatformRole('PLATFORM_OWNER')).toBe(true)
  })
})
