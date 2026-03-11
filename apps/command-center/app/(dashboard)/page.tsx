'use client'

import { Boxes, Activity, AlertTriangle, Users, Bot, Plug, TrendingUp, CheckCircle, Layers, Cpu, Box, Shield } from 'lucide-react'

// ── v20 Seed: 7 Roles ──────────────────────────────────────
const V20_ROLES = [
  { key: 'homeowner', name: 'Homeowner', userCount: 142 },
  { key: 'contractor', name: 'Contractor', userCount: 87 },
  { key: 'developer', name: 'Developer', userCount: 24 },
  { key: 'architect', name: 'Architect', userCount: 18 },
  { key: 'engineer', name: 'Engineer', userCount: 12 },
  { key: 'kealee_pm', name: 'Kealee PM', userCount: 8 },
  { key: 'admin', name: 'Administrator', userCount: 3 },
]

// ── v20 Seed: 12 Lifecycle Phases ──────────────────────────
const LIFECYCLE_PHASES = [
  { key: 'IDEA', name: 'Idea', order: 1, projectCount: 8 },
  { key: 'LAND', name: 'Land', order: 2, projectCount: 5 },
  { key: 'FEASIBILITY', name: 'Feasibility', order: 3, projectCount: 6 },
  { key: 'DESIGN', name: 'Design', order: 4, projectCount: 7 },
  { key: 'PERMITS', name: 'Permits', order: 5, projectCount: 4 },
  { key: 'PRECONSTRUCTION', name: 'Pre-Con', order: 6, projectCount: 3 },
  { key: 'CONSTRUCTION', name: 'Construction', order: 7, projectCount: 12 },
  { key: 'INSPECTIONS', name: 'Inspections', order: 8, projectCount: 2 },
  { key: 'PAYMENTS', name: 'Payments', order: 9, projectCount: 0 },
  { key: 'CLOSEOUT', name: 'Closeout', order: 10, projectCount: 3 },
  { key: 'OPERATIONS', name: 'Operations', order: 11, projectCount: 4 },
  { key: 'ARCHIVE', name: 'Archive', order: 12, projectCount: 14 },
]

// ── v20 Seed: Twin Tiers ───────────────────────────────────
const TWIN_TIERS = [
  { tier: 'L1', label: 'Light', kpiCount: 3, projectCount: 18, avgHealth: 92 },
  { tier: 'L2', label: 'Standard', kpiCount: 6, projectCount: 24, avgHealth: 87 },
  { tier: 'L3', label: 'Premium', kpiCount: 10, projectCount: 12, avgHealth: 84 },
]

// ── v20 Seed: 7 OS Modules ─────────────────────────────────
const OS_MODULES = [
  { key: 'os-land', name: 'OS Land', description: 'Land acquisition and parcel analysis', activeProjects: 14, eventsToday: 8, status: 'healthy' },
  { key: 'os-feas', name: 'OS Feasibility', description: 'Financial pro-forma and market analysis', activeProjects: 18, eventsToday: 12, status: 'healthy' },
  { key: 'os-dev', name: 'OS Development', description: 'Design coordination and permit docs', activeProjects: 26, eventsToday: 34, status: 'healthy' },
  { key: 'os-pm', name: 'OS Project Management', description: 'Scheduling, milestones, RFIs, change orders', activeProjects: 42, eventsToday: 187, status: 'healthy' },
  { key: 'os-pay', name: 'OS Payments', description: 'Escrow, milestone payments, draw requests', activeProjects: 38, eventsToday: 24, status: 'healthy' },
  { key: 'os-ops', name: 'OS Operations', description: 'Warranty, maintenance, facility mgmt', activeProjects: 12, eventsToday: 6, status: 'warning' },
  { key: 'marketplace', name: 'Marketplace', description: 'Bidding, contractor matching, lead distribution', activeProjects: 34, eventsToday: 45, status: 'healthy' },
]

const STATS = [
  { label: 'Active Projects', value: '68', change: '+5 this week', icon: Boxes, color: '#2ABFBF', bg: 'rgba(42, 191, 191, 0.1)' },
  { label: 'Digital Twins', value: '54', change: '79% coverage', icon: Activity, color: '#38A169', bg: 'rgba(56, 161, 105, 0.1)' },
  { label: 'Active Alerts', value: '12', change: '3 critical', icon: AlertTriangle, color: '#E8793A', bg: 'rgba(232, 121, 58, 0.1)' },
  { label: 'Active Users', value: '294', change: `${V20_ROLES.length} roles`, icon: Users, color: '#A78BFA', bg: 'rgba(167, 139, 250, 0.1)' },
]

