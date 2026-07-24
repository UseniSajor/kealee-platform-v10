'use client'

import { useState, useEffect, useCallback } from 'react'
import { DollarSign, ArrowUpRight, CreditCard, Clock, CheckCircle, AlertCircle, TrendingUp, RefreshCw, XCircle } from 'lucide-react'
import { listProjects } from '@/lib/api/owner'
import {
  getProjectMilestones,
  approveMilestone,
  releaseMilestonePayment,
  type ApiMilestone,
} from '@/lib/api/payments'

// ── Seed data (shown when API unavailable) ────────────────────────────────────
const SEED_CONTRACT_AMOUNT = 520000
const SEED_MILESTONES = [
  { key: 'DEPOSIT',           name: 'Deposit / Mobilization',    percentage: 10, order: 1, description: 'Initial deposit covering mobilization and procurement.', amount: 52000,  status: 'paid'        as const, paidDate: '2025-11-01' },
  { key: 'FOUNDATION',        name: 'Foundation Complete',        percentage: 15, order: 2, description: 'Released after foundation inspection approval.',          amount: 78000,  status: 'paid'        as const, paidDate: '2025-12-20' },
  { key: 'FRAMING',           name: 'Framing Complete',           percentage: 20, order: 3, description: 'Released after structural framing inspection.',           amount: 104000, status: 'in_progress' as const, dueDate: '2026-03-15' },
  { key: 'MEP_ROUGH',         name: 'MEP Rough-In Complete',      percentage: 15, order: 4, description: 'Released after rough MEP inspection before wall close.',  amount: 78000,  status: 'upcoming'    as const, dueDate: '2026-04-15' },
  { key: 'DRYWALL_INTERIOR',  name: 'Drywall & Interior',         percentage: 15, order: 5, description: 'Released after insulation, drywall, and interior trim.',   amount: 78000,  status: 'upcoming'    as const, dueDate: '2026-05-30' },
  { key: 'FINISH',            name: 'Finish Work',                percentage: 15, order: 6, description: 'Released after cabinets, flooring, painting, fixtures.',   amount: 78000,  status: 'upcoming'    as const, dueDate: '2026-07-15' },
  { key: 'COMPLETION',        name: 'Substantial Completion',     percentage: 10, order: 7, description: 'Final payment upon CO and closeout documentation.',         amount: 52000,  status: 'upcoming'    as const, dueDate: '2026-08-01' },
]

type DisplayStatus = 'paid' | 'in_progress' | 'upcoming' | 'submitted' | 'approved' | 'rejected'

interface DisplayMilestone {
  id?: string
  key: string
  name: string
  percentage: number
  order: number
  description: string
  amount: number
  status: DisplayStatus
  paidDate?: string
  dueDate?: string
  canApprove?: boolean
  canRelease?: boolean
  apiStatus?: string
}

const PHASE_PERCENTAGES: Record<string, number> = {
  DEPOSIT: 10, FOUNDATION: 15, FRAMING: 20, MEP_ROUGH: 15,
  DRYWALL_INTERIOR: 15, FINISH: 15, COMPLETION: 10,
}

function mapApiStatus(s: string): DisplayStatus {
  if (s === 'PAID') return 'paid'
  if (s === 'APPROVED') return 'approved'
  if (s === 'SUBMITTED' || s === 'UNDER_REVIEW') return 'submitted'
  if (s === 'REJECTED') return 'rejected'
  return 'upcoming'
}

function toDisplayMilestone(m: ApiMilestone, idx: number): DisplayMilestone {
  const status = mapApiStatus(m.status)
  const key = m.name.toUpperCase().replace(/[^A-Z]/g, '_').replace(/_+/g, '_')
  return {
    id: m.id,
    key,
    name: m.name,
    percentage: PHASE_PERCENTAGES[key] ?? 10,
    order: idx + 1,
    description: '',
    amount: m.amount,
    status,
    dueDate: m.dueDate ?? undefined,
    apiStatus: m.status,
    canApprove: m.status === 'SUBMITTED' || m.status === 'UNDER_REVIEW',
    canRelease: m.status === 'APPROVED',
  }
}

