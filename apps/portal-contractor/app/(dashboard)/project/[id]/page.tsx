'use client'

/**
 * /project/[id] — Contractor Construction OS Hub
 *
 * Central navigation hub for a contractor's active project.
 * Shows project health summary and links to all OS modules.
 * Backed by GET /pm/stats and GET /pm/schedule/milestones.
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { constructionOS } from '../../../../lib/api/construction-os'

interface Props { params: { id: string } }

interface ProjectSummary {
  id:       string
  name:     string
  address:  string
  status:   string
  phase:    number
  health:   'healthy' | 'at_risk' | 'critical'
}

interface ModuleCard {
  slug:   string
  label:  string
  icon:   string
  href:   string
  badge?: number | null
  phase:  number
}

// ── Status helpers ────────────────────────────────────────────────────────────

const HEALTH_COLOR = {
  healthy:  'text-emerald-400 bg-emerald-900/30',
  at_risk:  'text-amber-400 bg-amber-900/30',
  critical: 'text-rose-400 bg-rose-900/30',
}

export default function ProjectHubPage({ params }: Props) {
  const { id } = params
  const [project, setProject] = useState<ProjectSummary | null>(null)
  const [stats,   setStats]   = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const [scheduleRes, rfiStats, punchStats] = await Promise.allSettled([
          constructionOS.schedule.milestones(id),
          constructionOS.rfis.stats(id),
          constructionOS.punchList.stats(id),
        ])

        const combined: Record<string, number> = {}
        if (rfiStats.status === 'fulfilled')   Object.assign(combined, rfiStats.value.stats)
        if (punchStats.status === 'fulfilled') Object.assign(combined, { punch: Object.values(punchStats.value.stats).reduce((a:number, b: number) => a + b, 0) })

        setStats(combined)
        setError(null)
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const modules: ModuleCard[] = [
    { slug: 'field',     label: 'Field Log',    icon: '📋', href: `field`,     badge: null,               phase: 1 },
    { slug: 'schedule',  label: 'Schedule',     icon: '📅', href: `schedule`,  badge: null,               phase: 1 },
    { slug: 'rfis',      label: 'RFIs',         icon: '❓', href: `rfis`,      badge: stats.open ?? null, phase: 1 },
    { slug: 'punchlist', label: 'Punch List',   icon: '✅', href: `punchlist`, badge: stats.punch ?? null, phase: 1 },
    { slug: 'budget',    label: 'Budget',       icon: '💰', href: `budget`,    badge: null,               phase: 1 },
    { slug: 'photos',    label: 'Photos',       icon: '📷', href: `photos`,    badge: null,               phase: 1 },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f1c2e] flex items-center justify-center">
        <p className="text-gray-400 animate-pulse">Loading project...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0f1c2e] text-white p-6">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/projects" className="hover:text-gray-300">Projects</Link>
            <span>/</span>
            <span className="text-gray-300">Project {id.slice(0, 8)}…</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Construction OS</h1>
          <p className="text-gray-400 text-sm mt-1">Field operations, schedule, and project management</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-900/30 border border-rose-500/30 rounded-xl text-rose-300 text-sm">
            {error}
          </div>
        )}

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { label: 'Open RFIs',       value: stats.open    ?? 0 },
            { label: 'Punch Items',      value: stats.punch   ?? 0 },
            { label: 'Urgent',           value: stats.urgent  ?? 0 },
          ].map(s => (
            <div key={s.label} className="bg-[#1e2d45] rounded-xl border border-white/10 p-4 text-center">
              <p className="text-2xl font-bold font-mono text-white">{s.value}</p>
              <p className="text-xs text-gray-400 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Module grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {modules.map(m => (
            <Link
              key={m.slug}
              href={`/project/${id}/${m.href}`}
              className="relative bg-[#1e2d45] hover:bg-[#243852] border border-white/10 hover:border-[#2ABFBF]/50 rounded-2xl p-6 transition-all group"
            >
              {m.badge !== null && m.badge !== undefined && m.badge > 0 && (
                <span className="absolute top-3 right-3 bg-rose-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {m.badge > 9 ? '9+' : m.badge}
                </span>
              )}
              <span className="text-3xl mb-3 block">{m.icon}</span>
              <p className="font-semibold text-white group-hover:text-[#2ABFBF] transition-colors">
                {m.label}
              </p>
            </Link>
          ))}
        </div>

        {/* Phase 2 preview */}
        <div className="mt-8 rounded-xl border border-white/5 bg-[#141f30] p-5">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">
            Phase 2 — Available with Pro tier
          </p>
          <div className="flex flex-wrap gap-2">
            {['Change Orders', 'Submittals', 'Drawings', 'Safety Log', 'Time Tracking', 'Team'].map(f => (
              <span key={f} className="text-xs px-3 py-1 rounded-full bg-white/5 text-gray-500 border border-white/5">
                {f}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
