'use client'

import { Plug, CheckCircle, AlertTriangle, XCircle, RefreshCw, ExternalLink, Clock, Activity, Box, Layers } from 'lucide-react'

// ── v20 Seed: 7 OS Modules as Internal Integration Points ──
const OS_MODULE_INTEGRATIONS = [
  {
    id: 'mod-1', name: 'OS Land', key: 'os-land', type: 'module' as const,
    category: 'Internal Module',
    description: 'Land acquisition and parcel analysis. Site search, zoning lookup, environmental screening, and comparable analysis.',
    defaultPhases: ['LAND'],
    status: 'operational',
    lastCheck: '10 seconds ago', latency: '12ms', uptime: '99.99%',
    metrics: { eventsToday: 8, activeProjects: 14, dataPoints: 2847 },
  },
  {
    id: 'mod-2', name: 'OS Feasibility', key: 'os-feas', type: 'module' as const,
    category: 'Internal Module',
    description: 'Feasibility study module. Financial pro-forma, construction cost estimation, market analysis, and go/no-go dashboard.',
    defaultPhases: ['FEASIBILITY'],
    status: 'operational',
    lastCheck: '8 seconds ago', latency: '15ms', uptime: '99.98%',
    metrics: { eventsToday: 12, activeProjects: 18, dataPoints: 4231 },
  },
  {
    id: 'mod-3', name: 'OS Development', key: 'os-dev', type: 'module' as const,
    category: 'Internal Module',
    description: 'Design and development module. Architect coordination, drawing management, AI concept generation, and permit document preparation.',
    defaultPhases: ['DESIGN', 'PERMITS'],
    status: 'operational',
    lastCheck: '5 seconds ago', latency: '18ms', uptime: '99.97%',
    metrics: { eventsToday: 34, activeProjects: 26, dataPoints: 8912 },
  },
  {
    id: 'mod-4', name: 'OS Project Management', key: 'os-pm', type: 'module' as const,
    category: 'Internal Module',
    description: 'Core project management. Scheduling, milestone tracking, daily logs, RFIs, submittals, change orders, inspections, and closeout.',
    defaultPhases: ['PRECONSTRUCTION', 'CONSTRUCTION', 'INSPECTIONS', 'CLOSEOUT'],
    status: 'operational',
    lastCheck: '2 seconds ago', latency: '8ms', uptime: '99.99%',
    metrics: { eventsToday: 187, activeProjects: 42, dataPoints: 34521 },
  },
  {
    id: 'mod-5', name: 'OS Payments', key: 'os-pay', type: 'module' as const,
    category: 'Internal Module',
    description: 'Financial and payments module. Escrow management, milestone payments, draw requests, retainage, lien waivers, and budget tracking.',
    defaultPhases: ['PAYMENTS', 'CLOSEOUT'],
    status: 'operational',
    lastCheck: '3 seconds ago', latency: '10ms', uptime: '99.99%',
    metrics: { eventsToday: 24, activeProjects: 38, dataPoints: 12453 },
  },
  {
    id: 'mod-6', name: 'OS Operations', key: 'os-ops', type: 'module' as const,
    category: 'Internal Module',
    description: 'Post-construction operations module. Warranty tracking, maintenance scheduling, facility management, and service requests.',
    defaultPhases: ['OPERATIONS'],
    status: 'warning',
    lastCheck: '15 seconds ago', latency: '45ms', uptime: '99.82%',
    metrics: { eventsToday: 6, activeProjects: 12, dataPoints: 1834 },
  },
  {
    id: 'mod-7', name: 'Marketplace', key: 'marketplace', type: 'module' as const,
    category: 'Internal Module',
    description: 'Contractor marketplace module. Bidding, contractor matching, lead distribution, ratings, and portfolio management.',
    defaultPhases: ['IDEA', 'PRECONSTRUCTION'],
    status: 'operational',
    lastCheck: '6 seconds ago', latency: '14ms', uptime: '99.96%',
    metrics: { eventsToday: 45, activeProjects: 34, dataPoints: 6789 },
  },
]

