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
  // THE ONLY ClerkProvider IN THIS APP.
  //
  // A second one lived in app/clerk-provider.tsx with a fuller appearance
  // block and was never imported, so the styling it carried never reached a
  // page and the two configurations were free to drift. Its element styles are
  // folded in here and that file is gone.
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
          fontSize: '14px',
        },
        elements: {
          formButtonPrimary:
            'bg-[#FF8C22] hover:bg-[#E67E1A] text-white font-semibold rounded-lg',
          card: 'bg-white border border-[#E5E7EB] rounded-lg shadow-sm',
          headerTitle: 'text-2xl font-bold text-[#1F2937]',
          headerSubtitle: 'text-[#6B7280]',
          dividerLine: 'bg-[#E5E7EB]',
        },
      }}
    >
      <html lang="en" className="font-body">
        <body className="antialiased"><PwaProvider />{children}</body>
      </html>
    </ClerkProvider>
  )
}
