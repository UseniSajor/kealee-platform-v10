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
              sends you back to the end of the queue. Kealee&apos;s AI reviews your package before
              submission, engineered for first-cycle approval.
            </p>
          </div>
        </Container>
      </section>

      {/* ── Pricing Tiers ─────────────────────────────────────────────── */}
      <section className="py-16" style={{ backgroundColor: '#F5F4F0' }}>
        <Container width="lg">
          <div className="mb-10 text-center">
            <span className="section-label">Permit Pricing</span>
            <Heading as="h2" size="md" color="navy" className="mt-3 mb-4">
              Pick your permit package
            </Heading>
            <p className="text-gray-500 max-w-xl mx-auto">
              All packages include AI pre-submission review. Choose based on how much of your project scope is already defined.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            {[
              {
                name: 'Permit Path Only',
                price: '$149',
                desc: 'Document prep and jurisdiction filing. You provide the drawings.',
                features: ['AI document review', 'Jurisdiction filing', 'Comment response support', 'DC / MD / VA coverage'],
                cta: 'Start filing',
                href: '/intake/permit_path_only',
                accent: '#2ABFBF',
              },
              {
                name: 'Full Permit Package',
                price: '$585',
                desc: 'AI concept design + permit-ready package. Start from scratch.',
                features: ['AI concept visuals', 'Cost band estimate', 'Permit-ready package', 'Filing + comment response'],
                cta: 'Get full package',
                href: '/concept',
                accent: '#C8521A',
                highlight: true,
              },
              {
                name: 'Developer Permits',
                price: '$1,999+',
                desc: 'Multi-unit, commercial, and complex mixed-use projects.',
                features: ['Multi-unit support', 'Commercial code review', 'Entitlement coordination', 'Dedicated permit manager'],
                cta: 'Schedule consult',
                href: '/contact',
                accent: '#1A2B4A',
              },
            ].map(tier => (
              <div
                key={tier.name}
                className="flex flex-col rounded-2xl bg-white p-6"
                style={{ border: tier.highlight ? '2px solid #C8521A' : '1px solid #E2E1DC' }}
              >
                {tier.highlight && (
                  <span
                    className="mb-3 self-start rounded-full px-3 py-1 text-xs font-semibold text-white"
                    style={{ background: '#C8521A' }}
                  >
                    Most Popular
                  </span>
                )}
                <h3 className="font-bold font-display text-lg" style={{ color: '#1A1C1B' }}>{tier.name}</h3>
                <p className="mt-1 text-2xl font-bold" style={{ color: tier.accent }}>{tier.price}</p>
                <p className="mt-2 text-sm text-gray-500">{tier.desc}</p>
                <ul className="my-5 flex-1 space-y-2">
                  {tier.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                      <span style={{ color: tier.accent }}>✓</span> {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={tier.href}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ background: tier.accent }}
                >
                  {tier.cta} →
                </Link>
              </div>
            ))}
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

      {/* ── Nationwide CTA strip ──────────────────────────────────────── */}
      <section className="py-10 border-t border-gray-100 bg-white">
        <Container width="lg">
          <div className="flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
            <div>
              <p className="font-semibold" style={{ color: '#1A1C1B' }}>
                Don&apos;t see your county?
              </p>
              <p className="text-sm text-gray-500">We file nationwide. Tell us your jurisdiction and we&apos;ll confirm coverage within 24 hours.</p>
            </div>
            <Link
              href="/contact"
              className="flex-shrink-0 rounded-xl px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: '#C8521A' }}
            >
              Contact us →
            </Link>
          </div>
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
