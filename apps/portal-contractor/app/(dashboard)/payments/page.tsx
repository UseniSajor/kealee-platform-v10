'use client'

import { useState, useEffect, useCallback } from 'react'
import { DollarSign, Clock, CheckCircle, FileText, Download, Shield, AlertTriangle, Banknote, RefreshCw, Send } from 'lucide-react'
import { getContractorProjects } from '@/lib/api/contractor'
import { getProjectMilestones, submitDrawRequest, type ApiMilestone } from '@/lib/api/payments'

// ── Seed data ────────────────────────────────────────────────────────────────
const SEED_MILESTONES = [
  { key: 'DEPOSIT', name: 'Deposit / Mobilization', percentage: 10, order: 1 },
  { key: 'FOUNDATION', name: 'Foundation Complete', percentage: 15, order: 2 },
  { key: 'FRAMING', name: 'Framing Complete', percentage: 20, order: 3 },
  { key: 'MEP_ROUGH', name: 'MEP Rough-In Complete', percentage: 15, order: 4 },
  { key: 'DRYWALL_INTERIOR', name: 'Drywall & Interior', percentage: 15, order: 5 },
  { key: 'FINISH', name: 'Finish Work', percentage: 15, order: 6 },
  { key: 'COMPLETION', name: 'Substantial Completion', percentage: 10, order: 7 },
] as const

interface ProjectPayment {
  id: string
  project: string
  projectType: string
  contractAmount: number
  retainageRate: number
  escrowBalance: number
  milestones: {
    id?: string
    key: string
    amount: number
    retainage: number
    status: 'paid' | 'approved' | 'pending' | 'submitted' | 'upcoming'
    canSubmit?: boolean
    paidDate?: string
    submittedDate?: string
    drawRequestId?: string
  }[]
}

const SEED_PROJECT_PAYMENTS: ProjectPayment[] = [
  {
    id: '1', project: 'Kitchen & Bath Remodel - Cedar Park', projectType: 'Renovation / Remodel',
    contractAmount: 78500, retainageRate: 5, escrowBalance: 43175,
    milestones: [
      { key: 'DEPOSIT',          amount: 7850,  retainage: 392.50, status: 'paid',      paidDate: '2026-02-10', drawRequestId: 'DR-1001' },
      { key: 'FOUNDATION',       amount: 11775, retainage: 588.75, status: 'paid',      paidDate: '2026-02-24', drawRequestId: 'DR-1002' },
      { key: 'FRAMING',          amount: 15700, retainage: 785.00, status: 'paid',      paidDate: '2026-03-05', drawRequestId: 'DR-1003' },
      { key: 'MEP_ROUGH',        amount: 11775, retainage: 588.75, status: 'submitted', submittedDate: '2026-03-09', drawRequestId: 'DR-1004' },
      { key: 'DRYWALL_INTERIOR', amount: 11775, retainage: 588.75, status: 'upcoming' },
      { key: 'FINISH',           amount: 11775, retainage: 588.75, status: 'upcoming' },
      { key: 'COMPLETION',       amount: 7850,  retainage: 392.50, status: 'upcoming' },
    ],
  },
  {
    id: '2', project: 'Second-Story Addition - Mueller', projectType: 'Home Addition',
    contractAmount: 312000, retainageRate: 10, escrowBalance: 234000,
    milestones: [
      { key: 'DEPOSIT',          amount: 31200,  retainage: 3120.00, status: 'paid',    paidDate: '2026-02-03', drawRequestId: 'DR-2001' },
      { key: 'FOUNDATION',       amount: 46800,  retainage: 4680.00, status: 'paid',    paidDate: '2026-02-28', drawRequestId: 'DR-2002' },
      { key: 'FRAMING',          amount: 62400,  retainage: 6240.00, status: 'pending', submittedDate: '2026-03-08', drawRequestId: 'DR-2003' },
      { key: 'MEP_ROUGH',        amount: 46800,  retainage: 4680.00, status: 'upcoming', canSubmit: true },
      { key: 'DRYWALL_INTERIOR', amount: 46800,  retainage: 4680.00, status: 'upcoming' },
      { key: 'FINISH',           amount: 46800,  retainage: 4680.00, status: 'upcoming' },
      { key: 'COMPLETION',       amount: 31200,  retainage: 3120.00, status: 'upcoming' },
    ],
  },
  {
    id: '3', project: 'Custom New Home - Dripping Springs', projectType: 'New Home Construction',
    contractAmount: 724000, retainageRate: 10, escrowBalance: 724000,
    milestones: [
      { key: 'DEPOSIT',          amount: 72400,  retainage: 7240.00, status: 'approved', canSubmit: false, drawRequestId: 'DR-3001' },
      { key: 'FOUNDATION',       amount: 108600, retainage: 10860.00, status: 'upcoming', canSubmit: true },
      { key: 'FRAMING',          amount: 144800, retainage: 14480.00, status: 'upcoming' },
      { key: 'MEP_ROUGH',        amount: 108600, retainage: 10860.00, status: 'upcoming' },
      { key: 'DRYWALL_INTERIOR', amount: 108600, retainage: 10860.00, status: 'upcoming' },
      { key: 'FINISH',           amount: 108600, retainage: 10860.00, status: 'upcoming' },
      { key: 'COMPLETION',       amount: 72400,  retainage: 7240.00, status: 'upcoming' },
    ],
  },
]

