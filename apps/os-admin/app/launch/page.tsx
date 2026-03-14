'use client'

/**
 * /launch — P9 Admin Launch Control Panel
 *
 * Ops-facing page for managing the national marketplace launch:
 * - Contractor onboarding queue (approve / reject)
 * - Region launch controls
 * - Cohort management
 * - Live funnel stats
 */

import { useState, useEffect } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

// ── Types ─────────────────────────────────────────────────────────────────────

interface OnboardingRecord {
  id:             string
  userId:         string
  email:          string
  stage:          string
  assignedRegion: string | null
  createdAt:      string
  cohort:         { name: string } | null
}

interface FunnelStats {
  byStage:           Record<string, number>
  conversions:       Array<{ from: string; to: string; rate: number }>
  total:             number
  approved:          number
  rejected:          number
  avgDaysToApproval: number
}

interface Region {
  id:                    string
  name:                  string
  slug:                  string
  isLaunched:            boolean
  launchedAt:            string | null
  currentContractorCount: number
  targetContractorCount:  number
}

interface Cohort {
  id:         string
  name:       string
  regionSlug: string
  targetSize: number
  currentSize: number
  isActive:   boolean
  inviteCode: string | null
  _count:     { onboardings: number }
}

// ── API helpers ───────────────────────────────────────────────────────────────

async function api<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...opts.headers },
    credentials: 'include',
  })
  if (!res.ok) {
    const b = await res.json().catch(() => ({}))
    throw new Error((b as any).error ?? `HTTP ${res.status}`)
  }
  return res.json()
}

// ── Stage badge ───────────────────────────────────────────────────────────────

const STAGE_STYLES: Record<string, string> = {
  REGISTRATION:       'bg-gray-700 text-gray-300',
  EMAIL_VERIFIED:     'bg-blue-900 text-blue-300',
  PROFILE_BASIC:      'bg-indigo-900 text-indigo-300',
  PROFILE_SERVICES:   'bg-purple-900 text-purple-300',
  DOCUMENTS_UPLOADED: 'bg-amber-900 text-amber-300',
  UNDER_REVIEW:       'bg-orange-900 text-orange-300',
  APPROVED:           'bg-emerald-900 text-emerald-300',
  REJECTED:           'bg-rose-900 text-rose-300',
  ACTIVE:             'bg-teal-900 text-teal-300',
}

