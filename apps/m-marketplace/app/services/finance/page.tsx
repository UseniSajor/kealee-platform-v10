import { Metadata } from 'next'
import FinanceClient from './FinanceClient'

export const metadata: Metadata = {
  title: 'Construction Escrow — FDIC Insured Payment Protection | Kealee',
  description: 'FDIC-insured escrow accounts with milestone-based releases. Free setup, no monthly fees. SOC 2 compliant. Protect project payments for owners and contractors.',
  openGraph: {
    title: 'Construction Escrow | Kealee',
    description: 'FDIC-insured escrow with milestone-based releases. $0 setup, $0 monthly fees. Owners control releases. Contractors get paid on time.',
    url: 'https://kealee.com/services/finance',
    siteName: 'Kealee Marketplace',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Construction Escrow | Kealee',
    description: 'FDIC-insured construction escrow. Free setup, milestone-based releases, SOC 2 compliant. Protect your project payments.',
  },
  keywords: [
    'construction escrow', 'FDIC insured escrow', 'milestone payments',
    'construction payment protection', 'contractor payment', 'project escrow',
    'construction finance', 'lien waiver management', 'payment dispute resolution',
    'SOC 2 construction', 'escrow account', 'builder payment protection',
  ],
  alternates: { canonical: 'https://kealee.com/services/finance' },
}

export default function FinancePage() {
  return <FinanceClient />
}
