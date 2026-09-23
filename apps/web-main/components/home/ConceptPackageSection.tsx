import Link from 'next/link'
import { ArrowRight, Camera, Brain, FileText, MessageSquare, Zap } from 'lucide-react'
import { CONCEPT_START_PRICE, formatPrice } from '@/lib/marketing/pricing'
import { Container } from '@/components/ui/Container'

const STEPS = [
  {
    icon:  Camera,
    title: 'Capture the Existing Conditions',
    desc:  'Walk your property with your phone. Our capture tool records the existing conditions — photos, voice notes, site context — and your programme: the rooms, uses and goals the design must serve. No measuring tape required.',
    color: '#2ABFBF',
  },
  {
    icon:  Brain,
    title: 'Site Analysis & Schematic Design',
    desc:  'Our Design Engine reads the parcel and its zoning envelope — setbacks, height, lot coverage — and develops a schematic design: massing, plan organisation, material palette and concept renderings that fit the site and the programme.',
    color: '#E8793A',
  },
  {
    icon:  FileText,
    title: 'Receive the Schematic Design Package',
    desc:  'Within 2–5 business days: concept renderings, plan direction or scaled schematic floor plans, a design direction brief with materials and finishes, the zoning and permit path, and a cost band. This is schematic design — the basis for permit drawings, not construction documents.',
    color: '#805AD5',
  },
  {
    icon:  MessageSquare,
    title: 'Architectural Review & Consultation',
    desc:  'Concepts are staged on Kealee\'s OS Architecture desk for professional review before permit drawings begin. Email support and one revision round are included; a live consultation is available as an add-on.',
    color: '#38A169',
  },
]

export function ConceptPackageSection() {
  return (
    <section className="py-20" style={{ background: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 60%, #E2E8F0 100%)' }}>
      <Container>
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">

          {/* Left: copy */}
          <div>
            <div
              className="mb-5 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-widest"
              style={{ backgroundColor: 'rgba(42,191,191,0.15)', color: '#2ABFBF' }}
            >
              <Zap className="h-3.5 w-3.5" />
              Schematic Design & Permitting
            </div>

            <h2 className="text-3xl font-bold text-slate-900 font-display sm:text-4xl lg:text-[40px] leading-tight">
              From schematic design concept to permit-ready plans
            </h2>

            <p className="mt-5 text-lg text-slate-600 leading-relaxed">
              The Kealee Concept Package is a schematic design package. It takes your programme and the
              existing conditions you capture, tests them against the parcel&apos;s zoning envelope, and
              develops the massing, plan and material palette into concept renderings, a design direction
              brief and a permit roadmap — including whether a permit is required at all (a replace-in-kind
              kitchen or bath often needs none).
            </p>

            <ul className="mt-6 space-y-2.5">
              {[
                'Six concept views — massing, elevations, materials and light',
                'Plan direction and a scaled schematic floor plan',
                'Zoning envelope and permit path for your parcel — setbacks, height, coverage, use',
                'Outline specification: bill of materials with line-item cost estimates',
                'Design direction brief — material and finish palette, elevation concept',
                'Professional review on the OS Architecture desk; email support and one revision included',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-slate-700">
                  <span className="mt-0.5 flex-shrink-0 text-base" style={{ color: '#2ABFBF' }}>✓</span>
                  {item}
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/products/concept"
                className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white transition-all hover:opacity-90"
                style={{ backgroundColor: '#E8793A' }}
              >
                Start Your Project <ArrowRight className="h-4 w-4" />
              </Link>
              <div className="text-sm" style={{ color: '#64748B' }}>
                Starting at{' '}
                <span className="font-bold text-slate-900">{formatPrice(CONCEPT_START_PRICE)}</span>
                {' '}· 2–5 day concept delivery
              </div>
            </div>

            <Link
              href="/capture/demo"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium hover:underline"
              style={{ color: '#2ABFBF' }}
            >
              <Camera className="h-4 w-4" />
              Try the capture tool — no account needed
            </Link>
          </div>

          {/* Right: steps */}
          <div className="space-y-4">
            {STEPS.map((step, i) => {
              const Icon = step.icon
              return (
                <div
                  key={step.title}
                  className="flex gap-4 rounded-xl p-5 border bg-white border-slate-200 shadow-sm"
                >
                  <div
                    className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ backgroundColor: `${step.color}20` }}
                  >
                    <Icon className="h-5 w-5" style={{ color: step.color }} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: step.color }}>
                        Step {i + 1}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-900 mb-1">{step.title}</p>
                    <p className="text-xs text-slate-600 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </Container>
    </section>
  )
}
