'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { api, Contract } from '@/lib/api'

type MilestoneStatistics = {
  total: number
  completed: number
  submitted: number
  underReview: number
  pending: number
  totalAmount: number
  paidAmount: number
  progressPercentage: number
  paymentProgress: number
  upcomingMilestones: Array<{
    id: string
    name: string
    dueDate: string
    daysUntilDue: number | null
  }>
}

export default function MilestonesPage({ params }: { params: { id: string; contractId?: string } }) {
  const [loading, setLoading] = useState(true)
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [statistics, setStatistics] = useState<MilestoneStatistics | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [contractId, setContractId] = useState<string | null>(null)

  useEffect(() => {
    // Get contract ID from URL or load from project
    if (params.contractId) {
      setContractId(params.contractId)
    } else {
      // Load first active contract for this project
      loadContract()
    }
  }, [params.id, params.contractId])

  useEffect(() => {
    if (contractId) {
      loadMilestones()
    }
  }, [contractId])

  const loadContract = useCallback(async () => {
    try {
      const res = await api.listProjectContracts(params.id)
      const activeContract = res.contracts.find((c: Contract) => c.status === 'ACTIVE' || c.status === 'SIGNED')
      if (activeContract) {
        setContractId(activeContract.id)
      }
    } catch (e: unknown) {
      console.error('Failed to load contract:', e)
    }
  }, [params.id])

  const loadMilestones = useCallback(async () => {
    if (!contractId) return
    setLoading(true)
    setError(null)
    try {
      const res = await api.getContractMilestones(contractId)
      setMilestones(res.milestones || [])
      setStatistics(res.statistics || null)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load milestones')
    } finally {
      setLoading(false)
    }
  }, [contractId])

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

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-6">
        <div>Loading milestones...</div>
      </main>
    )
  }

  if (!contractId) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-6">
        <div className="rounded-xl border border-neutral-200 bg-white p-12 text-center shadow-sm">
          <p className="text-neutral-600">No active contract found for this project</p>
          <Link
            href={`/projects/${params.id}/contracts/new`}
            className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Create Contract
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6">
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
          <li className="text-neutral-800">Milestones</li>
        </ol>
      </nav>

      <header className="mt-4">
        <h1 className="text-2xl font-semibold text-neutral-900">Milestone Dashboard</h1>
        <p className="mt-1 text-sm text-neutral-600">Track progress and manage project milestones</p>
      </header>

      {error ? (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">
          {error}
        </div>
      ) : null}

      {/* Prompt 3.1: Progress Statistics */}
      {statistics ? (
        <section className="mt-6 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-neutral-900">Progress Overview</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
              <p className="text-sm font-medium text-neutral-600">Completion</p>
              <p className="mt-1 text-2xl font-bold text-neutral-900">
                {statistics.progressPercentage}%
              </p>
              <p className="mt-1 text-xs text-neutral-600">
                {statistics.completed} of {statistics.total} milestones
              </p>
              {/* Progress bar */}
              <div className="mt-3 h-2 w-full rounded-full bg-neutral-200">
                <div
                  className="h-2 rounded-full bg-blue-600"
                  style={{ width: `${statistics.progressPercentage}%` }}
                />
              </div>
            </div>
            <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
              <p className="text-sm font-medium text-neutral-600">Payment Progress</p>
              <p className="mt-1 text-2xl font-bold text-neutral-900">
                {statistics.paymentProgress}%
              </p>
              <p className="mt-1 text-xs text-neutral-600">
                ${Number(statistics.paidAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} of ${Number(statistics.totalAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <div className="mt-3 h-2 w-full rounded-full bg-neutral-200">
                <div
                  className="h-2 rounded-full bg-green-600"
                  style={{ width: `${statistics.paymentProgress}%` }}
                />
              </div>
            </div>
            <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
              <p className="text-sm font-medium text-neutral-600">Pending</p>
              <p className="mt-1 text-2xl font-bold text-neutral-900">{statistics.pending}</p>
              <p className="mt-1 text-xs text-neutral-600">Awaiting submission</p>
            </div>
            <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
              <p className="text-sm font-medium text-neutral-600">In Review</p>
              <p className="mt-1 text-2xl font-bold text-amber-700">{statistics.underReview + statistics.submitted}</p>
              <p className="mt-1 text-xs text-neutral-600">Awaiting approval</p>
            </div>
          </div>
        </section>
      ) : null}

      {/* Prompt 3.1: Upcoming Milestone Alerts */}
      {statistics && statistics.upcomingMilestones.length > 0 ? (
        <section className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-amber-900">⚠️ Upcoming Milestones</h2>
          <div className="mt-4 space-y-2">
            {statistics.upcomingMilestones.map((milestone) => (
              <div key={milestone.id} className="flex items-center justify-between rounded-lg border border-amber-200 bg-white p-3">
                <div>
                  <p className="font-medium text-neutral-900">{milestone.name}</p>
                  <p className="text-sm text-neutral-600">
                    Due in {milestone.daysUntilDue} day{milestone.daysUntilDue !== 1 ? 's' : ''} ({new Date(milestone.dueDate).toLocaleDateString()})
                  </p>
                </div>
                <Link
                  href={`/projects/${params.id}/milestones/${milestone.id}`}
                  className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
                >
                  View Details
                </Link>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* Prompt 3.1: Visual Timeline of All Milestones */}
      <section className="mt-6 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-neutral-900">Milestone Timeline</h2>
        <div className="mt-6">
          {milestones.length === 0 ? (
            <div className="py-12 text-center text-neutral-600">No milestones defined</div>
          ) : (
            <div className="space-y-4">
              {milestones.map((milestone, index) => (
                <div
                  key={milestone.id}
                  className="relative flex flex-col gap-4 rounded-lg border border-neutral-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center"
                >
                  {/* Timeline connector */}
                  {index < milestones.length - 1 ? (
                    <div className="absolute left-8 top-16 hidden h-full w-0.5 bg-neutral-300 sm:block" />
                  ) : null}

                  {/* Milestone number */}
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-neutral-300 bg-white text-lg font-bold text-neutral-700">
                    {index + 1}
                  </div>

                  {/* Milestone details */}
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-lg font-semibold text-neutral-900">{milestone.name}</h3>
                      <span className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(milestone.status)}`}>
                        {milestone.status}
                      </span>
                      {milestone.blockedBy ? (
                        <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700">
                          ⚠️ Blocked by: {milestone.blockedBy.name}
                        </span>
                      ) : null}
                      {!milestone.canSubmit && milestone.dependsOn ? (
                        <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">
                          ⏳ Waiting for: {milestone.dependsOn.name}
                        </span>
                      ) : null}
                    </div>
                    {milestone.description ? (
                      <p className="mt-1 text-sm text-neutral-600">{milestone.description}</p>
                    ) : null}
                    <div className="mt-2 flex flex-wrap gap-4 text-sm text-neutral-600">
                      {milestone.amount ? (
                        <span>
                          Amount: <strong className="text-neutral-900">${Number(milestone.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                        </span>
                      ) : null}
                      {milestone.dueDate ? (
                        <span>
                          Due: <strong className="text-neutral-900">{new Date(milestone.dueDate).toLocaleDateString()}</strong>
                        </span>
                      ) : null}
                      {milestone.submittedAt ? (
                        <span>
                          Submitted: <strong className="text-neutral-900">{new Date(milestone.submittedAt).toLocaleDateString()}</strong>
                        </span>
                      ) : null}
                      {milestone.approvedAt ? (
                        <span>
                          Approved: <strong className="text-neutral-900">{new Date(milestone.approvedAt).toLocaleDateString()}</strong>
                        </span>
                      ) : null}
                      {milestone.paidAt ? (
                        <span>
                          Paid: <strong className="text-neutral-900">{new Date(milestone.paidAt).toLocaleDateString()}</strong>
                        </span>
                      ) : null}
                      {milestone.evidence && milestone.evidence.length > 0 ? (
                        <span>
                          Evidence: <strong className="text-neutral-900">{milestone.evidence.length} file{milestone.evidence.length !== 1 ? 's' : ''}</strong>
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 gap-2">
                    <Link
                      href={`/projects/${params.id}/milestones/${milestone.id}`}
                      className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
