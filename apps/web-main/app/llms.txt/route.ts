const body = `# Kealee

> Kealee is a preconstruction planning platform for homeowners, contractors, and property developers in the Washington, DC, Maryland, and Northern Virginia region.

Kealee helps customers clarify a project before construction through preliminary design concepts, construction cost estimation, property and zoning research, permit-path guidance, professional design coordination, and contractor matching.

## Important service boundaries

- AI design concepts are preliminary pre-design materials, not permit-ready or stamped construction drawings.
- Permit requirements depend on project scope and jurisdiction and must be verified with the responsible authority.
- Estimates are planning tools unless a product explicitly includes qualified professional review or certification.
- On-site construction is performed by the customer's contractor of record.
- Kealee does not guarantee permit approval, contractor pricing, or entitlement approval.

## Primary resources

- Home: https://kealee.com/
- Homeowner services: https://kealee.com/homeowners
- Design concepts: https://kealee.com/concept
- Cost estimates: https://kealee.com/estimate
- Permit services: https://kealee.com/permits
- Professional design: https://kealee.com/design-services
- Products: https://kealee.com/products
- Pricing: https://kealee.com/pricing
- Service areas: https://kealee.com/service-areas
- Frequently asked questions: https://kealee.com/faq
- Articles and local guides: https://kealee.com/blog
- Machine-readable service facts: https://kealee.com/.well-known/kealee.json
- Extended AI context: https://kealee.com/llms-full.txt

## Contact

- Website: https://kealee.com/contact
- Company: Kealee Services LLC
`

export function GET() {
  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  })
}
