'use client';

import Script from 'next/script';

interface StructuredDataProps {
  data: object | object[];
}

/**
 * Component to inject JSON-LD structured data for SEO and AI search optimization
 * Supports Schema.org types for rich search results in Google, Bing, and AI assistants
 */
export function StructuredData({ data }: StructuredDataProps) {
  const jsonLd = Array.isArray(data) ? data : [data];

  return (
    <>
      {jsonLd.map((schema, index) => (
        <Script
          key={index}
          id={`structured-data-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schema),
          }}
          strategy="afterInteractive"
        />
      ))}
    </>
  );
}

/**
 * Pre-built structured data for Kealee services
 */
export const KealeeSchemas = {
  organization: {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Kealee',
    url: 'https://kealee.com',
    logo: 'https://kealee.com/logo.png',
    description: 'Leading construction project management platform with AI-powered permit processing, architect services, and milestone-based payments.',
    foundingDate: '2023',
    industry: 'Construction Technology',
    sameAs: [
      'https://twitter.com/kealeeplatform',
      'https://linkedin.com/company/kealee',
    ],
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'San Francisco',
      addressRegion: 'CA',
      addressCountry: 'US',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+1-415-555-0123',
      contactType: 'customer service',
      availableLanguage: ['English'],
    },
  },

  permitService: {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'AI-Powered Permit Processing',
    description: 'Streamline building permit applications with AI review that achieves 85% first-pass approval rate. Reduce permit processing time from weeks to minutes.',
    provider: { '@type': 'Organization', name: 'Kealee' },
    serviceType: 'Building Permit Processing',
    areaServed: { '@type': 'Country', name: 'United States' },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Permit Services',
      itemListElement: [
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Residential Permit Processing',
            description: 'Fast-track residential building permits',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Commercial Permit Processing',
            description: 'Comprehensive commercial permit management',
          },
        },
      ],
    },
  },

  architectService: {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Architect Services',
    description: 'Professional architectural design services including permit-ready drawings, 3D renderings, and construction documents. Licensed architects with fast turnaround.',
    provider: { '@type': 'Organization', name: 'Kealee' },
    serviceType: 'Architectural Design',
    areaServed: { '@type': 'Country', name: 'United States' },
  },

  projectManagement: {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Kealee Project Management',
    description: 'Construction project management software with milestone tracking, escrow payments, contractor management, and real-time progress monitoring.',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web Browser',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      description: 'Free to start, pay per project',
    },
  },

  escrowService: {
    '@context': 'https://schema.org',
    '@type': 'FinancialService',
    name: 'Construction Escrow Services',
    description: 'Secure milestone-based payment escrow for construction projects. Protect both homeowners and contractors with transparent fund management.',
    provider: { '@type': 'Organization', name: 'Kealee' },
    serviceType: 'Escrow Service',
    areaServed: { '@type': 'Country', name: 'United States' },
  },
};

/**
 * Generate FAQ schema from Q&A pairs
 */
export function generateFAQSchema(faqs: { question: string; answer: string }[]) {
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

/**
 * Generate HowTo schema for process explanations
 */
export function generateHowToSchema(howTo: {
  name: string;
  description: string;
  steps: { name: string; text: string; image?: string }[];
  totalTime?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: howTo.name,
    description: howTo.description,
    totalTime: howTo.totalTime,
    step: howTo.steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.name,
      text: step.text,
      image: step.image,
    })),
  };
}

export default StructuredData;
