import { ClerkProvider } from '@clerk/nextjs'
import type { Metadata, Viewport } from 'next'
import { headers } from 'next/headers'
import { loadTenantPresentationContext } from '@kealee/shared/tenant-branding'
import { TenantBrandingProvider } from '@kealee/ui'
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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const requestHeaders = headers()
  const tenantContext = await loadTenantPresentationContext(
    requestHeaders.get('x-forwarded-host') ?? requestHeaders.get('host'),
    process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL,
    (input, init) => fetch(input, init as RequestInit),
  )
  return (
    <ClerkProvider>
      <html lang="en">
      <body className="font-body antialiased">
        <TenantBrandingProvider context={tenantContext} audience="PROFESSIONAL">
          {children}
        </TenantBrandingProvider>
      </body>
    </html>
    </ClerkProvider>
  )
}
