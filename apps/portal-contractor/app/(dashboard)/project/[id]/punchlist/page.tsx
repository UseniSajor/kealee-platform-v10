'use client'

/**
 * /project/[id]/punchlist — Punch List
 *
 * Contractors view and resolve punch list items.
 * Backed by:
 *   GET  /pm/punch-list?projectId=...
 *   POST /pm/punch-list
 *   POST /pm/punch-list/:id/resolve
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { constructionOS, type PunchItem } from '../../../../../lib/api/construction-os'

interface Props { params: { id: string } }

const SEVERITY_STYLES: Record<string, string> = {
  MINOR:    'bg-gray-800 text-gray-400',
  MODERATE: 'bg-amber-900/40 text-amber-400',
  MAJOR:    'bg-orange-900/40 text-orange-400',
  CRITICAL: 'bg-rose-900/50 text-rose-400',
}

const STATUS_STYLES: Record<string, string> = {
  OPEN:        'bg-blue-900/50 text-blue-400',
  IN_PROGRESS: 'bg-amber-900/40 text-amber-400',
  RESOLVED:    'bg-teal-900/40 text-teal-400',
  VERIFIED:    'bg-emerald-900/50 text-emerald-400',
  VOIDED:      'bg-gray-800 text-gray-500',
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ── Punch Item Card ───────────────────────────────────────────────────────────

function PunchCard({
  item,
  onResolve,
}: {
  item:      PunchItem
  onResolve: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="bg-[#1e2d45] rounded-xl border border-white/10 overflow-hidden">
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-start justify-between px-5 py-4 text-left hover:bg-white/5 transition-colors"
      >
        <div className="flex-1 min-w-0 pr-3">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_STYLES[item.status] ?? ''}`}>
              {item.status.replace('_', ' ')}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${SEVERITY_STYLES[item.severity] ?? ''}`}>
              {item.severity}
            </span>
            {item.type && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-gray-400">{item.type}</span>
            )}
          </div>
          <p className="font-medium text-white truncate">{item.title}</p>
          {item.location && <p className="text-xs text-gray-400 mt-0.5">{item.location}</p>}
        </div>
        <span className="text-gray-500 text-sm mt-1">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="border-t border-white/5 px-5 py-4 space-y-3 text-sm">
          <div>
            <p className="text-xs text-gray-500 mb-1">Description</p>
            <p className="text-gray-300">{item.description}</p>
          </div>

          {item.assignedTo && (
            <p className="text-xs text-gray-400">Assigned to: {item.assignedTo}</p>
          )}
          {item.dueDate && (
            <p className="text-xs text-gray-400">Due: {fmtDate(item.dueDate)}</p>
          )}

          {item.resolution && (
            <div className="bg-teal-950/40 border border-teal-500/20 rounded-lg p-3">
              <p className="text-xs text-teal-500 mb-1">Resolution</p>
              <p className="text-teal-200">{item.resolution}</p>
            </div>
          )}

          {(item.status === 'OPEN' || item.status === 'IN_PROGRESS') && (
            <button
              onClick={() => onResolve(item.id)}
              className="w-full py-2 bg-[#2ABFBF] hover:bg-[#22a8a8] text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Mark Resolved
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ── Resolve Modal ─────────────────────────────────────────────────────────────

function ResolveModal({
  itemId,
  onClose,
  onResolved,
}: {
  itemId:     string
  onClose:    () => void
  onResolved: (item: PunchItem) => void
}) {
  const [resolution, setResolution] = useState('')
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState<string | null>(null)

  async function handleSubmit() {
    if (!resolution.trim()) { setError('Resolution description required'); return }
    setLoading(true); setError(null)
    try {
      const { punchItem } = await constructionOS.punchList.resolve(itemId, resolution)
      onResolved(punchItem)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-[#1a2535] rounded-2xl border border-white/10 w-full max-w-md">
        <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Mark Resolved</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">×</button>
        </div>
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-900/30 border border-rose-500/30 rounded-lg text-rose-300 text-sm">{error}</div>
          )}
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">How was this resolved? *</label>
            <textarea
              className="w-full bg-[#243852] border border-white/10 rounded-xl text-white text-sm p-3 resize-none h-24 focus:outline-none focus:ring-2 focus:ring-[#2ABFBF]"
              placeholder="Describe the corrective action taken..."
              value={resolution}
              onChange={e => setResolution(e.target.value)}
            />
          </div>
        </div>
        <div className="border-t border-white/10 px-6 py-4 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 border border-white/10 rounded-xl text-gray-300 text-sm hover:bg-white/5">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-3 bg-[#2ABFBF] hover:bg-[#22a8a8] text-white text-sm font-semibold rounded-xl disabled:opacity-50 transition-colors"
          >
            {loading ? 'Saving...' : 'Confirm Resolved'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Create Punch Item Modal ───────────────────────────────────────────────────

function CreatePunchModal({
  projectId,
  onClose,
  onCreated,
}: {
  projectId: string
  onClose:   () => void
  onCreated: (item: PunchItem) => void
}) {
  const [form, setForm] = useState({
    title: '', description: '', type: '', severity: 'MODERATE', location: '', assignedTo: '', dueDate: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit() {
    if (!form.title.trim())       { setError('Title is required'); return }
    if (!form.description.trim()) { setError('Description is required'); return }
    setLoading(true); setError(null)
    try {
      const { punchItem } = await constructionOS.punchList.create({
        projectId,
        title:       form.title,
        description: form.description,
        type:        form.type || undefined,
        severity:    form.severity,
        location:    form.location || undefined,
        assignedTo:  form.assignedTo || undefined,
        dueDate:     form.dueDate || undefined,
      })
      onCreated(punchItem)
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
          <h2 className="text-lg font-bold text-white">New Punch Item</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">×</button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-900/30 border border-rose-500/30 rounded-lg text-rose-300 text-sm">{error}</div>
          )}

          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Title *</label>
            <input type="text" placeholder="Brief description of deficiency..."
              value={form.title} onChange={e => set('title', e.target.value)}
              className="w-full bg-[#243852] border border-white/10 rounded-xl text-white text-sm px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#2ABFBF]"
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Description *</label>
            <textarea
              className="w-full bg-[#243852] border border-white/10 rounded-xl text-white text-sm p-3 resize-none h-20 focus:outline-none focus:ring-2 focus:ring-[#2ABFBF]"
              placeholder="Detailed description of the issue..."
              value={form.description} onChange={e => set('description', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Severity</label>
              <select value={form.severity} onChange={e => set('severity', e.target.value)}
                className="w-full bg-[#243852] border border-white/10 rounded-xl text-white text-sm px-3 py-2.5 focus:outline-none"
              >
                {['MINOR', 'MODERATE', 'MAJOR', 'CRITICAL'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Type</label>
              <input type="text" placeholder="e.g. Paint, Drywall, Trim"
                value={form.type} onChange={e => set('type', e.target.value)}
                className="w-full bg-[#243852] border border-white/10 rounded-xl text-white text-sm px-3 py-2.5 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Location</label>
            <input type="text" placeholder="e.g. Master Bath, Unit 3B"
              value={form.location} onChange={e => set('location', e.target.value)}
              className="w-full bg-[#243852] border border-white/10 rounded-xl text-white text-sm px-3 py-2.5 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Assigned To</label>
              <input type="text" placeholder="Subcontractor name"
                value={form.assignedTo} onChange={e => set('assignedTo', e.target.value)}
                className="w-full bg-[#243852] border border-white/10 rounded-xl text-white text-sm px-3 py-2.5 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Due Date</label>
              <input type="date" value={form.dueDate} onChange={e => set('dueDate', e.target.value)}
                className="w-full bg-[#243852] border border-white/10 rounded-xl text-white text-sm px-3 py-2.5 focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-[#1a2535] border-t border-white/10 px-6 py-4 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 border border-white/10 rounded-xl text-gray-300 text-sm hover:bg-white/5">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-3 bg-[#2ABFBF] hover:bg-[#22a8a8] text-white text-sm font-semibold rounded-xl disabled:opacity-50 transition-colors"
          >
            {loading ? 'Saving...' : 'Add Item'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

const STATUS_FILTERS = ['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'VERIFIED'] as const

export default function PunchListPage({ params }: Props) {
  const { id } = params
  const [items,       setItems]       = useState<PunchItem[]>([])
  const [total,       setTotal]       = useState(0)
  const [stats,       setStats]       = useState<Record<string, number>>({})
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState<string | null>(null)
  const [showCreate,  setShowCreate]  = useState(false)
  const [resolvingId, setResolvingId] = useState<string | null>(null)
  const [filter,      setFilter]      = useState<string>('ALL')
  const [page,        setPage]        = useState(1)

  async function fetchItems(p = 1, status = filter) {
    try {
      const [result, statsRes] = await Promise.allSettled([
        constructionOS.punchList.list({
          projectId: id,
          status:    status === 'ALL' ? undefined : status,
          page:      p,
          limit:     20,
        }),
        constructionOS.punchList.stats(id),
      ])
      if (result.status === 'fulfilled') {
        if (p === 1) setItems(result.value.data)
        else         setItems(prev => [...prev, ...result.value.data])
        setTotal(result.value.total)
      }
      if (statsRes.status === 'fulfilled') setStats(statsRes.value.stats)
      setError(null)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchItems(1, filter) }, [id, filter])

  function handleFilterChange(f: string) {
    setFilter(f); setPage(1); setLoading(true)
  }

  function handleResolved(updated: PunchItem) {
    setItems(prev => prev.map(i => i.id === updated.id ? updated : i))
    setResolvingId(null)
  }

  const openCount = (stats.OPEN ?? 0) + (stats.IN_PROGRESS ?? 0)

  return (
    <div className="min-h-screen bg-[#0f1c2e] text-white">
      {showCreate && (
        <CreatePunchModal
          projectId={id}
          onClose={() => setShowCreate(false)}
          onCreated={item => { setItems(prev => [item, ...prev]); setTotal(t => t + 1); setShowCreate(false) }}
        />
      )}
      {resolvingId && (
        <ResolveModal
          itemId={resolvingId}
          onClose={() => setResolvingId(null)}
          onResolved={handleResolved}
        />
      )}

      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <Link href={`/project/${id}`} className="hover:text-gray-300">← Project</Link>
            </div>
            <h1 className="text-xl font-bold">Punch List</h1>
            {openCount > 0 && (
              <p className="text-xs text-amber-400 mt-0.5">{openCount} item{openCount !== 1 ? 's' : ''} open</p>
            )}
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 bg-[#2ABFBF] hover:bg-[#22a8a8] text-white text-sm font-semibold rounded-xl transition-colors"
          >
            + Add Item
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-6">
        {/* Stats bar */}
        {Object.keys(stats).length > 0 && (
          <div className="grid grid-cols-4 gap-2 mb-6">
            {[
              { label: 'Open',       value: stats.OPEN        ?? 0, color: 'text-blue-400' },
              { label: 'In Progress',value: stats.IN_PROGRESS ?? 0, color: 'text-amber-400' },
              { label: 'Resolved',   value: stats.RESOLVED    ?? 0, color: 'text-teal-400' },
              { label: 'Verified',   value: stats.VERIFIED    ?? 0, color: 'text-emerald-400' },
            ].map(s => (
              <div key={s.label} className="bg-[#1e2d45] rounded-xl border border-white/10 p-3 text-center">
                <p className={`text-xl font-bold font-mono ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {STATUS_FILTERS.map(f => (
            <button
              key={f}
              onClick={() => handleFilterChange(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                filter === f ? 'bg-[#2ABFBF] text-white' : 'bg-white/5 text-gray-400 hover:text-white'
              }`}
            >
              {f.replace('_', ' ')}
            </button>
          ))}
        </div>

        {loading && <p className="text-gray-400 animate-pulse text-center py-12">Loading punch list...</p>}

        {error && (
          <div className="p-4 bg-rose-900/30 border border-rose-500/30 rounded-xl text-rose-300 text-sm mb-4">{error}</div>
        )}

        {!loading && items.length === 0 && (
          <div className="text-center py-16">
            <p className="text-4xl mb-4">✅</p>
            <p className="text-gray-400">No punch items{filter !== 'ALL' ? ` with status ${filter.replace('_', ' ')}` : ''}.</p>
          </div>
        )}

        <div className="space-y-3">
          {items.map(item => (
            <PunchCard key={item.id} item={item} onResolve={setResolvingId} />
          ))}
        </div>

        {items.length < total && (
          <button
            onClick={() => { const next = page + 1; setPage(next); fetchItems(next) }}
            className="w-full mt-4 py-3 border border-white/10 rounded-xl text-gray-400 text-sm hover:bg-white/5"
          >
            Load more ({total - items.length} remaining)
          </button>
        )}
      </main>
    </div>
  )
}
