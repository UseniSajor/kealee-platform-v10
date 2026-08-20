import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, Globe2, Map, Ruler, ShieldCheck } from 'lucide-react'
import {
  formatCatalogPrice,
  getPublicCatalogProduct,
  type PublicCatalogProduct,
} from '@kealee/core-rules'
import { NATIONWIDE_STATEMENT } from '@/lib/preconstruction-suite'

export const metadata: Metadata = {
  title: 'Site Plans & Buildability — Kealee',
  description: 'Preliminary site plans, verified zoning and site feasibility, and survey-based permit site-plan coordination.',
}

const productKeys = [
  'preliminary_site_plan',
  'verified_site_feasibility',
  'permit_site_plan',
] as const

const products = productKeys
  .map(key => getPublicCatalogProduct(key))
  .filter((product): product is PublicCatalogProduct => product !== null)

const inclusions: Record<(typeof productKeys)[number], string[]> = {
  preliminary_site_plan: [
    'Address and parcel intake',
    'Available parcel and zoning sources',
    'Preliminary setbacks and overlays',
    'Preliminary buildable-area diagram',
    'One proposed footprint',
  ],
  verified_site_feasibility: [
    'Verified source and effective-date record',
    'Zoning and overlay review',
    'Constraint and buildable-envelope review',
    'Proposed footprint validation',
    'Professional-review checklist',
  ],
  permit_site_plan: [
    'Validate the survey for permit filing',
    'Draft the jurisdiction-specific site plan',
    'Add setbacks, coverage, structures, and required notes',
    'Complete required professional review and sealing',
    'Revise for agency comments and add to the submission set',
  ],
}

export default function SitePlansPage() {
  return (
    <main className="min-h-screen bg-white">
      <section className="bg-gradient-to-br from-[#0F3D3E] via-[#0F766E] to-[#164E63] px-6 py-20 text-white">
        <div className="mx-auto max-w-5xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-teal-100">
            <Map className="h-4 w-4" /> Site Intelligence
          </span>
          <h1 className="mx-auto mt-5 max-w-4xl font-display text-4xl font-black sm:text-5xl">
            Understand what fits before design, permits, or construction.
          </h1>
          <p className="mx-auto mt-5 max-w-3xl text-lg leading-relaxed text-teal-50/80">
            Start with an address or survey. Kealee organizes parcel, zoning, setbacks, overlays,
            preliminary buildable area, and the appropriate next level of professional review.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/get-started?service=preliminary_site_plan" className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-bold text-teal-900">
              Start a site plan <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/products#site-intelligence" className="rounded-xl border border-white/25 px-6 py-3 font-semibold text-white hover:bg-white/10">
              View site-intelligence catalog
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-6 lg:grid-cols-3">
            {products.map((product, index) => {
              const key = product.key as (typeof productKeys)[number]
              return (
                <article key={product.key} className={`flex flex-col overflow-hidden rounded-2xl border-2 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl ${index === 0 ? 'border-teal-200 bg-gradient-to-br from-white to-teal-50' : index === 1 ? 'border-amber-200 bg-gradient-to-br from-white to-amber-50' : 'border-[#9a7659]/35 bg-gradient-to-br from-white to-[#f4ece3]'}`}>
                  <div className="flex items-start justify-between gap-4">
                    <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${index === 1 ? 'bg-yellow-300 text-[#3f321f]' : index === 2 ? 'bg-[#7a563d] text-white' : 'bg-teal-700 text-white'}`}>
                      {index === 0 ? <Map className="h-5 w-5" /> : index === 1 ? <Ruler className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
                    </span>
                    <span className="text-lg font-black text-teal-800">{formatCatalogPrice(product)}</span>
                  </div>
                  <p className="mt-5 text-xs font-bold uppercase tracking-widest text-teal-700">Level {index + 1}</p>
                  <h2 className="mt-2 font-display text-xl font-bold text-slate-950">{product.name}</h2>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">{product.shortDescription}</p>
                  <ul className="mt-5 flex-1 space-y-2 border-t border-slate-100 pt-5">
                    {inclusions[key].map(item => (
                      <li key={item} className="flex gap-2 text-sm text-slate-600">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-5 text-xs text-slate-400">{product.deliveryDays ?? 'Schedule confirmed after intake'}</p>
                  {product.limitations.length > 0 && (
                    <ul className="mt-3 space-y-0.5 rounded-lg bg-slate-50 p-3">
                      {product.limitations.map(limitation => (
                        <li key={limitation} className="text-[11px] leading-relaxed text-slate-500">
                          • {limitation}
                        </li>
                      ))}
                    </ul>
                  )}
                  <Link href={product.href} className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-3 text-sm font-bold text-white hover:bg-teal-800">
                    Choose this level <ArrowRight className="h-4 w-4" />
                  </Link>
                </article>
              )
            })}
          </div>

          <div className="mx-auto mt-12 max-w-4xl space-y-4">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-6">
              <div className="flex items-start gap-4">
                <Globe2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-700" />
                <div>
                  <h2 className="font-display text-lg font-bold text-emerald-950">
                    Available nationwide — including where GIS data is thin
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-emerald-900">{NATIONWIDE_STATEMENT}</p>
                  <p className="mt-3 text-xs font-semibold text-emerald-800">
                    If no parcel or zoning service covers your property, we say so, fall back to your
                    survey, plat, and county records plus manual research, and label the result
                    &ldquo;Manual review required&rdquo;. We never state zoning, setback, coverage,
                    permit, fee, or approval information we have not verified against a named source.
                  </p>
                </div>
              </div>
            </div>

            <p className="rounded-xl border border-slate-200 bg-white p-5 text-xs leading-relaxed text-slate-500">
              Site plans delivered at the preliminary and verified levels are preliminary and not for
              construction unless professionally reviewed. They are not boundary surveys. Permit
              site-plan coordination includes the professional review and sealing your jurisdiction
              requires; Kealee prepares and coordinates the submission, but only the jurisdiction
              approves a permit.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
