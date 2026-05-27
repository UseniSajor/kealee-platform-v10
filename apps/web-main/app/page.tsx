import type { Metadata } from 'next'
import { ServicesJourneySection } from '@/components/home/ServicesJourneySection'
import { loadCardMediaManifest } from '@/lib/marketing/card-media-manifest'
import { mergeHomeServicesWithManifest } from '@/lib/marketing/merge-home-services'

export const metadata: Metadata = {
  title: 'Kealee — Design-Build Platform | DC, MD & VA',
  description:
    'Kealee is the end-to-end design-build platform for homeowners. AI design concepts, RSMeans cost estimates, permit filing, and a personal project workspace — from first idea to final build. Serving DC, MD & VA.',
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
  return <ServicesJourneySection services={services} />
}
