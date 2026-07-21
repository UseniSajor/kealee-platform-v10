import { Metadata } from 'next'
import NetworkClient from './NetworkClient'

export const metadata: Metadata = {
  title: 'Contractor Network — Verified Contractors & Leads | Kealee',
  description: 'Find verified, licensed contractors for your project. 5,000+ contractors, escrow-backed payments, real reviews. Contractors: grow your business with quality leads.',
  openGraph: {
    title: 'Contractor Network | Kealee',
    description: 'Verified contractor marketplace. Standardized bids, escrow payments, performance tracking. For owners and contractors.',
    url: 'https://kealee.com/services/marketplace-network',
    siteName: 'Kealee Marketplace',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contractor Network | Kealee',
    description: '5,000+ verified contractors. Escrow-protected payments. Real reviews. Find the right contractor every time.',
  },
  keywords: [
    'contractor network', 'find contractors', 'verified contractors',
    'contractor marketplace', 'construction bids', 'contractor leads',
    'licensed contractors', 'construction marketplace', 'contractor directory',
  ],
  alternates: { canonical: 'https://kealee.com/services/marketplace-network' },
}

export default function MarketplaceNetworkPage() {
  return <NetworkClient />
}
