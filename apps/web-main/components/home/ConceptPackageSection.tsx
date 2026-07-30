import Link from 'next/link'
import { ArrowRight, Camera, Brain, FileText, MessageSquare, Zap } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { CONCEPT_START_PRICE, formatPrice } from '@kealee/core-rules'

const STEPS = [
  {
    icon:  Camera,
    title: 'Capture Your Property',
    desc:  'Walk your property with your phone. Our capture tool records photos, voice notes, and site conditions — no measuring tape required.',
    color: '#2ABFBF',
  },
  {
    icon:  Brain,
    title: 'AI Analyzes & Designs',
    desc:  'Our specialized AI design engine analyzes your property, zoning, and project goals to generate a design brief and concept visuals.',
    color: '#E8793A',
  },
  {
    icon:  FileText,
    title: 'Receive Your Package',
    desc:  'Within 2–5 business days: AI concept renderings, permit path analysis, design direction brief, and cost band estimate. This is your planning package — construction starts after permitting (if required).',
    color: '#805AD5',
  },
  {
    icon:  MessageSquare,
    title: 'Consult with an Expert',
    desc:  'The Preconstruction Package includes a live 15-minute call with a Kealee consultant. Every outcome includes email support.',
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
              Design & Permitting
            </div>

            <h2 className="text-3xl font-bold text-slate-900 font-display sm:text-4xl lg:text-[40px] leading-tight">
              From Design Concept to a Clear Permit Path
            </h2>

            <p className="mt-5 text-lg text-slate-600 leading-relaxed">
              The Kealee AI Concept Package turns your property photos and project goals into a complete 
              design brief, exterior renderings, zoning check, and permit roadmap—helping you identify 
              if a permit is even required (such as for simple replace-in-kind kitchen or bath remodels).
            </p>

            <ul className="mt-6 space-y-2.5">
              {[
                'AI concept renderings (3–12 based on package tier)',
                'Layout direction in Concept; scaled floor plans in Concept + Budget and Preconstruction',
                'Zoning & permit path analysis for your parcel',
                'Planning-level bill of materials and cost ranges',
                'Design direction brief with materials & finishes',
                'Email support on every outcome; live consultation in Preconstruction',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-slate-700">
                  <span className="mt-0.5 flex-shrink-0 text-base" style={{ color: '#2ABFBF' }}>✓</span>
                  {item}
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/concept-engine"
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

            <p className="mt-4 text-xs leading-relaxed text-slate-500">
              AI concepts are preliminary planning documents. Permit-ready drawings, stamps,
              certifications, filing, and agency approval are separate services performed or
              reviewed by qualified professionals when explicitly included in your order.
            </p>

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
