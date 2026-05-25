import { KEALEE_PHONE_DISPLAY, KEALEE_SITE_URL } from '@/lib/site/contact'

export type ServiceArea = {
  slug: string
  name: string
  region: string
  headline: string
  description: string
  keywords: string[]
  highlights: string[]
  permitAgency: string
  typicalTimeline: string
  primaryCta: { label: string; href: string }
}

export const SERVICE_AREAS: ServiceArea[] = [
  {
    slug: 'oxon-hill-md',
    name: 'Oxon Hill',
    region: 'Prince George\'s County, MD',
    headline: 'Construction & Permits in Oxon Hill, MD — Kealee HQ',
    description:
      'Kealee is headquartered in Oxon Hill. AI design concepts, permit filing, estimates, and contractor matching for PG County homeowners — minutes from National Harbor and the Beltway.',
    keywords: ['Oxon Hill contractor', 'construction Oxon Hill MD', 'Prince George\'s County permit', 'home renovation Oxon Hill'],
    highlights: [
      'Local HQ — same-day consults for PG County projects',
      'PG County DPS permit expertise',
      'Additions, kitchens, ADUs, and exterior work',
    ],
    permitAgency: 'Prince George\'s County DPS',
    typicalTimeline: '4–10 weeks plan review',
    primaryCta: { label: 'Start AI concept', href: '/concept' },
  },
  {
    slug: 'silver-spring-md',
    name: 'Silver Spring',
    region: 'Montgomery County, MD',
    headline: 'Home Renovation & Permits in Silver Spring, MD',
    description:
      'Montgomery County permit prep, AI concepts, and vetted contractors for Silver Spring renovations, additions, and interior remodels.',
    keywords: ['Silver Spring contractor', 'Montgomery County permit', 'kitchen remodel Silver Spring'],
    highlights: ['Montgomery DPS ePlans workflow', 'HOA coordination experience', 'Whole-home and addition concepts'],
    permitAgency: 'Montgomery County DPS',
    typicalTimeline: '4–8 weeks',
    primaryCta: { label: 'Permit services', href: '/permits' },
  },
  {
    slug: 'washington-dc',
    name: 'Washington DC',
    region: 'District of Columbia',
    headline: 'DC Building Permits & AI Design — Washington DC',
    description:
      'DLCP permit filing, historic district awareness, and AI concept packages for DC row homes, condos, and additions.',
    keywords: ['DC building permit', 'contractor Washington DC', 'kitchen remodel DC', 'DLCP permit'],
    highlights: ['DLCP / permits.dc.gov submissions', 'Row home and condo expertise', 'HPRB coordination when required'],
    permitAgency: 'DC DLCP (Dept. of Licensing and Consumer Protection)',
    typicalTimeline: '2–5 months full review; minor work faster',
    primaryCta: { label: 'DC permit guide', href: '/blog/dc-dcra-permit-guide' },
  },
  {
    slug: 'fairfax-va',
    name: 'Fairfax County',
    region: 'Northern Virginia',
    headline: 'Fairfax County Renovation & Permit Services',
    description:
      'Fast-track Fairfax LDS permits, cost estimates, and contractor matching for Vienna, McLean, Reston, and county-wide projects.',
    keywords: ['Fairfax County permit', 'contractor Fairfax VA', 'home addition Fairfax'],
    highlights: ['Fairfax Permit Portal', 'Basement finish and addition scope', 'Typical 2–4 week minor permits'],
    permitAgency: 'Fairfax County Land Development Services',
    typicalTimeline: '2–4 weeks many residential scopes',
    primaryCta: { label: 'Get estimate', href: '/estimate' },
  },
  {
    slug: 'arlington-va',
    name: 'Arlington',
    region: 'Virginia',
    headline: 'Arlington VA Permits & Remodeling — Kealee',
    description:
      'Arlington County zoning, impervious cover rules, and renovation permits — concepts through contractor match.',
    keywords: ['Arlington VA permit', 'renovation Arlington', 'contractor Arlington VA'],
    highlights: ['Form-based code corridors', 'Historic district awareness', 'Interior and facade projects'],
    permitAgency: 'Arlington County Planning & Zoning',
    typicalTimeline: '3–6 weeks',
    primaryCta: { label: 'Book a call', href: '/book-a-call' },
  },
  {
    slug: 'alexandria-va',
    name: 'Alexandria',
    region: 'Virginia',
    headline: 'Alexandria VA Construction & Permit Filing',
    description:
      'Old Town and suburban Alexandria renovations — permit prep, AI concepts, and milestone-based payments.',
    keywords: ['Alexandria VA permit', 'contractor Alexandria', 'home renovation Alexandria'],
    highlights: ['City of Alexandria P&Z', 'Row house and townhouse scope', 'Waterfront district constraints'],
    permitAgency: 'City of Alexandria Planning & Zoning',
    typicalTimeline: '3–6 weeks',
    primaryCta: { label: 'Permits DMV hub', href: '/permits/dmv' },
  },
  {
    slug: 'bethesda-md',
    name: 'Bethesda',
    region: 'Montgomery County, MD',
    headline: 'Bethesda MD Home Projects — Design, Permits, Build',
    description:
      'High-end renovation and addition support in Bethesda — AI concepts, Montgomery permits, and escrow milestone pay.',
    keywords: ['Bethesda contractor', 'Montgomery County renovation', 'kitchen remodel Bethesda'],
    highlights: ['Montgomery County DPS', 'Addition and whole-home concepts', 'Contractor vetting'],
    permitAgency: 'Montgomery County DPS',
    typicalTimeline: '4–8 weeks',
    primaryCta: { label: 'View pricing', href: '/pricing' },
  },
]

export const SERVICE_AREA_SLUGS = SERVICE_AREAS.map((a) => a.slug)

export function getServiceArea(slug: string): ServiceArea | undefined {
  return SERVICE_AREAS.find((a) => a.slug === slug)
}

export function serviceAreaJsonLd(area: ServiceArea) {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: `Kealee — ${area.name}`,
    url: `${KEALEE_SITE_URL}/service-areas/${area.slug}`,
    description: area.description,
    areaServed: area.name,
    telephone: KEALEE_PHONE_DISPLAY,
  }
}
