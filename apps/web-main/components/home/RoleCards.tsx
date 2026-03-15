import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { Heading } from '@/components/ui/Heading'

const ROLES = [
  {
    emoji:       '🏠',
    title:       'Homeowners',
    tagline:     'Build with confidence',
    description: 'Track your renovation or new build. Escrow-protected payments, AI progress tracking, and a vetted contractor network.',
    href:        '/homeowners',
    cta:         'Start a Project',
    accent:      '#2ABFBF',
  },
  {
    emoji:       '🏢',
    title:       'Developers',
    tagline:     'From land to exit',
    description: 'Land intelligence, feasibility pro formas, capital stack management, and full development lifecycle tracking.',
    href:        '/developers',
    cta:         'Explore Developer Tools',
    accent:      '#1A2B4A',
  },
  {
    emoji:       '🔨',
    title:       'Contractors',
    tagline:     'Win more. Build better.',
    description: 'Join the vetted marketplace, manage bids, track field operations, and grow your reputation through verified work.',
    href:        '/contractors',
    cta:         'Join the Network',
    accent:      '#E8793A',
  },
  {
    emoji:       '📐',
    title:       'Architects & Engineers',
    tagline:     'Collaborate seamlessly',
    description: 'Coordinate RFIs, manage submittals, distribute drawing sets, and stay connected to every project stakeholder.',
    href:        '/design-professionals',
    cta:         'See AE Tools',
    accent:      '#805AD5',
  },
  {
    emoji:       '🏛️',
    title:       'Government',
    tagline:     'Strengthen housing supply',
    description: 'Municipal dashboards, permit coordination, and tools aligned with housing finance programs to accelerate development.',
    href:        '/government',
    cta:         'Municipal Overview',
    accent:      '#38A169',
  },
]

export function RoleCards() {
  return (
    <section className="py-20 bg-white">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <Heading>Who Kealee Is Built For</Heading>
          <p className="mt-4 text-lg text-gray-600">
            One platform — purpose-built tools for every role in construction.
          </p>
        </div>

        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {ROLES.map(role => (
            <Link
              key={role.title}
              href={role.href}
              className="group relative flex flex-col rounded-2xl border border-gray-200 bg-white p-6 transition-all hover:shadow-lg hover:-translate-y-0.5"
              style={{ '--accent': role.accent } as React.CSSProperties}
            >
              {/* Top accent bar */}
              <div className="absolute inset-x-0 top-0 h-0.5 rounded-t-2xl" style={{ backgroundColor: role.accent }} />

              <div
                className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl text-2xl transition-transform group-hover:scale-110"
                style={{ backgroundColor: `${role.accent}14` }}
              >
                {role.emoji}
              </div>

              <div className="flex-1">
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: role.accent }}>
                  {role.tagline}
                </p>
                <h3 className="text-lg font-bold font-display mb-2" style={{ color: '#1A2B4A' }}>
                  {role.title}
                </h3>
                <p className="text-sm leading-relaxed text-gray-500">{role.description}</p>
              </div>

              <div className="mt-5 flex items-center gap-1 text-sm font-semibold transition-colors group-hover:gap-2" style={{ color: role.accent }}>
                {role.cta}
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  )
}
