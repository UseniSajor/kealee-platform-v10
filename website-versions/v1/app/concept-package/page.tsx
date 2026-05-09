import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, CheckCircle, Clock, FileText, Eye, MapPin, Layers, Route, Ruler, Package, Video } from 'lucide-react'

export const metadata: Metadata = {
  title: 'AI Concept Design Package — $585 | Kealee',
  description:
    'A structured, property-specific design concept that gives you clear visual direction, layout thinking, and a defined path toward permitting and construction. Delivered by Kealee.',
}

const DELIVERABLES = [
  {
    icon: Eye,
    number: '01',
    title: 'Exterior + Interior Concept Visuals',
    subtitle: '3 concept options, 1 round of feedback included',
    items: [
      'AI-generated concepts based on your specific property',
      'Style-driven variations — modern, transitional, luxury, farmhouse, and more',
      'Facade, materials, and architectural form exploration',
      'Optional landscape concepts where applicable',
    ],
    callout: 'This is the "see it" moment — visual proof your project is real.',
  },
  {
    icon: FileText,
    number: '02',
    title: 'Design Direction Summary',
    subtitle: 'Written design narrative + material guidance',
    items: [
      'Overall design vision and concept narrative',
      'Architectural style direction and language',
      'Material recommendations (siding, finishes, textures)',
      'Color palette guidance',
    ],
    callout: 'This tells you exactly what you\'re building — not just what it could look like.',
  },
  {
    icon: Layers,
    number: '03',
    title: 'Layout & Flow Recommendations',
    subtitle: 'For renovation, addition, and remodel projects',
    items: [
      'Suggested layout improvements based on your goals',
      'Room flow and functional upgrade ideas',
      'Space optimization and efficiency review',
      'High-level structural change considerations',
    ],
    callout: 'Where the real value shows up for remodel and addition clients.',
  },
  {
    icon: MapPin,
    number: '04',
    title: 'Property-Based Analysis',
    subtitle: 'Light feasibility using your actual address + photos',
    items: [
      'Observations based on your property and uploaded photos',
      'Buildability considerations at a high level',
      'Zoning brief — linked to your city and county zoning resources',
      'Key constraints to be aware of (setbacks, structure, etc.)',
    ],
    callout: 'This is what separates Kealee from generic AI tools — we analyze your actual property.',
  },
  {
    icon: Route,
    number: '05',
    title: '"Path to Approval" Plan',
    subtitle: 'Your step-by-step roadmap from concept to build',
    items: [
      'Concept → design development → permitting → construction',
      'What permits are required for your project type',
      'What professionals you\'ll need (architect, structural engineer, etc.)',
      'Timeline expectations by phase',
    ],
    callout: 'This bridges directly into the next revenue step — design, permits, or build.',
  },
  {
    icon: Ruler,
    number: '06',
    title: 'Rough Scope Direction',
    subtitle: 'High-level scope + early cost direction',
    items: [
      'High-level scope of work overview',
      'Key systems and areas involved',
      'Early cost direction ranges (not a formal estimate)',
      'What\'s driving cost and complexity',
    ],
    callout: 'Helps you understand scale before committing to anything further.',
  },
  {
    icon: Package,
    number: '07',
    title: 'Delivered Digital Concept Package',
    subtitle: 'PDF / presentation-style deliverable',
    items: [
      'Professionally organized deliverable',
      'Downloadable and easy to review',
      'Shareable with contractors, architects, and lenders',
      'Everything in one place — no scattered documents',
    ],
    callout: 'A polished package you can bring into any professional conversation.',
  },
  {
    icon: Video,
    number: '08',
    title: 'Included Design Consultation',
    subtitle: 'Scheduled after delivery — video call to review your concept',
    items: [
      'Walk through your concept together (Zoom, Google Meet, or Zoho)',
      'Review every design decision in context',
      'Refine direction based on your feedback',
      'Map out clear next steps specific to your project',
    ],
    callout: 'Included as part of your package — not sold separately.',
    isBonus: true,
  },
]

const NEXT_STEPS = [
  { step: '1', label: 'Submit your project details', desc: 'Complete the quick intake form with photos and your project goals.' },
  { step: '2', label: 'We generate your concept package', desc: 'Our AI analyzes your property, style preferences, and project type.' },
  { step: '3', label: 'You receive your full design concept', desc: 'Delivered to your inbox and accessible in your Kealee portal.' },
  { step: '4', label: 'We schedule your included consultation', desc: 'A Kealee design consultant reviews the package with you on video.' },
  { step: '5', label: 'Move into design, permits, or build', desc: 'Your concept becomes the foundation for every next step.' },
]

