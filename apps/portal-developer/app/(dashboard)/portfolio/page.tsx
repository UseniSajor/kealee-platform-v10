'use client'

import { useEffect, useState } from 'react'
import { Activity, Building2, DollarSign, LayoutGrid, RefreshCw } from 'lucide-react'
import { listDevProjects, type DevProject } from '@/lib/api/developer'

function money(value: number | null) {
  if (value === null) return 'Not set'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
}

export default function PortfolioPage() {
  const [projects, setProjects] = useState<DevProject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await listDevProjects()
      setProjects(result.projects ?? [])
    } catch {
      setError('Your portfolio could not be loaded. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  const totalBudget = projects.reduce((sum, project) => sum + (project.totalBudget ?? 0), 0)
  const health = projects.map(project => project.twinHealthScore).filter((value): value is number => value !== null)
  const averageHealth = health.length ? Math.round(health.reduce((sum, value) => sum + value, 0) / health.length) : null

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div><h1 className="font-display text-2xl font-bold text-slate-900">Portfolio</h1><p className="mt-1 text-sm text-slate-600">Verified projects and project-level financial data.</p></div>
        <button onClick={() => void load()} aria-label="Refresh portfolio" className="rounded-lg p-2 text-slate-500 hover:bg-white"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /></button>
      </div>
      {error && <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
      {!loading && !error && projects.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm"><LayoutGrid className="mx-auto h-10 w-10 text-slate-300" /><h2 className="mt-4 text-lg font-semibold text-slate-900">No projects in your portfolio yet</h2><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">Projects will appear here after they are created or assigned to your organization.</p></div>
      ) : !loading && (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><LayoutGrid className="h-5 w-5 text-indigo-500" /><p className="mt-2 text-2xl font-bold text-slate-900">{projects.length}</p><p className="text-xs text-slate-500">Projects</p></div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><DollarSign className="h-5 w-5 text-teal-500" /><p className="mt-2 text-2xl font-bold text-slate-900">{money(totalBudget)}</p><p className="text-xs text-slate-500">Recorded budget</p></div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><Activity className="h-5 w-5 text-emerald-500" /><p className="mt-2 text-2xl font-bold text-slate-900">{averageHealth === null ? 'Not active' : `${averageHealth}%`}</p><p className="text-xs text-slate-500">Average twin health</p></div>
          </div>
          <div className="space-y-3">
            {projects.map(project => (
              <article key={project.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4"><div className="flex gap-3"><div className="rounded-lg bg-indigo-50 p-2 text-indigo-600"><Building2 className="h-5 w-5" /></div><div><h2 className="font-semibold text-slate-900">{project.name}</h2><p className="mt-1 text-sm text-slate-500">{[project.address, project.city, project.state].filter(Boolean).join(', ') || 'Location not entered'}</p></div></div><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{project.lifecyclePhase ?? project.status}</span></div>
                <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 text-sm sm:grid-cols-4"><div><p className="text-xs text-slate-400">Type</p><p className="font-medium text-slate-700">{project.projectType}</p></div><div><p className="text-xs text-slate-400">Budget</p><p className="font-medium text-slate-700">{money(project.totalBudget)}</p></div><div><p className="text-xs text-slate-400">Spent</p><p className="font-medium text-slate-700">{money(project.spentToDate)}</p></div><div><p className="text-xs text-slate-400">Twin health</p><p className="font-medium text-slate-700">{project.twinHealthScore === null ? 'Not active' : `${project.twinHealthScore}%`}</p></div></div>
              </article>
            ))}
          </div>
        </>
      )}
      {loading && <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">Loading your portfolio…</div>}
    </div>
  )
}
