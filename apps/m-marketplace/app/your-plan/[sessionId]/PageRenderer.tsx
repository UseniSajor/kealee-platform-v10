'use client'

import { HeroSection } from './components/HeroSection'
import { ContractorGrid } from './components/ContractorGrid'
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
  contractor_grid: ContractorGrid,
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
        <h3 className="text-xl font-bold text-neutral-900 mb-2">Ready to get started?</h3>
        <p className="text-neutral-500 mb-6">Create your free account and start connecting with professionals today.</p>
        <a
          href="/signup"
          className="inline-flex items-center gap-2 bg-indigo-600 text-white font-bold px-8 py-4 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 active:scale-95"
        >
          Create Free Account
        </a>
        <p className="text-xs text-neutral-400 mt-4">
          Generated {new Date(pageData.generatedAt).toLocaleDateString()}
        </p>
      </section>
    </div>
  )
}
