'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Layers, DollarSign, Activity, TrendingUp, MapPin, Building2, Plus } from 'lucide-react'
import { listDevProjects, getDevStats, type DevProject, type DevStats } from '@/lib/api/developer'

function normalizePhase(phase: string | null | undefined): string {
  const p = (phase ?? 'IDEA').toUpperCase().trim();
  if (p === 'FEASIBILITY' || p === 'CONCEPT' || p === 'LAND' || p === 'FEASIBILITY STUDY') return 'IDEA';
  if (p === 'PRECONSTRUCTION' || p === 'COSTING') return 'ESTIMATE';
  if (p === 'PERMITS') return 'PERMIT';
  if (p === 'CONTRACTOR_MATCH') return 'CONTRACTOR';
  if (p === 'CONSTRUCTION' || p === 'INSPECTIONS') return 'EXECUTION';
  if (p === 'CLOSEOUT' || p === 'COMPLETED' || p === 'OPERATIONS' || p === 'ARCHIVE' || p === 'PAYMENTS') return 'COMPLETION';
  return p;
}

const PHASE_COLORS: Record<string, string> = {
  IDEA:        '#64748B', // Slate
  DESIGN:      '#3182CE', // Blue
  ESTIMATE:    '#D97706', // Amber
  PERMIT:      '#E8793A', // Kealee Orange
  CONTRACTOR:  '#8B5CF6', // Purple
  EXECUTION:   '#2ABFBF', // Teal
  COMPLETION:  '#38A169', // Green
}

const TYPE_LABELS: Record<string, string> = {
  MULTIFAMILY: 'Multifamily', MIXED_USE: 'Mixed-Use', COMMERCIAL: 'Commercial',
  NEW_HOME: 'New Construction', RENOVATION: 'Renovation', ADDITION: 'Addition',
}

function StatCard({ label, value, sub, icon: Icon, color }: { label: string; value: string; sub?: string; icon: any; color: string }) {
  return (
    <div className="rounded-2xl bg-white border border-slate-100 p-5 shadow-sm hover:shadow transition relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: color }} />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">{label}</p>
          <p className="mt-2 text-2xl font-black font-sans tracking-tight text-slate-900">{value}</p>
          {sub && <p className="mt-1 text-[10px] font-semibold text-slate-400 uppercase">{sub}</p>}
        </div>
        <div className="rounded-xl p-3 shrink-0" style={{ backgroundColor: `${color}14` }}>
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
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="rounded-3xl px-8 py-7 text-white overflow-hidden relative shadow-lg bg-gradient-to-br from-slate-900 via-[#16142e] to-slate-950 border border-violet-500/5">
        <div className="absolute right-0 top-0 h-full w-1/3 opacity-15 pointer-events-none"
          style={{ background: 'radial-gradient(circle at 80% 50%, #818CF8, transparent 70%)' }} />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#818CF8] bg-[#818CF8]/10 px-2.5 py-1 rounded">
              Developer Portal
            </span>
            <h1 className="font-sans text-3xl font-extrabold text-white mt-3 tracking-tight">Developer Dashboard</h1>
            <p className="mt-1.5 text-sm text-slate-400">Portfolio overview, pipeline, and feasibility tracking.</p>
          </div>
          <Link
            href="/pipeline"
            className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-[#E8793A] hover:bg-[#D45C33] px-6 py-3.5 text-sm font-bold text-white shadow-md shadow-orange-950/20 transition-all hover:scale-[1.02]"
          >
            <Plus className="h-4.5 w-4.5" /> New Project
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-white border border-slate-100" />
          ))
        ) : (
          <>
            <StatCard label="Total Projects"    value={String(stats?.totalProjects   ?? projects.length)} icon={Layers}     color="#1A2B4A" />
            <StatCard label="Active Projects"   value={String(stats?.activeProjects  ?? 0)}               icon={Activity}   color="#2ABFBF" />
            <StatCard label="Portfolio Budget"  value={stats ? `$${(stats.totalBudget / 1_000_000).toFixed(1)}M` : '—'} icon={DollarSign} color="#E8793A" />
            <StatCard label="Portfolio Health"  value={stats?.portfolioHealth ? `${stats.portfolioHealth}%` : '—'} sub="avg health score" icon={TrendingUp} color="#38A169" />
          </>
        )}
      </div>

      {/* Recent Projects */}
      <div className="rounded-3xl border border-slate-100 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-50 px-6 py-4">
          <h2 className="font-sans text-sm font-bold text-slate-900">Recent Projects</h2>
          <Link href="/pipeline" className="flex items-center gap-1 text-xs font-semibold text-[#2ABFBF] hover:underline">
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-12 animate-pulse rounded-2xl bg-slate-50" />)}
          </div>
        ) : error ? (
          <div className="p-6 text-center text-sm font-bold text-red-500">{error}</div>
        ) : recentProjects.length === 0 ? (
          <div className="p-10 text-center">
            <Building2 className="mx-auto mb-3.5 h-10 w-10 text-slate-300" />
            <p className="text-sm font-medium text-slate-500">No developer projects yet.</p>
            <Link href="/pipeline" className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-[#E8793A] hover:underline">
              Start your first project <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {recentProjects.map(p => (
              <div key={p.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50/50 transition-colors duration-150">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-50 border border-slate-200/60 shadow-sm">
                  <Building2 className="h-5 w-5 text-slate-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{p.name}</p>
                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5 font-medium">
                    <MapPin className="h-3 w-3 text-slate-300" />
                    {[p.city, p.state].filter(Boolean).join(', ') || p.address || 'No address'}
                  </p>
                </div>
                <div className="hidden sm:flex items-center gap-4">
                  <span
                    className="rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider shadow-sm border border-black/5"
                    style={{
                      backgroundColor: `${PHASE_COLORS[normalizePhase(p.lifecyclePhase)] ?? '#94A3B8'}18`,
                      color: PHASE_COLORS[normalizePhase(p.lifecyclePhase)] ?? '#94A3B8',
                    }}
                  >
                    {normalizePhase(p.lifecyclePhase)}
                  </span>
                  {p.totalBudget && (
                    <span className="text-xs font-bold text-slate-600">
                      ${(p.totalBudget / 1_000_000).toFixed(1)}M
                    </span>
                  )}
                </div>
                <Link href={`/pipeline?id=${p.id}`} className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-slate-50 hover:bg-orange-50 text-slate-400 hover:text-[#E8793A] transition-colors">
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
            className="group rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md hover:border-[#E8793A]/20 hover:scale-[1.01]"
          >
            <div className="mb-3.5 h-1 w-8 rounded-full" style={{ backgroundColor: item.color }} />
            <h3 className="font-bold text-slate-900 text-base">{item.label}</h3>
            <p className="mt-1 text-xs text-slate-400 leading-relaxed">{item.desc}</p>
            <span className="mt-4 flex items-center gap-1 text-xs font-bold transition-all group-hover:gap-2" style={{ color: item.color }}>
              Open Section <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
