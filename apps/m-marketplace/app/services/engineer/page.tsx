import { Metadata } from 'next'
import EngineerClient from './EngineerClient'

export const metadata: Metadata = {
  title: 'Engineering Services — Structural, MEP, Civil, Fire | Kealee',
  description: 'Licensed professional engineers for structural, electrical, mechanical, plumbing, civil, and fire protection. PE-stamped drawings from $450. Fast turnaround.',
  openGraph: {
    title: 'Engineering Services | Kealee',
    description: 'PE-stamped engineering across 6 disciplines. Structural letters in 3 days. Full packages in 2-4 weeks. Licensed & insured.',
    url: 'https://kealee.com/services/engineer',
    siteName: 'Kealee Marketplace',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Engineering Services | Kealee',
    description: 'Structural, MEP, civil, fire protection. PE-stamped drawings from $450. Fast turnaround, coordinated with architecture.',
  },
  keywords: [
    'structural engineering', 'MEP engineering', 'civil engineering',
    'PE stamped drawings', 'structural letter', 'load bearing wall removal',
    'HVAC engineering', 'electrical engineering', 'plumbing engineering',
    'fire protection engineering', 'construction engineering', 'beam design',
  ],
  alternates: { canonical: 'https://kealee.com/services/engineer' },
}

export default function EngineerPage() {
  return <EngineerClient />
}
