'use client'

import { useState, useEffect } from 'react'
import { MapPin, Calendar, DollarSign, Users, Cpu, CheckCircle, Clock, Layers, Wrench, ChevronDown, ChevronUp, Loader2, AlertCircle, FolderOpen } from 'lucide-react'
import { getContractorProjects, type ContractorProject } from '@/lib/api/contractor'

// ── v20 Seed: Lifecycle Phases ─────────────────────────────────────
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

// ── v20 Seed: Payment Milestones ───────────────────────────────────
const PAYMENT_MILESTONES = [
  { key: 'DEPOSIT', name: 'Deposit / Mobilization', percentage: 10, order: 1 },
  { key: 'FOUNDATION', name: 'Foundation Complete', percentage: 15, order: 2 },
  { key: 'FRAMING', name: 'Framing Complete', percentage: 20, order: 3 },
  { key: 'MEP_ROUGH', name: 'MEP Rough-In Complete', percentage: 15, order: 4 },
  { key: 'DRYWALL_INTERIOR', name: 'Drywall & Interior', percentage: 15, order: 5 },
  { key: 'FINISH', name: 'Finish Work', percentage: 15, order: 6 },
  { key: 'COMPLETION', name: 'Substantial Completion', percentage: 10, order: 7 },
] as const

// ── v20 Seed: CSI Divisions ────────────────────────────────────────
const CSI_DIVISIONS: Record<string, string> = {
  '03': 'Concrete',
  '04': 'Masonry',
  '05': 'Metals',
  '06': 'Wood, Plastics & Composites',
  '07': 'Thermal & Moisture Protection',
  '08': 'Doors & Windows',
  '09': 'Finishes',
  '22': 'Plumbing',
  '23': 'HVAC',
  '26': 'Electrical',
}

// ── v20 Seed: OS Modules ───────────────────────────────────────────
const OS_MODULES: Record<string, string> = {
  'os-land': 'OS Land',
  'os-feas': 'OS Feasibility',
  'os-dev': 'OS Development',
  'os-pm': 'OS Project Management',
  'os-pay': 'OS Payments',
  'os-ops': 'OS Operations',
  'marketplace': 'Marketplace',
}

const twinTierLabels: Record<string, { label: string; color: string; bgColor: string; description: string }> = {
  L1: { label: 'L1 Light', color: '#2ABFBF', bgColor: 'rgba(42,191,191,0.1)', description: 'Basic tracking with budget, schedule, and completion metrics' },
  L2: { label: 'L2 Standard', color: '#E8793A', bgColor: 'rgba(232,121,58,0.1)', description: 'Full scheduling, cost tracking, document management, and risk monitoring' },
  L3: { label: 'L3 Premium', color: '#7C3AED', bgColor: 'rgba(124,58,237,0.1)', description: 'AI-powered predictions, real-time IoT, advanced analytics' },
}

interface ScheduleItem {
  csiDivision: string
  task: string
  status: 'complete' | 'in_progress' | 'upcoming'
  dates: string
}

interface ProjectMilestone {
  key: string
  status: 'paid' | 'pending' | 'upcoming'
  amount: number
  paidDate?: string
}

interface ActiveProject {
  id: string
  name: string
  projectType: string
  client: string
  clientRole: string
  address: string
  twinTier: string
  lifecyclePhase: string
  progress: number
  contractAmount: number
  startDate: string
  crew: number
  activeModules: string[]
  twinHealth: { budgetVariance: number; spi: number; qualityScore: number; openIssues: number; riskScore?: number }
  milestones: ProjectMilestone[]
  schedule: ScheduleItem[]
}

