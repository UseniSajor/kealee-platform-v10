'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Circle,
  Download,
  Loader2,
  Mail,
  ShieldCheck,
} from 'lucide-react'

interface ChecklistItem {
  key: string
  label: string
  state: 'provided' | 'missing' | 'optional'
  detail?: string
}

interface OrderPayload {
  intakeId: string
  productLabel: string
  clientName: string | null
  projectAddress: string | null
  deliveryDays: string | null
  status: string
  statusLabel: string
  statusDescription: string
  waitingOn: 'kealee' | 'customer' | 'none'
  review: { required: boolean; status: string; note: string }
  jurisdiction: {
    state: string | null
    county: string | null
    city: string | null
    coverageLabel: string | null
    confidence: number | null
    sources: { authority: string; dataset: string; retrievedAt: string }[]
    itemsRequiringConfirmation: string[]
  } | null
  checklist: ChecklistItem[]
  missingCount: number
  deliverables: { label: string; url: string; kind: string }[]
  report: {
    title: string
    readinessStatus?: string
    observations: string[]
    nextActions: string[]
  } | null
  deliverableIncludes: string[]
  nextStep: { label: string; href: string } | null
  disclaimers: string[]
}

const STATUS_ORDER = [
  'intake_submitted',
  'processing',
  'in_review',
  'needs_professional_review',
  'ready_for_delivery',
  'delivered',
]

