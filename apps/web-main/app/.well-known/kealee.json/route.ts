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
  serviceCatalog: [
    { name: 'Preliminary design concepts', url: 'https://kealee.com/concept', boundary: 'Pre-design; not permit-ready drawings' },
    { name: 'Construction cost estimation', url: 'https://kealee.com/estimate', boundary: 'Planning estimate unless professional certification is explicitly included' },
    { name: 'Permit-path services', url: 'https://kealee.com/permits', boundary: 'Requirements must be verified with the responsible jurisdiction' },
    { name: 'Professional design coordination', url: 'https://kealee.com/design-services' },
    { name: 'Contractor matching', url: 'https://kealee.com/contractors', boundary: 'On-site work is performed by the contractor of record' },
  ],
  lastReviewed: '2026-07-20',
  canonicalFacts: 'https://kealee.com/llms-full.txt',
}

export function GET() {
  return Response.json(serviceFacts, {
    headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=86400' },
  })
}
