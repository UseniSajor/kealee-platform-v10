import { Metadata } from 'next'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { PortalsClient } from './PortalsClient'

export const metadata: Metadata = {
  title: 'Portal Access | Kealee',
  description: 'Access your Kealee portal — architecture, engineering, permits & inspections, cost estimation, project management, operations services, and milestone payments. One platform for every construction project role.',
  openGraph: {
    title: 'Portal Access | Kealee',
    description: '8 purpose-built portals for every role in the construction lifecycle. Architecture, engineering, estimation, permits, PM, ops, finance, and project owner portals.',
    url: 'https://kealee.com/portals',
  },
}

export default function PortalsPage() {
  return (
    <>
      <Header />
      <main className="pt-16 min-h-screen">
        <PortalsClient />
      </main>
      <Footer />
    </>
  )
}
