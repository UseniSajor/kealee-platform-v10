'use client'

import { useState, useEffect } from 'react'
import { DollarSign, ArrowUpRight, CreditCard, Clock, CheckCircle, AlertCircle, TrendingUp, Shield, Loader2 } from 'lucide-react'
import { api } from '@/lib/api'

// ── 7 Payment Milestone Templates from seed-v20-core ──
// DEPOSIT (10%) → FOUNDATION (15%) → FRAMING (20%) → MEP_ROUGH (15%) → DRYWALL_INTERIOR (15%) → FINISH (15%) → COMPLETION (10%)

interface Milestone {
  key: string
  name: string
  percentage: number
  order: number
  description: string
  typicalInspection: string
  amount: number
  status: 'paid' | 'in_progress' | 'upcoming'
  paidDate?: string
  dueDate?: string
}

const CONTRACT_AMOUNT = 520000 // Modern Duplex total contract

const MILESTONES: Milestone[] = [
  {
    key: 'DEPOSIT',
    name: 'Deposit / Mobilization',
    percentage: 10,
    order: 1,
    description: 'Initial deposit upon contract execution. Covers mobilization, material procurement, and project setup costs.',
    typicalInspection: 'SITE',
    amount: 52000,
    status: 'paid',
    paidDate: '2025-11-01',
  },
  {
    key: 'FOUNDATION',
    name: 'Foundation Complete',
    percentage: 15,
    order: 2,
    description: 'Released upon completion and inspection of foundation work including footings, foundation walls, and waterproofing.',
    typicalInspection: 'FOUNDATION',
    amount: 78000,
    status: 'paid',
    paidDate: '2025-12-20',
  },
  {
    key: 'FRAMING',
    name: 'Framing Complete',
    percentage: 20,
    order: 3,
    description: 'Released upon completion and inspection of structural framing including roof structure, sheathing, and windows/doors set.',
    typicalInspection: 'ROUGH_FRAMING',
    amount: 104000,
    status: 'in_progress',
    dueDate: '2026-03-15',
  },
  {
    key: 'MEP_ROUGH',
    name: 'MEP Rough-In Complete',
    percentage: 15,
    order: 4,
    description: 'Released upon completion and inspection of rough electrical, plumbing, and HVAC installations before wall close-up.',
    typicalInspection: 'ROUGH_MECHANICAL',
    amount: 78000,
    status: 'upcoming',
    dueDate: '2026-04-15',
  },
  {
    key: 'DRYWALL_INTERIOR',
    name: 'Drywall & Interior',
    percentage: 15,
    order: 5,
    description: 'Released upon completion of insulation, drywall hanging and finishing, priming, and initial interior trim installation.',
    typicalInspection: 'INSULATION',
    amount: 78000,
    status: 'upcoming',
    dueDate: '2026-05-30',
  },
  {
    key: 'FINISH',
    name: 'Finish Work',
    percentage: 15,
    order: 6,
    description: 'Released upon completion of cabinets, countertops, flooring, painting, fixtures, appliances, and finish MEP trim.',
    typicalInspection: 'FINAL_BUILDING',
    amount: 78000,
    status: 'upcoming',
    dueDate: '2026-07-15',
  },
  {
    key: 'COMPLETION',
    name: 'Substantial Completion',
    percentage: 10,
    order: 7,
    description: 'Final payment upon certificate of occupancy, punch list completion, and closeout documentation delivery.',
    typicalInspection: 'CERTIFICATE_OF_OCCUPANCY',
    amount: 52000,
    status: 'upcoming',
    dueDate: '2026-08-01',
  },
]

const PAYMENT_HISTORY = [
  { id: '1', date: '2026-03-08', project: 'Modern Duplex - 5th Avenue', milestone: 'Framing Complete', description: 'Partial draw - 50% framing inspection passed', amount: 52000, status: 'completed' },
  { id: '2', date: '2025-12-20', project: 'Modern Duplex - 5th Avenue', milestone: 'Foundation Complete', description: 'Foundation milestone - footings & walls approved', amount: 78000, status: 'completed' },
  { id: '3', date: '2025-11-01', project: 'Modern Duplex - 5th Avenue', milestone: 'Deposit / Mobilization', description: 'Contract deposit - mobilization & procurement', amount: 52000, status: 'completed' },
  { id: '4', date: '2026-02-28', project: 'ADU Build - Elm Street', milestone: 'Finish Work', description: 'Cabinets, flooring, painting complete', amount: 27000, status: 'completed' },
  { id: '5', date: '2026-01-15', project: 'Kitchen Remodel - Oak Lane', milestone: 'MEP Rough-In Complete', description: 'Rough plumbing & electrical passed', amount: 12750, status: 'completed' },
  { id: '6', date: '2025-12-01', project: 'Townhome Development', milestone: 'Deposit / Mobilization', description: 'Initial deposit & site mobilization', amount: 120000, status: 'completed' },
]

