import type { Metadata } from 'next'
import { Suspense } from 'react'
import { Hero } from '@/src/components/Hero'
import { AskAnythingBar } from '@/src/components/AskAnythingBar'
import { AskAnythingBarSkeleton } from '@/src/components/AskAnythingBarSkeleton'
import { HowItWorksPreview } from '@/src/components/HowItWorksPreview'
import { ProductsPreview } from '@/src/components/ProductsPreview'
import { MilestonePayPreview } from '@/src/components/MilestonePayPreview'
import { SocialProof } from '@/src/components/SocialProof'

export const metadata: Metadata = {
  title: 'Kealee — Concept-led construction intelligence',
  description:
    'Plan permits, estimation, ops modules, and Milestone Pay from one Concept dossier — tuned for DMV jurisdictions.',
  openGraph: {
    title: 'Kealee — Concept-led construction intelligence',
    description:
      'Plan permits, estimation, ops modules, and Milestone Pay from one Concept dossier — tuned for DMV jurisdictions.',
    url: 'https://kealee.com',
    siteName: 'Kealee',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kealee — Concept-led construction intelligence',
    description:
      'Plan permits, estimation, ops modules, and Milestone Pay from one Concept dossier — tuned for DMV jurisdictions.',
  },
}

export default function HomePage() {
  return (
    <>
      <Hero />
      <Suspense fallback={<AskAnythingBarSkeleton />}>
        <AskAnythingBar />
      </Suspense>
      <HowItWorksPreview />
      <ProductsPreview />
      <MilestonePayPreview />
      <SocialProof />
    </>
  )
}
