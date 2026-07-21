import { Metadata } from 'next'
import PreconClient from './PreconClient'

export const metadata: Metadata = {
  title: 'Pre-Construction — Design to Contractor Award | Kealee',
  description: 'Streamlined pre-construction workflow from design to contractor bidding. Packages from $199. Verified contractors, standardized bids, escrow-backed contracts.',
  openGraph: {
    title: 'Pre-Construction Workflow | Kealee',
    description: 'Design → SRP → Contractor Matching → Bidding → Contract Award. From $199 with escrow-backed payments.',
    url: 'https://kealee.com/services/precon',
    siteName: 'Kealee Marketplace',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pre-Construction Workflow | Kealee',
    description: 'From design to contractor award in 6 steps. Verified contractors, standardized bids, escrow protection. From $199.',
  },
  keywords: [
    'pre-construction', 'scope of work', 'contractor bidding',
    'construction bidding', 'SRP generation', 'contractor matching',
    'construction escrow', 'design build', 'construction procurement',
  ],
  alternates: { canonical: 'https://kealee.com/services/precon' },
}

export default function PreconPage() {
  return <PreconClient />
}
