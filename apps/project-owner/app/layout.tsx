import type { Metadata, Viewport } from 'next'
import { PWAProvider } from './pwa-provider'
import './globals.css'

export const metadata: Metadata = {
  title: 'Kealee - Owner Portal',
  description: 'Track your construction project with AI-powered digital twins, escrow payments, and real-time monitoring.',
  manifest: '/site.webmanifest',
  applicationName: 'Kealee Project Owner',
  icons: {
    icon: '/kealee-favicon.png',
    apple: '/kealee-icon-192x192.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#1A2B4A',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-body antialiased">
        {children}
        <PWAProvider />
      </body>
    </html>
  )
}