function StageBadge({ stage }: { stage: string }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STAGE_STYLES[stage] ?? 'bg-gray-700 text-gray-300'}`}>
      {stage.replace(/_/g, ' ')}
    </span>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LaunchControlPage() {
  const [tab,        setTab]       = useState<'queue' | 'regions' | 'cohorts' | 'stats'>('queue')
  const [queue,      setQueue]     = useState<OnboardingRecord[]>([])
  const [stats,      setStats]     = useState<FunnelStats | null>(null)
  const [regions,    setRegions]   = useState<Region[]>([])
  const [cohorts,    setCohorts]   = useState<Cohort[]>([])
  const [loading,    setLoading]   = useState(true)
  const [error,      setError]     = useState<string | null>(null)
  const [actionBusy, setActionBusy] = useState<string | null>(null)

  // Reject modal state
  const [rejectTarget,  setRejectTarget]  = useState<OnboardingRecord | null>(null)
  const [rejectReason,  setRejectReason]  = useState('')

  // New cohort modal state
  const [showCohortForm, setShowCohortForm] = useState(false)
  const [cohortForm,     setCohortForm]     = useState({ name: '', regionSlug: '', targetSize: 25, inviteCode: '' })

  async function fetchAll() {
    try {
      setLoading(true)
      const [queueRes, statsRes, regionsRes, cohortsRes] = await Promise.allSettled([
        api<{ items: OnboardingRecord[] }>('/marketplace/onboarding/admin/list?stage=UNDER_REVIEW&limit=100'),
        api<FunnelStats>('/marketplace/onboarding/admin/stats'),
        api<{ regions: Region[] }>('/marketplace/launch/regions'),
        api<{ cohorts: Cohort[] }>('/marketplace/cohorts'),
      ])
      if (queueRes.status === 'fulfilled')   setQueue(queueRes.value.items)
      if (statsRes.status === 'fulfilled')   setStats(statsRes.value)
      if (regionsRes.status === 'fulfilled') setRegions(regionsRes.value.regions)
      if (cohortsRes.status === 'fulfilled') setCohorts(cohortsRes.value.cohorts)
      setError(null)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  async function handleApprove(rec: OnboardingRecord) {
    setActionBusy(rec.userId)
    try {
      await api(`/marketplace/onboarding/admin/${rec.userId}/approve`, { method: 'POST' })
      setQueue(prev => prev.filter(r => r.userId !== rec.userId))
      if (stats) setStats(s => s ? { ...s, approved: s.approved + 1 } : s)
    } finally {
      setActionBusy(null)
    }
  }

  async function handleRejectConfirm() {
    if (!rejectTarget || rejectReason.length < 10) return
    setActionBusy(rejectTarget.userId)
    try {
      await api(`/marketplace/onboarding/admin/${rejectTarget.userId}/reject`, {
        method: 'POST',
        body:   JSON.stringify({ reason: rejectReason }),
      })
      setQueue(prev => prev.filter(r => r.userId !== rejectTarget.userId))
    } finally {
      setActionBusy(null)
      setRejectTarget(null)
      setRejectReason('')
    }
  }

  async function handleLaunchRegion(id: string) {
    setActionBusy(id)
    try {
      await api(`/marketplace/launch/regions/${id}/launch`, { method: 'POST' })
      setRegions(prev => prev.map(r => r.id === id ? { ...r, isLaunched: true, launchedAt: new Date().toISOString() } : r))
    } finally {
      setActionBusy(null)
    }
  }

  async function handleCreateCohort() {
    await api('/marketplace/cohorts', {
      method: 'POST',
      body:   JSON.stringify(cohortForm),
    })
    setShowCohortForm(false)
    setCohortForm({ name: '', regionSlug: '', targetSize: 25, inviteCode: '' })
    fetchAll()
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-400 animate-pulse">Loading launch control...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Reject Modal */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl border border-white/10 p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-1">Reject Contractor</h3>
            <p className="text-sm text-gray-400 mb-4">{rejectTarget.email}</p>
            <textarea
              className="w-full bg-gray-800 rounded-lg border border-white/10 text-white text-sm p-3 resize-none h-24 focus:outline-none focus:ring-2 focus:ring-rose-500"
              placeholder="Reason for rejection (min 10 chars)…"
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => { setRejectTarget(null); setRejectReason('') }}
                className="flex-1 py-2 rounded-lg border border-white/10 text-gray-300 text-sm hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectConfirm}
                disabled={rejectReason.length < 10 || actionBusy === rejectTarget.userId}
                className="flex-1 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold disabled:opacity-50"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New cohort modal */}
      {showCohortForm && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl border border-white/10 p-6 w-full max-w-md space-y-3">
            <h3 className="text-lg font-bold">New Launch Cohort</h3>
            {[
              { label: 'Cohort Name',   field: 'name',       placeholder: 'DC Wave 1' },
              { label: 'Region Slug',   field: 'regionSlug', placeholder: 'dc-metro' },
              { label: 'Invite Code',   field: 'inviteCode', placeholder: 'KEALEE-DC-01 (optional)' },
            ].map(({ label, field, placeholder }) => (
              <div key={field}>
                <label className="text-xs text-gray-400 mb-1 block">{label}</label>
                <input
                  type="text"
                  placeholder={placeholder}
                  value={(cohortForm as any)[field]}
                  onChange={e => setCohortForm(f => ({ ...f, [field]: e.target.value }))}
                  className="w-full bg-gray-800 rounded-lg border border-white/10 text-white text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            ))}
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Target Size</label>
              <input
                type="number"
                value={cohortForm.targetSize}
                onChange={e => setCohortForm(f => ({ ...f, targetSize: Number(e.target.value) }))}
                className="w-full bg-gray-800 rounded-lg border border-white/10 text-white text-sm px-3 py-2 focus:outline-none"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowCohortForm(false)}
                className="flex-1 py-2 rounded-lg border border-white/10 text-gray-300 text-sm hover:bg-white/5">
                Cancel
              </button>
              <button onClick={handleCreateCohort}
                disabled={!cohortForm.name || !cohortForm.regionSlug}
                className="flex-1 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold disabled:opacity-50">
                Create Cohort
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Launch Control</h1>
            <p className="text-xs text-gray-500 mt-0.5">P9 · National Marketplace Operations</p>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-400">
            {stats && (
              <>
                <span className="text-amber-400 font-medium">{queue.length} pending review</span>
                <span className="text-emerald-400">{stats.approved} approved</span>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-white/10 px-6">
        <div className="max-w-7xl mx-auto flex gap-1">
          {(['queue', 'regions', 'cohorts', 'stats'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-3 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
                tab === t ? 'border-teal-400 text-teal-400' : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              {t === 'queue' ? `Queue ${queue.length > 0 ? `(${queue.length})` : ''}` : t}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-8">

        {/* QUEUE TAB */}
        {tab === 'queue' && (
          <div>
            <p className="text-sm text-gray-400 mb-4">
              Contractors who have uploaded documents and are awaiting manual verification.
            </p>
            {queue.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-gray-900 py-16 text-center">
                <p className="text-gray-500">No contractors pending review.</p>
              </div>
            ) : (
              <div className="rounded-xl border border-white/10 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-900 text-left">
                    <tr>
                      {['Email', 'Stage', 'Region', 'Cohort', 'Submitted', 'Actions'].map(h => (
                        <th key={h} className="px-4 py-3 text-xs text-gray-400 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {queue.map(rec => (
                      <tr key={rec.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3 text-white">{rec.email}</td>
                        <td className="px-4 py-3"><StageBadge stage={rec.stage} /></td>
                        <td className="px-4 py-3 text-gray-400">{rec.assignedRegion ?? '—'}</td>
                        <td className="px-4 py-3 text-gray-400">{rec.cohort?.name ?? '—'}</td>
                        <td className="px-4 py-3 text-gray-500">{new Date(rec.createdAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApprove(rec)}
                              disabled={actionBusy === rec.userId}
                              className="px-3 py-1 bg-emerald-700 hover:bg-emerald-600 text-white text-xs rounded-lg disabled:opacity-50"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => setRejectTarget(rec)}
                              disabled={actionBusy === rec.userId}
                              className="px-3 py-1 bg-rose-800 hover:bg-rose-700 text-white text-xs rounded-lg disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* REGIONS TAB */}
        {tab === 'regions' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {regions.map(r => {
              const pct = r.targetContractorCount > 0
                ? Math.min(100, Math.round((r.currentContractorCount / r.targetContractorCount) * 100))
                : 0
              return (
                <div key={r.id} className="rounded-xl border border-white/10 bg-gray-900 p-5">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold">{r.name}</p>
                      <p className="text-xs text-gray-500 font-mono">{r.slug}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      r.isLaunched ? 'bg-emerald-900/50 text-emerald-400' : 'bg-gray-700 text-gray-400'
                    }`}>
                      {r.isLaunched ? 'LIVE' : 'PENDING'}
                    </span>
                  </div>
                  <div className="mt-3 mb-4">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>{r.currentContractorCount} contractors</span>
                      <span>Target {r.targetContractorCount}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/10">
                      <div className="h-1.5 rounded-full bg-teal-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  {!r.isLaunched && (
                    <button
                      onClick={() => handleLaunchRegion(r.id)}
                      disabled={actionBusy === r.id}
                      className="w-full py-2 bg-teal-700 hover:bg-teal-600 text-white text-sm rounded-lg font-semibold disabled:opacity-50"
                    >
                      Launch Region
                    </button>
                  )}
                  {r.isLaunched && (
                    <p className="text-xs text-gray-500 text-center">
                      Launched {r.launchedAt ? new Date(r.launchedAt).toLocaleDateString() : '—'}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* COHORTS TAB */}
        {tab === 'cohorts' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-gray-400">Manage contractor onboarding cohorts by region.</p>
              <button
                onClick={() => setShowCohortForm(true)}
                className="px-4 py-2 bg-teal-700 hover:bg-teal-600 text-white text-sm rounded-lg font-semibold"
              >
                + New Cohort
              </button>
            </div>
            <div className="rounded-xl border border-white/10 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-900 text-left">
                  <tr>
                    {['Name', 'Region', 'Members', 'Target', 'Invite Code', 'Status'].map(h => (
                      <th key={h} className="px-4 py-3 text-xs text-gray-400 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {cohorts.map(c => (
                    <tr key={c.id} className="hover:bg-white/5">
                      <td className="px-4 py-3 font-medium">{c.name}</td>
                      <td className="px-4 py-3 text-gray-400 font-mono text-xs">{c.regionSlug}</td>
                      <td className="px-4 py-3">{c._count.onboardings}</td>
                      <td className="px-4 py-3 text-gray-400">{c.targetSize}</td>
                      <td className="px-4 py-3 font-mono text-xs text-teal-400">{c.inviteCode ?? '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          c.isActive ? 'bg-emerald-900/50 text-emerald-400' : 'bg-gray-700 text-gray-400'
                        }`}>
                          {c.isActive ? 'OPEN' : 'CLOSED'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {cohorts.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                        No cohorts created yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* STATS TAB */}
        {tab === 'stats' && stats && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">Funnel</h2>
              <div className="space-y-2">
                {Object.entries(stats.byStage).map(([stage, count]) => (
                  <div key={stage} className="flex items-center gap-3">
                    <StageBadge stage={stage} />
                    <div className="flex-1 h-5 bg-white/5 rounded overflow-hidden">
                      <div
                        className="h-5 bg-teal-700/50"
                        style={{ width: `${stats.total > 0 ? Math.round((count / stats.total) * 100) : 0}%` }}
                      />
                    </div>
                    <span className="text-sm font-mono w-8 text-right">{count}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">Conversion Rates</h2>
              <div className="space-y-2">
                {stats.conversions.map(c => (
                  <div key={`${c.from}-${c.to}`} className="flex items-center justify-between bg-gray-900 rounded-lg px-4 py-2">
                    <span className="text-xs text-gray-400">
                      {c.from.replace(/_/g, ' ')} → {c.to.replace(/_/g, ' ')}
                    </span>
                    <span className={`text-sm font-mono font-bold ${
                      c.rate >= 70 ? 'text-emerald-400' : c.rate >= 50 ? 'text-amber-400' : 'text-rose-400'
                    }`}>
                      {c.rate}%
                    </span>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-3 mt-6">
                <div className="bg-gray-900 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-white">{stats.total}</p>
                  <p className="text-xs text-gray-400 mt-1">Total</p>
                </div>
                <div className="bg-gray-900 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-emerald-400">{stats.approved}</p>
                  <p className="text-xs text-gray-400 mt-1">Approved</p>
                </div>
                <div className="bg-gray-900 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-teal-400">{stats.avgDaysToApproval}d</p>
                  <p className="text-xs text-gray-400 mt-1">Avg to Approval</p>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  )
}
