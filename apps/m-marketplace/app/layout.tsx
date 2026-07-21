import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { PWAProvider } from './pwa-provider';
import { CartProviderWrapper } from './cart-wrapper';
import KeaBotChatWidget from '../components/KeaBotChatWidget';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://kealee.com'),
  title: {
    default: 'Kealee — The Construction Platform for the Entire Project',
    template: '%s | Kealee'
  },
  description: 'From the first concept drawing to the final lien waiver — Kealee connects owners, builders, and professionals on one platform. Design, estimate, permit, build, and closeout. No handoffs. No gaps.',
  keywords: [
    'construction platform', 'design build platform', 'construction management software',
    'architecture services', 'structural engineering', 'MEP engineering', 'AI cost estimation',
    'building permits automation', 'project management construction', 'operations services contractors',
    'construction escrow', 'contractor network', 'general contractor tools', 'permit tracking',
    'inspection scheduling', 'construction finance', 'pre-construction services',
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
    siteName: 'Kealee Marketplace',
    title: 'Kealee — Build Without Blindspots',
    description: 'The construction platform for the entire project. Design through closeout — one connected system for everyone in the room.',
    images: [{ url: 'https://kealee.com/kealee-og-image.jpg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kealee — The Construction Platform for the Entire Project',
    description: 'Design → Estimate → Permit → Build → Closeout. One platform. No gaps. Every professional verified. Every payment protected.',
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
        <KeaBotChatWidget />
      </body>
    </html>
  );
}
