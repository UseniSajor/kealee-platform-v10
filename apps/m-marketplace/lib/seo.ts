import { Metadata } from 'next';

interface SeoMetadataProps {
  title?: string;
  description?: string;
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: string;
  twitterCard?: string;
  noindex?: boolean;
  keywords?: string;
}

/**
 * Generate Next.js App Router metadata for SEO
 * Use this in page.tsx or layout.tsx files
 */
export function generateSeoMetadata({
  title = 'Kealee Marketplace - Find Trusted Construction Contractors',
  description = 'Connect with verified construction contractors for residential and commercial projects. Get quotes, read reviews, and manage your construction projects all in one place.',
  canonicalUrl = 'https://marketplace.kealee.com',
  ogImage = 'https://marketplace.kealee.com/og-image.jpg',
  ogType = 'website',
  twitterCard = 'summary_large_image',
  noindex = false,
  keywords = 'construction contractors, home renovation, commercial construction, find contractors, contractor directory, construction services'
}: SeoMetadataProps): Metadata {
  const siteTitle = title.includes('Kealee') ? title : `${title} | Kealee Marketplace`;
  const fullCanonicalUrl = canonicalUrl.startsWith('http') ? canonicalUrl : `https://marketplace.kealee.com${canonicalUrl}`;

  return {
    title: siteTitle,
    description,
    keywords,
    authors: [{ name: 'Kealee' }],
    creator: 'Kealee',
    publisher: 'Kealee',
    robots: noindex
      ? {
          index: false,
          follow: false,
        }
      : {
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
      canonical: fullCanonicalUrl,
    },
    openGraph: {
      type: ogType as 'website' | 'article' | 'book' | 'profile',
      url: fullCanonicalUrl,
      title: siteTitle,
      description,
      siteName: 'Kealee Marketplace',
      locale: 'en_US',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: siteTitle,
        },
      ],
    },
    twitter: {
      card: twitterCard as 'summary' | 'summary_large_image' | 'app' | 'player',
      site: '@kealee',
      creator: '@kealee',
      title: siteTitle,
      description,
      images: [ogImage],
    },
    other: {
      'theme-color': '#3b82f6',
      'mobile-web-app-capable': 'yes',
      'apple-mobile-web-app-capable': 'yes',
      'apple-mobile-web-app-status-bar-style': 'black-translucent',
      'format-detection': 'telephone=no',
    },
  };
}

/**
 * Generate Schema.org JSON-LD markup
 * Use this with the SeoHead component or inject manually
 */
export function generateSchemaMarkup(schemaMarkup?: any) {
  const defaultSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Kealee Marketplace',
    url: 'https://marketplace.kealee.com',
    description: 'Construction contractor marketplace connecting homeowners and businesses with trusted professionals.',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://marketplace.kealee.com/search?q={search_term_string}',
      'query-input': 'required name=search_term_string'
    }
  };

  const businessSchema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'Kealee Marketplace',
    image: 'https://marketplace.kealee.com/logo.png',
    '@id': 'https://marketplace.kealee.com',
    url: 'https://marketplace.kealee.com',
    telephone: '+1-555-123-4567',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '123 Construction Way',
      addressLocality: 'San Francisco',
      addressRegion: 'CA',
      postalCode: '94107',
      addressCountry: 'US'
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 37.7749,
      longitude: -122.4194
    },
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: [
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday'
      ],
      opens: '09:00',
      closes: '17:00'
    },
    sameAs: [
      'https://www.facebook.com/kealee',
      'https://twitter.com/kealee',
      'https://www.linkedin.com/company/kealee',
      'https://www.instagram.com/kealee'
    ]
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'How does Kealee Marketplace work?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Kealee Marketplace connects you with verified construction contractors. Post your project, receive quotes from qualified contractors, compare profiles and reviews, then hire the best fit for your project.'
        }
      },
      {
        '@type': 'Question',
        name: 'Are contractors on Kealee verified?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes, all contractors undergo a verification process including license checks, insurance verification, and background screening to ensure they meet our quality standards.'
        }
      },
      {
        '@type': 'Question',
        name: 'How much does it cost to use Kealee?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'For homeowners and businesses, posting projects and receiving quotes is completely free. Contractors pay subscription fees for access to leads and platform features.'
        }
      }
    ]
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://marketplace.kealee.com'
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Contractor Directory',
        item: 'https://marketplace.kealee.com/directory'
      }
    ]
  };

  return schemaMarkup || [defaultSchema, businessSchema, faqSchema, breadcrumbSchema];
}

/**
 * Generate breadcrumb schema from path segments
 * Note: For more advanced breadcrumb features, use generateBreadcrumbSchema from '@/lib/structured-data'
 */
export function generateBreadcrumbSchema(paths: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: paths.map((path, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: path.name,
      item: path.url
    }))
  };
}
