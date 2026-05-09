import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Layers, ShieldCheck, HardHat } from 'lucide-react'

export const metadata: Metadata = {
  title: 'How It Works — Concept-first pathways',
  description:
    'Design + permits, permits-only, and contractor-only pathways — garden, landscape, and kitchen scopes route through AI Concept first.',
}

const PATHS = [
  {
    title: 'Design + permits path',
    icon: Layers,
    steps: [
      'Describe scope inside Concept — garden, landscape, and kitchen journeys cannot skip AI Concept.',
      'Receive zoning-aware guidance, pricing hooks from the catalog, and Milestone Pay readiness.',
      'Layer permits, estimation, ops modules, or PM SKUs only after Concept captures intent.',
      'Coordinate GC bids or marketplace matching once milestones are defined.',
    ],
  },
  {
    title: 'Permits-only path',
    icon: ShieldCheck,
    steps: [
      'Bring permit-ready drawings from your architect or engineer.',
      'We translate jurisdictional quirks across DC, Maryland, and Virginia agencies.',
      'Choose assisted or managed filing modes aligned with the permit tiers defined in the Kealee pricing catalog.',
      'Release Milestone Pay tranches when inspections clear — funds stay escrow-aware.',
    ],
  },
  {
    title: 'Contractor-only path',
    icon: HardHat,
    steps: [
      'Ideal when permitting is complete but execution discipline is missing.',
      'Import scope packages directly into ops modules — scheduling, QC, RFIs, closeout.',
      'Use estimation SKUs for bid leveling or change-order defense.',
      'Pair Milestone Pay with ops checkpoints so draws mirror verified progress.',
    ],
  },
] as const

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="border-b border-slate-100 bg-gradient-to-br from-navy via-navy-light to-navy-dark px-4 py-16 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-teal-light">Playbook</p>
          <h1 className="mt-4 font-display text-4xl font-bold sm:text-5xl">Three paths. One twin-backed spine.</h1>
          <p className="mt-4 max-w-3xl text-lg text-white/75">
            Regardless of entry point, Concept captures intent once — downstream SKUs attach without restarting your dossier.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl space-y-16 px-4 py-16 sm:px-6 lg:px-8">
        {PATHS.map((path) => {
          const Icon = path.icon
          return (
            <article key={path.title} className="rounded-3xl border border-slate-200 bg-slate-50 p-8 shadow-inner">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-4">
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-builder-orange shadow-sm">
                    <Icon className="h-7 w-7" aria-hidden />
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Flow</p>
                    <h2 className="font-display text-2xl font-bold text-navy">{path.title}</h2>
                  </div>
                </div>
              </div>
              <ol className="mt-8 space-y-4 text-sm text-slate-700">
                {path.steps.map((step, idx) => (
                  <li key={step} className="flex gap-4 rounded-2xl border border-white bg-white px-4 py-3 shadow-sm">
                    <span className="font-display text-lg font-semibold text-builder-orange">{idx + 1}</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </article>
          )
        })}
      </section>

      <section className="border-t border-slate-100 bg-white px-4 py-16 text-center sm:px-6">
        <div className="mx-auto max-w-3xl space-y-6">
          <h2 className="font-display text-3xl font-bold text-navy">Start where you are — converge on Concept.</h2>
          <p className="text-sm text-slate-600">
            Garden, landscape, and kitchen scopes remain Concept-first — even when you ultimately pursue permits-only execution help.
          </p>
          <Link
            href="/concept"
            className="inline-flex items-center gap-2 rounded-xl bg-builder-orange px-8 py-4 text-base font-semibold text-white hover:bg-builder-orange-dark"
          >
            Start your project <ArrowRight className="h-5 w-5" aria-hidden />
          </Link>
        </div>
      </section>
    </div>
  )
}
