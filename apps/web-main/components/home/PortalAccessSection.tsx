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
    title:   'Contractor Portal',
    role:    'Contractors',
    desc:    'Manage leads, submit bids, run field operations, and track payments across all active projects.',
    accent:  '#E8793A',
    href:    '/login',
  },
  {
    emoji:   '🏢',
    title:   'Developer Portal',
    role:    'Developers',
    desc:    'Land pipeline, feasibility studies, capital stack management, and multi-project portfolio analytics.',
    accent:  '#805AD5',
    href:    '/login',
  },
  {
    emoji:   '🧠',
    title:   'Command Center',
    role:    'Operations',
    desc:    'AI workflow queue, concept review, integration health, and full-platform operations oversight.',
    accent:  '#1A2B4A',
    href:    '/login',
  },
]

export function PortalAccessSection() {
  return (
    <section className="py-20" style={{ backgroundColor: '#F8FAFC' }}>
      <Container>
        <div className="mx-auto max-w-2xl text-center mb-12">
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#2ABFBF' }}>
            Your Portals
          </span>
          <h2 className="mt-3 text-3xl font-bold font-display sm:text-4xl" style={{ color: '#1A2B4A' }}>
            Access Your Dashboard
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Each role has a dedicated portal built for how you work — with AI assistants, real-time data, and tools purpose-built for construction.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PORTALS.map((portal) => (
            <Link
              key={portal.title}
              href={portal.href}
              className="group relative flex flex-col rounded-2xl border border-gray-200 bg-white p-6 transition-all hover:shadow-md hover:-translate-y-0.5"
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
              <h3 className="text-base font-bold font-display mb-2" style={{ color: '#1A2B4A' }}>
                {portal.title}
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed flex-1">{portal.desc}</p>

              <div className="mt-4 flex items-center gap-1 text-sm font-semibold transition-all group-hover:gap-2" style={{ color: portal.accent }}>
                Sign In <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-gray-500">
          First time?{' '}
          <Link href="/intake" className="font-semibold hover:underline" style={{ color: '#E8793A' }}>
            Start a project
          </Link>
          {' '}or{' '}
          <Link href="/contractor/register" className="font-semibold hover:underline" style={{ color: '#2ABFBF' }}>
            join as a contractor
          </Link>
        </p>
      </Container>
    </section>
  )
}
