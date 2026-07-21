'use client';

import React, { useEffect } from 'react';

interface SeoHeadProps {
  title?: string;
  description?: string;
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: string;
  twitterCard?: string;
  schemaMarkup?: any;
  noindex?: boolean;
  children?: React.ReactNode;
}

export default function SeoHead({
  title = 'Kealee Marketplace - Find Trusted Contractors',
  description = 'Connect with verified contractors for residential and commercial projects. Get quotes, read reviews, and manage your projects all in one place.',
  canonicalUrl = 'https://marketplace.kealee.com',
  ogImage = 'https://marketplace.kealee.com/og-image.jpg',
  ogType = 'website',
  twitterCard = 'summary_large_image',
  schemaMarkup,
  noindex = false,
  children
}: SeoHeadProps) {
  const siteTitle = title.includes('Kealee') ? title : `${title} | Kealee Marketplace`;
  const fullCanonicalUrl = canonicalUrl.startsWith('http') ? canonicalUrl : `https://marketplace.kealee.com${canonicalUrl}`;

  const defaultSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Kealee Marketplace',
    url: 'https://marketplace.kealee.com',
    description: 'Contractor marketplace connecting homeowners and businesses with trusted professionals.',
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
    image: 'https://marketplace.kealee.com/kealee-logo-800w.png',
    '@id': 'https://marketplace.kealee.com',
    url: 'https://marketplace.kealee.com',
    telephone: '+1-555-123-4567',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '123 Market Way',
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
          text: 'Kealee Marketplace connects you with verified contractors. Post your project, receive quotes from qualified contractors, compare profiles and reviews, then hire the best fit for your project.'
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

  const combinedSchema = schemaMarkup || [defaultSchema, businessSchema, faqSchema, breadcrumbSchema];

  useEffect(() => {
    // Update document title
    document.title = siteTitle;

    // Update or create meta tags
    const updateMetaTag = (name: string, content: string, attribute: string = 'name') => {
      let element = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement;
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, name);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // Update or create link tags
    const updateLinkTag = (rel: string, href: string, attributes?: Record<string, string>) => {
      let element = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement;
      if (!element) {
        element = document.createElement('link');
        element.setAttribute('rel', rel);
        document.head.appendChild(element);
      }
      element.setAttribute('href', href);
      if (attributes) {
        Object.entries(attributes).forEach(([key, value]) => {
          element.setAttribute(key, value);
        });
      }
    };

    // Basic Meta Tags
    updateMetaTag('description', description);
    updateMetaTag('keywords', 'contractors, home renovation, commercial projects, find contractors, contractor directory, project services');
    updateMetaTag('author', 'Kealee');
    updateMetaTag('theme-color', '#3b82f6');
    updateMetaTag('mobile-web-app-capable', 'yes');
    updateMetaTag('apple-mobile-web-app-capable', 'yes');
    updateMetaTag('apple-mobile-web-app-status-bar-style', 'black-translucent');
    updateMetaTag('format-detection', 'telephone=no');

    // Robots meta
    if (noindex) {
      updateMetaTag('robots', 'noindex, nofollow');
    } else {
      updateMetaTag('robots', 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1');
      updateMetaTag('googlebot', 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1');
    }

    // Canonical URL
    updateLinkTag('canonical', fullCanonicalUrl);

    // Open Graph / Facebook
    updateMetaTag('og:type', ogType, 'property');
    updateMetaTag('og:url', fullCanonicalUrl, 'property');
    updateMetaTag('og:title', siteTitle, 'property');
    updateMetaTag('og:description', description, 'property');
    updateMetaTag('og:image', ogImage, 'property');
    updateMetaTag('og:image:width', '1200', 'property');
    updateMetaTag('og:image:height', '630', 'property');
    updateMetaTag('og:site_name', 'Kealee Marketplace', 'property');
    updateMetaTag('og:locale', 'en_US', 'property');

    // Twitter
    updateMetaTag('twitter:card', twitterCard);
    updateMetaTag('twitter:url', fullCanonicalUrl);
    updateMetaTag('twitter:title', siteTitle);
    updateMetaTag('twitter:description', description);
    updateMetaTag('twitter:image', ogImage);
    updateMetaTag('twitter:site', '@kealee');
    updateMetaTag('twitter:creator', '@kealee');

    // Preconnect and Preload
    updateLinkTag('preconnect', 'https://fonts.googleapis.com');
    updateLinkTag('preconnect', 'https://fonts.gstatic.com', { crossOrigin: 'anonymous' });
    updateLinkTag('dns-prefetch', 'https://fonts.googleapis.com');
    updateLinkTag('dns-prefetch', 'https://fonts.gstatic.com');
    updateLinkTag('dns-prefetch', 'https://www.googletagmanager.com');
    updateLinkTag('dns-prefetch', 'https://www.google-analytics.com');

    // Schema.org JSON-LD
    // Remove existing schema scripts
    const existingSchemas = document.querySelectorAll('script[type="application/ld+json"]');
    existingSchemas.forEach(script => script.remove());

    // Add new schema scripts
    const schemas = Array.isArray(combinedSchema) ? combinedSchema : [combinedSchema];
    schemas.forEach((schema, index) => {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.id = `schema-${index}`;
      script.textContent = JSON.stringify(schema);
      document.head.appendChild(script);
    });

    // Cleanup function
    return () => {
      // Optionally clean up on unmount
      // Note: We don't remove meta tags as they might be needed by other components
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, description, canonicalUrl, ogImage, ogType, twitterCard, noindex]);

  // This component doesn't render anything visible
  return <>{children}</>;
}
