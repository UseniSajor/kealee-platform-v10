'use client'

import { useState } from 'react'
import { Boxes, Activity, Search, AlertTriangle, CheckCircle, Clock, TrendingUp, Cpu, Box, Layers } from 'lucide-react'

// ── v20 Seed: Twin KPI Counts by Tier ──────────────────────
// L1: 3 KPIs (budget_variance, schedule_spi, completion_pct)
// L2: 6 KPIs (+ risk_score, quality_score, open_issues)
// L3: 10 KPIs (+ safety_score, cost_performance_index, rfi_response_time, change_order_rate)

// ── v20 Seed: 7 OS Modules ─────────────────────────────────
const OS_MODULES: Record<string, string> = {
  'os-land': 'OS Land',
  'os-feas': 'OS Feasibility',
  'os-dev': 'OS Development',
  'os-pm': 'OS Project Management',
  'os-pay': 'OS Payments',
  'os-ops': 'OS Operations',
  'marketplace': 'Marketplace',
}

// ── v20 Seed: Lifecycle Phases ─────────────────────────────
const LIFECYCLE_PHASES: Record<string, string> = {
  IDEA: 'Idea',
  LAND: 'Land Acquisition & Analysis',
  FEASIBILITY: 'Feasibility Study',
  DESIGN: 'Design & Architecture',
  PERMITS: 'Permitting & Entitlements',
  PRECONSTRUCTION: 'Pre-Construction',
  CONSTRUCTION: 'Construction',
  INSPECTIONS: 'Inspections & QA',
  PAYMENTS: 'Payments & Finance',
  CLOSEOUT: 'Closeout',
  OPERATIONS: 'Operations & Maintenance',
  ARCHIVE: 'Archive',
}

