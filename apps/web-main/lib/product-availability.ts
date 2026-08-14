import { getPublicCatalogProduct } from '@kealee/core-rules'

export type ProductAvailability = 'online' | 'request'

/**
 * Catalog products with a fixed priceCents support self-serve online
 * checkout via their own startHref. Products without one (contractor_match,
 * construction_consultation) need scope and price confirmed by Kealee
 * first, so they route to the manual request-service flow instead.
 */
export function getProductAvailability(key: string): ProductAvailability {
  const product = getPublicCatalogProduct(key)
  if (product && typeof product.priceCents === 'number') return 'online'
  return 'request'
}

export function serviceRequestHref(key: string, name: string): string {
  const params = new URLSearchParams({ service: key, name })
  return `/request-service?${params.toString()}`
}
