import type { Metadata } from 'next'
import { HeroSection }              from '@/components/sections/HeroSection'
import { ProjectCategoriesSection } from '@/components/sections/ProjectCategoriesSection'
import { ProjectTypesSection }      from '@/components/sections/ProjectTypesSection'
import { CoreServicesSection }      from '@/components/sections/CoreServicesSection'
import { FeaturedProductsSection }  from '@/components/sections/FeaturedProductsSection'
import { MarketplaceTeaserSection } from '@/components/sections/MarketplaceTeaserSection'
import { MilestonePaySection }      from '@/components/sections/MilestonePaySection'
import { HowItWorksSection }        from '@/components/sections/HowItWorksSection'
import { MoreProductsSection }      from '@/components/sections/MoreProductsSection'
import { SocialProofSection }       from '@/components/sections/SocialProofSection'
import { FaqSection }               from '@/components/sections/FaqSection'
import { CtaSection }               from '@/components/sections/CtaSection'

export const metadata: Metadata = {
  title: 'Kealee — Build Smarter. From Concept to Closeout.',
  description:
    'AI-powered permits, design, and construction management for homeowners and developers. 13 AI assistants. Escrow-protected payments. Digital twins for every project.',
}

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <ProjectCategoriesSection />
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
