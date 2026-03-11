'use client'

import { LayoutGrid, TrendingUp, DollarSign, Building2, MapPin, Calendar, Activity, Layers, Box, Cpu } from 'lucide-react'

// ── v20 Seed: All 6 Project Types ──────────────────────────
const PROJECT_TYPE_MAP: Record<string, { name: string; tier: string; modules: string[] }> = {
  ADDITION: { name: 'Home Addition', tier: 'L2', modules: ['os-dev', 'os-pm', 'os-pay', 'marketplace'] },
  RENOVATION: { name: 'Renovation / Remodel', tier: 'L1', modules: ['os-pm', 'os-pay', 'marketplace'] },
  NEW_HOME: { name: 'New Home Construction', tier: 'L2', modules: ['os-land', 'os-feas', 'os-dev', 'os-pm', 'os-pay', 'os-ops', 'marketplace'] },
  MULTIFAMILY: { name: 'Multifamily Development', tier: 'L3', modules: ['os-land', 'os-feas', 'os-dev', 'os-pm', 'os-pay', 'os-ops', 'marketplace'] },
  COMMERCIAL: { name: 'Commercial Build-Out', tier: 'L2', modules: ['os-feas', 'os-dev', 'os-pm', 'os-pay', 'marketplace'] },
  MIXED_USE: { name: 'Mixed-Use Development', tier: 'L3', modules: ['os-land', 'os-feas', 'os-dev', 'os-pm', 'os-pay', 'os-ops', 'marketplace'] },
}

// ── v20 Seed: 7 OS Modules ─────────────────────────────────
const OS_MODULES = [
  { key: 'os-land', name: 'OS Land' },
  { key: 'os-feas', name: 'OS Feasibility' },
  { key: 'os-dev', name: 'OS Development' },
  { key: 'os-pm', name: 'OS Project Management' },
  { key: 'os-pay', name: 'OS Payments' },
  { key: 'os-ops', name: 'OS Operations' },
  { key: 'marketplace', name: 'Marketplace' },
]

// ── v20 Seed: Lifecycle Phases ─────────────────────────────
const LIFECYCLE_PHASES = [
  { key: 'IDEA', name: 'Idea', order: 1 },
  { key: 'LAND', name: 'Land', order: 2 },
  { key: 'FEASIBILITY', name: 'Feasibility', order: 3 },
  { key: 'DESIGN', name: 'Design', order: 4 },
  { key: 'PERMITS', name: 'Permits', order: 5 },
  { key: 'PRECONSTRUCTION', name: 'Pre-Con', order: 6 },
  { key: 'CONSTRUCTION', name: 'Construction', order: 7 },
  { key: 'INSPECTIONS', name: 'Inspections', order: 8 },
  { key: 'PAYMENTS', name: 'Payments', order: 9 },
  { key: 'CLOSEOUT', name: 'Closeout', order: 10 },
  { key: 'OPERATIONS', name: 'Operations', order: 11 },
  { key: 'ARCHIVE', name: 'Archive', order: 12 },
]

