'use client'

import { useState } from 'react'
import { DollarSign, Clock, CheckCircle, FileText, Download, Shield, AlertTriangle, Banknote } from 'lucide-react'

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

// ── Project Payment Data ───────────────────────────────────────────
interface ProjectPayment {
  id: string
  project: string
  projectType: string
  contractAmount: number
  retainageRate: number
  escrowBalance: number
  milestones: {
    key: string
    amount: number
    retainage: number
    status: 'paid' | 'approved' | 'pending' | 'submitted' | 'upcoming'
    paidDate?: string
    submittedDate?: string
    drawRequestId?: string
  }[]
}

const PROJECT_PAYMENTS: ProjectPayment[] = [
  {
    id: '1',
    project: 'Kitchen & Bath Remodel - Cedar Park',
    projectType: 'Renovation / Remodel',
    contractAmount: 78500,
    retainageRate: 5,
    escrowBalance: 43175,
    milestones: [
      { key: 'DEPOSIT', amount: 7850, retainage: 392.50, status: 'paid', paidDate: '2026-02-10', drawRequestId: 'DR-1001' },
      { key: 'FOUNDATION', amount: 11775, retainage: 588.75, status: 'paid', paidDate: '2026-02-24', drawRequestId: 'DR-1002' },
      { key: 'FRAMING', amount: 15700, retainage: 785.00, status: 'paid', paidDate: '2026-03-05', drawRequestId: 'DR-1003' },
      { key: 'MEP_ROUGH', amount: 11775, retainage: 588.75, status: 'submitted', submittedDate: '2026-03-09', drawRequestId: 'DR-1004' },
      { key: 'DRYWALL_INTERIOR', amount: 11775, retainage: 588.75, status: 'upcoming' },
      { key: 'FINISH', amount: 11775, retainage: 588.75, status: 'upcoming' },
      { key: 'COMPLETION', amount: 7850, retainage: 392.50, status: 'upcoming' },
    ],
  },
  {
    id: '2',
    project: 'Second-Story Addition - Mueller',
    projectType: 'Home Addition',
    contractAmount: 312000,
    retainageRate: 10,
    escrowBalance: 234000,
    milestones: [
      { key: 'DEPOSIT', amount: 31200, retainage: 3120.00, status: 'paid', paidDate: '2026-02-03', drawRequestId: 'DR-2001' },
      { key: 'FOUNDATION', amount: 46800, retainage: 4680.00, status: 'paid', paidDate: '2026-02-28', drawRequestId: 'DR-2002' },
      { key: 'FRAMING', amount: 62400, retainage: 6240.00, status: 'pending', submittedDate: '2026-03-08', drawRequestId: 'DR-2003' },
      { key: 'MEP_ROUGH', amount: 46800, retainage: 4680.00, status: 'upcoming' },
      { key: 'DRYWALL_INTERIOR', amount: 46800, retainage: 4680.00, status: 'upcoming' },
      { key: 'FINISH', amount: 46800, retainage: 4680.00, status: 'upcoming' },
      { key: 'COMPLETION', amount: 31200, retainage: 3120.00, status: 'upcoming' },
    ],
  },
  {
    id: '3',
    project: 'Custom New Home - Dripping Springs',
    projectType: 'New Home Construction',
    contractAmount: 724000,
    retainageRate: 10,
    escrowBalance: 724000,
    milestones: [
      { key: 'DEPOSIT', amount: 72400, retainage: 7240.00, status: 'approved', drawRequestId: 'DR-3001' },
      { key: 'FOUNDATION', amount: 108600, retainage: 10860.00, status: 'upcoming' },
      { key: 'FRAMING', amount: 144800, retainage: 14480.00, status: 'upcoming' },
      { key: 'MEP_ROUGH', amount: 108600, retainage: 10860.00, status: 'upcoming' },
      { key: 'DRYWALL_INTERIOR', amount: 108600, retainage: 10860.00, status: 'upcoming' },
      { key: 'FINISH', amount: 108600, retainage: 10860.00, status: 'upcoming' },
      { key: 'COMPLETION', amount: 72400, retainage: 7240.00, status: 'upcoming' },
    ],
  },
]