const ACTIVE_PROJECTS: ActiveProject[] = [
  {
    id: '1',
    name: 'Kitchen & Bath Remodel - Cedar Park',
    projectType: 'Renovation / Remodel',
    client: 'Sarah Kim',
    clientRole: 'Homeowner',
    address: '1847 Cypress Canyon Trl, Cedar Park TX 78613',
    twinTier: 'L1',
    lifecyclePhase: 'CONSTRUCTION',
    progress: 45,
    contractAmount: 78500,
    startDate: '2026-02-10',
    crew: 4,
    activeModules: ['os-pm', 'os-pay', 'marketplace'],
    twinHealth: { budgetVariance: 2.1, spi: 0.96, qualityScore: 88, openIssues: 3 },
    milestones: [
      { key: 'DEPOSIT', status: 'paid', amount: 7850, paidDate: '2026-02-10' },
      { key: 'FOUNDATION', status: 'paid', amount: 11775, paidDate: '2026-02-24' },
      { key: 'FRAMING', status: 'paid', amount: 15700, paidDate: '2026-03-05' },
      { key: 'MEP_ROUGH', status: 'pending', amount: 11775 },
      { key: 'DRYWALL_INTERIOR', status: 'upcoming', amount: 11775 },
      { key: 'FINISH', status: 'upcoming', amount: 11775 },
      { key: 'COMPLETION', status: 'upcoming', amount: 7850 },
    ],
    schedule: [
      { csiDivision: '06', task: 'Cabinet rough framing', status: 'complete', dates: 'Feb 17 - Feb 21' },
      { csiDivision: '22', task: 'Plumbing rough-in (kitchen & bath)', status: 'complete', dates: 'Feb 24 - Mar 3' },
      { csiDivision: '26', task: 'Electrical rough-in & panel upgrade', status: 'in_progress', dates: 'Mar 4 - Mar 12' },
      { csiDivision: '09', task: 'Drywall hang & finish', status: 'upcoming', dates: 'Mar 13 - Mar 21' },
      { csiDivision: '09', task: 'Tile setting (backsplash & bath)', status: 'upcoming', dates: 'Mar 22 - Mar 28' },
      { csiDivision: '06', task: 'Custom cabinet installation', status: 'upcoming', dates: 'Mar 29 - Apr 4' },
    ],
  },
  {
    id: '2',
    name: 'Second-Story Addition - Mueller',
    projectType: 'Home Addition',
    client: 'Robert & Amy Chen',
    clientRole: 'Homeowner',
    address: '603 Philomena Dr, Austin TX 78723',
    twinTier: 'L2',
    lifecyclePhase: 'CONSTRUCTION',
    progress: 28,
    contractAmount: 312000,
    startDate: '2026-02-03',
    crew: 8,
    activeModules: ['os-dev', 'os-pm', 'os-pay', 'marketplace'],
    twinHealth: { budgetVariance: 3.8, spi: 0.91, qualityScore: 82, openIssues: 7, riskScore: 42 },
    milestones: [
      { key: 'DEPOSIT', status: 'paid', amount: 31200, paidDate: '2026-02-03' },
      { key: 'FOUNDATION', status: 'paid', amount: 46800, paidDate: '2026-02-28' },
      { key: 'FRAMING', status: 'pending', amount: 62400 },
      { key: 'MEP_ROUGH', status: 'upcoming', amount: 46800 },
      { key: 'DRYWALL_INTERIOR', status: 'upcoming', amount: 46800 },
      { key: 'FINISH', status: 'upcoming', amount: 46800 },
      { key: 'COMPLETION', status: 'upcoming', amount: 31200 },
    ],
    schedule: [
      { csiDivision: '03', task: 'Foundation reinforcement & new footings', status: 'complete', dates: 'Feb 10 - Feb 21' },
      { csiDivision: '05', task: 'Steel beam installation (floor support)', status: 'complete', dates: 'Feb 24 - Mar 1' },
      { csiDivision: '06', task: 'Second-floor framing & roof structure', status: 'in_progress', dates: 'Mar 3 - Mar 21' },
      { csiDivision: '07', task: 'Roofing & exterior weather barrier', status: 'upcoming', dates: 'Mar 22 - Mar 30' },
      { csiDivision: '22', task: 'Plumbing rough-in (new bath & laundry)', status: 'upcoming', dates: 'Apr 1 - Apr 8' },
      { csiDivision: '23', task: 'HVAC ductwork & new zone split', status: 'upcoming', dates: 'Apr 1 - Apr 10' },
      { csiDivision: '26', task: 'Electrical rough-in (circuits & data)', status: 'upcoming', dates: 'Apr 7 - Apr 14' },
    ],
  },
  {
    id: '3',
    name: 'Custom New Home - Dripping Springs',
    projectType: 'New Home Construction',
    client: 'Mark & Laura Johnson',
    clientRole: 'Homeowner',
    address: 'Lot 14, Vista Ridge Estates, Dripping Springs TX 78620',
    twinTier: 'L2',
    lifecyclePhase: 'PRECONSTRUCTION',
    progress: 5,
    contractAmount: 724000,
    startDate: '2026-03-15',
    crew: 0,
    activeModules: ['os-land', 'os-feas', 'os-dev', 'os-pm', 'os-pay', 'os-ops', 'marketplace'],
    twinHealth: { budgetVariance: 0, spi: 1.0, qualityScore: 0, openIssues: 0, riskScore: 15 },
    milestones: [
      { key: 'DEPOSIT', status: 'pending', amount: 72400 },
      { key: 'FOUNDATION', status: 'upcoming', amount: 108600 },
      { key: 'FRAMING', status: 'upcoming', amount: 144800 },
      { key: 'MEP_ROUGH', status: 'upcoming', amount: 108600 },
      { key: 'DRYWALL_INTERIOR', status: 'upcoming', amount: 108600 },
      { key: 'FINISH', status: 'upcoming', amount: 108600 },
      { key: 'COMPLETION', status: 'upcoming', amount: 72400 },
    ],
    schedule: [
      { csiDivision: '03', task: 'Site clearing & foundation excavation', status: 'upcoming', dates: 'Mar 17 - Mar 28' },
      { csiDivision: '03', task: 'Foundation pour (slab-on-grade)', status: 'upcoming', dates: 'Apr 1 - Apr 10' },
      { csiDivision: '05', task: 'Structural steel & post-tension cables', status: 'upcoming', dates: 'Apr 14 - Apr 18' },
      { csiDivision: '06', task: 'Framing (walls, roof, sheathing)', status: 'upcoming', dates: 'Apr 21 - May 16' },
    ],
  },
]

