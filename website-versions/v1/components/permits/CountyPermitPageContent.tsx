import { PermitFunnel } from '@/components/permits/PermitFunnel'
import { Container } from '@/components/ui/Container'
import { Heading } from '@/components/ui/Heading'
import type { CountyData } from '@/lib/permit-counties'

export function CountyPermitPageContent({ county }: { county: CountyData }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `How long does it take to get a building permit in ${county.shortName}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Simple residential projects: ${county.simpleTimeline}. Additions and structural work: ${county.additionTimeline}. New construction: ${county.newConstructionTimeline}. Commercial/multifamily: ${county.commercialTimeline}.`,
        },
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section
        style={{
          background: 'linear-gradient(135deg, #1A2B4A 0%, #0F1D34 60%, #1A3B3B 100%)',
        }}
        className="py-20 md:py-28"
      >
        <Container width="lg">
          <div className="max-w-3xl">
            <div
              className="inline-block text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full mb-5"
              style={{ backgroundColor: '#2ABFBF20', color: '#2ABFBF' }}
            >
              {county.state} · Permit Guide
            </div>
            <Heading as="h1" size="2xl" color="white" className="mb-5">
              Get Your Permit Approved Faster in {county.name}
            </Heading>
            <p className="text-lg text-gray-300 mb-7 leading-relaxed">
              Most permit delays aren't caused by the jurisdiction — they're caused by incomplete
              submissions. Kealee prepares permit-ready packages that move through{' '}
              {county.shortName} review in fewer cycles.
            </p>
            <ul className="space-y-2 mb-9">
              {[
                `Simple projects: ${county.simpleTimeline} when submitted correctly`,
                'One clean cycle vs. 2–4 revision rounds',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-gray-200">
                  <svg
                    className="w-5 h-5 mt-0.5 flex-shrink-0"
                    style={{ color: '#2ABFBF' }}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
            <a
              href="#start-permit"
              className="inline-block px-8 py-4 rounded-xl font-bold text-white text-base transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#E8793A' }}
            >
              Get Permits →
            </a>
          </div>
        </Container>
      </section>

      {/* ── Real Answer: How Long Does It Actually Take? ───────────────── */}
      <section className="py-16 bg-white">
        <Container width="lg">
          <div className="max-w-3xl mx-auto">
            <Heading as="h2" size="lg" color="navy" className="mb-2">
              How Long Does It Actually Take?
            </Heading>
            <p className="text-gray-500 mb-7">
              Real timelines for {county.shortName} — not what the county website says, but what
              permit applicants actually experience.
            </p>
            <div className="rounded-2xl border border-gray-100 overflow-hidden mb-7">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: '#1A2B4A' }}>
                    <th className="px-5 py-3 text-left font-semibold text-white">Project Type</th>
                    <th className="px-5 py-3 text-left font-semibold text-white">Typical Timeline</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: 'Simple residential (remodel, deck, fence)', time: county.simpleTimeline },
                    { label: 'Addition or structural renovation', time: county.additionTimeline },
                    { label: 'New construction', time: county.newConstructionTimeline },
                    { label: 'Commercial / multifamily', time: county.commercialTimeline },
                  ].map((row, i) => (
                    <tr
                      key={row.label}
                      style={{ backgroundColor: i % 2 === 0 ? '#FAFAFA' : '#FFFFFF' }}
                    >
                      <td className="px-5 py-3.5 text-gray-700">{row.label}</td>
                      <td className="px-5 py-3.5 font-semibold" style={{ color: '#1A2B4A' }}>
                        {row.time}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div
              className="rounded-xl p-5 border-l-4"
              style={{ backgroundColor: '#FFF8F5', borderColor: '#E8793A' }}
            >
              <p className="text-sm font-semibold mb-1" style={{ color: '#E8793A' }}>
                The truth:
              </p>
              <p className="text-gray-700 text-sm leading-relaxed">
                These timelines assume a complete, correct submission on the first try. Most
                applicants experience 2–4 revision cycles that multiply total time by 2–3x.{' '}
                {county.jurisdictionNote}
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* ── Why Permits Get Delayed ────────────────────────────────────── */}
      <section className="py-16" style={{ backgroundColor: '#F8FAFC' }}>
        <Container width="lg">
          <div className="max-w-3xl mx-auto">
            <Heading as="h2" size="lg" color="navy" className="mb-2">
              Why Permits Get Delayed in {county.shortName}
            </Heading>
            <p className="text-gray-500 mb-8">
              The three most common reasons applicants end up in revision cycles
            </p>
            <div className="space-y-4">
              {county.topDelays.map((delay, i) => (
                <div
                  key={delay.title}
                  className="flex gap-5 bg-white rounded-2xl p-6 border border-gray-100"
                >
                  <div
                    className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-sm"
                    style={{ backgroundColor: '#1A2B4A' }}
                  >
                    {i + 1}
                  </div>
                  <div>
                    <p className="font-semibold mb-1" style={{ color: '#1A2B4A' }}>
                      {delay.title}
                    </p>
                    <p className="text-gray-600 text-sm leading-relaxed">{delay.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* ── What Kealee Does Differently ──────────────────────────────── */}
      <section className="py-16 bg-white">
        <Container width="lg">
          <div className="max-w-3xl mx-auto">
            <Heading as="h2" size="lg" color="navy" className="mb-2">
              What Kealee Does Differently
            </Heading>
            <p className="text-gray-500 mb-8">
              We don't just file your permit — we engineer the submission for first-cycle approval
            </p>
            <ul className="space-y-4 mb-8">
              {[
                {
                  title: 'Jurisdiction-specific plan review',
                  desc: `We know ${county.shortName}'s checklists, common rejection reasons, and reviewer expectations before your plans leave our desk.`,
                },
                {
                  title: 'Permit-ready drawings',
                  desc: 'Every package includes correct stamped drawings, required notes, and the documentation reviewers need to approve on first review.',
                },
                {
                  title: 'Zoning pre-check',
                  desc: 'We verify setbacks, FAR, height limits, and overlay requirements before submission — not after the first rejection.',
                },
                {
                  title: 'Revision management',
                  desc: 'If corrections are required, we handle the response and resubmission. No back-and-forth on your end.',
                },
              ].map((item) => (
                <li key={item.title} className="flex gap-4">
                  <svg
                    className="w-5 h-5 mt-0.5 flex-shrink-0"
                    style={{ color: '#2ABFBF' }}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div>
                    <span className="font-semibold" style={{ color: '#1A2B4A' }}>
                      {item.title}
                    </span>
                    <span className="text-gray-600"> — {item.desc}</span>
                  </div>
                </li>
              ))}
            </ul>
            <div
              className="rounded-xl px-6 py-4 inline-block"
              style={{ backgroundColor: '#F0FAFA', border: '1px solid #2ABFBF40' }}
            >
              <p className="font-semibold text-sm" style={{ color: '#1A2B4A' }}>
                Goal: 1 clean approval cycle.{' '}
                <span className="font-normal text-gray-600">
                  No revision rounds, no re-submission fees, no wasted months.
                </span>
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* ── Mid-Page CTA ──────────────────────────────────────────────── */}
      <section className="py-14" style={{ backgroundColor: '#1A2B4A' }}>
        <Container width="lg">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <ul className="space-y-3 flex-1">
              {[
                `Permit strategy within 48 hours for ${county.shortName} projects`,
                'Permit-ready package — no revision cycles',
                'We manage submission start to approval',
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-white">
                  <svg
                    className="w-5 h-5 flex-shrink-0"
                    style={{ color: '#2ABFBF' }}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-sm font-medium">{item}</span>
                </li>
              ))}
            </ul>
            <a
              href="#start-permit"
              className="flex-shrink-0 px-8 py-4 rounded-xl font-bold text-white text-base transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#E8793A' }}
            >
              Start My Permit →
            </a>
          </div>
        </Container>
      </section>

      {/* ── Process ───────────────────────────────────────────────────── */}
      <section className="py-16 bg-white">
        <Container width="lg">
          <Heading as="h2" size="lg" color="navy" className="text-center mb-3">
            How It Works
          </Heading>
          <p className="text-center text-gray-500 mb-10 max-w-xl mx-auto">
            Three steps from your project idea to a permit approval
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                num: '01',
                title: 'Answer 3 Questions',
                desc: "Tell us what you're building, where, and whether you have plans. Takes under 2 minutes.",
              },
              {
                num: '02',
                title: 'Receive Concept + Strategy',
                desc: 'Within 48 hours, you get a permit strategy, preliminary concept, and a fixed-price quote.',
              },
              {
                num: '03',
                title: 'Kealee Submits + Manages',
                desc: `We prepare your permit package and manage the ${county.shortName} submission from start to approval.`,
              },
            ].map((step) => (
              <div
                key={step.num}
                className="rounded-2xl p-7 border border-gray-100"
                style={{ backgroundColor: '#FAFAFA' }}
              >
                <div
                  className="text-3xl font-bold mb-4"
                  style={{ color: '#2ABFBF' }}
                >
                  {step.num}
                </div>
                <h3 className="font-bold mb-2" style={{ color: '#1A2B4A' }}>
                  {step.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ── Trust Section ─────────────────────────────────────────────── */}
      <section className="py-14" style={{ backgroundColor: '#F8FAFC' }}>
        <Container width="lg">
          <div className="text-center mb-10">
            <Heading as="h2" size="md" color="navy">
              Hundreds of permits across DC, MD, VA
            </Heading>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { stat: '7', label: 'Jurisdictions served' },
              { stat: '1-cycle', label: 'Approval rate (most projects)' },
              { stat: '48 hrs', label: 'Estimate turnaround' },
              { stat: 'DC · MD · VA', label: 'Coverage area' },
            ].map((item) => (
              <div key={item.label} className="bg-white rounded-xl p-5 border border-gray-100">
                <div className="text-2xl font-bold mb-1" style={{ color: '#2ABFBF' }}>
                  {item.stat}
                </div>
                <div className="text-xs text-gray-500">{item.label}</div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ── Funnel Section ────────────────────────────────────────────── */}
      <section id="start-permit" className="py-20" style={{ backgroundColor: '#F1F5F9' }}>
        <Container width="md">
          <div className="text-center mb-10">
            <Heading as="h2" size="lg" color="navy" className="mb-3">
              Start Your {county.shortName} Permit Application
            </Heading>
            <p className="text-gray-500">
              Tell us what you're building — we'll send a strategy + pricing within 48 hours
            </p>
          </div>
          <PermitFunnel countySlug={county.slug} />
        </Container>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────────── */}
      <section className="py-16" style={{ backgroundColor: '#E8793A' }}>
        <Container width="lg">
          <div className="text-center">
            <Heading as="h2" size="lg" color="white" className="mb-3">
              Ready to move forward?
            </Heading>
            <p className="text-white/80 mb-8 max-w-xl mx-auto">
              Don't wait out another revision cycle. Get a permit-ready package the first time.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="#start-permit"
                className="px-8 py-4 rounded-xl font-bold text-white border-2 border-white transition-colors hover:bg-white hover:text-orange-500"
              >
                Start My Permit →
              </a>
              <a
                href="mailto:permits@kealee.com"
                className="px-8 py-4 rounded-xl font-bold transition-colors hover:bg-white/10"
                style={{ color: 'white', border: '2px solid rgba(255,255,255,0.5)' }}
              >
                Email Us
              </a>
            </div>
          </div>
        </Container>
      </section>
    </>
  )
}
