import { ClerkProvider } from '@clerk/nextjs';
import type { Metadata, Viewport } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { Inter } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';
import { ClerkProvider } from '@clerk/nextjs';
import { PWAProvider } from './pwa-provider';
import { ClerkProvider } from '@clerk/nextjs';
import { CartProviderWrapper } from './cart-wrapper';
import { ClerkProvider } from '@clerk/nextjs';
import KeaBotChatWidget from '../components/KeaBotChatWidget';
import { ClerkProvider } from '@clerk/nextjs';

import { ClerkProvider } from '@clerk/nextjs';
const inter = Inter({ subsets: ['latin'] });
import { ClerkProvider } from '@clerk/nextjs';

import { ClerkProvider } from '@clerk/nextjs';
export const metadata: Metadata = {
import { ClerkProvider } from '@clerk/nextjs';
  metadataBase: new URL('https://kealee.com'),
import { ClerkProvider } from '@clerk/nextjs';
  title: {
import { ClerkProvider } from '@clerk/nextjs';
    default: 'Kealee — The Construction Platform for the Entire Project',
import { ClerkProvider } from '@clerk/nextjs';
    template: '%s | Kealee'
import { ClerkProvider } from '@clerk/nextjs';
  },
import { ClerkProvider } from '@clerk/nextjs';
  description: 'From the first concept drawing to the final lien waiver — Kealee connects owners, builders, and professionals on one platform. Design, estimate, permit, build, and closeout. No handoffs. No gaps.',
import { ClerkProvider } from '@clerk/nextjs';
  keywords: [
import { ClerkProvider } from '@clerk/nextjs';
    'construction platform', 'design build platform', 'construction management software',
import { ClerkProvider } from '@clerk/nextjs';
    'architecture services', 'structural engineering', 'MEP engineering', 'AI cost estimation',
import { ClerkProvider } from '@clerk/nextjs';
    'building permits automation', 'project management construction', 'operations services contractors',
import { ClerkProvider } from '@clerk/nextjs';
    'construction escrow', 'contractor network', 'general contractor tools', 'permit tracking',
import { ClerkProvider } from '@clerk/nextjs';
    'inspection scheduling', 'construction finance', 'pre-construction services',
import { ClerkProvider } from '@clerk/nextjs';
  ],
import { ClerkProvider } from '@clerk/nextjs';
  authors: [{ name: 'Kealee Platform' }],
import { ClerkProvider } from '@clerk/nextjs';
  creator: 'Kealee',
import { ClerkProvider } from '@clerk/nextjs';
  publisher: 'Kealee',
import { ClerkProvider } from '@clerk/nextjs';
  icons: {
import { ClerkProvider } from '@clerk/nextjs';
    icon: '/favicon.ico',
import { ClerkProvider } from '@clerk/nextjs';
    apple: '/apple-touch-icon.png',
import { ClerkProvider } from '@clerk/nextjs';
  },
import { ClerkProvider } from '@clerk/nextjs';
  manifest: '/site.webmanifest',
import { ClerkProvider } from '@clerk/nextjs';
  appleWebApp: {
import { ClerkProvider } from '@clerk/nextjs';
    capable: true,
import { ClerkProvider } from '@clerk/nextjs';
    statusBarStyle: 'default',
import { ClerkProvider } from '@clerk/nextjs';
    title: 'Kealee Pro',
import { ClerkProvider } from '@clerk/nextjs';
  },
import { ClerkProvider } from '@clerk/nextjs';
  formatDetection: {
import { ClerkProvider } from '@clerk/nextjs';
    telephone: true,
import { ClerkProvider } from '@clerk/nextjs';
  },
import { ClerkProvider } from '@clerk/nextjs';
  openGraph: {
import { ClerkProvider } from '@clerk/nextjs';
    type: 'website',
import { ClerkProvider } from '@clerk/nextjs';
    locale: 'en_US',
import { ClerkProvider } from '@clerk/nextjs';
    url: 'https://kealee.com',
import { ClerkProvider } from '@clerk/nextjs';
    siteName: 'Kealee Marketplace',
import { ClerkProvider } from '@clerk/nextjs';
    title: 'Kealee — Build Without Blindspots',
import { ClerkProvider } from '@clerk/nextjs';
    description: 'The construction platform for the entire project. Design through closeout — one connected system for everyone in the room.',
import { ClerkProvider } from '@clerk/nextjs';
    images: [{ url: 'https://kealee.com/kealee-og-image.jpg', width: 1200, height: 630 }],
import { ClerkProvider } from '@clerk/nextjs';
  },
import { ClerkProvider } from '@clerk/nextjs';
  twitter: {
import { ClerkProvider } from '@clerk/nextjs';
    card: 'summary_large_image',
import { ClerkProvider } from '@clerk/nextjs';
    title: 'Kealee — The Construction Platform for the Entire Project',
import { ClerkProvider } from '@clerk/nextjs';
    description: 'Design → Estimate → Permit → Build → Closeout. One platform. No gaps. Every professional verified. Every payment protected.',
import { ClerkProvider } from '@clerk/nextjs';
    images: ['/kealee-og-image.jpg'],
import { ClerkProvider } from '@clerk/nextjs';
  },
import { ClerkProvider } from '@clerk/nextjs';
  robots: {
import { ClerkProvider } from '@clerk/nextjs';
    index: true,
import { ClerkProvider } from '@clerk/nextjs';
    follow: true,
import { ClerkProvider } from '@clerk/nextjs';
    googleBot: {
import { ClerkProvider } from '@clerk/nextjs';
      index: true,
import { ClerkProvider } from '@clerk/nextjs';
      follow: true,
import { ClerkProvider } from '@clerk/nextjs';
      'max-video-preview': -1,
import { ClerkProvider } from '@clerk/nextjs';
      'max-image-preview': 'large',
import { ClerkProvider } from '@clerk/nextjs';
      'max-snippet': -1,
import { ClerkProvider } from '@clerk/nextjs';
    },
import { ClerkProvider } from '@clerk/nextjs';
  },
import { ClerkProvider } from '@clerk/nextjs';
};
import { ClerkProvider } from '@clerk/nextjs';

