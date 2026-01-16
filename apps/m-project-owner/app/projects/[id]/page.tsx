'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { api, type ReadinessItem } from '@/lib/api'
import { ReadinessItemCompletionForm } from '@/components/ReadinessItemCompletionForm'

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const [project, setProject] = useState<Record<string, unknown> | null>(null)
  const [readinessItems, setReadinessItems] = useState<ReadinessItem[]>([])
  const [completion, setCompletion] = useState<{
    total: number
    required: number
    completed: number
    requiredCompleted: number
    percentage: number
    requiredPercentage: number
    allRequiredComplete: boolean
  } | null>(null)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [completingItemId, setCompletingItemId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    try {
      setError(null)
      const [projectRes, itemsRes, completionRes] = await Promise.all([
        api.getProject(params.id),
        api.listReadiness(params.id).catch(() => ({ items: [] })),
        api.getReadinessCompletion(params.id).catch(() => null),
      ])
      setProject(projectRes.project)
      setReadinessItems(itemsRes.items)
      if (completionRes) setCompletion(completionRes.completion)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load project.')
    } finally {
      setLoading(false)
    }
  }, [params.id])

  useEffect(() => {
    loadData()
  }, [loadData])

  const incompleteItems = readinessItems.filter(
    (i) => i.required && i.status !== 'COMPLETED' && i.status !== 'APPROVED'
  )

  const handleBulkComplete = async () => {
    if (selectedItems.size === 0) return
    try {
      setError(null)
      await api.bulkCompleteReadinessItems(params.id, Array.from(selectedItems), 'Bulk completion from project page')
      setSelectedItems(new Set())
      await loadData()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to complete items.')
    }
  }

  const handleCompleteItem = async (itemId: string, response: unknown) => {
    try {
      setError(null)
      await api.updateReadinessItem(itemId, { status: 'COMPLETED', response })
      setCompletingItemId(null)
      await loadData()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to complete item.')
      throw e
    }
  }

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
            <Link className="underline underline-offset-4" href="/projects/new">
              Projects
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-neutral-800">Project</li>
        </ol>
      </nav>

      <header className="mt-4">
        <h1 className="text-2xl font-semibold text-neutral-900">
          {project ? (project.name as string) : 'Project'}
        </h1>
        {project && (project.description as string) ? (
          <p className="mt-1 text-sm text-neutral-600">{project.description as string}</p>
        ) : null}
      </header>

      {error ? (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="mt-6 text-sm text-neutral-600">Loading…</div>
      ) : (
        <>
          {/* Prompt 1.5: Readiness completion progress bar */}
          {completion && completion.total > 0 ? (
            <section className="mt-6 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-neutral-900">Readiness Checklist</h2>
              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-neutral-700">
                    {completion.completed} of {completion.total} items completed
                  </span>
                  <span className="font-medium text-neutral-900">{completion.percentage}%</span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-neutral-200">
                  <div
                    className="h-full bg-blue-600 transition-all duration-300"
                    style={{ width: `${completion.percentage}%` }}
                    role="progressbar"
                    aria-valuenow={completion.percentage}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  />
                </div>
                <div className="mt-2 text-xs text-neutral-600">
                  Required items: {completion.requiredCompleted} of {completion.required} completed (
                  {completion.requiredPercentage}%)
                </div>
                {!completion.allRequiredComplete ? (
                  <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                    ⚠️ Cannot proceed to READINESS status until all required items are completed.
                  </div>
                ) : (
                  <div className="mt-3 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                    ✅ All required items completed. You can proceed to READINESS status.
                  </div>
                )}
              </div>
            </section>
          ) : null}

          {/* Prompt 1.5: Detailed view of incomplete items */}
          {incompleteItems.length > 0 ? (
            <section className="mt-6 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-neutral-900">
                  Incomplete Required Items ({incompleteItems.length})
                </h2>
                {selectedItems.size > 0 ? (
                  <button
                    type="button"
                    onClick={handleBulkComplete}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    Complete Selected ({selectedItems.size})
                  </button>
                ) : null}
              </div>
              {completingItemId ? (
                <div className="mb-4">
                  {(() => {
                    const item = incompleteItems.find((i) => i.id === completingItemId)
                    if (!item) return null
                    return (
                      <ReadinessItemCompletionForm
                        item={item}
                        onComplete={handleCompleteItem}
                        onCancel={() => setCompletingItemId(null)}
                      />
                    )
                  })()}
                </div>
              ) : null}
              <ul className="space-y-3">
                {incompleteItems.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-start gap-3 rounded-lg border border-neutral-200 p-4"
                  >
                    <input
                      type="checkbox"
                      checked={selectedItems.has(item.id)}
                      onChange={(e) => {
                        const newSet = new Set(selectedItems)
                        if (e.target.checked) {
                          newSet.add(item.id)
                        } else {
                          newSet.delete(item.id)
                        }
                        setSelectedItems(newSet)
                      }}
                      className="mt-1 h-4 w-4 rounded border-neutral-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                      aria-label={`Select ${item.title}`}
                    />
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-neutral-900">
                            {item.title}
                            <span className="ml-2 text-xs font-medium text-red-600">(required)</span>
                          </div>
                          {item.description ? (
                            <div className="mt-1 text-sm text-neutral-700">{item.description}</div>
                          ) : null}
                          <div className="mt-2 flex flex-wrap gap-3 text-xs text-neutral-600">
                            <span>Type: {item.type}</span>
                            <span>Status: {item.status}</span>
                            {item.dueDate ? (
                              <span className={new Date(item.dueDate) < new Date() ? 'text-red-600' : ''}>
                                Due: {item.dueDate.slice(0, 10)}
                              </span>
                            ) : null}
                          </div>
                        </div>
                        {completingItemId !== item.id ? (
                          <button
                            type="button"
                            onClick={() => setCompletingItemId(item.id)}
                            className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                          >
                            Complete
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {/* All readiness items */}
          {readinessItems.length > 0 ? (
            <section className="mt-6 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-neutral-900">All Readiness Items</h2>
              <ul className="mt-4 space-y-2">
                {readinessItems.map((item) => {
                  const isComplete = item.status === 'COMPLETED' || item.status === 'APPROVED'
                  return (
                    <li
                      key={item.id}
                      className={`rounded-lg border p-3 ${
                        isComplete ? 'border-green-200 bg-green-50' : 'border-neutral-200 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-neutral-900">
                            {item.title}
                            {item.required ? (
                              <span className="ml-2 text-xs font-medium text-neutral-600">(required)</span>
                            ) : (
                              <span className="ml-2 text-xs font-medium text-neutral-500">(optional)</span>
                            )}
                            {isComplete ? (
                              <span className="ml-2 text-xs font-medium text-green-700">✓ {item.status}</span>
                            ) : null}
                          </div>
                          {item.description ? (
                            <div className="mt-1 text-sm text-neutral-700">{item.description}</div>
                          ) : null}
                          <div className="mt-2 text-xs text-neutral-600">
                            Type: {item.type} • Status: {item.status}
                            {item.dueDate ? ` • Due: ${item.dueDate.slice(0, 10)}` : ''}
                          </div>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </section>
          ) : null}

          {/* Contracts section */}
          <section className="mt-6 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-neutral-900">Contracts</h2>
              <Link
                href={`/projects/${params.id}/contracts/new`}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                + New Contract
              </Link>
            </div>
            <p className="mt-2 text-sm text-neutral-600">Create and manage contracts for this project</p>
            <div className="mt-4 flex gap-4">
              <Link
                href={`/projects/${params.id}/contracts`}
                className="text-sm text-blue-600 underline underline-offset-4"
              >
                View all contracts →
              </Link>
            </div>
          </section>

          {/* Milestones section (Prompt 3.1) */}
          <section className="mt-6 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-neutral-900">Milestones</h2>
            </div>
            <p className="mt-2 text-sm text-neutral-600">Track and manage project milestones</p>
            <div className="mt-4">
              <Link
                href={`/projects/${params.id}/milestones`}
                className="text-sm text-blue-600 underline underline-offset-4"
              >
                View milestone dashboard →
              </Link>
            </div>
          </section>

          {/* Closeout Checklist (Prompt 3.7) */}
          {(project.status === 'CLOSEOUT' || project.status === 'COMPLETED') ? (
            <section className="mt-6 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-neutral-900">Closeout Checklist</h2>
              <p className="mt-2 text-sm text-neutral-600">Complete final project closeout items</p>
              <div className="mt-4">
                <Link
                  href={`/projects/${params.id}/closeout`}
                  className="text-sm text-blue-600 underline underline-offset-4"
                >
                  View closeout checklist →
                </Link>
              </div>
            </section>
          ) : null}

          {/* Project details */}
          <section className="mt-6 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-neutral-900">Project Details</h2>
            <div className="mt-4">
              <pre className="overflow-auto text-xs text-neutral-800">
                {JSON.stringify(project, null, 2)}
              </pre>
            </div>
          </section>
        </>
      )}
    </main>
  )
}
