import { Container } from '@/components/ui/Container'
import { Heading } from '@/components/ui/Heading'

const PHASES = [
  { n: 1, title: 'Idea',            emoji: '💡', group: 'pre' },
  { n: 2, title: 'Land',            emoji: '🌍', group: 'pre' },
  { n: 3, title: 'Feasibility',     emoji: '📊', group: 'pre' },
  { n: 4, title: 'Design',          emoji: '📐', group: 'pre' },
  { n: 5, title: 'Permits',         emoji: '📋', group: 'pre' },
  { n: 6, title: 'Pre-Con',         emoji: '🤝', group: 'pre' },
  { n: 7, title: 'Construction',    emoji: '🏗️', group: 'con' },
  { n: 8, title: 'Inspections',     emoji: '🔍', group: 'con' },
  { n: 9, title: 'Payments',        emoji: '💳', group: 'con' },
  { n: 10, title: 'Closeout',       emoji: '✅', group: 'post' },
  { n: 11, title: 'Operations',     emoji: '⚙️', group: 'post' },
  { n: 12, title: 'Archive',        emoji: '📦', group: 'post' },
]

const GROUP_COLOR: Record<string, string> = {
  pre:  '#E8793A',
  con:  '#2ABFBF',
  post: '#38A169',
}

export function PipelineSection() {
  return (
    <section className="py-20" style={{ backgroundColor: '#1A2B4A' }}>
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-xs font-bold uppercase tracking-[0.15em]" style={{ color: '#2ABFBF' }}>
            12-Phase Lifecycle
          </span>
          <Heading as="h2" color="white" className="mt-3 text-3xl sm:text-4xl">
            Every Phase — One Platform
          </Heading>
          <p className="mt-4 text-lg text-gray-300">
            Kealee tracks, automates, and reports across all 12 construction lifecycle phases with dedicated OS modules and AI assistants.
          </p>
        </div>

        {/* Phase grid */}
        <div className="mt-16 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {PHASES.map(phase => (
            <div
              key={phase.n}
              className="group flex flex-col items-center rounded-xl p-4 text-center transition-all hover:scale-[1.03]"
              style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
            >
              <div
                className="mb-2.5 flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white"
                style={{ backgroundColor: GROUP_COLOR[phase.group] }}
              >
                {phase.n}
              </div>
              <p className="text-sm font-medium text-white">{phase.title}</p>
              <p className="mt-1 text-lg">{phase.emoji}</p>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-gray-400">
          {[
            { color: '#E8793A', label: 'Pre-Development (1–6)' },
            { color: '#2ABFBF', label: 'Construction (7–9)' },
            { color: '#38A169', label: 'Post-Construction (10–12)' },
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
