import React from 'react';

export interface Service {
  name: string;
  description: string;
  areaServed: string;
  provider: {
    name: string;
    url: string;
  };
}

export interface Contractor {
  name: string;
  description: string;
  url: string;
  image: string;
  telephone: string;
  address: {
    streetAddress: string;
    addressLocality: string;
    addressRegion: string;
    postalCode: string;
    addressCountry: string;
  };
  geo: {
    latitude: number;
    longitude: number;
  };
  priceRange: string;
  serviceArea: string[];
  services: string[];
  aggregateRating: {
    ratingValue: number;
    ratingCount: number;
    bestRating: number;
    worstRating: number;
  };
}

export interface Review {
  author: string;
  datePublished: string;
  reviewBody: string;
  reviewRating: {
    ratingValue: number;
    bestRating: number;
    worstRating: number;
  };
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface BreadcrumbItem {
  name: string;
  item: string;
}

interface StructuredDataProps {
  type: 'service' | 'contractor' | 'review' | 'faq' | 'breadcrumb';
  data: Service | Contractor | Review | FaqItem[] | BreadcrumbItem[] | any;
}

export default function StructuredData({ type, data }: StructuredDataProps) {
  const getSchema = () => {
    switch (type) {
      case 'service':
        return getServiceSchema(data as Service);
      case 'contractor':
        return getContractorSchema(data as Contractor);
      case 'review':
        return getReviewSchema(data as Review);
      case 'faq':
        return getFaqSchema(data);
      case 'breadcrumb':
        return getBreadcrumbSchema(data);
      default:
        return null;
    }
  };

  const getServiceSchema = (service: Service) => ({
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
  });

  const getContractorSchema = (contractor: Contractor) => ({
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
  });

  const getReviewSchema = (review: Review) => ({
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
  });

  const getFaqSchema = (faqs: FaqItem[]) => ({
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
  });

  const getBreadcrumbSchema = (breadcrumbs: BreadcrumbItem[]) => ({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((breadcrumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: breadcrumb.name,
      item: breadcrumb.item
    }))
  });

  const schema = getSchema();

  if (!schema) return null;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
