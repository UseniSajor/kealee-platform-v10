'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, DollarSign, Shield, CheckCircle, Clock, AlertTriangle,
  FileText, TrendingUp, Lock, ChevronRight,
} from 'lucide-react'
import { getEngagement, type EngagementDetail, type MilestoneDto } from '@/lib/api/engagement'

// ─── Status helpers ───────────────────────────────────────────────────────────

const STATUS_META: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  DRAFT:    { label: 'Draft',    color: '#6B7280', bg: '#F9FAFB', icon: <FileText className="h-3.5 w-3.5" /> },
  ACTIVE:   { label: 'Active',   color: '#38A169', bg: '#F0FFF4', icon: <CheckCircle className="h-3.5 w-3.5" /> },
  SIGNED:   { label: 'Signed',   color: '#2ABFBF', bg: '#E6FFFA', icon: <CheckCircle className="h-3.5 w-3.5" /> },
  COMPLETED:{ label: 'Completed',color: '#1A2B4A', bg: '#EBF4FF', icon: <CheckCircle className="h-3.5 w-3.5" /> },
  DISPUTED: { label: 'Disputed', color: '#E8793A', bg: '#FFF5EE', icon: <AlertTriangle className="h-3.5 w-3.5" /> },
  CANCELLED:{ label: 'Cancelled',color: '#E53E3E', bg: '#FFF5F5', icon: <AlertTriangle className="h-3.5 w-3.5" /> },
}

const MILESTONE_STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  PENDING:  { label: 'Pending',  color: '#6B7280', bg: '#F9FAFB' },
  SUBMITTED:{ label: 'Submitted',color: '#2ABFBF', bg: '#E6FFFA' },
  APPROVED: { label: 'Approved', color: '#38A169', bg: '#F0FFF4' },
  PAID:     { label: 'Paid',     color: '#1A2B4A', bg: '#EBF8FF' },
  DISPUTED: { label: 'Disputed', color: '#E8793A', bg: '#FFF5EE' },
}

function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? { label: status, color: '#6B7280', bg: '#F9FAFB', icon: null }
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
      style={{ color: meta.color, backgroundColor: meta.bg }}
    >
      {meta.icon}
      {meta.label}
    </span>
  )
}

// ─── MilestoneRow ─────────────────────────────────────────────────────────────

