import type { Metadata } from 'next'
import BuildPageClient from './BuildPageClient'

export const metadata: Metadata = {
  title: 'Build — Kealee',
  description: 'The complete platform for residential construction in DC, MD, and VA. AI concept, professional drawings, permits, contractor matching, and build management — every professional through one platform.',
}

export default function BuildPage() {
  return <BuildPageClient />
}