const milestoneStatusConfig = {
  'paid':        { bg: 'bg-green-100', text: 'text-green-700', label: 'Paid', dotColor: '#38A169' },
  'in_progress': { bg: '', text: '', label: 'In Progress', dotColor: '#E8793A' },
  'upcoming':    { bg: 'bg-gray-100', text: 'text-gray-500', label: 'Upcoming', dotColor: '#CBD5E0' },
}

export default function PaymentsPage() {
  const [activeTab, setActiveTab] = useState<'milestones' | 'history'>('milestones')
  const [expandedMilestone, setExpandedMilestone] = useState<string | null>(null)
  const [paymentHistory, setPaymentHistory] = useState(PAYMENT_HISTORY)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPayments() {
      try {
        // Try to load real projects and find the first one to fetch payments
        const projRes = await api.listMyProjects()
        if (projRes.projects?.[0]) {
          const histRes = await api.getPaymentHistory(projRes.projects[0].id).catch(() => null)
          if (histRes?.transactions?.length) {
            setPaymentHistory(histRes.transactions.map((t, i) => ({
              id: t.id || String(i),
              date: t.createdAt,
              project: t.milestone?.name || 'Project',
              milestone: t.milestone?.name || t.type,
              description: t.type,
              amount: t.amount,
              status: t.status === 'COMPLETED' ? 'completed' : t.status.toLowerCase(),
            })))
          }
        }
      } catch {
        // Fall back to mock payment history
      } finally {
        setLoading(false)
      }
    }
    fetchPayments()
  }, [])

  const totalPaid = MILESTONES.filter(m => m.status === 'paid').reduce((s, m) => s + m.amount, 0)
  const totalUpcoming = MILESTONES.filter(m => m.status === 'upcoming' || m.status === 'in_progress').reduce((s, m) => s + m.amount, 0)
  const paidPct = Math.round((totalPaid / CONTRACT_AMOUNT) * 100)
  const nextMilestone = MILESTONES.find(m => m.status === 'in_progress') || MILESTONES.find(m => m.status === 'upcoming')

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#2ABFBF' }} />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold" style={{ color: '#1A2B4A' }}>Payments</h1>
        <p className="mt-1 text-sm text-gray-600">Track milestone payments for Modern Duplex - 5th Avenue</p>
      </div>

      {/* Summary Cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-100 p-2.5">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Paid</p>
              <p className="text-xl font-bold" style={{ color: '#1A2B4A' }}>${totalPaid.toLocaleString()}</p>
              <p className="text-xs text-gray-400">{paidPct}% of contract</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-100 p-2.5">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Remaining</p>
              <p className="text-xl font-bold" style={{ color: '#E8793A' }}>${totalUpcoming.toLocaleString()}</p>
              <p className="text-xs text-gray-400">{Math.round((totalUpcoming / CONTRACT_AMOUNT) * 100)}% of contract</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg p-2.5" style={{ backgroundColor: 'rgba(42,191,191,0.1)' }}>
              <CreditCard className="h-5 w-5" style={{ color: '#2ABFBF' }} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Contract Amount</p>
              <p className="text-xl font-bold" style={{ color: '#1A2B4A' }}>${CONTRACT_AMOUNT.toLocaleString()}</p>
              <p className="text-xs text-gray-400">New Home Construction</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 p-2.5">
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Next Milestone</p>
              <p className="text-sm font-bold" style={{ color: '#1A2B4A' }}>{nextMilestone?.name}</p>
              <p className="text-xs text-gray-400">${nextMilestone?.amount.toLocaleString()} ({nextMilestone?.percentage}%)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Milestone Progress Visual */}
      <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold" style={{ color: '#1A2B4A' }}>7-Milestone Payment Schedule</h2>
          <span className="text-xs text-gray-400">Based on v20 seed payment milestone templates</span>
        </div>
        <div className="flex items-end gap-2">
          {MILESTONES.map((m) => {
            const cfg = milestoneStatusConfig[m.status]
            const heightPct = m.percentage * 4 // Scale for visual
            return (
              <div key={m.key} className="flex-1 flex flex-col items-center gap-1.5">
                <span className="text-xs font-semibold" style={{ color: cfg.dotColor }}>${(m.amount / 1000).toFixed(0)}K</span>
                <div
                  className="w-full rounded-t-md transition-all"
                  style={{
                    height: `${heightPct}px`,
                    backgroundColor: cfg.dotColor,
                    opacity: m.status === 'upcoming' ? 0.4 : 1,
                  }}
                />
                <div className="text-center">
                  <p className="text-xs font-medium text-gray-700 leading-tight">{m.percentage}%</p>
                  <p className="text-xs text-gray-400 leading-tight mt-0.5" style={{ fontSize: '10px' }}>{m.name.split(' ')[0]}</p>
                </div>
              </div>
            )
          })}
        </div>
        {/* Legend */}
        <div className="mt-4 flex gap-4 justify-center">
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: '#38A169' }} />
            <span className="text-xs text-gray-500">Paid</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: '#E8793A' }} />
            <span className="text-xs text-gray-500">In Progress</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: '#CBD5E0' }} />
            <span className="text-xs text-gray-500">Upcoming</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex gap-6">
          <button onClick={() => setActiveTab('milestones')}
            className={`border-b-2 pb-3 text-sm font-medium ${activeTab === 'milestones' ? 'border-transparent' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            style={activeTab === 'milestones' ? { borderColor: '#2ABFBF', color: '#2ABFBF' } : undefined}>
            Milestone Details
          </button>
          <button onClick={() => setActiveTab('history')}
            className={`border-b-2 pb-3 text-sm font-medium ${activeTab === 'history' ? 'border-transparent' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            style={activeTab === 'history' ? { borderColor: '#2ABFBF', color: '#2ABFBF' } : undefined}>
            All Payment History
          </button>
        </div>
      </div>

      {activeTab === 'milestones' ? (
        <div className="space-y-3">
          {MILESTONES.map((m) => {
            const cfg = milestoneStatusConfig[m.status]
            const isExpanded = expandedMilestone === m.key
            return (
              <div key={m.key}>
                <button
                  onClick={() => setExpandedMilestone(isExpanded ? null : m.key)}
                  className="w-full text-left rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md"
                >
                  <div className="flex items-center justify-between p-5">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{
                        backgroundColor: m.status === 'paid' ? 'rgba(56,161,105,0.1)' :
                          m.status === 'in_progress' ? 'rgba(232,121,58,0.1)' : 'rgba(203,213,224,0.3)'
                      }}>
                        {m.status === 'paid' ? <CheckCircle className="h-5 w-5 text-green-600" /> :
                         m.status === 'in_progress' ? <Clock className="h-5 w-5" style={{ color: '#E8793A' }} /> :
                         <AlertCircle className="h-5 w-5 text-gray-300" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-gray-400">#{m.order}</span>
                          <p className="text-sm font-semibold" style={{ color: '#1A2B4A' }}>{m.name}</p>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {m.status === 'paid' ? `Paid ${new Date(m.paidDate!).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` :
                           m.dueDate ? `Due ${new Date(m.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` :
                           'Scheduled'}
                          {' '} -- Inspection: {m.typicalInspection.replace(/_/g, ' ')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-4">
                      <div>
                        <p className="text-sm font-bold" style={{ color: '#E8793A' }}>${m.amount.toLocaleString()}</p>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${cfg.bg} ${cfg.text}`}
                          style={m.status === 'in_progress' ? { backgroundColor: 'rgba(232,121,58,0.1)', color: '#E8793A' } : undefined}
                        >
                          {cfg.label}
                        </span>
                      </div>
                      <span className="text-xs font-medium text-gray-300">{m.percentage}%</span>
                    </div>
                  </div>
                </button>
                {isExpanded && (
                  <div className="mx-5 mb-3 rounded-b-lg border border-t-0 border-gray-200 bg-gray-50 p-4">
                    <p className="text-sm text-gray-600">{m.description}</p>
                    <div className="mt-2 flex gap-4 text-xs text-gray-400">
                      <span>Inspection type: <strong className="text-gray-600">{m.typicalInspection.replace(/_/g, ' ')}</strong></span>
                      <span>Percentage: <strong className="text-gray-600">{m.percentage}%</strong></span>
                      <span>Amount: <strong className="text-gray-600">${m.amount.toLocaleString()}</strong></span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="divide-y divide-gray-50">
            {paymentHistory.map((p) => (
              <div key={p.id} className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-green-100 p-2">
                    <ArrowUpRight className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{p.description}</p>
                    <p className="text-xs text-gray-500">
                      {p.project} -- {p.milestone} -- {new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold" style={{ color: '#E8793A' }}>${p.amount.toLocaleString()}</span>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="border-t border-gray-200 px-5 py-4 flex justify-between items-center">
            <span className="text-sm font-medium text-gray-500">Total Disbursed (all projects)</span>
            <span className="text-sm font-bold" style={{ color: '#1A2B4A' }}>
              ${paymentHistory.reduce((s, p) => s + p.amount, 0).toLocaleString()}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
