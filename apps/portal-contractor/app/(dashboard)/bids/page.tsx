'use client'

import { useState } from 'react'
import { Clock, CheckCircle, XCircle, AlertCircle, DollarSign, Calendar, Cpu, Layers, ChevronDown, ChevronUp } from 'lucide-react'

// ── v20 Seed Data: CSI Divisions ───────────────────────────────────
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

// ── v20 Seed Data: Payment Milestones ──────────────────────────────
const PAYMENT_MILESTONES = [
  { key: 'DEPOSIT', name: 'Deposit / Mobilization', percentage: 10, order: 1 },
  { key: 'FOUNDATION', name: 'Foundation Complete', percentage: 15, order: 2 },
  { key: 'FRAMING', name: 'Framing Complete', percentage: 20, order: 3 },
  { key: 'MEP_ROUGH', name: 'MEP Rough-In Complete', percentage: 15, order: 4 },
  { key: 'DRYWALL_INTERIOR', name: 'Drywall & Interior', percentage: 15, order: 5 },
  { key: 'FINISH', name: 'Finish Work', percentage: 15, order: 6 },
  { key: 'COMPLETION', name: 'Substantial Completion', percentage: 10, order: 7 },
] as const

const twinTierLabels: Record<string, { label: string; color: string; bgColor: string }> = {
  L1: { label: 'L1 Light', color: '#2ABFBF', bgColor: 'rgba(42,191,191,0.1)' },
  L2: { label: 'L2 Standard', color: '#E8793A', bgColor: 'rgba(232,121,58,0.1)' },
  L3: { label: 'L3 Premium', color: '#7C3AED', bgColor: 'rgba(124,58,237,0.1)' },
}

interface CsiBreakdown {
  division: string
  amount: number
}

interface Bid {
  id: string
  project: string
  projectType: string
  twinTier: string
  amount: number
  submitted: string
  status: string
  deadline: string
  client: string
  clientRole: string
  csiBreakdown: CsiBreakdown[]
  milestoneSchedule: { key: string; amount: number }[]
}

