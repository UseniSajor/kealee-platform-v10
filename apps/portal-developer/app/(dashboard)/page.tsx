'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Layers, DollarSign, Activity, TrendingUp, MapPin, Building2, Plus } from 'lucide-react'
import { listDevProjects, getDevStats, type DevProject, type DevStats } from '@/lib/api/developer'

const PHASE_COLORS: Record<string, string> = {
  IDEA: '#94A3B8', LAND: '#60A5FA', FEASIBILITY: '#34D399', DESIGN: '#A78BFA',
  PERMITS: '#F59E0B', PRECONSTRUCTION: '#FB923C', CONSTRUCTION: '#2ABFBF',
  INSPECTIONS: '#38A169', PAYMENTS: '#E8793A', CLOSEOUT: '#6B7280',
  OPERATIONS: '#10B981', ARCHIVE: '#4B5563',
}

const TYPE_LABELS: Record<string, string> = {
  MULTIFAMILY: 'Multifamily', MIXED_USE: 'Mixed-Use', COMMERCIAL: 'Commercial',
  NEW_HOME: 'New Construction', RENOVATION: 'Renovation', ADDITION: 'Addition',
}

function StatCard({ label, value, sub, icon: Icon, color }: { label: string; value: string; sub?: string; icon: any; color: string }) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm" style={{ borderLeft: `3px solid ${color}` }}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-gray-400">{label}</p>
          <p className="mt-1 text-2xl font-bold font-display" style={{ color: '#1E1B4B' }}>{value}</p>
          {sub && <p className="mt-0.5 text-xs text-gray-400">{sub}</p>}
        </div>
        <div className="rounded-xl p-3" style={{ backgroundColor: `${color}14` }}>
          <Icon className="h-5 w-5" style={{ color }} />
        </div>
      </div>
    </div>
  )
}

export default function DeveloperDashboard() {
  const [projects, setProjects] = useState<DevProject[]>([])
  const [stats, setStats]       = useState<DevStats | null>(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')

  useEffect(() => {
    async function load() {
      try {
        const [proj, st] = await Promise.allSettled([listDevProjects(), getDevStats()])
        if (proj.status === 'fulfilled') setProjects(proj.value.projects)
        if (st.status   === 'fulfilled') setStats(st.value)
        if (proj.status === 'rejected')  setError('Could not load projects')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const recentProjects = projects.slice(0, 5)

  return (
    <div>
      {/* Welcome banner */}
      <div className="mb-6 rounded-2xl px-6 py-5 overflow-hidden relative"
        style={{ background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 60%, #3730A3 100%)' }}>
        <div className="absolute right-0 top-0 h-full w-1/3 opacity-10"
          style={{ background: 'radial-gradient(circle at 80% 50%, #818CF8, transparent 70%)' }} />
        <div className="relative flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#818CF8' }}>Developer Portal</p>
            <h1 className="font-display text-2xl font-bold text-white mt-1">Developer Dashboard</h1>
            <p className="mt-1 text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>Portfolio overview, pipeline, and feasibility tracking.</p>
          </div>
          <Link
            href="/pipeline"
            className="shrink-0 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #6366F1, #4338CA)' }}
          >
            <Plus className="h-4 w-4" /> New Project
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-100" />
          ))
        ) : (
          <>
            <StatCard label="Total Projects"    value={String(stats?.totalProjects   ?? projects.length)} icon={Layers}     color="#1A2B4A" />
            <StatCard label="Active Projects"   value={String(stats?.activeProjects  ?? 0)}               icon={Activity}   color="#2ABFBF" />
            <StatCard label="Portfolio Budget"  value={stats ? `$${(stats.totalBudget / 1_000_000).toFixed(1)}M` : '—'} icon={DollarSign} color="#E8793A" />
            <StatCard label="Portfolio Health"  value={stats?.portfolioHealth ? `${stats.portfolioHealth}%` : '—'} sub="avg twin health score" icon={TrendingUp} color="#38A169" />
          </>
        )}
      </div>

      {/* Recent Projects */}
      <div className="mb-8 rounded-2xl border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="font-display text-base font-bold" style={{ color: '#1A2B4A' }}>Recent Projects</h2>
          <Link href="/pipeline" className="flex items-center gap-1 text-sm font-medium hover:underline" style={{ color: '#2ABFBF' }}>
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-gray-100" />)}
          </div>
        ) : error ? (
          <div className="p-6 text-center text-sm text-red-500">{error}</div>
        ) : recentProjects.length === 0 ? (
          <div className="p-10 text-center">
            <Building2 className="mx-auto mb-3 h-10 w-10 text-gray-300" />
            <p className="text-sm text-gray-500">No projects yet.</p>
            <Link href="/pipeline" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold" style={{ color: '#1A2B4A' }}>
              Start your first project <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {recentProjects.map(p => (
              <div key={p.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: 'rgba(26,43,74,0.08)' }}>
                  <Building2 className="h-5 w-5" style={{ color: '#1A2B4A' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: '#1A2B4A' }}>{p.name}</p>
                  <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                    <MapPin className="h-3 w-3" />
                    {[p.city, p.state].filter(Boolean).join(', ') || p.address || 'No address'}
                  </p>
                </div>
                <div className="hidden sm:flex items-center gap-3">
                  <span
                    className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                    style={{
                      backgroundColor: `${PHASE_COLORS[p.lifecyclePhase ?? ''] ?? '#94A3B8'}18`,
                      color: PHASE_COLORS[p.lifecyclePhase ?? ''] ?? '#94A3B8',
                    }}
                  >
                    {p.lifecyclePhase ?? 'Unknown'}
                  </span>
                  {p.totalBudget && (
                    <span className="text-xs font-medium text-gray-500">
                      ${(p.totalBudget / 1_000_000).toFixed(1)}M
                    </span>
                  )}
                </div>
                <Link href={`/pipeline?id=${p.id}`} className="shrink-0 text-gray-300 hover:text-gray-500">
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Land Pipeline',      href: '/pipeline',    color: '#1A2B4A', desc: 'Parcel analysis and project pipeline' },
          { label: 'Feasibility Studies', href: '/feasibility', color: '#2ABFBF', desc: 'Pro forma modeling and go/no-go analysis' },
          { label: 'Capital Stack',       href: '/capital',     color: '#E8793A', desc: 'Draw tracking and investor reporting' },
        ].map(item => (
          <Link
            key={item.href}
            href={item.href}
            className="group rounded-xl border border-gray-200 bg-white p-5 transition-all hover:shadow-md hover:border-gray-300"
          >
            <div className="mb-2 h-1 w-8 rounded-full" style={{ backgroundColor: item.color }} />
            <p className="font-semibold" style={{ color: '#1A2B4A' }}>{item.label}</p>
            <p className="mt-1 text-xs text-gray-400">{item.desc}</p>
            <span className="mt-3 flex items-center gap-1 text-xs font-semibold transition-all group-hover:gap-2" style={{ color: item.color }}>
              Open <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