import { ClerkProvider } from '@clerk/nextjs';
export const viewport: Viewport = {
import { ClerkProvider } from '@clerk/nextjs';
  themeColor: '#1a1a2e',
import { ClerkProvider } from '@clerk/nextjs';
  width: 'device-width',
import { ClerkProvider } from '@clerk/nextjs';
  initialScale: 1,
import { ClerkProvider } from '@clerk/nextjs';
  maximumScale: 1,
import { ClerkProvider } from '@clerk/nextjs';
  userScalable: false,
import { ClerkProvider } from '@clerk/nextjs';
  viewportFit: 'cover',
import { ClerkProvider } from '@clerk/nextjs';
};
import { ClerkProvider } from '@clerk/nextjs';

import { ClerkProvider } from '@clerk/nextjs';
export default function RootLayout({
import { ClerkProvider } from '@clerk/nextjs';
  children,
import { ClerkProvider } from '@clerk/nextjs';
}: {
import { ClerkProvider } from '@clerk/nextjs';
  children: React.ReactNode;
import { ClerkProvider } from '@clerk/nextjs';
}) {
import { ClerkProvider } from '@clerk/nextjs';
  return (
import { ClerkProvider } from '@clerk/nextjs';
    <ClerkProvider>
      <html lang="en" className="scroll-smooth">
import { ClerkProvider } from '@clerk/nextjs';
      <head>
import { ClerkProvider } from '@clerk/nextjs';
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
import { ClerkProvider } from '@clerk/nextjs';
        <meta name="apple-mobile-web-app-capable" content="yes" />
import { ClerkProvider } from '@clerk/nextjs';
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
import { ClerkProvider } from '@clerk/nextjs';
        <meta name="mobile-web-app-capable" content="yes" />
import { ClerkProvider } from '@clerk/nextjs';
      </head>
import { ClerkProvider } from '@clerk/nextjs';
      <body className={`${inter.className} overscroll-none`}>
import { ClerkProvider } from '@clerk/nextjs';
        <PWAProvider />
import { ClerkProvider } from '@clerk/nextjs';
        <CartProviderWrapper>
import { ClerkProvider } from '@clerk/nextjs';
          {children}
import { ClerkProvider } from '@clerk/nextjs';
        </CartProviderWrapper>
import { ClerkProvider } from '@clerk/nextjs';
        <KeaBotChatWidget />
import { ClerkProvider } from '@clerk/nextjs';
      </body>
import { ClerkProvider } from '@clerk/nextjs';
    </html>
    </ClerkProvider>
import { ClerkProvider } from '@clerk/nextjs';
  );
import { ClerkProvider } from '@clerk/nextjs';
}