function StatusTimeline({ status }: { status: string }) {
  const activeIndex = STATUS_ORDER.indexOf(status)
  return (
    <ol className="mt-5 space-y-2" aria-label="Order progress">
      {STATUS_ORDER.map((step, index) => {
        const done = activeIndex >= 0 && index < activeIndex
        const current = step === status
        return (
          <li key={step} className="flex items-center gap-2.5 text-sm">
            {done ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            ) : current ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-orange-600" />
            ) : (
              <Circle className="h-4 w-4 shrink-0 text-slate-300" />
            )}
            <span
              className={
                current
                  ? 'font-bold text-slate-900'
                  : done
                    ? 'text-slate-600'
                    : 'text-slate-400'
              }
            >
              {step.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

function AccessGate({ intakeId }: { intakeId: string }) {
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState('')

  async function requestLink(event: React.FormEvent) {
    event.preventDefault()
    setSending(true)
    setMessage('')
    try {
      const res = await fetch(`/api/orders/${intakeId}/access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const body = await res.json()
      setMessage(body.message ?? body.error ?? 'Something went wrong. Please try again.')
    } catch {
      setMessage('We could not send the link right now. Please try again in a moment.')
    } finally {
      setSending(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-16">
      <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
        <Mail className="h-7 w-7 text-orange-600" />
        <h1 className="mt-4 text-xl font-bold text-slate-900">Open your order</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Enter the email you used at checkout and we will send you a link to this order.
        </p>
        <form onSubmit={requestLink} className="mt-5 space-y-3">
          <input
            type="email"
            required
            value={email}
            onChange={event => setEmail(event.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
          />
          <button
            type="submit"
            disabled={sending}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-orange-600 px-5 py-3 text-sm font-bold text-white disabled:opacity-60"
          >
            {sending && <Loader2 className="h-4 w-4 animate-spin" />}
            Email me the link
          </button>
        </form>
        {message && <p className="mt-4 text-sm text-slate-700">{message}</p>}
        <p className="mt-6 text-xs text-slate-500">
          Need help? <Link href="/contact" className="font-semibold text-orange-700 underline">Contact support</Link>
        </p>
      </div>
    </main>
  )
}

export function OrderTrackerClient({ intakeId }: { intakeId: string }) {
  const searchParams = useSearchParams()
  const token = searchParams.get('t') ?? ''
  const [order, setOrder] = useState<OrderPayload | null>(null)
  const [denied, setDenied] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const query = token ? `?t=${encodeURIComponent(token)}` : ''
      const res = await fetch(`/api/orders/${intakeId}${query}`, { cache: 'no-store' })
      if (!res.ok) {
        setDenied(true)
        return
      }
      setOrder((await res.json()) as OrderPayload)
      setDenied(false)
    } catch {
      setDenied(true)
    } finally {
      setLoading(false)
    }
  }, [intakeId, token])

  useEffect(() => {
    void load()
    // Orders move through fulfillment in the background; refresh while open.
    const interval = setInterval(load, 30_000)
    return () => clearInterval(interval)
  }, [load])

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-orange-600" />
      </main>
    )
  }

  if (denied || !order) return <AccessGate intakeId={intakeId} />

  const outstanding = order.checklist.filter(item => item.state === 'missing')

  return (
    <main className="min-h-screen bg-slate-50 pb-20">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
          <p className="text-xs font-bold uppercase tracking-widest text-orange-600">
            Your Kealee order
          </p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">{order.productLabel}</h1>
          {order.projectAddress && (
            <p className="mt-1 text-sm text-slate-600">{order.projectAddress}</p>
          )}
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3.5 py-1.5">
            <span className="text-sm font-bold text-slate-900">{order.statusLabel}</span>
            {order.deliveryDays && (
              <span className="text-xs text-slate-500">· {order.deliveryDays}</span>
            )}
          </div>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600">
            {order.statusDescription}
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6">
        {order.waitingOn === 'customer' && outstanding.length > 0 && (
          <section className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
              <div>
                <h2 className="font-bold text-amber-900">We need {outstanding.length} thing{outstanding.length === 1 ? '' : 's'} from you</h2>
                <p className="mt-1 text-sm text-amber-800">
                  Work continues as soon as these arrive. Reply to your confirmation email with anything listed here.
                </p>
              </div>
            </div>
          </section>
        )}

        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="font-bold text-slate-900">Progress</h2>
          <StatusTimeline status={order.status} />
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="font-bold text-slate-900">Information checklist</h2>
          <p className="mt-1 text-sm text-slate-500">
            What we have, and what would sharpen your deliverable.
          </p>
          <ul className="mt-4 space-y-3">
            {order.checklist.map(item => (
              <li key={item.key} className="flex items-start gap-2.5">
                {item.state === 'provided' ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                ) : item.state === 'missing' ? (
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                ) : (
                  <Circle className="mt-0.5 h-4 w-4 shrink-0 text-slate-300" />
                )}
                <div>
                  <p
                    className={`text-sm ${item.state === 'missing' ? 'font-semibold text-slate-900' : 'text-slate-700'}`}
                  >
                    {item.label}
                    {item.state === 'optional' && (
                      <span className="ml-2 text-xs font-normal text-slate-400">optional</span>
                    )}
                  </p>
                  {item.detail && (
                    <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{item.detail}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>

        {order.jurisdiction && (
          <section className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-6">
            <h2 className="font-bold text-emerald-950">Jurisdiction &amp; data coverage</h2>
            <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-xs text-emerald-700">Jurisdiction</dt>
                <dd className="font-semibold text-emerald-950">
                  {[order.jurisdiction.city, order.jurisdiction.county, order.jurisdiction.state]
                    .filter(Boolean)
                    .join(', ') || 'Pending manual confirmation'}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-emerald-700">Coverage</dt>
                <dd className="font-semibold text-emerald-950">
                  {order.jurisdiction.coverageLabel ?? 'Manual review required'}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-emerald-700">Confidence</dt>
                <dd className="font-semibold text-emerald-950">
                  {order.jurisdiction.confidence != null
                    ? `${Math.round(order.jurisdiction.confidence * 100)}%`
                    : '—'}
                </dd>
              </div>
            </dl>
            {order.jurisdiction.sources.length > 0 && (
              <p className="mt-4 text-xs text-emerald-800">
                Sources:{' '}
                {order.jurisdiction.sources
                  .map(source => `${source.authority}${source.dataset ? ` — ${source.dataset}` : ''}${source.retrievedAt ? ` (retrieved ${new Date(source.retrievedAt).toLocaleDateString()})` : ''}`)
                  .join(' · ')}
              </p>
            )}
            {order.jurisdiction.itemsRequiringConfirmation.length > 0 && (
              <div className="mt-4 rounded-lg border border-emerald-300 bg-white p-4">
                <p className="text-xs font-bold text-emerald-950">Requires confirmation</p>
                <ul className="mt-1.5 space-y-1">
                  {order.jurisdiction.itemsRequiringConfirmation.map(item => (
                    <li key={item} className="text-xs leading-relaxed text-emerald-800">• {item}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" />
            <div>
              <h2 className="font-bold text-slate-900">Review status</h2>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">{order.review.note}</p>
              <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {order.review.required
                  ? order.review.status === 'complete'
                    ? 'Professional review complete'
                    : order.review.status === 'in_review'
                      ? 'Professional review in progress'
                      : 'Professional review pending'
                  : 'No separate professional review included'}
              </p>
            </div>
          </div>
        </section>

        {order.report && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="font-bold text-slate-900">{order.report.title}</h2>
            {order.report.readinessStatus && (
              <p className="mt-2 text-sm font-semibold text-slate-800">
                {order.report.readinessStatus}
              </p>
            )}
            {order.report.observations.length > 0 && (
              <>
                <p className="mt-4 text-xs font-bold uppercase tracking-widest text-slate-400">
                  Observations
                </p>
                <ul className="mt-1.5 space-y-1">
                  {order.report.observations.map(item => (
                    <li key={item} className="text-sm leading-relaxed text-slate-600">• {item}</li>
                  ))}
                </ul>
              </>
            )}
            {order.report.nextActions.length > 0 && (
              <>
                <p className="mt-4 text-xs font-bold uppercase tracking-widest text-slate-400">
                  Next actions
                </p>
                <ol className="mt-1.5 space-y-1">
                  {order.report.nextActions.map(item => (
                    <li key={item} className="text-sm leading-relaxed text-slate-600">• {item}</li>
                  ))}
                </ol>
              </>
            )}
          </section>
        )}

        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="font-bold text-slate-900">Deliverables</h2>
          {order.deliverables.length > 0 ? (
            <ul className="mt-4 space-y-2">
              {order.deliverables.map(file => (
                <li key={file.url}>
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-orange-700 underline"
                  >
                    <Download className="h-4 w-4" />
                    {file.label}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <>
              <p className="mt-3 text-sm text-slate-500">
                Nothing to download yet. Your package will appear here and you will get an email the
                moment it is released.
              </p>
              {order.deliverableIncludes.length > 0 && (
                <ul className="mt-4 space-y-1.5">
                  {order.deliverableIncludes.map(item => (
                    <li key={item} className="text-xs leading-relaxed text-slate-600">• {item}</li>
                  ))}
                </ul>
              )}
            </>
          )}
        </section>

        {order.nextStep && (
          <section className="rounded-2xl border-2 border-orange-200 bg-orange-50 p-6">
            <h2 className="font-bold text-slate-900">What most people do next</h2>
            <Link
              href={order.nextStep.href}
              className="mt-3 inline-flex items-center gap-2 rounded-lg bg-orange-600 px-5 py-3 text-sm font-bold text-white"
            >
              {order.nextStep.label} <ArrowRight className="h-4 w-4" />
            </Link>
          </section>
        )}

        <section className="rounded-xl border border-slate-200 bg-white p-5">
          {order.disclaimers.map(text => (
            <p key={text} className="text-xs leading-relaxed text-slate-500 [&+p]:mt-2">
              {text}
            </p>
          ))}
        </section>
      </div>
    </main>
  )
}