const RECENT_EVENTS = [
  { time: '1 min ago', message: 'OS PM: Milestone "Framing Complete" approved for Riverside Multifamily (L3 Twin)', type: 'success', module: 'os-pm' },
  { time: '3 min ago', message: 'OS Pay: Draw #7 funded - $6.3M for Riverside Multifamily MEP Rough-In', type: 'success', module: 'os-pay' },
  { time: '7 min ago', message: 'OS Dev: 14 new drawings uploaded for Oak Hill Mixed-Use design review', type: 'info', module: 'os-dev' },
  { time: '12 min ago', message: 'Marketplace: Bid received from Summit GC - East Austin Townhomes ($7.2M)', type: 'info', module: 'marketplace' },
  { time: '18 min ago', message: 'OS Feas: Feasibility scenario "Value-Add" completed for Congress Ave Retail', type: 'info', module: 'os-feas' },
  { time: '25 min ago', message: 'OS Ops: Warranty claim escalated - Slaughter Lane Office HVAC (critical)', type: 'error', module: 'os-ops' },
  { time: '32 min ago', message: 'OS Land: Zoning verification complete for Domain Heights Tower (MU-2)', type: 'success', module: 'os-land' },
  { time: '45 min ago', message: 'OS PM: RFI #42 response overdue - Westlake Custom Home (L2 Twin warning)', type: 'error', module: 'os-pm' },
  { time: '1 hour ago', message: 'KeaBot: Lead captured - Jennifer A. - Kitchen Remodel Quote (score: 82)', type: 'info', module: 'marketplace' },
  { time: '1.5 hours ago', message: 'Stripe webhook: checkout.session.completed - new homeowner signup', type: 'success', module: 'os-pay' },
]

const INTEGRATION_STATUS = [
  { name: 'Stripe', status: 'operational', latency: '45ms' },
  { name: 'GoHighLevel', status: 'degraded', latency: '1.2s' },
  { name: 'Supabase', status: 'operational', latency: '23ms' },
  { name: 'Redis', status: 'operational', latency: '2ms' },
  { name: 'Anthropic AI', status: 'operational', latency: '890ms' },
  { name: 'Resend', status: 'operational', latency: '120ms' },
  { name: 'Twilio', status: 'operational', latency: '200ms' },
]