const STATUS_CONFIG: Record<DisplayStatus, { bg: string; text: string; label: string; dotColor: string }> = {
  paid:        { bg: 'bg-green-100',  text: 'text-green-700',  label: 'Paid',           dotColor: '#38A169' },
  approved:    { bg: 'bg-teal-100',   text: 'text-teal-700',   label: 'Approved',       dotColor: '#2ABFBF' },
  submitted:   { bg: '',              text: '',                 label: 'Submitted',      dotColor: '#E8793A' },
  in_progress: { bg: '',              text: '',                 label: 'In Progress',    dotColor: '#E8793A' },
  upcoming:    { bg: 'bg-gray-100',   text: 'text-gray-500',   label: 'Upcoming',       dotColor: '#CBD5E0' },
  rejected:    { bg: 'bg-red-100',    text: 'text-red-600',    label: 'Rejected',       dotColor: '#E53E3E' },
}

export default function PaymentsPage() {
  const [milestones, setMilestones]         = useState<DisplayMilestone[]>(SEED_MILESTONES)
  const [contractAmount, setContractAmount] = useState(SEED_CONTRACT_AMOUNT)
  const [projectId, setProjectId]           = useState<string | null>(null)
  const [projectName, setProjectName]       = useState('Loading...')
  const [isLive, setIsLive]                 = useState(false)
  const [loading, setLoading]               = useState(true)
  const [activeTab, setActiveTab]           = useState<'milestones' | 'history'>('milestones')
  const [expanded, setExpanded]             = useState<string | null>(null)
  const [actionState, setActionState]       = useState<Record<string, 'idle' | 'loading' | 'success' | 'error'>>({})

  const load = useCallback(async () => {
    try {
      const { projects } = await listProjects()
      if (!projects.length) { setLoading(false); return }

      const proj = projects[0]
      setProjectId(proj.id)
      setProjectName(proj.name)
      if (proj.totalBudget) setContractAmount(proj.totalBudget)

      const data = await getProjectMilestones(proj.id)
      if (data.milestones?.length) {
        setMilestones(data.milestones.map(toDisplayMilestone))
        setIsLive(true)
      }
    } catch {
      // keep seed data
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleApprove(m: DisplayMilestone) {
    if (!m.id) return
    setActionState(s => ({ ...s, [m.key]: 'loading' }))
    try {
      await approveMilestone(m.id)
      setActionState(s => ({ ...s, [m.key]: 'success' }))
      setMilestones(prev => prev.map(x => x.key === m.key
        ? { ...x, status: 'approved', canApprove: false, canRelease: true } : x))
    } catch {
      setActionState(s => ({ ...s, [m.key]: 'error' }))
      setTimeout(() => setActionState(s => ({ ...s, [m.key]: 'idle' })), 3000)
    }
  }

  async function handleRelease(m: DisplayMilestone) {
    if (!m.id || !projectId) return
    setActionState(s => ({ ...s, [m.key]: 'loading' }))
    try {
      await releaseMilestonePayment(projectId, m.id)
      setActionState(s => ({ ...s, [m.key]: 'success' }))
      setMilestones(prev => prev.map(x => x.key === m.key
        ? { ...x, status: 'paid', canApprove: false, canRelease: false, paidDate: new Date().toISOString().split('T')[0] } : x))
    } catch {
      setActionState(s => ({ ...s, [m.key]: 'error' }))
      setTimeout(() => setActionState(s => ({ ...s, [m.key]: 'idle' })), 3000)
    }
  }

  const totalPaid     = milestones.filter(m => m.status === 'paid').reduce((s, m) => s + m.amount, 0)
  const totalUpcoming = milestones.filter(m => m.status !== 'paid').reduce((s, m) => s + m.amount, 0)
  const paidPct       = Math.round((totalPaid / contractAmount) * 100)
  const nextMilestone = milestones.find(m => m.status === 'submitted' || m.status === 'approved' || m.status === 'in_progress') || milestones.find(m => m.status === 'upcoming')

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold" style={{ color: '#1A2B4A' }}>Payments</h1>
          <p className="mt-1 text-sm text-gray-600">
            Milestone payment schedule — {loading ? 'Loading...' : projectName}
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
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-100 p-2.5"><DollarSign className="h-5 w-5 text-green-600" /></div>
            <div>
              <p className="text-sm text-gray-600">Total Paid</p>
              <p className="text-xl font-bold" style={{ color: '#1A2B4A' }}>${totalPaid.toLocaleString()}</p>
              <p className="text-xs text-gray-400">{paidPct}% of contract</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-100 p-2.5"><Clock className="h-5 w-5 text-amber-600" /></div>
            <div>
              <p className="text-sm text-gray-600">Remaining</p>
              <p className="text-xl font-bold" style={{ color: '#E8793A' }}>${totalUpcoming.toLocaleString()}</p>
              <p className="text-xs text-gray-400">{Math.round((totalUpcoming / contractAmount) * 100)}% of contract</p>
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
              <p className="text-xl font-bold" style={{ color: '#1A2B4A' }}>${contractAmount.toLocaleString()}</p>
              <p className="text-xs text-gray-400">Active project</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 p-2.5"><TrendingUp className="h-5 w-5 text-blue-600" /></div>
            <div>
              <p className="text-sm text-gray-600">Next Milestone</p>
              <p className="text-sm font-bold" style={{ color: '#1A2B4A' }}>{nextMilestone?.name ?? '—'}</p>
              {nextMilestone && <p className="text-xs text-gray-400">${nextMilestone.amount.toLocaleString()} ({nextMilestone.percentage}%)</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Visual */}
      <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold" style={{ color: '#1A2B4A' }}>7-Milestone Payment Schedule</h2>
          {!isLive && <span className="text-xs text-gray-400">Seed data — sign in to load live data</span>}
        </div>
        <div className="flex items-end gap-2">
          {milestones.map((m) => {
            const cfg = STATUS_CONFIG[m.status]
            const heightPct = m.percentage * 4
            return (
              <div key={m.key} className="flex-1 flex flex-col items-center gap-1.5">
                <span className="text-xs font-semibold" style={{ color: cfg.dotColor }}>${(m.amount / 1000).toFixed(0)}K</span>
                <div className="w-full rounded-t-md transition-all" style={{ height: `${heightPct}px`, backgroundColor: cfg.dotColor, opacity: m.status === 'upcoming' ? 0.4 : 1 }} />
                <div className="text-center">
                  <p className="text-xs font-medium text-gray-700 leading-tight">{m.percentage}%</p>
                  <p className="text-xs text-gray-400 leading-tight mt-0.5" style={{ fontSize: '10px' }}>{m.name.split(' ')[0]}</p>
                </div>
              </div>
            )
          })}
        </div>
        <div className="mt-4 flex gap-4 justify-center">
          {[
            { color: '#38A169', label: 'Paid' },
            { color: '#2ABFBF', label: 'Approved' },
            { color: '#E8793A', label: 'Submitted' },
            { color: '#CBD5E0', label: 'Upcoming' },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-xs text-gray-500">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex gap-6">
          {(['milestones', 'history'] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className="border-b-2 pb-3 text-sm font-medium capitalize"
              style={{ borderColor: activeTab === tab ? '#2ABFBF' : 'transparent', color: activeTab === tab ? '#2ABFBF' : '#6B7280' }}>
              {tab === 'milestones' ? 'Milestone Details' : 'Payment History'}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'milestones' && (
        <div className="space-y-3">
          {milestones.map((m) => {
            const cfg   = STATUS_CONFIG[m.status]
            const isExp = expanded === m.key
            const aState = actionState[m.key] ?? 'idle'
            return (
              <div key={m.key}>
                <button
                  onClick={() => setExpanded(isExp ? null : m.key)}
                  className="w-full text-left rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md"
                >
                  <div className="flex items-center justify-between p-5">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{
                        backgroundColor: m.status === 'paid' ? 'rgba(56,161,105,0.1)' : m.status === 'approved' ? 'rgba(42,191,191,0.1)' : m.status === 'submitted' || m.status === 'in_progress' ? 'rgba(232,121,58,0.1)' : 'rgba(203,213,224,0.3)',
                      }}>
                        {m.status === 'paid'     && <CheckCircle className="h-5 w-5 text-green-600" />}
                        {m.status === 'approved' && <CheckCircle className="h-5 w-5" style={{ color: '#2ABFBF' }} />}
                        {(m.status === 'submitted' || m.status === 'in_progress') && <Clock className="h-5 w-5" style={{ color: '#E8793A' }} />}
                        {m.status === 'upcoming' && <AlertCircle className="h-5 w-5 text-gray-300" />}
                        {m.status === 'rejected' && <XCircle className="h-5 w-5 text-red-400" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-gray-400">#{m.order}</span>
                          <p className="text-sm font-semibold" style={{ color: '#1A2B4A' }}>{m.name}</p>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {m.status === 'paid' && m.paidDate
                            ? `Paid ${new Date(m.paidDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                            : m.dueDate ? `Due ${new Date(m.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                            : 'Scheduled'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-4">
                      <div>
                        <p className="text-sm font-bold" style={{ color: '#E8793A' }}>${m.amount.toLocaleString()}</p>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${cfg.bg} ${cfg.text}`}
                          style={(m.status === 'submitted' || m.status === 'in_progress') ? { backgroundColor: 'rgba(232,121,58,0.1)', color: '#E8793A' } : undefined}
                        >{cfg.label}</span>
                      </div>
                      <span className="text-xs font-medium text-gray-300">{m.percentage}%</span>
                    </div>
                  </div>
                </button>

                {isExp && (
                  <div className="mx-5 mb-3 rounded-b-lg border border-t-0 border-gray-200 bg-gray-50 p-4">
                    {m.description && <p className="text-sm text-gray-600 mb-3">{m.description}</p>}
                    <div className="flex items-center justify-between">
                      <div className="flex gap-4 text-xs text-gray-400">
                        <span>Amount: <strong className="text-gray-600">${m.amount.toLocaleString()}</strong></span>
                        <span>Share: <strong className="text-gray-600">{m.percentage}%</strong></span>
                        {m.id && <span className="font-mono text-gray-300">{m.id.slice(0, 8)}…</span>}
                      </div>
                      {/* Action buttons — only show when live data */}
                      {isLive && (
                        <div className="flex items-center gap-2">
                          {m.canApprove && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleApprove(m) }}
                              disabled={aState === 'loading'}
                              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
                              style={{ backgroundColor: '#2ABFBF' }}
                            >
                              {aState === 'loading' ? 'Approving…' : aState === 'success' ? '✓ Approved' : 'Approve Milestone'}
                            </button>
                          )}
                          {m.canRelease && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleRelease(m) }}
                              disabled={aState === 'loading'}
                              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
                              style={{ backgroundColor: '#38A169' }}
                            >
                              {aState === 'loading' ? 'Releasing…' : aState === 'success' ? '✓ Released' : 'Release Payment'}
                            </button>
                          )}
                          {aState === 'error' && (
                            <span className="text-xs text-red-500">Action failed — try again</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="divide-y divide-gray-50">
            {milestones.filter(m => m.status === 'paid').map((m) => (
              <div key={m.key} className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-green-100 p-2">
                    <ArrowUpRight className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{m.name}</p>
                    <p className="text-xs text-gray-500">
                      {projectName}
                      {m.paidDate && ` — ${new Date(m.paidDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold" style={{ color: '#E8793A' }}>${m.amount.toLocaleString()}</span>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </div>
              </div>
            ))}
            {milestones.filter(m => m.status === 'paid').length === 0 && (
              <div className="p-8 text-center text-sm text-gray-400">No payments recorded yet.</div>
            )}
          </div>
          <div className="border-t border-gray-200 px-5 py-4 flex justify-between items-center">
            <span className="text-sm font-medium text-gray-500">Total Paid</span>
            <span className="text-sm font-bold" style={{ color: '#1A2B4A' }}>${totalPaid.toLocaleString()}</span>
          </div>
        </div>
      )}
    </div>
  )
}
