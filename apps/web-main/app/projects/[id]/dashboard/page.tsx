'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  CheckCircle, AlertCircle, Clock, Loader2,
  Wrench, FileText, ArrowRight, BarChart3,
  MessageSquare, RefreshCw,
} from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL || ''

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DashboardData {
  project: {
    id: string
    name: string
    status: string
    current_phase: string
    created_at: string
  }
  milestoneStats: {
    total: number
    completed: number
    overdue: number
    required: number
  }
  taskStats: {
    total: number
    inProgress: number
    completed: number
    overdue: number
  }
  coStats: {
    total: number
    pending: number
    approvedAmountCents: number
  }
  recentMilestones: Array<{
    id: string
    name: string
    phase: string
    status: string
    required: boolean
    due_date: string | null
    completed_at: string | null
  }>
  openRFIs: Array<{
    id: string
    subject: string
    status: string
    priority: string
    due_date: string | null
  }>
  changeOrders: Array<{
    id: string
    title: string
    status: string
    amount_cents: number
  }>
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const PHASE_COLORS: Record<string, string> = {
  PRE_DESIGN:       '#2ABFBF',
  ARCHITECT:        '#7C3AED',
  PERMIT:           '#E8793A',
  PRE_CONSTRUCTION: '#F59E0B',
  CONSTRUCTION:     '#38A169',
  CLOSEOUT:         '#1A2B4A',
}

const PHASE_LABELS: Record<string, string> = {
  PRE_DESIGN:       'Pre-Design',
  ARCHITECT:        'Architect',
  PERMIT:           'Permit',
  PRE_CONSTRUCTION: 'Pre-Construction',
  CONSTRUCTION:     'Construction',
  CLOSEOUT:         'Closeout',
}

const PHASES = Object.keys(PHASE_LABELS)

function formatCents(cents: number) {
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 0 })}`
}

function statusIcon(status: string) {
  if (status === 'COMPLETED') return <CheckCircle className="h-4 w-4 text-green-500" />
  if (status === 'BLOCKED') return <AlertCircle className="h-4 w-4 text-red-500" />
  if (status === 'IN_PROGRESS') return <Clock className="h-4 w-4 text-orange-400" />
  return <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
}

function priorityBadge(priority: string) {
  const colors: Record<string, string> = {
    URGENT: '#EF4444', HIGH: '#F97316', MEDIUM: '#F59E0B', LOW: '#6B7280',
  }
  const color = colors[priority] ?? '#6B7280'
  return (
    <span
      className="rounded-full px-1.5 py-0.5 text-xs font-bold uppercase"
      style={{ backgroundColor: `${color}15`, color }}
    >
      {priority}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function ProjectDashboardPage() {
  const params = useParams()
  const id = params?.id as string

  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboard = async () => {
    try {
      const res = await fetch(`${API}/os-pm/projects/${id}/dashboard`, { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to load dashboard')
      setData(await res.json())
      setError(null)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchDashboard() }, [id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin" style={{ color: '#E8793A' }} />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-400 mb-4" />
          <p className="text-gray-500 mb-4">{error ?? 'Dashboard unavailable'}</p>
          <button onClick={fetchDashboard} className="text-sm text-blue-600 hover:underline">
            Try again
          </button>
        </div>
      </div>
    )
  }

  const { project, milestoneStats, taskStats, coStats, recentMilestones, openRFIs, changeOrders } = data
  const currentPhaseColor = PHASE_COLORS[project.current_phase] ?? '#1A2B4A'
  const currentPhaseIdx = PHASES.indexOf(project.current_phase)
  const phasePct = Math.round(((currentPhaseIdx + 1) / PHASES.length) * 100)

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F7FAFC' }}>
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold font-display" style={{ color: '#1A2B4A' }}>
                {project.name}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className="rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-widest"
                  style={{ backgroundColor: `${currentPhaseColor}15`, color: currentPhaseColor }}
                >
                  {PHASE_LABELS[project.current_phase] ?? project.current_phase}
                </span>
                <span className="text-xs text-gray-400">{project.status}</span>
              </div>
            </div>
            <button
              onClick={fetchDashboard}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:border-gray-300"
            >
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">

        {/* Phase progress bar */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400">Project Phase</h2>
            <span className="text-sm font-bold" style={{ color: currentPhaseColor }}>{phasePct}% complete</span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-gray-100 mb-4">
            <div
              className="h-2.5 rounded-full transition-all"
              style={{ width: `${phasePct}%`, backgroundColor: currentPhaseColor }}
            />
          </div>
          <div className="flex justify-between">
            {PHASES.map((phase, i) => {
              const done = i < currentPhaseIdx
              const active = i === currentPhaseIdx
              const color = PHASE_COLORS[phase] ?? '#1A2B4A'
              return (
                <div key={phase} className="flex flex-col items-center gap-1">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: done || active ? color : '#E5E7EB' }}
                  />
                  <span className="text-xs text-gray-400 hidden sm:block">
                    {PHASE_LABELS[phase]}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Milestones</span>
            </div>
            <div className="text-3xl font-bold font-display" style={{ color: '#1A2B4A' }}>
              {milestoneStats.completed}/{milestoneStats.total}
            </div>
            {milestoneStats.overdue > 0 && (
              <div className="mt-1 text-xs text-red-500">{milestoneStats.overdue} overdue</div>
            )}
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <div className="flex items-center gap-2 mb-1">
              <Wrench className="h-4 w-4 text-orange-400" />
              <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Tasks</span>
            </div>
            <div className="text-3xl font-bold font-display" style={{ color: '#1A2B4A' }}>
              {taskStats.inProgress}
            </div>
            <div className="mt-1 text-xs text-gray-400">active · {taskStats.completed} done</div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <div className="flex items-center gap-2 mb-1">
              <MessageSquare className="h-4 w-4" style={{ color: '#7C3AED' }} />
              <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Open RFIs</span>
            </div>
            <div className="text-3xl font-bold font-display" style={{ color: '#1A2B4A' }}>
              {openRFIs.length}
            </div>
            <div className="mt-1 text-xs text-gray-400">awaiting response</div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="h-4 w-4" style={{ color: '#E8793A' }} />
              <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Change Orders</span>
            </div>
            <div className="text-3xl font-bold font-display" style={{ color: '#1A2B4A' }}>
              {formatCents(coStats.approvedAmountCents)}
            </div>
            <div className="mt-1 text-xs text-gray-400">
              approved · {coStats.pending} pending
            </div>
          </div>
        </div>

        {/* Two columns: milestones + RFIs */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Recent milestones */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4">Milestones</h3>
            <div className="space-y-3">
              {recentMilestones.length === 0 ? (
                <p className="text-sm text-gray-400 italic">No milestones yet.</p>
              ) : recentMilestones.map((m) => (
                <div key={m.id} className="flex items-start gap-3">
                  {statusIcon(m.status)}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700">{m.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span
                        className="rounded-full px-1.5 py-0.5 text-xs"
                        style={{ backgroundColor: `${PHASE_COLORS[m.phase]}15`, color: PHASE_COLORS[m.phase] ?? '#1A2B4A' }}
                      >
                        {PHASE_LABELS[m.phase] ?? m.phase}
                      </span>
                      {m.due_date && !m.completed_at && (
                        <span className="text-xs text-gray-400">
                          Due {new Date(m.due_date).toLocaleDateString()}
                        </span>
                      )}
                      {m.completed_at && (
                        <span className="text-xs text-green-500">
                          Done {new Date(m.completed_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Open RFIs */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4">Open RFIs</h3>
            <div className="space-y-3">
              {openRFIs.length === 0 ? (
                <p className="text-sm text-gray-400 italic">No open RFIs.</p>
              ) : openRFIs.map((rfi) => (
                <div key={rfi.id} className="flex items-start gap-3">
                  <FileText className="h-4 w-4 mt-0.5 text-gray-400 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700">{rfi.subject}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {priorityBadge(rfi.priority)}
                      {rfi.due_date && (
                        <span className="text-xs text-gray-400">
                          Due {new Date(rfi.due_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Change orders */}
        {changeOrders.length > 0 && (
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4">
              Recent Change Orders
            </h3>
            <div className="divide-y divide-gray-100">
              {changeOrders.map((co) => (
                <div key={co.id} className="flex items-center justify-between py-2.5">
                  <span className="text-sm text-gray-700">{co.title}</span>
                  <div className="flex items-center gap-3">
                    <span
                      className="rounded-full px-2 py-0.5 text-xs font-bold uppercase"
                      style={{
                        backgroundColor: co.status === 'APPROVED' ? '#38A16915' : co.status === 'PENDING' ? '#F59E0B15' : '#EF444415',
                        color: co.status === 'APPROVED' ? '#38A169' : co.status === 'PENDING' ? '#F59E0B' : '#EF4444',
                      }}
                    >
                      {co.status}
                    </span>
                    <span className="text-sm font-bold text-gray-700">{formatCents(co.amount_cents ?? 0)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA: move to next phase */}
        <div className="rounded-2xl p-5 border border-gray-200 bg-white flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-700">Ready to advance?</h3>
            <p className="text-sm text-gray-400 mt-0.5">
              When all required milestones for this phase are complete, advance to the next phase.
            </p>
          </div>
          <button
            onClick={async () => {
              const phaseIdx = PHASES.indexOf(project.current_phase)
              const next = PHASES[phaseIdx + 1]
              if (!next) return
              await fetch(`${API}/os-pm/projects/${id}/phase`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetPhase: next }),
              })
              fetchDashboard()
            }}
            className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white whitespace-nowrap"
            style={{ backgroundColor: currentPhaseColor }}
            disabled={currentPhaseIdx >= PHASES.length - 1}
          >
            Advance Phase <ArrowRight className="h-4 w-4" />
          </button>
        </div>

      </div>
    </div>
  )
}
