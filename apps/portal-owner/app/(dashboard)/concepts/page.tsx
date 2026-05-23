'use client'

import Link from 'next/link'
import { Sparkles, ArrowRight } from 'lucide-react'
import { webMainBaseUrl } from '@/lib/concept-output'
import { CONCEPT_PACKAGE_PDF_PAGE_COUNT } from '@/lib/concept-package-manifest'

const ACCENT = '#2ABFBF'
const CORAL = '#E8724B'
const NAVY = '#1A2B4A'

export default function ConceptsPage() {
  const webMain = webMainBaseUrl()

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: NAVY }}>Order a Concept</h1>
          <p className="text-sm text-slate-500 mt-1">
            Start a new package on Kealee. Existing orders are under{' '}
            <Link href="/deliverables" className="font-semibold" style={{ color: ACCENT }}>
              Concept Packages
            </Link>
            .
          </p>
        </div>
        <a
          href={`${webMain}/get-concept`}
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: CORAL }}
        >
          <Sparkles className="h-4 w-4" />
          New Concept
        </a>
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-teal-200 bg-teal-50 px-5 py-3.5">
        <span className="text-xl">💡</span>
        <p className="text-sm text-teal-800">
          <span className="font-bold">Your design concept cost is credited toward permit drawing plans.</span>{' '}
          When you proceed to permits, the amount paid for your concept is deducted from your permit package price.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-8">
        <h3 className="text-base font-bold mb-2" style={{ color: NAVY }}>Your packages live in Concept Packages</h3>
        <p className="text-sm text-slate-500 mb-4 max-w-lg">
          After checkout, open renderings, scope, permit path, and your {CONCEPT_PACKAGE_PDF_PAGE_COUNT}-page PDF from one
          place — portal sections follow the same order as the PDF.
        </p>
        <ol className="text-sm text-slate-600 mb-6 space-y-1 list-decimal list-inside">
          <li>Cover &amp; package overview</li>
          <li>Floor plan</li>
          <li>Design narrative</li>
          <li>Scope &amp; materials</li>
          <li>Permit path</li>
          <li>Renderings &amp; video</li>
          <li>Next steps</li>
        </ol>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/deliverables"
            className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white"
            style={{ backgroundColor: ACCENT }}
          >
            <ArrowRight className="h-4 w-4" />
            View Concept Packages
          </Link>
          <a
            href={`${webMain}/concept`}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Sparkles className="h-4 w-4" style={{ color: CORAL }} />
            Browse packages on Kealee.com
          </a>
        </div>
      </div>
    </div>
  )
}