// ── Portfolio projects covering all 6 types ────────────────
const PROJECTS = [
  { id: '1', name: 'Oak Hill Mixed-Use', projectType: 'MIXED_USE', phase: 'DESIGN', progress: 28, totalCost: 28500000, currentValue: 31200000, twinHealth: 91, units: 48, location: 'Austin, TX', startDate: '2025-10' },
  { id: '2', name: 'Riverside Multifamily', projectType: 'MULTIFAMILY', phase: 'CONSTRUCTION', progress: 52, totalCost: 42000000, currentValue: 48600000, twinHealth: 84, units: 120, location: 'Austin, TX', startDate: '2025-06' },
  { id: '3', name: 'Congress Ave Retail', projectType: 'COMMERCIAL', phase: 'FEASIBILITY', progress: 8, totalCost: 8200000, currentValue: 3100000, twinHealth: 95, units: 6, location: 'Austin, TX', startDate: '2026-02' },
  { id: '4', name: 'East Austin Townhomes', projectType: 'MULTIFAMILY', phase: 'PERMITS', progress: 22, totalCost: 7200000, currentValue: 4800000, twinHealth: 88, units: 16, location: 'Austin, TX', startDate: '2025-12' },
  { id: '5', name: 'Domain Heights Tower', projectType: 'MIXED_USE', phase: 'LAND', progress: 3, totalCost: 98000000, currentValue: 12500000, twinHealth: 97, units: 240, location: 'Austin, TX', startDate: '2026-03' },
  { id: '6', name: 'Slaughter Lane Office', projectType: 'COMMERCIAL', phase: 'OPERATIONS', progress: 100, totalCost: 14500000, currentValue: 18200000, twinHealth: 92, units: 12, location: 'Austin, TX', startDate: '2024-01' },
  { id: '7', name: 'Westlake Custom Home', projectType: 'NEW_HOME', phase: 'CONSTRUCTION', progress: 65, totalCost: 2800000, currentValue: 3400000, twinHealth: 86, units: 1, location: 'Westlake Hills, TX', startDate: '2025-08' },
  { id: '8', name: 'Tarrytown Addition', projectType: 'ADDITION', phase: 'INSPECTIONS', progress: 88, totalCost: 450000, currentValue: 520000, twinHealth: 93, units: 1, location: 'Austin, TX', startDate: '2025-11' },
  { id: '9', name: 'Mueller Kitchen Remodel', projectType: 'RENOVATION', phase: 'CLOSEOUT', progress: 95, totalCost: 125000, currentValue: 140000, twinHealth: 98, units: 1, location: 'Austin, TX', startDate: '2026-01' },
]

const phaseColors: Record<string, string> = {
  IDEA: 'bg-gray-100 text-gray-700',
  LAND: 'bg-purple-100 text-purple-700',
  FEASIBILITY: 'bg-indigo-100 text-indigo-700',
  DESIGN: 'bg-blue-100 text-blue-700',
  PERMITS: 'bg-amber-100 text-amber-700',
  PRECONSTRUCTION: 'bg-orange-100 text-orange-700',
  CONSTRUCTION: 'bg-teal-100 text-teal-700',
  INSPECTIONS: 'bg-cyan-100 text-cyan-700',
  PAYMENTS: 'bg-green-100 text-green-700',
  CLOSEOUT: 'bg-emerald-100 text-emerald-700',
  OPERATIONS: 'bg-lime-100 text-lime-700',
  ARCHIVE: 'bg-stone-100 text-stone-700',
}

const tierColors: Record<string, string> = {
  L1: 'bg-gray-100 text-gray-700',
  L2: 'bg-blue-100 text-blue-700',
  L3: 'bg-purple-100 text-purple-700',
}

