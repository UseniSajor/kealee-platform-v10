'use client'

import { useState } from 'react'
import { Landmark, DollarSign, TrendingUp, ArrowUpRight, ArrowDownLeft, Building2, Users, Clock, CheckCircle, AlertCircle } from 'lucide-react'

// ── v20 Seed: Payment Milestone Templates (7 milestones) ──
const PAYMENT_MILESTONES = [
  { key: 'DEPOSIT', name: 'Deposit / Mobilization', percentage: 10, order: 1, typicalInspection: 'SITE' },
  { key: 'FOUNDATION', name: 'Foundation Complete', percentage: 15, order: 2, typicalInspection: 'FOUNDATION' },
  { key: 'FRAMING', name: 'Framing Complete', percentage: 20, order: 3, typicalInspection: 'ROUGH_FRAMING' },
  { key: 'MEP_ROUGH', name: 'MEP Rough-In Complete', percentage: 15, order: 4, typicalInspection: 'ROUGH_MECHANICAL' },
  { key: 'DRYWALL_INTERIOR', name: 'Drywall & Interior', percentage: 15, order: 5, typicalInspection: 'INSULATION' },
  { key: 'FINISH', name: 'Finish Work', percentage: 15, order: 6, typicalInspection: 'FINAL_BUILDING' },
  { key: 'COMPLETION', name: 'Substantial Completion', percentage: 10, order: 7, typicalInspection: 'CERTIFICATE_OF_OCCUPANCY' },
] as const

// ── Capital Stacks (per project, tied to v20 project types) ──
const CAPITAL_STACKS = [
  {
    id: '1',
    project: 'Oak Hill Mixed-Use',
    projectType: 'MIXED_USE',
    twinTier: 'L3',
    totalCapital: 28500000,
    sources: [
      { name: 'Senior Debt', amount: 19950000, pct: 70, rate: '6.5%', lender: 'First National Bank' },
      { name: 'Mezzanine', amount: 2850000, pct: 10, rate: '12%', lender: 'Capital Bridge Fund' },
      { name: 'LP Equity', amount: 4275000, pct: 15, rate: '18% pref', lender: '4 investors' },
      { name: 'GP Equity', amount: 1425000, pct: 5, rate: 'Promote', lender: 'Your Entity' },
    ],
  },
  {
    id: '2',
    project: 'Riverside Multifamily',
    projectType: 'MULTIFAMILY',
    twinTier: 'L3',
    totalCapital: 42000000,
    sources: [
      { name: 'Senior Debt', amount: 29400000, pct: 70, rate: '6.0%', lender: 'Prosperity Bank' },
      { name: 'Mezzanine', amount: 4200000, pct: 10, rate: '11%', lender: 'Meridian Capital' },
      { name: 'LP Equity', amount: 6300000, pct: 15, rate: '16% pref', lender: '6 investors' },
      { name: 'GP Equity', amount: 2100000, pct: 5, rate: 'Promote', lender: 'Your Entity' },
    ],
  },
  {
    id: '3',
    project: 'East Austin Townhomes',
    projectType: 'MULTIFAMILY',
    twinTier: 'L3',
    totalCapital: 7200000,
    sources: [
      { name: 'Construction Loan', amount: 5040000, pct: 70, rate: '7.0%', lender: 'Independent Bank' },
      { name: 'LP Equity', amount: 1440000, pct: 20, rate: '15% pref', lender: '2 investors' },
      { name: 'GP Equity', amount: 720000, pct: 10, rate: 'Promote', lender: 'Your Entity' },
    ],
  },
  {
    id: '4',
    project: 'Congress Ave Retail',
    projectType: 'COMMERCIAL',
    twinTier: 'L2',
    totalCapital: 8200000,
    sources: [
      { name: 'Senior Debt', amount: 5740000, pct: 70, rate: '7.25%', lender: 'Western Alliance Bank' },
      { name: 'LP Equity', amount: 1640000, pct: 20, rate: '14% pref', lender: '3 investors' },
      { name: 'GP Equity', amount: 820000, pct: 10, rate: 'Promote', lender: 'Your Entity' },
    ],
  },
]

