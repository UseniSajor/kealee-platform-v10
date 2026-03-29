import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

const MORE = [
  {
    icon: '🤖',
    title: 'AI Bot Suite',
    sub: '13 AI assistants',
    desc: 'Dedicated AI for every role: KeaBot Owner, GC, Feasibility, Finance, Permits, and more — each trained on your project data.',
    href: '/features',
    accent: '#C8521A',
  },
  {
    icon: '🔮',
    title: 'Digital Twin Platform',
    sub: 'Live project models',
    desc: 'A real-time digital replica of every project — tracking milestones, draws, inspections, and lien waivers automatically.',
    href: '/developers',
    accent: '#2ABFBF',
  },
  {
    icon: '🌍',
    title: 'Land Intelligence',
    sub: 'Parcel AI',
    desc: 'Parcel scoring, zoning analysis, and development readiness reporting. Ask our AI if a parcel pencils before you make an offer.',
    href: '/developers',
    accent: '#3A7D52',
  },
  {
    icon: '📈',
    title: 'Investor Reporting',
    sub: 'Auto-generated',
    desc: 'Real-time investor reports generated directly from your digital twin data. Scheduled delivery, custom branding.',
    href: '/developers',
    accent: '#4A8FA8',
  },
]

export function MoreProductsSection() {
  return (
    <section className="py-20" style={{ background: 'var(--surface, #F5F4F0)' }}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <span className="section-label">Platform Depth</span>
          <h2 className="mt-3 text-3xl font-bold font-display sm:text-4xl" style={{ color: '#1A2B4A' }}>
            More tools. More intelligence.
          </h2>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {MORE.map(p => (
            <div
              key={p.title}
              className="rounded-2xl bg-white p-6 transition-shadow hover:shadow-md"
              style={{ border: '1px solid var(--border, #E2E1DC)' }}
            >
              <div className="mb-4 text-3xl">{p.icon}</div>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: p.accent }}>{p.sub}</p>
              <h3 className="mt-1 text-base font-bold font-display" style={{ color: '#1A1C1B' }}>{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">{p.desc}</p>
              <Link
                href={p.href}
                className="mt-4 inline-flex items-center gap-1 text-xs font-semibold transition-all hover:gap-2"
                style={{ color: p.accent }}
              >
                Learn more <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