const SEED_LIEN_WAIVERS = [
  { id: '1', project: 'Kitchen & Bath Remodel',  type: 'Conditional Progress',   milestoneKey: 'FRAMING',    period: 'Mar 2026', status: 'signed' as const },
  { id: '2', project: 'Kitchen & Bath Remodel',  type: 'Unconditional Progress', milestoneKey: 'FOUNDATION', period: 'Feb 2026', status: 'signed' as const },
  { id: '3', project: 'Second-Story Addition',    type: 'Conditional Progress',   milestoneKey: 'FRAMING',    period: 'Mar 2026', status: 'pending_signature' as const },
  { id: '4', project: 'Second-Story Addition',    type: 'Unconditional Progress', milestoneKey: 'FOUNDATION', period: 'Feb 2026', status: 'signed' as const },
  { id: '5', project: 'Custom New Home',          type: 'Conditional Progress',   milestoneKey: 'DEPOSIT',    period: 'Mar 2026', status: 'pending_signature' as const },
]

function mapApiToProjectPayment(
  projectId: string,
  projectName: string,
  projectType: string,
  contractAmount: number,
  milestones: ApiMilestone[],
): ProjectPayment {
  return {
    id: projectId,
    project: projectName,
    projectType: projectType || 'Construction',
    contractAmount,
    retainageRate: 10,
    escrowBalance: contractAmount - milestones.filter(m => m.status === 'PAID').reduce((s, m) => s + m.amount, 0),
    milestones: milestones.map((m, idx) => {
      const key = m.name.toUpperCase().replace(/[^A-Z]/g, '_').replace(/_+/g, '_')
      const statusMap: Record<string, ProjectPayment['milestones'][0]['status']> = {
        PAID: 'paid', APPROVED: 'approved', SUBMITTED: 'submitted', UNDER_REVIEW: 'pending', PENDING: 'upcoming',
      }
      return {
        id: m.id,
        key: SEED_MILESTONES[idx]?.key ?? key,
        amount: m.amount,
        retainage: Math.round(m.amount * 0.1),
        status: statusMap[m.status] ?? 'upcoming',
        canSubmit: m.canSubmit,
        drawRequestId: undefined,
      }
    }),
  }
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  paid:            { label: 'Paid',             color: '#38A169', bgColor: 'rgba(56,161,105,0.1)' },
  approved:        { label: 'Approved',          color: '#2ABFBF', bgColor: 'rgba(42,191,191,0.1)' },
  pending:         { label: 'Pending Approval',  color: '#92400E', bgColor: 'rgba(251,191,36,0.15)' },
  submitted:       { label: 'Submitted',         color: '#E8793A', bgColor: 'rgba(232,121,58,0.1)' },
  upcoming:        { label: 'Upcoming',          color: '#9CA3AF', bgColor: 'rgba(156,163,175,0.1)' },
  signed:          { label: 'Signed',            color: '#38A169', bgColor: 'rgba(56,161,105,0.1)' },
  pending_signature: { label: 'Needs Signature', color: '#92400E', bgColor: 'rgba(251,191,36,0.15)' },
}

