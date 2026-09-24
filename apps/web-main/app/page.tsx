import type { Metadata } from 'next'
import { ServicesJourneySection } from '@/components/home/ServicesJourneySection'
import { HowItWorksSection } from '@/components/home/HowItWorksSection'
import { HomeUpgradesSection } from '@/components/home/HomeUpgradesSection'
import { loadCardMediaManifest } from '@/lib/marketing/card-media-manifest'
import { mergeHomeServicesWithManifest } from '@/lib/marketing/merge-home-services'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Kealee — From site plan to protected construction',
  description:
    'Site plans, design concepts with planning estimates, permits, property upgrades, contractor matching, and protected milestone payments in one clear project journey.',
  openGraph: {
    title: 'Kealee — From site plan to protected construction',
    description:
      'Choose one service and move forward with fewer questions, clear deliverables, and one coordinated owner workspace.',
    url: 'https://kealee.com',
  },
  alternates: { canonical: '/' },
}

export default async function HomePage() {
  const manifest = await loadCardMediaManifest()
  const services = mergeHomeServicesWithManifest(manifest)
  return (
    <>
      {/* Full-screen video hero + services (single hero — VideoHeroSection removed as duplicate) */}
      <ServicesJourneySection services={services} />

      {/* Outcome-based comfort and lifestyle projects live in the marketplace. */}
      <HomeUpgradesSection />

      {/* One customer journey, trust statements, and focused FAQs. */}
      <HowItWorksSection />
    </>
  )
}