// ── External Service Integrations ──────────────────────────
const EXTERNAL_INTEGRATIONS = [
  {
    id: 'ext-1', name: 'Stripe', key: 'stripe', type: 'external' as const,
    category: 'Payments',
    description: 'Payment processing, subscriptions, checkout sessions. Connected to OS Payments for milestone draws and escrow releases.',
    connectedModules: ['os-pay', 'marketplace'],
    status: 'operational',
    lastCheck: '30 seconds ago', latency: '45ms', uptime: '99.99%',
    metrics: { webhooksToday: 23, failedWebhooks: 0, syncedRecords: 1247 },
  },
  {
    id: 'ext-2', name: 'GoHighLevel', key: 'ghl', type: 'external' as const,
    category: 'CRM',
    description: 'Contact sync, opportunity management, appointment scheduling. Syncs with Marketplace leads and OS PM milestones.',
    connectedModules: ['marketplace', 'os-pm'],
    status: 'degraded',
    lastCheck: '1 minute ago', latency: '1.2s', uptime: '97.5%',
    metrics: { webhooksToday: 156, failedWebhooks: 8, syncedRecords: 4521 },
  },
  {
    id: 'ext-3', name: 'Supabase', key: 'supabase', type: 'external' as const,
    category: 'Auth & Database',
    description: 'Authentication, user management, real-time database. Foundation for all 7 roles and JWT token management.',
    connectedModules: ['os-land', 'os-feas', 'os-dev', 'os-pm', 'os-pay', 'os-ops', 'marketplace'],
    status: 'operational',
    lastCheck: '15 seconds ago', latency: '23ms', uptime: '99.95%',
    metrics: { webhooksToday: 0, failedWebhooks: 0, syncedRecords: 294 },
  },
  {
    id: 'ext-4', name: 'Anthropic (Claude)', key: 'anthropic', type: 'external' as const,
    category: 'AI',
    description: 'AI chat, document analysis, estimation, report generation. Powers all 13 KeaBots across all OS modules.',
    connectedModules: ['os-land', 'os-feas', 'os-dev', 'os-pm', 'os-pay', 'os-ops', 'marketplace'],
    status: 'operational',
    lastCheck: '2 minutes ago', latency: '890ms', uptime: '99.8%',
    metrics: { webhooksToday: 0, failedWebhooks: 0, syncedRecords: 0 },
  },
  {
    id: 'ext-5', name: 'Resend', key: 'resend', type: 'external' as const,
    category: 'Email',
    description: 'Transactional emails, notifications, investor communications. Triggered by OS PM milestones and OS Pay draw events.',
    connectedModules: ['os-pm', 'os-pay', 'marketplace'],
    status: 'operational',
    lastCheck: '45 seconds ago', latency: '120ms', uptime: '99.9%',
    metrics: { webhooksToday: 47, failedWebhooks: 1, syncedRecords: 3421 },
  },
  {
    id: 'ext-6', name: 'Twilio', key: 'twilio', type: 'external' as const,
    category: 'SMS',
    description: 'SMS notifications and two-factor authentication. Used for milestone approvals and inspection scheduling alerts.',
    connectedModules: ['os-pm', 'os-pay'],
    status: 'operational',
    lastCheck: '1 minute ago', latency: '200ms', uptime: '99.7%',
    metrics: { webhooksToday: 12, failedWebhooks: 0, syncedRecords: 892 },
  },
  {
    id: 'ext-7', name: 'Redis', key: 'redis', type: 'external' as const,
    category: 'Cache & Queue',
    description: 'Session caching, BullMQ job queue, real-time pub/sub. Backbone for all module event processing.',
    connectedModules: ['os-land', 'os-feas', 'os-dev', 'os-pm', 'os-pay', 'os-ops', 'marketplace'],
    status: 'operational',
    lastCheck: '1 second ago', latency: '2ms', uptime: '99.99%',
    metrics: { webhooksToday: 0, failedWebhooks: 0, syncedRecords: 0 },
  },
]

