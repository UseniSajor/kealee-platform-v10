import { ClerkProvider } from '@clerk/nextjs'
import type { Metadata, Viewport } from 'next'
import { headers } from 'next/headers'
import { cache } from 'react'
import { loadTenantPresentationContext } from '@kealee/shared/tenant-branding'
import { TenantBrandingProvider } from '@kealee/ui/tenant-branding'
import './globals.css'

const resolveTenantContext = cache(async () => {
  const requestHeaders = headers()
  return loadTenantPresentationContext(
    requestHeaders.get('x-forwarded-host') ?? requestHeaders.get('host'),
    process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL,
    (input, init) => fetch(input, init as RequestInit),
  )
})

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await resolveTenantContext()
  return {
    title: tenant ? `${tenant.productName || 'Contractor Portal'} — ${tenant.companyName}` : 'Kealee - Contractor Portal',
    description: tenant ? `Manage work with ${tenant.companyName}` : 'Manage leads, bids, and active construction projects',
    icons: { icon: tenant?.faviconUrl || '/favicon.ico' },
  }
}

export async function generateViewport(): Promise<Viewport> {
  const tenant = await resolveTenantContext()
  return { themeColor: tenant?.primaryColor || '#1A2B4A', width: 'device-width', initialScale: 1 }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const tenantContext = await resolveTenantContext()
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
