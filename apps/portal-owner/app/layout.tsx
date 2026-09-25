import type { Metadata, Viewport } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { headers } from 'next/headers'
import { cache } from 'react'
import { loadTenantPresentationContext } from '@kealee/shared/tenant-branding'
import { TenantBrandingProvider } from '@kealee/ui/tenant-branding'
import { ServiceWorkerCleanup } from '@/components/ServiceWorkerCleanup'
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
    title: tenant ? `${tenant.productName || 'Project Portal'} — ${tenant.companyName}` : 'Kealee - Owner Portal',
    description: tenant ? `Track your project with ${tenant.companyName}` : 'Track your construction project with AI tools, digital twins, escrow payments, and real-time monitoring.',
    icons: { icon: tenant?.faviconUrl || '/favicon.ico' },
  }
}

export async function generateViewport(): Promise<Viewport> {
  const tenant = await resolveTenantContext()
  return { themeColor: tenant?.primaryColor || '#1A2B4A', width: 'device-width', initialScale: 1 }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const tenantContext = await resolveTenantContext()
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
