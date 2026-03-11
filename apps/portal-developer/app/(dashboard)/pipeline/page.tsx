'use client'

import { useState } from 'react'
import { Map, MapPin, DollarSign, Ruler, ChevronRight, Plus, Filter, Layers, Cpu, Box } from 'lucide-react'

// ── v20 Seed: Lifecycle Phases ──────────────────────────────
const LIFECYCLE_PHASES = [
  { key: 'IDEA', name: 'Idea', order: 1 },
  { key: 'LAND', name: 'Land Acquisition & Analysis', order: 2 },
  { key: 'FEASIBILITY', name: 'Feasibility Study', order: 3 },
  { key: 'DESIGN', name: 'Design & Architecture', order: 4 },
  { key: 'PERMITS', name: 'Permitting & Entitlements', order: 5 },
  { key: 'PRECONSTRUCTION', name: 'Pre-Construction', order: 6 },
  { key: 'CONSTRUCTION', name: 'Construction', order: 7 },
  { key: 'INSPECTIONS', name: 'Inspections & QA', order: 8 },
  { key: 'PAYMENTS', name: 'Payments & Finance', order: 9 },
  { key: 'CLOSEOUT', name: 'Closeout', order: 10 },
  { key: 'OPERATIONS', name: 'Operations & Maintenance', order: 11 },
  { key: 'ARCHIVE', name: 'Archive', order: 12 },
] as const

// ── v20 Seed: Project Types ────────────────────────────────
// key, name, typicalTwinTier, defaultModules
const PROJECT_TYPE_MAP: Record<string, { name: string; tier: string; modules: string[] }> = {
  ADDITION: { name: 'Home Addition', tier: 'L2', modules: ['os-dev', 'os-pm', 'os-pay', 'marketplace'] },
  RENOVATION: { name: 'Renovation / Remodel', tier: 'L1', modules: ['os-pm', 'os-pay', 'marketplace'] },
  NEW_HOME: { name: 'New Home Construction', tier: 'L2', modules: ['os-land', 'os-feas', 'os-dev', 'os-pm', 'os-pay', 'os-ops', 'marketplace'] },
  MULTIFAMILY: { name: 'Multifamily Development', tier: 'L3', modules: ['os-land', 'os-feas', 'os-dev', 'os-pm', 'os-pay', 'os-ops', 'marketplace'] },
  COMMERCIAL: { name: 'Commercial Build-Out', tier: 'L2', modules: ['os-feas', 'os-dev', 'os-pm', 'os-pay', 'marketplace'] },
  MIXED_USE: { name: 'Mixed-Use Development', tier: 'L3', modules: ['os-land', 'os-feas', 'os-dev', 'os-pm', 'os-pay', 'os-ops', 'marketplace'] },
}

// Module display names from seed
const MODULE_NAMES: Record<string, string> = {
  'os-land': 'OS Land',
  'os-feas': 'OS Feasibility',
  'os-dev': 'OS Development',
  'os-pm': 'OS Project Management',
  'os-pay': 'OS Payments',
  'os-ops': 'OS Operations',
  'marketplace': 'Marketplace',
}

// ── Pipeline projects showing seed data relationships ──────
const PROJECTS = [
  {
    id: '1',
    name: 'Oak Hill Mixed-Use',
    address: '4200 W Hwy 290, Austin TX',
    projectType: 'MIXED_USE',
    phase: 'DESIGN',
    acres: 3.2,
    units: 48,
    totalBudget: 28500000,
    capitalStack: { seniorDebt: 19950000, mezzanine: 2850000, lpEquity: 4275000, gpEquity: 1425000 },
    twinHealth: 91,
  },
  {
    id: '2',
    name: 'Riverside Multifamily',
    address: '1200 Riverside Dr, Austin TX',
    projectType: 'MULTIFAMILY',
    phase: 'CONSTRUCTION',
    acres: 4.8,
    units: 120,
    totalBudget: 42000000,
    capitalStack: { seniorDebt: 29400000, mezzanine: 4200000, lpEquity: 6300000, gpEquity: 2100000 },
    twinHealth: 84,
  },
  {
    id: '3',
    name: 'Congress Ave Retail',
    address: '4800 S Congress Ave, Austin TX',
    projectType: 'COMMERCIAL',
    phase: 'FEASIBILITY',
    acres: 1.1,
    units: 6,
    totalBudget: 8200000,
    capitalStack: { seniorDebt: 5740000, mezzanine: 820000, lpEquity: 1230000, gpEquity: 410000 },
    twinHealth: 95,
  },
  {
    id: '4',
    name: 'East Austin Townhomes',
    address: '2100 E Cesar Chavez, Austin TX',
    projectType: 'MULTIFAMILY',
    phase: 'PERMITS',
    acres: 0.8,
    units: 16,
    totalBudget: 7200000,
    capitalStack: { seniorDebt: 5040000, mezzanine: 720000, lpEquity: 1080000, gpEquity: 360000 },
    twinHealth: 88,
  },
  {
    id: '5',
    name: 'Domain Heights Tower',
    address: '3300 Domain Pkwy, Austin TX',
    projectType: 'MIXED_USE',
    phase: 'LAND',
    acres: 2.4,
    units: 240,
    totalBudget: 98000000,
    capitalStack: { seniorDebt: 68600000, mezzanine: 9800000, lpEquity: 14700000, gpEquity: 4900000 },
    twinHealth: 97,
  },
  {
    id: '6',
    name: 'Slaughter Lane Custom',
    address: '8900 Slaughter Ln, Austin TX',
    projectType: 'COMMERCIAL',
    phase: 'OPERATIONS',
    acres: 5.7,
    units: 12,
    totalBudget: 14500000,
    capitalStack: { seniorDebt: 10150000, mezzanine: 1450000, lpEquity: 2175000, gpEquity: 725000 },
    twinHealth: 92,
  },
]

