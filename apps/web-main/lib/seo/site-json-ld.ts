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

type JsonLd = Record<string, unknown>

export function buildOrganizationJsonLd(): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${KEALEE_SITE_URL}/#organization`,
    name: 'Kealee Platform',
    legalName: 'Kealee Platform LLC',
    url: KEALEE_SITE_URL,
    logo: `${KEALEE_SITE_URL}/media/service-photos/home-design.jpg`,
    email: KEALEE_EMAIL,
    telephone: KEALEE_PHONE_E164,
    sameAs: [
      'https://www.linkedin.com/company/kealee',
      'https://www.facebook.com/kealee',
    ],
    description:
      'AI-powered design concepts, permit analysis, cost estimation, and contractor matching for construction projects in DC, Maryland, and Virginia.',
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
      'Design → Permits → Estimate → Build — AI construction platform for the DC metro.',
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
    description: `Headquarters in ${KEALEE_HQ_DISPLAY}. DC metro design-build and AI platform services. Call ${KEALEE_PHONE_DISPLAY}.`,
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
      itemListElement: [
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'AI Design Concepts',
            url: `${KEALEE_SITE_URL}/concept`,
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Permit Analysis & Filing',
            url: `${KEALEE_SITE_URL}/permits`,
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Cost Estimation',
            url: `${KEALEE_SITE_URL}/estimate`,
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Contractor Marketplace',
            url: `${KEALEE_SITE_URL}/marketplace`,
          },
        },
      ],
    },
  }
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