// Draw schedule aligned to 7 payment milestones from seed
const DRAW_SCHEDULE = [
  { id: '1', project: 'Oak Hill Mixed-Use', milestone: 'DEPOSIT', milestoneName: 'Deposit / Mobilization', amount: 2850000, percentage: 10, requested: '2026-01-15', status: 'funded', funded: '2026-01-20' },
  { id: '2', project: 'Oak Hill Mixed-Use', milestone: 'FOUNDATION', milestoneName: 'Foundation Complete', amount: 4275000, percentage: 15, requested: '2026-02-28', status: 'funded', funded: '2026-03-05' },
  { id: '3', project: 'Oak Hill Mixed-Use', milestone: 'FRAMING', milestoneName: 'Framing Complete', amount: 5700000, percentage: 20, requested: '2026-03-10', status: 'approved', funded: null },
  { id: '4', project: 'Riverside Multifamily', milestone: 'DEPOSIT', milestoneName: 'Deposit / Mobilization', amount: 4200000, percentage: 10, requested: '2025-11-01', status: 'funded', funded: '2025-11-06' },
  { id: '5', project: 'Riverside Multifamily', milestone: 'FOUNDATION', milestoneName: 'Foundation Complete', amount: 6300000, percentage: 15, requested: '2026-01-10', status: 'funded', funded: '2026-01-15' },
  { id: '6', project: 'Riverside Multifamily', milestone: 'FRAMING', milestoneName: 'Framing Complete', amount: 8400000, percentage: 20, requested: '2026-03-01', status: 'funded', funded: '2026-03-06' },
  { id: '7', project: 'Riverside Multifamily', milestone: 'MEP_ROUGH', milestoneName: 'MEP Rough-In Complete', amount: 6300000, percentage: 15, requested: '2026-03-10', status: 'submitted', funded: null },
  { id: '8', project: 'East Austin Townhomes', milestone: 'DEPOSIT', milestoneName: 'Deposit / Mobilization', amount: 720000, percentage: 10, requested: '2026-02-01', status: 'funded', funded: '2026-02-05' },
  { id: '9', project: 'East Austin Townhomes', milestone: 'FOUNDATION', milestoneName: 'Foundation Complete', amount: 1080000, percentage: 15, requested: '2026-03-08', status: 'pending', funded: null },
]

const drawStatusColors: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-700',
  submitted: 'bg-amber-100 text-amber-700',
  approved: 'bg-blue-100 text-blue-700',
  funded: 'bg-green-100 text-green-700',
}

// Investor reporting data
const INVESTOR_SUMMARY = {
  totalCommitments: 13655000, // Sum of all LP equity
  capitalCalled: 9855000,
  distributions: 0,
  remainingCommitment: 3800000,
  weightedIRR: 19.4,
  investorCount: 15,
}

