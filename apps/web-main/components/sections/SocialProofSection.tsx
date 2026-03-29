const STATS = [
  { value: '2,400+', label: 'Projects Managed' },
  { value: '98%',    label: 'Permit Approval Rate' },
  { value: '14 Days', label: 'Avg to Permit' },
  { value: '$180M',  label: 'Processed' },
]

const TESTIMONIALS = [
  {
    quote: "Kealee's AI walked me through every permit requirement before we even submitted. We got approved in one cycle — unheard of in Montgomery County.",
    name: 'Sarah M.',
    type: 'Kitchen + Addition',
    location: 'Bethesda, MD',
  },
  {
    quote: "As a GC, the AI bid assistant saves me hours on every quote. And getting paid at milestones through escrow has completely changed my cash flow.",
    name: 'James R.',
    type: 'General Contractor',
    location: 'Fairfax, VA',
  },
  {
    quote: "The feasibility study came back in two days. The AI flagged a zoning issue we would have missed and saved us from a $300K mistake.",
    name: 'David L.',
    type: 'Developer — Multifamily',
    location: 'DC Metro',
  },
]

export function SocialProofSection() {
  return (
    <section className="py-20 bg-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Stats */}
        <div
          className="mb-20 grid grid-cols-2 gap-px overflow-hidden rounded-2xl lg:grid-cols-4"
          style={{ background: 'var(--border, #E2E1DC)' }}
        >
          {STATS.map(s => (
            <div key={s.label} className="flex flex-col items-center bg-white py-10 text-center">
              <span className="text-4xl font-bold font-display" style={{ color: '#C8521A' }}>{s.value}</span>
              <span className="mt-2 text-sm text-gray-500">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Testimonials */}
        <div className="text-center mb-10">
          <span className="section-label">What People Say</span>
          <h2 className="mt-3 text-3xl font-bold font-display sm:text-4xl" style={{ color: '#1A2B4A' }}>
            Real projects. Real results.
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map(t => (
            <div
              key={t.name}
              className="flex flex-col rounded-2xl p-7"
              style={{ background: 'var(--surface, #F5F4F0)', border: '1px solid var(--border, #E2E1DC)' }}
            >
              <p className="flex-1 text-sm leading-relaxed text-gray-600">"{t.quote}"</p>
              <div className="mt-5 border-t border-gray-200 pt-5">
                <p className="font-semibold text-sm" style={{ color: '#1A1C1B' }}>{t.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{t.type} · {t.location}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