const statusStyles: Record<string, { color: string; bgColor: string }> = {
  PRECONSTRUCTION: { color: '#2ABFBF', bgColor: 'rgba(42,191,191,0.1)' },
  CONSTRUCTION: { color: '#E8793A', bgColor: 'rgba(232,121,58,0.1)' },
  INSPECTIONS: { color: '#7C3AED', bgColor: 'rgba(124,58,237,0.1)' },
  CLOSEOUT: { color: '#38A169', bgColor: 'rgba(56,161,105,0.1)' },
}

function HealthBadge({ label, value, unit, warningThreshold, criticalThreshold, invertWarning = false }: {
  label: string; value: number; unit: string; warningThreshold: number; criticalThreshold: number; invertWarning?: boolean
}) {
  let color = '#38A169'
  if (invertWarning) {
    if (value < criticalThreshold) color = '#E53E3E'
    else if (value < warningThreshold) color = '#92400E'
  } else {
    if (value > criticalThreshold) color = '#E53E3E'
    else if (value > warningThreshold) color = '#92400E'
  }
  const display = unit === '%' ? `${value}%` : unit === 'x' ? value.toFixed(2) : `${value}`
  return (
    <div className="rounded-lg border border-gray-100 bg-white px-3 py-2 text-center">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-bold" style={{ color }}>{display}</p>
    </div>
  )
}

// ─── Map API project → ActiveProject shape ───────────────────────────────────

function apiToActiveProject(p: ContractorProject): ActiveProject {
  return {
    id:          p.assignmentId,
    name:        p.projectName,
    projectType: p.projectType ?? 'Construction',
    client:      'Project Owner',
    clientRole:  'Owner',
    address:     [p.address, p.city, p.state].filter(Boolean).join(', ') || 'Location TBD',
    twinTier:    'L1',
    lifecyclePhase: p.lifecyclePhase ?? 'CONSTRUCTION',
    progress:    p.contractStatus === 'ACTIVE' ? 30 : 5,
    contractAmount: p.contractAmount ?? 0,
    startDate:   p.startDate ? p.startDate.split('T')[0] : p.assignedAt.split('T')[0],
    crew:        0,
    activeModules: ['os-pm', 'os-pay', 'marketplace'],
    twinHealth:  { budgetVariance: 0, spi: 1.0, qualityScore: 0, openIssues: 0 },
    milestones:  PAYMENT_MILESTONES.map((m) => ({ key: m.key, status: 'upcoming' as const, amount: Math.round((p.contractAmount ?? 0) * m.percentage / 100) })),
    schedule:    [],
  }
}

