import Link from 'next/link'
import { ArrowRight, ShieldCheck } from 'lucide-react'

export function MilestonePayPreview() {
  return (
    <section className="border-y border-teal/30 bg-teal/5 px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-2 lg:items-center">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-teal-dark shadow-sm">
            <ShieldCheck className="h-4 w-4 text-teal" aria-hidden />
            Milestone Pay
          </div>
          <h2 className="font-display text-3xl font-bold text-navy sm:text-4xl">Escrow-aware releases tied to verified progress.</h2>
          <p className="text-lg text-slate-700">
            Funds stay protected until homeowners approve each milestone — contractors see predictable draws without compromising lien hygiene.
          </p>
          <Link
            href="/milestone-pay"
            className="inline-flex items-center gap-2 rounded-xl bg-navy px-6 py-3 text-sm font-semibold text-white hover:bg-navy-light"
          >
            Explore Milestone Pay <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
        <div className="rounded-3xl border border-white bg-white p-8 shadow-xl shadow-navy/10">
          <ul className="space-y-4 text-sm text-slate-700">
            <li className="flex gap-3">
              <span className="mt-1 h-2 w-2 rounded-full bg-teal" aria-hidden />
              Neutral escrow posture keeps disputed funds untouched until milestones clear.
            </li>
            <li className="flex gap-3">
              <span className="mt-1 h-2 w-2 rounded-full bg-builder-orange" aria-hidden />
              Structured approvals mirror inspection-ready checkpoints instead of arbitrary invoicing.
            </li>
            <li className="flex gap-3">
              <span className="mt-1 h-2 w-2 rounded-full bg-navy" aria-hidden />
              Works alongside Concept-led pathways — garden, landscape, and kitchen flows still begin with AI Concept.
            </li>
          </ul>
        </div>
      </div>
    </section>
  )
}
