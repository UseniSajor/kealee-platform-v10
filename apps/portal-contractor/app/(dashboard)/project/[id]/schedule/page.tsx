'use client'

/**
 * /project/[id]/schedule — Project Schedule
 *
 * Contractors view project schedule with milestones and task list.
 * Backed by:
 *   GET /pm/schedule?projectId=...
 *   GET /pm/schedule/milestones?projectId=...
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { constructionOS, type ScheduleItem } from '../../../../../lib/api/construction-os'

interface Props { params: { id: string } }

type Milestone = { id: string; name: string; date: string; status: string }

const STATUS_STYLES: Record<string, string> = {
  NOT_STARTED: 'bg-gray-800 text-gray-400',
  IN_PROGRESS: 'bg-blue-900/50 text-blue-400',
  COMPLETED:   'bg-emerald-900/50 text-emerald-400',
  DELAYED:     'bg-rose-900/50 text-rose-400',
  ON_HOLD:     'bg-amber-900/40 text-amber-400',
}

function fmtDate(iso?: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function fmtDateFull(iso?: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function daysFromNow(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000)
}

// ── Milestone Card ─────────────────────────────────────────────────────────────

function MilestoneCard({ milestone }: { milestone: Milestone }) {
  const days = daysFromNow(milestone.date)
  const isPast = days < 0
  const isSoon = days >= 0 && days <= 7

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
      milestone.status === 'COMPLETED'
        ? 'bg-emerald-950/30 border-emerald-500/20'
        : isPast
          ? 'bg-rose-950/30 border-rose-500/20'
          : isSoon
            ? 'bg-amber-950/30 border-amber-500/20'
            : 'bg-[#1e2d45] border-white/10'
    }`}>
      <span className="text-xl">
        {milestone.status === 'COMPLETED' ? '✅' : isPast ? '⚠️' : isSoon ? '🔔' : '🏁'}
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-white text-sm truncate">{milestone.name}</p>
        <p className="text-xs text-gray-400 mt-0.5">{fmtDateFull(milestone.date)}</p>
      </div>
      <div className="text-right">
        {milestone.status === 'COMPLETED' ? (
          <span className="text-xs text-emerald-400">Done</span>
        ) : (
          <span className={`text-xs ${isPast ? 'text-rose-400' : isSoon ? 'text-amber-400' : 'text-gray-400'}`}>
            {isPast ? `${Math.abs(days)}d overdue` : days === 0 ? 'Today' : `${days}d away`}
          </span>
        )}
      </div>
    </div>
  )
}

// ── Task Row ───────────────────────────────────────────────────────────────────

function TaskRow({ item }: { item: ScheduleItem }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-[#1e2d45] rounded-xl border border-white/10">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {item.isCritical && (
            <span className="text-xs bg-rose-900/50 text-rose-400 px-1.5 py-0.5 rounded">Critical</span>
          )}
          {item.isMilestone && (
            <span className="text-xs bg-purple-900/50 text-purple-400 px-1.5 py-0.5 rounded">Milestone</span>
          )}
          <p className="font-medium text-white text-sm truncate">{item.taskName}</p>
        </div>
        <div className="flex items-center gap-3 mt-1">
          {item.trade && <span className="text-xs text-gray-500">{item.trade}</span>}
          <span className="text-xs text-gray-400">
            {fmtDate(item.startDate)}
            {item.endDate && ` → ${fmtDate(item.endDate)}`}
          </span>
        </div>
      </div>

      <div className="flex flex-col items-end gap-1">
        <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_STYLES[item.status] ?? 'bg-gray-800 text-gray-400'}`}>
          {item.status.replace('_', ' ')}
        </span>
        {typeof item.progress === 'number' && (
          <div className="flex items-center gap-1.5">
            <div className="w-16 h-1 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#2ABFBF] rounded-full"
                style={{ width: `${item.progress}%` }}
              />
            </div>
            <span className="text-xs text-gray-400">{item.progress}%</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

type Tab = 'tasks' | 'milestones'

export default function SchedulePage({ params }: Props) {
  const { id } = params
  const [tasks,       setTasks]       = useState<ScheduleItem[]>([])
  const [milestones,  setMilestones]  = useState<Milestone[]>([])
  const [total,       setTotal]       = useState(0)
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState<string | null>(null)
  const [tab,         setTab]         = useState<Tab>('tasks')
  const [page,        setPage]        = useState(1)

  async function fetchSchedule(p = 1) {
    try {
      const [tasksRes, milestonesRes] = await Promise.allSettled([
        constructionOS.schedule.list({ projectId: id, page: p, limit: 30 }),
        constructionOS.schedule.milestones(id),
      ])

      if (tasksRes.status === 'fulfilled') {
        if (p === 1) setTasks(tasksRes.value.data)
        else         setTasks(prev => [...prev, ...tasksRes.value.data])
        setTotal(tasksRes.value.total)
      }
      if (milestonesRes.status === 'fulfilled') {
        setMilestones(milestonesRes.value.milestones)
      }
      setError(null)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchSchedule() }, [id])

  const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length
  const progressPct    = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0
  const criticalCount  = tasks.filter(t => t.isCritical && t.status !== 'COMPLETED').length
  const upcomingMilestones = milestones.filter(m => m.status !== 'COMPLETED').sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  return (
    <div className="min-h-screen bg-[#0f1c2e] text-white">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link href={`/project/${id}`} className="hover:text-gray-300">← Project</Link>
          </div>
          <h1 className="text-xl font-bold">Schedule</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-6">
        {error && (
          <div className="p-4 bg-rose-900/30 border border-rose-500/30 rounded-xl text-rose-300 text-sm mb-4">{error}</div>
        )}

        {/* Summary bar */}
        {!loading && tasks.length > 0 && (
          <div className="bg-[#1e2d45] rounded-xl border border-white/10 p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-300">Overall Progress</span>
              <span className="text-sm font-bold text-white">{progressPct}%</span>
            </div>
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mb-3">
              <div
                className="h-full bg-[#2ABFBF] rounded-full transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <div className="flex gap-4 text-xs text-gray-400">
              <span>{completedTasks}/{tasks.length} tasks complete</span>
              {criticalCount > 0 && (
                <span className="text-rose-400">{criticalCount} critical path item{criticalCount !== 1 ? 's' : ''}</span>
              )}
              {milestones.length > 0 && (
                <span>{milestones.filter(m => m.status === 'COMPLETED').length}/{milestones.length} milestones</span>
              )}
            </div>
          </div>
        )}

        {/* Upcoming milestone peek */}
        {upcomingMilestones.length > 0 && tab === 'tasks' && (
          <div className="mb-4">
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Next Milestone</p>
            <MilestoneCard milestone={upcomingMilestones[0]} />
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          {(['tasks', 'milestones'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors capitalize ${
                tab === t ? 'bg-[#2ABFBF] text-white' : 'bg-white/5 text-gray-400 hover:text-white'
              }`}
            >
              {t} {t === 'tasks' ? `(${total})` : `(${milestones.length})`}
            </button>
          ))}
        </div>

        {loading && <p className="text-gray-400 animate-pulse text-center py-12">Loading schedule...</p>}

        {/* Tasks list */}
        {tab === 'tasks' && !loading && (
          <>
            {tasks.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-4xl mb-4">📅</p>
                <p className="text-gray-400">No schedule items yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {tasks.map(task => <TaskRow key={task.id} item={task} />)}
              </div>
            )}
            {tasks.length < total && (
              <button
                onClick={() => { const next = page + 1; setPage(next); fetchSchedule(next) }}
                className="w-full mt-4 py-3 border border-white/10 rounded-xl text-gray-400 text-sm hover:bg-white/5"
              >
                Load more ({total - tasks.length} remaining)
              </button>
            )}
          </>
        )}

        {/* Milestones list */}
        {tab === 'milestones' && !loading && (
          <>
            {milestones.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-4xl mb-4">🏁</p>
                <p className="text-gray-400">No milestones defined.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {[...milestones]
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                  .map(m => <MilestoneCard key={m.id} milestone={m} />)
                }
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