const TWINS = [
  {
    id: '1', project: 'Riverside Multifamily', projectType: 'MULTIFAMILY',
    tier: 'L3' as const, health: 84, status: 'healthy' as const, phase: 'CONSTRUCTION', lastSync: '2 min ago',
    alerts: 2, kpiCount: 10, modules: ['os-land', 'os-feas', 'os-dev', 'os-pm', 'os-pay', 'os-ops', 'marketplace'],
    kpis: { budget_variance: 3.2, schedule_spi: 0.94, completion_pct: 52, risk_score: 42, quality_score: 88, open_issues: 7, safety_score: 91, cost_performance_index: 0.96, rfi_response_time: 3.2, change_order_rate: 4.1 },
  },
  {
    id: '2', project: 'Oak Hill Mixed-Use', projectType: 'MIXED_USE',
    tier: 'L3' as const, health: 91, status: 'healthy' as const, phase: 'DESIGN', lastSync: '5 min ago',
    alerts: 0, kpiCount: 10, modules: ['os-land', 'os-feas', 'os-dev', 'os-pm', 'os-pay', 'os-ops', 'marketplace'],
    kpis: { budget_variance: 1.8, schedule_spi: 1.02, completion_pct: 28, risk_score: 28, quality_score: 94, open_issues: 2, safety_score: 95, cost_performance_index: 1.01, rfi_response_time: 1.8, change_order_rate: 1.2 },
  },
  {
    id: '3', project: 'East Austin Townhomes', projectType: 'MULTIFAMILY',
    tier: 'L3' as const, health: 72, status: 'warning' as const, phase: 'PERMITS', lastSync: '8 min ago',
    alerts: 4, kpiCount: 10, modules: ['os-land', 'os-feas', 'os-dev', 'os-pm', 'os-pay', 'os-ops', 'marketplace'],
    kpis: { budget_variance: 6.4, schedule_spi: 0.87, completion_pct: 22, risk_score: 58, quality_score: 82, open_issues: 12, safety_score: 86, cost_performance_index: 0.91, rfi_response_time: 4.5, change_order_rate: 6.8 },
  },
  {
    id: '4', project: 'Domain Heights Tower', projectType: 'MIXED_USE',
    tier: 'L3' as const, health: 97, status: 'healthy' as const, phase: 'LAND', lastSync: '1 min ago',
    alerts: 0, kpiCount: 10, modules: ['os-land', 'os-feas', 'os-dev', 'os-pm', 'os-pay', 'os-ops', 'marketplace'],
    kpis: { budget_variance: 0.2, schedule_spi: 1.0, completion_pct: 3, risk_score: 12, quality_score: 98, open_issues: 0, safety_score: 100, cost_performance_index: 1.0, rfi_response_time: 0, change_order_rate: 0 },
  },
  {
    id: '5', project: 'Westlake Custom Home', projectType: 'NEW_HOME',
    tier: 'L2' as const, health: 86, status: 'healthy' as const, phase: 'CONSTRUCTION', lastSync: '4 min ago',
    alerts: 1, kpiCount: 6, modules: ['os-land', 'os-feas', 'os-dev', 'os-pm', 'os-pay', 'os-ops', 'marketplace'],
    kpis: { budget_variance: 4.1, schedule_spi: 0.92, completion_pct: 65, risk_score: 45, quality_score: 90, open_issues: 5 },
  },
  {
    id: '6', project: 'Congress Ave Retail', projectType: 'COMMERCIAL',
    tier: 'L2' as const, health: 95, status: 'healthy' as const, phase: 'FEASIBILITY', lastSync: '12 min ago',
    alerts: 0, kpiCount: 6, modules: ['os-feas', 'os-dev', 'os-pm', 'os-pay', 'marketplace'],
    kpis: { budget_variance: 0.5, schedule_spi: 1.0, completion_pct: 8, risk_score: 22, quality_score: 97, open_issues: 0 },
  },
  {
    id: '7', project: 'Slaughter Lane Office', projectType: 'COMMERCIAL',
    tier: 'L2' as const, health: 92, status: 'healthy' as const, phase: 'OPERATIONS', lastSync: '15 min ago',
    alerts: 1, kpiCount: 6, modules: ['os-feas', 'os-dev', 'os-pm', 'os-pay', 'marketplace'],
    kpis: { budget_variance: 2.8, schedule_spi: 0.95, completion_pct: 100, risk_score: 35, quality_score: 91, open_issues: 3 },
  },
  {
    id: '8', project: 'Tarrytown Addition', projectType: 'ADDITION',
    tier: 'L2' as const, health: 68, status: 'warning' as const, phase: 'INSPECTIONS', lastSync: '20 min ago',
    alerts: 3, kpiCount: 6, modules: ['os-dev', 'os-pm', 'os-pay', 'marketplace'],
    kpis: { budget_variance: 8.2, schedule_spi: 0.85, completion_pct: 88, risk_score: 64, quality_score: 76, open_issues: 14 },
  },
  {
    id: '9', project: 'Mueller Kitchen Remodel', projectType: 'RENOVATION',
    tier: 'L1' as const, health: 98, status: 'healthy' as const, phase: 'CLOSEOUT', lastSync: '3 min ago',
    alerts: 0, kpiCount: 3, modules: ['os-pm', 'os-pay', 'marketplace'],
    kpis: { budget_variance: 2.1, schedule_spi: 0.98, completion_pct: 95 },
  },
  {
    id: '10', project: 'Lakeway Bathroom Reno', projectType: 'RENOVATION',
    tier: 'L1' as const, health: 94, status: 'healthy' as const, phase: 'CONSTRUCTION', lastSync: '6 min ago',
    alerts: 0, kpiCount: 3, modules: ['os-pm', 'os-pay', 'marketplace'],
    kpis: { budget_variance: 1.5, schedule_spi: 1.01, completion_pct: 42 },
  },
  {
    id: '11', project: 'Cedar Park Garage ADU', projectType: 'ADDITION',
    tier: 'L2' as const, health: 59, status: 'critical' as const, phase: 'CONSTRUCTION', lastSync: '42 min ago',
    alerts: 6, kpiCount: 6, modules: ['os-dev', 'os-pm', 'os-pay', 'marketplace'],
    kpis: { budget_variance: 12.4, schedule_spi: 0.74, completion_pct: 38, risk_score: 82, quality_score: 62, open_issues: 28 },
  },
  {
    id: '12', project: 'Round Rock Master Bath', projectType: 'RENOVATION',
    tier: 'L1' as const, health: 91, status: 'healthy' as const, phase: 'DESIGN', lastSync: '9 min ago',
    alerts: 0, kpiCount: 3, modules: ['os-pm', 'os-pay', 'marketplace'],
    kpis: { budget_variance: 0.8, schedule_spi: 1.0, completion_pct: 15 },
  },
]

