'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Download, FileText, Clock, CheckCircle,
  AlertCircle, Loader2, Layers, ArrowRight, Package, Hourglass,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Deliverable {
  id:               string
  clientName:       string | null
  projectPath:      string
  projectLabel:     string
  address:          string | null
  budgetRange:      string | null
  status:           string   // 'paid' | 'concept_ready' | 'failed' | ...
  createdAt:        string
  updatedAt:        string
  conceptPackageId: string | null
  pdfUrl:           string | null
  generatedAt:      string | null
}

// ── Status helpers ─────────────────────────────────────────────────────────────

type UIStatus = 'ready' | 'generating' | 'failed' | 'pending'

function mapStatus(raw: string): UIStatus {
  if (raw === 'concept_ready') return 'ready'
  if (raw === 'failed')        return 'failed'
  if (raw === 'paid')          return 'generating'  // paid but not yet generated
  return 'pending'
}

function StatusBadge({ status }: { status: UIStatus }) {
  switch (status) {
    case 'ready':
      return (
        <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
          style={{ backgroundColor: 'rgba(56,161,105,0.1)', color: '#38A169' }}>
          <CheckCircle className="h-3 w-3" /> Ready
        </span>
      )
    case 'generating':
      return (
        <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
          style={{ backgroundColor: 'rgba(42,191,191,0.1)', color: '#2ABFBF' }}>
          <Loader2 className="h-3 w-3 animate-spin" /> Generating
        </span>
      )
    case 'failed':
      return (
        <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
          style={{ backgroundColor: 'rgba(229,62,62,0.1)', color: '#E53E3E' }}>
          <AlertCircle className="h-3 w-3" /> Failed
        </span>
      )
    default:
      return (
        <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
          style={{ backgroundColor: 'rgba(107,114,128,0.1)', color: '#6B7280' }}>
          <Clock className="h-3 w-3" /> Pending
        </span>
      )
  }
}

// ── Card ──────────────────────────────────────────────────────────────────────

function DeliverableCard({ d }: { d: Deliverable }) {
  const uiStatus = mapStatus(d.status)
  const ACCENT   = '#E8793A'
  const dateStr  = new Date(d.updatedAt).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  })

  return (
    <div className="overflow-hidden rounded-xl bg-white transition-shadow hover:shadow-md"
      style={{ boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.06)' }}>
      {/* Accent bar — coral for ready, teal for generating */}
      <div className="h-1" style={{
        backgroundColor: uiStatus === 'ready' ? ACCENT : uiStatus === 'generating' ? '#2ABFBF' : '#94A3B8',
      }} />

      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${ACCENT}15`, color: ACCENT }}>
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold" style={{ color: '#1A2B4A' }}>{d.projectLabel}</h3>
              <p className="text-xs text-gray-400 mt-0.5">{dateStr}</p>
              {d.address && (
                <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[180px]">{d.address}</p>
              )}
            </div>
          </div>
          <StatusBadge status={uiStatus} />
        </div>

        {/* Actions */}
        {uiStatus === 'ready' && (
          <div className="mt-4 flex gap-2 flex-wrap">
            <Link href={`/deliverables/${d.id}`}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: ACCENT }}>
              <ArrowRight className="h-3.5 w-3.5" />
              View Package
            </Link>
            {d.pdfUrl ? (
              <a href={d.pdfUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium transition-colors hover:bg-gray-50"
                style={{ color: '#6B7280' }}>
                <Download className="h-3.5 w-3.5" />
                Download PDF
              </a>
            ) : (
              <span className="flex items-center gap-1.5 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-400 cursor-not-allowed"
                title="PDF processing">
                <FileText className="h-3.5 w-3.5" />
                PDF Processing
              </span>
            )}
          </div>
        )}

        {uiStatus === 'generating' && (
          <div className="mt-3 flex items-center gap-2">
            <Loader2 className="h-3.5 w-3.5 animate-spin" style={{ color: '#2ABFBF' }} />
            <p className="text-xs text-gray-400">
              Your concept package is being generated — usually ready within a few minutes.
            </p>
          </div>
        )}

        {uiStatus === 'pending' && (
          <div className="mt-3 flex items-center gap-2">
            <Hourglass className="h-3.5 w-3.5 text-gray-400" />
            <p className="text-xs text-gray-400">Order confirmed. Generation starts shortly.</p>
          </div>
        )}

        {uiStatus === 'failed' && (
          <p className="mt-3 text-xs" style={{ color: '#E53E3E' }}>
            Generation failed. Contact support at hello@kealee.com if this persists.
          </p>
        )}
      </div>
    </div>
  )
}

function Skeleton() {
  return (
    <div className="overflow-hidden rounded-xl bg-white p-5" style={{ boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.06)' }}>
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg animate-pulse bg-gray-200" />
        <div className="flex-1">
          <div className="h-4 w-36 rounded animate-pulse bg-gray-200 mb-2" />
          <div className="h-3 w-24 rounded animate-pulse bg-gray-100" />
        </div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DeliverablesPage() {
  const [deliverables, setDeliverables] = useState<Deliverable[]>([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/deliverables')
      .then(r => r.ok ? r.json() : r.json().then(e => Promise.reject(e.error ?? 'Failed')))
      .then(({ deliverables: list }) => setDeliverables(list ?? []))
      .catch(err => setError(typeof err === 'string' ? err : 'Failed to load deliverables'))
      .finally(() => setLoading(false))
  }, [])

  const ready      = deliverables.filter(d => mapStatus(d.status) === 'ready')
  const inProgress = deliverables.filter(d => ['generating', 'pending'].includes(mapStatus(d.status)))
  const failed     = deliverables.filter(d => mapStatus(d.status) === 'failed')

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: '#1A2B4A' }}>Deliverables</h1>
        <p className="mt-1 text-sm text-gray-500">
          All concept packages, PDFs, and design outputs from your orders.
        </p>
      </div>

      {/* Loading */}
      {loading && (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3].map(i => <Skeleton key={i} />)}
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="rounded-xl p-5 text-sm"
          style={{ backgroundColor: 'rgba(229,62,62,0.05)', color: '#E53E3E', border: '1px solid rgba(229,62,62,0.2)' }}>
          <AlertCircle className="mb-1 inline h-4 w-4" /> {error}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && deliverables.length === 0 && (
        <div className="rounded-xl bg-white px-6 py-16 text-center"
          style={{ boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.06)' }}>
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full"
            style={{ backgroundColor: 'rgba(42,191,191,0.08)' }}>
            <Package className="h-7 w-7" style={{ color: '#2ABFBF' }} />
          </div>
          <h3 className="font-semibold text-lg mb-2" style={{ color: '#1A2B4A' }}>No deliverables yet</h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">
            Once you place an order for a Design Concept, Cost Estimate, or Permit Roadmap,
            your deliverables will appear here.
          </p>
        </div>
      )}

      {/* Deliverable sections */}
      {!loading && !error && deliverables.length > 0 && (
        <div className="space-y-8">
          {inProgress.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">In Progress</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {inProgress.map(d => <DeliverableCard key={d.id} d={d} />)}
              </div>
            </section>
          )}
          {ready.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">Ready to View</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {ready.map(d => <DeliverableCard key={d.id} d={d} />)}
              </div>
            </section>
          )}
          {failed.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">Failed</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {failed.map(d => <DeliverableCard key={d.id} d={d} />)}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
