'use client'

import { useCallback, useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { api } from '@owner/lib/api'

type Evidence = {
  id: string
  type: string
  url: string
  fileName: string | null
  caption: string | null
  createdAt: string
  createdBy?: { id: string; name: string; email: string } | null
}

type Comment = {
  id: string
  milestoneId: string
  evidenceId?: string | null
  comment: string
  mentions?: string[]
  createdBy: { id: string; name: string; email: string }
  createdAt: string
  resolved: boolean
}

type EvidenceReviewPanelProps = {
  milestoneId: string
  projectId: string
  evidence: Evidence[]
  requirements: {
    requiredEvidenceTypes: string[]
    description: string | null
  }
  onApprove: (reason: string, notes?: string) => Promise<void>
  onReject: (reason: string) => Promise<void>
}

export default function EvidenceReviewPanel({
  milestoneId,
  projectId,
  evidence,
  requirements,
  onApprove,
  onReject,
}: EvidenceReviewPanelProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [selectedEvidenceId, setSelectedEvidenceId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [approving, setApproving] = useState(false)
  const [rejecting, setRejecting] = useState(false)
  const [approvalReason, setApprovalReason] = useState('')
  const [approvalNotes, setApprovalNotes] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [permitCompliance, setPermitCompliance] = useState<{
    compliant: boolean
    reasons: string[]
    permits: Array<{
      id: string
      permitNumber: string
      status: string
      expiresAt: string | null
      type: string
    }>
    expiredPermits: Array<{ id: string; permitNumber: string; status: string; expiresAt: string | null }>
    invalidPermits: Array<{ id: string; permitNumber: string; status: string }>
  } | null>(null)
  const commentInputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    loadComments()
    loadPermitCompliance()
  }, [milestoneId, loadComments, loadPermitCompliance])

  const loadPermitCompliance = useCallback(async () => {
    try {
      const res = await api.checkPermitCompliance(projectId, milestoneId)
      setPermitCompliance(res)
    } catch (e: unknown) {
      console.error('Failed to load permit compliance:', e)
      // Don't block if permit check fails (permits may not be set up yet)
      setPermitCompliance({ compliant: true, reasons: [], permits: [], expiredPermits: [], invalidPermits: [] })
    }
  }, [projectId, milestoneId])

  const loadComments = useCallback(async () => {
    try {
      const res = await api.getMilestoneComments(milestoneId)
      setComments(res.comments || [])
    } catch (e: unknown) {
      console.error('Failed to load comments:', e)
    }
  }, [milestoneId])

  // Prompt 3.3: Commenting system with @mentions
  const handleAddComment = useCallback(async () => {
    if (!newComment.trim()) return

    setLoading(true)
    try {
      // Extract mentions from comment
      const mentionPattern = /@(\w+)/g
      const mentions: string[] = []
      let match
      while ((match = mentionPattern.exec(newComment)) !== null) {
        mentions.push(match[1])
      }

      await api.addMilestoneComment(milestoneId, {
        comment: newComment,
        evidenceId: selectedEvidenceId,
        mentions,
      })
      setNewComment('')
      setSelectedEvidenceId(null)
      await loadComments()
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to add comment')
    } finally {
      setLoading(false)
    }
  }, [newComment, milestoneId, selectedEvidenceId, loadComments])

  const handleApprove = useCallback(async () => {
    if (!approvalReason.trim()) {
      alert('Please provide a reason for approval')
      return
    }

    // Prompt 3.6: Check permit compliance before approval
    if (permitCompliance && !permitCompliance.compliant) {
      const reasons = permitCompliance.reasons.join('\n')
      const proceed = confirm(
        `Permit compliance issues detected:\n\n${reasons}\n\nDo you want to proceed with approval anyway?`
      )
      if (!proceed) return
    }

    setApproving(true)
    try {
      await onApprove(approvalReason, approvalNotes || undefined)
      setApprovalReason('')
      setApprovalNotes('')
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to approve milestone')
    } finally {
      setApproving(false)
    }
  }, [approvalReason, approvalNotes, onApprove, permitCompliance])

  const handleReject = useCallback(async () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection')
      return
    }

    setRejecting(true)
    try {
      await onReject(rejectionReason)
      setRejectionReason('')
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to reject milestone')
    } finally {
      setRejecting(false)
    }
  }, [rejectionReason, onReject])

  // Check if requirements are met
  const evidenceTypes = evidence.map((e) => e.type)
  const missingTypes = requirements.requiredEvidenceTypes.filter(
    (type) => !evidenceTypes.includes(type)
  )
  const requirementsMet = missingTypes.length === 0

  return (
    <div className="space-y-6">
      {/* Prompt 3.6: Show permit status in approval interface */}
      {permitCompliance && permitCompliance.permits.length > 0 ? (
        <div className={`rounded-xl border p-6 ${
          permitCompliance.compliant
            ? 'border-green-200 bg-green-50'
            : 'border-red-200 bg-red-50'
        }`}>
          <h3 className="text-lg font-semibold text-neutral-900">Permit Status</h3>
          <div className="mt-4 space-y-3">
            {permitCompliance.compliant ? (
              <div className="rounded-lg border border-green-300 bg-white p-3">
                <p className="text-sm font-medium text-green-900">✓ All permits are valid</p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="rounded-lg border border-red-300 bg-white p-3">
                  <p className="text-sm font-medium text-red-900">⚠ Permit compliance issues</p>
                  <ul className="mt-2 list-disc list-inside space-y-1 text-xs text-red-800">
                    {permitCompliance.reasons.map((reason, idx) => (
                      <li key={idx}>{reason}</li>
                    ))}
                  </ul>
                </div>
                {permitCompliance.expiredPermits.length > 0 ? (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <p className="text-xs font-medium text-amber-900">Expired Permits:</p>
                    <ul className="mt-1 space-y-1">
                      {permitCompliance.expiredPermits.map((permit) => (
                        <li key={permit.id} className="text-xs text-amber-800">
                          {permit.permitNumber} - Expired: {permit.expiresAt ? new Date(permit.expiresAt).toLocaleDateString() : 'Unknown'}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {permitCompliance.invalidPermits.length > 0 ? (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <p className="text-xs font-medium text-amber-900">Invalid Permits:</p>
                    <ul className="mt-1 space-y-1">
                      {permitCompliance.invalidPermits.map((permit) => (
                        <li key={permit.id} className="text-xs text-amber-800">
                          {permit.permitNumber} - Status: {permit.status}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            )}
            {/* Prompt 3.6: Link to permit details for resolution */}
            <div className="flex justify-end">
              <Link
                href={`/owner/projects/${projectId}/permits`}
                className="text-xs text-blue-600 underline underline-offset-4 hover:text-blue-700"
              >
                View Permit Details →
              </Link>
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Prompt 3.3: Side-by-side comparison with requirements */}
        <div className="space-y-4">
        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-neutral-900">Requirements</h3>
          <div className="mt-4 space-y-3">
            {requirements.description ? (
              <div>
                <p className="text-sm font-medium text-neutral-700">Description:</p>
                <p className="mt-1 text-sm text-neutral-600">{requirements.description}</p>
              </div>
            ) : null}
            <div>
              <p className="text-sm font-medium text-neutral-700">Required Evidence Types:</p>
              <ul className="mt-2 space-y-1">
                {requirements.requiredEvidenceTypes.map((type) => {
                  const hasType = evidenceTypes.includes(type)
                  return (
                    <li key={type} className="flex items-center gap-2 text-sm">
                      {hasType ? (
                        <span className="text-green-600">✓</span>
                      ) : (
                        <span className="text-red-600">✗</span>
                      )}
                      <span className={hasType ? 'text-neutral-900' : 'text-neutral-600'}>
                        {type}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </div>
            {missingTypes.length > 0 ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                <p className="text-sm font-medium text-amber-900">Missing Evidence Types:</p>
                <ul className="mt-1 list-disc list-inside text-sm text-amber-800">
                  {missingTypes.map((type) => (
                    <li key={type}>{type}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            <div
              className={`rounded-lg border p-3 ${
                requirementsMet
                  ? 'border-green-200 bg-green-50'
                  : 'border-amber-200 bg-amber-50'
              }`}
            >
              <p
                className={`text-sm font-medium ${
                  requirementsMet ? 'text-green-900' : 'text-amber-900'
                }`}
              >
                {requirementsMet ? '✓ All requirements met' : '⚠ Some requirements missing'}
              </p>
            </div>
          </div>
        </div>

        {/* Prompt 3.3: Approval/Rejection with reason required */}
        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-neutral-900">Review Actions</h3>
          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700">
                Approval Reason <span className="text-red-600">*</span>
              </label>
              <textarea
                value={approvalReason}
                onChange={(e) => setApprovalReason(e.target.value)}
                rows={3}
                placeholder="Why are you approving this milestone?"
                className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700">Approval Notes (optional)</label>
              <textarea
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                rows={2}
                placeholder="Additional notes..."
                className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              />
            </div>
            <button
              type="button"
              onClick={handleApprove}
              disabled={approving || !approvalReason.trim()}
              className="w-full rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              {approving ? 'Approving...' : 'Approve Milestone'}
            </button>

            <div className="border-t border-neutral-200 pt-4">
              <label className="block text-sm font-medium text-neutral-700">
                Rejection Reason <span className="text-red-600">*</span>
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                placeholder="Why are you rejecting this milestone?"
                className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={handleReject}
                disabled={rejecting || !rejectionReason.trim()}
                className="mt-2 w-full rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
              >
                {rejecting ? 'Rejecting...' : 'Reject Milestone'}
              </button>
            </div>
          </div>
        </div>
        </div>

        {/* Evidence and Comments */}
        <div className="space-y-4">
        {/* Evidence Display */}
        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-neutral-900">Submitted Evidence</h3>
          <div className="mt-4 space-y-3">
            {evidence.length === 0 ? (
              <p className="text-sm text-neutral-600">No evidence submitted</p>
            ) : (
              evidence.map((ev) => (
                <div
                  key={ev.id}
                  className={`rounded-lg border p-3 ${
                    selectedEvidenceId === ev.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-neutral-200 bg-neutral-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-neutral-900">{ev.type}</span>
                        {ev.fileName ? (
                          <span className="text-xs text-neutral-600">{ev.fileName}</span>
                        ) : null}
                      </div>
                      {ev.caption ? (
                        <p className="mt-1 text-xs text-neutral-600 italic">{ev.caption}</p>
                      ) : null}
                      <a
                        href={ev.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 text-xs text-blue-600 underline underline-offset-4 hover:text-blue-700"
                      >
                        View Evidence
                      </a>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedEvidenceId(selectedEvidenceId === ev.id ? null : ev.id)}
                      className="rounded-lg border border-neutral-300 px-2 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                    >
                      {selectedEvidenceId === ev.id ? 'Selected' : 'Select'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Prompt 3.3: Commenting system with @mentions */}
        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-neutral-900">Comments</h3>
          <div className="mt-4">
            <textarea
              ref={commentInputRef}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  handleAddComment()
                }
              }}
              rows={3}
              placeholder="Add a comment... Use @username to mention someone"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            />
            {selectedEvidenceId ? (
              <p className="mt-1 text-xs text-neutral-600">
                Commenting on selected evidence
              </p>
            ) : null}
            <div className="mt-2 flex justify-end">
              <button
                type="button"
                onClick={handleAddComment}
                disabled={loading || !newComment.trim()}
                className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Adding...' : 'Add Comment'}
              </button>
            </div>
          </div>

          {/* Comments List */}
          <div className="mt-4 space-y-3">
            {comments.length === 0 ? (
              <p className="text-sm text-neutral-600">No comments yet</p>
            ) : (
              comments.map((comment) => (
                <div
                  key={comment.id}
                  className="rounded-lg border border-neutral-200 bg-neutral-50 p-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-neutral-900">
                          {comment.createdBy.name}
                        </span>
                        <span className="text-xs text-neutral-500">
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-neutral-700 whitespace-pre-wrap">
                        {comment.comment.split(/(@\w+)/g).map((part, idx) => {
                          if (part.startsWith('@')) {
                            return (
                              <span key={idx} className="font-medium text-blue-600">
                                {part}
                              </span>
                            )
                          }
                          return <span key={idx}>{part}</span>
                        })}
                      </p>
                      {comment.evidenceId ? (
                        <p className="mt-1 text-xs text-neutral-500">
                          Re: Evidence {comment.evidenceId.slice(0, 8)}
                        </p>
                      ) : null}
                      {comment.mentions && comment.mentions.length > 0 ? (
                        <p className="mt-1 text-xs text-blue-600">
                          Mentions: {comment.mentions.join(', ')}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}
