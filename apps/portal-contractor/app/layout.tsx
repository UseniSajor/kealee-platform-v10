import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Kealee - Contractor Portal',
  description: 'Manage leads, bids, and active construction projects',
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
    <html lang="en">
      <body className="font-body antialiased">{children}</body>
    </html>
  )
}
