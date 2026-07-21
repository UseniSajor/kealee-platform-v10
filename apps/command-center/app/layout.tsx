import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Kealee - Command Center',
  description: 'Operations command center for managing digital twins, integrations, and analytics',
  icons: { icon: '/favicon.ico' },
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
      <body className="antialiased">{children}</body>
    </html>
  )
}
