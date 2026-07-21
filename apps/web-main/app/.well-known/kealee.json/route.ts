import { REVENUE_PRODUCT_CATALOG } from '../../../lib/revenue-product-catalog'

const serviceFacts = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Kealee',
  legalName: 'Kealee Services LLC',
  url: 'https://kealee.com',
  areaServed: [
    'Washington, DC', 'Montgomery County, Maryland', 'Prince George’s County, Maryland',
    'Arlington County, Virginia', 'Alexandria, Virginia', 'Fairfax County, Virginia',
    'Loudoun County, Virginia', 'Prince William County, Virginia',
  ],
  audience: ['Homeowners', 'Contractors', 'Property developers'],
  serviceCatalog: Object.values(REVENUE_PRODUCT_CATALOG).map(product => ({
    key: product.productKey, name: product.name, priceCents: product.priceCents,
    deliveryHours: product.fulfillmentSlaHours, exclusions: product.exclusions,
    url: `https://kealee.com/products/${product.productKey}`,
    boundary: 'Preliminary planning output unless a qualified professional explicitly supplies a reviewed, stamped, sealed, or certified artifact.',
  })),
  lastReviewed: '2026-07-20',
  canonicalFacts: 'https://kealee.com/llms-full.txt',
}

export function GET() {
  return Response.json(serviceFacts, {
    headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=86400' },
  })
}
