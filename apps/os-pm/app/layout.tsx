import type { Metadata, Viewport } from 'next'
import { Providers } from './providers'
import { PWAProvider } from './pwa-provider'
import './globals.css'

export const metadata: Metadata = {
  title: 'Kealee PM | Construction Project Management Software',
  description: 'Full-featured construction PM software for GCs, builders, and contractors. Schedule, budget, RFIs, submittals, daily logs, punch lists, and more. Powered by Kealee.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Kealee PM',
  },
  formatDetection: {
    telephone: true,
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
        <link rel="apple-touch-icon" href="/icon-192.png" />
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
