'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { api } from '@owner/lib/api'

type CloseoutItem = {
  id: string
  type: string
  title: string
  description: string | null
  required: boolean
  status: string
  order: number
  completedAt: string | null
  notes: string | null
  attachments: Array<{
    id: string
    url: string
    fileName: string | null
    description: string | null
  }>
  completedByUser?: { id: string; name: string; email: string } | null
}

type CloseoutChecklist = {
  id: string
  projectId: string
  status: string
  completedAt: string | null
  items: CloseoutItem[]
}

export default function CloseoutPage({
  params,
}: {
  params: { id: string }
}) {
  const [loading, setLoading] = useState(true)
  const [checklist, setChecklist] = useState<CloseoutChecklist | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [completing, setCompleting] = useState(false)

  useEffect(() => {
    loadChecklist()
  }, [params.id])

  const loadChecklist = useCallback(async () => {
    try {
      const res = await api.getCloseoutChecklist(params.id)
      setChecklist(res.checklist)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load closeout checklist')
    } finally {
      setLoading(false)
    }
  }, [params.id])

  const handleItemToggle = useCallback(
    async (itemId: string, currentStatus: string) => {
      const newStatus = currentStatus === 'COMPLETED' ? 'PENDING' : 'COMPLETED'
      try {
        await api.updateCloseoutItem(itemId, {
          status: newStatus,
          completed: newStatus === 'COMPLETED',
        })
        await loadChecklist()
      } catch (e: unknown) {
        alert(e instanceof Error ? e.message : 'Failed to update item')
      }
    },
    [loadChecklist]
  )

  const handleCompleteCloseout = useCallback(async () => {
    if (!checklist) return

    const incompleteItems = checklist.items.filter(
      (item) => item.required && item.status !== 'COMPLETED'
    )
    if (incompleteItems.length > 0) {
      alert(
        `Please complete all required items before completing closeout.\n\nIncomplete: ${incompleteItems.map((i) => i.title).join(', ')}`
      )
      return
    }

    const confirmed = confirm(
      'Complete project closeout? This will mark the project as COMPLETED and trigger final handoff.'
    )
    if (!confirmed) return

    setCompleting(true)
    try {
      await api.completeCloseout(params.id)
      alert('Project closeout completed successfully!')
      await loadChecklist()
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to complete closeout')
    } finally {
      setCompleting(false)
    }
  }, [checklist, params.id, loadChecklist])

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-4xl px-4 py-6">
        <div>Loading closeout checklist...</div>
      </main>
    )
  }

  if (!checklist) {
    return (
      <main className="mx-auto w-full max-w-4xl px-4 py-6">
        <div className="text-red-600">Failed to load closeout checklist</div>
      </main>
    )
  }

  const completedCount = checklist.items.filter((item) => item.status === 'COMPLETED').length
  const requiredCount = checklist.items.filter((item) => item.required).length
  const requiredCompleted = checklist.items.filter(
    (item) => item.required && item.status === 'COMPLETED'
  ).length
  const allRequiredComplete = requiredCompleted === requiredCount

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
            <Link className="underline underline-offset-4" href={`/owner/projects/${params.id}`}>
              Project
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-neutral-800">Closeout Checklist</li>
        </ol>
      </nav>

      <header className="mt-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900">Project Closeout Checklist</h1>
            <p className="mt-1 text-sm text-neutral-600">
              Complete all required items to finalize your project
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-neutral-700">
              {completedCount} / {checklist.items.length} items completed
            </div>
            <div className="text-xs text-neutral-600">
              {requiredCompleted} / {requiredCount} required
            </div>
          </div>
        </div>
      </header>

      {error ? (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">
          {error}
        </div>
      ) : null}

      {/* Progress Bar */}
      <div className="mt-6">
        <div className="h-2 w-full rounded-full bg-neutral-200">
          <div
            className="h-2 rounded-full bg-green-600 transition-all"
            style={{ width: `${(completedCount / checklist.items.length) * 100}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-neutral-600">
          {Math.round((completedCount / checklist.items.length) * 100)}% complete
        </p>
      </div>

      {/* Closeout Items */}
      <div className="mt-6 space-y-4">
        {checklist.items.map((item) => {
          const isCompleted = item.status === 'COMPLETED'
          return (
            <div
              key={item.id}
              className={`rounded-xl border p-6 ${
                isCompleted
                  ? 'border-green-200 bg-green-50'
                  : item.required
                    ? 'border-neutral-200 bg-white'
                    : 'border-neutral-200 bg-neutral-50'
              }`}
            >
              <div className="flex items-start gap-4">
                <button
                  type="button"
                  onClick={() => handleItemToggle(item.id, item.status)}
                  className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded border-2 transition-colors ${
                    isCompleted
                      ? 'border-green-600 bg-green-600'
                      : 'border-neutral-300 bg-white hover:border-green-600'
                  }`}
                >
                  {isCompleted ? (
                    <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : null}
                </button>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-neutral-900">
                        {item.title}
                        {item.required ? (
                          <span className="ml-2 text-xs font-normal text-red-600">* Required</span>
                        ) : null}
                      </h3>
                      {item.description ? (
                        <p className="mt-1 text-sm text-neutral-600">{item.description}</p>
                      ) : null}
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        isCompleted
                          ? 'bg-green-100 text-green-700'
                          : item.status === 'IN_PROGRESS'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-neutral-100 text-neutral-700'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  {/* Attachments */}
                  {item.attachments && item.attachments.length > 0 ? (
                    <div className="mt-3">
                      <p className="text-xs font-medium text-neutral-700">Attachments:</p>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {item.attachments.map((attachment) => (
                          <a
                            key={attachment.id}
                            href={attachment.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 underline underline-offset-4 hover:text-blue-700"
                          >
                            {attachment.fileName || 'View File'}
                          </a>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {/* Special Actions for Specific Item Types */}
                  {item.type === 'FINAL_PAYMENT' && item.status !== 'COMPLETED' ? (
                    <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
                      <p className="text-xs font-medium text-blue-900">
                        Final payment will be automatically released when closeout is completed.
                      </p>
                    </div>
                  ) : null}
                  {item.type === 'PUNCH_LIST' ? (
                    <div className="mt-3">
                      <Link
                        href={`/owner/projects/${params.id}/punch-list`}
                        className="text-xs text-blue-600 underline underline-offset-4 hover:text-blue-700"
                      >
                        Manage Punch List →
                      </Link>
                    </div>
                  ) : null}

                  {/* Completion Info */}
                  {isCompleted && item.completedAt ? (
                    <div className="mt-2 text-xs text-neutral-500">
                      Completed: {new Date(item.completedAt).toLocaleDateString()}
                      {item.completedByUser ? ` by ${item.completedByUser.name}` : null}
                    </div>
                  ) : null}

                  {/* Notes */}
                  {item.notes ? (
                    <div className="mt-2 rounded-lg border border-neutral-200 bg-neutral-50 p-2">
                      <p className="text-xs text-neutral-700">{item.notes}</p>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Complete Closeout Button */}
      {allRequiredComplete && checklist.status !== 'completed' ? (
        <div className="mt-8 rounded-xl border border-green-200 bg-green-50 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-green-900">All Required Items Complete</h3>
              <p className="mt-1 text-sm text-green-800">
                You can now complete the project closeout and trigger final handoff.
              </p>
            </div>
            <button
              type="button"
              onClick={handleCompleteCloseout}
              disabled={completing}
              className="rounded-lg bg-green-600 px-6 py-3 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
            >
              {completing ? 'Completing...' : 'Complete Closeout'}
            </button>
          </div>
        </div>
      ) : null}

      {/* Handoff Package Link (Prompt 3.8) */}
      {checklist.status === 'completed' ? (
        <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-6">
          <h3 className="text-lg font-semibold text-blue-900">Project Complete!</h3>
          <p className="mt-1 text-sm text-blue-800">
            Generate your handoff package to receive all project documents.
          </p>
          <Link
            href={`/owner/projects/${params.id}/handoff`}
            className="mt-3 inline-block rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            View Handoff Package →
          </Link>
        </div>
      ) : null}

      {/* Back Link */}
      <div className="mt-6">
        <Link
          href={`/owner/projects/${params.id}`}
          className="text-sm text-blue-600 underline underline-offset-4 hover:text-blue-700"
        >
          ← Back to Project
        </Link>
      </div>
    </main>
  )
}
