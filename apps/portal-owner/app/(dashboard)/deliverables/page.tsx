'use client'

import { useEffect, useState } from 'react'
import {
  Download, FileText, Package, Clock, CheckCircle,
  AlertCircle, Loader2, ExternalLink, Layers,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

// ── Types ─────────────────────────────────────────────────────────────────────

interface ProjectOutput {
  id: string
  projectId: string | null
  intakeId: string | null
  orderId: string | null
  type: string
  status: 'pending' | 'generating' | 'completed' | 'failed'
  resultJson: Record<string, unknown> | null
  pdfUrl: string | null
  downloadUrl: string | null
  generatedAt: string
  completedAt: string | null
  metadata: Record<string, unknown> | null
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  design: {
    label: 'Design Concept',
    color: '#E8793A',
    icon: <Layers className="h-5 w-5" />,
  },
  estimate: {
    label: 'Cost Estimate',
    color: '#3182CE',
    icon: <FileText className="h-5 w-5" />,
  },
  permit: {
    label: 'Permit Roadmap',
    color: '#38A169',
    icon: <Package className="h-5 w-5" />,
  },
  concept: {
    label: 'Design Concept',
    color: '#E8793A',
    icon: <Layers className="h-5 w-5" />,
  },
}

function getTypeConfig(type: string) {
  return TYPE_CONFIG[type.toLowerCase()] ?? {
    label: type.charAt(0).toUpperCase() + type.slice(1),
    color: '#6B7280',
    icon: <FileText className="h-5 w-5" />,
  }
}

function StatusBadge({ status }: { status: ProjectOutput['status'] }) {
  switch (status) {
    case 'completed':
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

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-gray-200 ${className ?? ''}`} />
}

function DeliverableCard({ output }: { output: ProjectOutput }) {
  const cfg = getTypeConfig(output.type)
  const date = output.completedAt ?? output.generatedAt

  return (
    <div className="overflow-hidden rounded-xl bg-white transition-shadow hover:shadow-md"
      style={{ boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.06)' }}>
      {/* Accent bar */}
      <div className="h-1" style={{ backgroundColor: cfg.color }} />

      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${cfg.color}15`, color: cfg.color }}>
              {cfg.icon}
            </div>
            <div>
              <h3 className="font-semibold" style={{ color: '#1A2B4A' }}>{cfg.label}</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {new Date(date).toLocaleDateString('en-US', {
                  year: 'numeric', month: 'short', day: 'numeric',
                })}
              </p>
            </div>
          </div>
          <StatusBadge status={output.status} />
        </div>

        {output.status === 'completed' && (
          <div className="mt-4 flex gap-2">
            {output.pdfUrl && (
              <a
                href={output.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: cfg.color }}
              >
                <ExternalLink className="h-3.5 w-3.5" />
                View PDF
              </a>
            )}
            {output.downloadUrl && (
              <a
                href={output.downloadUrl}
                download
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium transition-colors hover:bg-gray-50"
                style={{ color: '#6B7280' }}
              >
                <Download className="h-3.5 w-3.5" />
                Download
              </a>
            )}
          </div>
        )}

        {output.status === 'generating' && (
          <p className="mt-3 text-xs text-gray-400">
            Your deliverable is being generated. This usually completes within a few minutes.
          </p>
        )}

        {output.status === 'pending' && (
          <p className="mt-3 text-xs text-gray-400">
            Your order is confirmed. Generation will begin shortly.
          </p>
        )}

        {output.status === 'failed' && (
          <p className="mt-3 text-xs" style={{ color: '#E53E3E' }}>
            Generation failed. Please contact support if this persists.
          </p>
        )}
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DeliverablesPage() {
  const [outputs, setOutputs] = useState<ProjectOutput[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadDeliverables() {
      try {
        const { data, error: fetchError } = await supabase
          .from('project_outputs')
          .select('*')
          .order('generatedAt', { ascending: false })

        if (fetchError) throw fetchError
        setOutputs((data ?? []) as ProjectOutput[])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load deliverables')
      } finally {
        setLoading(false)
      }
    }

    loadDeliverables()
  }, [])

  const completed  = outputs.filter(o => o.status === 'completed')
  const inProgress = outputs.filter(o => o.status === 'generating' || o.status === 'pending')
  const failed     = outputs.filter(o => o.status === 'failed')

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: '#1A2B4A' }}>Deliverables</h1>
        <p className="mt-1 text-sm text-gray-500">
          All reports, estimates, and design outputs from your orders.
        </p>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="overflow-hidden rounded-xl bg-white p-5"
              style={{ boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.06)' }}>
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="rounded-xl p-5 text-sm" style={{ backgroundColor: 'rgba(229,62,62,0.05)', color: '#E53E3E', border: '1px solid rgba(229,62,62,0.2)' }}>
          <AlertCircle className="mb-1 inline h-4 w-4" /> {error}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && outputs.length === 0 && (
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

      {/* Deliverables grid */}
      {!loading && !error && outputs.length > 0 && (
        <div className="space-y-8">
          {inProgress.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">
                In Progress
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {inProgress.map(o => <DeliverableCard key={o.id} output={o} />)}
              </div>
            </section>
          )}

          {completed.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">
                Ready to Download
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {completed.map(o => <DeliverableCard key={o.id} output={o} />)}
              </div>
            </section>
          )}

          {failed.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">
                Failed
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {failed.map(o => <DeliverableCard key={o.id} output={o} />)}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