const PHASE_FILTERS = ['All', 'LAND', 'FEASIBILITY', 'DESIGN', 'PERMITS', 'CONSTRUCTION', 'OPERATIONS'] as const

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

export default function PipelinePage() {
  const [phaseFilter, setPhaseFilter] = useState<string>('All')

  const filtered = phaseFilter === 'All' ? PROJECTS : PROJECTS.filter(p => p.phase === phaseFilter)
  const totalBudget = PROJECTS.reduce((s, p) => s + p.totalBudget, 0)
  const totalUnits = PROJECTS.reduce((s, p) => s + p.units, 0)
  const totalAcres = PROJECTS.reduce((s, p) => s + p.acres, 0)

  // Phase distribution
  const phaseCounts = LIFECYCLE_PHASES.map(lp => ({
    ...lp,
    count: PROJECTS.filter(p => p.phase === lp.key).length,
  })).filter(p => p.count > 0)

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold" style={{ color: '#1A2B4A' }}>Developer Pipeline</h1>
          <p className="mt-1 text-sm text-gray-600">
            {PROJECTS.length} projects | {totalAcres.toFixed(1)} acres | {totalUnits} units | ${(totalBudget / 1000000).toFixed(1)}M total capital
          </p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white" style={{ backgroundColor: '#E8793A' }}>
          <Plus className="h-4 w-4" />
          New Project
        </button>
      </div>

      {/* Lifecycle Phase Bar */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Lifecycle Phase Distribution</h3>
        <div className="flex h-8 w-full overflow-hidden rounded-lg">
          {phaseCounts.map((phase) => {
            const width = (phase.count / PROJECTS.length) * 100
            const colors = ['#6366F1', '#3B82F6', '#F59E0B', '#2ABFBF', '#38A169', '#84CC16']
            const colorIdx = LIFECYCLE_PHASES.findIndex(lp => lp.key === phase.key) % colors.length
            return (
              <div
                key={phase.key}
                className="flex items-center justify-center text-xs font-bold text-white"
                style={{ width: `${width}%`, backgroundColor: colors[colorIdx], minWidth: '40px' }}
                title={`${phase.name}: ${phase.count} projects`}
              >
                {phase.count}
              </div>
            )
          })}
        </div>
        <div className="mt-2 flex flex-wrap gap-3">
          {phaseCounts.map((phase) => {
            const colors = ['#6366F1', '#3B82F6', '#F59E0B', '#2ABFBF', '#38A169', '#84CC16']
            const colorIdx = LIFECYCLE_PHASES.findIndex(lp => lp.key === phase.key) % colors.length
            return (
              <div key={phase.key} className="flex items-center gap-1.5 text-xs text-gray-500">
                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colors[colorIdx] }} />
                {phase.name} ({phase.count})
              </div>
            )
          })}
        </div>
      </div>

      {/* Phase Filter Tabs */}
      <div className="mb-6 flex gap-2 overflow-x-auto">
        {PHASE_FILTERS.map((s) => {
          const label = s === 'All' ? 'All' : LIFECYCLE_PHASES.find(lp => lp.key === s)?.name ?? s
          return (
            <button key={s} onClick={() => setPhaseFilter(s)}
              className={`shrink-0 rounded-lg px-3 py-2 text-xs font-medium ${
                phaseFilter === s ? 'text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              style={phaseFilter === s ? { backgroundColor: '#1A2B4A', color: '#2ABFBF' } : undefined}>{label}</button>
          )
        })}
      </div>

      {/* Project Cards */}
      <div className="space-y-4">
        {filtered.map((project) => {
          const pt = PROJECT_TYPE_MAP[project.projectType]
          const phaseName = LIFECYCLE_PHASES.find(lp => lp.key === project.phase)?.name ?? project.phase
          const totalCap = project.capitalStack.seniorDebt + project.capitalStack.mezzanine + project.capitalStack.lpEquity + project.capitalStack.gpEquity

          return (
            <div key={project.id} className="group rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold group-hover:text-teal" style={{ color: '#1A2B4A' }}>{project.name}</h3>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${tierColors[pt.tier]}`}>
                      {pt.tier} Twin
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                    <MapPin className="h-3 w-3" />{project.address}
                  </div>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${phaseColors[project.phase]}`}>{phaseName}</span>
              </div>

              {/* Project type & metrics */}
              <div className="mb-3 grid grid-cols-2 gap-4 sm:grid-cols-6">
                <div><p className="text-xs text-gray-500">Type</p><p className="text-sm font-semibold" style={{ color: '#1A2B4A' }}>{pt.name}</p></div>
                <div><p className="text-xs text-gray-500">Acreage</p><p className="text-sm font-semibold" style={{ color: '#1A2B4A' }}>{project.acres} ac</p></div>
                <div><p className="text-xs text-gray-500">Units</p><p className="text-sm font-semibold" style={{ color: '#1A2B4A' }}>{project.units}</p></div>
                <div><p className="text-xs text-gray-500">Total Budget</p><p className="text-sm font-semibold" style={{ color: '#1A2B4A' }}>${(project.totalBudget / 1000000).toFixed(1)}M</p></div>
                <div><p className="text-xs text-gray-500">Twin Health</p><p className="text-sm font-semibold" style={{ color: project.twinHealth >= 90 ? '#38A169' : project.twinHealth >= 75 ? '#E8793A' : '#E53E3E' }}>{project.twinHealth}%</p></div>
                <div><p className="text-xs text-gray-500">Twin Tier</p><p className="text-sm font-semibold" style={{ color: '#1A2B4A' }}>{pt.tier} ({pt.tier === 'L1' ? '3 KPIs' : pt.tier === 'L2' ? '6 KPIs' : '10 KPIs'})</p></div>
              </div>

              {/* Capital Stack Mini Bar */}
              <div className="mb-3">
                <p className="mb-1 text-xs text-gray-500">Capital Stack</p>
                <div className="flex h-3 w-full overflow-hidden rounded-full">
                  <div className="h-full" style={{ width: `${(project.capitalStack.seniorDebt / totalCap) * 100}%`, backgroundColor: '#1A2B4A' }} title={`Senior Debt: $${(project.capitalStack.seniorDebt / 1000000).toFixed(1)}M`} />
                  <div className="h-full" style={{ width: `${(project.capitalStack.mezzanine / totalCap) * 100}%`, backgroundColor: '#2ABFBF' }} title={`Mezzanine: $${(project.capitalStack.mezzanine / 1000000).toFixed(1)}M`} />
                  <div className="h-full" style={{ width: `${(project.capitalStack.lpEquity / totalCap) * 100}%`, backgroundColor: '#E8793A' }} title={`LP Equity: $${(project.capitalStack.lpEquity / 1000000).toFixed(1)}M`} />
                  <div className="h-full" style={{ width: `${(project.capitalStack.gpEquity / totalCap) * 100}%`, backgroundColor: '#D69E2E' }} title={`GP Equity: $${(project.capitalStack.gpEquity / 1000000).toFixed(1)}M`} />
                </div>
                <div className="mt-1 flex gap-3 text-xs text-gray-400">
                  <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: '#1A2B4A' }} />Debt ${(project.capitalStack.seniorDebt / 1000000).toFixed(1)}M</span>
                  <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: '#2ABFBF' }} />Mezz ${(project.capitalStack.mezzanine / 1000000).toFixed(1)}M</span>
                  <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: '#E8793A' }} />LP ${(project.capitalStack.lpEquity / 1000000).toFixed(1)}M</span>
                  <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: '#D69E2E' }} />GP ${(project.capitalStack.gpEquity / 1000000).toFixed(1)}M</span>
                </div>
              </div>

              {/* Active Modules */}
              <div className="mb-3">
                <p className="mb-1.5 text-xs text-gray-500">Active Modules</p>
                <div className="flex flex-wrap gap-1.5">
                  {pt.modules.map((mod) => (
                    <span key={mod} className="inline-flex items-center gap-1 rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-200">
                      <Box className="h-3 w-3" />
                      {MODULE_NAMES[mod] ?? mod}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <button className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">
                  View Details <ChevronRight className="h-3 w-3" />
                </button>
                <button className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">
                  <Layers className="h-3 w-3" /> Twin Dashboard
                </button>
                <button className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">
                  <Map className="h-3 w-3" /> Map View
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
