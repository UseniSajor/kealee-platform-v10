import type { Service, Contractor, Review, FaqItem, BreadcrumbItem } from '@/components/StructuredData';

/**
 * Generate Service schema
 */
export function generateServiceSchema(service: Service) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.name,
    description: service.description,
    areaServed: service.areaServed,
    provider: {
      '@type': 'Organization',
      name: service.provider.name,
      url: service.provider.url
    },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock'
    }
  };
}

/**
 * Generate Contractor/HomeAndConstructionBusiness schema
 */
export function generateContractorSchema(contractor: Contractor) {
  return {
    '@context': 'https://schema.org',
    '@type': 'HomeAndConstructionBusiness',
    name: contractor.name,
    description: contractor.description,
    url: contractor.url,
    image: contractor.image,
    telephone: contractor.telephone,
    address: {
      '@type': 'PostalAddress',
      streetAddress: contractor.address.streetAddress,
      addressLocality: contractor.address.addressLocality,
      addressRegion: contractor.address.addressRegion,
      postalCode: contractor.address.postalCode,
      addressCountry: contractor.address.addressCountry
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: contractor.geo.latitude,
      longitude: contractor.geo.longitude
    },
    priceRange: contractor.priceRange,
    areaServed: contractor.serviceArea,
    makesOffer: contractor.services.map(service => ({
      '@type': 'Offer',
      itemOffered: {
        '@type': 'Service',
        name: service
      }
    })),
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: contractor.aggregateRating.ratingValue,
      ratingCount: contractor.aggregateRating.ratingCount,
      bestRating: contractor.aggregateRating.bestRating,
      worstRating: contractor.aggregateRating.worstRating
    }
  };
}

/**
 * Generate Review schema
 */
export function generateReviewSchema(review: Review) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Review',
    author: {
      '@type': 'Person',
      name: review.author
    },
    datePublished: review.datePublished,
    reviewBody: review.reviewBody,
    reviewRating: {
      '@type': 'Rating',
      ratingValue: review.reviewRating.ratingValue,
      bestRating: review.reviewRating.bestRating,
      worstRating: review.reviewRating.worstRating
    }
  };
}

/**
 * Generate FAQPage schema
 */
export function generateFaqSchema(faqs: FaqItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  };
}

/**
 * Generate BreadcrumbList schema
 */
export function generateBreadcrumbSchema(breadcrumbs: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((breadcrumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: breadcrumb.name,
      item: breadcrumb.item
    }))
  };
}

/**
 * Generate multiple reviews schema (for contractor pages with multiple reviews)
 */
export function generateReviewCollectionSchema(reviews: Review[], itemReviewed?: { name: string; url: string }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: reviews.map((review, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Review',
        author: {
          '@type': 'Person',
          name: review.author
        },
        datePublished: review.datePublished,
        reviewBody: review.reviewBody,
        reviewRating: {
          '@type': 'Rating',
          ratingValue: review.reviewRating.ratingValue,
          bestRating: review.reviewRating.bestRating,
          worstRating: review.reviewRating.worstRating
        },
        ...(itemReviewed && {
          itemReviewed: {
            '@type': 'LocalBusiness',
            name: itemReviewed.name,
            url: itemReviewed.url
          }
        })
      }
    }))
  };
}

/**
 * Generate Product schema (for marketplace products/services)
 */
export function generateProductSchema(product: {
  name: string;
  description: string;
  image: string;
  sku?: string;
  brand?: string;
  offers?: {
    price: string;
    priceCurrency: string;
    availability: string;
    url?: string;
  };
  aggregateRating?: {
    ratingValue: number;
    ratingCount: number;
  };
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.image,
    ...(product.sku && { sku: product.sku }),
    ...(product.brand && {
      brand: {
        '@type': 'Brand',
        name: product.brand
      }
    }),
    ...(product.offers && {
      offers: {
        '@type': 'Offer',
        price: product.offers.price,
        priceCurrency: product.offers.priceCurrency,
        availability: product.offers.availability,
        ...(product.offers.url && { url: product.offers.url })
      }
    }),
    ...(product.aggregateRating && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: product.aggregateRating.ratingValue,
        reviewCount: product.aggregateRating.ratingCount
      }
    })
  };
}
