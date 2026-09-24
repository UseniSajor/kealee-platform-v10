import { describe, expect, it } from 'vitest'
import { tenantCacheKey, tenantJobPayload, tenantStorageKey, tenantVectorNamespace } from '../tenant-scope'

const context = { orgId: 'org_123', actorUserId: 'user_1', audience: 'PROFESSIONAL' as const, correlationId: 'trace_1' }

describe('tenant scope helpers', () => {
  it('namespaces storage, vectors, and caches by organization', () => {
    expect(tenantStorageKey(context, 'reports/final.pdf')).toBe('tenants/org_123/reports/final.pdf')
    expect(tenantVectorNamespace(context)).toBe('tenant_org_123__knowledge')
    expect(tenantCacheKey(context, 'report', 'r_1')).toBe('tenant:org_123:cache:report:r_1')
  })

  it('rejects path traversal and conflicting job tenant IDs', () => {
    expect(() => tenantStorageKey(context, '../secret')).toThrow('Invalid tenant storage key')
    expect(() => tenantJobPayload(context, { orgId: 'another-org' })).toThrow('Conflicting tenant ID')
  })

  it('requires project scope for homeowner execution', () => {
    expect(() => tenantJobPayload({ ...context, audience: 'HOMEOWNER' }, {})).toThrow('requires project scope')
  })
})
