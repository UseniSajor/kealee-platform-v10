import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Post an Opportunity | Kealee Opportunities',
  description: 'Post a PM position, trade job, apprenticeship program, or government contract on the Kealee Opportunities platform.',
}

const POST_TYPES = [
  {
    icon: '\u{1F4CB}',
    label: 'PM Position',
    desc: 'Post a project manager role — on-demand, embedded, or owner\'s representative.',
    href: '/opportunities/interest',
    color: '#5B2D8E',
  },
  {
    icon: '\u{1F527}',
    label: 'Trade Job',
    desc: 'Post a skilled trades position — journeymen, foremen, or specialty subcontractors.',
    href: '/opportunities/interest',
    color: '#A84E10',
  },
  {
    icon: '\u{1F393}',
    label: 'Apprenticeship Program',
    desc: 'List a registered apprenticeship program or training partnership.',
    href: '/opportunities/interest',
    color: '#196B5E',
  },
  {
    icon: '\u{1F3DB}',
    label: 'Government Contract',
    desc: 'Post a public sector construction solicitation or RFP.',
    href: '/opportunities/interest',
    color: '#1A3A6B',
  },
]

export default function PostOpportunityPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 lg:px-10 py-20">
      <div className="text-xs font-bold tracking-[2.5px] uppercase mb-3" style={{ color: '#5B2D8E' }}>
        Phase 06 &middot; Post an Opportunity
      </div>
      <h1
        className="text-5xl font-bold mb-3"
        style={{ fontFamily: "'Cormorant Garamond', serif", color: '#0D1F3C' }}
      >
        What would you like to post?
      </h1>
      <p className="text-base font-light leading-relaxed mb-10" style={{ color: '#7A6E60' }}>
        Kealee Opportunities launches in 2026. Join the interest list now and you&apos;ll be
        among the first to post when the platform goes live.
      </p>

      <div className="grid sm:grid-cols-2 gap-5">
        {POST_TYPES.map((type) => (
          <Link
            key={type.label}
            href={type.href}
            className="rounded-2xl p-7 flex flex-col hover:shadow-lg transition-shadow"
            style={{ border: '1.5px solid #E5DFD5', background: 'white' }}
          >
            <div className="text-4xl mb-3">{type.icon}</div>
            <div className="text-base font-bold mb-1" style={{ color: type.color }}>
              {type.label}
            </div>
            <p className="text-sm font-light leading-relaxed" style={{ color: '#7A6E60' }}>
              {type.desc}
            </p>
          </Link>
        ))}
      </div>

      <div
        className="mt-10 rounded-xl p-6 text-center"
        style={{ background: 'rgba(91,45,142,.05)', border: '1px solid rgba(91,45,142,.12)' }}
      >
        <p className="text-sm font-light" style={{ color: '#7A6E60' }}>
          Posting will be available when Opportunities launches.{' '}
          <Link href="/opportunities/interest" className="font-semibold" style={{ color: '#5B2D8E' }}>
            Join the interest list
          </Link>{' '}
          to be notified at launch.
        </p>
      </div>
    </main>
  )
}