export default function ConceptPackagePage() {
  return (
    <div className="bg-white">
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="border-b border-gray-100 py-20" style={{ backgroundColor: '#F7FAFC' }}>
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <span
            className="inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest"
            style={{ backgroundColor: '#FFF3EC', color: '#E8793A' }}
          >
            Design + Build Readiness
          </span>
          <h1 className="mt-4 text-4xl font-bold leading-tight sm:text-5xl" style={{ color: '#1A2B4A' }}>
            AI Concept Design Package
          </h1>
          <p className="mt-5 text-xl font-semibold" style={{ color: '#E8793A' }}>
            $585
          </p>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            A structured, property-specific design concept that gives you clear visual direction,
            layout thinking, and a defined path toward permitting and construction.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/intake/exterior_concept"
              className="inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-base font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#E8793A' }}
            >
              Get My Concept Package <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/intake"
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-7 py-3.5 text-base font-semibold text-gray-700 transition-colors hover:border-gray-300"
            >
              See All Project Types
            </Link>
          </div>

          {/* Trust signals */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4 text-green-500" /> Property-specific analysis
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-green-500" /> Delivered in 2–5 business days
            </span>
            <span className="flex items-center gap-1.5">
              <Video className="h-4 w-4 text-green-500" /> Consultation included
            </span>
          </div>
        </div>
      </section>

      {/* ── Deliverables ──────────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-2xl font-bold sm:text-3xl" style={{ color: '#1A2B4A' }}>
              What&apos;s included in your package
            </h2>
            <p className="mt-3 text-gray-500">
              Eight structured deliverables — not generic AI outputs. Built around your property.
            </p>
          </div>

          <div className="space-y-6">
            {DELIVERABLES.map((d) => (
              <div
                key={d.number}
                className={`overflow-hidden rounded-2xl border ${d.isBonus ? 'border-[#2ABFBF]' : 'border-gray-200'} bg-white`}
              >
                <div className={`flex items-start gap-4 p-6 ${d.isBonus ? 'bg-teal-50/40' : ''}`}>
                  {/* Number + icon */}
                  <div className="shrink-0">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-xl"
                      style={{ backgroundColor: d.isBonus ? '#2ABFBF' : '#1A2B4A' }}
                    >
                      <d.icon className="h-5 w-5 text-white" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-400">{d.number}</span>
                          {d.isBonus && (
                            <span
                              className="rounded-full px-2 py-0.5 text-xs font-semibold text-white"
                              style={{ backgroundColor: '#2ABFBF' }}
                            >
                              Included Bonus
                            </span>
                          )}
                        </div>
                        <h3 className="mt-0.5 text-lg font-bold" style={{ color: '#1A2B4A' }}>
                          {d.title}
                        </h3>
                        <p className="text-sm text-gray-500">{d.subtitle}</p>
                      </div>
                    </div>

                    <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                      {d.items.map((item) => (
                        <li key={item} className="flex items-start gap-2 text-sm text-gray-700">
                          <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                          {item}
                        </li>
                      ))}
                    </ul>

                    <div
                      className="mt-4 rounded-lg px-4 py-2.5 text-sm font-medium"
                      style={{ backgroundColor: 'rgba(232,121,58,0.06)', color: '#C05621' }}
                    >
                      {d.callout}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Priority Add-On ────────────────────────────────────────────────── */}
      <section className="py-12 border-y border-gray-100" style={{ backgroundColor: '#F7FAFC' }}>
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-dashed border-gray-300 bg-white p-6">
            <div>
              <span
                className="text-xs font-bold uppercase tracking-widest"
                style={{ color: '#E8793A' }}
              >
                Optional Add-On
              </span>
              <h3 className="mt-1 text-lg font-bold" style={{ color: '#1A2B4A' }}>
                Priority Turnaround
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Upgrade for faster delivery — your concept package delivered in 24–48 hours instead of the standard timeline.
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-2xl font-bold" style={{ color: '#E8793A' }}>+$195</p>
              <p className="text-xs text-gray-400">24–48 hr delivery</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── What Happens Next ─────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-bold sm:text-3xl" style={{ color: '#1A2B4A' }}>
              What happens after you order
            </h2>
          </div>
          <div className="relative">
            {/* Connector line */}
            <div className="absolute left-5 top-6 bottom-6 w-0.5 bg-gray-100 hidden sm:block" />
            <div className="space-y-6">
              {NEXT_STEPS.map((s) => (
                <div key={s.step} className="flex gap-5">
                  <div
                    className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                    style={{ backgroundColor: '#1A2B4A' }}
                  >
                    {s.step}
                  </div>
                  <div className="pt-1.5">
                    <p className="font-semibold" style={{ color: '#1A2B4A' }}>{s.label}</p>
                    <p className="mt-0.5 text-sm text-gray-500">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <section className="py-20" style={{ backgroundColor: '#1A2B4A' }}>
        <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-bold text-white">
            Ready to see your project as a real concept?
          </h2>
          <p className="mt-4 text-gray-300">
            Start your intake. We&apos;ll generate your property-specific concept and schedule your
            included design consultation.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/intake"
              className="inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-base font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#E8793A' }}
            >
              Start My Project Intake <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/pricing"
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              View all pricing
            </Link>
          </div>
          <p className="mt-6 text-sm text-gray-500">
            $585 · One-time · No subscription · Consultation included
          </p>
        </div>
      </section>
    </div>
  )
}
