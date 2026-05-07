'use client'

import { useEffect, useState, useCallback } from 'react'
import { Plug, CheckCircle, AlertTriangle, XCircle, RefreshCw, Box, Loader2 } from 'lucide-react'

// ── Static OS module definitions (internal — cannot be externally pinged) ────

const OS_MODULE_INTEGRATIONS = [
  {
    id: 'mod-1', name: 'OS Land', key: 'os-land',
    category: 'Internal Module',
    description: 'Land acquisition and parcel analysis. Site search, zoning lookup, environmental screening, and comparable analysis.',
    defaultPhases: ['LAND'],
  },
  {
    id: 'mod-2', name: 'OS Feasibility', key: 'os-feas',
    category: 'Internal Module',
    description: 'Feasibility study module. Financial pro-forma, construction cost estimation, market analysis, and go/no-go dashboard.',
    defaultPhases: ['FEASIBILITY'],
  },
  {
    id: 'mod-3', name: 'OS Development', key: 'os-dev',
    category: 'Internal Module',
    description: 'Design and development module. Architect coordination, drawing management, AI concept generation, and permit document preparation.',
    defaultPhases: ['DESIGN', 'PERMITS'],
  },
  {
    id: 'mod-4', name: 'OS Project Management', key: 'os-pm',
    category: 'Internal Module',
    description: 'Core project management. Scheduling, milestone tracking, daily logs, RFIs, submittals, change orders, inspections, and closeout.',
    defaultPhases: ['PRECONSTRUCTION', 'CONSTRUCTION', 'INSPECTIONS', 'CLOSEOUT'],
  },
  {
    id: 'mod-5', name: 'OS Payments', key: 'os-pay',
    category: 'Internal Module',
    description: 'Financial and payments module. Escrow management, milestone payments, draw requests, retainage, lien waivers, and budget tracking.',
    defaultPhases: ['PAYMENTS', 'CLOSEOUT'],
  },
  {
    id: 'mod-6', name: 'OS Operations', key: 'os-ops',
    category: 'Internal Module',
    description: 'Post-construction operations module. Warranty tracking, maintenance scheduling, facility management, and service requests.',
    defaultPhases: ['OPERATIONS'],
  },
  {
    id: 'mod-7', name: 'Marketplace', key: 'marketplace',
    category: 'Internal Module',
    description: 'Contractor marketplace module. Bidding, contractor matching, lead distribution, ratings, and portfolio management.',
    defaultPhases: ['IDEA', 'PRECONSTRUCTION'],
  },
]

// Static descriptions for external services (status/latency from real pings)
const EXTERNAL_SERVICE_META: Record<string, {
  description: string
  connectedModules: string[]
}> = {
  stripe: {
    description: 'Payment processing, subscriptions, checkout sessions. Connected to OS Payments for milestone draws and escrow releases.',
    connectedModules: ['os-pay', 'marketplace'],
  },
  supabase: {
    description: 'Authentication, user management, real-time database. Foundation for all user roles and JWT token management.',
    connectedModules: ['os-land', 'os-feas', 'os-dev', 'os-pm', 'os-pay', 'os-ops', 'marketplace'],
  },
  anthropic: {
    description: 'AI chat, document analysis, estimation, report generation. Powers all KeaBots across OS modules.',
    connectedModules: ['os-land', 'os-feas', 'os-dev', 'os-pm', 'os-pay', 'os-ops', 'marketplace'],
  },
  resend: {
    description: 'Transactional emails, notifications, investor communications. Triggered by OS PM milestones and OS Pay draw events.',
    connectedModules: ['os-pm', 'os-pay', 'marketplace'],
  },
  twilio: {
    description: 'SMS notifications and two-factor authentication. Used for milestone approvals and inspection scheduling alerts.',
    connectedModules: ['os-pm', 'os-pay'],
  },
  ghl: {
    description: 'Contact sync, opportunity management, appointment scheduling. Syncs with Marketplace leads and OS PM milestones.',
    connectedModules: ['marketplace', 'os-pm'],
  },
  redis: {
    description: 'Session caching, BullMQ job queue, real-time pub/sub. Backbone for all module event processing.',
    connectedModules: ['os-land', 'os-feas', 'os-dev', 'os-pm', 'os-pay', 'os-ops', 'marketplace'],
  },
}

