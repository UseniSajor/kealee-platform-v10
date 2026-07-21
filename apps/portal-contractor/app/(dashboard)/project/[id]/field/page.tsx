'use client'

/**
 * /project/[id]/field — Daily Field Log
 *
 * Contractors submit and review daily work logs.
 * Backed by:
 *   GET  /pm/daily-logs?projectId=...
 *   POST /pm/daily-logs
 *   POST /pm/daily-logs/:id/sign-off
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { constructionOS, type DailyLog } from '../../../../../lib/api/construction-os'

interface Props { params: { id: string } }

// ── Helpers ───────────────────────────────────────────────────────────────────

const WEATHER_OPTIONS = ['Clear', 'Partly Cloudy', 'Overcast', 'Light Rain', 'Heavy Rain', 'Snow', 'Windy']

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function LogCard({ log, onSignOff }: { log: DailyLog; onSignOff: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="bg-[#1e2d45] rounded-xl border border-white/10 overflow-hidden">
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">{log.weather?.includes('Rain') ? '🌧️' : log.weather?.includes('Snow') ? '❄️' : '☀️'}</span>
          <div>
            <p className="font-medium text-white">{fmtDate(log.date)}</p>
            <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{log.workPerformed}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {log.signedOffAt ? (
            <span className="text-xs bg-emerald-900/50 text-emerald-400 px-2 py-0.5 rounded-full">Signed Off</span>
          ) : (
            <span className="text-xs bg-amber-900/50 text-amber-400 px-2 py-0.5 rounded-full">Unsigned</span>
          )}
          <span className="text-gray-500 text-sm">{expanded ? '▲' : '▼'}</span>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-white/5 px-5 py-4 space-y-3 text-sm">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Crew',    value: log.crewCount    ?? '—' },
              { label: 'Hours',   value: log.hoursWorked  ?? '—' },
              { label: 'Weather', value: log.weather      ?? '—' },
            ].map(r => (
              <div key={r.label} className="bg-white/5 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">{r.label}</p>
                <p className="font-medium text-white">{r.value}</p>
              </div>
            ))}
          </div>

          {log.progressNotes && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Progress Notes</p>
              <p className="text-gray-300">{log.progressNotes}</p>
            </div>
          )}

          {log.issues && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Issues</p>
              <p className="text-amber-300">{log.issues}</p>
            </div>
          )}

          {log.materialsDelivered && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Materials Delivered</p>
              <p className="text-gray-300">{log.materialsDelivered}</p>
            </div>
          )}

          {!log.signedOffAt && (
            <button
              onClick={() => onSignOff(log.id)}
              className="w-full py-2 bg-[#2ABFBF] hover:bg-[#22a8a8] text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Sign Off
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ── Create Log Modal ──────────────────────────────────────────────────────────

function CreateLogModal({
  projectId,
  onClose,
  onCreated,
}: {
  projectId: string
  onClose:   () => void
  onCreated: (log: DailyLog) => void
}) {
  const [form, setForm] = useState({
    workPerformed:     '',
    crewCount:         '',
    hoursWorked:       '',
    weather:           'Clear',
    temperature:       '',
    progressNotes:     '',
    issues:            '',
    materialsDelivered: '',
    equipmentUsed:     '',
  })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit() {
    if (!form.workPerformed.trim()) { setError('Work performed is required'); return }
    setLoading(true)
    setError(null)
    try {
      const { dailyLog } = await constructionOS.dailyLogs.create({
        projectId,
        workPerformed:     form.workPerformed,
        crewCount:         form.crewCount     ? Number(form.crewCount)     : undefined,
        hoursWorked:       form.hoursWorked   ? Number(form.hoursWorked)   : undefined,
        weather:           form.weather       || undefined,
        temperature:       form.temperature   || undefined,
        progressNotes:     form.progressNotes || undefined,
        issues:            form.issues        || undefined,
        materialsDelivered: form.materialsDelivered || undefined,
        equipmentUsed:     form.equipmentUsed || undefined,
      })
      onCreated(dailyLog)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center p-4">
      <div className="bg-[#1a2535] rounded-2xl border border-white/10 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-[#1a2535] border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Today's Field Log</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">×</button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-900/30 border border-rose-500/30 rounded-lg text-rose-300 text-sm">
              {error}
            </div>
          )}

          {/* Work performed */}
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Work Performed *</label>
            <textarea
              className="w-full bg-[#243852] border border-white/10 rounded-xl text-white text-sm p-3 resize-none h-28 focus:outline-none focus:ring-2 focus:ring-[#2ABFBF]"
              placeholder="Describe all work completed today..."
              value={form.workPerformed}
              onChange={e => set('workPerformed', e.target.value)}
            />
          </div>

          {/* Crew + Hours */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Crew on Site', key: 'crewCount', placeholder: '6', type: 'number' },
              { label: 'Hours Worked', key: 'hoursWorked', placeholder: '8', type: 'number' },
            ].map(f => (
              <div key={f.key}>
                <label className="text-xs text-gray-400 mb-1.5 block">{f.label}</label>
                <input
                  type={f.type}
                  placeholder={f.placeholder}
                  value={(form as any)[f.key]}
                  onChange={e => set(f.key, e.target.value)}
                  className="w-full bg-[#243852] border border-white/10 rounded-xl text-white text-sm px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#2ABFBF]"
                />
              </div>
            ))}
          </div>

          {/* Weather */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Weather</label>
              <select
                value={form.weather}
                onChange={e => set('weather', e.target.value)}
                className="w-full bg-[#243852] border border-white/10 rounded-xl text-white text-sm px-3 py-2.5 focus:outline-none"
              >
                {WEATHER_OPTIONS.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Temp (°F)</label>
              <input
                type="text"
                placeholder="72°F"
                value={form.temperature}
                onChange={e => set('temperature', e.target.value)}
                className="w-full bg-[#243852] border border-white/10 rounded-xl text-white text-sm px-3 py-2.5 focus:outline-none"
              />
            </div>
          </div>

          {/* Progress Notes */}
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Progress Notes</label>
            <textarea
              className="w-full bg-[#243852] border border-white/10 rounded-xl text-white text-sm p-3 resize-none h-20 focus:outline-none focus:ring-2 focus:ring-[#2ABFBF]"
              placeholder="Notable progress, milestones reached..."
              value={form.progressNotes}
              onChange={e => set('progressNotes', e.target.value)}
            />
          </div>

          {/* Issues */}
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Issues / Delays</label>
            <textarea
              className="w-full bg-[#243852] border border-white/10 rounded-xl text-white text-sm p-3 resize-none h-20 focus:outline-none focus:ring-2 focus:ring-[#2ABFBF]"
              placeholder="Any problems, delays, or items requiring attention..."
              value={form.issues}
              onChange={e => set('issues', e.target.value)}
            />
          </div>

          {/* Materials */}
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Materials Delivered</label>
            <input
              type="text"
              placeholder="Lumber, drywall, fixtures..."
              value={form.materialsDelivered}
              onChange={e => set('materialsDelivered', e.target.value)}
              className="w-full bg-[#243852] border border-white/10 rounded-xl text-white text-sm px-3 py-2.5 focus:outline-none"
            />
          </div>
        </div>

        <div className="sticky bottom-0 bg-[#1a2535] border-t border-white/10 px-6 py-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 border border-white/10 rounded-xl text-gray-300 text-sm hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-3 bg-[#2ABFBF] hover:bg-[#22a8a8] text-white text-sm font-semibold rounded-xl disabled:opacity-50 transition-colors"
          >
            {loading ? 'Saving...' : 'Submit Log'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function FieldLogPage({ params }: Props) {
  const { id } = params
  const [logs,       setLogs]       = useState<DailyLog[]>([])
  const [total,      setTotal]      = useState(0)
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [page,       setPage]       = useState(1)

  async function fetchLogs(p = 1) {
    try {
      const result = await constructionOS.dailyLogs.list({ projectId: id, page: p, limit: 20 })
      if (p === 1) setLogs(result.data)
      else         setLogs(prev => [...prev, ...result.data])
      setTotal(result.total)
      setError(null)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchLogs() }, [id])

  async function handleSignOff(logId: string) {
    const { dailyLog } = await constructionOS.dailyLogs.signOff(logId)
    setLogs(prev => prev.map(l => l.id === logId ? dailyLog : l))
  }

  const todayLogged = logs.some(l => {
    const logDate = new Date(l.date).toDateString()
    return logDate === new Date().toDateString()
  })

  return (
    <div className="min-h-screen bg-[#0f1c2e] text-white">
      {showCreate && (
        <CreateLogModal
          projectId={id}
          onClose={() => setShowCreate(false)}
          onCreated={log => { setLogs(prev => [log, ...prev]); setTotal(t => t + 1); setShowCreate(false) }}
        />
      )}

      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <Link href={`/project/${id}`} className="hover:text-gray-300">← Project</Link>
            </div>
            <h1 className="text-xl font-bold">Field Log</h1>
          </div>
          {!todayLogged && (
            <button
              onClick={() => setShowCreate(true)}
              className="px-4 py-2 bg-[#2ABFBF] hover:bg-[#22a8a8] text-white text-sm font-semibold rounded-xl transition-colors"
            >
              + Today's Log
            </button>
          )}
          {todayLogged && (
            <span className="text-xs text-emerald-400 bg-emerald-900/30 px-3 py-1.5 rounded-full">
              ✓ Today submitted
            </span>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-6">
        {loading && <p className="text-gray-400 animate-pulse text-center py-12">Loading logs...</p>}

        {error && (
          <div className="p-4 bg-rose-900/30 border border-rose-500/30 rounded-xl text-rose-300 text-sm mb-4">
            {error}
          </div>
        )}

        {!loading && logs.length === 0 && (
          <div className="text-center py-16">
            <p className="text-4xl mb-4">📋</p>
            <p className="text-gray-400">No field logs yet.</p>
            <button
              onClick={() => setShowCreate(true)}
              className="mt-4 px-5 py-2.5 bg-[#2ABFBF] text-white rounded-xl text-sm font-semibold"
            >
              Create First Log
            </button>
          </div>
        )}

        <div className="space-y-3">
          {logs.map(log => (
            <LogCard key={log.id} log={log} onSignOff={handleSignOff} />
          ))}
        </div>

        {logs.length < total && (
          <button
            onClick={() => { const next = page + 1; setPage(next); fetchLogs(next) }}
            className="w-full mt-4 py-3 border border-white/10 rounded-xl text-gray-400 text-sm hover:bg-white/5"
          >
            Load more ({total - logs.length} remaining)
          </button>
        )}
      </main>
    </div>
  )
}
