import Link from 'next/link'
import { ArrowRight, Camera, Brain, FileText, MessageSquare, Zap } from 'lucide-react'
import { Container } from '@/components/ui/Container'

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
    desc:  'Our 15-node AI workflow — powered by Claude — analyzes your property, zoning, and project goals to generate a design brief and concept visuals.',
    color: '#E8793A',
  },
  {
    icon:  FileText,
    title: 'Receive Your Package',
    desc:  'Within 48 hours: exterior concept renderings, permit path analysis, design direction brief, and a fixed-price quote to move forward.',
    color: '#805AD5',
  },
  {
    icon:  MessageSquare,
    title: 'Consult with an Expert',
    desc:  'A Kealee project coordinator reviews your package with you and outlines the path to permit approval and construction start.',
    color: '#38A169',
  },
]

export function ConceptPackageSection() {
  return (
    <section className="py-20" style={{ background: 'linear-gradient(135deg, #1A2B4A 0%, #0F1D34 60%, #1A3B3B 100%)' }}>
      <Container>
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">

          {/* Left: copy */}
          <div>
            <div
              className="mb-5 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-widest"
              style={{ backgroundColor: 'rgba(42,191,191,0.15)', color: '#2ABFBF' }}
            >
              <Zap className="h-3.5 w-3.5" />
              AI Concept Design
            </div>

            <h2 className="text-3xl font-bold text-white font-display sm:text-4xl lg:text-[40px] leading-tight">
              From photos to permit-ready concept —{' '}
              <span style={{ color: '#E8793A' }}>in 48 hours</span>
            </h2>

            <p className="mt-5 text-lg text-gray-300 leading-relaxed">
              The Kealee AI Concept Package uses a 15-node Claude AI workflow to turn your property
              photos and project goals into a full design brief, exterior renderings, zoning analysis,
              and permit path strategy.
            </p>

            <ul className="mt-6 space-y-2.5">
              {[
                'Exterior concept renderings (AI-generated)',
                'Zoning & FAR analysis for your parcel',
                'Permit path + timeline estimate',
                'Design direction brief',
                'Live consultation with a project coordinator',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-gray-200">
                  <span className="mt-0.5 flex-shrink-0 text-base" style={{ color: '#2ABFBF' }}>✓</span>
                  {item}
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/concept-package"
                className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white transition-all hover:opacity-90"
                style={{ backgroundColor: '#E8793A' }}
              >
                Get Your Concept Package <ArrowRight className="h-4 w-4" />
              </Link>
              <div className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
                Starting at{' '}
                <span className="font-bold text-white">$585</span>
                {' '}· 48-hr delivery
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
                  className="flex gap-4 rounded-xl p-5 border"
                  style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.08)' }}
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
                    <p className="text-sm font-semibold text-white mb-1">{step.title}</p>
                    <p className="text-xs text-gray-400 leading-relaxed">{step.desc}</p>
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