const BIDS: Bid[] = [
  {
    id: '1',
    project: 'Whole-Home Renovation - Westlake Hills',
    projectType: 'Renovation / Remodel',
    twinTier: 'L1',
    amount: 142500,
    submitted: '2026-03-08',
    status: 'pending',
    deadline: '2026-03-18',
    client: 'Jennifer Adams',
    clientRole: 'Homeowner',
    csiBreakdown: [
      { division: '06', amount: 38200 },
      { division: '09', amount: 42800 },
      { division: '22', amount: 28500 },
      { division: '26', amount: 21400 },
      { division: '08', amount: 11600 },
    ],
    milestoneSchedule: [
      { key: 'DEPOSIT', amount: 14250 },
      { key: 'FOUNDATION', amount: 21375 },
      { key: 'FRAMING', amount: 28500 },
      { key: 'MEP_ROUGH', amount: 21375 },
      { key: 'DRYWALL_INTERIOR', amount: 21375 },
      { key: 'FINISH', amount: 21375 },
      { key: 'COMPLETION', amount: 14250 },
    ],
  },
  {
    id: '2',
    project: 'Custom New Home - Dripping Springs',
    projectType: 'New Home Construction',
    twinTier: 'L2',
    amount: 724000,
    submitted: '2026-03-05',
    status: 'shortlisted',
    deadline: '2026-03-15',
    client: 'Mark & Laura Johnson',
    clientRole: 'Homeowner',
    csiBreakdown: [
      { division: '03', amount: 86880 },
      { division: '05', amount: 50680 },
      { division: '06', amount: 137560 },
      { division: '07', amount: 57920 },
      { division: '08', amount: 50680 },
      { division: '09', amount: 115840 },
      { division: '22', amount: 72400 },
      { division: '23', amount: 86880 },
      { division: '26', amount: 65160 },
    ],
    milestoneSchedule: [
      { key: 'DEPOSIT', amount: 72400 },
      { key: 'FOUNDATION', amount: 108600 },
      { key: 'FRAMING', amount: 144800 },
      { key: 'MEP_ROUGH', amount: 108600 },
      { key: 'DRYWALL_INTERIOR', amount: 108600 },
      { key: 'FINISH', amount: 108600 },
      { key: 'COMPLETION', amount: 72400 },
    ],
  },
  {
    id: '3',
    project: 'Office Build-Out - Domain',
    projectType: 'Commercial Build-Out',
    twinTier: 'L2',
    amount: 465000,
    submitted: '2026-03-03',
    status: 'pending',
    deadline: '2026-03-14',
    client: 'Domain Partners LLC',
    clientRole: 'Developer',
    csiBreakdown: [
      { division: '05', amount: 46500 },
      { division: '06', amount: 74400 },
      { division: '08', amount: 60450 },
      { division: '09', amount: 102300 },
      { division: '22', amount: 55800 },
      { division: '23', amount: 79050 },
      { division: '26', amount: 46500 },
    ],
    milestoneSchedule: [
      { key: 'DEPOSIT', amount: 46500 },
      { key: 'FOUNDATION', amount: 69750 },
      { key: 'FRAMING', amount: 93000 },
      { key: 'MEP_ROUGH', amount: 69750 },
      { key: 'DRYWALL_INTERIOR', amount: 69750 },
      { key: 'FINISH', amount: 69750 },
      { key: 'COMPLETION', amount: 46500 },
    ],
  },
  {
    id: '4',
    project: 'Kitchen & Bath Remodel - Cedar Park',
    projectType: 'Renovation / Remodel',
    twinTier: 'L1',
    amount: 78500,
    submitted: '2026-02-28',
    status: 'won',
    deadline: '2026-03-10',
    client: 'Sarah Kim',
    clientRole: 'Homeowner',
    csiBreakdown: [
      { division: '06', amount: 23550 },
      { division: '09', amount: 25505 },
      { division: '22', amount: 18840 },
      { division: '26', amount: 10605 },
    ],
    milestoneSchedule: [
      { key: 'DEPOSIT', amount: 7850 },
      { key: 'FOUNDATION', amount: 11775 },
      { key: 'FRAMING', amount: 15700 },
      { key: 'MEP_ROUGH', amount: 11775 },
      { key: 'DRYWALL_INTERIOR', amount: 11775 },
      { key: 'FINISH', amount: 11775 },
      { key: 'COMPLETION', amount: 7850 },
    ],
  },
  {
    id: '5',
    project: 'Second-Story Addition - Mueller',
    projectType: 'Home Addition',
    twinTier: 'L2',
    amount: 312000,
    submitted: '2026-02-20',
    status: 'won',
    deadline: '2026-03-01',
    client: 'Robert & Amy Chen',
    clientRole: 'Homeowner',
    csiBreakdown: [
      { division: '03', amount: 31200 },
      { division: '05', amount: 37440 },
      { division: '06', amount: 59280 },
      { division: '07', amount: 28080 },
      { division: '09', amount: 56160 },
      { division: '22', amount: 37440 },
      { division: '23', amount: 34320 },
      { division: '26', amount: 28080 },
    ],
    milestoneSchedule: [
      { key: 'DEPOSIT', amount: 31200 },
      { key: 'FOUNDATION', amount: 46800 },
      { key: 'FRAMING', amount: 62400 },
      { key: 'MEP_ROUGH', amount: 46800 },
      { key: 'DRYWALL_INTERIOR', amount: 46800 },
      { key: 'FINISH', amount: 46800 },
      { key: 'COMPLETION', amount: 31200 },
    ],
  },
  {
    id: '6',
    project: 'Garage Apartment ADU - East Austin',
    projectType: 'Home Addition',
    twinTier: 'L2',
    amount: 218000,
    submitted: '2026-02-15',
    status: 'lost',
    deadline: '2026-02-25',
    client: 'David Miller',
    clientRole: 'Homeowner',
    csiBreakdown: [
      { division: '03', amount: 26160 },
      { division: '05', amount: 21800 },
      { division: '06', amount: 41420 },
      { division: '07', amount: 19620 },
      { division: '08', amount: 17440 },
      { division: '09', amount: 34880 },
      { division: '22', amount: 21800 },
      { division: '23', amount: 19620 },
      { division: '26', amount: 15260 },
    ],
    milestoneSchedule: [
      { key: 'DEPOSIT', amount: 21800 },
      { key: 'FOUNDATION', amount: 32700 },
      { key: 'FRAMING', amount: 43600 },
      { key: 'MEP_ROUGH', amount: 32700 },
      { key: 'DRYWALL_INTERIOR', amount: 32700 },
      { key: 'FINISH', amount: 32700 },
      { key: 'COMPLETION', amount: 21800 },
    ],
  },
]

const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: typeof Clock }> = {
  pending: { label: 'Pending Review', color: '#92400E', bgColor: 'rgba(251,191,36,0.15)', icon: Clock },
  shortlisted: { label: 'Shortlisted', color: '#2ABFBF', bgColor: 'rgba(42,191,191,0.1)', icon: AlertCircle },
  won: { label: 'Won', color: '#38A169', bgColor: 'rgba(56,161,105,0.1)', icon: CheckCircle },
  lost: { label: 'Lost', color: '#E53E3E', bgColor: 'rgba(229,62,62,0.1)', icon: XCircle },
}

