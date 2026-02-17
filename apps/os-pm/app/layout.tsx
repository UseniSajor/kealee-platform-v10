import type { Metadata, Viewport } from 'next'
import { Providers } from './providers'
import { PWAProvider } from './pwa-provider'
import './globals.css'

export const metadata: Metadata = {
  title: 'Kealee PM | Construction Project Management Software',
  description: 'Full-featured construction PM software for GCs, builders, and contractors. Schedule, budget, RFIs, submittals, daily logs, punch lists, and more. Powered by Kealee.',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Kealee PM',
  },
  formatDetection: {
    telephone: true,
  },
  openGraph: {
    images: [{ url: 'https://kealee.com/kealee-og-image.jpg', width: 1200, height: 630 }],
  },
}

export const viewport: Viewport = {
  themeColor: '#1a1a2e',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="overscroll-none">
        <PWAProvider />
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
