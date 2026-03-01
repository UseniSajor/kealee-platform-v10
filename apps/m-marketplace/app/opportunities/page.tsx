import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Kealee Opportunities — Construction Workforce & Government Contracts',
  description:
    'Find project managers, trade apprenticeship programs, skilled trade workers, and government procurement contracts — all connected to the Kealee construction platform.',
  openGraph: {
    title: 'Kealee Opportunities — Construction Workforce & Government Contracts',
    description: 'Project managers, trade apprenticeships, skilled workers, and government contracts — all connected to the Kealee platform.',
    url: 'https://kealee.com/opportunities',
    siteName: 'Kealee Marketplace',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kealee Opportunities',
    description: 'Find talent. Build your career. Win contracts. The construction workforce layer of the Kealee platform.',
  },
  keywords: [
    'construction project manager', 'trade apprenticeship programs', 'skilled trades jobs',
    'government construction contracts', 'construction workforce', 'PM marketplace',
    'SAM.gov construction', 'MBE construction', 'DBE contracts', 'construction careers',
  ],
}

const CATEGORIES = [
  {
    icon: '\u{1F4CB}',
    slug: 'pm',
    label: 'Project Management',
    headline: 'Find a PM. Or become one.',
    desc: 'On-demand project managers, embedded PMs, and owner\'s representatives — for every project size. All vetted, all construction-experienced.',
    stat1: { n: 'On-Demand', l: 'PM placement' },
    stat2: { n: 'Licensed', l: 'All PMs verified' },
    cta: 'Browse PM Marketplace',
    color: '#5B2D8E',
  },
  {
    icon: '\u{1F393}',
    slug: 'apprenticeship',
    label: 'Trade Apprenticeship',
    headline: 'Train. Earn. Build a career.',
    desc: 'Registered apprenticeship programs across all construction trades — carpentry, electrical, plumbing, HVAC, pipefitting, masonry, and more. Find your program or sponsor one.',
    stat1: { n: 'RAPIDS', l: 'Registered programs' },
    stat2: { n: 'All Trades', l: 'Disciplines covered' },
    cta: 'Browse Programs',
    color: '#196B5E',
  },
  {
    icon: '\u{1F527}',
    slug: 'trades',
    label: 'Skilled Trades Marketplace',
    headline: 'Find verified trade workers.',
    desc: 'Journeymen, licensed subcontractors, and specialty trade professionals — available for project-based placements. Credential-verified before their profile goes live.',
    stat1: { n: 'Verified', l: 'All credentials checked' },
    stat2: { n: 'All Trades', l: 'Every discipline' },
    cta: 'Find Trade Workers',
    color: '#A84E10',
  },
  {
    icon: '\u{1F3DB}',
    slug: 'procurement',
    label: 'Government Procurement',
    headline: 'Win public sector contracts.',
    desc: 'Federal, state, and municipal construction contracts — tracked in real time. GSA, SHA, MDOT, DC Public Works, and 250+ other jurisdictions. Filtered for set-aside eligibility.',
    stat1: { n: '250+', l: 'Jurisdictions tracked' },
    stat2: { n: 'Set-Asides', l: '8(a), DBE, MBE, SBSA' },
    cta: 'Browse Contracts',
    color: '#1A3A6B',
  },
]

