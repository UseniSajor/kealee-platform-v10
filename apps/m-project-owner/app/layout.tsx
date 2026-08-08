// apps/m-project-owner/app/layout.tsx
import { ClerkProvider } from '@clerk/nextjs';
import type { Metadata, Viewport } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { Inter } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';
import { ClerkProvider } from '@clerk/nextjs';
import { PWAProvider } from './pwa-provider';
import { ClerkProvider } from '@clerk/nextjs';

import { ClerkProvider } from '@clerk/nextjs';
const inter = Inter({ subsets: ['latin'] });
import { ClerkProvider } from '@clerk/nextjs';

import { ClerkProvider } from '@clerk/nextjs';
export const metadata: Metadata = {
import { ClerkProvider } from '@clerk/nextjs';
  title: 'Kealee - Project Owner Dashboard',
import { ClerkProvider } from '@clerk/nextjs';
  description: 'Manage your projects with ease',
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
    title: 'Kealee',
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
    images: [{ url: 'https://kealee.com/kealee-og-image.jpg', width: 1200, height: 630 }],
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
      <html lang="en" className={inter.className}>
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
      <body className="overscroll-none">
import { ClerkProvider } from '@clerk/nextjs';
        <PWAProvider />
import { ClerkProvider } from '@clerk/nextjs';
        {children}
import { ClerkProvider } from '@clerk/nextjs';
      </body>
import { ClerkProvider } from '@clerk/nextjs';
    </html>
    </ClerkProvider>
import { ClerkProvider } from '@clerk/nextjs';
  );
import { ClerkProvider } from '@clerk/nextjs';
}
