import type { Metadata } from 'next'
import Link from 'next/link'
import { COUNTIES } from '@/lib/permit-counties'
import { Container } from '@/components/ui/Container'
import { Heading } from '@/components/ui/Heading'

export const metadata: Metadata = {
  title: 'Building Permit Services | DC, MD, VA | Kealee Permit Group',
  description:
    'Real building permit timelines for DC, MD, and VA jurisdictions. Kealee prepares permit-ready packages that move through plan review in fewer cycles.',
}

const STATE_LABELS: Record<string, string> = {
  VA: 'Virginia',
  MD: 'Maryland',
  DC: 'Washington DC',
}

export default function PermitsHubPage() {
  const byState = COUNTIES.reduce<Record<string, typeof COUNTIES>>((acc, c) => {
    const key = c.state
    if (!acc[key]) acc[key] = []
    acc[key].push(c)
    return acc
  }, {})

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section
        style={{
          background: 'linear-gradient(135deg, #1A2B4A 0%, #0F1D34 60%, #1A3B3B 100%)',
        }}
        className="py-20 md:py-28"
      >
        <Container width="lg">
          <div className="max-w-2xl">
            <div
              className="inline-block text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full mb-5"
              style={{ backgroundColor: '#2ABFBF20', color: '#2ABFBF' }}
            >
              Permit Services
            </div>
            <Heading as="h1" size="xl" color="white" className="mb-5">
              Building Permit Services for DC, MD &amp; VA
            </Heading>
            <p className="text-lg text-gray-300 leading-relaxed mb-8">
              Real permit timelines, common delay causes, and a smarter way to get approved — for
              every jurisdiction we serve.
            </p>
            <a
              href="#jurisdictions"
              className="inline-block px-7 py-3.5 rounded-xl font-bold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#E8793A' }}
            >
              Select Your Jurisdiction →
            </a>
          </div>
        </Container>
      </section>

      {/* ── Intro ─────────────────────────────────────────────────────── */}
      <section className="py-14 bg-white">
        <Container width="lg">
          <div className="max-w-3xl mx-auto text-center">
            <Heading as="h2" size="md" color="navy" className="mb-4">
              Why Permits Take Longer Than They Should
            </Heading>
            <p className="text-gray-600 leading-relaxed">
              Most permit delays aren't caused by the jurisdiction — they're caused by incomplete
              submissions. A single missing note, incorrect setback dimension, or unstamped drawing
              sends you back to the end of the queue. Kealee prepares permit-ready packages
              engineered for first-cycle approval.
            </p>
          </div>
        </Container>
      </section>

      {/* ── County Grid ───────────────────────────────────────────────── */}
      <section id="jurisdictions" className="py-16" style={{ backgroundColor: '#F8FAFC' }}>
        <Container width="xl">
          <Heading as="h2" size="lg" color="navy" className="text-center mb-3">
            Choose Your Jurisdiction
          </Heading>
          <p className="text-center text-gray-500 mb-12 max-w-xl mx-auto">
            Select a county or city below to see real permit timelines, common delay causes, and
            how Kealee can help
          </p>

          {Object.entries(byState).map(([stateCode, counties]) => (
            <div key={stateCode} className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <div
                  className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-white"
                  style={{ backgroundColor: '#1A2B4A' }}
                >
                  {stateCode}
                </div>
                <h3 className="font-semibold text-gray-700">{STATE_LABELS[stateCode] || stateCode}</h3>
                <div className="flex-1 h-px bg-gray-200" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {counties.map((county) => (
                  <Link
                    key={county.slug}
                    href={`/permits/${county.slug}`}
                    className="group bg-white rounded-2xl border border-gray-100 p-6 transition-all hover:shadow-md hover:border-teal-200"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <p className="font-bold text-base" style={{ color: '#1A2B4A' }}>
                          {county.shortName}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">{county.name}</p>
                      </div>
                      <svg
                        className="w-5 h-5 flex-shrink-0 mt-0.5 transition-transform group-hover:translate-x-1"
                        style={{ color: '#2ABFBF' }}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                    <div className="space-y-1.5 mb-4">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Simple project</span>
                        <span className="font-semibold" style={{ color: '#1A2B4A' }}>
                          {county.simpleTimeline}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Addition</span>
                        <span className="font-semibold" style={{ color: '#1A2B4A' }}>
                          {county.additionTimeline}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">New construction</span>
                        <span className="font-semibold" style={{ color: '#1A2B4A' }}>
                          {county.newConstructionTimeline}
                        </span>
                      </div>
                    </div>
                    {county.portalName && (
                      <div
                        className="inline-block text-xs px-2.5 py-1 rounded-full font-medium"
                        style={{ backgroundColor: '#F0FAFA', color: '#2ABFBF' }}
                      >
                        {county.portalName}
                      </div>
                    )}
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <span
                        className="text-xs font-semibold group-hover:underline"
                        style={{ color: '#2ABFBF' }}
                      >
                        View timelines →
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </Container>
      </section>

      {/* ── Bottom CTA ────────────────────────────────────────────────── */}
      <section className="py-16" style={{ backgroundColor: '#1A2B4A' }}>
        <Container width="lg">
          <div className="text-center">
            <Heading as="h2" size="lg" color="white" className="mb-4">
              Not sure which jurisdiction applies to your project?
            </Heading>
            <p className="text-gray-300 mb-8 max-w-xl mx-auto">
              City vs. county boundaries trip up applicants constantly. Email us your project
              address and we'll confirm the right jurisdiction within 24 hours.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:permits@kealee.com"
                className="px-8 py-4 rounded-xl font-bold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: '#E8793A' }}
              >
                Email permits@kealee.com
              </a>
              <a
                href="/contact"
                className="px-8 py-4 rounded-xl font-bold border-2 border-gray-500 text-gray-300 transition-colors hover:border-white hover:text-white"
              >
                Contact Us
              </a>
            </div>
          </div>
        </Container>
      </section>
    </>
  )
}