const LIEN_WAIVERS = [
  { id: '1', project: 'Kitchen & Bath Remodel', type: 'Conditional Progress', milestoneKey: 'FRAMING', period: 'Mar 2026', status: 'signed' },
  { id: '2', project: 'Kitchen & Bath Remodel', type: 'Unconditional Progress', milestoneKey: 'FOUNDATION', period: 'Feb 2026', status: 'signed' },
  { id: '3', project: 'Second-Story Addition', type: 'Conditional Progress', milestoneKey: 'FRAMING', period: 'Mar 2026', status: 'pending_signature' },
  { id: '4', project: 'Second-Story Addition', type: 'Unconditional Progress', milestoneKey: 'FOUNDATION', period: 'Feb 2026', status: 'signed' },
  { id: '5', project: 'Custom New Home', type: 'Conditional Progress', milestoneKey: 'DEPOSIT', period: 'Mar 2026', status: 'pending_signature' },
]

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  paid: { label: 'Paid', color: '#38A169', bgColor: 'rgba(56,161,105,0.1)' },
  approved: { label: 'Approved', color: '#2ABFBF', bgColor: 'rgba(42,191,191,0.1)' },
  pending: { label: 'Pending Approval', color: '#92400E', bgColor: 'rgba(251,191,36,0.15)' },
  submitted: { label: 'Submitted', color: '#E8793A', bgColor: 'rgba(232,121,58,0.1)' },
  upcoming: { label: 'Upcoming', color: '#9CA3AF', bgColor: 'rgba(156,163,175,0.1)' },
  signed: { label: 'Signed', color: '#38A169', bgColor: 'rgba(56,161,105,0.1)' },
  pending_signature: { label: 'Needs Signature', color: '#92400E', bgColor: 'rgba(251,191,36,0.15)' },
}

