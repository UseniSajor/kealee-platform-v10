import Link from 'next/link'

const STEPS = [
  { label: 'Agree',              desc: 'Project scope and milestone schedule locked in digital contract' },
  { label: 'Milestone Set',      desc: 'Funds deposited to escrow before work begins on each phase' },
  { label: 'Work Complete',      desc: 'Contractor submits completion evidence — photos, lien waivers, inspection sign-off' },
  { label: 'Funds Released',     desc: 'You approve, funds release instantly to contractor' },
]

export function MilestonePaySection() {
  return (
    <section className="py-24" style={{ background: '#1A2B4A' }}>
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mb-14 text-center">
          <span
            className="inline-block text-[13px] font-semibold uppercase tracking-[0.1em]"
            style={{ color: '#2ABFBF' }}
          >
            Milestone Payments
          </span>
          <h2 className="mt-3 text-3xl font-bold font-display text-white sm:text-4xl">
            Get Paid When the Work is Done —<br className="hidden sm:block" />
            {' '}Not When You Hope It Is
          </h2>
          <p className="mt-4 max-w-xl mx-auto text-gray-400">
            Every payment is held in escrow and only released when milestones are verified. No surprises for owners, no chasing invoices for contractors.
          </p>
        </div>

        {/* 4-step flow */}
        <div className="relative">
          {/* Connector line */}
          <div
            className="absolute left-1/2 top-7 hidden h-px w-[calc(100%-120px)] -translate-x-1/2 lg:block"
            style={{ background: 'rgba(255,255,255,.12)' }}
          />

          <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
            {STEPS.map((step, i) => (
              <div key={step.label} className="relative flex flex-col items-center text-center">
                {/* Step number */}
                <div
                  className="relative z-10 mb-4 flex h-14 w-14 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ background: '#2ABFBF', border: '3px solid #1A2B4A', boxShadow: '0 0 0 2px rgba(42,191,191,.3)' }}
                >
                  {i + 1}
                </div>
                <h3 className="text-sm font-semibold text-white">{step.label}</h3>
                <p className="mt-2 text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,.4)' }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 text-center">
          <Link
            href="/features#payments"
            className="inline-flex items-center gap-2 rounded-xl border-2 border-white/20 px-7 py-3.5 text-sm font-semibold text-white transition-all hover:border-white/40 hover:bg-white/5"
          >
            How It Works →
          </Link>
        </div>
      </div>
    </section>
  )
}
