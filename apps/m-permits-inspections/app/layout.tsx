// apps/m-permits-inspections/app/layout.tsx
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL('https://permits.kealee.com'),
  title: {
    default: 'Kealee Permits & Inspections | AI-Powered Construction Permit Platform',
    template: '%s | Kealee Permits',
  },
  description:
    'Get your construction permits approved 40% faster with AI-powered document review. Support for building, electrical, plumbing, and mechanical permits across 3,000+ jurisdictions in the DC-Baltimore corridor.',
  keywords: [
    'construction permits',
    'building permits',
    'permit application',
    'AI permit review',
    'construction inspection',
    'building inspection',
    'permit tracking',
    'DC permits',
    'Maryland permits',
    'Baltimore permits',
    'zoning compliance',
    'building codes',
    'permit approval',
    'contractor permits',
  ],
  authors: [{ name: 'Kealee', url: 'https://kealee.com' }],
  creator: 'Kealee',
  publisher: 'Kealee',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://permits.kealee.com',
    siteName: 'Kealee Permits & Inspections',
    title: 'Get Your Permits Approved 40% Faster | Kealee',
    description:
      'AI-powered permit application platform with automated document review, compliance checking, and inspection scheduling for 3,000+ jurisdictions.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Kealee Permits & Inspections - AI-Powered Permit Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Get Your Permits Approved 40% Faster | Kealee',
    description:
      'AI-powered permit application platform with automated document review and compliance checking.',
    images: ['/twitter-image.png'],
    creator: '@kealee',
    site: '@kealee',
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
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
  manifest: '/manifest.json',
  alternates: {
    canonical: 'https://permits.kealee.com',
  },
  category: 'Construction Technology',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} scroll-smooth`}>
      <head>
        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* DNS Prefetch for performance */}
        <link rel="dns-prefetch" href="https://api.kealee.com" />
      </head>
      <body className={`${inter.className} antialiased`}>{children}</body>
    </html>
  );
}
