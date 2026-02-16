import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Kealee Estimation - Construction Cost Estimation Platform',
  description: 'Professional construction cost estimation and takeoff management with AI-powered insights',
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
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
