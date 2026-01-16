'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { api, Milestone } from '@/lib/api'
import MilestoneSubmissionForm from '@/components/MilestoneSubmissionForm'
import EvidenceReviewPanel from '@/components/EvidenceReviewPanel'
import PaymentReleasePanel from '@/components/PaymentReleasePanel'
import DisputeInitiationForm from '@/components/DisputeInitiationForm'

type MilestoneDetail = Milestone & {
  contract?: {
    id: string
    projectId: string
    contractor?: { id: string; name: string; email: string } | null
    owner?: { id: string; name: string; email: string } | null
  }
  evidence?: Array<{
    id: string
    type: string
    url: string
    fileName: string | null
    caption: string | null
    createdAt: string
    createdBy?: { id: string; name: string; email: string } | null
  }>
  dependsOn?: { id: string; name: string; status: string } | null
  approvedBy?: { id: string; name: string; email: string } | null
}

export default function MilestoneDetailPage({
  params,
}: {
  params: { id: string; milestoneId: string }
}) {
  const [loading, setLoading] = useState(true)
  const [milestone, setMilestone] = useState<MilestoneDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showSubmissionForm, setShowSubmissionForm] = useState(false)
  const [showDisputeForm, setShowDisputeForm] = useState(false)
  const [approving, setApproving] = useState(false)
  const [rejecting, setRejecting] = useState(false)
  const [requirements, setRequirements] = useState<{
    requiredEvidenceTypes: string[]
    description: string | null
    dependencies: Array<{ id: string; name: string; status: string }>
  } | null>(null)
  const [versionHistory, setVersionHistory] = useState<Array<{
    version: number
    status: string
    submittedAt: string | null
    evidenceCount: number
    commentsCount: number
    rejectedReason?: string | null
  }>>([])

  useEffect(() => {
    loadMilestone()
  }, [params.milestoneId, loadMilestone])

  const loadMilestone = useCallback(async () => {
    try {
      const res = await api.getMilestone(params.milestoneId)
      setMilestone(res.milestone as MilestoneDetail)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load milestone')
    } finally {
      setLoading(false)
    }
  }, [params.milestoneId])

  const handleApprove = useCallback(
    async (reason: string, notes?: string) => {
      if (!milestone) return
      setApproving(true)
      setError(null)

      try {
        await api.approveMilestoneWithReason(milestone.id, reason, notes)
        alert('Milestone approved successfully!')
        await loadMilestone()
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to approve milestone')
        throw e
      } finally {
        setApproving(false)
      }
    },
    [milestone, loadMilestone]
  )

  const handleReject = useCallback(
    async (reason: string) => {
      if (!milestone) return
      setRejecting(true)
      setError(null)

      try {
        await api.rejectMilestoneWithReason(milestone.id, reason)
        alert('Milestone rejected. Contractor will be notified.')
        await loadMilestone()
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to reject milestone')
        throw e
      } finally {
        setRejecting(false)
      }
    },
    [milestone, loadMilestone]
  )

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-4xl px-4 py-6">
        <div>Loading milestone...</div>
      </main>
    )
  }

  if (!milestone) {
    return (
      <main className="mx-auto w-full max-w-4xl px-4 py-6">
        <div className="text-red-600">Milestone not found</div>
      </main>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-neutral-100 text-neutral-700'
      case 'SUBMITTED':
        return 'bg-blue-100 text-blue-700'
      case 'UNDER_REVIEW':
        return 'bg-amber-100 text-amber-700'
      case 'APPROVED':
        return 'bg-green-100 text-green-700'
      case 'PAID':
        return 'bg-purple-100 text-purple-700'
      case 'REJECTED':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-neutral-100 text-neutral-700'
    }
  }

  const isOwner = true // Would be determined from auth context
  const isContractor = false // Would be determined from auth context
  const canSubmit = milestone.status === 'PENDING' && isContractor && (!milestone.dependsOn || milestone.dependsOn.status === 'APPROVED' || milestone.dependsOn.status === 'PAID')
  const canApprove = (milestone.status === 'SUBMITTED' || milestone.status === 'UNDER_REVIEW') && isOwner
  const canReject = (milestone.status === 'SUBMITTED' || milestone.status === 'UNDER_REVIEW') && isOwner

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-6">
      <nav aria-label="Breadcrumb" className="text-sm text-neutral-600">
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link className="underline underline-offset-4" href="/">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link className="underline underline-offset-4" href={`/projects/${params.id}`}>
              Project
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link className="underline underline-offset-4" href={`/projects/${params.id}/milestones`}>
              Milestones
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-neutral-800">Milestone Details</li>
        </ol>
      </nav>

      <header className="mt-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900">{milestone.name}</h1>
            <p className="mt-1 text-sm text-neutral-600">{milestone.description || 'No description'}</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-sm font-medium ${getStatusColor(milestone.status)}`}>
            {milestone.status}
          </span>
        </div>
      </header>

      {error ? (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">
          {error}
        </div>
      ) : null}

      <div className="mt-6 space-y-6">
        {/* Milestone Information */}
        <section className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-neutral-900">Milestone Information</h2>
          <div className="mt-4 space-y-3 text-sm">
            {milestone.amount ? (
              <div>
                <span className="font-medium text-neutral-700">Amount:</span>
                <span className="ml-2 text-neutral-900">
                  ${Number(milestone.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            ) : null}
            {milestone.dueDate ? (
              <div>
                <span className="font-medium text-neutral-700">Due Date:</span>
                <span className="ml-2 text-neutral-900">{new Date(milestone.dueDate).toLocaleDateString()}</span>
              </div>
            ) : null}
            {milestone.submittedAt ? (
              <div>
                <span className="font-medium text-neutral-700">Submitted:</span>
                <span className="ml-2 text-neutral-900">{new Date(milestone.submittedAt).toLocaleDateString()}</span>
              </div>
            ) : null}
            {milestone.approvedAt ? (
              <div>
                <span className="font-medium text-neutral-700">Approved:</span>
                <span className="ml-2 text-neutral-900">
                  {new Date(milestone.approvedAt).toLocaleDateString()} by {milestone.approvedBy?.name || 'Unknown'}
                </span>
              </div>
            ) : null}
            {milestone.paidAt ? (
              <div>
                <span className="font-medium text-neutral-700">Paid:</span>
                <span className="ml-2 text-neutral-900">{new Date(milestone.paidAt).toLocaleDateString()}</span>
              </div>
            ) : null}
            {milestone.dependsOn ? (
              <div>
                <span className="font-medium text-neutral-700">Depends on:</span>
                <span className="ml-2 text-neutral-900">
                  {milestone.dependsOn.name} ({milestone.dependsOn.status})
                </span>
              </div>
            ) : null}
          </div>
        </section>

        {/* Prompt 3.2: Milestone Submission Form */}
        {showSubmissionForm && canSubmit ? (
          <section className="rounded-xl border border-blue-200 bg-blue-50 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-blue-900">Submit Milestone</h2>
            <div className="mt-4">
              <MilestoneSubmissionForm
                milestoneId={milestone.id}
                projectId={params.id}
                onSuccess={() => {
                  setShowSubmissionForm(false)
                  loadMilestone()
                }}
                onCancel={() => setShowSubmissionForm(false)}
              />
            </div>
          </section>
        ) : null}

        {/* Evidence Display */}
        {milestone.evidence && milestone.evidence.length > 0 ? (
          <section className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-neutral-900">Evidence</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {milestone.evidence.map((evidence) => (
                <div key={evidence.id} className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-neutral-700">{evidence.type}</span>
                      <a
                        href={evidence.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 underline underline-offset-4 hover:text-blue-700"
                      >
                        View
                      </a>
                    </div>
                    {evidence.fileName ? (
                      <p className="text-xs text-neutral-600">{evidence.fileName}</p>
                    ) : null}
                    {evidence.caption ? (
                      <p className="text-xs text-neutral-700 italic">{evidence.caption}</p>
                    ) : null}
                    {evidence.createdBy ? (
                      <p className="text-xs text-neutral-500">Uploaded by {evidence.createdBy.name}</p>
                    ) : null}
                    <p className="text-xs text-neutral-500">
                      {new Date(evidence.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {/* Prompt 3.4: Payment Release (One-click approval triggers escrow release) */}
        {milestone.status === 'APPROVED' && milestone.amount ? (
          <section className="mt-6">
            <PaymentReleasePanel
              milestoneId={milestone.id}
              milestoneName={milestone.name}
              milestoneAmount={Number(milestone.amount)}
              onPaymentReleased={loadMilestone}
            />
          </section>
        ) : null}

        {/* Prompt 3.5: Dispute Initiation */}
        {showDisputeForm ? (
          <section className="mt-6 rounded-xl border border-red-200 bg-red-50 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-red-900">File Dispute</h2>
            <div className="mt-4">
              <DisputeInitiationForm
                projectId={params.id}
                milestoneId={milestone.id}
                onSuccess={() => {
                  setShowDisputeForm(false)
                  loadMilestone()
                }}
                onCancel={() => setShowDisputeForm(false)}
              />
            </div>
          </section>
        ) : null}

        {/* Actions */}
        <section className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-neutral-900">Actions</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {canSubmit ? (
              <button
                type="button"
                onClick={() => setShowSubmissionForm(true)}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Submit Milestone
              </button>
            ) : null}
            {(milestone.status === 'SUBMITTED' || milestone.status === 'UNDER_REVIEW' || milestone.status === 'APPROVED') && isOwner ? (
              <button
                type="button"
                onClick={() => setShowDisputeForm(true)}
                className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
              >
                File Dispute
              </button>
            ) : null}
            <Link
              href={`/projects/${params.id}/milestones`}
              className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              Back to Milestones
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}
