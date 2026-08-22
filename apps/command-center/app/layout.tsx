import type { Metadata, Viewport } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
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
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: '#FF8C22',
          colorText: '#1F2937',
          colorBackground: '#FFFFFF',
          colorInputText: '#1F2937',
          colorNeutral: '#F3F4F6',
          fontFamily: "'Nunito', sans-serif",
        },
      }}
    >
      <html lang="en" className="font-body">
        <body className="antialiased"><PwaProvider />{children}</body>
      </html>
    </ClerkProvider>
  )
}
