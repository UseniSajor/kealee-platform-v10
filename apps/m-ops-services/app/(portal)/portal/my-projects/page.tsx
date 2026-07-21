'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

interface Project {
  id: string
  name: string
  status: string
  phase?: string
  progress?: number
  budget?: number | string
  nextMilestone?: string
}

export default function MyProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.getProjects()
      .then((res) => {
        setProjects(res.projects || [])
      })
      .catch((err) => {
        setError(err.message || 'Failed to load projects')
      })
      .finally(() => setLoading(false))
  }, [])

  const formatBudget = (budget: number | string | undefined) => {
    if (!budget) return '—'
    if (typeof budget === 'string') return budget
    return `$${budget.toLocaleString()}`
  }

  const getStatusColor = (status: string) => {
    const s = status.toLowerCase()
    if (s === 'active' || s === 'in_progress') return 'bg-emerald-50 text-emerald-700'
    if (s === 'completed') return 'bg-blue-50 text-blue-700'
    if (s === 'on_hold' || s === 'paused') return 'bg-amber-50 text-amber-700'
    return 'bg-zinc-50 text-zinc-700'
  }

  const formatStatus = (status: string) =>
    status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-950">My Projects</h1>
          <p className="text-sm text-zinc-600 mt-1">
            View and manage your projects
          </p>
        </div>
        <a
          href={process.env.NEXT_PUBLIC_PM_URL || '/'}
          className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-sky-700 transition"
        >
          Open PM Software &rarr;
        </a>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-200 border-t-sky-600" />
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-center">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {!loading && !error && projects.length === 0 && (
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-8 text-center">
          <h3 className="font-bold text-zinc-700">No projects yet</h3>
          <p className="text-sm text-zinc-500 mt-1">
            Projects will appear here once created
          </p>
        </div>
      )}

      <div className="grid gap-4">
        {projects.map((project) => (
          <div
            key={project.id}
            className="rounded-2xl border border-black/10 bg-white p-5 hover:shadow-md transition"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-zinc-950 truncate">{project.name}</h3>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${getStatusColor(project.status)}`}
                  >
                    {formatStatus(project.status)}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-2 text-sm text-zinc-600">
                  {project.phase && (
                    <span>Phase: <span className="font-medium text-zinc-800">{project.phase}</span></span>
                  )}
                  <span>Budget: <span className="font-medium text-zinc-800">{formatBudget(project.budget)}</span></span>
                </div>
              </div>
              <a
                href={`${process.env.NEXT_PUBLIC_PM_URL || ''}/projects/${project.id}`}
                className="shrink-0 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-bold text-sky-700 hover:bg-sky-100 transition"
              >
                View in PM
              </a>
            </div>

            {typeof project.progress === 'number' && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-zinc-500 mb-1">
                  <span>Progress</span>
                  <span className="font-bold text-zinc-800">{project.progress}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-zinc-100">
                  <div
                    className="h-2 rounded-full bg-sky-500 transition-all"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </div>
            )}

            {project.nextMilestone && (
              <div className="mt-2 text-xs text-zinc-500">
                Next milestone: <span className="font-medium text-zinc-700">{project.nextMilestone}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-sky-200 bg-sky-50 p-5 text-center">
        <h3 className="font-bold text-sky-900">Full Project Management</h3>
        <p className="text-sm text-sky-700 mt-1">
          Schedule, budget, RFIs, submittals, daily logs, punch lists, and more
        </p>
        <a
          href={process.env.NEXT_PUBLIC_PM_URL || '/'}
          className="mt-3 inline-flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-sky-700 transition"
        >
          Open Kealee PM &rarr;
        </a>
      </div>
    </section>
  )
}
