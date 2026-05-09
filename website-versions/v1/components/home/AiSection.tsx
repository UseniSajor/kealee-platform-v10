import { Container } from '@/components/ui/Container'
import { Heading } from '@/components/ui/Heading'

const BOTS = [
  { name: 'Command',      role: 'Master orchestrator — routes to the right specialist',   emoji: '🧠' },
  { name: 'Owner',        role: 'Your project advisor — budgets, timelines, decisions',    emoji: '👤' },
  { name: 'GC',           role: 'Bids, sub coordination, compliance, crew scheduling',    emoji: '🔨' },
  { name: 'Construction', role: 'Progress tracking, inspections, daily logs, COs',        emoji: '🏗️' },
  { name: 'Land',         role: 'Parcel research, zoning lookups, dev readiness',          emoji: '🌍' },
  { name: 'Feasibility',  role: 'Scenario analysis, pro forma generation, comparisons',   emoji: '📊' },
  { name: 'Finance',      role: 'Capital stack optimization, draw management, HUD',        emoji: '💰' },
  { name: 'Developer',    role: 'Portfolio analytics, investor reports, waterfall',        emoji: '📈' },
  { name: 'Permit',       role: 'Permit navigation, jurisdiction rules, document prep',   emoji: '📋' },
  { name: 'Estimate',     role: 'AI cost estimation from plans with line-item breakdowns', emoji: '💡' },
  { name: 'Payments',     role: 'Payment coordination, escrow monitoring, reconciliation', emoji: '💳' },
  { name: 'Marketplace',  role: 'Contractor matchmaking, bid analysis, trade recs',       emoji: '🤝' },
  { name: 'Operations',   role: 'Warranty claims, maintenance, turnover tracking',         emoji: '⚙️' },
]

export function AiSection() {
  return (
    <section className="py-20 bg-white" id="keabots">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#2ABFBF' }}>
            AI-Powered Automation
          </span>
          <Heading className="mt-3">13 KeaBot AI Assistants</Heading>
          <p className="mt-4 text-lg text-gray-600">
            Every domain has a dedicated AI assistant powered by Claude. KeaBots orchestrate tasks,
            answer questions, and automate workflows — so your team can focus on building.
          </p>
        </div>

        <div className="mt-16 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {BOTS.map(bot => (
            <div
              key={bot.name}
              className="flex items-start gap-3 rounded-xl border border-gray-200 p-4 transition-all hover:border-teal-200 hover:shadow-sm"
            >
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-xl" style={{ backgroundColor: 'rgba(42,191,191,0.1)' }}>
                {bot.emoji}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold" style={{ color: '#1A2B4A' }}>KeaBot {bot.name}</p>
                <p className="mt-0.5 text-xs leading-snug text-gray-500">{bot.role}</p>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  )
}