export default function CapitalPage() {
  const [activeTab, setActiveTab] = useState<'stacks' | 'draws' | 'investors'>('stacks')

  const totalCapital = CAPITAL_STACKS.reduce((s, c) => s + c.totalCapital, 0)
  const totalDebt = CAPITAL_STACKS.reduce((s, c) => s + c.sources.filter(src => src.name.includes('Debt') || src.name.includes('Loan')).reduce((ss, src) => ss + src.amount, 0), 0)
  const totalLPEquity = CAPITAL_STACKS.reduce((s, c) => s + c.sources.filter(src => src.name.includes('LP')).reduce((ss, src) => ss + src.amount, 0), 0)
  const pendingDraws = DRAW_SCHEDULE.filter(d => d.status !== 'funded').reduce((s, d) => s + d.amount, 0)
  const fundedDraws = DRAW_SCHEDULE.filter(d => d.status === 'funded').reduce((s, d) => s + d.amount, 0)

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold" style={{ color: '#1A2B4A' }}>Capital Management</h1>
        <p className="mt-1 text-sm text-gray-600">Capital stacks, draw tracking ({PAYMENT_MILESTONES.length}-milestone schedule), and investor reporting</p>
      </div>

      {/* Summary Cards */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-5">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2"><Landmark className="h-5 w-5" style={{ color: '#1A2B4A' }} /></div>
          <p className="mt-2 text-2xl font-bold" style={{ color: '#1A2B4A' }}>${(totalCapital / 1000000).toFixed(1)}M</p>
          <p className="text-xs text-gray-500">Total Capital Deployed</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2"><TrendingUp className="h-5 w-5" style={{ color: '#2ABFBF' }} /></div>
          <p className="mt-2 text-2xl font-bold" style={{ color: '#1A2B4A' }}>${(totalDebt / 1000000).toFixed(1)}M</p>
          <p className="text-xs text-gray-500">Total Debt</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2"><Users className="h-5 w-5" style={{ color: '#E8793A' }} /></div>
          <p className="mt-2 text-2xl font-bold" style={{ color: '#1A2B4A' }}>${(totalLPEquity / 1000000).toFixed(1)}M</p>
          <p className="text-xs text-gray-500">LP Equity</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2"><DollarSign className="h-5 w-5" style={{ color: '#38A169' }} /></div>
          <p className="mt-2 text-2xl font-bold" style={{ color: '#1A2B4A' }}>${(fundedDraws / 1000000).toFixed(1)}M</p>
          <p className="text-xs text-gray-500">Draws Funded</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2"><Clock className="h-5 w-5" style={{ color: '#D69E2E' }} /></div>
          <p className="mt-2 text-2xl font-bold" style={{ color: '#1A2B4A' }}>${(pendingDraws / 1000000).toFixed(1)}M</p>
          <p className="text-xs text-gray-500">Draws Pending</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex gap-6">
          {[
            { key: 'stacks' as const, label: 'Capital Stacks' },
            { key: 'draws' as const, label: `Draw Tracking (${PAYMENT_MILESTONES.length} Milestones)` },
            { key: 'investors' as const, label: 'Investor Reporting' },
          ].map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`border-b-2 pb-3 text-sm font-medium ${activeTab === tab.key ? 'border-current' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              style={activeTab === tab.key ? { color: '#2ABFBF', borderColor: '#2ABFBF' } : undefined}>{tab.label}</button>
          ))}
        </div>
      </div>

      {/* ── Capital Stacks Tab ── */}
      {activeTab === 'stacks' && (
        <div className="space-y-6">
          {CAPITAL_STACKS.map((stack) => (
            <div key={stack.id} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="font-display text-lg font-semibold" style={{ color: '#1A2B4A' }}>{stack.project}</h3>
                  <p className="text-xs text-gray-500">{stack.projectType.replace('_', ' ')} | {stack.twinTier} Twin</p>
                </div>
                <span className="text-sm font-bold" style={{ color: '#1A2B4A' }}>${(stack.totalCapital / 1000000).toFixed(2)}M total</span>
              </div>

              {/* Stacked bar */}
              <div className="mb-4 flex h-6 w-full overflow-hidden rounded-full">
                {stack.sources.map((s, i) => {
                  const barColors = ['#1A2B4A', '#2ABFBF', '#E8793A', '#D69E2E']
                  return <div key={i} className="transition-all" style={{ width: `${s.pct}%`, backgroundColor: barColors[i % barColors.length] }} />
                })}
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {stack.sources.map((s, i) => {
                  const textColors = ['#1A2B4A', '#2ABFBF', '#E8793A', '#D69E2E']
                  const dotColors = ['#1A2B4A', '#2ABFBF', '#E8793A', '#D69E2E']
                  return (
                    <div key={i} className="rounded-lg border border-gray-200 p-3">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: dotColors[i % dotColors.length] }} />
                        <p className="text-xs font-medium text-gray-500">{s.name} ({s.pct}%)</p>
                      </div>
                      <p className="mt-1 text-lg font-bold" style={{ color: textColors[i % textColors.length] }}>${(s.amount / 1000000).toFixed(2)}M</p>
                      <p className="text-xs text-gray-500">{s.rate} | {s.lender}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Draws Tab (7-milestone schedule) ── */}
      {activeTab === 'draws' && (
        <div className="space-y-6">
          {/* Milestone template reference */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold" style={{ color: '#1A2B4A' }}>Standard Draw Schedule ({PAYMENT_MILESTONES.length} Milestones)</h3>
            <div className="flex h-8 w-full overflow-hidden rounded-lg">
              {PAYMENT_MILESTONES.map((ms, i) => {
                const milestoneColors = ['#6366F1', '#3B82F6', '#2ABFBF', '#38A169', '#E8793A', '#D69E2E', '#1A2B4A']
                return (
                  <div key={ms.key} className="flex items-center justify-center text-xs font-bold text-white"
                    style={{ width: `${ms.percentage}%`, backgroundColor: milestoneColors[i], minWidth: '30px' }}
                    title={`${ms.name}: ${ms.percentage}%`}>
                    {ms.percentage}%
                  </div>
                )
              })}
            </div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
              {PAYMENT_MILESTONES.map((ms, i) => {
                const milestoneColors = ['#6366F1', '#3B82F6', '#2ABFBF', '#38A169', '#E8793A', '#D69E2E', '#1A2B4A']
                return (
                  <div key={ms.key} className="flex items-center gap-1.5 text-xs text-gray-500">
                    <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: milestoneColors[i] }} />
                    {ms.name} ({ms.percentage}%)
                  </div>
                )
              })}
            </div>
          </div>

          {/* Draw list */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="divide-y divide-gray-50">
              {DRAW_SCHEDULE.map((draw) => (
                <div key={draw.id} className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`rounded-lg p-2 ${draw.status === 'funded' ? 'bg-green-100' : draw.status === 'approved' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                      {draw.status === 'funded' ? <CheckCircle className="h-4 w-4 text-green-600" /> :
                       draw.status === 'approved' ? <ArrowDownLeft className="h-4 w-4 text-blue-600" /> :
                       <Clock className="h-4 w-4 text-gray-500" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: '#1A2B4A' }}>{draw.milestoneName}</p>
                      <p className="text-xs text-gray-500">
                        {draw.project} | {draw.percentage}% of contract |
                        Requested {new Date(draw.requested).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold" style={{ color: '#1A2B4A' }}>${(draw.amount / 1000000).toFixed(2)}M</span>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${drawStatusColors[draw.status]}`}>{draw.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Investor Reporting Tab ── */}
      {activeTab === 'investors' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-xs text-gray-500">Total LP Commitments</p>
              <p className="mt-1 text-2xl font-bold" style={{ color: '#1A2B4A' }}>${(INVESTOR_SUMMARY.totalCommitments / 1000000).toFixed(2)}M</p>
              <p className="mt-1 text-xs text-gray-400">{INVESTOR_SUMMARY.investorCount} investors across {CAPITAL_STACKS.length} projects</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-xs text-gray-500">Capital Called</p>
              <p className="mt-1 text-2xl font-bold" style={{ color: '#E8793A' }}>${(INVESTOR_SUMMARY.capitalCalled / 1000000).toFixed(2)}M</p>
              <p className="mt-1 text-xs text-gray-400">{((INVESTOR_SUMMARY.capitalCalled / INVESTOR_SUMMARY.totalCommitments) * 100).toFixed(0)}% of total commitments</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-xs text-gray-500">Remaining Unfunded</p>
              <p className="mt-1 text-2xl font-bold" style={{ color: '#2ABFBF' }}>${(INVESTOR_SUMMARY.remainingCommitment / 1000000).toFixed(2)}M</p>
              <p className="mt-1 text-xs text-gray-400">Next call anticipated Q2 2026</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-xs text-gray-500">Distributions to Date</p>
              <p className="mt-1 text-2xl font-bold" style={{ color: '#38A169' }}>${(INVESTOR_SUMMARY.distributions / 1000000).toFixed(2)}M</p>
              <p className="mt-1 text-xs text-gray-400">All projects in development phase</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-xs text-gray-500">Weighted Portfolio IRR</p>
              <p className="mt-1 text-2xl font-bold" style={{ color: '#2ABFBF' }}>{INVESTOR_SUMMARY.weightedIRR}%</p>
              <p className="mt-1 text-xs text-gray-400">Projected at stabilization</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-xs text-gray-500">Active Investors</p>
              <p className="mt-1 text-2xl font-bold" style={{ color: '#1A2B4A' }}>{INVESTOR_SUMMARY.investorCount}</p>
              <p className="mt-1 text-xs text-gray-400">Across {CAPITAL_STACKS.length} project capital stacks</p>
            </div>
          </div>

          {/* Per-project capital called */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold" style={{ color: '#1A2B4A' }}>Capital Called by Project</h3>
            {CAPITAL_STACKS.map((stack) => {
              const projectDraws = DRAW_SCHEDULE.filter(d => d.project === stack.project)
              const funded = projectDraws.filter(d => d.status === 'funded').reduce((s, d) => s + d.amount, 0)
              const pctDrawn = stack.totalCapital > 0 ? (funded / stack.totalCapital) * 100 : 0
              return (
                <div key={stack.id} className="mb-4 last:mb-0">
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="font-medium" style={{ color: '#1A2B4A' }}>{stack.project}</span>
                    <span className="text-gray-500">${(funded / 1000000).toFixed(1)}M / ${(stack.totalCapital / 1000000).toFixed(1)}M ({pctDrawn.toFixed(0)}%)</span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100">
                    <div className="h-full rounded-full" style={{ width: `${pctDrawn}%`, backgroundColor: '#2ABFBF' }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
