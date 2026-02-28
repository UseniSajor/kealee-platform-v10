'use client'

import { HeroSection } from './components/HeroSection'
import { ConceptPackages } from './components/ConceptPackages'
import { BudgetBreakdown } from './components/BudgetBreakdown'
import { TimelineSection } from './components/TimelineSection'
import { PricingGrid } from './components/PricingGrid'
import { CaseStudyGrid } from './components/CaseStudyGrid'

interface SectionData {
  type: string
  data: any
}

interface PageData {
  sessionId: string
  sections: SectionData[]
  layout: string[]
  generatedAt: string
}

const SECTION_COMPONENTS: Record<string, React.ComponentType<{ data: any }>> = {
  hero: HeroSection,
  concept_packages: ConceptPackages,
  budget_breakdown: BudgetBreakdown,
  timeline: TimelineSection,
  pricing_grid: PricingGrid,
  case_studies: CaseStudyGrid,
}

export function PageRenderer({ pageData }: { pageData: PageData }) {
  return (
    <div className="space-y-12">
      {pageData.sections.map((section, idx) => {
        const Component = SECTION_COMPONENTS[section.type]
        if (!Component) return null
        return <Component key={`${section.type}-${idx}`} data={section.data} />
      })}

      {/* Footer CTA */}
      <section className="bg-neutral-50 rounded-2xl border border-neutral-100 p-8 text-center">
        <h3 className="text-xl font-bold text-neutral-900 mb-2">Ready to see your project in 3D?</h3>
        <p className="text-neutral-500 mb-6">Choose a concept package above or call us to discuss your project.</p>
        <a
          href="tel:+12404673388"
          className="inline-flex items-center gap-2 bg-green-600 text-white font-bold px-8 py-4 rounded-xl hover:bg-green-700 transition-all shadow-lg shadow-green-200 active:scale-95"
        >
          Call (240) 467-3388
        </a>
        <p className="text-xs text-neutral-400 mt-4">
          Generated {new Date(pageData.generatedAt).toLocaleDateString()}
        </p>
      </section>
    </div>
  )
}
