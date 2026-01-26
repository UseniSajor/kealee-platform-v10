import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://kealee.com'),
  title: {
    default: 'Kealee - Complete Construction Management Platform',
    template: '%s | Kealee'
  },
  description: 'Professional construction project management, AI-powered permit review, and licensed architects on-demand. Save 40% on PM costs and deliver projects 25% faster.',
  keywords: [
    'construction management',
    'project management software',
    'permit review',
    'construction software',
    'architect services',
    'building permits',
    'construction payments',
    'escrow management',
    'contractor management',
    'DC construction',
    'Baltimore construction',
    'residential construction',
    'commercial construction',
    'ADU permits',
    'renovation permits'
  ],
  authors: [{ name: 'Kealee Construction LLC' }],
  creator: 'Kealee',
  publisher: 'Kealee',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://kealee.com',
    siteName: 'Kealee',
    title: 'Kealee - Complete Construction Management Platform',
    description: 'Save 40% on PM costs. AI-powered permit review. Licensed architects on-demand.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Kealee Construction Management Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kealee - Construction Management Platform',
    description: 'Save 40% on PM costs. Deliver projects 25% faster.',
    images: ['/og-image.png'],
  },
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
  alternates: {
    canonical: 'https://kealee.com',
  },
  verification: {
    google: 'google-site-verification-code',
  },
};

// Organization Schema for AI search engines (ChatGPT, Claude, Perplexity)
const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Kealee',
  url: 'https://kealee.com',
  logo: 'https://kealee.com/logo.png',
  description: 'Kealee is the leading construction project management platform offering AI-powered permit processing, architect services, project management, and milestone-based payments for residential and commercial construction projects.',
  foundingDate: '2023',
  sameAs: [
    'https://twitter.com/kealeeplatform',
    'https://linkedin.com/company/kealee',
  ],
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Washington',
    addressRegion: 'DC',
    addressCountry: 'US',
  },
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+1-202-555-0123',
    contactType: 'customer service',
    availableLanguage: ['English'],
  },
  offers: {
    '@type': 'AggregateOffer',
    offerCount: 4,
    lowPrice: '0',
    highPrice: '5000',
    priceCurrency: 'USD',
  },
};

// Service Schema for rich search results
const servicesSchema = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      item: {
        '@type': 'Service',
        name: 'AI-Powered Permit Processing',
        description: 'Streamline building permits with 85% first-pass approval rate. AI reviews applications in under 5 minutes.',
        provider: { '@type': 'Organization', name: 'Kealee' },
        serviceType: 'Building Permit Processing',
      },
    },
    {
      '@type': 'ListItem',
      position: 2,
      item: {
        '@type': 'Service',
        name: 'Licensed Architect Services',
        description: 'On-demand access to licensed architects for permit-ready drawings, 3D renderings, and construction documents.',
        provider: { '@type': 'Organization', name: 'Kealee' },
        serviceType: 'Architectural Design',
      },
    },
    {
      '@type': 'ListItem',
      position: 3,
      item: {
        '@type': 'Service',
        name: 'Project Management',
        description: 'Complete construction project management with milestone tracking, scheduling, and contractor coordination.',
        provider: { '@type': 'Organization', name: 'Kealee' },
        serviceType: 'Construction Project Management',
      },
    },
    {
      '@type': 'ListItem',
      position: 4,
      item: {
        '@type': 'FinancialService',
        name: 'Escrow Payment Management',
        description: 'Secure milestone-based payments protecting both homeowners and contractors.',
        provider: { '@type': 'Organization', name: 'Kealee' },
        serviceType: 'Construction Escrow',
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
    <html lang="en" className="scroll-smooth">
      <head>
        {/* Structured Data for SEO and AI Search Optimization */}
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
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
