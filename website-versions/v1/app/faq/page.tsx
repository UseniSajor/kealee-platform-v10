import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { AskAnythingBar } from '@/components/ui/AskAnythingBar'

export const metadata: Metadata = {
  title: 'FAQ — Kealee',
  description: 'Frequently asked questions about the Kealee platform — AI concept design, contractor marketplace, escrow payments, and more.',
}

const SECTIONS = [
  {
    title: 'AI Concept Engine',
    color: '#E8793A',
    questions: [
      {
        q: 'What is the AI Concept Engine?',
        a: 'The Kealee AI Concept Engine delivers property-specific design concepts for your renovation, addition, garden, or development project. Submit your address and goals — we analyze your specific property and deliver 3 design concept options in 5–7 business days, along with a 30-minute consultation call.',
      },
      {
        q: 'What is the difference between an AI concept and architectural services?',
        a: 'An AI concept is a pre-design visualization service. It shows you what your project could look like — renderings, layout direction, material palettes, and a rough cost range — before you commit to anything. Architectural services produce permit-ready, stamped drawings that contractors can legally build from. The AI concept is a planning and visualization tool; architectural drawings are required to pull a permit and begin construction.',
      },
      {
        q: 'Can an AI concept package get me a permit?',
        a: 'No. AI concept packages are pre-design services only. They are not permit-ready plans. Most jurisdictions require architect-stamped or engineer-stamped drawings to obtain a building permit. If you need permit-ready plans, see our Design Services page.',
      },
      {
        q: 'When do I need permit-ready plans?',
        a: 'You need permit-ready plans whenever you plan to pull a building permit — which is required for structural changes, additions, ADUs, new construction, and most work that affects the building envelope or mechanical systems. AI concepts help you decide what you want before investing in full architectural drawings.',
      },
      {
        q: 'Can I use existing plans for permit services?',
        a: 'Yes. If you already have architect-stamped or engineer-stamped drawings, our permit service team can prepare and submit your permit application directly without needing to create new plans.',
      },
      {
        q: 'What if I don\'t have plans yet?',
        a: 'Start with an AI concept package to clarify your vision, then move to our Design Services for permit-ready architectural drawings. Our team can coordinate the full sequence — concept → design → permit — so nothing falls through the cracks.',
      },
      {
        q: 'What happens after the AI concept?',
        a: 'After receiving your concept package, you have several options: (1) use it to get contractor bids for non-permit work; (2) move to Design Services for permit-ready plans; (3) use it to match with a contractor through our Marketplace. Your consultation call covers next steps for your specific project.',
      },
      {
        q: 'How much does an AI concept package cost?',
        a: 'Exterior, garden, and interior reno concept packages start at $395. Whole home and developer concept packages start at $585. Advanced tiers with more revision rounds and detailed drawings are also available.',
      },
      {
        q: 'What is included in a concept package?',
        a: 'Every package includes 3 property-specific concept options, a design direction summary, layout recommendations, a zoning/permit brief, rough cost direction, a downloadable digital package, and a 30-minute design consultation call.',
      },
      {
        q: 'How long does delivery take?',
        a: 'Standard delivery is 5–7 business days from intake submission. Rush delivery options are available — contact us to discuss.',
      },
      {
        q: 'How many revision rounds are included?',
        a: 'The base AI Concept Package includes 1 feedback round with 3 concept options. Advanced packages include up to 3 rounds, and full design packages include up to 5 rounds.',
      },
      {
        q: 'Is the concept package done by AI or a human designer?',
        a: 'Concepts are generated using our AI design system trained on thousands of residential and commercial projects, then reviewed by our design team before delivery. You work with a real person on consultation and feedback rounds.',
      },
    ],
  },
  {
    title: 'Contractor Marketplace',
    color: '#2ABFBF',
    questions: [
      {
        q: 'How does the contractor marketplace work?',
        a: 'Kealee matches homeowners and developers with verified, background-checked contractors in their area. You describe your project, we surface matched contractors, and you review profiles and request bids — all within the platform.',
      },
      {
        q: 'How are contractors verified?',
        a: 'Every contractor in our network undergoes license verification, insurance confirmation, and background screening. We also collect and display verified project reviews.',
      },
      {
        q: 'How does Kealee screen contractors?',
        a: 'Our contractor network is screened for active state licensing, liability insurance, and project fit. We verify license status through state contractor boards, confirm insurance certificates directly, and review experience against your project type. Contractors who do not meet our standards are not admitted to the network.',
      },
      {
        q: 'How do I join as a GC, builder, or contractor?',
        a: 'Visit /contractor/register and complete the application. Our team reviews your license, insurance, and experience, and if approved, you will start receiving matched project opportunities.',
      },
      {
        q: 'Is there a fee to use the marketplace?',
        a: 'Browsing the marketplace is free. Contractors pay a platform fee on completed projects. Homeowners pay a small matching fee when they connect with contractors for bids.',
      },
    ],
  },
  {
    title: 'Escrow Payments',
    color: '#38A169',
    questions: [
      {
        q: 'How do escrow payments work?',
        a: 'Kealee uses milestone-based escrow payments. Funds are held securely and released to your contractor only when you approve each project milestone. This protects you as a homeowner while giving contractors confidence in payment.',
      },
      {
        q: 'What does milestone pay / escrow protect?',
        a: 'Milestone-based escrow protects you from overpaying for incomplete work. Funds are held by a neutral third party and only released when you approve a completed milestone — such as framing inspection passing, rough-in complete, or final punch list signed. This means contractors are motivated to complete each phase on time, and you are never left paying for work that was not done.',
      },
      {
        q: 'What happens if I have a dispute with my contractor?',
        a: 'Kealee provides a dispute resolution process for escrowed payments. Funds are held during the resolution period and only released once both parties reach agreement or the dispute is resolved through our process.',
      },
      {
        q: 'Are my payment details secure?',
        a: 'Yes. All payment processing is handled by Stripe, which is PCI DSS Level 1 certified. Kealee never stores your card details directly.',
      },
    ],
  },
  {
    title: 'Owner & Developer Portals',
    color: '#1A2B4A',
    questions: [
      {
        q: 'What is the Owner Portal?',
        a: 'The Owner Portal gives homeowners a dashboard to track their project progress, approve payments at each milestone, message their contractor and team, and review project documents — all in one place.',
      },
      {
        q: 'What is the Developer Portal?',
        a: 'The Developer Portal is a full project and portfolio management platform for developers. It includes land intelligence, feasibility pro formas, capital stack tracking, draw management, Digital Development Twin System (DDTS) access, and multi-project reporting.',
      },
      {
        q: 'What is the Contractor Portal?',
        a: 'The Contractor Portal is a construction OS for GCs and specialty contractors. It includes schedule management, RFI tracking, punch lists, crew communication, and milestone payment management.',
      },
      {
        q: 'How do I access my portal?',
        a: 'Log in at /login. If you don\'t yet have an account, you can register as a homeowner through the intake process, as a contractor at /contractor/register, or contact us to set up a developer account.',
      },
    ],
  },
  {
    title: 'Platform & Pricing',
    color: '#7C3AED',
    questions: [
      {
        q: 'Is Kealee available nationwide?',
        a: 'AI Concept Engine services are available nationwide. The contractor marketplace is currently focused on the DC–Baltimore Corridor and expanding to additional markets. Contact us to check availability in your area.',
      },
      {
        q: 'Where can I see full pricing?',
        a: 'Visit /pricing for a full breakdown of AI concept packages, marketplace fees, and portal subscription tiers.',
      },
      {
        q: 'How do I contact Kealee support?',
        a: 'Visit /contact to reach our team. We respond to all inquiries within 1 business day.',
      },
    ],
  },
]

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="border-b border-gray-100 py-16" style={{ backgroundColor: '#F7FAFC' }}>
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <span
            className="inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest"
            style={{ backgroundColor: 'rgba(232,121,58,0.1)', color: '#E8793A' }}
          >
            FAQ
          </span>
          <h1 className="mt-4 text-4xl font-bold font-display" style={{ color: '#1A2B4A' }}>
            Frequently Asked Questions
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Everything you need to know about the Kealee platform.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm">
            {SECTIONS.map(s => (
              <a
                key={s.title}
                href={`#${s.title.toLowerCase().replace(/[^a-z]+/g, '-')}`}
                className="rounded-full border border-gray-200 bg-white px-4 py-1.5 font-medium text-gray-600 transition-colors hover:border-gray-300 hover:text-gray-900"
              >
                {s.title}
              </a>
            ))}
          </div>

          {/* Ask bar */}
          <div className="mt-8 mx-auto max-w-xl">
            <div className="rounded-2xl p-4" style={{ backgroundColor: '#1A2B4A' }}>
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-white/50 text-center">
                Can&apos;t find your answer? Ask anything
              </p>
              <AskAnythingBar context="default" />
            </div>
          </div>
        </div>
      </section>

      {/* FAQ sections */}
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 space-y-16">
        {SECTIONS.map(section => (
          <div key={section.title} id={section.title.toLowerCase().replace(/[^a-z]+/g, '-')}>
            <div className="mb-6 flex items-center gap-3">
              <div className="h-1 w-8 rounded-full" style={{ backgroundColor: section.color }} />
              <h2 className="text-xl font-bold font-display" style={{ color: '#1A2B4A' }}>{section.title}</h2>
            </div>
            <div className="space-y-4">
              {section.questions.map(qa => (
                <details
                  key={qa.q}
                  className="group rounded-xl border border-gray-200 bg-white"
                >
                  <summary className="flex cursor-pointer items-center justify-between gap-4 px-6 py-4 text-sm font-semibold select-none" style={{ color: '#1A2B4A' }}>
                    {qa.q}
                    <span
                      className="shrink-0 rounded-full p-1 text-gray-400 transition-colors group-open:rotate-45"
                      style={{ transition: 'transform 200ms' }}
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </span>
                  </summary>
                  <div className="border-t border-gray-100 px-6 py-4">
                    <p className="text-sm text-gray-600 leading-relaxed">{qa.a}</p>
                  </div>
                </details>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <section className="border-t border-gray-100 py-16" style={{ backgroundColor: '#F7FAFC' }}>
        <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
          <h2 className="text-2xl font-bold font-display" style={{ color: '#1A2B4A' }}>Still have questions?</h2>
          <p className="mt-3 text-gray-600">Our team responds to all inquiries within 1 business day.</p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#E8793A' }}
            >
              Contact Us <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/get-started"
              className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 transition-colors hover:border-gray-400 hover:text-gray-900"
            >
              Get Started
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
