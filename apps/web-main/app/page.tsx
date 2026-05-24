import type { Metadata } from 'next'
import { ServicesJourneySection } from '@/components/home/ServicesJourneySection'
import { loadCardMediaManifest } from '@/lib/marketing/card-media-manifest'
import { mergeHomeServicesWithManifest } from '@/lib/marketing/merge-home-services'

export const metadata: Metadata = {
  title: 'Kealee — AI Design, Permits, Estimates & Build in DC, MD, VA',
  description:
    'AI design concepts, permit analysis, cost estimation, and contractor matching for home projects in Washington DC, Maryland, and Virginia.',
  openGraph: {
    title: 'Your Project Journey: Design → Permits → Estimate → Build',
    description: 'Four connected services from concept to completion on Kealee.',
  },
}

export default async function HomePage() {
  const manifest = await loadCardMediaManifest()
  const services = mergeHomeServicesWithManifest(manifest)
  return <ServicesJourneySection services={services} />
}
