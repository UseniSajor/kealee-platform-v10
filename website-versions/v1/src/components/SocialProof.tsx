export function SocialProof() {
  const stats = [
    { label: 'DMV jurisdictions modeled', value: 'DC · MD · VA' },
    { label: 'Average intake cadence', value: 'Same-day routing' },
    { label: 'Ops modules ready', value: 'Eleven SKUs' },
  ]

  return (
    <section className="bg-navy px-4 py-14 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-teal-light">Operators trust Kealee</p>
          <h2 className="mt-4 font-display text-3xl font-bold sm:text-4xl">Built with builders — instrumented like software.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-white/70">
            Teams adopt Milestone Pay plus modular ops SKUs without ripping out accounting stacks — execution stays grounded in jobsite reality.
          </p>
        </div>
        <div className="mt-12 grid gap-6 text-center sm:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-white/15 bg-white/5 px-6 py-8">
              <p className="font-display text-2xl font-bold text-white">{stat.value}</p>
              <p className="mt-2 text-xs uppercase tracking-[0.25em] text-white/45">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
