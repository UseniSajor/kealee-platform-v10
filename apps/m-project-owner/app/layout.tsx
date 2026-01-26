// apps/m-project-owner/app/layout.tsx
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#2563eb',
};

export const metadata: Metadata = {
  metadataBase: new URL('https://owner.kealee.com'),
  title: {
    default: 'Kealee Project Owner Portal | Construction Project Management for Homeowners',
    template: '%s | Kealee Project Owner',
  },
  description:
    'The only construction management platform built for homeowners. Secure escrow protection, milestone-based payments, readiness checklists, and complete project visibility from first permit to final walkthrough.',
  keywords: [
    'construction project management',
    'homeowner construction portal',
    'escrow protection construction',
    'milestone payments',
    'contractor management',
    'construction compliance',
    'project owner dashboard',
    'construction readiness checklist',
    'home renovation management',
    'construction contract management',
    'contractor payment protection',
    'construction project tracking',
    'home building management',
    'renovation project portal',
  ],
  authors: [{ name: 'Kealee Platform' }],
  creator: 'Kealee Platform',
  publisher: 'Kealee Platform',
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
    url: 'https://owner.kealee.com',
    siteName: 'Kealee Project Owner Portal',
    title: 'Kealee Project Owner Portal - Build Your Dream. Protected.',
    description:
      'Complete construction project management for homeowners. Secure escrow, milestone gates, and full visibility from first permit to final walkthrough.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Kealee Project Owner Portal - Construction Project Management',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kealee Project Owner Portal - Build Your Dream. Protected.',
    description:
      'Complete construction project management for homeowners. Secure escrow, milestone gates, and full visibility.',
    images: ['/og-image.png'],
    creator: '@kealee',
  },
  alternates: {
    canonical: 'https://owner.kealee.com',
  },
  category: 'Construction Management Software',
};

// JSON-LD Structured Data for SEO and AI Search Optimization (ChatGPT, Claude, Perplexity)
const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  '@id': 'https://owner.kealee.com/#application',
  name: 'Kealee Project Owner Portal',
  applicationCategory: 'BusinessApplication',
  applicationSubCategory: 'Construction Management',
  operatingSystem: 'Web Browser',
  url: 'https://owner.kealee.com',
  description:
    'Complete construction project management platform for homeowners featuring secure escrow protection, milestone-based payment releases, contractor management, and real-time project tracking.',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
    description: 'Free for project owners - contractors pay a small transaction fee',
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    reviewCount: '342',
    bestRating: '5',
    worstRating: '1',
  },
  author: {
    '@type': 'Organization',
    name: 'Kealee',
    url: 'https://kealee.com',
  },
  featureList: [
    'Secure escrow protection for construction payments',
    'Milestone-based payment releases',
    'Contractor verification and management',
    'Real-time project tracking dashboard',
    'Document storage and sharing',
    'Dispute resolution support',
    'Construction readiness checklists',
    'Progress photo documentation',
    'Change order management',
    'Inspection scheduling',
  ],
};

const serviceSchema = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: 'Project Owner Construction Management',
  description:
    'End-to-end construction project management for homeowners including contractor vetting, secure payments, milestone tracking, and dispute resolution.',
  provider: {
    '@type': 'Organization',
    name: 'Kealee',
    url: 'https://kealee.com',
  },
  serviceType: 'Construction Project Management',
  areaServed: {
    '@type': 'Country',
    name: 'United States',
  },
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Project Owner Services',
    itemListElement: [
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Escrow Protection',
          description:
            'Secure holding of construction funds with milestone-based releases protecting both homeowners and contractors.',
        },
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Milestone Tracking',
          description:
            'Visual project timeline with automated milestone gates ensuring work is completed before payment release.',
        },
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Contractor Management',
          description:
            'Verified contractor profiles, license checking, insurance verification, and performance ratings.',
        },
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Dispute Resolution',
          description:
            'Fair, transparent dispute resolution process with evidence review and mediation support.',
        },
      },
    ],
  },
};

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How does Kealee protect my construction payments?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Kealee uses secure escrow accounts to hold your construction funds. Money is only released to contractors when you approve completed milestones. This protects you from paying for work that isn\'t done and ensures contractors get paid promptly for completed work.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is the Project Owner Portal free to use?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, the Project Owner Portal is completely free for homeowners. Contractors pay a small transaction fee (typically 1.5-2.5%) when they receive payments through the platform.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do milestone payments work?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Projects are divided into milestones (e.g., Foundation, Framing, Electrical). Funds for each milestone are held in escrow. When a contractor completes a milestone, they submit photos and documentation. You review and approve, then funds are released within 24 hours.',
      },
    },
    {
      '@type': 'Question',
      name: 'What happens if there\'s a dispute with my contractor?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Kealee provides a fair dispute resolution process. Both parties submit evidence, an impartial reviewer evaluates the situation, and a resolution is proposed. During disputes, funds remain safely in escrow until the issue is resolved.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I use Kealee with any contractor?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes! Any licensed contractor can join the Kealee platform. We verify their license, insurance, and background before they can receive payments. You can also invite your preferred contractor to join.',
      },
    },
  ],
};

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: 'https://owner.kealee.com',
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
        <link rel="manifest" href="/manifest.json" />
        <Script
          id="organization-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <Script
          id="service-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
        />
        <Script
          id="faq-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
        <Script
          id="breadcrumb-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
