// apps/m-architect/app/layout.tsx
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#2563eb',
};

export const metadata: Metadata = {
  metadataBase: new URL('https://architect.kealee.com'),
  title: {
    default: 'Kealee Architect Hub | Professional Architectural Design & Permit-Ready Plans',
    template: '%s | Kealee Architect',
  },
  description:
    'On-demand licensed architects for permit-ready drawings, 3D renderings, and construction documents. Get professional architectural services with 85% first-pass permit approval rate. ADU designs, renovations, and custom homes.',
  keywords: [
    'architect services',
    'architectural design',
    'permit-ready drawings',
    'construction documents',
    'ADU design',
    'accessory dwelling unit',
    '3D rendering',
    'building permit drawings',
    'residential architect',
    'commercial architect',
    'DC architect',
    'Baltimore architect',
    'renovation design',
    'custom home design',
    'architectural plans',
    'building design services',
  ],
  authors: [{ name: 'Kealee Construction LLC' }],
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
    url: 'https://architect.kealee.com',
    siteName: 'Kealee Architect Hub',
    title: 'Kealee Architect Hub - Professional Design Services On-Demand',
    description:
      'Licensed architects on-demand for permit-ready drawings and construction documents. 85% first-pass approval rate.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Kealee Architect Hub - Professional Architectural Design Services',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kealee Architect Hub - Professional Design Services',
    description:
      'Licensed architects on-demand for permit-ready drawings. 85% first-pass approval rate.',
    images: ['/og-image.png'],
    creator: '@kealee',
  },
  alternates: {
    canonical: 'https://architect.kealee.com',
  },
  category: 'Architectural Services',
};

// JSON-LD Structured Data for SEO and AI Search Optimization
const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'ProfessionalService',
  '@id': 'https://architect.kealee.com/#organization',
  name: 'Kealee Architect Hub',
  url: 'https://architect.kealee.com',
  logo: 'https://architect.kealee.com/logo.png',
  description:
    'Professional architectural design services offering permit-ready drawings, 3D renderings, and construction documents for residential and commercial projects.',
  priceRange: '$$',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Washington',
    addressRegion: 'DC',
    addressCountry: 'US',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: '38.9072',
    longitude: '-77.0369',
  },
  areaServed: [
    { '@type': 'City', name: 'Washington, DC' },
    { '@type': 'City', name: 'Baltimore, MD' },
    { '@type': 'State', name: 'Virginia' },
    { '@type': 'State', name: 'Maryland' },
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+1-202-555-0123',
    contactType: 'customer service',
    availableLanguage: ['English'],
  },
  sameAs: [
    'https://twitter.com/kealeeplatform',
    'https://linkedin.com/company/kealee',
  ],
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.9',
    reviewCount: '127',
    bestRating: '5',
    worstRating: '1',
  },
};

const servicesSchema = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      item: {
        '@type': 'Service',
        name: 'Permit-Ready Architectural Drawings',
        description:
          'Professional architectural drawings designed to meet local building codes with 85% first-pass approval rate. Includes floor plans, elevations, sections, and details.',
        provider: { '@type': 'Organization', name: 'Kealee' },
        serviceType: 'Architectural Design',
        offers: {
          '@type': 'Offer',
          price: '2500',
          priceCurrency: 'USD',
          priceValidUntil: '2026-12-31',
        },
      },
    },
    {
      '@type': 'ListItem',
      position: 2,
      item: {
        '@type': 'Service',
        name: 'ADU Design Services',
        description:
          'Complete Accessory Dwelling Unit design packages including site plans, floor plans, and permit documentation for backyard cottages and garage conversions.',
        provider: { '@type': 'Organization', name: 'Kealee' },
        serviceType: 'ADU Architecture',
      },
    },
    {
      '@type': 'ListItem',
      position: 3,
      item: {
        '@type': 'Service',
        name: '3D Renderings & Visualizations',
        description:
          'Photorealistic 3D renderings and virtual walkthroughs to visualize your project before construction begins.',
        provider: { '@type': 'Organization', name: 'Kealee' },
        serviceType: '3D Visualization',
      },
    },
    {
      '@type': 'ListItem',
      position: 4,
      item: {
        '@type': 'Service',
        name: 'Construction Documents',
        description:
          'Complete construction document sets including structural details, MEP coordination, and specifications for contractor bidding.',
        provider: { '@type': 'Organization', name: 'Kealee' },
        serviceType: 'Construction Documentation',
      },
    },
  ],
};

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How long does it take to get permit-ready drawings?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Most residential projects receive permit-ready drawings within 2-3 weeks. Complex commercial projects may take 4-6 weeks. Rush services are available for an additional fee.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is included in architectural drawings?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Our permit-ready packages include floor plans, elevations, sections, site plans, and all necessary details required by your local building department. We also provide revision rounds to ensure approval.',
      },
    },
    {
      '@type': 'Question',
      name: 'Are your architects licensed?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, all architectural work is prepared or supervised by licensed architects registered in the relevant jurisdictions. We maintain active licenses in DC, Maryland, and Virginia.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is your permit approval rate?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Our drawings have an 85% first-pass permit approval rate, significantly higher than the industry average. When revisions are needed, we handle them at no additional cost.',
      },
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.className}>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <Script
          id="organization-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <Script
          id="services-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(servicesSchema) }}
        />
        <Script
          id="faq-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      </head>
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
