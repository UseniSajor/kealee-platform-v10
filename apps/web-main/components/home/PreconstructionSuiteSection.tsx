import Link from 'next/link'
import { ArrowRight, Calculator, FileCheck, Globe2, Map, Palette } from 'lucide-react'
import {
  NATIONWIDE_STATEMENT,
  PRECONSTRUCTION_SUITE,
  type SuiteProduct,
  type SuiteProductId,
} from '@/lib/preconstruction-suite'

const ICONS: Record<SuiteProductId, React.ElementType> = {
  'design-concept': Palette,
  estimation: Calculator,
  'site-plan': Map,
  permitting: FileCheck,
}

function ProductCard({ product }: { product: SuiteProduct }) {
  const Icon = ICONS[product.id]
  return (
    <article
      className="flex flex-col rounded-2xl border-2 border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
      style={{ borderTopColor: product.accent, borderTopWidth: 4 }}
    >
      <div className="flex items-start justify-between gap-4">
        <span
          className="flex h-11 w-11 items-center justify-center rounded-xl text-white"
          style={{ backgroundColor: product.accent }}
        >
          <Icon className="h-5 w-5" />
        </span>
        <div className="text-right">
          <p className="text-lg font-black text-slate-900">{product.priceLabel}</p>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            {product.deliveryRange}
          </p>
        </div>
      </div>

      <h3 className="mt-5 font-display text-xl font-bold text-slate-950">{product.name}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{product.tagline}</p>

      <div className="mt-5 space-y-4 border-t border-slate-100 pt-5">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: product.accent }}>
            Who it&apos;s for
          </p>
          <p className="mt-1 text-xs leading-relaxed text-slate-600">{product.audience}</p>
        </div>

        {product.requiredInputs.length > 0 && (
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: product.accent }}>
              What you provide
            </p>
            <ul className="mt-1 space-y-0.5">
              {product.requiredInputs.map(input => (
                <li key={input} className="text-xs leading-relaxed text-slate-600">
                  • {input}
                </li>
              ))}
            </ul>
          </div>
        )}

        {product.deliverables.length > 0 && (
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: product.accent }}>
              What you get
            </p>
            <ul className="mt-1 space-y-0.5">
              {product.deliverables.map(item => (
                <li key={item} className="text-xs leading-relaxed text-slate-600">
                  • {item}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <p className="mt-5 rounded-lg bg-slate-50 p-3 text-[11px] leading-relaxed text-slate-500">
        {product.disclaimer}
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-3 pt-1">
        <Link
          href={product.startHref}
          className="inline-flex items-center gap-1.5 rounded-lg px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: product.accent }}
        >
          {product.ctaLabel} <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          href={product.detailHref}
          className="text-sm font-semibold text-slate-500 underline underline-offset-4 hover:text-slate-800"
        >
          Details
        </Link>
      </div>
    </article>
  )
}

/**
 * The four core preconstruction products, presented as an integrated suite.
 * This is the primary commercial surface of the homepage — the products are
 * purchasable directly from here, not hidden behind a chat interface.
 */
export function PreconstructionSuiteSection() {
  return (
    <section id="preconstruction-suite" className="bg-white px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-orange-600">
            The preconstruction suite
          </span>
          <h2 className="mt-3 font-display text-3xl font-bold text-slate-950 sm:text-4xl">
            Four products. One project record.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate-600">
            Start anywhere. Each product stands on its own, and each one feeds the next — your
            property, scope, and documents carry forward so you never re-enter them.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          {PRECONSTRUCTION_SUITE.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link
            href="/products/home-project-readiness-review"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-7 py-3.5 text-sm font-bold text-white hover:bg-slate-800"
          >
            Start a Project <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/products/detailed_estimate"
            className="inline-flex items-center gap-2 rounded-xl border-2 border-slate-300 px-7 py-3.5 text-sm font-bold text-slate-800 hover:border-slate-500"
          >
            Get an Estimate
          </Link>
          <Link
            href="/products/permit_assessment"
            className="inline-flex items-center gap-2 rounded-xl border-2 border-slate-300 px-7 py-3.5 text-sm font-bold text-slate-800 hover:border-slate-500"
          >
            Upload Plans &amp; Documents
          </Link>
          <Link
            href="/request-service"
            className="inline-flex items-center gap-2 rounded-xl border-2 border-slate-300 px-7 py-3.5 text-sm font-bold text-slate-800 hover:border-slate-500"
          >
            Request Pricing
          </Link>
        </div>

        <div className="mt-12 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <Globe2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-700" />
            <div>
              <h3 className="font-display text-lg font-bold text-emerald-950">
                Available nationwide
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-emerald-900">
                {NATIONWIDE_STATEMENT}
              </p>
              <p className="mt-3 text-xs font-semibold text-emerald-800">
                Receive a clear, professionally reviewed package built to help you make the next
                project decision with confidence.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