// Module display names
const MODULE_NAMES: Record<string, string> = {
  'os-land': 'OS Land',
  'os-feas': 'OS Feasibility',
  'os-dev': 'OS Development',
  'os-pm': 'OS Project Mgmt',
  'os-pay': 'OS Payments',
  'os-ops': 'OS Operations',
  'marketplace': 'Marketplace',
}

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: typeof CheckCircle }> = {
  operational: { label: 'Operational', color: '#38A169', bg: 'rgba(56, 161, 105, 0.1)', icon: CheckCircle },
  degraded: { label: 'Degraded', color: '#E8793A', bg: 'rgba(232, 121, 58, 0.1)', icon: AlertTriangle },
  warning: { label: 'Warning', color: '#E8793A', bg: 'rgba(232, 121, 58, 0.1)', icon: AlertTriangle },
  disconnected: { label: 'Disconnected', color: 'rgba(255,255,255,0.3)', bg: 'rgba(255,255,255,0.05)', icon: XCircle },
  down: { label: 'Down', color: '#E53E3E', bg: 'rgba(229, 62, 62, 0.1)', icon: XCircle },
}

export default function IntegrationsPage() {
  const moduleOperational = OS_MODULE_INTEGRATIONS.filter(i => i.status === 'operational').length
  const externalOperational = EXTERNAL_INTEGRATIONS.filter(i => i.status === 'operational').length
  const totalIntegrations = OS_MODULE_INTEGRATIONS.length + EXTERNAL_INTEGRATIONS.length
  const totalOperational = moduleOperational + externalOperational
  const totalEventsToday = OS_MODULE_INTEGRATIONS.reduce((s, m) => s + m.metrics.eventsToday, 0) + EXTERNAL_INTEGRATIONS.reduce((s, m) => s + m.metrics.webhooksToday, 0)

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Integrations</h1>
          <p className="mt-1 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
            {totalOperational}/{totalIntegrations} operational | {OS_MODULE_INTEGRATIONS.length} OS modules + {EXTERNAL_INTEGRATIONS.length} external services | {totalEventsToday} events today
          </p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium" style={{ backgroundColor: '#2A3D5F', color: 'rgba(255,255,255,0.7)' }}>
          <RefreshCw className="h-4 w-4" />
          Check All
        </button>
      </div>

      {/* ── OS Module Integration Points ── */}
      <div className="mb-6">
        <h2 className="font-display mb-3 text-lg font-semibold text-white">OS Modules ({OS_MODULE_INTEGRATIONS.length})</h2>
        <div className="space-y-3">
          {OS_MODULE_INTEGRATIONS.map((mod) => {
            const config = statusConfig[mod.status]
            const StatusIcon = config.icon
            return (
              <div key={mod.id} className="rounded-xl border p-5" style={{ borderColor: '#2A3D5F', backgroundColor: '#1A2B4A' }}>
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="rounded-lg p-2.5" style={{ backgroundColor: config.bg }}>
                      <Box className="h-5 w-5" style={{ color: config.color }} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-white">{mod.name}</h3>
                        <span className="rounded px-2 py-0.5 text-xs" style={{ backgroundColor: 'rgba(42, 191, 191, 0.1)', color: '#2ABFBF' }}>{mod.key}</span>
                        <span className="rounded px-2 py-0.5 text-xs" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}>{mod.category}</span>
                      </div>
                      <p className="mt-0.5 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{mod.description}</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {mod.defaultPhases.map((phase) => (
                          <span key={phase} className="rounded px-1.5 py-0.5 text-xs" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)' }}>
                            {phase}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <span className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium" style={{ backgroundColor: config.bg, color: config.color }}>
                    <StatusIcon className="h-3.5 w-3.5" />
                    {config.label}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                  <div className="rounded-lg p-2.5" style={{ backgroundColor: 'rgba(15, 26, 46, 0.5)' }}>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Latency</p>
                    <p className="text-sm font-semibold text-white">{mod.latency}</p>
                  </div>
                  <div className="rounded-lg p-2.5" style={{ backgroundColor: 'rgba(15, 26, 46, 0.5)' }}>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Uptime</p>
                    <p className="text-sm font-semibold text-white">{mod.uptime}</p>
                  </div>
                  <div className="rounded-lg p-2.5" style={{ backgroundColor: 'rgba(15, 26, 46, 0.5)' }}>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Events Today</p>
                    <p className="text-sm font-semibold text-white">{mod.metrics.eventsToday}</p>
                  </div>
                  <div className="rounded-lg p-2.5" style={{ backgroundColor: 'rgba(15, 26, 46, 0.5)' }}>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Active Projects</p>
                    <p className="text-sm font-semibold text-white">{mod.metrics.activeProjects}</p>
                  </div>
                  <div className="rounded-lg p-2.5" style={{ backgroundColor: 'rgba(15, 26, 46, 0.5)' }}>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Data Points</p>
                    <p className="text-sm font-semibold text-white">{mod.metrics.dataPoints.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── External Service Integrations ── */}
      <div>
        <h2 className="font-display mb-3 text-lg font-semibold text-white">External Services ({EXTERNAL_INTEGRATIONS.length})</h2>
        <div className="space-y-3">
          {EXTERNAL_INTEGRATIONS.map((integration) => {
            const config = statusConfig[integration.status]
            const StatusIcon = config.icon
            return (
              <div key={integration.id} className="rounded-xl border p-5" style={{ borderColor: '#2A3D5F', backgroundColor: '#1A2B4A' }}>
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="rounded-lg p-2.5" style={{ backgroundColor: config.bg }}>
                      <Plug className="h-5 w-5" style={{ color: config.color }} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-white">{integration.name}</h3>
                        <span className="rounded px-2 py-0.5 text-xs" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}>{integration.category}</span>
                      </div>
                      <p className="mt-0.5 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{integration.description}</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {integration.connectedModules.map((mod) => (
                          <span key={mod} className="rounded px-1.5 py-0.5 text-xs" style={{ backgroundColor: 'rgba(42, 191, 191, 0.08)', color: 'rgba(42, 191, 191, 0.6)' }}>
                            {MODULE_NAMES[mod]}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <span className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium" style={{ backgroundColor: config.bg, color: config.color }}>
                    <StatusIcon className="h-3.5 w-3.5" />
                    {config.label}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                  <div className="rounded-lg p-2.5" style={{ backgroundColor: 'rgba(15, 26, 46, 0.5)' }}>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Latency</p>
                    <p className="text-sm font-semibold text-white">{integration.latency}</p>
                  </div>
                  <div className="rounded-lg p-2.5" style={{ backgroundColor: 'rgba(15, 26, 46, 0.5)' }}>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Uptime</p>
                    <p className="text-sm font-semibold text-white">{integration.uptime}</p>
                  </div>
                  <div className="rounded-lg p-2.5" style={{ backgroundColor: 'rgba(15, 26, 46, 0.5)' }}>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Events Today</p>
                    <p className="text-sm font-semibold text-white">{integration.metrics.webhooksToday}</p>
                  </div>
                  <div className="rounded-lg p-2.5" style={{ backgroundColor: 'rgba(15, 26, 46, 0.5)' }}>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Failed</p>
                    <p className="text-sm font-semibold" style={{ color: integration.metrics.failedWebhooks > 0 ? '#E8793A' : '#38A169' }}>{integration.metrics.failedWebhooks}</p>
                  </div>
                  <div className="rounded-lg p-2.5" style={{ backgroundColor: 'rgba(15, 26, 46, 0.5)' }}>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Synced Records</p>
                    <p className="text-sm font-semibold text-white">{integration.metrics.syncedRecords.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
