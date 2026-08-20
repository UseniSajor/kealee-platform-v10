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

/**
 * Buyer-facing label for a product's availability.
 *
 * `app/products/page.tsx` has always imported this, but it was never exported —
 * so the call resolved to `undefined(...)` and threw, which is why /products
 * returned HTTP 500 in production.
 */
export function availabilityLabel(availability: ProductAvailability): string {
  return availability === 'online' ? 'Buy online' : 'Request pricing'
}

export function serviceRequestHref(key: string, name: string): string {
  const params = new URLSearchParams({ service: key, name })
  return `/request-service?${params.toString()}`
}
