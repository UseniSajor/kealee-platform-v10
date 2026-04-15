import type { Metadata } from 'next'
import HeroSection                from '@/components/sections/HeroSection'
import ConceptPermitEstimateSection from '@/components/sections/ConceptPermitEstimateSection'
import ProjectTypesSection         from '@/components/sections/ProjectTypesSection'
import CoreServicesSection         from '@/components/sections/CoreServicesSection'
import FeaturedProductsSection from '@/components/sections/FeaturedProductsSection'
import MarketplaceTeaserSection from '@/components/sections/MarketplaceTeaserSection'
import MilestonePaySection   from '@/components/sections/MilestonePaySection'
import HowItWorksSection     from '@/components/sections/HowItWorksSection'
import MoreProductsSection   from '@/components/sections/MoreProductsSection'
import SocialProofSection    from '@/components/sections/SocialProofSection'
import FaqSection            from '@/components/sections/FaqSection'
import CtaSection            from '@/components/sections/CtaSection'

export const metadata: Metadata = {
  title: 'Kealee — Build Your Project in DC, MD, VA',
  description:
    'AI-powered permits, design, and construction management for homeowners and developers in Washington DC, Maryland, and Virginia. Upload photos, get a floor plan in 24 hours.',
}

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <ConceptPermitEstimateSection />
      <ProjectTypesSection />
      <CoreServicesSection />
      <FeaturedProductsSection />
      <MarketplaceTeaserSection />
      <MilestonePaySection />
      <HowItWorksSection />
      <MoreProductsSection />
      <SocialProofSection />
      <FaqSection />
      <CtaSection />
    </>
  )
}
