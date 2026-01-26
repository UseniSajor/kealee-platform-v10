// apps/m-project-owner/app/layout.tsx
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#2563eb',
};

export const metadata: Metadata = {
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
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
