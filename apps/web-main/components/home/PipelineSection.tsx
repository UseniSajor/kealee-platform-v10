import { Container } from '@/components/ui/Container'
import { Heading } from '@/components/ui/Heading'

const PHASES = [
  { n: 1, title: 'AI Design Concepts', emoji: '📐', group: 'design',   desc: 'AI renders, floor plan options, and zoning/permit path reports in 2–5 days.' },
  { n: 2, title: 'Cost Estimating',   emoji: '📊', group: 'estimate', desc: 'Line-item material and labor estimates validated against RSMeans regional data.' },
  { n: 3, title: 'Permit Filing',      emoji: '📋', group: 'permit',   desc: 'Preparation and submission of full permit packets to county/city agencies.' },
  { n: 4, title: 'Build & Manage',     emoji: '🏗️', group: 'build',    desc: 'Match with vetted local builders, secure funds in escrow, and track construction progress.' },
]

const GROUP_COLOR: Record<string, string> = {
  design:   '#2ABFBF',
  estimate: '#E8793A',
  permit:   '#805AD5',
  build:    '#38A169',
}

export function PipelineSection() {
  return (
    <section className="py-20 bg-slate-50 border-y border-slate-200">
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-xs font-bold uppercase tracking-[0.15em]" style={{ color: '#2ABFBF' }}>
            4-Phase Unified Project Lifecycle
          </span>
          <Heading as="h2" className="mt-3 text-3xl sm:text-4xl text-slate-900">
            Every Phase — One Platform
          </Heading>
          <p className="mt-4 text-lg text-slate-600">
            Kealee tracks, automates, and reports across 4 key stages from design concept to final construction closeout.
          </p>
        </div>

        {/* Phase grid */}
        <div className="mt-16 max-w-5xl mx-auto grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PHASES.map(phase => (
            <div
              key={phase.n}
              className="group flex flex-col items-center rounded-xl bg-white border border-slate-200 p-6 text-center shadow-sm transition-all hover:shadow-md hover:scale-[1.03]"
            >
              <div
                className="mb-2.5 flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white shadow-sm"
                style={{ backgroundColor: GROUP_COLOR[phase.group] }}
              >
                {phase.n}
              </div>
              <p className="text-sm font-bold text-slate-900">{phase.title}</p>
              <p className="mt-1.5 text-2xl">{phase.emoji}</p>
              <p className="mt-2.5 text-xs text-slate-500 leading-relaxed">{phase.desc}</p>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500">
          {[
            { color: '#2ABFBF', label: 'Phase 1: Design Concepts' },
            { color: '#E8793A', label: 'Phase 2: Estimating' },
            { color: '#805AD5', label: 'Phase 3: Permitting' },
            { color: '#38A169', label: 'Phase 4: Build & Manage (Contractor Match)' },
          ].map(item => (
            <span key={item.label} className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
              {item.label}
            </span>
          ))}
        </div>
      </Container>
    </section>
  )
}
