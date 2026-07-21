'use client'

/**
 * /contractor/leads
 *
 * Contractor lead dashboard — shows ProfessionalAssignment records.
 * Active tab:  PENDING (countdown timer) + ACCEPTED
 * History tab: DECLINED | EXPIRED | FORFEITED
 *
 * Auth: redirects to /contractor/login if no session.
 * Actions: accept and decline wired to existing API routes.
 */

import { useEffect, useState, useCallback, useRef } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import {
  getMyLeads,
  acceptAssignment,
  declineAssignment,
  LeadAssignment,
  LeadCounts,
  LeadsApiError,
} from '../../../lib/api/contractor-leads'

// ─── Supabase init ────────────────────────────────────────────────────────────

function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

// ─── Constants ────────────────────────────────────────────────────────────────

const READINESS_LABELS: Record<string, string> = {
  NOT_READY:            'Not Ready',
  DESIGN_READY:         'Design Ready',
  PERMITS_SUBMITTED:    'Permits Submitted',
  CONSTRUCTION_READY:   'Construction Ready',
}

const READINESS_COLORS: Record<string, string> = {
  NOT_READY:            'bg-zinc-100 text-zinc-600',
  DESIGN_READY:         'bg-blue-50 text-blue-700',
  PERMITS_SUBMITTED:    'bg-amber-50 text-amber-700',
  CONSTRUCTION_READY:   'bg-green-50 text-green-700',
}

const STATUS_COLORS: Record<string, string> = {
  PENDING:   'bg-amber-50 text-amber-700 border-amber-200',
  ACCEPTED:  'bg-green-50 text-green-700 border-green-200',
  DECLINED:  'bg-zinc-100 text-zinc-600 border-zinc-200',
  EXPIRED:   'bg-red-50 text-red-700 border-red-200',
  FORFEITED: 'bg-red-50 text-red-700 border-red-200',
}

const STATUS_LABELS: Record<string, string> = {
  PENDING:   'Awaiting Response',
  ACCEPTED:  'Accepted',
  DECLINED:  'Declined',
  EXPIRED:   'Expired',
  FORFEITED: 'Forfeited',
}

const QUALITY_LABELS: Record<string, string> = {
  low:  'Standard',
  mid:  'Mid-range',
  high: 'Premium',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(value: number | null): string {
  if (value === null) return '—'
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000)     return `$${Math.round(value / 1_000)}K`
  return `$${value.toLocaleString()}`
}

function useCountdown(deadline: string | null): string {
  const [label, setLabel] = useState('')

  useEffect(() => {
    if (!deadline) return

    function tick() {
      const ms = new Date(deadline!).getTime() - Date.now()
      if (ms <= 0) { setLabel('Expired'); return }

      const h = Math.floor(ms / 3_600_000)
      const m = Math.floor((ms % 3_600_000) / 60_000)
      const s = Math.floor((ms % 60_000) / 1_000)

      if (h >= 24) {
        const d = Math.floor(h / 24)
        setLabel(`${d}d ${h % 24}h left`)
      } else if (h > 0) {
        setLabel(`${h}h ${m}m left`)
      } else if (m > 0) {
        setLabel(`${m}m ${s}s left`)
      } else {
        setLabel(`${s}s left`)
      }
    }

    tick()
    const id = setInterval(tick, 1_000)
    return () => clearInterval(id)
  }, [deadline])

  return label
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CountdownBadge({ deadline, status }: { deadline: string; status: string }) {
  const label = useCountdown(status === 'PENDING' ? deadline : null)
  if (status !== 'PENDING') return null

  const ms = new Date(deadline).getTime() - Date.now()
  const isUrgent = ms < 6 * 3_600_000 // < 6h

  return (
    <span className={[
      'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-black tabular-nums',
      isUrgent
        ? 'bg-red-50 text-red-700 animate-pulse'
        : 'bg-amber-50 text-amber-700',
    ].join(' ')}>
      <span>{isUrgent ? '⚡' : '⏱'}</span>
      {label}
    </span>
  )
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={[
      'inline-block rounded-full border px-2 py-0.5 text-xs font-black',
      STATUS_COLORS[status] ?? 'bg-zinc-100 text-zinc-600 border-zinc-200',
    ].join(' ')}>
      {STATUS_LABELS[status] ?? status}
    </span>
  )
}

