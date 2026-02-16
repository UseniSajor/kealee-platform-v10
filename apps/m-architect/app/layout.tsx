// apps/m-architect/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Kealee - Architectural Design Services',
  description: 'Get professional architectural design quotes in 24 hours',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/kealee-icon-32x32.png', type: 'image/png', sizes: '32x32' },
      { url: '/kealee-icon-192x192.png', type: 'image/png', sizes: '192x192' },
    ],
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
  openGraph: {
    images: [
      {
        url: '/kealee-og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Kealee Construction',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/kealee-og-image.jpg'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.className}>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
