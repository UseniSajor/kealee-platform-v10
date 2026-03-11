'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Activity, TrendingUp, Shield, Zap, DollarSign,
  CheckCircle, AlertTriangle, Clock, Eye, EyeOff,
  Boxes, BarChart3, FileText, Calendar, Hammer, MapPin,
  Thermometer, Droplets, Wifi, Camera, ChevronDown, ChevronUp,
  Target, AlertCircle, ArrowUpRight, ArrowDownRight,
} from 'lucide-react'

// --- MOCK DATA ---
const TWIN_META = {
  id: 'twin-001',
  projectId: '1',
  projectName: 'Modern Duplex - 5th Avenue',
  address: '142 5th Ave, Bethesda MD',
  tier: 'L2' as const,
  status: 'CONSTRUCTION',
  healthScore: 87,
  healthStatus: 'HEALTHY' as const,
  currentPhase: 'Framing',
  phaseProgress: 72,
  enabledModules: ['os-pm', 'os-pay', 'os-feas'],
  lastUpdated: '2026-03-10T14:30:00Z',
}

const KPI_DATA = [
  { key: 'budget_variance', label: 'Budget Variance', value: 3.2, target: 5, unit: '%', category: 'cost', status: 'HEALTHY', trend: -0.8, history: [5.1, 4.8, 4.2, 3.9, 3.5, 3.2] },
  { key: 'schedule_spi', label: 'Schedule Performance', value: 0.94, target: 1.0, unit: 'ratio', category: 'schedule', status: 'AT_RISK', trend: -0.02, history: [0.98, 0.97, 0.96, 0.95, 0.95, 0.94] },
  { key: 'completion_pct', label: 'Completion', value: 45, target: 100, unit: '%', category: 'schedule', status: 'HEALTHY', trend: 3, history: [30, 33, 36, 39, 42, 45] },
  { key: 'risk_score', label: 'Risk Score', value: 28, target: 40, unit: 'score', category: 'risk', status: 'HEALTHY', trend: -5, history: [45, 42, 38, 35, 32, 28] },
  { key: 'quality_score', label: 'Quality Score', value: 92, target: 80, unit: 'score', category: 'quality', status: 'HEALTHY', trend: 5, history: [82, 85, 87, 89, 90, 92] },
  { key: 'open_issues', label: 'Open Issues', value: 7, target: 10, unit: 'count', category: 'quality', status: 'HEALTHY', trend: -2, history: [12, 11, 10, 9, 8, 7] },
]

const PHASES = [
  { name: 'Intake', status: 'complete', progress: 100, start: 'Oct 2025', end: 'Oct 2025' },
  { name: 'Pre-Construction', status: 'complete', progress: 100, start: 'Oct 2025', end: 'Nov 2025' },
  { name: 'Site Prep', status: 'complete', progress: 100, start: 'Nov 2025', end: 'Nov 2025' },
  { name: 'Foundation', status: 'complete', progress: 100, start: 'Dec 2025', end: 'Dec 2025' },
  { name: 'Framing', status: 'active', progress: 72, start: 'Jan 2026', end: 'Mar 2026' },
  { name: 'MEP Rough-In', status: 'upcoming', progress: 0, start: 'Apr 2026', end: 'May 2026' },
  { name: 'Interior Finish', status: 'upcoming', progress: 0, start: 'May 2026', end: 'Jun 2026' },
  { name: 'Closeout', status: 'upcoming', progress: 0, start: 'Jul 2026', end: 'Jul 2026' },
]

const SCHEDULE_ITEMS = [
  { name: 'Roof trusses', trade: 'Framing', start: 20, end: 35, progress: 90, critical: true },
  { name: 'Roof sheathing', trade: 'Framing', start: 32, end: 42, progress: 40, critical: true },
  { name: 'Window install', trade: 'Glazing', start: 38, end: 48, progress: 0, critical: false },
  { name: 'Rough electrical', trade: 'Electrical', start: 42, end: 55, progress: 0, critical: true },
  { name: 'Rough plumbing', trade: 'Plumbing', start: 42, end: 52, progress: 0, critical: false },
  { name: 'HVAC rough', trade: 'HVAC', start: 45, end: 58, progress: 0, critical: true },
  { name: 'Insulation', trade: 'Insulation', start: 55, end: 62, progress: 0, critical: false },
  { name: 'Drywall', trade: 'Drywall', start: 62, end: 75, progress: 0, critical: true },
]

