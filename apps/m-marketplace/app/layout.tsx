import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { PWAProvider } from './pwa-provider';
import { CartProviderWrapper } from './cart-wrapper';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://kealee.com'),
  title: {
    default: 'Kealee - Complete Project Management Platform',
    template: '%s | Kealee'
  },
  description: 'Professional project management, AI-powered permit review, and licensed architects on-demand. Save 40% on PM costs and deliver projects 25% faster.',
  keywords: [
    'project management',
    'building management',
    'permit review',
    'project management software',
    'architect services',
    'building permits',
    'DC building projects',
    'Baltimore building projects'
  ],
  authors: [{ name: 'Kealee Platform' }],
  creator: 'Kealee',
  publisher: 'Kealee',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Kealee Pro',
  },
  formatDetection: {
    telephone: true,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://kealee.com',
    siteName: 'Kealee',
    title: 'Kealee - Complete Project Management Platform',
    description: 'Save 40% on PM costs. AI-powered permit review. Licensed architects on-demand.',
    images: [{ url: 'https://kealee.com/kealee-og-image.jpg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kealee - Project Management Platform',
    description: 'Save 40% on PM costs. Deliver projects 25% faster.',
    images: ['/kealee-og-image.jpg'],
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
};

export const viewport: Viewport = {
  themeColor: '#1a1a2e',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className={`${inter.className} overscroll-none`}>
        <PWAProvider />
        <CartProviderWrapper>
          {children}
        </CartProviderWrapper>
      </body>
    </html>
  );
}