const MODULE_NAMES: Record<string, string> = {
  'os-land':    'OS Land',
  'os-feas':    'OS Feasibility',
  'os-dev':     'OS Development',
  'os-pm':      'OS Project Mgmt',
  'os-pay':     'OS Payments',
  'os-ops':     'OS Operations',
  'marketplace': 'Marketplace',
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface PingResult {
  name: string
  key: string
  category: string
  status: string
  latencyMs: number
}

interface IntegrationsData {
  live: boolean
  intake: { total: number; today: number; paid: number }
  externalServices: PingResult[]
  generatedAt: string
}

// ─────────────────────────────────────────────────────────────────────────────

function latencyLabel(ms: number): string {
  if (ms === 0) return '—'
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: typeof CheckCircle }> = {
  operational: { label: 'Operational', color: '#38A169',              bg: 'rgba(56, 161, 105, 0.1)',  icon: CheckCircle },
  degraded:    { label: 'Degraded',    color: '#E8793A',              bg: 'rgba(232, 121, 58, 0.1)', icon: AlertTriangle },
  warning:     { label: 'Warning',     color: '#E8793A',              bg: 'rgba(232, 121, 58, 0.1)', icon: AlertTriangle },
  unknown:     { label: 'Unknown',     color: 'rgba(255,255,255,0.3)', bg: 'rgba(255,255,255,0.05)',  icon: XCircle },
  down:        { label: 'Down',        color: '#E53E3E',              bg: 'rgba(229, 62, 62, 0.1)',  icon: XCircle },
}

// ─────────────────────────────────────────────────────────────────────────────

export default function IntegrationsPage() {
  const [data, setData]           = useState<IntegrationsData | null>(null)
  const [loading, setLoading]     = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true)
    try {
      const res = await fetch('/api/command-center/integrations', { cache: 'no-store' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setData(await res.json())
    } catch {
      // keep existing data
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    load()
    const interval = setInterval(() => load(), 60_000)
    return () => clearInterval(interval)
  }, [load])

  const externalServices = data?.externalServices ?? []
  const intake           = data?.intake ?? { total: 0, today: 0, paid: 0 }

  const externalOperational = externalServices.filter(s => s.status === 'operational').length
  const totalServices       = OS_MODULE_INTEGRATIONS.length + externalServices.length
  const totalOperational    = OS_MODULE_INTEGRATIONS.length + externalOperational // modules are always operational

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Integrations</h1>
          <p className="mt-1 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
            {loading
              ? '○ Pinging services…'
              : `${totalOperational}/${totalServices} operational · ${OS_MODULE_INTEGRATIONS.length} OS modules + ${externalServices.length} external · ${intake.total} total intakes · ${intake.today} today`}
          </p>
        </div>
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium"
          style={{ backgroundColor: '#2A3D5F', color: 'rgba(255,255,255,0.7)' }}
        >
          <RefreshCw className={`h-4 w-4 ${(loading || refreshing) ? 'animate-spin' : ''}`} />
          {refreshing ? 'Checking…' : 'Check All'}
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4" style={{ color: '#2ABFBF' }} />
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Pinging integrations…</p>
          </div>
        </div>
      )}

      {!loading && (
        <>
          {/* ── OS Module Integration Points ── */}
          <div className="mb-6">
            <h2 className="font-display mb-3 text-lg font-semibold text-white">
              OS Modules ({OS_MODULE_INTEGRATIONS.length})
            </h2>
            <div className="space-y-3">
              {OS_MODULE_INTEGRATIONS.map((mod) => {
                const config = statusConfig['operational']
                const StatusIcon = config.icon
                return (
                  <div key={mod.id} className="rounded-xl border p-5"
                    style={{ borderColor: '#2A3D5F', backgroundColor: '#1A2B4A' }}>
                    <div className="mb-3 flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="rounded-lg p-2.5" style={{ backgroundColor: config.bg }}>
                          <Box className="h-5 w-5" style={{ color: config.color }} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-white">{mod.name}</h3>
                            <span className="rounded px-2 py-0.5 text-xs"
                              style={{ backgroundColor: 'rgba(42, 191, 191, 0.1)', color: '#2ABFBF' }}>
                              {mod.key}
                            </span>
                            <span className="rounded px-2 py-0.5 text-xs"
                              style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}>
                              {mod.category}
                            </span>
                          </div>
                          <p className="mt-0.5 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                            {mod.description}
                          </p>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {mod.defaultPhases.map((phase) => (
                              <span key={phase} className="rounded px-1.5 py-0.5 text-xs"
                                style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)' }}>
                                {phase}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <span className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
                        style={{ backgroundColor: config.bg, color: config.color }}>
                        <StatusIcon className="h-3.5 w-3.5" />
                        {config.label}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      <div className="rounded-lg p-2.5" style={{ backgroundColor: 'rgba(15, 26, 46, 0.5)' }}>
                        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Total Intakes</p>
                        <p className="text-sm font-semibold text-white">{intake.total}</p>
                      </div>
                      <div className="rounded-lg p-2.5" style={{ backgroundColor: 'rgba(15, 26, 46, 0.5)' }}>
                        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Today</p>
                        <p className="text-sm font-semibold text-white">{intake.today}</p>
                      </div>
                      <div className="rounded-lg p-2.5" style={{ backgroundColor: 'rgba(15, 26, 46, 0.5)' }}>
                        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Paid Concepts</p>
                        <p className="text-sm font-semibold text-white">{intake.paid}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── External Service Integrations ── */}
          <div>
            <h2 className="font-display mb-3 text-lg font-semibold text-white">
              External Services ({externalServices.length})
            </h2>
            {externalServices.length === 0 ? (
              <p className="text-xs py-4 text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>
                No ping data available.
              </p>
            ) : (
              <div className="space-y-3">
                {externalServices.map((svc) => {
                  const config     = statusConfig[svc.status] ?? statusConfig.unknown
                  const StatusIcon = config.icon
                  const meta       = EXTERNAL_SERVICE_META[svc.key] ?? {
                    description: '',
                    connectedModules: [],
                  }

                  return (
                    <div key={svc.key} className="rounded-xl border p-5"
                      style={{ borderColor: '#2A3D5F', backgroundColor: '#1A2B4A' }}>
                      <div className="mb-3 flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="rounded-lg p-2.5" style={{ backgroundColor: config.bg }}>
                            <Plug className="h-5 w-5" style={{ color: config.color }} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-white">{svc.name}</h3>
                              <span className="rounded px-2 py-0.5 text-xs"
                                style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}>
                                {svc.category}
                              </span>
                            </div>
                            {meta.description && (
                              <p className="mt-0.5 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                                {meta.description}
                              </p>
                            )}
                            {meta.connectedModules.length > 0 && (
                              <div className="mt-1 flex flex-wrap gap-1">
                                {meta.connectedModules.map((mod) => (
                                  <span key={mod} className="rounded px-1.5 py-0.5 text-xs"
                                    style={{ backgroundColor: 'rgba(42, 191, 191, 0.08)', color: 'rgba(42, 191, 191, 0.6)' }}>
                                    {MODULE_NAMES[mod] ?? mod}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <span className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
                          style={{ backgroundColor: config.bg, color: config.color }}>
                          <StatusIcon className="h-3.5 w-3.5" />
                          {config.label}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        <div className="rounded-lg p-2.5" style={{ backgroundColor: 'rgba(15, 26, 46, 0.5)' }}>
                          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Latency</p>
                          <p className="text-sm font-semibold text-white">{latencyLabel(svc.latencyMs)}</p>
                        </div>
                        <div className="rounded-lg p-2.5" style={{ backgroundColor: 'rgba(15, 26, 46, 0.5)' }}>
                          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Status</p>
                          <p className="text-sm font-semibold" style={{ color: config.color }}>{config.label}</p>
                        </div>
                        <div className="rounded-lg p-2.5" style={{ backgroundColor: 'rgba(15, 26, 46, 0.5)' }}>
                          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Last Checked</p>
                          <p className="text-sm font-semibold text-white">
                            {data?.generatedAt
                              ? new Date(data.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                              : '—'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
