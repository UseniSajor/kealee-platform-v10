import type { Metadata, Viewport } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { headers } from 'next/headers'
import { loadTenantPresentationContext } from '@kealee/shared/tenant-branding'
import { TenantBrandingProvider } from '@kealee/ui'
import { ServiceWorkerCleanup } from '@/components/ServiceWorkerCleanup'
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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
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
          <ServiceWorkerCleanup />
          <TenantBrandingProvider context={tenantContext} audience="HOMEOWNER_PROJECT">
            {children}
          </TenantBrandingProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
