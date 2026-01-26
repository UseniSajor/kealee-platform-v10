import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Finance Trust | Secure Construction Escrow Platform',
  description:
    'Enterprise-grade escrow platform for construction projects. Secure your funds with milestone-based payment releases, bank-level security, and complete transparency. FDIC insured, SOC 2 certified.',
  keywords: [
    'construction escrow',
    'escrow services',
    'construction payments',
    'milestone payments',
    'payment protection',
    'construction finance',
    'secure escrow',
    'project escrow',
    'contractor payments',
    'FDIC insured escrow',
  ],
  authors: [{ name: 'Kealee' }],
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
    url: 'https://trust.kealee.com',
    siteName: 'Finance Trust by Kealee',
    title: 'Finance Trust | Secure Construction Escrow Platform',
    description:
      'Enterprise-grade escrow platform for construction projects. Secure your funds with milestone-based payment releases and bank-level security.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Finance Trust - Secure Construction Escrow Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Finance Trust | Secure Construction Escrow Platform',
    description:
      'Enterprise-grade escrow platform for construction projects. Secure your funds with milestone-based payment releases.',
    images: ['/og-image.png'],
    creator: '@kealee',
  },
  verification: {
    google: 'google-site-verification-code',
  },
  alternates: {
    canonical: 'https://trust.kealee.com',
  },
};

// JSON-LD Structured Data
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://trust.kealee.com/#organization',
      name: 'Finance Trust by Kealee',
      url: 'https://trust.kealee.com',
      logo: {
        '@type': 'ImageObject',
        url: 'https://trust.kealee.com/logo.png',
        width: 512,
        height: 512,
      },
      description:
        'Enterprise-grade escrow platform for construction projects providing secure, transparent financial management.',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Washington',
        addressRegion: 'DC',
        addressCountry: 'US',
      },
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: '+1-800-555-8787',
        contactType: 'customer service',
        availableLanguage: ['English'],
        areaServed: 'US',
      },
      sameAs: [
        'https://www.linkedin.com/company/kealee',
        'https://twitter.com/kealee',
      ],
    },
    {
      '@type': 'WebSite',
      '@id': 'https://trust.kealee.com/#website',
      url: 'https://trust.kealee.com',
      name: 'Finance Trust',
      description: 'Secure Construction Escrow Platform',
      publisher: {
        '@id': 'https://trust.kealee.com/#organization',
      },
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: 'https://trust.kealee.com/search?q={search_term_string}',
        },
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'FinancialService',
      '@id': 'https://trust.kealee.com/#service',
      name: 'Construction Escrow Services',
      description:
        'Secure escrow accounts and milestone-based payment management for construction projects.',
      provider: {
        '@id': 'https://trust.kealee.com/#organization',
      },
      serviceType: 'Escrow Services',
      areaServed: {
        '@type': 'Country',
        name: 'United States',
      },
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'Escrow Services',
        itemListElement: [
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              name: 'Construction Escrow',
              description:
                'Purpose-built escrow accounts for construction projects with milestone-based fund management.',
            },
          },
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              name: 'Payment Protection',
              description:
                'Protect contractors and owners with verified payment releases tied to work completion.',
            },
          },
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              name: 'Compliance & Audit',
              description:
                'Stay compliant with automated reporting, audit trails, and regulatory documentation.',
            },
          },
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              name: 'Financial Analytics',
              description:
                'Comprehensive dashboards and reports for complete visibility into project finances.',
            },
          },
        ],
      },
    },
    {
      '@type': 'FAQPage',
      '@id': 'https://trust.kealee.com/#faq',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What is construction escrow?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Construction escrow is a financial arrangement where funds are held by a neutral third party until specific project milestones are completed and verified. This protects both contractors and project owners by ensuring payments are made only when work is satisfactorily completed.',
          },
        },
        {
          '@type': 'Question',
          name: 'Are funds FDIC insured?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes, all funds held in Finance Trust escrow accounts are FDIC insured up to $250,000 per depositor, per insured bank. We work with partner banks that provide full FDIC insurance coverage.',
          },
        },
        {
          '@type': 'Question',
          name: 'How long does it take to release funds?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Once a milestone is approved by all required parties, funds are typically released within 24 hours via ACH transfer. Same-day wire transfers are also available for an additional fee.',
          },
        },
        {
          '@type': 'Question',
          name: 'What security measures are in place?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Finance Trust employs bank-level security including AES-256 encryption, multi-factor authentication, SOC 2 Type II certification, and 24/7 security monitoring. All data is stored in redundant, geographically distributed data centers.',
          },
        },
      ],
    },
    {
      '@type': 'BreadcrumbList',
      '@id': 'https://trust.kealee.com/#breadcrumb',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: 'https://trust.kealee.com',
        },
      ],
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
