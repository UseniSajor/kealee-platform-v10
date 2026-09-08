import type { Metadata } from 'next'
import { ServicesJourneySection } from '@/components/home/ServicesJourneySection'
import { HowItWorksSection } from '@/components/home/HowItWorksSection'
import { loadCardMediaManifest } from '@/lib/marketing/card-media-manifest'
import { mergeHomeServicesWithManifest } from '@/lib/marketing/merge-home-services'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Kealee — Plan your home project with clarity',
  description:
    'Tell Kealee what you want to build and get clear direction on design, likely cost, permits, and next steps. Available nationwide.',
  openGraph: {
    title: 'Kealee — Plan your home project with clarity',
    description:
      'Start with an address and an idea. Kealee helps you understand the design, likely cost, permit requirements, and next steps.',
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

      {/* One customer journey, trust statements, and focused FAQs. */}
      <HowItWorksSection />
    </>
  )
}
