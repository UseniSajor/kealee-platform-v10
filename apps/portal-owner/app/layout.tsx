import type { Metadata, Viewport } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'

export const metadata: Metadata = {
  title: 'Kealee - Owner Portal',
  description: 'Track your construction project with powered by AI tools digital twins, escrow payments, and real-time monitoring.',
  icons: { icon: '/favicon.ico' },
}

export const viewport: Viewport = {
  themeColor: '#1A2B4A',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="font-body antialiased">{children}</body>
      </html>
    </ClerkProvider>
  )
}