export default function PortfolioPage() {
  const totalInvestment = PROJECTS.reduce((s, p) => s + p.totalCost, 0)
  const totalValue = PROJECTS.reduce((s, p) => s + p.currentValue, 0)
  const totalUnits = PROJECTS.reduce((s, p) => s + p.units, 0)
  const avgHealth = Math.round(PROJECTS.reduce((s, p) => s + p.twinHealth, 0) / PROJECTS.length)

  // Twin tier distribution
  const tierCounts = { L1: 0, L2: 0, L3: 0 }
  PROJECTS.forEach(p => {
    const tier = PROJECT_TYPE_MAP[p.projectType]?.tier as 'L1' | 'L2' | 'L3'
    if (tier) tierCounts[tier]++
  })

  // Phase distribution
  const phaseCounts = LIFECYCLE_PHASES.map(lp => ({
    ...lp,
    count: PROJECTS.filter(p => p.phase === lp.key).length,
  })).filter(p => p.count > 0)

  // Module utilization
  const moduleUtilization = OS_MODULES.map(mod => {
    const activeCount = PROJECTS.filter(p => PROJECT_TYPE_MAP[p.projectType]?.modules.includes(mod.key)).length
    return { ...mod, activeCount, pct: Math.round((activeCount / PROJECTS.length) * 100) }
  })

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold" style={{ color: '#1A2B4A' }}>Portfolio Overview</h1>
        <p className="mt-1 text-sm text-gray-600">All {Object.keys(PROJECT_TYPE_MAP).length} project types across {LIFECYCLE_PHASES.length} lifecycle phases</p>
      </div>

      {/* Top-line Stats */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-5">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <LayoutGrid className="h-5 w-5" style={{ color: '#1A2B4A' }} />
          <p className="mt-2 text-2xl font-bold" style={{ color: '#1A2B4A' }}>{PROJECTS.length}</p>
          <p className="text-xs text-gray-500">Total Projects</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <DollarSign className="h-5 w-5" style={{ color: '#2ABFBF' }} />
          <p className="mt-2 text-2xl font-bold" style={{ color: '#1A2B4A' }}>${(totalInvestment / 1000000).toFixed(1)}M</p>
          <p className="text-xs text-gray-500">Total Investment</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <TrendingUp className="h-5 w-5" style={{ color: '#38A169' }} />
          <p className="mt-2 text-2xl font-bold" style={{ color: '#1A2B4A' }}>${(totalValue / 1000000).toFixed(1)}M</p>
          <p className="text-xs text-gray-500">Current Value</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <Building2 className="h-5 w-5" style={{ color: '#E8793A' }} />
          <p className="mt-2 text-2xl font-bold" style={{ color: '#1A2B4A' }}>{totalUnits}</p>
          <p className="text-xs text-gray-500">Total Units</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <Activity className="h-5 w-5" style={{ color: '#38A169' }} />
          <p className="mt-2 text-2xl font-bold" style={{ color: avgHealth >= 90 ? '#38A169' : avgHealth >= 75 ? '#E8793A' : '#E53E3E' }}>{avgHealth}%</p>
          <p className="text-xs text-gray-500">Avg Twin Health</p>
        </div>
      </div>

      {/* Twin Health & Lifecycle Distribution */}
      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        {/* Twin Tier Distribution */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold" style={{ color: '#1A2B4A' }}>Twin Tier Distribution</h3>
          <div className="flex items-center gap-6">
            {Object.entries(tierCounts).map(([tier, count]) => {
              const kpiCount = tier === 'L1' ? 3 : tier === 'L2' ? 6 : 10
              const tierLabel = tier === 'L1' ? 'Light' : tier === 'L2' ? 'Standard' : 'Premium'
              const color = tier === 'L1' ? '#94A3B8' : tier === 'L2' ? '#3B82F6' : '#8B5CF6'
              return (
                <div key={tier} className="flex-1 rounded-lg border border-gray-200 p-4 text-center">
                  <div className="mb-1 inline-flex h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: `${color}15` }}>
                    <Cpu className="h-5 w-5" style={{ color }} />
                  </div>
                  <p className="text-2xl font-bold" style={{ color: '#1A2B4A' }}>{count}</p>
                  <p className="text-xs font-semibold" style={{ color }}>{tier} - {tierLabel}</p>
                  <p className="text-xs text-gray-400">{kpiCount} KPIs tracked</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Lifecycle Phase Distribution */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold" style={{ color: '#1A2B4A' }}>Lifecycle Phase Distribution</h3>
          <div className="flex h-8 w-full overflow-hidden rounded-lg">
            {phaseCounts.map((phase, i) => {
              const colors = ['#6366F1', '#3B82F6', '#06B6D4', '#F59E0B', '#2ABFBF', '#38A169', '#84CC16', '#D69E2E', '#E8793A']
              const width = (phase.count / PROJECTS.length) * 100
              return (
                <div key={phase.key} className="flex items-center justify-center text-xs font-bold text-white" style={{ width: `${width}%`, backgroundColor: colors[i % colors.length], minWidth: '28px' }} title={`${phase.name}: ${phase.count}`}>
                  {phase.count}
                </div>
              )
            })}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {phaseCounts.map((phase, i) => {
              const colors = ['#6366F1', '#3B82F6', '#06B6D4', '#F59E0B', '#2ABFBF', '#38A169', '#84CC16', '#D69E2E', '#E8793A']
              return (
                <span key={phase.key} className="flex items-center gap-1 text-xs text-gray-500">
                  <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: colors[i % colors.length] }} />
                  {phase.name} ({phase.count})
                </span>
              )
            })}
          </div>
        </div>
      </div>

      {/* Module Utilization */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold" style={{ color: '#1A2B4A' }}>Module Utilization ({OS_MODULES.length} OS Modules)</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {moduleUtilization.map((mod) => (
            <div key={mod.key} className="rounded-lg border border-gray-200 p-3 text-center">
              <Box className="mx-auto h-5 w-5" style={{ color: mod.pct >= 80 ? '#38A169' : mod.pct >= 50 ? '#2ABFBF' : '#94A3B8' }} />
              <p className="mt-1.5 text-sm font-bold" style={{ color: '#1A2B4A' }}>{mod.activeCount}/{PROJECTS.length}</p>
              <p className="text-xs text-gray-500">{mod.name}</p>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                <div className="h-full rounded-full" style={{ width: `${mod.pct}%`, backgroundColor: mod.pct >= 80 ? '#38A169' : mod.pct >= 50 ? '#2ABFBF' : '#94A3B8' }} />
              </div>
              <p className="mt-0.5 text-xs text-gray-400">{mod.pct}%</p>
            </div>
          ))}
        </div>
      </div>

      {/* Project Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PROJECTS.map((project) => {
          const pt = PROJECT_TYPE_MAP[project.projectType]
          const phaseName = LIFECYCLE_PHASES.find(lp => lp.key === project.phase)?.name ?? project.phase
          return (
            <div key={project.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <h3 className="font-semibold" style={{ color: '#1A2B4A' }}>{project.name}</h3>
                  <div className="mt-0.5 flex items-center gap-1.5">
                    <span className="text-xs text-gray-500">{pt.name}</span>
                    <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${tierColors[pt.tier]}`}>{pt.tier}</span>
                  </div>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${phaseColors[project.phase]}`}>{phaseName}</span>
              </div>

              {/* Progress */}
              <div className="mb-3">
                <div className="mb-1 flex justify-between text-xs text-gray-500">
                  <span>Phase: {phaseName}</span>
                  <span>{project.progress}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                  <div className="h-full rounded-full" style={{ width: `${project.progress}%`, backgroundColor: '#2ABFBF' }} />
                </div>
              </div>

              {/* Twin Health */}
              <div className="mb-3 flex items-center gap-2">
                <Activity className="h-3.5 w-3.5" style={{ color: project.twinHealth >= 90 ? '#38A169' : project.twinHealth >= 75 ? '#E8793A' : '#E53E3E' }} />
                <span className="text-xs text-gray-500">Twin Health:</span>
                <span className="text-xs font-bold" style={{ color: project.twinHealth >= 90 ? '#38A169' : project.twinHealth >= 75 ? '#E8793A' : '#E53E3E' }}>{project.twinHealth}%</span>
                <span className="text-xs text-gray-400">| {pt.tier === 'L1' ? '3' : pt.tier === 'L2' ? '6' : '10'} KPIs</span>
              </div>

              {/* Financial */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div><p className="text-gray-500">Total Cost</p><p className="font-semibold" style={{ color: '#1A2B4A' }}>${(project.totalCost / 1000000).toFixed(2)}M</p></div>
                <div><p className="text-gray-500">Current Value</p><p className="font-semibold" style={{ color: '#38A169' }}>${(project.currentValue / 1000000).toFixed(2)}M</p></div>
              </div>

              {/* Modules */}
              <div className="mt-3 flex flex-wrap gap-1">
                {pt.modules.map((mod) => (
                  <span key={mod} className="rounded bg-gray-50 px-1.5 py-0.5 text-xs text-gray-500 ring-1 ring-gray-200">{mod}</span>
                ))}
              </div>

              <div className="mt-3 flex items-center gap-3 text-xs text-gray-400">
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{project.location}</span>
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{project.startDate}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
