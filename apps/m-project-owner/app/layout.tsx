// apps/m-project-owner/app/layout.tsx
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { PWAProvider } from './pwa-provider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Kealee - Project Owner Dashboard',
  description: 'Manage your construction projects with ease',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/kealee-icon-32x32.png', type: 'image/png', sizes: '32x32' },
      { url: '/kealee-icon-192x192.png', type: 'image/png', sizes: '192x192' },
    ],
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Kealee',
  },
  formatDetection: {
    telephone: true,
  },
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
    <html lang="en" className={inter.className}>
      <head>
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="overscroll-none">
        <PWAProvider />
        {children}
      </body>
    </html>
  );
}
