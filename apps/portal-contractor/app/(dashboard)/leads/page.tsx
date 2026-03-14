'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Megaphone, MapPin, DollarSign, Clock, ChevronRight,
  CheckCircle, XCircle, AlertTriangle, Cpu, Activity,
} from 'lucide-react'
import {
  getContractorLeads, acceptAssignment, declineAssignment,
} from '@/lib/api/contractor'
import type { Lead, LeadCounts, LeadTab } from '@/lib/api/contractor'

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatCountdown(deadline: string | null): { label: string; urgent: boolean } {
  if (!deadline) return { label: '—', urgent: false }
  const ms = new Date(deadline).getTime() - Date.now()
  if (ms <= 0) return { label: 'Expired', urgent: true }
  const h = Math.floor(ms / 3_600_000)
  const m = Math.floor((ms % 3_600_000) / 60_000)
  if (h < 6) return { label: `${h}h ${m}m`, urgent: true }
  if (h < 24) return { label: `${h}h ${m}m`, urgent: false }
  const d = Math.floor(h / 24)
  return { label: `${d}d ${h % 24}h`, urgent: false }
}

function formatBudget(min: number | null, max: number | null): string {
  if (!min && !max) return 'Budget TBD'
  const fmt = (n: number) => n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : `$${(n / 1000).toFixed(0)}K`
  if (min && max) return `${fmt(min)} – ${fmt(max)}`
  if (min) return `From ${fmt(min)}`
  return `Up to ${fmt(max!)}`
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  PENDING:   { bg: 'rgba(234,179,8,0.12)',  text: '#92400E' },
  ACCEPTED:  { bg: 'rgba(56,161,105,0.1)',  text: '#38A169' },
  DECLINED:  { bg: 'rgba(107,114,128,0.1)', text: '#6B7280' },
  EXPIRED:   { bg: 'rgba(229,62,62,0.08)',  text: '#C53030' },
  FORFEITED: { bg: 'rgba(107,114,128,0.1)', text: '#6B7280' },
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-gray-200 ${className ?? ''}`} />
}

// ── Decline dialog ─────────────────────────────────────────────────────────────

function DeclineDialog({
  open,
  onClose,
  onConfirm,
  busy,
}: {
  open: boolean
  onClose: () => void
  onConfirm: (reason: string) => void
  busy: boolean
}) {
  const [reason, setReason] = useState('')
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
        <h3 className="font-display mb-1 text-base font-bold" style={{ color: '#1A2B4A' }}>
          Decline this lead?
        </h3>
        <p className="mb-4 text-sm text-gray-500">This will remove the assignment. Optional: tell us why.</p>
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          rows={3}
          placeholder="Reason (optional)..."
          className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:outline-none"
          onFocus={e => { e.target.style.borderColor = '#2ABFBF'; e.target.style.boxShadow = '0 0 0 1px #2ABFBF' }}
          onBlur={e => { e.target.style.borderColor = '#d1d5db'; e.target.style.boxShadow = 'none' }}
        />
        <div className="mt-4 flex gap-3">
          <button
            onClick={onClose}
            disabled={busy}
            className="flex-1 rounded-lg border border-gray-300 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={busy}
            className="flex-1 rounded-lg py-2 text-sm font-medium text-white disabled:opacity-50"
            style={{ backgroundColor: '#E53E3E' }}
          >
            {busy ? 'Declining…' : 'Decline'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Lead card ──────────────────────────────────────────────────────────────────

function LeadCard({
  assignment,
  onAccept,
  onDecline,
  busy,
}: {
  assignment: Lead
  onAccept: (id: string) => void
  onDecline: (id: string) => void
  busy: boolean
}) {
  const { label: countdown, urgent } = formatCountdown(assignment.acceptDeadline)
  const lead = assignment.lead
  const sc = STATUS_COLORS[assignment.status] ?? STATUS_COLORS['PENDING']
  const isHistory = ['DECLINED', 'EXPIRED', 'FORFEITED'].includes(assignment.status)

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      {/* Header */}
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex-1">
          <h3 className="font-display font-semibold leading-tight" style={{ color: '#1A2B4A' }}>
            {lead?.title ?? lead?.project?.name ?? 'Unnamed Lead'}
          </h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-gray-500">
            {lead?.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />{lead.location}
              </span>
            )}
            {(lead?.budget || lead?.budgetMax) && (
              <span className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                {formatBudget(lead.budget ?? null, lead.budgetMax ?? null)}
              </span>
            )}
            <span className="text-gray-400">
              {new Date(assignment.assignedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          </div>
        </div>

        <span
          className="shrink-0 rounded-full px-2.5 py-1 text-xs font-medium"
          style={{ backgroundColor: sc.bg, color: sc.text }}
        >
          {assignment.isExpired && assignment.status === 'PENDING' ? 'EXPIRED' : assignment.status}
        </span>
      </div>

      {/* Description */}
      {lead?.description && (
        <p className="mb-3 text-sm text-gray-600 line-clamp-2">{lead.description}</p>
      )}

      {/* Meta badges */}
      <div className="mb-3 flex flex-wrap gap-2">
        {lead?.twinTier && (
          <span
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium"
            style={{ backgroundColor: 'rgba(232,121,58,0.1)', color: '#E8793A' }}
          >
            <Cpu className="h-3 w-3" />Twin {lead.twinTier}
          </span>
        )}
        {lead?.lifecyclePhase && (
          <span
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium"
            style={{ backgroundColor: 'rgba(42,191,191,0.1)', color: '#2ABFBF' }}
          >
            <Activity className="h-3 w-3" />{lead.lifecyclePhase}
          </span>
        )}
        {lead?.projectType && (
          <span className="rounded border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs text-gray-600">
            {lead.projectType.replace(/_/g, ' ')}
          </span>
        )}
      </div>

      {/* Countdown / Actions */}
      {assignment.status === 'PENDING' && !assignment.isExpired && (
        <div className="flex items-center gap-3">
          <div
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium"
            style={{
              backgroundColor: urgent ? 'rgba(229,62,62,0.08)' : 'rgba(234,179,8,0.1)',
              color: urgent ? '#C53030' : '#92400E',
              animation: urgent ? 'pulse 2s infinite' : 'none',
            }}
          >
            <Clock className="h-3.5 w-3.5" />
            {countdown} remaining
          </div>
          <div className="ml-auto flex gap-2">
            <button
              onClick={() => onDecline(assignment.id)}
              disabled={busy}
              className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              <XCircle className="h-3.5 w-3.5" />Decline
            </button>
            <button
              onClick={() => onAccept(assignment.id)}
              disabled={busy}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
              style={{ backgroundColor: '#38A169' }}
            >
              <CheckCircle className="h-3.5 w-3.5" />Accept
            </button>
          </div>
        </div>
      )}

      {assignment.status === 'ACCEPTED' && (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span>Accepted — awaiting project match</span>
          <button className="ml-auto flex items-center gap-1 font-medium" style={{ color: '#2ABFBF' }}>
            View details <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      )}

      {isHistory && (
        <p className="text-xs text-gray-400">
          {assignment.status === 'DECLINED' && assignment.respondedAt
            ? `Declined ${new Date(assignment.respondedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
            : assignment.status}
        </p>
      )}
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function LeadsPage() {
  const [tab, setTab] = useState<LeadTab>('active')
  const [assignments, setAssignments] = useState<Lead[]>([])
  const [counts, setCounts] = useState<LeadCounts | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [declineTarget, setDeclineTarget] = useState<string | null>(null)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  const load = useCallback(async (t: LeadTab) => {
    setLoading(true)
    setError(null)
    try {
      const data = await getContractorLeads(t)
      setAssignments(data.assignments)
      setCounts(data.counts)
    } catch (err: any) {
      setError(err.message ?? 'Failed to load leads')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load(tab) }, [tab, load])

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 3500)
  }

  const handleAccept = async (id: string) => {
    setBusyId(id)
    try {
      await acceptAssignment(id)
      showToast('success', 'Lead accepted!')
      await load(tab)
    } catch (err: any) {
      showToast('error', err.message ?? 'Could not accept lead')
    } finally {
      setBusyId(null)
    }
  }

  const handleDeclineConfirm = async (reason: string) => {
    if (!declineTarget) return
    setBusyId(declineTarget)
    try {
      await declineAssignment(declineTarget, reason || undefined)
      setDeclineTarget(null)
      showToast('success', 'Lead declined')
      await load(tab)
    } catch (err: any) {
      showToast('error', err.message ?? 'Could not decline lead')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div
          className="fixed right-4 top-20 z-50 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lg"
          style={{ backgroundColor: toast.type === 'success' ? '#38A169' : '#E53E3E' }}
        >
          {toast.msg}
        </div>
      )}

      <DeclineDialog
        open={!!declineTarget}
        onClose={() => setDeclineTarget(null)}
        onConfirm={handleDeclineConfirm}
        busy={!!busyId}
      />

      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold" style={{ color: '#1A2B4A' }}>My Leads</h1>
          <p className="mt-1 text-sm text-gray-500">
            {counts ? (
              <>
                {counts.pending} pending · {counts.accepted} accepted · {counts.history} history
              </>
            ) : 'Loading…'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex gap-6">
          {([
            { key: 'active' as const, label: 'Active', count: counts?.active },
            { key: 'history' as const, label: 'History', count: counts?.history },
            { key: 'all' as const, label: 'All', count: counts?.total },
          ]).map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="flex items-center gap-1.5 border-b-2 pb-3 text-sm font-medium transition-colors"
              style={{
                borderColor: tab === t.key ? '#E8793A' : 'transparent',
                color: tab === t.key ? '#E8793A' : '#6B7280',
              }}
            >
              {t.label}
              {t.count !== undefined && (
                <span
                  className="rounded-full px-2 py-0.5 text-xs font-semibold"
                  style={{
                    backgroundColor: tab === t.key ? 'rgba(232,121,58,0.1)' : '#F3F4F6',
                    color: tab === t.key ? '#E8793A' : '#6B7280',
                  }}
                >
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          <p className="text-sm text-red-700">{error}</p>
          <button
            onClick={() => load(tab)}
            className="ml-auto text-xs font-medium text-red-700 underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}
        </div>
      ) : assignments.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white py-16 text-center">
          <Megaphone className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-sm font-medium" style={{ color: '#1A2B4A' }}>
            No leads in this tab
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {tab === 'active'
              ? 'New leads matched to your profile will appear here'
              : 'No historical records yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {assignments.map(a => (
            <LeadCard
              key={a.id}
              assignment={a}
              onAccept={handleAccept}
              onDecline={(id) => setDeclineTarget(id)}
              busy={busyId === a.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}
