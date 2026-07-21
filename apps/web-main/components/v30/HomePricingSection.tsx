'use client'

import Link from 'next/link'
import { ArrowRight, Sparkles } from 'lucide-react'
import { isV30EnabledClient } from '@/lib/v30'

/** P1 — hide fixed tier cards when v30 dynamic pricing is on (formula from v30_pricing_formulas, editable in portal-admin). */
export function HomePricingSection({ children }: { children: React.ReactNode }) {
  if (!isV30EnabledClient()) return <>{children}</>

  return (
    <section id="packages" className="py-24 bg-gradient-to-b from-violet-50 to-slate-50 scroll-mt-16">
      <div className="mx-auto max-w-3xl px-4 text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-violet-600 mb-3">Kealee v30</p>
        <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">Your price, built for your project</h2>
        <p className="mt-4 text-slate-600 max-w-xl mx-auto">
          Answer nine quick questions. IntakeBot analyzes scope, location, and timeline — then quotes a custom
          package before you pay. No fixed tiers.
        </p>
        <Link
          href="/get-concept"
          className="mt-8 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-8 py-4 text-white font-bold shadow-lg hover:bg-violet-700 transition"
        >
          <Sparkles className="h-5 w-5" />
          Get your custom quote
          <ArrowRight className="h-5 w-5" />
        </Link>
        <p className="mt-4 text-xs text-slate-500">
          Classic packages still available via{' '}
          <Link href="/concept" className="text-violet-600 underline">
            standard concept flow
          </Link>
        </p>
      </div>
    </section>
  )
}
