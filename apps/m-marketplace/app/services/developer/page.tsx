import { Metadata } from 'next'
import DeveloperClient from './DeveloperClient'

export const metadata: Metadata = {
  title: 'Developer Services — Real Estate Development Management | Kealee',
  description: 'End-to-end real estate development support. Feasibility studies from $2,500. Pro forma modeling, entitlement support, construction oversight, and asset delivery.',
  openGraph: {
    title: 'Developer Services | Kealee',
    description: 'Feasibility to closeout. Data-driven development management with investor-ready reporting and escrow-backed payments.',
    url: 'https://kealee.com/services/developer',
    siteName: 'Kealee Marketplace',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Developer Services | Kealee',
    description: 'Real estate development from feasibility to closeout. Pro forma, entitlements, construction oversight. From $2,500.',
  },
  keywords: [
    'real estate development', 'feasibility study', 'pro forma modeling',
    'entitlement support', 'construction oversight', 'development management',
    'investor reporting', 'multi-family development', 'mixed-use development',
  ],
  alternates: { canonical: 'https://kealee.com/services/developer' },
}

export default function DeveloperPage() {
  return <DeveloperClient />
}