export default function PaymentsPage() {
  const [activeTab, setActiveTab] = useState<'draws' | 'milestones' | 'waivers'>('draws')

  // Aggregate metrics
  const totalContractValue = PROJECT_PAYMENTS.reduce((s, p) => s + p.contractAmount, 0)
  const totalPaidOut = PROJECT_PAYMENTS.reduce((s, p) => s + p.milestones.filter(m => m.status === 'paid').reduce((ms, m) => ms + m.amount, 0), 0)
  const totalRetainageHeld = PROJECT_PAYMENTS.reduce((s, p) => s + p.milestones.filter(m => m.status === 'paid').reduce((ms, m) => ms + m.retainage, 0), 0)
  const totalEscrowBalance = PROJECT_PAYMENTS.reduce((s, p) => s + p.escrowBalance, 0)
  const totalPendingDraws = PROJECT_PAYMENTS.reduce((s, p) => s + p.milestones.filter(m => m.status === 'submitted' || m.status === 'pending' || m.status === 'approved').reduce((ms, m) => ms + m.amount, 0), 0)
  const pendingWaivers = LIEN_WAIVERS.filter(w => w.status === 'pending_signature').length

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold" style={{ color: '#1A2B4A' }}>Payments</h1>
        <p className="mt-1 text-sm text-gray-600">Milestone draw requests, escrow balances, and lien waivers across {PROJECT_PAYMENTS.length} active projects</p>
      </div>

      {/* Summary Cards */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="rounded-lg p-2" style={{ backgroundColor: 'rgba(26,43,74,0.08)' }}><DollarSign className="h-4 w-4" style={{ color: '#1A2B4A' }} /></div>
            <div><p className="text-[10px] text-gray-500">Contract Value</p><p className="text-lg font-bold" style={{ color: '#1A2B4A' }}>${(totalContractValue / 1000).toFixed(0)}k</p></div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="rounded-lg p-2" style={{ backgroundColor: 'rgba(56,161,105,0.1)' }}><CheckCircle className="h-4 w-4" style={{ color: '#38A169' }} /></div>
            <div><p className="text-[10px] text-gray-500">Received</p><p className="text-lg font-bold" style={{ color: '#38A169' }}>${(totalPaidOut / 1000).toFixed(1)}k</p></div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="rounded-lg p-2" style={{ backgroundColor: 'rgba(232,121,58,0.1)' }}><Clock className="h-4 w-4" style={{ color: '#E8793A' }} /></div>
            <div><p className="text-[10px] text-gray-500">Pending Draws</p><p className="text-lg font-bold" style={{ color: '#E8793A' }}>${(totalPendingDraws / 1000).toFixed(1)}k</p></div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="rounded-lg p-2" style={{ backgroundColor: 'rgba(42,191,191,0.1)' }}><Shield className="h-4 w-4" style={{ color: '#2ABFBF' }} /></div>
            <div><p className="text-[10px] text-gray-500">Escrow Balance</p><p className="text-lg font-bold" style={{ color: '#2ABFBF' }}>${(totalEscrowBalance / 1000).toFixed(0)}k</p></div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="rounded-lg p-2" style={{ backgroundColor: 'rgba(124,58,237,0.1)' }}><Banknote className="h-4 w-4" style={{ color: '#7C3AED' }} /></div>
            <div><p className="text-[10px] text-gray-500">Retainage Held</p><p className="text-lg font-bold" style={{ color: '#7C3AED' }}>${totalRetainageHeld.toLocaleString()}</p></div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="rounded-lg p-2" style={{ backgroundColor: 'rgba(251,191,36,0.15)' }}><FileText className="h-4 w-4" style={{ color: '#92400E' }} /></div>
            <div><p className="text-[10px] text-gray-500">Pending Waivers</p><p className="text-lg font-bold" style={{ color: '#92400E' }}>{pendingWaivers}</p></div>
          </div>
        </div>
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
              style={{
                borderColor: activeTab === tab.key ? '#E8793A' : 'transparent',
                color: activeTab === tab.key ? '#E8793A' : '#6B7280',
              }}>{tab.label}</button>
          ))}
        </div>
      </div>

      {/* Draw Requests Tab */}
      {activeTab === 'draws' && (
        <div className="space-y-4">
          {PROJECT_PAYMENTS.map((pp) => {
            const activeDraws = pp.milestones.filter(m => m.status !== 'upcoming')
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
                    const template = PAYMENT_MILESTONES.find(t => t.key === ms.key)
                    const config = statusConfig[ms.status]
                    return (
                      <div key={ms.key} className="flex items-center justify-between px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white" style={{ backgroundColor: ms.status === 'paid' ? '#38A169' : ms.status === 'upcoming' ? '#D1D5DB' : '#E8793A' }}>
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
                          <span className="rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ backgroundColor: config.bgColor, color: config.color }}>{config.label}</span>
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
          {PROJECT_PAYMENTS.map((pp) => {
            const paidAmount = pp.milestones.filter(m => m.status === 'paid').reduce((s, m) => s + m.amount, 0)
            const paidPct = Math.round((paidAmount / pp.contractAmount) * 100)
            return (
              <div key={pp.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-display text-sm font-semibold" style={{ color: '#1A2B4A' }}>{pp.project}</h3>
                    <p className="text-xs text-gray-500">${pp.contractAmount.toLocaleString()} contract | {paidPct}% disbursed</p>
                  </div>
                  <span className="text-sm font-bold" style={{ color: '#38A169' }}>${paidAmount.toLocaleString()} received</span>
                </div>
                {/* Visual milestone bar */}
                <div className="mb-3 flex gap-0.5">
                  {pp.milestones.map((ms) => {
                    const template = PAYMENT_MILESTONES.find(t => t.key === ms.key)
                    const bg = ms.status === 'paid' ? '#38A169' : ms.status === 'approved' ? '#2ABFBF' : ms.status === 'pending' || ms.status === 'submitted' ? '#E8793A' : '#E5E7EB'
                    return (
                      <div key={ms.key} className="relative" style={{ flex: template?.percentage || 1 }} title={`${template?.name} (${template?.percentage}%): $${ms.amount.toLocaleString()}`}>
                        <div className="h-6 rounded-sm" style={{ backgroundColor: bg }} />
                        <p className="mt-0.5 text-center text-[8px] text-gray-400">{template?.name?.split(' ')[0]}</p>
                      </div>
                    )
                  })}
                </div>
                <div className="flex justify-between text-[10px]">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm" style={{ backgroundColor: '#38A169' }} /> Paid</span>
                    <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm" style={{ backgroundColor: '#2ABFBF' }} /> Approved</span>
                    <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm" style={{ backgroundColor: '#E8793A' }} /> Pending/Submitted</span>
                    <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm" style={{ backgroundColor: '#E5E7EB' }} /> Upcoming</span>
                  </div>
                  <span className="text-gray-400">Retainage held: ${pp.milestones.filter(m => m.status === 'paid').reduce((s, m) => s + m.retainage, 0).toLocaleString()}</span>
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
          {LIEN_WAIVERS.map((w) => {
            const config = statusConfig[w.status]
            const milestoneName = PAYMENT_MILESTONES.find(m => m.key === w.milestoneKey)?.name || w.milestoneKey
            return (
              <div key={w.id} className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <div>
                  <p className="text-sm font-medium" style={{ color: '#1A2B4A' }}>{w.type}</p>
                  <p className="text-xs text-gray-500">{w.project} | Milestone: {milestoneName} | {w.period}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ backgroundColor: config.bgColor, color: config.color }}>{config.label}</span>
                  {w.status === 'pending_signature' ? (
                    <button
                      className="rounded-lg px-3 py-1.5 text-xs font-medium text-white"
                      style={{ backgroundColor: '#E8793A' }}
                      onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#C65A20')}
                      onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#E8793A')}
                    >Sign Now</button>
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
