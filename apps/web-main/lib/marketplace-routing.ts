export type MarketplaceAudience = 'contractor' | 'developer' | 'service-provider'

const PROFESSIONAL_ESTIMATE_AUDIENCES = new Set<MarketplaceAudience>([
  'contractor',
  'developer',
  'service-provider',
])

/**
 * Returns the Marketplace audience for legacy professional acquisition paths.
 * Homeowner/project-owner service routes intentionally return null.
 */
export function getMarketplaceAudience(
  pathname: string,
  requestedClientType?: string | null,
): MarketplaceAudience | null {
  if (pathname === '/contractors' || pathname.startsWith('/contractors/')) {
    return 'contractor'
  }

  if (pathname === '/developers' || pathname.startsWith('/developers/')) {
    return 'developer'
  }

  if (
    pathname === '/intake/cost_estimate' &&
    requestedClientType &&
    PROFESSIONAL_ESTIMATE_AUDIENCES.has(requestedClientType as MarketplaceAudience)
  ) {
    return requestedClientType as MarketplaceAudience
  }

  return null
}
