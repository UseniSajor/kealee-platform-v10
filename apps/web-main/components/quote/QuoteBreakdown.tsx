'use client'

import type { Quote, QuoteLine } from '@kealee/core-rules'
import { CheckCircle2, Info, AlertTriangle } from 'lucide-react'

/**
 * The full quote, shown before Stripe.
 *
 * A customer sees exactly what they are paying for and why: the package, the
 * size bracket it fell into, every scope adjustment (each naming the source
 * that detected it), the optional add-ons they chose, what is excluded, which
 * fees are paid to someone else, when the price expires, and the credit that
 * comes back if they build with Kealee.
 */

const money = (cents: number) => `$${(cents / 100).toLocaleString('en-US', { maximumFractionDigits: 0 })}`

function Row({ line }: { line: QuoteLine }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-slate-100 last:border-0">
      <div className="min-w-0">
        <p className="text-sm text-slate-700">{line.label}</p>
        {line.source && (
          <p className="text-xs text-slate-400 mt-0.5">Source: {line.source}</p>
        )}
        {line.note && <p className="text-xs text-slate-400 mt-0.5">{line.note}</p>}
      </div>
      <p className="text-sm font-semibold text-slate-900 whitespace-nowrap">
        {line.amountCents == null ? (line.kind === 'addon' ? 'Scoped' : 'Included') : money(line.amountCents)}
      </p>
    </div>
  )
}

function Section({ title, lines }: { title: string; lines: QuoteLine[] }) {
  if (!lines.length) return null
  return (
    <div className="px-5 py-4">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">{title}</p>
      {lines.map(line => <Row key={line.id} line={line} />)}
    </div>
  )
}

export function QuoteBreakdown({ quote, projectType }: { quote: Quote; projectType?: string }) {
  const by = (...kinds: QuoteLine['kind'][]) => quote.lines.filter(l => kinds.includes(l.kind))
  const expires = new Date(quote.expiresAt)

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Your price</p>
        <h3 className="text-lg font-bold text-slate-900 mt-0.5">{quote.label}</h3>
        {projectType && <p className="text-sm text-slate-500">{projectType.replace(/_/g, ' ')}</p>}
      </div>

      {quote.customQuoteRequired ? (
        <div className="px-5 py-4 bg-amber-50 border-b border-amber-100">
          <p className="flex items-center gap-2 text-sm font-semibold text-amber-900">
            <AlertTriangle className="h-4 w-4" /> This project is quoted by our team
          </p>
          <ul className="mt-2 space-y-1">
            {quote.customQuoteReasons.map(reason => (
              <li key={reason} className="text-sm text-amber-800">· {reason}</li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-amber-700">
            Nothing is charged now. Kealee sends your fixed price after review.
          </p>
        </div>
      ) : null}

      <Section title="Package" lines={by('base', 'size')} />
      <Section title="Scope adjustments" lines={by('complexity', 'required_scope')} />
      <Section title="Optional add-ons" lines={by('addon', 'rush')} />

      <div className="px-5 py-4 bg-slate-50 border-y border-slate-100">
        <div className="flex items-baseline justify-between">
          <p className="text-sm font-bold text-slate-900">
            {quote.customQuoteRequired ? 'Indicative total' : 'Exact price before payment'}
          </p>
          <p className="text-2xl font-black text-slate-900">{money(quote.totalCents)}</p>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Delivered in {quote.deliveryDays}. This price is held until{' '}
          {expires.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.
        </p>
      </div>

      <div className="px-5 py-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Included</p>
        {by('included').map(line => (
          <p key={line.id} className="flex items-start gap-2 text-sm text-slate-600 py-1">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
            {line.label}
          </p>
        ))}
      </div>

      {(quote.exclusions.length > 0 || quote.thirdPartyFees.length > 0) && (
        <div className="px-5 py-4 border-t border-slate-100">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">
            Not included
          </p>
          {quote.exclusions.map(item => (
            <p key={item} className="text-sm text-slate-500 py-0.5">· {item}</p>
          ))}
          {quote.thirdPartyFees.map(item => (
            <p key={item} className="text-sm text-slate-500 py-0.5">· {item} — paid to a third party, not to Kealee</p>
          ))}
        </div>
      )}

      <div className="px-5 py-4 bg-teal-50 border-t border-teal-100">
        <p className="flex items-start gap-2 text-sm text-teal-900">
          <Info className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{quote.credit.shortCopy}</span>
        </p>
      </div>
    </div>
  )
}
