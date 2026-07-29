import type { Metadata } from 'next'
import { ServicesJourneySection } from '@/components/home/ServicesJourneySection'
import { ConceptPackageSection } from '@/components/home/ConceptPackageSection'
import { PipelineSection } from '@/components/home/PipelineSection'
import { PortalAccessSection } from '@/components/home/PortalAccessSection'
import { loadCardMediaManifest } from '@/lib/marketing/card-media-manifest'
import { mergeHomeServicesWithManifest } from '@/lib/marketing/merge-home-services'

// The media manifest is deployment content, so the homepage can be served from
// Next's full-route cache instead of doing filesystem work on every request.
export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Kealee — Nationwide AI Preconstruction Platform',
  description:
    'Kealee is a nationwide AI preconstruction platform for homeowners, developers, and project owners. Move from design concepts to estimates, jurisdiction-aware permit coordination, and professional handoff.',
  openGraph: {
    title: 'Kealee — Plan, Design, Permit & Build in One Platform',
    description:
      'AI design concepts, validated cost estimates, permit filing, and a project workspace for every homeowner. Starting at $295.',
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

      {/* AI Concept Design — 4-step workflow */}
      <div className="homepage-deferred-content">
        <ConceptPackageSection />

        {/* 4-phase unified lifecycle overview */}
        <PipelineSection />

        {/* Portal dashboard access */}
        <PortalAccessSection />
      </div>
    </>
  )
}
