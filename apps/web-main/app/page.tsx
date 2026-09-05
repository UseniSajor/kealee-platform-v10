import type { Metadata } from 'next'
import { ServicesJourneySection } from '@/components/home/ServicesJourneySection'
import { PreconstructionSuiteSection } from '@/components/home/PreconstructionSuiteSection'
import { HowItWorksSection } from '@/components/home/HowItWorksSection'
import { ConceptPackageSection } from '@/components/home/ConceptPackageSection'
import { PipelineSection } from '@/components/home/PipelineSection'
import { PortalAccessSection } from '@/components/home/PortalAccessSection'
import { loadCardMediaManifest } from '@/lib/marketing/card-media-manifest'
import { mergeHomeServicesWithManifest } from '@/lib/marketing/merge-home-services'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Kealee — Preconstruction clarity before you build',
  description:
    'Turn your property, project idea, plans, or solicitation into a design concept, estimate, site plan, and permit-ready package. Available nationwide.',
  openGraph: {
    title: 'Kealee — Design Concept, Estimation, Site Plan & Permitting',
    description:
      'The four preconstruction products every project needs, in one place. Available nationwide with packages tailored to your property and project.',
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

      {/* The four core preconstruction products — primary commercial surface */}
      <PreconstructionSuiteSection />

      {/* Journey, nationwide statement, trust/QC, FAQ */}
      <HowItWorksSection />

      {/* design concept Design — 4-step workflow */}
      <ConceptPackageSection />

      {/* 4-phase unified lifecycle overview */}
      <PipelineSection />

      {/* Portal dashboard access */}
      <PortalAccessSection />
    </>
  )
}
