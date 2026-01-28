/**
 * SEO Head Component for Next.js Pages Router
 * Use this if you're using the Pages Router (pages/ directory)
 * 
 * For App Router, use the SeoHead component instead
 */

import React from 'react';
import Head from 'next/head';
import { generateSchemaMarkup } from '@/lib/seo';

interface SeoHeadPagesProps {
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

export default function SeoHeadPages({
  title = 'Kealee Marketplace - Find Trusted Construction Contractors',
  description = 'Connect with verified construction contractors for residential and commercial projects. Get quotes, read reviews, and manage your construction projects all in one place.',
  canonicalUrl = 'https://marketplace.kealee.com',
  ogImage = 'https://marketplace.kealee.com/og-image.jpg',
  ogType = 'website',
  twitterCard = 'summary_large_image',
  schemaMarkup,
  noindex = false,
  children
}: SeoHeadPagesProps) {
  const siteTitle = title.includes('Kealee') ? title : `${title} | Kealee Marketplace`;
  const fullCanonicalUrl = canonicalUrl.startsWith('http') ? canonicalUrl : `https://marketplace.kealee.com${canonicalUrl}`;

  const combinedSchema = schemaMarkup || generateSchemaMarkup();

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{siteTitle}</title>
      <meta name="description" content={description} />
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      {!noindex && (
        <>
          <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
          <meta name="googlebot" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
        </>
      )}

      {/* Canonical URL */}
      <link rel="canonical" href={fullCanonicalUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={fullCanonicalUrl} />
      <meta property="og:title" content={siteTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="Kealee Marketplace" />
      <meta property="og:locale" content="en_US" />

      {/* Twitter */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:url" content={fullCanonicalUrl} />
      <meta name="twitter:title" content={siteTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:site" content="@kealee" />
      <meta name="twitter:creator" content="@kealee" />

      {/* Additional Meta Tags */}
      <meta name="keywords" content="construction contractors, home renovation, commercial construction, find contractors, contractor directory, construction services" />
      <meta name="author" content="Kealee" />
      <meta name="theme-color" content="#3b82f6" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <meta name="format-detection" content="telephone=no" />

      {/* Favicons */}
      <link rel="icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <link rel="manifest" href="/site.webmanifest" />
      <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#3b82f6" />
      <meta name="msapplication-TileColor" content="#3b82f6" />
      <meta name="theme-color" content="#ffffff" />

      {/* Preconnect and Preload */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
      <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
      <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
      <link rel="dns-prefetch" href="https://www.google-analytics.com" />

      {/* Schema.org JSON-LD */}
      {Array.isArray(combinedSchema) ? (
        combinedSchema.map((schema, index) => (
          <script
            key={index}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
          />
        ))
      ) : (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(combinedSchema) }}
        />
      )}

      {/* Additional children */}
      {children}
    </Head>
  );
}
