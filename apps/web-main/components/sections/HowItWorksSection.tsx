const STEPS = [
  {
    number: '01',
    icon: '📝',
    title: 'Describe your project',
    desc: 'Use the search bar or answer a few quick questions. Our AI parses your intent and identifies the right project path in seconds.',
  },
  {
    number: '02',
    icon: '🧠',
    title: 'AI generates your concept',
    desc: 'Within days, you receive AI-generated design concepts, a cost band, permit risk score, and a jurisdiction-specific checklist.',
  },
  {
    number: '03',
    icon: '📋',
    title: 'Kealee files your permits',
    desc: 'Our AI reviews your package against local requirements before submission, dramatically reducing back-and-forth comment cycles.',
  },
  {
    number: '04',
    icon: '🤝',
    title: 'Matched contractors bid',
    desc: 'Verified contractors in your area receive your project. They bid through the platform — you compare, select, and sign digitally.',
  },
  {
    number: '05',
    icon: '🔒',
    title: 'Build with protected payments',
    desc: 'Funds are held in escrow and released only when each milestone is verified. Your AI project assistant tracks progress daily.',
  },
]

export function HowItWorksSection() {
  return (
    <section className="py-20 bg-white">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mb-14 text-center">
          <span className="section-label">How It Works</span>
          <h2 className="mt-3 text-3xl font-bold font-display sm:text-4xl" style={{ color: '#1A2B4A' }}>
            From idea to move-in, guided by AI
          </h2>
          <p className="mt-4 max-w-xl mx-auto text-gray-500">
            Five steps with AI handling the complex parts — so you can focus on the outcome, not the paperwork.
          </p>
        </div>

        <div className="space-y-0">
          {STEPS.map((step, i) => (
            <div
              key={step.number}
              className={`flex flex-col gap-6 py-10 lg:flex-row lg:items-start ${i % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}
              style={{ borderBottom: i < STEPS.length - 1 ? '1px solid #F0EFE8' : undefined }}
            >
              {/* Number + icon */}
              <div className="flex flex-shrink-0 items-center gap-4 lg:w-48 lg:flex-col lg:items-center lg:text-center">
                <div
                  className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl text-2xl"
                  style={{ background: 'var(--surface, #F5F4F0)' }}
                >
                  {step.icon}
                </div>
                <span
                  className="text-5xl font-bold font-display leading-none"
                  style={{ color: '#E2E1DC' }}
                >
                  {step.number}
                </span>
              </div>

              {/* Content */}
              <div className="flex-1">
                <h3 className="text-xl font-bold font-display" style={{ color: '#1A2B4A' }}>{step.title}</h3>
                <p className="mt-3 text-gray-500 leading-relaxed max-w-lg">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
