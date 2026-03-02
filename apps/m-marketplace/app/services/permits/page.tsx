import { Metadata } from 'next'
import PermitsClient from './PermitsClient'

export const metadata: Metadata = {
  title: 'Building Permits — Tracking, Submission & Compliance | Kealee',
  description: 'Automated permit tracking and submission for DC, Maryland, and Virginia. AI compliance review, 85% first-pass approval rate. From $99/month or $325/permit.',
  openGraph: {
    title: 'Building Permits | Kealee',
    description: 'Automated permit tracking and submission. AI compliance review, specialist prep, 12 jurisdictions across DC/MD/VA.',
    url: 'https://kealee.com/services/permits',
    siteName: 'Kealee Marketplace',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Building Permits | Kealee',
    description: 'Permit automation for DC/MD/VA. AI compliance review, 85% first-pass approval. From $99/mo tracking or $325/permit full service.',
  },
  keywords: [
    'building permits', 'permit tracking', 'permit submission', 'DC building permits',
    'Maryland building permits', 'Virginia building permits', 'permit automation',
    'construction permits', 'permit compliance', 'inspection scheduling',
    'permit application', 'code compliance review',
  ],
  alternates: { canonical: 'https://kealee.com/services/permits' },
}

export default function PermitsPage() {
  return <PermitsClient />
}
