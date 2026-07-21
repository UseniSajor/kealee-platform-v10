'use client'

/**
 * /project/[id]/rfis — Requests for Information
 *
 * Contractors view, create, and track RFIs for a project.
 * Backed by:
 *   GET  /pm/rfis?projectId=...
 *   POST /pm/rfis
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { constructionOS, type RFI } from '../../../../../lib/api/construction-os'

interface Props { params: { id: string } }

const STATUS_STYLES: Record<string, string> = {
  OPEN:     'bg-blue-900/50 text-blue-400',
  ANSWERED: 'bg-emerald-900/50 text-emerald-400',
  CLOSED:   'bg-gray-800 text-gray-400',
  VOIDED:   'bg-gray-800 text-gray-500',
}

const PRIORITY_STYLES: Record<string, string> = {
  LOW:    'bg-gray-800 text-gray-400',
  MEDIUM: 'bg-amber-900/40 text-amber-400',
  HIGH:   'bg-orange-900/40 text-orange-400',
  URGENT: 'bg-rose-900/50 text-rose-400',
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ── RFI Card ──────────────────────────────────────────────────────────────────

function RFICard({ rfi }: { rfi: RFI }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="bg-[#1e2d45] rounded-xl border border-white/10 overflow-hidden">
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-start justify-between px-5 py-4 text-left hover:bg-white/5 transition-colors"
      >
        <div className="flex-1 min-w-0 pr-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-gray-500 font-mono">RFI-{String(rfi.rfiNumber).padStart(3, '0')}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_STYLES[rfi.status] ?? 'bg-gray-800 text-gray-400'}`}>
              {rfi.status}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${PRIORITY_STYLES[rfi.priority] ?? ''}`}>
              {rfi.priority}
            </span>
          </div>
          <p className="font-medium text-white truncate">{rfi.subject}</p>
          <p className="text-xs text-gray-400 mt-0.5">{fmtDate(rfi.createdAt)}</p>
        </div>
        <span className="text-gray-500 text-sm mt-1">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="border-t border-white/5 px-5 py-4 space-y-3 text-sm">
          <div>
            <p className="text-xs text-gray-500 mb-1">Question</p>
            <p className="text-gray-300">{rfi.question}</p>
          </div>

          {rfi.answer && (
            <div className="bg-emerald-950/40 border border-emerald-500/20 rounded-lg p-3">
              <p className="text-xs text-emerald-500 mb-1">Answer {rfi.answeredAt ? `· ${fmtDate(rfi.answeredAt)}` : ''}</p>
              <p className="text-emerald-200">{rfi.answer}</p>
            </div>
          )}

          {rfi.dueDate && (
            <p className="text-xs text-gray-400">Due: {fmtDate(rfi.dueDate)}</p>
          )}
        </div>
      )}
    </div>
  )
}

// ── Create RFI Modal ──────────────────────────────────────────────────────────

function CreateRFIModal({
  projectId,
  onClose,
  onCreated,
}: {
  projectId: string
  onClose:   () => void
  onCreated: (rfi: RFI) => void
}) {
  const [form, setForm] = useState({ subject: '', question: '', priority: 'MEDIUM', dueDate: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit() {
    if (!form.subject.trim())   { setError('Subject is required'); return }
    if (!form.question.trim())  { setError('Question is required'); return }
    setLoading(true); setError(null)
    try {
      const { rfi } = await constructionOS.rfis.create({
        projectId,
        subject:  form.subject,
        question: form.question,
        priority: form.priority,
        dueDate:  form.dueDate || undefined,
      })
      onCreated(rfi)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center p-4">
      <div className="bg-[#1a2535] rounded-2xl border border-white/10 w-full max-w-lg">
        <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">New RFI</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">×</button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-900/30 border border-rose-500/30 rounded-lg text-rose-300 text-sm">{error}</div>
          )}

          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Subject *</label>
            <input
              type="text"
              placeholder="Brief description of the question..."
              value={form.subject}
              onChange={e => set('subject', e.target.value)}
              className="w-full bg-[#243852] border border-white/10 rounded-xl text-white text-sm px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#2ABFBF]"
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Question *</label>
            <textarea
              className="w-full bg-[#243852] border border-white/10 rounded-xl text-white text-sm p-3 resize-none h-28 focus:outline-none focus:ring-2 focus:ring-[#2ABFBF]"
              placeholder="Provide full context and specific question..."
              value={form.question}
              onChange={e => set('question', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Priority</label>
              <select
                value={form.priority}
                onChange={e => set('priority', e.target.value)}
                className="w-full bg-[#243852] border border-white/10 rounded-xl text-white text-sm px-3 py-2.5 focus:outline-none"
              >
                {['LOW', 'MEDIUM', 'HIGH', 'URGENT'].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Due Date</label>
              <input
                type="date"
                value={form.dueDate}
                onChange={e => set('dueDate', e.target.value)}
                className="w-full bg-[#243852] border border-white/10 rounded-xl text-white text-sm px-3 py-2.5 focus:outline-none"
              />
            </div>
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
            {loading ? 'Submitting...' : 'Submit RFI'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

const FILTERS = ['ALL', 'OPEN', 'ANSWERED', 'CLOSED'] as const

export default function RFIsPage({ params }: Props) {
  const { id } = params
  const [rfis,       setRfis]       = useState<RFI[]>([])
  const [total,      setTotal]      = useState(0)
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [filter,     setFilter]     = useState<string>('ALL')
  const [page,       setPage]       = useState(1)

  async function fetchRFIs(p = 1, status = filter) {
    try {
      const result = await constructionOS.rfis.list({
        projectId: id,
        status:    status === 'ALL' ? undefined : status,
        page:      p,
        limit:     20,
      })
      if (p === 1) setRfis(result.data)
      else         setRfis(prev => [...prev, ...result.data])
      setTotal(result.total)
      setError(null)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchRFIs(1, filter) }, [id, filter])

  function handleFilterChange(f: string) {
    setFilter(f)
    setPage(1)
    setLoading(true)
  }

  return (
    <div className="min-h-screen bg-[#0f1c2e] text-white">
      {showCreate && (
        <CreateRFIModal
          projectId={id}
          onClose={() => setShowCreate(false)}
          onCreated={rfi => { setRfis(prev => [rfi, ...prev]); setTotal(t => t + 1); setShowCreate(false) }}
        />
      )}

      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <Link href={`/project/${id}`} className="hover:text-gray-300">← Project</Link>
            </div>
            <h1 className="text-xl font-bold">RFIs</h1>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 bg-[#2ABFBF] hover:bg-[#22a8a8] text-white text-sm font-semibold rounded-xl transition-colors"
          >
            + New RFI
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-6">
        {/* Filter tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => handleFilterChange(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                filter === f
                  ? 'bg-[#2ABFBF] text-white'
                  : 'bg-white/5 text-gray-400 hover:text-white'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {loading && <p className="text-gray-400 animate-pulse text-center py-12">Loading RFIs...</p>}

        {error && (
          <div className="p-4 bg-rose-900/30 border border-rose-500/30 rounded-xl text-rose-300 text-sm mb-4">{error}</div>
        )}

        {!loading && rfis.length === 0 && (
          <div className="text-center py-16">
            <p className="text-4xl mb-4">❓</p>
            <p className="text-gray-400">No RFIs {filter !== 'ALL' ? `with status ${filter}` : 'yet'}.</p>
            <button
              onClick={() => setShowCreate(true)}
              className="mt-4 px-5 py-2.5 bg-[#2ABFBF] text-white rounded-xl text-sm font-semibold"
            >
              Submit First RFI
            </button>
          </div>
        )}

        <div className="space-y-3">
          {rfis.map(rfi => <RFICard key={rfi.id} rfi={rfi} />)}
        </div>

        {rfis.length < total && (
          <button
            onClick={() => { const next = page + 1; setPage(next); fetchRFIs(next) }}
            className="w-full mt-4 py-3 border border-white/10 rounded-xl text-gray-400 text-sm hover:bg-white/5"
          >
            Load more ({total - rfis.length} remaining)
          </button>
        )}
      </main>
    </div>
  )
}
