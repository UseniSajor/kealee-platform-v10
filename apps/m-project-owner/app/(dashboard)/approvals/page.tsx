'use client'

import { useState, useEffect } from 'react'
import {
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  FileEdit,
  ShieldCheck,
  Sparkles,
  ArrowLeft,
  Loader2,
} from 'lucide-react'
import Link from 'next/link'
import { Card, Badge, Button, Modal, Skeleton } from '@kealee/ui'
import {
  getClientDecisions,
  resolveDecision,
  type ClientDecision,
} from '../../../lib/client-api'
import { supabase } from '../../../lib/supabase'

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ApprovalsPage() {
  const [decisions, setDecisions] = useState<ClientDecision[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'pending' | 'completed'>('pending')

  // Modal state
  const [actionTarget, setActionTarget] = useState<{
    id: string
    action: 'approved' | 'rejected' | 'deferred'
  } | null>(null)
  const [reasoning, setReasoning] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    loadDecisions()
  }, [])

  const loadDecisions = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return
      const result = await getClientDecisions(user.id)
      setDecisions(result.decisions)
    } catch {
      // empty state
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async () => {
    if (!actionTarget) return
    setSubmitting(true)
    try {
      await resolveDecision(actionTarget.id, {
        decision: actionTarget.action,
        reasoning: reasoning || undefined,
      })
      setDecisions((prev) =>
        prev.map((d) =>
          d.id === actionTarget.id
            ? { ...d, decision: actionTarget.action, decidedAt: new Date().toISOString() }
            : d,
        ),
      )
      const verb =
        actionTarget.action === 'approved'
          ? 'approved'
          : actionTarget.action === 'rejected'
            ? 'declined'
            : 'deferred'
      setToast({ message: `Successfully ${verb}!`, type: 'success' })
    } catch {
      setToast({ message: 'Something went wrong. Please try again.', type: 'error' })
    } finally {
      setSubmitting(false)
      setActionTarget(null)
      setReasoning('')
    }
  }

  // Toast auto-dismiss
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast])

  const pending = decisions.filter((d) => !d.decision)
  const completed = decisions.filter((d) => !!d.decision)
  const visible = tab === 'pending' ? pending : completed

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div
          className={`fixed right-4 top-20 z-50 rounded-lg px-4 py-3 text-sm font-medium shadow-lg ${
            toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Confirmation modal */}
      <Modal
        isOpen={!!actionTarget}
        onClose={() => {
          setActionTarget(null)
          setReasoning('')
        }}
        title={
          actionTarget?.action === 'approved'
            ? 'Confirm Approval'
            : actionTarget?.action === 'rejected'
              ? 'Confirm Decline'
              : 'Defer Decision'
        }
        size="md"
      >
        <p className="mb-4 text-sm text-gray-600">
          {actionTarget?.action === 'approved'
            ? 'Are you sure you want to approve this? Funds will be released to the contractor.'
            : actionTarget?.action === 'rejected'
              ? 'Are you sure you want to decline this? The contractor will be notified.'
              : 'This decision will be moved back to your queue for later.'}
        </p>

        <label className="mb-1 block text-sm font-medium text-gray-700">
          Notes (optional)
        </label>
        <textarea
          value={reasoning}
          onChange={(e) => setReasoning(e.target.value)}
          rows={3}
          className="mb-6 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Add a note for your records..."
        />

        <div className="flex justify-end gap-3">
          <Button
            variant="secondary"
            onClick={() => {
              setActionTarget(null)
              setReasoning('')
            }}
          >
            Cancel
          </Button>
          <Button
            variant={actionTarget?.action === 'rejected' ? 'danger' : 'primary'}
            isLoading={submitting}
            onClick={handleAction}
          >
            {actionTarget?.action === 'approved'
              ? 'Yes, Approve'
              : actionTarget?.action === 'rejected'
                ? 'Yes, Decline'
                : 'Defer'}
          </Button>
        </div>
      </Modal>

      {/* Header */}
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="mb-3 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Approvals</h1>
        <p className="mt-1 text-sm text-gray-500">
          Review and approve payments, change orders, and other items.
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-lg bg-gray-100 p-1">
        <button
          onClick={() => setTab('pending')}
          className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
            tab === 'pending'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Pending {pending.length > 0 && `(${pending.length})`}
        </button>
        <button
          onClick={() => setTab('completed')}
          className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
            tab === 'completed'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Completed {completed.length > 0 && `(${completed.length})`}
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rounded" height={140} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && visible.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <CheckCircle2 className="mb-3 h-10 w-10 text-gray-300" />
          <p className="font-medium text-gray-700">
            {tab === 'pending' ? "You're all caught up!" : 'No completed approvals yet.'}
          </p>
          <p className="mt-1 text-sm text-gray-400">
            {tab === 'pending'
              ? 'There are no items needing your attention right now.'
              : 'Approved items will appear here.'}
          </p>
        </div>
      )}

      {/* Decision cards */}
      {!loading && (
        <div className="space-y-4">
          {visible.map((d) => (
            <DecisionCard
              key={d.id}
              decision={d}
              onApprove={() => setActionTarget({ id: d.id, action: 'approved' })}
              onDecline={() => setActionTarget({ id: d.id, action: 'rejected' })}
              onDefer={() => setActionTarget({ id: d.id, action: 'deferred' })}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Decision Card
// ---------------------------------------------------------------------------

function DecisionCard({
  decision,
  onApprove,
  onDecline,
  onDefer,
}: {
  decision: ClientDecision
  onApprove: () => void
  onDecline: () => void
  onDefer: () => void
}) {
  const ctx = decision.context as any
  const isResolved = !!decision.decision
  const amount = ctx?.amount
  const milestoneName = ctx?.milestoneName
  const inspectionPassed = ctx?.inspectionPassed
  const costImpact = ctx?.costImpact
  const aiRec = ctx?.aiRecommendation

  const typeIcons: Record<string, typeof DollarSign> = {
    payment_release: DollarSign,
    change_order: FileEdit,
    bid_award: ShieldCheck,
    schedule_change: Clock,
  }
  const TypeIcon = typeIcons[decision.type] ?? Clock

  const typeLabels: Record<string, string> = {
    payment_release: 'Payment Release',
    change_order: 'Change Order',
    bid_award: 'Bid Award',
    schedule_change: 'Schedule Change',
  }

  const decisionBadge: Record<string, { variant: 'success' | 'error' | 'warning'; label: string }> = {
    approved: { variant: 'success', label: 'Approved' },
    rejected: { variant: 'error', label: 'Declined' },
    deferred: { variant: 'warning', label: 'Deferred' },
  }

  return (
    <Card id={decision.id} className="overflow-hidden">
      <div className="p-5">
        {/* Header */}
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50">
              <TypeIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">{decision.title}</p>
              <p className="text-xs text-gray-500">
                {typeLabels[decision.type] ?? decision.type} &middot;{' '}
                {new Date(decision.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          {isResolved && decision.decision && decisionBadge[decision.decision] && (
            <Badge
              variant={decisionBadge[decision.decision].variant}
              size="sm"
            >
              {decisionBadge[decision.decision].label}
            </Badge>
          )}
        </div>

        {/* Context details */}
        <div className="mb-4 space-y-2 rounded-lg bg-gray-50 p-3">
          {milestoneName && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Milestone</span>
              <span className="font-medium text-gray-900">{milestoneName}</span>
            </div>
          )}
          {amount && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Amount</span>
              <span className="font-medium text-gray-900">
                ${Number(amount).toLocaleString()}
              </span>
            </div>
          )}
          {costImpact !== undefined && costImpact !== null && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Cost Impact</span>
              <span
                className={`font-medium ${
                  costImpact > 0 ? 'text-red-600' : costImpact < 0 ? 'text-green-600' : 'text-gray-900'
                }`}
              >
                {costImpact > 0 ? '+' : ''}${Number(costImpact).toLocaleString()}
              </span>
            </div>
          )}
          {inspectionPassed !== undefined && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Inspection</span>
              <span
                className={`flex items-center gap-1 font-medium ${
                  inspectionPassed ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {inspectionPassed ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" /> Passed
                  </>
                ) : (
                  <>
                    <XCircle className="h-3.5 w-3.5" /> Not passed
                  </>
                )}
              </span>
            </div>
          )}
        </div>

        {/* AI recommendation */}
        {aiRec && (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-purple-100 bg-purple-50 p-3">
            <Sparkles className="mt-0.5 h-4 w-4 flex-shrink-0 text-purple-500" />
            <p className="text-sm text-purple-800">{aiRec}</p>
          </div>
        )}

        {/* Resolved info */}
        {isResolved && decision.reasoning && (
          <p className="mb-4 text-sm italic text-gray-500">
            &ldquo;{decision.reasoning}&rdquo;
          </p>
        )}

        {/* Action buttons (only for pending) */}
        {!isResolved && (
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="primary" size="sm" onClick={onApprove}>
              Approve
            </Button>
            <Button variant="danger" size="sm" onClick={onDecline}>
              Decline
            </Button>
            <Button variant="ghost" size="sm" onClick={onDefer}>
              Decide Later
            </Button>
          </div>
        )}

        {isResolved && decision.decidedAt && (
          <p className="text-xs text-gray-400">
            Resolved on {new Date(decision.decidedAt).toLocaleDateString()}
          </p>
        )}
      </div>
    </Card>
  )
}