export default function ProjectsPage() {
  const [expandedProject, setExpandedProject] = useState<string | null>(null)
  const [projects, setProjects] = useState<ActiveProject[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)

  useEffect(() => {
    getContractorProjects({ status: 'active' })
      .then(res => setProjects(res.projects.map(apiToActiveProject)))
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load projects.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-7 w-7 animate-spin" style={{ color: '#2ABFBF' }} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 flex gap-3 text-red-700">
        <AlertCircle className="h-5 w-5 flex-shrink-0" />
        <p className="text-sm">{error}</p>
      </div>
    )
  }

  const ACTIVE_PROJECTS = projects
  const totalRevenue = ACTIVE_PROJECTS.reduce((s, p) => s + p.contractAmount, 0)
  const totalPaid = ACTIVE_PROJECTS.reduce((s, p) => s + p.milestones.filter(m => m.status === 'paid').reduce((ms, m) => ms + m.amount, 0), 0)

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold" style={{ color: '#1A2B4A' }}>Active Projects</h1>
        <p className="mt-1 text-sm text-gray-600">
          {ACTIVE_PROJECTS.length} projects
          {totalRevenue > 0 ? ` | $${totalRevenue.toLocaleString()} total contract value` : ''}
          {totalPaid > 0 ? ` | $${totalPaid.toLocaleString()} received` : ''}
        </p>
      </div>

      {ACTIVE_PROJECTS.length === 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
          <FolderOpen className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <p className="font-semibold text-gray-600">No active projects yet</p>
          <p className="text-sm text-gray-400 mt-1">Your accepted project assignments will appear here.</p>
        </div>
      )}

      <div className="space-y-5">
        {ACTIVE_PROJECTS.map((project) => {
          const phaseMeta = LIFECYCLE_PHASES.find(p => p.key === project.lifecyclePhase)
          const phaseStyle = statusStyles[project.lifecyclePhase] || { color: '#4B5563', bgColor: '#F3F4F6' }
          const twinMeta = twinTierLabels[project.twinTier]
          const isExpanded = expandedProject === project.id
          const paidCount = project.milestones.filter(m => m.status === 'paid').length
          const pendingCount = project.milestones.filter(m => m.status === 'pending').length

          return (
            <div key={project.id} className="rounded-xl border border-gray-200 bg-white shadow-sm">
              {/* Main Content */}
              <div className="p-6">
                {/* Header */}
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-lg font-semibold" style={{ color: '#1A2B4A' }}>{project.name}</h3>
                      <span className="rounded px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: 'rgba(232,121,58,0.1)', color: '#E8793A' }}>{project.projectType}</span>
                    </div>
                    <p className="text-sm text-gray-600">Client: {project.client} ({project.clientRole})</p>
                    <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                      <MapPin className="h-3 w-3" />{project.address}
                    </div>
                  </div>
                  <div className="ml-3 flex flex-col items-end gap-2">
                    <span className="rounded-full px-3 py-1 text-xs font-medium" style={{ backgroundColor: phaseStyle.bgColor, color: phaseStyle.color }}>
                      {phaseMeta?.name || project.lifecyclePhase}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ backgroundColor: twinMeta.bgColor, color: twinMeta.color }}>
                      <Cpu className="h-3 w-3" />{twinMeta.label}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-gray-600">Overall Progress</span>
                    <span className="font-medium" style={{ color: '#1A2B4A' }}>{project.progress}%</span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full" style={{ backgroundColor: 'rgba(42,191,191,0.15)' }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${project.progress}%`, backgroundColor: '#2ABFBF' }} />
                  </div>
                </div>

                {/* Twin Health KPIs */}
                {project.progress > 0 && (
                  <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-5">
                    <HealthBadge label="Budget Variance" value={project.twinHealth.budgetVariance} unit="%" warningThreshold={5} criticalThreshold={10} />
                    <HealthBadge label="Schedule (SPI)" value={project.twinHealth.spi} unit="x" warningThreshold={0.9} criticalThreshold={0.8} invertWarning />
                    <HealthBadge label="Quality Score" value={project.twinHealth.qualityScore} unit="" warningThreshold={70} criticalThreshold={50} invertWarning />
                    <HealthBadge label="Open Issues" value={project.twinHealth.openIssues} unit="" warningThreshold={10} criticalThreshold={25} />
                    {project.twinHealth.riskScore !== undefined && (
                      <HealthBadge label="Risk Score" value={project.twinHealth.riskScore} unit="" warningThreshold={60} criticalThreshold={80} />
                    )}
                  </div>
                )}

                {/* Payment Milestone Progress */}
                <div className="mb-4">
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold" style={{ color: '#1A2B4A' }}>
                    <Layers className="h-3.5 w-3.5" />
                    Payment Milestones ({paidCount} paid, {pendingCount} pending, {7 - paidCount - pendingCount} upcoming)
                  </p>
                  <div className="flex gap-1">
                    {project.milestones.map((ms) => {
                      const template = PAYMENT_MILESTONES.find(t => t.key === ms.key)
                      const bg = ms.status === 'paid' ? '#38A169' : ms.status === 'pending' ? '#E8793A' : '#E5E7EB'
                      return (
                        <div key={ms.key} className="group/ms relative flex-1" title={`${template?.name}: $${ms.amount.toLocaleString()} (${template?.percentage}%) - ${ms.status}`}>
                          <div className="h-3 rounded-sm" style={{ backgroundColor: bg }} />
                          <p className="mt-0.5 truncate text-center text-[9px] text-gray-400">{template?.percentage}%</p>
                        </div>
                      )
                    })}
                  </div>
                  <div className="mt-1 flex justify-between text-[10px] text-gray-400">
                    <span>Deposit</span>
                    <span>Completion</span>
                  </div>
                </div>

                {/* Active Modules */}
                <div className="mb-4">
                  <p className="mb-1.5 text-xs font-medium text-gray-500">Active Modules</p>
                  <div className="flex flex-wrap gap-1.5">
                    {project.activeModules.map((mod) => (
                      <span key={mod} className="rounded border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs text-gray-600">
                        {OS_MODULES[mod] || mod}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Info Row */}
                <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><DollarSign className="h-3.5 w-3.5" />${project.contractAmount.toLocaleString()}</span>
                  <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{project.startDate === '2026-03-15' ? 'Starts Mar 15' : `Started ${new Date(project.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}</span>
                  <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{project.crew > 0 ? `${project.crew} crew members` : 'Crew TBD'}</span>
                </div>

                {/* Expand Toggle */}
                <button
                  onClick={() => setExpandedProject(isExpanded ? null : project.id)}
                  className="mt-3 flex items-center gap-1 text-xs font-medium"
                  style={{ color: '#2ABFBF' }}
                >
                  {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  {isExpanded ? 'Hide' : 'Show'} Schedule & Milestone Details
                </button>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="border-t border-gray-100">
                  {/* Schedule by CSI Trade */}
                  <div className="bg-gray-50 px-6 py-4">
                    <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold" style={{ color: '#1A2B4A' }}>
                      <Wrench className="h-3.5 w-3.5" />
                      Schedule Items by CSI Trade
                    </p>
                    <div className="space-y-2">
                      {project.schedule.map((item, idx) => {
                        const statusIcon = item.status === 'complete' ? <CheckCircle className="h-3.5 w-3.5" style={{ color: '#38A169' }} />
                          : item.status === 'in_progress' ? <Clock className="h-3.5 w-3.5" style={{ color: '#E8793A' }} />
                          : <Clock className="h-3.5 w-3.5 text-gray-300" />
                        const textColor = item.status === 'complete' ? '#38A169' : item.status === 'in_progress' ? '#E8793A' : '#9CA3AF'
                        return (
                          <div key={idx} className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-xs">
                            <div className="flex items-center gap-2">
                              {statusIcon}
                              <span className="rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">
                                Div {item.csiDivision}
                              </span>
                              <span className="font-medium" style={{ color: item.status === 'upcoming' ? '#9CA3AF' : '#374151' }}>
                                {item.task}
                              </span>
                            </div>
                            <span className="text-gray-400">{item.dates}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Milestone Payment Details */}
                  <div className="px-6 py-4">
                    <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold" style={{ color: '#1A2B4A' }}>
                      <DollarSign className="h-3.5 w-3.5" />
                      Payment Milestone Detail
                    </p>
                    <div className="space-y-2">
                      {project.milestones.map((ms) => {
                        const template = PAYMENT_MILESTONES.find(t => t.key === ms.key)
                        const statusColor = ms.status === 'paid' ? '#38A169' : ms.status === 'pending' ? '#E8793A' : '#9CA3AF'
                        const statusLabel = ms.status === 'paid' ? 'Paid' : ms.status === 'pending' ? 'Pending Approval' : 'Upcoming'
                        return (
                          <div key={ms.key} className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-xs">
                            <div className="flex items-center gap-2">
                              <span className="flex h-5 w-5 items-center justify-center rounded-full text-white" style={{ backgroundColor: statusColor, fontSize: '9px' }}>
                                {template?.order}
                              </span>
                              <span className="font-medium text-gray-700">{template?.name}</span>
                              <span className="text-gray-400">({template?.percentage}%)</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-semibold" style={{ color: '#1A2B4A' }}>${ms.amount.toLocaleString()}</span>
                              <span className="rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ color: statusColor, backgroundColor: `${statusColor}15` }}>
                                {statusLabel}
                              </span>
                              {ms.paidDate && <span className="text-gray-400">{new Date(ms.paidDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
