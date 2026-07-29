import {
  KEALEE_ADDRESS,
  KEALEE_EMAIL,
  KEALEE_PHONE_DISPLAY,
  KEALEE_PHONE_E164,
  KEALEE_GEO_LAT,
  KEALEE_GEO_LNG,
  KEALEE_HQ_DISPLAY,
  KEALEE_SERVICE_AREAS,
  KEALEE_SITE_URL,
} from '@/lib/site/contact'
import { REVENUE_PRODUCT_CATALOG } from '@/lib/revenue-product-catalog'

type JsonLd = Record<string, unknown>

export function buildOrganizationJsonLd(): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${KEALEE_SITE_URL}/#organization`,
    name: 'Kealee Platform',
    legalName: 'Kealee Services LLC',
    url: KEALEE_SITE_URL,
    logo: `${KEALEE_SITE_URL}/media/service-photos/home-design.jpg`,
    email: KEALEE_EMAIL,
    telephone: KEALEE_PHONE_E164,
    sameAs: [
      'https://www.linkedin.com/company/kealee',
      'https://www.facebook.com/kealee',
    ],
    description:
      'Nationwide AI-powered design concepts, jurisdiction-aware permit analysis, cost estimation, and contractor matching for construction projects.',
    areaServed: KEALEE_SERVICE_AREAS.map((name) => ({
      '@type': 'AdministrativeArea',
      name,
    })),
  }
}

export function buildWebSiteJsonLd(): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${KEALEE_SITE_URL}/#website`,
    url: KEALEE_SITE_URL,
    name: 'Kealee',
    description:
      'Design → Permits → Estimate → Build — a nationwide AI construction platform.',
    publisher: { '@id': `${KEALEE_SITE_URL}/#organization` },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${KEALEE_SITE_URL}/faq?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
}

export function buildLocalBusinessJsonLd(): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'HomeAndConstructionBusiness',
    '@id': `${KEALEE_SITE_URL}/#localbusiness`,
    name: 'Kealee Construction',
    image: `${KEALEE_SITE_URL}/media/service-photos/home-design.jpg`,
    url: KEALEE_SITE_URL,
    telephone: KEALEE_PHONE_E164,
    email: KEALEE_EMAIL,
    priceRange: '$$',
    address: {
      '@type': 'PostalAddress',
      ...KEALEE_ADDRESS,
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: KEALEE_GEO_LAT,
      longitude: KEALEE_GEO_LNG,
    },
    areaServed: KEALEE_SERVICE_AREAS,
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '09:00',
      closes: '18:00',
    },
    parentOrganization: { '@id': `${KEALEE_SITE_URL}/#organization` },
    description: `Headquarters in ${KEALEE_HQ_DISPLAY}. Nationwide AI preconstruction services with jurisdiction-aware professional handoff. Call ${KEALEE_PHONE_DISPLAY}.`,
  }
}

export function buildServiceJsonLd(): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: 'AI construction platform',
    provider: { '@id': `${KEALEE_SITE_URL}/#organization` },
    areaServed: KEALEE_SERVICE_AREAS,
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Kealee project journey',
      itemListElement: Object.values(REVENUE_PRODUCT_CATALOG).map(product => ({
        '@type': 'Offer',
        price: (product.priceCents / 100).toFixed(2),
        priceCurrency: 'USD',
        url: `${KEALEE_SITE_URL}/products/${product.productKey}`,
        itemOffered: { '@type': 'Service', name: product.name },
        description: `Preliminary planning service. Excludes: ${product.exclusions.join(', ')}.`,
      })),
    },
  }
}

export function buildBreadcrumbJsonLd(items: Array<{ name: string; url: string }>): JsonLd {
  return { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items.map((item, index) => ({ '@type': 'ListItem', position: index + 1, name: item.name, item: item.url })) }
}

export function buildGlobalJsonLdGraph(): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      buildOrganizationJsonLd(),
      buildWebSiteJsonLd(),
      buildLocalBusinessJsonLd(),
      buildServiceJsonLd(),
    ],
  }
}

export function buildFaqPageJsonLd(
  sections: ReadonlyArray<{ questions: ReadonlyArray<{ q: string; a: string }> }>,
): JsonLd {
  const mainEntity = sections.flatMap((s) =>
    s.questions.map((qa) => ({
      '@type': 'Question',
      name: qa.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: qa.a,
      },
    })),
  )
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity,
  }
}
