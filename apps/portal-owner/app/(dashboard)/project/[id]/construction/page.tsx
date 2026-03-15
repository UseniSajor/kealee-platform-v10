'use client'

/**
 * /project/[id]/construction — Owner's Construction OS Dashboard
 *
 * Read-only view of Construction OS data for project owners:
 * budget health, schedule milestones, open RFIs, and punch list status.
 * Backed by pm/* endpoints (owner has read access via feature gate).
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { constructionOS, type BudgetOverview, type RFI } from '@/lib/api/construction-os'

interface Props { params: { id: string } }

type Milestone = { id: string; name: string; date: string; status: string }

function fmt(n?: number, currency = 'USD') {
  if (n === undefined || n === null) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n)
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function daysFromNow(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000)
}

// ── Budget Summary Card ───────────────────────────────────────────────────────

function BudgetCard({ overview }: { overview: BudgetOverview }) {
  const isOver = overview.forecastAtComplete > overview.contractedAmount
  const pct    = Math.round(overview.percentComplete)
  const cpiOk  = overview.cpi >= 0.95

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold" style={{ color: '#1A2B4A' }}>Budget</h3>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cpiOk ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
          CPI {overview.cpi.toFixed(2)}
        </span>
      </div>

      <p className="text-2xl font-bold mb-0.5" style={{ color: '#1A2B4A' }}>
        {fmt(overview.contractedAmount, overview.currency)}
      </p>
      <p className="text-xs text-gray-500 mb-3">Contract value</p>

      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${Math.min(100, pct)}%`,
            backgroundColor: isOver ? '#EF4444' : '#2ABFBF',
          }}
        />
      </div>

      <div className="flex justify-between text-xs text-gray-500">
        <span>{pct}% spent · {fmt(overview.spentToDate, overview.currency)}</span>
        <span className={isOver ? 'text-rose-600 font-medium' : 'text-gray-400'}>
          Forecast: {fmt(overview.forecastAtComplete, overview.currency)}
        </span>
      </div>

      {overview.contingencyRemaining > 0 && (
        <p className="text-xs text-gray-400 mt-2">
          Contingency remaining: {fmt(overview.contingencyRemaining, overview.currency)}
        </p>
      )}
    </div>
  )
}

// ── Milestone Row ─────────────────────────────────────────────────────────────

function MilestoneRow({ milestone }: { milestone: Milestone }) {
  const days = daysFromNow(milestone.date)
  const isPast = days < 0
  const isDone = milestone.status === 'COMPLETED'

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-gray-100 last:border-0">
      <span className="text-lg shrink-0">
        {isDone ? '✅' : isPast ? '⚠️' : '🏁'}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: '#1A2B4A' }}>{milestone.name}</p>
        <p className="text-xs text-gray-400">{fmtDate(milestone.date)}</p>
      </div>
      <span className={`text-xs shrink-0 ${
        isDone ? 'text-emerald-600' : isPast ? 'text-rose-600 font-medium' : 'text-gray-400'
      }`}>
        {isDone ? 'Done' : isPast ? `${Math.abs(days)}d late` : days === 0 ? 'Today' : `${days}d`}
      </span>
    </div>
  )
}

// ── RFI Row ───────────────────────────────────────────────────────────────────

const PRIORITY_DOTS: Record<string, string> = {
  LOW: 'bg-gray-400', MEDIUM: 'bg-amber-400', HIGH: 'bg-orange-500', URGENT: 'bg-rose-500',
}

function RFIRow({ rfi }: { rfi: RFI }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-gray-100 last:border-0">
      <span className={`w-2 h-2 rounded-full shrink-0 mt-0.5 ${PRIORITY_DOTS[rfi.priority] ?? 'bg-gray-400'}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm truncate" style={{ color: '#1A2B4A' }}>RFI-{String(rfi.rfiNumber).padStart(3,'0')} · {rfi.subject}</p>
        <p className="text-xs text-gray-400">{fmtDate(rfi.createdAt)}</p>
      </div>
      <span className={`text-xs shrink-0 px-2 py-0.5 rounded-full ${
        rfi.status === 'ANSWERED' ? 'bg-emerald-50 text-emerald-700'
          : rfi.status === 'OPEN' ? 'bg-blue-50 text-blue-700'
          : 'bg-gray-100 text-gray-500'
      }`}>
        {rfi.status}
      </span>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function OwnerConstructionPage({ params }: Props) {
  const { id } = params
  const [budget,     setBudget]     = useState<BudgetOverview | null>(null)
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [rfis,       setRfis]       = useState<RFI[]>([])
  const [punchStats, setPunchStats] = useState<Record<string, number>>({})
  const [rfiStats,   setRfiStats]   = useState<Record<string, number>>({})
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const results = await Promise.allSettled([
        constructionOS.budget.overview(id),
        constructionOS.schedule.milestones(id),
        constructionOS.rfis.list({ projectId: id, status: 'OPEN', limit: 5 }),
        constructionOS.punchList.stats(id),
        constructionOS.rfis.stats(id),
      ])

      if (results[0].status === 'fulfilled') setBudget(results[0].value)
      if (results[1].status === 'fulfilled') setMilestones(results[1].value.milestones)
      if (results[2].status === 'fulfilled') setRfis(results[2].value.data)
      if (results[3].status === 'fulfilled') setPunchStats(results[3].value.stats)
      if (results[4].status === 'fulfilled') setRfiStats(results[4].value.stats)

      if (results.every(r => r.status === 'rejected')) {
        setError('Could not load construction data')
      }
      setLoading(false)
    }
    load()
  }, [id])

  const openRFIs     = rfiStats.open    ?? 0
  const urgentRFIs   = rfiStats.urgent  ?? 0
  const openPunch    = (punchStats.OPEN ?? 0) + (punchStats.IN_PROGRESS ?? 0)
  const verifiedPunch = punchStats.VERIFIED ?? 0
  const upcomingMs   = milestones
    .filter(m => m.status !== 'COMPLETED')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5)
  const completedMs  = milestones.filter(m => m.status === 'COMPLETED').length

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F7FA' }}>
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <Link href={`/project/${id}`} className="hover:text-gray-700">← Project</Link>
            </div>
            <h1 className="text-xl font-bold" style={{ color: '#1A2B4A' }}>Construction OS</h1>
            <p className="text-xs text-gray-400 mt-0.5">Live project health overview</p>
          </div>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-6 py-6 space-y-5">
        {loading && (
          <div className="text-center py-16 text-gray-400 animate-pulse">Loading construction data...</div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>
        )}

        {!loading && (
          <>
            {/* Summary bar */}
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  label: 'Open RFIs',
                  value: openRFIs,
                  sub:   urgentRFIs > 0 ? `${urgentRFIs} urgent` : null,
                  color: openRFIs > 0 ? '#E8793A' : '#38A169',
                },
                {
                  label: 'Punch Items',
                  value: openPunch,
                  sub:   verifiedPunch > 0 ? `${verifiedPunch} verified` : null,
                  color: openPunch > 0 ? '#E8793A' : '#38A169',
                },
                {
                  label: 'Milestones',
                  value: `${completedMs}/${milestones.length}`,
                  sub:   upcomingMs[0] ? `Next: ${fmtDate(upcomingMs[0].date)}` : 'All complete',
                  color: '#2ABFBF',
                },
              ].map(s => (
                <div key={s.label} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm text-center">
                  <p className="text-2xl font-bold font-mono" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                  {s.sub && <p className="text-xs mt-1" style={{ color: s.color }}>{s.sub}</p>}
                </div>
              ))}
            </div>

            {/* Budget */}
            {budget && <BudgetCard overview={budget} />}

            {/* Milestones */}
            {milestones.length > 0 && (
              <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-100 px-5 py-3">
                  <h3 className="text-sm font-semibold" style={{ color: '#1A2B4A' }}>
                    Milestones ({completedMs}/{milestones.length} complete)
                  </h3>
                </div>
                <div className="px-5 py-1">
                  {[...milestones]
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    .slice(0, 8)
                    .map(m => <MilestoneRow key={m.id} milestone={m} />)
                  }
                </div>
              </div>
            )}

            {/* Open RFIs */}
            {rfis.length > 0 && (
              <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-100 px-5 py-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold" style={{ color: '#1A2B4A' }}>Open RFIs</h3>
                  {openRFIs > rfis.length && (
                    <span className="text-xs text-gray-400">{openRFIs - rfis.length} more</span>
                  )}
                </div>
                <div className="px-5 py-1">
                  {rfis.map(r => <RFIRow key={r.id} rfi={r} />)}
                </div>
              </div>
            )}

            {/* Punch List Summary */}
            {Object.keys(punchStats).length > 0 && (
              <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-100 px-5 py-3">
                  <h3 className="text-sm font-semibold" style={{ color: '#1A2B4A' }}>Punch List</h3>
                </div>
                <div className="px-5 py-4 grid grid-cols-4 gap-3">
                  {[
                    { label: 'Open',        value: punchStats.OPEN        ?? 0, color: '#3B82F6' },
                    { label: 'In Progress', value: punchStats.IN_PROGRESS ?? 0, color: '#F59E0B' },
                    { label: 'Resolved',    value: punchStats.RESOLVED    ?? 0, color: '#14B8A6' },
                    { label: 'Verified',    value: punchStats.VERIFIED    ?? 0, color: '#22C55E' },
                  ].map(s => (
                    <div key={s.label} className="text-center">
                      <p className="text-xl font-bold font-mono" style={{ color: s.color }}>{s.value}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!budget && milestones.length === 0 && rfis.length === 0 && !error && (
              <div className="rounded-xl border border-gray-200 bg-white py-16 text-center shadow-sm">
                <p className="text-3xl mb-3">🏗️</p>
                <p className="text-sm text-gray-500">Construction OS not yet activated for this project</p>
                <p className="text-xs text-gray-400 mt-1">Data will appear once construction begins</p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