function MilestoneRow({ m, contractTotal }: { m: MilestoneDto; contractTotal: number }) {
  const meta = MILESTONE_STATUS_META[m.status] ?? MILESTONE_STATUS_META.PENDING
  const pct = contractTotal > 0 ? Math.round((m.amount / contractTotal) * 100) : 0

  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-gray-100 bg-gray-50 p-4">
      <div className="flex items-center gap-4">
        <div
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
          style={{ backgroundColor: meta.color }}
        >
          {m.order}
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: '#1A2B4A' }}>{m.name}</p>
          {m.description && <p className="mt-0.5 text-xs text-gray-500">{m.description}</p>}
          {m.paidAt && (
            <p className="mt-0.5 text-xs text-gray-400">
              Paid {new Date(m.paidAt).toLocaleDateString()}
            </p>
          )}
          {m.approvedAt && !m.paidAt && (
            <p className="mt-0.5 text-xs" style={{ color: '#38A169' }}>
              Approved {new Date(m.approvedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
      <div className="flex flex-shrink-0 items-center gap-4">
        <span className="text-xs text-gray-400">{pct}%</span>
        <div className="text-right">
          <p className="text-sm font-bold" style={{ color: '#1A2B4A' }}>
            ${m.amount.toLocaleString()}
          </p>
          <span
            className="inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold"
            style={{ color: meta.color, backgroundColor: meta.bg }}
          >
            {meta.label}
          </span>
        </div>
      </div>
    </div>
  )
}

// ─── EscrowPanel ──────────────────────────────────────────────────────────────

function EscrowPanel({ escrow }: { escrow: NonNullable<EngagementDetail['escrow']> }) {
  const utilization = escrow.totalContractAmount > 0
    ? Math.round(((escrow.totalContractAmount - escrow.currentBalance) / escrow.totalContractAmount) * 100)
    : 0

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold" style={{ color: '#1A2B4A' }}>
          <Shield className="mr-2 inline h-4 w-4" style={{ color: '#2ABFBF' }} />
          Escrow Account
        </h3>
        <StatusBadge status={escrow.status} />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Total Contract', value: escrow.totalContractAmount, color: '#1A2B4A' },
          { label: 'Current Balance', value: escrow.currentBalance, color: '#2ABFBF' },
          { label: 'Available', value: escrow.availableBalance, color: '#38A169' },
          { label: 'Held Back', value: escrow.heldBalance, color: '#E8793A' },
        ].map(stat => (
          <div key={stat.label} className="text-center">
            <p className="text-lg font-bold" style={{ color: stat.color }}>
              ${stat.value.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <div className="mb-1 flex justify-between text-xs text-gray-500">
          <span>Disbursed</span>
          <span>{utilization}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full"
            style={{ width: `${utilization}%`, backgroundColor: '#2ABFBF' }}
          />
        </div>
        <p className="mt-1 text-xs text-gray-400">
          {escrow.holdbackPercentage}% holdback retained until final completion
        </p>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EngagementDetailPage() {
  const { engagementId } = useParams<{ engagementId: string }>()
  const router = useRouter()
  const [engagement, setEngagement] = useState<EngagementDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!engagementId) return
    setLoading(true)
    getEngagement(engagementId)
      .then(setEngagement)
      .catch(err => setError(err.message ?? 'Failed to load engagement'))
      .finally(() => setLoading(false))
  }, [engagementId])

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-400 border-t-transparent" />
      </div>
    )
  }

  if (error || !engagement) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <AlertTriangle className="h-10 w-10 text-gray-300" />
        <p className="text-gray-500">{error ?? 'Engagement not found'}</p>
        <button onClick={() => router.back()} className="text-sm text-teal-600 underline">
          Go back
        </button>
      </div>
    )
  }

  const completionPct = engagement.amount > 0
    ? Math.round((engagement.paidAmount / engagement.amount) * 100)
    : 0

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      {/* Breadcrumb */}
      <button
        onClick={() => router.back()}
        className="mb-6 flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-gray-800"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Project
      </button>

      {/* Header */}
      <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <StatusBadge status={engagement.status} />
            <h1 className="mt-2 text-2xl font-bold font-display" style={{ color: '#1A2B4A' }}>
              Contractor Agreement
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {engagement.contractorName ?? 'Contractor'} ·{' '}
              {engagement.signedAt
                ? `Signed ${new Date(engagement.signedAt).toLocaleDateString()}`
                : 'Awaiting signature'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold" style={{ color: '#1A2B4A' }}>
              ${engagement.amount.toLocaleString()}
            </p>
            <p className="text-sm text-gray-400">Total contract value</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-gray-600">Payment Progress</span>
            <span className="font-bold" style={{ color: '#38A169' }}>
              ${engagement.paidAmount.toLocaleString()} paid
            </span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${completionPct}%`, backgroundColor: '#38A169' }}
            />
          </div>
          <div className="mt-1 flex justify-between text-xs text-gray-400">
            <span>{completionPct}% complete</span>
            <span>${engagement.pendingAmount.toLocaleString()} remaining</span>
          </div>
        </div>

        {/* Summary stats */}
        <div className="mt-6 grid grid-cols-3 gap-3 border-t border-gray-100 pt-4">
          <div className="text-center">
            <p className="text-lg font-bold" style={{ color: '#1A2B4A' }}>{engagement.milestoneCount}</p>
            <p className="text-xs text-gray-400">Milestones</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold" style={{ color: '#38A169' }}>
              ${engagement.paidAmount.toLocaleString()}
            </p>
            <p className="text-xs text-gray-400">Paid</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold" style={{ color: '#E8793A' }}>
              ${engagement.pendingAmount.toLocaleString()}
            </p>
            <p className="text-xs text-gray-400">Pending</p>
          </div>
        </div>
      </div>

      {/* Escrow Panel */}
      {engagement.escrow && (
        <div className="mb-6">
          <EscrowPanel escrow={engagement.escrow} />
        </div>
      )}

      {/* Milestones */}
      <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-bold" style={{ color: '#1A2B4A' }}>
          <TrendingUp className="mr-2 inline h-5 w-5" style={{ color: '#2ABFBF' }} />
          Milestone Schedule ({engagement.milestones.length})
        </h2>
        <div className="space-y-3">
          {engagement.milestones.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">No milestones defined yet.</p>
          ) : (
            engagement.milestones.map(m => (
              <MilestoneRow key={m.id} m={m} contractTotal={engagement.amount} />
            ))
          )}
        </div>
      </div>

      {/* Disputes */}
      {engagement.disputes.length > 0 && (
        <div className="rounded-2xl border border-orange-200 bg-orange-50 p-6">
          <h2 className="mb-4 text-base font-semibold" style={{ color: '#E8793A' }}>
            <AlertTriangle className="mr-2 inline h-4 w-4" />
            Active Disputes ({engagement.disputes.length})
          </h2>
          <div className="space-y-3">
            {engagement.disputes.map(d => (
              <div
                key={d.id}
                className="flex items-start justify-between rounded-lg border border-orange-200 bg-white p-3"
              >
                <div>
                  <p className="text-sm font-medium text-gray-800">{d.reason}</p>
                  <p className="mt-0.5 text-xs text-gray-400">
                    Opened {new Date(d.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                  style={{ color: '#E8793A', backgroundColor: '#FFF5EE' }}
                >
                  {d.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
