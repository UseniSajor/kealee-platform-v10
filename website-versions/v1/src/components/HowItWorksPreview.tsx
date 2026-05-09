import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

const STEPS = [
  {
    title: 'Design + permits path',
    body: 'Kitchen, bath, garden, landscape, and exterior scopes route through AI Concept before filings.',
  },
  {
    title: 'Permits-only path',
    body: 'Bring drawings from your architect — we assemble compliant submissions with DMV-aware reviewers.',
  },
  {
    title: 'Contractor-only path',
    body: 'Already permitted? Layer estimation, Milestone Pay, and ops modules without redoing intake.',
  },
] as const

export function HowItWorksPreview() {
  return (
    <section className="border-y border-slate-100 bg-white px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-4">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-builder-orange">How it works</p>
            <h2 className="font-display text-3xl font-bold text-navy sm:text-4xl">Three disciplined paths through every project.</h2>
            <p className="text-lg text-slate-600">
              Every lane lands in the same twin-backed workspace — Milestone Pay stays consistent regardless of entry point.
            </p>
          </div>
          <Link
            href="/how-it-works"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-6 py-3 text-sm font-semibold text-navy hover:border-builder-orange hover:text-builder-orange"
          >
            View full playbook <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {STEPS.map((step, idx) => (
            <article key={step.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Step {idx + 1}</p>
              <h3 className="mt-3 font-display text-xl font-semibold text-navy">{step.title}</h3>
              <p className="mt-3 text-sm text-slate-600">{step.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