export default function BidsPage() {
  const [filter, setFilter] = useState('all')
  const [expandedBid, setExpandedBid] = useState<string | null>(null)

  const filtered = filter === 'all' ? BIDS : BIDS.filter(b => b.status === filter)
  const totalActive = BIDS.filter(b => b.status === 'pending' || b.status === 'shortlisted').length
  const totalWon = BIDS.filter(b => b.status === 'won').length
  const totalWonValue = BIDS.filter(b => b.status === 'won').reduce((s, b) => s + b.amount, 0)
  const winRate = Math.round((totalWon / BIDS.length) * 100)

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold" style={{ color: '#1A2B4A' }}>My Bids</h1>
        <p className="mt-1 text-sm text-gray-600">Track and manage your bid submissions with CSI breakdowns and milestone schedules</p>
      </div>

      {/* Summary Stats */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-5">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-500">Total Bids</p>
          <p className="mt-1 text-2xl font-bold" style={{ color: '#1A2B4A' }}>{BIDS.length}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-500">Active</p>
          <p className="mt-1 text-2xl font-bold" style={{ color: '#E8793A' }}>{totalActive}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-500">Won</p>
          <p className="mt-1 text-2xl font-bold" style={{ color: '#38A169' }}>{totalWon}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-500">Won Value</p>
          <p className="mt-1 text-2xl font-bold" style={{ color: '#38A169' }}>${(totalWonValue / 1000).toFixed(0)}k</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-500">Win Rate</p>
          <p className="mt-1 text-2xl font-bold" style={{ color: '#2ABFBF' }}>{winRate}%</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 flex gap-2">
        {['all', 'pending', 'shortlisted', 'won', 'lost'].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className="rounded-lg px-3 py-2 text-xs font-medium capitalize"
            style={{
              backgroundColor: filter === f ? 'rgba(42,191,191,0.1)' : '#F3F4F6',
              color: filter === f ? '#2ABFBF' : '#4B5563',
            }}>{f}</button>
        ))}
      </div>

      {/* Bid Cards */}
      <div className="space-y-3">
        {filtered.map((bid) => {
          const config = statusConfig[bid.status]
          const StatusIcon = config.icon
          const twinMeta = twinTierLabels[bid.twinTier]
          const isExpanded = expandedBid === bid.id

          return (
            <div key={bid.id} className="rounded-xl border border-gray-200 bg-white shadow-sm">
              {/* Bid Header */}
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display font-semibold" style={{ color: '#1A2B4A' }}>{bid.project}</h3>
                      <span className="rounded px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: 'rgba(232,121,58,0.1)', color: '#E8793A' }}>{bid.projectType}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-gray-500">Client: {bid.client} ({bid.clientRole})</p>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />${bid.amount.toLocaleString()}</span>
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />Submitted {new Date(bid.submitted).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: twinMeta.bgColor, color: twinMeta.color }}>
                        <Cpu className="h-3 w-3" />{twinMeta.label}
                      </span>
                    </div>
                  </div>
                  <div className="ml-3 flex flex-col items-end gap-2">
                    <span className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium" style={{ backgroundColor: config.bgColor, color: config.color }}>
                      <StatusIcon className="h-3.5 w-3.5" />
                      {config.label}
                    </span>
                  </div>
                </div>

                {/* CSI Trade Tags */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {bid.csiBreakdown.map((csi) => (
                    <span key={csi.division} className="rounded border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs text-gray-600">
                      Div {csi.division} {CSI_DIVISIONS[csi.division]}: ${csi.amount.toLocaleString()}
                    </span>
                  ))}
                </div>

                {/* Expand Toggle */}
                <button
                  onClick={() => setExpandedBid(isExpanded ? null : bid.id)}
                  className="mt-3 flex items-center gap-1 text-xs font-medium"
                  style={{ color: '#2ABFBF' }}
                >
                  {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  {isExpanded ? 'Hide' : 'Show'} Milestone Schedule
                </button>
              </div>

              {/* Expanded: Payment Milestone Schedule */}
              {isExpanded && (
                <div className="border-t border-gray-100 bg-gray-50 px-5 py-4">
                  <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold" style={{ color: '#1A2B4A' }}>
                    <Layers className="h-3.5 w-3.5" />
                    Payment Milestone Schedule (7 Milestones)
                  </p>
                  <div className="space-y-2">
                    {bid.milestoneSchedule.map((ms) => {
                      const template = PAYMENT_MILESTONES.find(t => t.key === ms.key)
                      return (
                        <div key={ms.key} className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold text-white" style={{ backgroundColor: '#1A2B4A', fontSize: '9px' }}>
                              {template?.order}
                            </span>
                            <span className="font-medium text-gray-700">{template?.name}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-gray-400">{template?.percentage}%</span>
                            <span className="font-semibold" style={{ color: '#1A2B4A' }}>${ms.amount.toLocaleString()}</span>
                          </div>
                        </div>
                      )
                    })}
                    <div className="mt-1 flex items-center justify-between rounded-lg px-3 py-2 text-xs font-bold" style={{ backgroundColor: 'rgba(42,191,191,0.08)' }}>
                      <span style={{ color: '#1A2B4A' }}>Total Contract Amount</span>
                      <span style={{ color: '#1A2B4A' }}>${bid.amount.toLocaleString()}</span>
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
