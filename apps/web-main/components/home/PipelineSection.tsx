import { Container } from '@/components/ui/Container'
import { Heading } from '@/components/ui/Heading'

const PHASES = [
  { n: 1, title: 'Idea',            emoji: '💡', group: 'plan',   desc: 'Pre-Design & Site Capture' },
  { n: 2, title: 'Design',          emoji: '📐', group: 'plan',   desc: 'AI Concept Package & Visual Renders' },
  { n: 3, title: 'Estimate',        emoji: '📊', group: 'plan',   desc: 'RSMeans Cost Planning & Estimates' },
  { n: 4, title: 'Permit',          emoji: '📋', group: 'permit', desc: 'Jurisdiction Filing & Review Cycles' },
  { n: 5, title: 'Contractor',      emoji: '🤝', group: 'permit', desc: 'Vetted Contractor Match & Escrow' },
  { n: 6, title: 'Execution',       emoji: '🏗️', group: 'build',  desc: 'Active Construction & Progress Tracking' },
  { n: 7, title: 'Completion',      emoji: '✅', group: 'build',  desc: 'Closeout, Sign-off & Handover' },
]

const GROUP_COLOR: Record<string, string> = {
  plan:   '#E8793A',
  permit: '#2ABFBF',
  build:  '#38A169',
}

export function PipelineSection() {
  return (
    <section className="py-20" style={{ backgroundColor: '#1A2B4A' }}>
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-xs font-bold uppercase tracking-[0.15em]" style={{ color: '#2ABFBF' }}>
            7-Phase Unified Lifecycle
          </span>
          <Heading as="h2" color="white" className="mt-3 text-3xl sm:text-4xl">
            Every Phase — One Platform
          </Heading>
          <p className="mt-4 text-lg text-gray-300">
            Kealee tracks, automates, and reports across all 7 unified lifecycle stages with dedicated OS modules and AI assistants.
          </p>
        </div>

        {/* Phase grid */}
        <div className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-7">
          {PHASES.map(phase => (
            <div
              key={phase.n}
              className="group flex flex-col items-center rounded-xl p-4 text-center transition-all hover:scale-[1.03]"
              style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.05)' }}
            >
              <div
                className="mb-2.5 flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white"
                style={{ backgroundColor: GROUP_COLOR[phase.group] }}
              >
                {phase.n}
              </div>
              <p className="text-sm font-semibold text-white">{phase.title}</p>
              <p className="mt-1 text-lg">{phase.emoji}</p>
              <p className="mt-2 text-xs text-gray-400 leading-relaxed">{phase.desc}</p>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-gray-400">
          {[
            { color: '#E8793A', label: 'Planning & Design (Phases 1–3)' },
            { color: '#2ABFBF', label: 'Filing & Matching (Phases 4–5)' },
            { color: '#38A169', label: 'Execution & Handover (Phases 6–7)' },
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
