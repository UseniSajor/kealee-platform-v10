import { Metadata } from 'next'
import { ServicesClient } from './ServicesClient'

export const metadata: Metadata = {
  title: 'Services & Pricing | Kealee — Design, Estimate, Permit, Build, Closeout',
  description: 'Explore Kealee\'s complete construction services — AI-powered design concepts, cost estimation, permit automation, PM software, ops services, escrow & closeout. Pricing for every phase.',
  openGraph: {
    title: 'Services & Pricing | Kealee',
    description: 'One platform for every phase of your construction project. Design through closeout — with transparent pricing at every step.',
    url: 'https://kealee.com/services',
    siteName: 'Kealee Marketplace',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kealee Services & Pricing',
    description: 'Design → Estimate → Permit → Build → Closeout. Explore pricing and packages for every phase.',
  },
  keywords: [
    'construction services', 'architecture packages', 'AI concept design', 'cost estimation pricing',
    'building permits services', 'project management software', 'operations services contractors',
    'construction escrow', 'construction finance', 'DC Baltimore construction',
  ],
}

export default function ServicesPage() {
  return <ServicesClient />
}
