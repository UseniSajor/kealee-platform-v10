import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Container } from '@/components/ui/Container'

const PORTALS = [
  {
    emoji:   '🏠',
    title:   'Owner Portal',
    role:    'Homeowners',
    desc:    'Track builds, approve payments, view your project dashboard, and message your team — all in one place.',
    accent:  '#2ABFBF',
    href:    '/login',
  },
  {
    emoji:   '🔨',
    title:   'Construction Marketplace',
    role:    'Contractors & Developers',
    desc:    'Find opportunities, complete business onboarding, and access available contractor and developer services in one place.',
    accent:  '#E8793A',
    href:    '/marketplace',
  },
]

export function PortalAccessSection() {
  return (
    <section className="py-20 animate-fade-in" style={{ backgroundColor: '#F8FAFC' }}>
      <Container>
        <div className="mx-auto max-w-2xl text-center mb-12">
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#2ABFBF' }}>
            Your Portals
          </span>
          <h2 className="mt-3 text-3xl font-bold font-display sm:text-4xl" style={{ color: '#1E293B' }}>
            Access Your Dashboard
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Dedicated portals built for how you work — with AI assistants, real-time data, and tools purpose-built for construction.
          </p>
        </div>

        <div className="max-w-3xl mx-auto grid gap-6 sm:grid-cols-2">
          {PORTALS.map((portal) => (
            <Link
              key={portal.title}
              href={portal.href}
              className="group relative flex flex-col rounded-2xl border border-slate-200 bg-white p-8 transition-all hover:shadow-md hover:-translate-y-0.5"
            >
              <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl" style={{ backgroundColor: portal.accent }} />

              <div
                className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl text-xl transition-transform group-hover:scale-110"
                style={{ backgroundColor: `${portal.accent}15` }}
              >
                {portal.emoji}
              </div>

              <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: portal.accent }}>
                {portal.role}
              </p>
              <h3 className="text-base font-bold font-display mb-2" style={{ color: '#1E293B' }}>
                {portal.title}
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed flex-1">{portal.desc}</p>

              <div className="mt-4 flex items-center gap-1 text-sm font-semibold transition-all group-hover:gap-2" style={{ color: portal.accent }}>
                {portal.href === '/marketplace' ? 'Open Marketplace' : 'Sign In'} <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-slate-500">
          First time?{' '}
          <Link href="/concept" className="font-semibold hover:underline" style={{ color: '#E8793A' }}>
            Start a project
          </Link>
          {' '}or{' '}
          <Link href="/marketplace?audience=contractor" className="font-semibold hover:underline" style={{ color: '#2ABFBF' }}>
            join the marketplace
          </Link>
        </p>
      </Container>
    </section>
  )
}