export default function OpportunitiesPage() {
  return (
    <main>
      {/* Hero */}
      <section
        className="px-6 lg:px-20 pt-20 pb-16"
        style={{ background: 'linear-gradient(160deg, #0A0414, #1A0A2E, #2D1060)', color: 'white' }}
      >
        <div className="max-w-7xl mx-auto">
          <div
            className="text-xs font-bold tracking-[3px] uppercase mb-4"
            style={{ color: 'rgba(255,255,255,.35)' }}
          >
            Phase 06 &middot; Kealee Opportunities
          </div>
          <h1
            className="text-5xl lg:text-7xl font-bold leading-[1.05] mb-5"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            Where Construction
            <br />
            <em style={{ color: '#B388FF' }}>Careers Begin.</em>
          </h1>
          <p
            className="text-xl font-light max-w-xl leading-relaxed mb-10"
            style={{ color: 'rgba(255,255,255,.55)' }}
          >
            Project managers, trade apprenticeships, skilled workers, and government contracts —
            all connected to the Kealee platform. Find talent. Build your career. Win contracts.
          </p>
          <div className="flex gap-3 flex-wrap">
            <Link
              href="/opportunities/post"
              className="inline-flex items-center px-7 py-3.5 rounded-lg font-semibold text-[15px]"
              style={{ background: '#5B2D8E', color: 'white' }}
            >
              Post an Opportunity
            </Link>
            <Link
              href="/opportunities/interest"
              className="inline-flex items-center px-7 py-3.5 rounded-lg font-semibold text-[15px]"
              style={{ background: 'rgba(255,255,255,.1)', color: 'white', border: '1.5px solid rgba(255,255,255,.2)' }}
            >
              Join Interest List
            </Link>
          </div>
        </div>
      </section>

      {/* Four category cards */}
      <section className="px-6 lg:px-20 py-20" style={{ background: '#F8F5F0' }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6">
            {CATEGORIES.map((cat) => (
              <div
                key={cat.slug}
                className="bg-white rounded-2xl p-9 flex flex-col"
                style={{ border: '1.5px solid #E5DFD5' }}
              >
                <div className="text-4xl mb-3">{cat.icon}</div>
                <div
                  className="text-[10px] font-bold tracking-[2.5px] uppercase mb-2"
                  style={{ color: cat.color }}
                >
                  {cat.label}
                </div>
                <h2
                  className="text-[28px] font-bold leading-tight mb-3"
                  style={{ fontFamily: "'Cormorant Garamond', serif", color: '#0D1F3C' }}
                >
                  {cat.headline}
                </h2>
                <p className="text-[15px] font-light leading-relaxed flex-1 mb-6" style={{ color: '#7A6E60' }}>
                  {cat.desc}
                </p>
                <div className="flex gap-6 mb-6">
                  <div>
                    <div className="text-base font-semibold font-mono" style={{ color: cat.color }}>
                      {cat.stat1.n}
                    </div>
                    <div className="text-xs" style={{ color: '#A89888' }}>{cat.stat1.l}</div>
                  </div>
                  <div>
                    <div className="text-base font-semibold font-mono" style={{ color: cat.color }}>
                      {cat.stat2.n}
                    </div>
                    <div className="text-xs" style={{ color: '#A89888' }}>{cat.stat2.l}</div>
                  </div>
                </div>
                <Link
                  href={`/opportunities/${cat.slug}`}
                  className="inline-flex items-center self-start px-6 py-3 rounded-lg font-semibold text-sm text-white"
                  style={{ background: cat.color }}
                >
                  {cat.cta} &rarr;
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interest list CTA */}
      <section
        className="px-6 lg:px-20 py-20 text-center"
        style={{ background: 'linear-gradient(135deg, #0A1628, #1A3A6B)' }}
      >
        <div className="max-w-xl mx-auto">
          <h2
            className="text-4xl lg:text-5xl font-bold text-white mb-4"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            Opportunities is Coming in 2026.
          </h2>
          <p
            className="text-[17px] font-light leading-relaxed mb-9"
            style={{ color: 'rgba(255,255,255,.55)' }}
          >
            Join the interest list to be notified first — and get early access to the PM marketplace,
            apprenticeship directory, and government contract tracker before public launch.
          </p>
          <Link
            href="/opportunities/interest"
            className="inline-flex items-center px-10 py-4 rounded-xl font-bold text-base text-white"
            style={{ background: '#5B2D8E' }}
          >
            Join the Interest List &rarr;
          </Link>
        </div>
      </section>
    </main>
  )
}
