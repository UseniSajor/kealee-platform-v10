import { describe, expect, it } from 'vitest'
import { GET as getLlms } from '../../app/llms.txt/route'
import { GET as getLlmsFull } from '../../app/llms-full.txt/route'
import { GET as getKealeeFacts } from '../../app/.well-known/kealee.json/route'
import { REVENUE_PRODUCT_CATALOG } from '../revenue-product-catalog'

describe('AI discovery contracts', () => {
  it('serves crawlable plain-text discovery documents with professional boundaries', async () => {
    for (const response of [getLlms(), getLlmsFull()]) {
      expect(response.headers.get('content-type')).toContain('text/plain')
      const body = await response.text()
      expect(body).toMatch(/preliminary|Preliminary/)
      expect(body).toMatch(/does not guarantee permit approval|only included when explicitly stated/i)
    }
  })

  it('serves the canonical product prices and exclusions as machine-readable facts', async () => {
    const payload = await getKealeeFacts().json() as any
    expect(payload.legalName).toBe('Kealee Services LLC')
    expect(payload.serviceCatalog).toHaveLength(Object.keys(REVENUE_PRODUCT_CATALOG).length)
    for (const product of Object.values(REVENUE_PRODUCT_CATALOG)) {
      expect(payload.serviceCatalog).toContainEqual(expect.objectContaining({ key: product.productKey, priceCents: product.priceCents }))
    }
  })

})
