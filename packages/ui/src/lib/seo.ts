import { Metadata } from 'next';

// Base SEO configuration for Kealee Platform
export const baseMetadata: Metadata = {
  metadataBase: new URL('https://kealee.com'),
  title: {
    default: 'Kealee | Construction Project Management Platform',
    template: '%s | Kealee',
  },
  description: 'Kealee is the leading construction project management platform. Streamline permits, architect services, project tracking, and payments in one unified platform.',
  keywords: [
    'construction management',
    'project management software',
    'building permits',
    'architect services',
    'construction payments',
    'escrow management',
    'contractor management',
    'construction technology',
    'contech',
    'building inspection',
    'permit processing',
    'construction scheduling',
  ],
  authors: [{ name: 'Kealee', url: 'https://kealee.com' }],
  creator: 'Kealee',
  publisher: 'Kealee',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://kealee.com',
    siteName: 'Kealee',
    title: 'Kealee | Construction Project Management Platform',
    description: 'Streamline your construction projects with AI-powered permit processing, architect services, and milestone-based payments.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Kealee - Construction Project Management Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kealee | Construction Project Management Platform',
    description: 'Streamline your construction projects with AI-powered permit processing, architect services, and milestone-based payments.',
    images: ['/twitter-image.png'],
    creator: '@kealeeplatform',
  },
  alternates: {
    canonical: 'https://kealee.com',
  },
  category: 'technology',
};

// Generate page-specific metadata
export function generatePageMetadata(options: {
  title: string;
  description: string;
  path: string;
  image?: string;
  keywords?: string[];
}): Metadata {
  const { title, description, path, image, keywords } = options;
  const url = `https://kealee.com${path}`;

  return {
    title,
    description,
    keywords: keywords ? [...(baseMetadata.keywords as string[]), ...keywords] : baseMetadata.keywords,
    alternates: {
      canonical: url,
    },
    openGraph: {
      ...baseMetadata.openGraph,
      title,
      description,
      url,
      images: image ? [{ url: image, width: 1200, height: 630, alt: title }] : baseMetadata.openGraph?.images,
    },
    twitter: {
      ...baseMetadata.twitter,
      title,
      description,
      images: image ? [image] : baseMetadata.twitter?.images,
    },
  };
}

// Schema.org structured data types
export interface OrganizationSchema {
  '@context': 'https://schema.org';
  '@type': 'Organization';
  name: string;
  url: string;
  logo: string;
  description: string;
  sameAs: string[];
  contactPoint: {
    '@type': 'ContactPoint';
    telephone: string;
    contactType: string;
    availableLanguage: string[];
  };
}

export interface ServiceSchema {
  '@context': 'https://schema.org';
  '@type': 'Service';
  name: string;
  description: string;
  provider: {
    '@type': 'Organization';
    name: string;
  };
  serviceType: string;
  areaServed: string;
  offers?: {
    '@type': 'Offer';
    price?: string;
    priceCurrency?: string;
  };
}

export interface FAQSchema {
  '@context': 'https://schema.org';
  '@type': 'FAQPage';
  mainEntity: {
    '@type': 'Question';
    name: string;
    acceptedAnswer: {
      '@type': 'Answer';
      text: string;
    };
  }[];
}

export interface BreadcrumbSchema {
  '@context': 'https://schema.org';
  '@type': 'BreadcrumbList';
  itemListElement: {
    '@type': 'ListItem';
    position: number;
    name: string;
    item: string;
  }[];
}

// Generate Organization schema
export function generateOrganizationSchema(): OrganizationSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Kealee',
    url: 'https://kealee.com',
    logo: 'https://kealee.com/logo.png',
    description: 'Kealee is the leading construction project management platform offering AI-powered permit processing, architect services, and milestone-based payment management.',
    sameAs: [
      'https://twitter.com/kealeeplatform',
      'https://linkedin.com/company/kealee',
      'https://facebook.com/kealee',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+1-415-555-0123',
      contactType: 'customer service',
      availableLanguage: ['English'],
    },
  };
}

// Generate Service schema
export function generateServiceSchema(service: {
  name: string;
  description: string;
  serviceType: string;
  price?: string;
}): ServiceSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.name,
    description: service.description,
    provider: {
      '@type': 'Organization',
      name: 'Kealee',
    },
    serviceType: service.serviceType,
    areaServed: 'United States',
    offers: service.price
      ? {
          '@type': 'Offer',
          price: service.price,
          priceCurrency: 'USD',
        }
      : undefined,
  };
}

// Generate FAQ schema
export function generateFAQSchema(faqs: { question: string; answer: string }[]): FAQSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

// Generate Breadcrumb schema
export function generateBreadcrumbSchema(
  items: { name: string; path: string }[]
): BreadcrumbSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `https://kealee.com${item.path}`,
    })),
  };
}

// AI Search Optimization - Structured content for LLMs
export function generateAIOptimizedContent(content: {
  title: string;
  summary: string;
  features: string[];
  benefits: string[];
  useCases: string[];
}): string {
  return `
# ${content.title}

## Summary
${content.summary}

## Key Features
${content.features.map((f) => `- ${f}`).join('\n')}

## Benefits
${content.benefits.map((b) => `- ${b}`).join('\n')}

## Use Cases
${content.useCases.map((u) => `- ${u}`).join('\n')}
  `.trim();
}