export default function CommandCenterOverview() {
  const totalUsers = V20_ROLES.reduce((s, r) => s + r.userCount, 0)
  const totalModuleEvents = OS_MODULES.reduce((s, m) => s + m.eventsToday, 0)

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-white">Command Center</h1>
        <p className="mt-1 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
          Real-time platform operations | {V20_ROLES.length} roles | {LIFECYCLE_PHASES.length} lifecycle phases | {OS_MODULES.length} OS modules
        </p>
      </div>

      {/* Top Stats */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {STATS.map((stat) => (
          <div key={stat.label} className="rounded-xl border p-5" style={{ borderColor: '#2A3D5F', backgroundColor: '#1A2B4A' }}>
            <div className="flex items-center gap-3">
              <div className="rounded-lg p-2.5" style={{ backgroundColor: stat.bg }}>
                <stat.icon className="h-5 w-5" style={{ color: stat.color }} />
              </div>
              <div>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{stat.label}</p>
                <p className="text-xl font-bold text-white">{stat.value}</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{stat.change}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Lifecycle Phase Distribution */}
      <div className="mb-6 rounded-xl border p-5" style={{ borderColor: '#2A3D5F', backgroundColor: '#1A2B4A' }}>
        <h2 className="font-display mb-3 text-sm font-semibold text-white">Lifecycle Phase Distribution ({LIFECYCLE_PHASES.length} Phases)</h2>
        <div className="flex h-8 w-full overflow-hidden rounded-lg">
          {LIFECYCLE_PHASES.filter(p => p.projectCount > 0).map((phase, i) => {
            const totalProjects = LIFECYCLE_PHASES.reduce((s, p) => s + p.projectCount, 0)
            const width = (phase.projectCount / totalProjects) * 100
            const colors = ['#6366F1', '#818CF8', '#3B82F6', '#06B6D4', '#F59E0B', '#FB923C', '#2ABFBF', '#38A169', '#84CC16', '#D69E2E', '#A78BFA', '#94A3B8']
            return (
              <div key={phase.key} className="flex items-center justify-center text-xs font-bold text-white" style={{ width: `${width}%`, backgroundColor: colors[i % colors.length], minWidth: '22px' }} title={`${phase.name}: ${phase.projectCount}`}>
                {phase.projectCount}
              </div>
            )
          })}
        </div>
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
          {LIFECYCLE_PHASES.filter(p => p.projectCount > 0).map((phase, i) => {
            const colors = ['#6366F1', '#818CF8', '#3B82F6', '#06B6D4', '#F59E0B', '#FB923C', '#2ABFBF', '#38A169', '#84CC16', '#D69E2E', '#A78BFA', '#94A3B8']
            return (
              <span key={phase.key} className="flex items-center gap-1 text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: colors[i % colors.length] }} />
                {phase.name} ({phase.projectCount})
              </span>
            )
          })}
        </div>
      </div>

      {/* Twin Health + Role Distribution Row */}
      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        {/* Twin Tier Overview */}
        <div className="rounded-xl border p-5" style={{ borderColor: '#2A3D5F', backgroundColor: '#1A2B4A' }}>
          <h2 className="font-display mb-3 text-sm font-semibold text-white">Twin Health Overview (3 Tiers)</h2>
          <div className="grid grid-cols-3 gap-3">
            {TWIN_TIERS.map((t) => {
              const color = t.tier === 'L1' ? '#94A3B8' : t.tier === 'L2' ? '#3B82F6' : '#8B5CF6'
              return (
                <div key={t.tier} className="rounded-lg p-3 text-center" style={{ backgroundColor: 'rgba(15, 26, 46, 0.5)' }}>
                  <Cpu className="mx-auto h-5 w-5" style={{ color }} />
                  <p className="mt-1 text-lg font-bold text-white">{t.projectCount}</p>
                  <p className="text-xs font-semibold" style={{ color }}>{t.tier} - {t.label}</p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{t.kpiCount} KPIs | {t.avgHealth}% avg</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Role Distribution */}
        <div className="rounded-xl border p-5" style={{ borderColor: '#2A3D5F', backgroundColor: '#1A2B4A' }}>
          <h2 className="font-display mb-3 text-sm font-semibold text-white">User Distribution ({V20_ROLES.length} Roles) - {totalUsers} total</h2>
          <div className="space-y-2">
            {V20_ROLES.map((role) => {
              const pct = (role.userCount / totalUsers) * 100
              return (
                <div key={role.key} className="flex items-center gap-3">
                  <span className="w-24 shrink-0 text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{role.name}</span>
                  <div className="flex-1 h-3 overflow-hidden rounded-full" style={{ backgroundColor: 'rgba(15, 26, 46, 0.5)' }}>
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: '#2ABFBF' }} />
                  </div>
                  <span className="w-10 shrink-0 text-right text-xs font-bold text-white">{role.userCount}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Module Activation Stats */}
      <div className="mb-6 rounded-xl border p-5" style={{ borderColor: '#2A3D5F', backgroundColor: '#1A2B4A' }}>
        <h2 className="font-display mb-3 text-sm font-semibold text-white">OS Module Status ({OS_MODULES.length} Modules) - {totalModuleEvents} events today</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {OS_MODULES.map((mod) => (
            <div key={mod.key} className="rounded-lg p-3 text-center" style={{ backgroundColor: 'rgba(15, 26, 46, 0.5)' }}>
              <Box className="mx-auto h-5 w-5" style={{ color: mod.status === 'healthy' ? '#38A169' : '#E8793A' }} />
              <p className="mt-1 text-sm font-bold text-white">{mod.activeProjects}</p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{mod.name}</p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{mod.eventsToday} events</p>
              <span className="mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium" style={{
                backgroundColor: mod.status === 'healthy' ? 'rgba(56, 161, 105, 0.15)' : 'rgba(232, 121, 58, 0.15)',
                color: mod.status === 'healthy' ? '#38A169' : '#E8793A'
              }}>{mod.status}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Event Feed */}
        <div className="rounded-xl border p-6" style={{ borderColor: '#2A3D5F', backgroundColor: '#1A2B4A' }}>
          <h2 className="font-display mb-4 text-lg font-semibold text-white">Live Event Feed</h2>
          <div className="space-y-3">
            {RECENT_EVENTS.map((event, i) => (
              <div key={i} className="flex items-start gap-3 rounded-lg p-3" style={{ backgroundColor: 'rgba(15, 26, 46, 0.5)' }}>
                <div className="mt-0.5 h-2 w-2 flex-shrink-0 rounded-full" style={{
                  backgroundColor: event.type === 'success' ? '#38A169' : event.type === 'error' ? '#E53E3E' : '#2ABFBF'
                }} />
                <div className="flex-1">
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>{event.message}</p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{event.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Integration Status */}
        <div className="rounded-xl border p-6" style={{ borderColor: '#2A3D5F', backgroundColor: '#1A2B4A' }}>
          <h2 className="font-display mb-4 text-lg font-semibold text-white">Integration Health</h2>
          <div className="space-y-3">
            {INTEGRATION_STATUS.map((int) => (
              <div key={int.name} className="flex items-center justify-between rounded-lg p-3" style={{ backgroundColor: 'rgba(15, 26, 46, 0.5)' }}>
                <div className="flex items-center gap-3">
                  <Plug className="h-4 w-4" style={{ color: 'rgba(255,255,255,0.4)' }} />
                  <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.8)' }}>{int.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{int.latency}</span>
                  <span className="flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium" style={{
                    backgroundColor: int.status === 'operational' ? 'rgba(56, 161, 105, 0.15)' : 'rgba(232, 121, 58, 0.15)',
                    color: int.status === 'operational' ? '#38A169' : '#E8793A'
                  }}>
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: int.status === 'operational' ? '#38A169' : '#E8793A' }} />
                    {int.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