const PERMIT_TIMELINE = [
  { type: 'Building', status: 'Approved', date: '2025-10-15', icon: 'check' },
  { type: 'Grading', status: 'Approved', date: '2025-10-20', icon: 'check' },
  { type: 'Electrical', status: 'In Review', date: '2026-03-01', icon: 'clock' },
  { type: 'Plumbing', status: 'Submitted', date: '2026-03-05', icon: 'clock' },
  { type: 'Mechanical', status: 'Pending', date: '', icon: 'pending' },
]

const MILESTONES = [
  { name: 'Deposit', pct: 10, amount: 52000, status: 'paid', date: '2025-10-01' },
  { name: 'Foundation', pct: 15, amount: 78000, status: 'paid', date: '2025-12-20' },
  { name: 'Framing', pct: 20, amount: 104000, status: 'in_progress', date: '2026-03-15' },
  { name: 'MEP Rough', pct: 15, amount: 78000, status: 'upcoming', date: '2026-05-01' },
  { name: 'Drywall', pct: 15, amount: 78000, status: 'upcoming', date: '2026-06-01' },
  { name: 'Finish', pct: 15, amount: 78000, status: 'upcoming', date: '2026-06-30' },
  { name: 'Completion', pct: 10, amount: 52000, status: 'upcoming', date: '2026-07-15' },
]

const EVENTS = [
  { time: '2h ago', type: 'info', source: 'os-pm', message: 'Framing inspection scheduled for Thursday 3/12' },
  { time: '4h ago', type: 'success', source: 'os-pm', message: 'Roof truss delivery confirmed - arrives 3/11' },
  { time: '1d ago', type: 'warning', source: 'os-pay', message: 'Draw request #3 pending approval - $47,500' },
  { time: '2d ago', type: 'warning', source: 'os-pm', message: 'Window lead time extended to 8 weeks' },
  { time: '3d ago', type: 'success', source: 'os-pm', message: '2nd floor framing passed inspection' },
  { time: '5d ago', type: 'info', source: 'os-pm', message: 'Rough electrical permit submitted to jurisdiction' },
  { time: '1w ago', type: 'critical', source: 'os-pm', message: 'Material cost alert: lumber prices up 4.2%' },
]

const SENSORS = [
  { label: 'Temperature', value: '72°F', icon: Thermometer, color: '#E8793A' },
  { label: 'Humidity', value: '45%', icon: Droplets, color: '#2ABFBF' },
  { label: 'IoT Devices', value: '12', icon: Wifi, color: '#38A169' },
  { label: 'Site Cameras', value: '4', icon: Camera, color: '#7C3AED' },
]

type ViewerLayer = 'design' | 'permit' | 'construction' | 'financial' | 'operations' | 'land'
type TabId = 'overview' | 'schedule' | 'permits' | 'payments' | 'analytics' | 'events'

const LAYER_CONFIG: Record<ViewerLayer, { label: string; color: string; icon: typeof Boxes }> = {
  design: { label: 'Design', color: '#2ABFBF', icon: Boxes },
  permit: { label: 'Permits', color: '#E8793A', icon: FileText },
  construction: { label: 'Construction', color: '#38A169', icon: Hammer },
  financial: { label: 'Financial', color: '#7C3AED', icon: DollarSign },
  operations: { label: 'Operations', color: '#1A2B4A', icon: Target },
  land: { label: 'Land/Site', color: '#D97706', icon: MapPin },
}

const kpiStatusColor = (status: string) => {
  if (status === 'HEALTHY') return '#38A169'
  if (status === 'AT_RISK') return '#E8793A'
  return '#E53E3E'
}

const kpiStatusBg = (status: string) => {
  if (status === 'HEALTHY') return 'rgba(56,161,105,0.1)'
  if (status === 'AT_RISK') return 'rgba(232,121,58,0.1)'
  return 'rgba(229,62,62,0.1)'
}

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const w = 80
  const h = 24
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(' ')
  return (
    <svg width={w} height={h} className="inline-block">
      <polyline points={points} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" />
    </svg>
  )
}

