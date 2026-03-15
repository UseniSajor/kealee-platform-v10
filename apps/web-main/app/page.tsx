import type { Metadata } from 'next'
import { HeroSection } from '@/components/home/HeroSection'
import { RoleCards } from '@/components/home/RoleCards'
import { PipelineSection } from '@/components/home/PipelineSection'
import { MarketplaceSection } from '@/components/home/MarketplaceSection'
import { ContractorSection } from '@/components/home/ContractorSection'
import { DeveloperSection } from '@/components/home/DeveloperSection'
import { AiSection } from '@/components/home/AiSection'

export const metadata: Metadata = {
  title: 'Kealee — The Full-Lifecycle Construction Platform',
  description:
    'From land acquisition to project closeout — 7 operating systems, 13 AI assistants, and digital twins for every project.',
}

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <RoleCards />
      <PipelineSection />
      <MarketplaceSection />
      <ContractorSection />
      <DeveloperSection />
      <AiSection />
    </>
  )
}
