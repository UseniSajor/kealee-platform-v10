'use client'

/**
 * /project/[id]/budget — Budget Overview
 *
 * Contractors view project budget overview and line items.
 * Backed by:
 *   GET /pm/budget?projectId=...
 *   GET /pm/budget/lines?projectId=...
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { constructionOS, type BudgetOverview, type BudgetLine } from '../../../../../lib/api/construction-os'

interface Props { params: { id: string } }

function fmt(n?: number, currency = 'USD') {
  if (n === undefined || n === null) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n)
}

function pct(n?: number) {
  if (n === undefined || n === null) return '—'
  return `${Math.round(n)}%`
}

// ── CPI Indicator ─────────────────────────────────────────────────────────────

function CPIBadge({ cpi }: { cpi: number }) {
  const color = cpi >= 1 ? 'text-emerald-400 bg-emerald-900/40' : cpi >= 0.9 ? 'text-amber-400 bg-amber-900/40' : 'text-rose-400 bg-rose-900/40'
  const label = cpi >= 1 ? 'Under Budget' : cpi >= 0.9 ? 'Near Budget' : 'Over Budget'
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${color}`}>
      CPI {cpi.toFixed(2)} · {label}
    </span>
  )
}

// ── Progress Bar ──────────────────────────────────────────────────────────────

function ProgressBar({ value, color = '#2ABFBF' }: { value: number; color?: string }) {
  return (
    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${Math.min(100, Math.max(0, value))}%`, backgroundColor: color }}
      />
    </div>
  )
}

// ── Budget Line Row ───────────────────────────────────────────────────────────

function LineRow({ line }: { line: BudgetLine }) {
  const spent = line.actualAmount ?? 0
  const budget = line.budgetAmount ?? 0
  const pctSpent = budget > 0 ? (spent / budget) * 100 : 0
  const isOver = spent > budget && budget > 0

  return (
    <div className="px-4 py-3 flex items-center gap-3 border-b border-white/5 last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {line.code && <span className="text-xs text-gray-500 font-mono">{line.code}</span>}
          <p className="text-sm text-white truncate">{line.name}</p>
        </div>
        {line.category && <p className="text-xs text-gray-500 mt-0.5">{line.category}</p>}
        {budget > 0 && <ProgressBar value={pctSpent} color={isOver ? '#f87171' : '#2ABFBF'} />}
      </div>
      <div className="text-right shrink-0">
        <p className={`text-sm font-medium ${isOver ? 'text-rose-400' : 'text-white'}`}>
          {fmt(line.actualAmount)}
        </p>
        {budget > 0 && (
          <p className="text-xs text-gray-500">of {fmt(budget)}</p>
        )}
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function BudgetPage({ params }: Props) {
  const { id } = params
  const [overview, setOverview] = useState<BudgetOverview | null>(null)
  const [lines,    setLines]    = useState<BudgetLine[]>([])
  const [total,    setTotal]    = useState(0)
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState<string | null>(null)
  const [page,     setPage]     = useState(1)

  async function fetchBudget(p = 1) {
    try {
      const [overviewRes, linesRes] = await Promise.allSettled([
        constructionOS.budget.overview(id),
        constructionOS.budget.lines({ projectId: id, page: p, limit: 30 }),
      ])
      if (overviewRes.status === 'fulfilled') setOverview(overviewRes.value)
      if (linesRes.status === 'fulfilled') {
        if (p === 1) setLines(linesRes.value.data)
        else         setLines(prev => [...prev, ...linesRes.value.data])
        setTotal(linesRes.value.total)
      }
      setError(null)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchBudget() }, [id])

  // Group lines by category
  const grouped = lines.reduce<Record<string, BudgetLine[]>>((acc, line) => {
    const cat = line.category ?? 'Uncategorized'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(line)
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-[#0f1c2e] text-white">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <Link href={`/project/${id}`} className="hover:text-gray-300">← Project</Link>
            </div>
            <h1 className="text-xl font-bold">Budget</h1>
          </div>
          {overview && <CPIBadge cpi={overview.cpi} />}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-6">
        {loading && <p className="text-gray-400 animate-pulse text-center py-12">Loading budget...</p>}

        {error && (
          <div className="p-4 bg-rose-900/30 border border-rose-500/30 rounded-xl text-rose-300 text-sm mb-4">{error}</div>
        )}

        {/* Overview cards */}
        {overview && (
          <>
            {/* Main budget progress */}
            <div className="bg-[#1e2d45] rounded-xl border border-white/10 p-5 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Contract Value</span>
                <span className="text-lg font-bold text-white">{fmt(overview.contractedAmount, overview.currency)}</span>
              </div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-400">Spent {pct(overview.percentComplete)}</span>
                <span className="text-white">{fmt(overview.spentToDate, overview.currency)}</span>
              </div>
              <ProgressBar
                value={overview.percentComplete}
                color={overview.percentComplete > 100 ? '#f87171' : '#2ABFBF'}
              />
            </div>

            {/* Key metrics grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {[
                { label: 'Committed',  value: fmt(overview.committedCosts, overview.currency),    color: 'text-amber-400' },
                { label: 'Forecast AC',value: fmt(overview.forecastAtComplete, overview.currency), color: overview.forecastAtComplete > overview.contractedAmount ? 'text-rose-400' : 'text-emerald-400' },
                { label: 'Contingency',value: fmt(overview.contingencyRemaining, overview.currency), color: 'text-white' },
                { label: 'SPI',        value: overview.spi !== undefined ? overview.spi.toFixed(2) : '—', color: 'text-white' },
              ].map(m => (
                <div key={m.label} className="bg-[#1e2d45] rounded-xl border border-white/10 p-4">
                  <p className="text-xs text-gray-500 mb-1">{m.label}</p>
                  <p className={`text-lg font-bold font-mono ${m.color}`}>{m.value}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Budget lines by category */}
        {!loading && lines.length > 0 && (
          <div className="space-y-4">
            {Object.entries(grouped).map(([category, catLines]) => (
              <div key={category} className="bg-[#1e2d45] rounded-xl border border-white/10 overflow-hidden">
                <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                  <p className="text-sm font-semibold text-white">{category}</p>
                  <p className="text-xs text-gray-400">
                    {fmt(catLines.reduce((s, l) => s + (l.actualAmount ?? 0), 0))} /{' '}
                    {fmt(catLines.reduce((s, l) => s + (l.budgetAmount ?? 0), 0))}
                  </p>
                </div>
                {catLines.map(line => <LineRow key={line.id} line={line} />)}
              </div>
            ))}
          </div>
        )}

        {!loading && lines.length === 0 && !overview && (
          <div className="text-center py-16">
            <p className="text-4xl mb-4">💰</p>
            <p className="text-gray-400">No budget data yet.</p>
          </div>
        )}

        {lines.length < total && (
          <button
            onClick={() => { const next = page + 1; setPage(next); fetchBudget(next) }}
            className="w-full mt-4 py-3 border border-white/10 rounded-xl text-gray-400 text-sm hover:bg-white/5"
          >
            Load more ({total - lines.length} remaining)
          </button>
        )}
      </main>
    </div>
  )
}