export default function PaymentsPage() {
  const [projectPayments, setProjectPayments] = useState<ProjectPayment[]>(SEED_PROJECT_PAYMENTS)
  const [lienWaivers] = useState(SEED_LIEN_WAIVERS)
  const [isLive, setIsLive]     = useState(false)
  const [loading, setLoading]   = useState(true)
  const [activeTab, setActiveTab] = useState<'draws' | 'milestones' | 'waivers'>('draws')
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({})
  const [submitted, setSubmitted]   = useState<Record<string, boolean>>({})

  const load = useCallback(async () => {
    try {
      const { projects } = await getContractorProjects()
      if (!projects.length) { setLoading(false); return }

      const results: ProjectPayment[] = []
      for (const proj of projects.slice(0, 3)) {
        if (!proj.projectId) continue
        try {
          const data = await getProjectMilestones(proj.projectId)
          if (data.milestones?.length) {
            results.push(mapApiToProjectPayment(
              proj.projectId,
              proj.projectName,
              proj.projectType ?? '',
              proj.contractAmount ?? 0,
              data.milestones,
            ))
          }
        } catch { /* skip this project */ }
      }

      if (results.length > 0) {
        setProjectPayments(results)
        setIsLive(true)
      }
    } catch {
      // keep seed
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleSubmitDraw(projectId: string, milestoneId: string, key: string) {
    const stateKey = `${projectId}-${key}`
    setSubmitting(s => ({ ...s, [stateKey]: true }))
    try {
      await submitDrawRequest(milestoneId, { notes: 'Draw request submitted from portal' })
      setSubmitted(s => ({ ...s, [stateKey]: true }))
      setProjectPayments(prev => prev.map(pp => {
        if (pp.id !== projectId) return pp
        return {
          ...pp,
          milestones: pp.milestones.map(ms =>
            ms.key === key ? { ...ms, status: 'submitted' as const, canSubmit: false, submittedDate: new Date().toISOString().split('T')[0] } : ms
          ),
        }
      }))
    } catch {
      // silently fail — could add toast here
    } finally {
      setSubmitting(s => ({ ...s, [stateKey]: false }))
    }
  }

  const totalContractValue  = projectPayments.reduce((s, p) => s + p.contractAmount, 0)
  const totalPaidOut        = projectPayments.reduce((s, p) => s + p.milestones.filter(m => m.status === 'paid').reduce((ms, m) => ms + m.amount, 0), 0)
  const totalRetainageHeld  = projectPayments.reduce((s, p) => s + p.milestones.filter(m => m.status === 'paid').reduce((ms, m) => ms + m.retainage, 0), 0)
  const totalEscrowBalance  = projectPayments.reduce((s, p) => s + p.escrowBalance, 0)
  const totalPendingDraws   = projectPayments.reduce((s, p) => s + p.milestones.filter(m => ['submitted', 'pending', 'approved'].includes(m.status)).reduce((ms, m) => ms + m.amount, 0), 0)
  const pendingWaivers      = lienWaivers.filter(w => w.status === 'pending_signature').length

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold" style={{ color: '#1A2B4A' }}>Payments</h1>
          <p className="mt-1 text-sm text-gray-600">
            {loading ? 'Loading…' : `Milestone draw requests, escrow balances, and lien waivers across ${projectPayments.length} active projects`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isLive && (
            <span className="flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />Live
            </span>
          )}
          <button onClick={load} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: 'Contract Value',   value: `$${(totalContractValue / 1000).toFixed(0)}k`,      color: '#1A2B4A', Icon: DollarSign,  bg: 'rgba(26,43,74,0.08)' },
          { label: 'Received',         value: `$${(totalPaidOut / 1000).toFixed(1)}k`,            color: '#38A169', Icon: CheckCircle, bg: 'rgba(56,161,105,0.1)' },
          { label: 'Pending Draws',    value: `$${(totalPendingDraws / 1000).toFixed(1)}k`,       color: '#E8793A', Icon: Clock,       bg: 'rgba(232,121,58,0.1)' },
          { label: 'Escrow Balance',   value: `$${(totalEscrowBalance / 1000).toFixed(0)}k`,      color: '#2ABFBF', Icon: Shield,      bg: 'rgba(42,191,191,0.1)' },
          { label: 'Retainage Held',   value: `$${totalRetainageHeld.toLocaleString()}`,           color: '#7C3AED', Icon: Banknote,    bg: 'rgba(124,58,237,0.1)' },
          { label: 'Pending Waivers',  value: String(pendingWaivers),                              color: '#92400E', Icon: FileText,    bg: 'rgba(251,191,36,0.15)' },
        ].map(({ label, value, color, Icon, bg }) => (
          <div key={label} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="rounded-lg p-2" style={{ backgroundColor: bg }}><Icon className="h-4 w-4" style={{ color }} /></div>
              <div><p className="text-[10px] text-gray-500">{label}</p><p className="text-lg font-bold" style={{ color }}>{value}</p></div>
            </div>
          </div>
        ))}
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex gap-6">
          {[
            { key: 'draws' as const, label: 'Draw Requests' },
            { key: 'milestones' as const, label: 'Milestone Schedule' },
            { key: 'waivers' as const, label: 'Lien Waivers' },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className="border-b-2 pb-3 text-sm font-medium"
              style={{ borderColor: activeTab === tab.key ? '#E8793A' : 'transparent', color: activeTab === tab.key ? '#E8793A' : '#6B7280' }}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Draw Requests Tab */}
      {activeTab === 'draws' && (
        <div className="space-y-4">
          {projectPayments.map((pp) => {
            const activeDraws = pp.milestones.filter(m => m.status !== 'upcoming' || m.canSubmit)
            if (activeDraws.length === 0) return null
            return (
              <div key={pp.id} className="rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-100 px-5 py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-display text-sm font-semibold" style={{ color: '#1A2B4A' }}>{pp.project}</h3>
                      <p className="text-xs text-gray-500">{pp.projectType} | Contract: ${pp.contractAmount.toLocaleString()} | Retainage: {pp.retainageRate}%</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Escrow Balance</p>
                      <p className="text-sm font-bold" style={{ color: '#2ABFBF' }}>${pp.escrowBalance.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
                <div className="divide-y divide-gray-50">
                  {activeDraws.map((ms) => {
                    const template = SEED_MILESTONES.find(t => t.key === ms.key)
                    const config   = STATUS_CONFIG[ms.status]
                    const stateKey = `${pp.id}-${ms.key}`
                    const isSubmitting = submitting[stateKey]
                    const wasSubmitted = submitted[stateKey]
                    return (
                      <div key={ms.key} className="flex items-center justify-between px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white"
                            style={{ backgroundColor: ms.status === 'paid' ? '#38A169' : ms.status === 'upcoming' ? '#D1D5DB' : '#E8793A' }}>
                            {template?.order}
                          </div>
                          <div>
                            <p className="text-sm font-medium" style={{ color: '#1A2B4A' }}>{template?.name}</p>
                            <p className="text-xs text-gray-500">
                              {ms.drawRequestId && <span className="mr-2">{ms.drawRequestId}</span>}
                              {template?.percentage}% of contract
                              {ms.paidDate && <span className="ml-2">| Paid {new Date(ms.paidDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
                              {ms.submittedDate && ms.status !== 'paid' && <span className="ml-2">| Submitted {new Date(ms.submittedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span className="text-sm font-semibold" style={{ color: '#1A2B4A' }}>${ms.amount.toLocaleString()}</span>
                            <p className="text-[10px] text-gray-400">Retainage: ${ms.retainage.toLocaleString()}</p>
                          </div>
                          {ms.canSubmit && ms.id && !wasSubmitted ? (
                            <button
                              onClick={() => handleSubmitDraw(pp.id, ms.id!, ms.key)}
                              disabled={isSubmitting}
                              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
                              style={{ backgroundColor: '#E8793A' }}
                            >
                              <Send className="h-3 w-3" />
                              {isSubmitting ? 'Submitting…' : 'Submit Draw'}
                            </button>
                          ) : (
                            <span className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                              style={{ backgroundColor: config.bgColor, color: config.color }}>
                              {wasSubmitted ? 'Submitted' : config.label}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Milestone Schedule Tab */}
      {activeTab === 'milestones' && (
        <div className="space-y-6">
          {projectPayments.map((pp) => {
            const paidAmount = pp.milestones.filter(m => m.status === 'paid').reduce((s, m) => s + m.amount, 0)
            const paidPct    = Math.round((paidAmount / pp.contractAmount) * 100)
            return (
              <div key={pp.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-display text-sm font-semibold" style={{ color: '#1A2B4A' }}>{pp.project}</h3>
                    <p className="text-xs text-gray-500">${pp.contractAmount.toLocaleString()} contract | {paidPct}% disbursed</p>
                  </div>
                  <span className="text-sm font-bold" style={{ color: '#38A169' }}>${paidAmount.toLocaleString()} received</span>
                </div>
                <div className="mb-3 flex gap-0.5">
                  {pp.milestones.map((ms) => {
                    const template = SEED_MILESTONES.find(t => t.key === ms.key)
                    const bg = ms.status === 'paid' ? '#38A169' : ms.status === 'approved' ? '#2ABFBF' : ['pending', 'submitted'].includes(ms.status) ? '#E8793A' : '#E5E7EB'
                    return (
                      <div key={ms.key} className="relative" style={{ flex: template?.percentage || 1 }}
                        title={`${template?.name} (${template?.percentage}%): $${ms.amount.toLocaleString()}`}>
                        <div className="h-6 rounded-sm" style={{ backgroundColor: bg }} />
                        <p className="mt-0.5 text-center text-[8px] text-gray-400">{template?.name?.split(' ')[0]}</p>
                      </div>
                    )
                  })}
                </div>
                <div className="flex justify-between text-[10px]">
                  <div className="flex items-center gap-3">
                    {[['#38A169', 'Paid'], ['#2ABFBF', 'Approved'], ['#E8793A', 'Pending/Submitted'], ['#E5E7EB', 'Upcoming']].map(([color, label]) => (
                      <span key={label} className="flex items-center gap-1">
                        <span className="inline-block h-2 w-2 rounded-sm" style={{ backgroundColor: color }} /> {label}
                      </span>
                    ))}
                  </div>
                  <span className="text-gray-400">
                    Retainage held: ${pp.milestones.filter(m => m.status === 'paid').reduce((s, m) => s + m.retainage, 0).toLocaleString()}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Lien Waivers Tab */}
      {activeTab === 'waivers' && (
        <div className="space-y-3">
          {pendingWaivers > 0 && (
            <div className="mb-4 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-600" />
              <div>
                <p className="text-sm font-medium text-amber-800">{pendingWaivers} lien waiver{pendingWaivers > 1 ? 's' : ''} require your signature</p>
                <p className="text-xs text-amber-700">Lien waivers must be signed before milestone payments can be released</p>
              </div>
            </div>
          )}
          {lienWaivers.map((w) => {
            const config        = STATUS_CONFIG[w.status]
            const milestoneName = SEED_MILESTONES.find(m => m.key === w.milestoneKey)?.name || w.milestoneKey
            return (
              <div key={w.id} className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <div>
                  <p className="text-sm font-medium" style={{ color: '#1A2B4A' }}>{w.type}</p>
                  <p className="text-xs text-gray-500">{w.project} | Milestone: {milestoneName} | {w.period}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ backgroundColor: config.bgColor, color: config.color }}>{config.label}</span>
                  {w.status === 'pending_signature' ? (
                    <button className="rounded-lg px-3 py-1.5 text-xs font-medium text-white" style={{ backgroundColor: '#E8793A' }}>Sign Now</button>
                  ) : (
                    <button className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"><Download className="h-4 w-4" /></button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
