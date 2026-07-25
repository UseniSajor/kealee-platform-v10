import type { Metadata, Viewport } from 'next'
import { PwaProvider } from './pwa-provider'
import './globals.css'

export const metadata: Metadata = {
  title: 'Kealee - Command Center',
  description: 'Operations command center for managing digital twins, integrations, and analytics',
  manifest: '/site.webmanifest',
  icons: { icon: '/kealee-icon-192x192.png', apple: '/apple-touch-icon.png' },
}

export const viewport: Viewport = {
  themeColor: '#1A2B4A',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="font-body">
      <body className="antialiased"><PwaProvider />{children}</body>
    </html>
  )
}