function ReadinessBadge({ status }: { status: string | null }) {
  if (!status) return null
  return (
    <span className={[
      'inline-block rounded-full px-2 py-0.5 text-xs font-bold',
      READINESS_COLORS[status] ?? 'bg-zinc-100 text-zinc-600',
    ].join(' ')}>
      {READINESS_LABELS[status] ?? status.replace(/_/g, ' ')}
    </span>
  )
}

// ─── Decline dialog ───────────────────────────────────────────────────────────

interface DeclineDialogProps {
  assignment: LeadAssignment
  onConfirm: (reason: string) => void
  onCancel:  () => void
  loading:   boolean
}

function DeclineDialog({ assignment, onConfirm, onCancel, loading }: DeclineDialogProps) {
  const [reason, setReason] = useState('')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-base font-black text-zinc-900">Decline this lead?</h3>
        <p className="mt-1 text-sm text-zinc-600">
          {assignment.category} · {assignment.city}, {assignment.state}
        </p>
        <p className="mt-3 text-sm text-zinc-700">
          The lead will be forwarded to the next contractor in the rotation queue.
          This action cannot be undone.
        </p>

        <label className="mt-4 block text-xs font-black text-zinc-700">
          Reason (optional)
        </label>
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          maxLength={500}
          rows={3}
          className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-sky-400"
          placeholder="e.g. outside service area, capacity constraints…"
        />

        <div className="mt-4 flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 rounded-xl border border-zinc-200 py-2.5 text-sm font-black text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
          >
            Keep Lead
          </button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={loading}
            className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-black text-white hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? 'Declining…' : 'Decline Lead'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Assignment card ──────────────────────────────────────────────────────────

interface CardProps {
  assignment: LeadAssignment
  onAccept:  (id: string) => void
  onDecline: (a: LeadAssignment) => void
  acting:    string | null // assignmentId of in-progress action
}

function AssignmentCard({ assignment: a, onAccept, onDecline, acting }: CardProps) {
  const isBusy = acting === a.assignmentId

  return (
    <div className={[
      'rounded-2xl border bg-white p-4 shadow-sm transition',
      a.status === 'PENDING' && !a.isExpired
        ? 'border-amber-200'
        : 'border-black/10',
    ].join(' ')}>
      {/* Header row */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={a.status} />
          {a.status === 'PENDING' && !a.isExpired && (
            <CountdownBadge deadline={a.acceptDeadline} status={a.status} />
          )}
          {a.isExpired && a.status === 'PENDING' && (
            <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-black text-red-700">
              Deadline passed
            </span>
          )}
        </div>
        {a.constructionReadiness && (
          <ReadinessBadge status={a.constructionReadiness} />
        )}
      </div>

      {/* Lead info */}
      <div className="mt-3">
        <div className="text-sm font-black text-zinc-900">
          {a.category ?? 'General Contracting'}
          {a.projectType && (
            <span className="ml-2 text-xs font-medium text-zinc-500">
              · {a.projectType.replace(/_/g, ' ')}
            </span>
          )}
        </div>
        {a.description && (
          <p className="mt-0.5 line-clamp-2 text-xs text-zinc-600">{a.description}</p>
        )}
      </div>

      {/* Stats row */}
      <div className="mt-3 flex flex-wrap gap-4">
        {(a.city || a.state) && (
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wide text-zinc-400">Location</div>
            <div className="text-xs font-bold text-zinc-800">
              {[a.city, a.state].filter(Boolean).join(', ')}
            </div>
          </div>
        )}
        {a.estimatedValue !== null && (
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wide text-zinc-400">Est. Value</div>
            <div className="text-xs font-black text-green-700">{formatCurrency(a.estimatedValue)}</div>
          </div>
        )}
        {a.budget !== null && (
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wide text-zinc-400">Budget</div>
            <div className="text-xs font-bold text-zinc-800">{formatCurrency(a.budget)}</div>
          </div>
        )}
        {a.sqft !== null && (
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wide text-zinc-400">Sqft</div>
            <div className="text-xs font-bold text-zinc-800">{a.sqft.toLocaleString()} sf</div>
          </div>
        )}
        {a.qualityTier && (
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wide text-zinc-400">Tier</div>
            <div className="text-xs font-bold text-zinc-800">
              {QUALITY_LABELS[a.qualityTier] ?? a.qualityTier}
            </div>
          </div>
        )}
      </div>

      {/* Project link */}
      {a.projectName && (
        <div className="mt-3 rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-2 text-xs text-zinc-700">
          <span className="font-black">Project:</span> {a.projectName}
          {(a.projectCity || a.projectState) && (
            <span className="ml-1 text-zinc-500">
              · {[a.projectCity, a.projectState].filter(Boolean).join(', ')}
            </span>
          )}
        </div>
      )}

      {/* Timestamps */}
      <div className="mt-3 flex flex-wrap gap-4 text-[11px] text-zinc-400">
        <span>Offered {new Date(a.assignedAt).toLocaleDateString()}</span>
        {a.respondedAt && (
          <span>Responded {new Date(a.respondedAt).toLocaleDateString()}</span>
        )}
        {a.declineReason && (
          <span className="text-zinc-500">Reason: {a.declineReason}</span>
        )}
        {a.adminOverride && (
          <span className="text-sky-600 font-bold">Admin assigned</span>
        )}
      </div>

      {/* Actions */}
      {a.status === 'PENDING' && !a.isExpired && (
        <div className="mt-4 flex gap-3">
          <button
            onClick={() => onAccept(a.assignmentId)}
            disabled={isBusy}
            className="flex-1 rounded-xl bg-sky-600 py-2.5 text-sm font-black text-white hover:bg-sky-700 disabled:opacity-50 transition"
          >
            {isBusy ? 'Accepting…' : 'Accept Lead'}
          </button>
          <button
            onClick={() => onDecline(a)}
            disabled={isBusy}
            className="flex-1 rounded-xl border border-zinc-200 py-2.5 text-sm font-black text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 transition"
          >
            Decline
          </button>
        </div>
      )}

      {a.status === 'ACCEPTED' && (
        <div className="mt-4 rounded-xl bg-green-50 px-4 py-2.5 text-center text-sm font-black text-green-700">
          Lead accepted — your team will be in touch
        </div>
      )}
    </div>
  )
}

// ─── Empty states ─────────────────────────────────────────────────────────────

function EmptyActive() {
  return (
    <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 py-12 text-center">
      <div className="text-2xl">📭</div>
      <div className="mt-2 text-sm font-black text-zinc-700">No active leads right now</div>
      <div className="mt-1 text-xs text-zinc-500">
        You'll be notified when a new lead is assigned to you.
      </div>
    </div>
  )
}

function EmptyHistory() {
  return (
    <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 py-12 text-center">
      <div className="text-2xl">📋</div>
      <div className="mt-2 text-sm font-black text-zinc-700">No lead history yet</div>
      <div className="mt-1 text-xs text-zinc-500">
        Past accepted, declined, and expired leads will appear here.
      </div>
    </div>
  )
}

function NoProfileState() {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
      <div className="text-base font-black text-amber-900">Marketplace profile not set up</div>
      <p className="mt-1 text-sm text-amber-700">
        Complete your contractor profile to start receiving leads.
      </p>
      <a
        href="/contractor/profile"
        className="mt-3 inline-block rounded-xl bg-amber-600 px-4 py-2 text-sm font-black text-white hover:bg-amber-700"
      >
        Set Up Profile →
      </a>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

type Tab = 'active' | 'history'

export default function ContractorLeadsPage() {
  const [tab, setTab]                     = useState<Tab>('active')
  const [assignments, setAssignments]     = useState<LeadAssignment[]>([])
  const [counts, setCounts]               = useState<LeadCounts | null>(null)
  const [profileExists, setProfileExists] = useState(true)
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState<string | null>(null)
  const [acting, setActing]               = useState<string | null>(null)
  const [toast, setToast]                 = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [decliningFor, setDecliningFor]   = useState<LeadAssignment | null>(null)
  const toastTimer                        = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Auth gate ──────────────────────────────────────────────────────────────
  useEffect(() => {
    getSupabase().auth.getSession().then(({ data: { session } }) => {
      if (!session) window.location.href = '/contractor/login'
    })
  }, [])

  // ── Toast helper ───────────────────────────────────────────────────────────
  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast({ msg, type })
    toastTimer.current = setTimeout(() => setToast(null), 4_000)
  }

  // ── Fetch leads ────────────────────────────────────────────────────────────
  const fetchLeads = useCallback(async (selectedTab: Tab) => {
    setLoading(true)
    setError(null)
    try {
      const data = await getMyLeads({ tab: selectedTab })
      setAssignments(data.assignments)
      setCounts(data.counts)
      setProfileExists(data.profileExists)
    } catch (err) {
      if (err instanceof LeadsApiError && err.isUnauthenticated) {
        window.location.href = '/contractor/login'
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load leads')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchLeads(tab) }, [tab, fetchLeads])

  // ── Accept ─────────────────────────────────────────────────────────────────
  async function handleAccept(assignmentId: string) {
    setActing(assignmentId)
    try {
      await acceptAssignment(assignmentId)
      showToast('Lead accepted! Your team will reach out to the project owner.')
      fetchLeads(tab)
    } catch (err) {
      const msg = err instanceof LeadsApiError
        ? err.message
        : 'Failed to accept lead. It may have already expired or been claimed.'
      showToast(msg, 'error')
    } finally {
      setActing(null)
    }
  }

  // ── Decline ────────────────────────────────────────────────────────────────
  async function handleDeclineConfirm(reason: string) {
    if (!decliningFor) return
    const id = decliningFor.assignmentId
    setActing(id)
    setDecliningFor(null)
    try {
      await declineAssignment(id, reason || undefined)
      showToast('Lead declined. It has been forwarded to the next contractor.')
      fetchLeads(tab)
    } catch (err) {
      const msg = err instanceof LeadsApiError
        ? err.message
        : 'Failed to decline lead. Please try again.'
      showToast(msg, 'error')
    } finally {
      setActing(null)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const tabCls = (t: Tab) => [
    'relative rounded-xl px-4 py-2 text-sm font-black transition',
    tab === t
      ? 'bg-sky-50 text-sky-700'
      : 'text-zinc-600 hover:bg-zinc-100',
  ].join(' ')

  return (
    <div className="mx-auto max-w-2xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-black tracking-tight text-zinc-950">Lead Dashboard</h1>
        <p className="mt-0.5 text-sm text-zinc-500">
          Project leads assigned to your account via the Kealee rotation system.
        </p>
      </div>

      {/* No profile */}
      {!loading && !profileExists && <NoProfileState />}

      {profileExists && (
        <>
          {/* Tabs + counts */}
          <div className="mb-4 flex items-center gap-1">
            <button onClick={() => setTab('active')} className={tabCls('active')}>
              Active
              {counts && counts.active > 0 && (
                <span className="ml-1.5 rounded-full bg-sky-600 px-1.5 py-0.5 text-[10px] font-black text-white">
                  {counts.active}
                </span>
              )}
              {counts && counts.pending > 0 && (
                <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-amber-500" />
              )}
            </button>
            <button onClick={() => setTab('history')} className={tabCls('history')}>
              History
              {counts && counts.history > 0 && (
                <span className="ml-1.5 text-[11px] text-zinc-400">
                  {counts.history}
                </span>
              )}
            </button>
          </div>

          {/* Pending notice */}
          {tab === 'active' && counts && counts.pending > 0 && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5">
              <span className="text-base">⏰</span>
              <span className="text-sm font-black text-amber-800">
                {counts.pending} lead{counts.pending > 1 ? 's' : ''} waiting for your response
              </span>
            </div>
          )}

          {/* Content */}
          {loading ? (
            <div className="grid gap-3">
              {[1, 2].map(i => (
                <div key={i} className="h-40 animate-pulse rounded-2xl bg-zinc-100" />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm font-black text-red-700">{error}</p>
              <button
                onClick={() => fetchLeads(tab)}
                className="mt-2 text-xs font-bold text-red-600 underline"
              >
                Try again
              </button>
            </div>
          ) : assignments.length === 0 ? (
            tab === 'active' ? <EmptyActive /> : <EmptyHistory />
          ) : (
            <div className="grid gap-3">
              {assignments.map(a => (
                <AssignmentCard
                  key={a.assignmentId}
                  assignment={a}
                  onAccept={handleAccept}
                  onDecline={setDecliningFor}
                  acting={acting}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Decline dialog */}
      {decliningFor && (
        <DeclineDialog
          assignment={decliningFor}
          onConfirm={handleDeclineConfirm}
          onCancel={() => setDecliningFor(null)}
          loading={acting === decliningFor.assignmentId}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className={[
          'fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-2xl px-5 py-3 text-sm font-black shadow-lg',
          toast.type === 'success'
            ? 'bg-zinc-900 text-white'
            : 'bg-red-600 text-white',
        ].join(' ')}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}