const statusColors: Record<string, { bg: string; text: string; ring: string }> = {
  healthy: { bg: 'rgba(56, 161, 105, 0.1)', text: '#38A169', ring: 'rgba(56, 161, 105, 0.2)' },
  warning: { bg: 'rgba(232, 121, 58, 0.1)', text: '#E8793A', ring: 'rgba(232, 121, 58, 0.2)' },
  critical: { bg: 'rgba(229, 62, 62, 0.1)', text: '#E53E3E', ring: 'rgba(229, 62, 62, 0.2)' },
}

const tierColors: Record<string, string> = { L1: '#94A3B8', L2: '#3B82F6', L3: '#8B5CF6' }

export default function TwinsPage() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [tierFilter, setTierFilter] = useState('all')

  const filtered = TWINS.filter(t => {
    const matchSearch = t.project.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || t.status === filter
    const matchTier = tierFilter === 'all' || t.tier === tierFilter
    return matchSearch && matchFilter && matchTier
  })

  // Tier counts
  const l1Count = TWINS.filter(t => t.tier === 'L1').length
  const l2Count = TWINS.filter(t => t.tier === 'L2').length
  const l3Count = TWINS.filter(t => t.tier === 'L3').length

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-white">Digital Twins</h1>
        <p className="mt-1 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
          {TWINS.length} twins | L1: {l1Count} (3 KPIs) | L2: {l2Count} (6 KPIs) | L3: {l3Count} (10 KPIs) | {TWINS.filter(t => t.alerts > 0).length} with alerts
        </p>
      </div>

      {/* Tier Summary Cards */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        {[
          { tier: 'L1', label: 'Light', count: l1Count, kpis: 3, desc: 'Budget, schedule, completion' },
          { tier: 'L2', label: 'Standard', count: l2Count, kpis: 6, desc: '+ risk, quality, open issues' },
          { tier: 'L3', label: 'Premium', count: l3Count, kpis: 10, desc: '+ safety, CPI, RFI time, CO rate' },
        ].map((t) => (
          <div key={t.tier} className="rounded-xl border p-4" style={{ borderColor: '#2A3D5F', backgroundColor: '#1A2B4A' }}>
            <div className="flex items-center gap-2">
              <Cpu className="h-5 w-5" style={{ color: tierColors[t.tier] }} />
              <div>
                <p className="text-sm font-bold text-white">{t.tier} - {t.label}</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{t.count} twins | {t.kpis} KPIs</p>
              </div>
            </div>
            <p className="mt-1 text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>{t.desc}</p>
          </div>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.3)' }} />
          <input type="text" placeholder="Search twins..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border py-2.5 pl-10 pr-4 text-sm text-white placeholder-white/30 focus:outline-none"
            style={{ borderColor: '#2A3D5F', backgroundColor: '#1A2B4A' }} />
        </div>
        <div className="flex gap-2">
          {['all', 'healthy', 'warning', 'critical'].map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className="rounded-lg px-3 py-2 text-xs font-medium capitalize"
              style={{
                backgroundColor: filter === f ? 'rgba(42, 191, 191, 0.15)' : '#2A3D5F',
                color: filter === f ? '#2ABFBF' : 'rgba(255,255,255,0.5)'
              }}>{f}</button>
          ))}
        </div>
        <div className="flex gap-2">
          {['all', 'L1', 'L2', 'L3'].map((t) => (
            <button key={t} onClick={() => setTierFilter(t)}
              className="rounded-lg px-3 py-2 text-xs font-medium"
              style={{
                backgroundColor: tierFilter === t ? 'rgba(139, 92, 246, 0.15)' : '#2A3D5F',
                color: tierFilter === t ? (t === 'all' ? '#8B5CF6' : tierColors[t]) : 'rgba(255,255,255,0.5)'
              }}>{t === 'all' ? 'All Tiers' : t}</button>
          ))}
        </div>
      </div>

      {/* Twin Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((twin) => {
          const colors = statusColors[twin.status]
          const tColor = tierColors[twin.tier]
          const phaseName = LIFECYCLE_PHASES[twin.phase] ?? twin.phase

          return (
            <div key={twin.id} className="rounded-xl border p-5" style={{ borderColor: '#2A3D5F', backgroundColor: '#1A2B4A', boxShadow: `0 0 0 1px ${colors.ring}` }}>
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-white">{twin.project}</h3>
                    <span className="rounded px-1.5 py-0.5 text-xs font-bold" style={{ backgroundColor: `${tColor}20`, color: tColor }}>{twin.tier}</span>
                  </div>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{phaseName} | {twin.projectType.replace('_', ' ')}</p>
                </div>
                <div className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium" style={{ backgroundColor: colors.bg, color: colors.text }}>
                  {twin.status === 'healthy' ? <CheckCircle className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                  {twin.status}
                </div>
              </div>

              {/* Health gauge */}
              <div className="mb-3">
                <div className="mb-1 flex justify-between text-xs">
                  <span style={{ color: 'rgba(255,255,255,0.4)' }}>Health Score</span>
                  <span className="font-bold" style={{ color: colors.text }}>{twin.health}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full" style={{ backgroundColor: '#0F1A2E' }}>
                  <div className="h-full rounded-full transition-all" style={{
                    width: `${twin.health}%`,
                    backgroundColor: twin.health >= 80 ? '#38A169' : twin.health >= 60 ? '#E8793A' : '#E53E3E'
                  }} />
                </div>
              </div>

              {/* KPI & Module Stats */}
              <div className="mb-3 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg p-2" style={{ backgroundColor: 'rgba(15, 26, 46, 0.5)' }}>
                  <p className="text-lg font-bold text-white">{twin.alerts}</p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Alerts</p>
                </div>
                <div className="rounded-lg p-2" style={{ backgroundColor: 'rgba(15, 26, 46, 0.5)' }}>
                  <p className="text-lg font-bold" style={{ color: tColor }}>{twin.kpiCount}</p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>KPIs</p>
                </div>
                <div className="rounded-lg p-2" style={{ backgroundColor: 'rgba(15, 26, 46, 0.5)' }}>
                  <p className="text-lg font-bold text-white">{twin.modules.length}</p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Modules</p>
                </div>
              </div>

              {/* Key KPIs */}
              <div className="mb-3 space-y-1">
                <div className="flex justify-between text-xs">
                  <span style={{ color: 'rgba(255,255,255,0.4)' }}>Budget Variance</span>
                  <span className="font-medium" style={{ color: twin.kpis.budget_variance > 10 ? '#E53E3E' : twin.kpis.budget_variance > 5 ? '#E8793A' : '#38A169' }}>
                    {twin.kpis.budget_variance > 0 ? '+' : ''}{twin.kpis.budget_variance}%
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span style={{ color: 'rgba(255,255,255,0.4)' }}>SPI</span>
                  <span className="font-medium" style={{ color: twin.kpis.schedule_spi < 0.8 ? '#E53E3E' : twin.kpis.schedule_spi < 0.9 ? '#E8793A' : '#38A169' }}>
                    {twin.kpis.schedule_spi.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span style={{ color: 'rgba(255,255,255,0.4)' }}>Completion</span>
                  <span className="font-medium text-white">{twin.kpis.completion_pct}%</span>
                </div>
              </div>

              {/* Active Modules */}
              <div className="flex flex-wrap gap-1">
                {twin.modules.map((mod) => (
                  <span key={mod} className="rounded px-1.5 py-0.5 text-xs" style={{ backgroundColor: 'rgba(42, 191, 191, 0.1)', color: 'rgba(255,255,255,0.4)' }}>
                    {OS_MODULES[mod] ?? mod}
                  </span>
                ))}
              </div>

              <p className="mt-3 text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>Last sync: {twin.lastSync}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