function GanttBar({ item, maxDay }: { item: typeof SCHEDULE_ITEMS[0]; maxDay: number }) {
  const left = (item.start / maxDay) * 100
  const width = ((item.end - item.start) / maxDay) * 100
  return (
    <div className="flex items-center gap-3 py-1.5">
      <div className="w-28 flex-shrink-0 truncate text-xs text-gray-700">{item.name}</div>
      <div className="relative h-5 flex-1 rounded bg-gray-50">
        <div
          className="absolute top-0 h-full rounded"
          style={{
            left: `${left}%`,
            width: `${width}%`,
            backgroundColor: item.critical ? 'rgba(42,191,191,0.3)' : 'rgba(156,163,175,0.2)',
            border: item.critical ? '1px solid #2ABFBF' : '1px solid #D1D5DB',
          }}
        >
          {item.progress > 0 && (
            <div
              className="h-full rounded-l"
              style={{
                width: `${item.progress}%`,
                backgroundColor: item.critical ? '#2ABFBF' : '#9CA3AF',
              }}
            />
          )}
        </div>
      </div>
      <div className="w-14 flex-shrink-0 text-right text-xs text-gray-500">{item.trade}</div>
    </div>
  )
}

export default function DigitalTwinPage({ params }: { params: { id: string } }) {
  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const [activeLayers, setActiveLayers] = useState<Set<ViewerLayer>>(new Set(['design', 'construction']))
  const [viewerExpanded, setViewerExpanded] = useState(false)
  const [showEventFilter, setShowEventFilter] = useState<string | null>(null)

  const toggleLayer = (layer: ViewerLayer) => {
    setActiveLayers(prev => {
      const next = new Set(prev)
      if (next.has(layer)) next.delete(layer)
      else next.add(layer)
      return next
    })
  }

  const totalBudget = 520000
  const paidAmount = MILESTONES.filter(m => m.status === 'paid').reduce((s, m) => s + m.amount, 0)
  const inProgressAmount = MILESTONES.filter(m => m.status === 'in_progress').reduce((s, m) => s + m.amount, 0)

  const filteredEvents = showEventFilter
    ? EVENTS.filter(e => e.source === showEventFilter)
    : EVENTS

  const tabs: { id: TabId; label: string; icon: typeof Activity }[] = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'schedule', label: 'Schedule', icon: Calendar },
    { id: 'permits', label: 'Permits', icon: FileText },
    { id: 'payments', label: 'Payments', icon: DollarSign },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'events', label: 'Events', icon: AlertCircle },
  ]

  return (
    <div>
      {/* Header */}
      <Link href={`/project/${params.id}`} className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900">
        <ArrowLeft className="h-4 w-4" />
        Back to project
      </Link>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-bold" style={{ color: '#1A2B4A' }}>Digital Twin</h1>
            <span className="rounded-full px-2.5 py-1 text-xs font-bold text-white" style={{ backgroundColor: '#2ABFBF' }}>
              {TWIN_META.tier}
            </span>
            <span
              className="rounded-full px-2.5 py-1 text-xs font-medium"
              style={{ backgroundColor: kpiStatusBg(TWIN_META.healthStatus), color: kpiStatusColor(TWIN_META.healthStatus) }}
            >
              {TWIN_META.healthStatus}
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-600">{TWIN_META.projectName} | {TWIN_META.address}</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Health Score Ring */}
          <div className="relative flex h-16 w-16 items-center justify-center">
            <svg className="absolute" width={64} height={64} viewBox="0 0 64 64">
              <circle cx={32} cy={32} r={28} fill="none" stroke="#E5E7EB" strokeWidth={4} />
              <circle
                cx={32} cy={32} r={28}
                fill="none"
                stroke={kpiStatusColor(TWIN_META.healthStatus)}
                strokeWidth={4}
                strokeDasharray={`${TWIN_META.healthScore * 1.76} 176`}
                strokeLinecap="round"
                transform="rotate(-90 32 32)"
              />
            </svg>
            <span className="font-display text-lg font-bold" style={{ color: '#1A2B4A' }}>{TWIN_META.healthScore}</span>
          </div>
          <div>
            <p className="text-xs text-gray-500">Health Score</p>
            <p className="text-xs text-gray-400">Updated {new Date(TWIN_META.lastUpdated).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</p>
          </div>
        </div>
      </div>

      {/* 3D Viewer + Layer Controls */}
      <div className="mb-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between px-4 py-3" style={{ backgroundColor: '#1A2B4A' }}>
          <div className="flex items-center gap-3">
            <Boxes className="h-5 w-5" style={{ color: '#2ABFBF' }} />
            <span className="text-sm font-semibold text-white">3D Twin Viewer</span>
            <span className="rounded bg-white/10 px-2 py-0.5 text-xs text-white/70">{TWIN_META.status}</span>
          </div>
          <div className="flex items-center gap-2">
            {/* Layer toggles */}
            {(Object.entries(LAYER_CONFIG) as [ViewerLayer, typeof LAYER_CONFIG[ViewerLayer]][]).map(([key, cfg]) => (
              <button
                key={key}
                onClick={() => toggleLayer(key)}
                className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-all"
                style={{
                  backgroundColor: activeLayers.has(key) ? `${cfg.color}20` : 'rgba(255,255,255,0.1)',
                  color: activeLayers.has(key) ? cfg.color : 'rgba(255,255,255,0.5)',
                  border: activeLayers.has(key) ? `1px solid ${cfg.color}40` : '1px solid transparent',
                }}
              >
                {activeLayers.has(key) ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                {cfg.label}
              </button>
            ))}
            <button
              onClick={() => setViewerExpanded(!viewerExpanded)}
              className="ml-2 rounded p-1 text-white/60 hover:text-white"
            >
              {viewerExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* 3D Viewer Canvas Placeholder */}
        <div
          className="relative flex items-center justify-center transition-all"
          style={{
            height: viewerExpanded ? 500 : 280,
            background: 'linear-gradient(135deg, #0F1A2E 0%, #1A2B4A 50%, #2A3D5F 100%)',
          }}
        >
          {/* Grid overlay */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: 'linear-gradient(rgba(42,191,191,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(42,191,191,0.3) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }} />

          {/* Placeholder 3D wireframe */}
          <div className="relative">
            <svg width={320} height={200} viewBox="0 0 320 200" className="opacity-60">
              {/* Floor plane */}
              <polygon points="60,160 160,180 260,160 160,140" fill="none" stroke="#2ABFBF" strokeWidth={1} opacity={0.4} />
              {/* Walls */}
              <line x1={60} y1={160} x2={60} y2={80} stroke="#2ABFBF" strokeWidth={1} />
              <line x1={260} y1={160} x2={260} y2={80} stroke="#2ABFBF" strokeWidth={1} />
              <line x1={160} y1={140} x2={160} y2={60} stroke="#2ABFBF" strokeWidth={1} />
              <line x1={160} y1={180} x2={160} y2={100} stroke="#2ABFBF" strokeWidth={0.5} opacity={0.3} />
              {/* Roof */}
              <polygon points="60,80 160,60 260,80 160,40" fill="none" stroke="#E8793A" strokeWidth={1.5} />
              <line x1={160} y1={40} x2={160} y2={60} stroke="#E8793A" strokeWidth={1} />
              {/* Active element highlight */}
              <rect x={90} y={100} width={40} height={60} fill="rgba(42,191,191,0.15)" stroke="#2ABFBF" strokeWidth={1.5} strokeDasharray="4 2" />
              {/* Labels */}
              <text x={110} y={95} fill="#2ABFBF" fontSize={9} textAnchor="middle">Framing</text>
              <text x={110} y={170} fill="rgba(255,255,255,0.4)" fontSize={8} textAnchor="middle">72% complete</text>
            </svg>

            {/* Active layers indicator */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
              {Array.from(activeLayers).map(layer => (
                <div key={layer} className="h-1.5 w-6 rounded-full" style={{ backgroundColor: LAYER_CONFIG[layer].color }} />
              ))}
            </div>
          </div>

          {/* Overlay text */}
          <div className="absolute bottom-4 left-4 text-xs text-white/40">
            React Three Fiber + web-ifc | Click elements to inspect
          </div>
          <div className="absolute bottom-4 right-4 text-xs text-white/40">
            {activeLayers.size} layer{activeLayers.size !== 1 ? 's' : ''} active
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        {KPI_DATA.map((kpi) => (
          <div key={kpi.key} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs text-gray-500">{kpi.label}</span>
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: kpiStatusColor(kpi.status) }}
              />
            </div>
            <div className="flex items-end justify-between">
              <div>
                <p className="font-display text-xl font-bold" style={{ color: '#1A2B4A' }}>
                  {kpi.value}{kpi.unit === '%' ? '%' : kpi.unit === 'ratio' ? '' : ''}
                </p>
                <div className="mt-0.5 flex items-center gap-1">
                  {kpi.trend > 0 ? (
                    <ArrowUpRight className="h-3 w-3" style={{ color: kpi.category === 'risk' || kpi.key === 'open_issues' ? '#E53E3E' : '#38A169' }} />
                  ) : (
                    <ArrowDownRight className="h-3 w-3" style={{ color: kpi.category === 'risk' || kpi.key === 'open_issues' ? '#38A169' : '#E8793A' }} />
                  )}
                  <span className="text-xs text-gray-500">{Math.abs(kpi.trend)}{kpi.unit === '%' ? '%' : ''}</span>
                </div>
              </div>
              <MiniSparkline data={kpi.history} color={kpiStatusColor(kpi.status)} />
            </div>
          </div>
        ))}
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-1.5 whitespace-nowrap border-b-2 px-4 pb-3 pt-1 text-sm font-medium transition-colors"
              style={{
                borderColor: activeTab === tab.id ? '#2ABFBF' : 'transparent',
                color: activeTab === tab.id ? '#2ABFBF' : '#6B7280',
              }}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Phase Timeline */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="font-display mb-4 text-lg font-semibold" style={{ color: '#1A2B4A' }}>Lifecycle Phases</h2>
            <div className="space-y-3">
              {PHASES.map((phase) => (
                <div key={phase.name}>
                  <div className="mb-1 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {phase.status === 'complete' ? (
                        <CheckCircle className="h-4 w-4" style={{ color: '#38A169' }} />
                      ) : phase.status === 'active' ? (
                        <Activity className="h-4 w-4" style={{ color: '#2ABFBF' }} />
                      ) : (
                        <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                      )}
                      <span className="text-sm font-medium" style={{ color: phase.status === 'active' ? '#1A2B4A' : phase.status === 'complete' ? '#38A169' : '#9CA3AF' }}>
                        {phase.name}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">{phase.start} - {phase.end}</span>
                  </div>
                  <div className="ml-6 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${phase.progress}%`,
                        backgroundColor: phase.status === 'complete' ? '#38A169' : phase.status === 'active' ? '#2ABFBF' : '#E5E7EB',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Events + Sensors */}
          <div className="space-y-6">
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="font-display mb-4 text-lg font-semibold" style={{ color: '#1A2B4A' }}>Recent Events</h2>
              <div className="space-y-2">
                {EVENTS.slice(0, 5).map((evt, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 rounded-lg p-2.5"
                    style={{
                      backgroundColor: evt.type === 'critical' ? 'rgba(229,62,62,0.06)' : evt.type === 'warning' ? 'rgba(232,121,58,0.06)' : evt.type === 'success' ? 'rgba(56,161,105,0.06)' : 'rgba(42,191,191,0.06)',
                    }}
                  >
                    <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full" style={{
                      backgroundColor: evt.type === 'critical' ? 'rgba(229,62,62,0.15)' : evt.type === 'warning' ? 'rgba(232,121,58,0.15)' : evt.type === 'success' ? 'rgba(56,161,105,0.15)' : 'rgba(42,191,191,0.15)',
                    }}>
                      {evt.type === 'critical' ? <AlertTriangle className="h-3 w-3" style={{ color: '#E53E3E' }} /> :
                       evt.type === 'warning' ? <AlertTriangle className="h-3 w-3" style={{ color: '#E8793A' }} /> :
                       evt.type === 'success' ? <CheckCircle className="h-3 w-3" style={{ color: '#38A169' }} /> :
                       <Activity className="h-3 w-3" style={{ color: '#2ABFBF' }} />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{evt.message}</p>
                      <div className="mt-0.5 flex items-center gap-2">
                        <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600">{evt.source}</span>
                        <span className="text-xs text-gray-400">{evt.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="font-display mb-4 text-lg font-semibold" style={{ color: '#1A2B4A' }}>Site Sensors</h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {SENSORS.map((s) => (
                  <div key={s.label} className="text-center">
                    <s.icon className="mx-auto h-6 w-6" style={{ color: s.color }} />
                    <p className="font-display mt-1 text-lg font-bold" style={{ color: '#1A2B4A' }}>{s.value}</p>
                    <p className="text-xs text-gray-500">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'schedule' && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold" style={{ color: '#1A2B4A' }}>Construction Schedule</h2>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <span className="h-2 w-6 rounded-full" style={{ backgroundColor: '#2ABFBF' }} /> Critical Path
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-6 rounded-full bg-gray-300" /> Non-Critical
              </span>
            </div>
          </div>

          {/* Week markers */}
          <div className="mb-2 flex">
            <div className="w-28 flex-shrink-0" />
            <div className="flex flex-1 justify-between text-xs text-gray-400">
              {['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4', 'Wk 5', 'Wk 6', 'Wk 7', 'Wk 8', 'Wk 9', 'Wk 10'].map(w => (
                <span key={w}>{w}</span>
              ))}
            </div>
            <div className="w-14 flex-shrink-0" />
          </div>

          <div className="divide-y divide-gray-50">
            {SCHEDULE_ITEMS.map((item) => (
              <GanttBar key={item.name} item={item} maxDay={80} />
            ))}
          </div>

          {/* Summary */}
          <div className="mt-6 grid grid-cols-3 gap-4 rounded-lg p-4" style={{ backgroundColor: '#F7FAFC' }}>
            <div>
              <p className="text-xs text-gray-500">On-Time Tasks</p>
              <p className="font-display text-xl font-bold" style={{ color: '#38A169' }}>5/8</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Critical Path Items</p>
              <p className="font-display text-xl font-bold" style={{ color: '#2ABFBF' }}>5</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Schedule Variance</p>
              <p className="font-display text-xl font-bold" style={{ color: '#E8793A' }}>-3 days</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'permits' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="font-display mb-4 text-lg font-semibold" style={{ color: '#1A2B4A' }}>Permit Status</h2>
            <div className="space-y-4">
              {PERMIT_TIMELINE.map((permit) => (
                <div key={permit.type} className="flex items-center gap-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full" style={{
                    backgroundColor: permit.icon === 'check' ? 'rgba(56,161,105,0.1)' : permit.icon === 'clock' ? 'rgba(232,121,58,0.1)' : 'rgba(156,163,175,0.1)',
                  }}>
                    {permit.icon === 'check' ? <CheckCircle className="h-5 w-5" style={{ color: '#38A169' }} /> :
                     permit.icon === 'clock' ? <Clock className="h-5 w-5" style={{ color: '#E8793A' }} /> :
                     <div className="h-3 w-3 rounded-full border-2 border-gray-400" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium" style={{ color: '#1A2B4A' }}>{permit.type} Permit</p>
                    <p className="text-xs text-gray-500">{permit.date ? new Date(permit.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Not yet submitted'}</p>
                  </div>
                  <span
                    className="rounded-full px-2.5 py-1 text-xs font-medium"
                    style={{
                      backgroundColor: permit.status === 'Approved' ? 'rgba(56,161,105,0.1)' : permit.status === 'In Review' ? 'rgba(232,121,58,0.1)' : permit.status === 'Submitted' ? 'rgba(42,191,191,0.1)' : 'rgba(156,163,175,0.1)',
                      color: permit.status === 'Approved' ? '#38A169' : permit.status === 'In Review' ? '#E8793A' : permit.status === 'Submitted' ? '#2ABFBF' : '#9CA3AF',
                    }}
                  >
                    {permit.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="font-display mb-4 text-lg font-semibold" style={{ color: '#1A2B4A' }}>AI Permit Review</h2>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ backgroundColor: 'rgba(42,191,191,0.1)' }}>
                <Shield className="h-6 w-6" style={{ color: '#2ABFBF' }} />
              </div>
              <div>
                <p className="font-display text-2xl font-bold" style={{ color: '#1A2B4A' }}>94/100</p>
                <p className="text-xs text-gray-500">Submission readiness score</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-800">Plans meet code requirements</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-800">All required documents attached</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg p-3" style={{ backgroundColor: 'rgba(232,121,58,0.08)' }}>
                <AlertTriangle className="h-4 w-4" style={{ color: '#E8793A' }} />
                <span className="text-sm" style={{ color: '#92400E' }}>Egress width may need revision on Sheet A2.1</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'payments' && (
        <div className="space-y-6">
          {/* Budget Overview */}
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-xs text-gray-500">Total Budget</p>
              <p className="font-display mt-1 text-2xl font-bold" style={{ color: '#1A2B4A' }}>${(totalBudget / 1000).toFixed(0)}K</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-xs text-gray-500">Paid to Date</p>
              <p className="font-display mt-1 text-2xl font-bold" style={{ color: '#38A169' }}>${(paidAmount / 1000).toFixed(0)}K</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-xs text-gray-500">In Progress</p>
              <p className="font-display mt-1 text-2xl font-bold" style={{ color: '#E8793A' }}>${(inProgressAmount / 1000).toFixed(0)}K</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-xs text-gray-500">Remaining</p>
              <p className="font-display mt-1 text-2xl font-bold" style={{ color: '#1A2B4A' }}>${((totalBudget - paidAmount - inProgressAmount) / 1000).toFixed(0)}K</p>
            </div>
          </div>

          {/* Milestone Progress Bar */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="font-display mb-4 text-lg font-semibold" style={{ color: '#1A2B4A' }}>Payment Milestones</h2>
            <div className="mb-4 flex h-4 w-full overflow-hidden rounded-full bg-gray-100">
              {MILESTONES.map((m) => (
                <div
                  key={m.name}
                  className="relative h-full transition-all"
                  style={{
                    width: `${m.pct}%`,
                    backgroundColor: m.status === 'paid' ? '#38A169' : m.status === 'in_progress' ? '#2ABFBF' : '#E5E7EB',
                    borderRight: '1px solid white',
                  }}
                  title={`${m.name}: ${m.pct}% ($${m.amount.toLocaleString()})`}
                />
              ))}
            </div>
            <div className="space-y-3">
              {MILESTONES.map((m) => (
                <div key={m.name} className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full" style={{
                      backgroundColor: m.status === 'paid' ? 'rgba(56,161,105,0.15)' : m.status === 'in_progress' ? 'rgba(42,191,191,0.15)' : 'rgba(156,163,175,0.1)',
                    }}>
                      {m.status === 'paid' ? <CheckCircle className="h-3.5 w-3.5" style={{ color: '#38A169' }} /> :
                       m.status === 'in_progress' ? <Clock className="h-3.5 w-3.5" style={{ color: '#2ABFBF' }} /> :
                       <div className="h-2 w-2 rounded-full bg-gray-300" />}
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-900">{m.name}</span>
                      <span className="ml-2 text-xs text-gray-400">({m.pct}%)</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold" style={{ color: '#1A2B4A' }}>${m.amount.toLocaleString()}</span>
                    <span className="ml-3 text-xs font-medium" style={{
                      color: m.status === 'paid' ? '#38A169' : m.status === 'in_progress' ? '#2ABFBF' : '#9CA3AF',
                    }}>
                      {m.status === 'paid' ? 'Paid' : m.status === 'in_progress' ? 'Pending' : m.date ? new Date(m.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : ''}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Budget vs Actual */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="font-display mb-4 text-lg font-semibold" style={{ color: '#1A2B4A' }}>Budget vs Actual</h2>
            <div className="space-y-3">
              {[
                { label: 'Materials', budget: 180000, actual: 172000 },
                { label: 'Labor', budget: 195000, actual: 48000 },
                { label: 'Equipment', budget: 45000, actual: 12000 },
                { label: 'Permits & Fees', budget: 25000, actual: 18500 },
                { label: 'Contingency', budget: 75000, actual: 8500 },
              ].map((item) => {
                const pctBudget = (item.actual / item.budget) * 100
                return (
                  <div key={item.label}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="text-gray-700">{item.label}</span>
                      <span className="text-gray-500">
                        ${(item.actual / 1000).toFixed(0)}K / ${(item.budget / 1000).toFixed(0)}K
                      </span>
                    </div>
                    <div className="relative h-3 w-full overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(pctBudget, 100)}%`,
                          backgroundColor: pctBudget > 95 ? '#E53E3E' : pctBudget > 80 ? '#E8793A' : '#2ABFBF',
                        }}
                      />
                      {/* Budget marker */}
                      <div className="absolute top-0 h-full w-0.5 bg-gray-400" style={{ left: '100%' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Cost Performance */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="font-display mb-4 text-lg font-semibold" style={{ color: '#1A2B4A' }}>Performance Indices</h2>
            <div className="space-y-6">
              {[
                { label: 'CPI (Cost Performance)', value: 1.03, target: 1.0, color: '#38A169' },
                { label: 'SPI (Schedule Performance)', value: 0.94, target: 1.0, color: '#E8793A' },
                { label: 'TCPI (To-Complete)', value: 0.98, target: 1.0, color: '#2ABFBF' },
              ].map((idx) => (
                <div key={idx.label}>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm text-gray-700">{idx.label}</span>
                    <span className="font-display text-lg font-bold" style={{ color: idx.color }}>{idx.value.toFixed(2)}</span>
                  </div>
                  <div className="relative h-3 w-full rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${Math.min(idx.value * 50, 100)}%`, backgroundColor: idx.color }}
                    />
                    {/* Target marker at 50% = 1.0 */}
                    <div className="absolute top-0 h-full w-0.5 bg-gray-600" style={{ left: '50%' }} />
                    <span className="absolute -top-4 text-[10px] text-gray-400" style={{ left: '50%', transform: 'translateX(-50%)' }}>1.0</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-lg p-4" style={{ backgroundColor: '#F7FAFC' }}>
              <p className="text-xs font-medium" style={{ color: '#1A2B4A' }}>AI Forecast</p>
              <p className="mt-1 text-sm text-gray-600">
                Based on current CPI/SPI trends, projected final cost is <strong style={{ color: '#38A169' }}>$505K</strong> (2.9% under budget).
                Schedule completion projected for <strong style={{ color: '#E8793A' }}>Jul 18, 2026</strong> (3 days late).
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'events' && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold" style={{ color: '#1A2B4A' }}>Twin Event Stream</h2>
            <div className="flex gap-2">
              {['all', 'os-pm', 'os-pay'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setShowEventFilter(filter === 'all' ? null : filter)}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
                  style={{
                    backgroundColor: (showEventFilter === null && filter === 'all') || showEventFilter === filter ? 'rgba(42,191,191,0.1)' : 'rgba(156,163,175,0.1)',
                    color: (showEventFilter === null && filter === 'all') || showEventFilter === filter ? '#2ABFBF' : '#6B7280',
                  }}
                >
                  {filter === 'all' ? 'All' : filter}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            {filteredEvents.map((evt, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-lg border border-gray-100 p-3 transition-colors hover:bg-gray-50"
              >
                <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full" style={{
                  backgroundColor: evt.type === 'critical' ? 'rgba(229,62,62,0.15)' : evt.type === 'warning' ? 'rgba(232,121,58,0.15)' : evt.type === 'success' ? 'rgba(56,161,105,0.15)' : 'rgba(42,191,191,0.15)',
                }}>
                  {evt.type === 'critical' ? <AlertTriangle className="h-3 w-3" style={{ color: '#E53E3E' }} /> :
                   evt.type === 'warning' ? <AlertTriangle className="h-3 w-3" style={{ color: '#E8793A' }} /> :
                   evt.type === 'success' ? <CheckCircle className="h-3 w-3" style={{ color: '#38A169' }} /> :
                   <Activity className="h-3 w-3" style={{ color: '#2ABFBF' }} />}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{evt.message}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="rounded px-1.5 py-0.5 text-[10px] font-medium" style={{ backgroundColor: 'rgba(26,43,74,0.08)', color: '#1A2B4A' }}>{evt.source}</span>
                    <span className="rounded px-1.5 py-0.5 text-[10px] font-medium" style={{
                      backgroundColor: evt.type === 'critical' ? 'rgba(229,62,62,0.1)' : evt.type === 'warning' ? 'rgba(232,121,58,0.1)' : evt.type === 'success' ? 'rgba(56,161,105,0.1)' : 'rgba(42,191,191,0.1)',
                      color: evt.type === 'critical' ? '#E53E3E' : evt.type === 'warning' ? '#E8793A' : evt.type === 'success' ? '#38A169' : '#2ABFBF',
                    }}>{evt.type}</span>
                    <span className="text-xs text-gray-400">{evt.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Modules Footer */}
      <div className="mt-8 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Boxes className="h-4 w-4" style={{ color: '#2ABFBF' }} />
            <span className="text-xs font-medium text-gray-600">Active Modules:</span>
            {TWIN_META.enabledModules.map((mod) => (
              <span key={mod} className="rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ backgroundColor: 'rgba(42,191,191,0.1)', color: '#2ABFBF' }}>
                {mod}
              </span>
            ))}
          </div>
          <span className="text-xs text-gray-400">Twin ID: {TWIN_META.id}</span>
        </div>
      </div>
    </div>
  )
}
