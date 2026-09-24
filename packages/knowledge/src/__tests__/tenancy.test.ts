/**
 * These tests are the containment boundary between Kealee's two businesses.
 * The failure they guard against is not a crash — it is a homeowner's property
 * or a professional's judgement quietly appearing in a competitor's workspace.
 */
import { describe, it, expect } from 'vitest'
import {
  requireTenantScope, assertSameTenant, mayReadCorpusOf,
  platformOperation, isPlatformOperation,
  tenantStoragePrefix, tenantJobKey,
  assertLicensableModule, tenantHasModule,
  HOMEOWNER_ONLY_SKUS, LICENSABLE_MODULES, KEALEE_DIRECT_TENANT_ID,
  CrossTenantAccessError, MissingTenantScopeError,
  type TenantScope,
} from '../tenancy'

const homeowner: TenantScope = { tenantId: KEALEE_DIRECT_TENANT_ID, kind: 'KEALEE_DIRECT' }
const builder: TenantScope = { tenantId: 'tenant_acme_builders', kind: 'WHITE_LABEL' }
const rival: TenantScope = { tenantId: 'tenant_rival_homes', kind: 'WHITE_LABEL' }

describe('scope is mandatory', () => {
  it('refuses a missing scope by name', () => {
    expect(() => requireTenantScope(undefined, 'retrieveContext')).toThrow(MissingTenantScopeError)
    expect(() => requireTenantScope(null, 'retrieveContext')).toThrow(/requires a TenantScope/)
  })

  it('refuses an EMPTY tenant id', () => {
    // '' passes a truthiness check in some paths and matches nothing — or,
    // concatenated into a hand-written predicate, matches everything.
    expect(() => requireTenantScope({ tenantId: '', kind: 'WHITE_LABEL' }, 'x')).toThrow()
    expect(() => requireTenantScope({ tenantId: '   ', kind: 'WHITE_LABEL' }, 'x')).toThrow()
  })

  it('explains WHY rather than just refusing', () => {
    try { requireTenantScope(null, 'ingestDocument') } catch (e) {
      expect((e as Error).message).toMatch(/between customers/)
    }
  })
})

describe('the corpus boundary', () => {
  it('lets a tenant read its own corpus', () => {
    expect(mayReadCorpusOf(builder, builder.tenantId)).toBe(true)
  })

  it('never lets one white-label tenant read another', () => {
    expect(mayReadCorpusOf(builder, rival.tenantId)).toBe(false)
    expect(mayReadCorpusOf(rival, builder.tenantId)).toBe(false)
  })

  it('never lets a white-label tenant read the HOMEOWNER corpus', () => {
    // The case the separation exists for: Kealee's own customers' properties
    // must not seed a builder's plans.
    expect(mayReadCorpusOf(builder, KEALEE_DIRECT_TENANT_ID)).toBe(false)
  })

  it('never lets the homeowner business read a white-label corpus either', () => {
    // Symmetric, and the direction people forget. A licensee's work product is
    // theirs; Kealee does not get to learn from it.
    expect(mayReadCorpusOf(homeowner, builder.tenantId)).toBe(false)
  })

  it('throws on a record from the wrong tenant, naming both', () => {
    expect(() => assertSameTenant(builder, rival.tenantId, 'rag chunk'))
      .toThrow(CrossTenantAccessError)
    try { assertSameTenant(builder, rival.tenantId, 'rag chunk') } catch (e) {
      const m = (e as Error).message
      expect(m).toContain('tenant_acme_builders')
      expect(m).toContain('tenant_rival_homes')
      expect(m).toMatch(/containment failure/)
    }
  })

  it('treats an absent tenant id as a violation, not as a wildcard', () => {
    expect(() => assertSameTenant(builder, null, 'legacy row')).toThrow(CrossTenantAccessError)
  })
})

describe('the cross-tenant escape hatch', () => {
  it('exists, but must state a reason and an operator', () => {
    const op = platformOperation('reproducing support ticket 4471', 'ops_tim')
    expect(isPlatformOperation(op)).toBe(true)
    expect(op.reason).toMatch(/4471/)
  })

  it('refuses a blank reason, because it is audited', () => {
    expect(() => platformOperation('   ', 'ops_tim')).toThrow(/state its reason/)
  })

  it('is distinguishable from a normal scope, so request paths can reject it', () => {
    expect(isPlatformOperation(builder)).toBe(false)
  })
})

describe('storage and queue isolation', () => {
  it('prefixes every tenant path, so one id cannot reach another tenant file', () => {
    expect(tenantStoragePrefix(builder)).toBe('tenants/tenant_acme_builders')
    expect(tenantStoragePrefix(homeowner)).toBe(`tenants/${KEALEE_DIRECT_TENANT_ID}`)
  })

  it('namespaces job keys so work is attributable and cancellable per tenant', () => {
    expect(tenantJobKey(builder, 'siteplan.render_exports'))
      .toBe('tenant_acme_builders:siteplan.render_exports')
  })

  it('will not build a path or key without a scope', () => {
    expect(() => tenantStoragePrefix({ tenantId: '', kind: 'WHITE_LABEL' })).toThrow()
    expect(() => tenantJobKey({ tenantId: '', kind: 'WHITE_LABEL' }, 'j')).toThrow()
  })
})

describe('module licensing — homeowner SKUs are not for sale to tenants', () => {
  it('refuses every homeowner SKU, with the commercial reason', () => {
    for (const sku of HOMEOWNER_ONLY_SKUS) {
      expect(() => assertLicensableModule(sku), sku).toThrow(/homeowner SKU/)
    }
    try { assertLicensableModule('preliminary_site_plan') } catch (e) {
      expect((e as Error).message).toMatch(/resell Kealee's own product/)
    }
  })

  it('accepts every declared module', () => {
    for (const m of LICENSABLE_MODULES) {
      expect(assertLicensableModule(m), m).toBe(m)
    }
  })

  it('refuses an unknown module rather than silently enabling it', () => {
    expect(() => assertLicensableModule('everything')).toThrow(/not a known module/)
  })

  it('keeps the two catalogues disjoint', () => {
    // The invariant behind the whole separation: no key may appear in both.
    const overlap = (HOMEOWNER_ONLY_SKUS as readonly string[])
      .filter(s => (LICENSABLE_MODULES as readonly string[]).includes(s))
    expect(overlap).toEqual([])
  })

  it('gates a module a tenant has not licensed', () => {
    expect(tenantHasModule(['acquisition'], 'acquisition')).toBe(true)
    expect(tenantHasModule(['acquisition'], 'site_plans')).toBe(false)
  })
})
