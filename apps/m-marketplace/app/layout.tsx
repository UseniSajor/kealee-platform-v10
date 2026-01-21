import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://kealee.com'),
  title: {
    default: 'Kealee - Complete Construction Management Platform',
    template: '%s | Kealee'
  },
  description: 'Professional construction project management, AI-powered permit review, and licensed architects on-demand. Save 40% on PM costs and deliver projects 25% faster.',
  keywords: [
    'construction management',
    'project management',
    'permit review',
    'construction software',
    'architect services',
    'building permits',
    'DC construction',
    'Baltimore construction'
  ],
  authors: [{ name: 'Kealee Construction LLC' }],
  creator: 'Kealee',
  publisher: 'Kealee',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://kealee.com',
    siteName: 'Kealee',
    title: 'Kealee - Complete Construction Management Platform',
    description: 'Save 40% on PM costs. AI-powered permit review. Licensed architects on-demand.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Kealee Construction Management Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kealee - Construction Management Platform',
    description: 'Save 40% on PM costs. Deliver projects 25% faster.',
    images: ['/og-image.png'],
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
