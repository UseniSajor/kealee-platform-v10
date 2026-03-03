import { Metadata } from 'next'
import ArchitectClient from './ArchitectClient'

export const metadata: Metadata = {
  title: 'Architecture Services — Residential & Commercial Design | Kealee',
  description: 'Licensed architects for residential and commercial projects. Permit-ready drawings from $499. Unlimited revisions, fixed pricing, 12 jurisdictions covered.',
  openGraph: {
    title: 'Architecture Services | Kealee',
    description: 'Licensed architects for residential and commercial design. As-builts, permit drawings, 3D visualization, and construction administration.',
    url: 'https://kealee.com/services/architect',
    siteName: 'Kealee Marketplace',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Architecture Services | Kealee',
    description: 'Permit-ready drawings from $499. Licensed architects, unlimited revisions, fixed pricing.',
  },
  keywords: [
    'architecture services', 'residential architect', 'commercial architect',
    'permit drawings', 'as-built drawings', 'CAD drawings', 'construction documents',
    'home renovation architect', 'ADU design', 'kitchen remodel architect',
  ],
  alternates: { canonical: 'https://kealee.com/services/architect' },
}

export default function ArchitectPage() {
  return <ArchitectClient />
}
