import type { Metadata } from 'next'
import { VideoHeroSection } from '@/components/home/VideoHeroSection'
import { ServicesJourneySection } from '@/components/home/ServicesJourneySection'
import { ConceptPackageSection } from '@/components/home/ConceptPackageSection'
import { PipelineSection } from '@/components/home/PipelineSection'
import { PortalAccessSection } from '@/components/home/PortalAccessSection'
import { loadCardMediaManifest } from '@/lib/marketing/card-media-manifest'
import { mergeHomeServicesWithManifest } from '@/lib/marketing/merge-home-services'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Kealee — Design-Build Platform | DC, MD & VA',
  description:
    'Kealee is the end-to-end design-build platform for homeowners. design concepts, RSMeans cost estimates, permit filing, and a personal project workspace — from first idea to final build. Serving DC, MD & VA.',
  openGraph: {
    title: 'Kealee — Plan, Design, Permit & Build in One Platform',
    description:
      'design concepts, validated cost estimates, permit filing, and a project workspace for every homeowner. Starting at $295.',
    url: 'https://kealee.com',
  },
  alternates: { canonical: '/' },
}

export default async function HomePage() {
  const manifest = await loadCardMediaManifest()
  const services = mergeHomeServicesWithManifest(manifest)
  return (
    <>
      {/* Video Hero: Gilbane-style full screen looping videos */}
      <VideoHeroSection />

      {/* Services: circular service cards */}
      <ServicesJourneySection services={services} />

      {/* design concept Design — 4-step workflow */}
      <ConceptPackageSection />

      {/* 4-phase unified lifecycle overview */}
      <PipelineSection />

      {/* Portal dashboard access */}
      <PortalAccessSection />
    </>
  )
}
