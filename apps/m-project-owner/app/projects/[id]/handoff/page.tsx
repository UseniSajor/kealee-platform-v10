'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'

type DocumentBundle = {
  id: string
  type: string
  title: string
  description: string | null
  fileCount: number
  documents: Array<{
    id: string
    documentType: string
    title: string
    url: string
    fileName: string | null
    mimeType: string | null
    sizeBytes: number | null
  }>
}

type HandoffPackage = {
  id: string
  projectId: string
  status: string
  version: number
  generatedAt: string | null
  deliveredAt: string | null
  downloadedAt: string | null
  downloadCount: number
  downloadUrl: string | null
  documentBundles: DocumentBundle[]
  satisfactionSurvey?: {
    id: string
    status: string
    overallRating: number | null
    completedAt: string | null
  } | null
}

export default function HandoffPage({
  params,
}: {
  params: { id: string }
}) {
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [package_, setPackage_] = useState<HandoffPackage | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showSurvey, setShowSurvey] = useState(false)

  useEffect(() => {
    loadPackage()
  }, [params.id])

  const loadPackage = useCallback(async () => {
    try {
      setError(null)
      const res = await api.getHandoffPackage(params.id)
      setPackage_(res.package)
    } catch (e: unknown) {
      if (e instanceof Error && e.message.includes('not found')) {
        // Package doesn't exist yet, that's okay
        setPackage_(null)
      } else {
        setError(e instanceof Error ? e.message : 'Failed to load handoff package')
      }
    } finally {
      setLoading(false)
    }
  }, [params.id])

  const handleGenerate = useCallback(async () => {
    setGenerating(true)
    try {
      const res = await api.generateHandoffPackage(params.id)
      setPackage_(res.package)
      alert('Handoff package generated successfully!')
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to generate handoff package')
    } finally {
      setGenerating(false)
    }
  }, [params.id])

  const handleDownload = useCallback(async () => {
    if (!package_) return

    try {
      await api.recordHandoffDownload(params.id)
      if (package_.downloadUrl) {
        window.open(package_.downloadUrl, '_blank')
      } else {
        // TODO: Generate download link or show message
        alert('Download link will be available soon. Package is being prepared.')
      }
      await loadPackage()
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to record download')
    }
  }, [package_, params.id, loadPackage])

  const handleDeliver = useCallback(async () => {
    if (!package_) return

    try {
      await api.deliverHandoffPackage(params.id)
      await loadPackage()
      alert('Handoff package delivered! Satisfaction survey will be sent.')
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to deliver handoff package')
    }
  }, [package_, params.id, loadPackage])

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-4xl px-4 py-6">
        <div>Loading handoff package...</div>
      </main>
    )
  }

  if (!package_) {
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
            <li className="text-neutral-800">Handoff Package</li>
          </ol>
        </nav>

        <header className="mt-4">
          <h1 className="text-2xl font-semibold text-neutral-900">Project Handoff Package</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Generate a complete package of all project documents
          </p>
        </header>

        {error ? (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">
            {error}
          </div>
        ) : null}

        <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-neutral-900">Generate Handoff Package</h2>
          <p className="mt-2 text-sm text-neutral-600">
            Create a complete digital package containing all project documents:
          </p>
          <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-neutral-700">
            <li>Contracts and agreements</li>
            <li>Permits and approvals</li>
            <li>Inspection reports</li>
            <li>Payment records</li>
            <li>Warranty documentation</li>
            <li>Project photos</li>
            <li>Closeout documents</li>
          </ul>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating}
            className="mt-6 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {generating ? 'Generating...' : 'Generate Handoff Package'}
          </button>
        </div>

        <div className="mt-6">
          <Link
            href={`/projects/${params.id}`}
            className="text-sm text-blue-600 underline underline-offset-4 hover:text-blue-700"
          >
            ← Back to Project
          </Link>
        </div>
      </main>
    )
  }

  const totalDocuments = package_.documentBundles.reduce((sum, bundle) => sum + bundle.fileCount, 0)

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
          <li className="text-neutral-800">Handoff Package</li>
        </ol>
      </nav>

      <header className="mt-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900">Project Handoff Package</h1>
            <p className="mt-1 text-sm text-neutral-600">
              Complete digital package of all project documents
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-neutral-700">
              Version {package_.version}
            </div>
            <div className="text-xs text-neutral-600">
              {totalDocuments} documents
            </div>
          </div>
        </div>
      </header>

      {error ? (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">
          {error}
        </div>
      ) : null}

      {/* Package Status */}
      <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-blue-900">Package Ready</h2>
            <p className="mt-1 text-sm text-blue-800">
              Generated: {package_.generatedAt ? new Date(package_.generatedAt).toLocaleDateString() : 'N/A'}
              {package_.downloadedAt ? ` • Downloaded: ${new Date(package_.downloadedAt).toLocaleDateString()}` : null}
            </p>
          </div>
          <div className="flex gap-3">
            {package_.downloadUrl ? (
              <button
                type="button"
                onClick={handleDownload}
                className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Download Package
              </button>
            ) : (
              <button
                type="button"
                onClick={handleDownload}
                className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Request Download
              </button>
            )}
            {package_.status !== 'DELIVERED' ? (
              <button
                type="button"
                onClick={handleDeliver}
                className="rounded-lg border border-blue-600 px-6 py-3 text-sm font-semibold text-blue-600 hover:bg-blue-50"
              >
                Mark as Delivered
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* Document Bundles */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold text-neutral-900">Document Bundles</h2>
        <div className="mt-4 space-y-4">
          {package_.documentBundles.map((bundle) => (
            <div
              key={bundle.id}
              className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-neutral-900">{bundle.title}</h3>
                  {bundle.description ? (
                    <p className="mt-1 text-sm text-neutral-600">{bundle.description}</p>
                  ) : null}
                  <p className="mt-2 text-xs text-neutral-500">
                    {bundle.fileCount} {bundle.fileCount === 1 ? 'document' : 'documents'}
                  </p>
                </div>
                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                  {bundle.type}
                </span>
              </div>

              {bundle.documents.length > 0 ? (
                <div className="mt-4 space-y-2">
                  {bundle.documents.slice(0, 5).map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between rounded-lg border border-neutral-200 bg-neutral-50 p-3"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium text-neutral-900">{doc.title}</p>
                        {doc.fileName ? (
                          <p className="mt-1 text-xs text-neutral-600">{doc.fileName}</p>
                        ) : null}
                      </div>
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 underline underline-offset-4 hover:text-blue-700"
                      >
                        View →
                      </a>
                    </div>
                  ))}
                  {bundle.documents.length > 5 ? (
                    <p className="text-xs text-neutral-500">
                      + {bundle.documents.length - 5} more documents
                    </p>
                  ) : null}
                </div>
              ) : (
                <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  No documents available in this bundle
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Satisfaction Survey */}
      {package_.satisfactionSurvey ? (
        <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-6">
          <h2 className="text-lg font-semibold text-green-900">Satisfaction Survey</h2>
          {package_.satisfactionSurvey.status === 'COMPLETED' ? (
            <div className="mt-4">
              <p className="text-sm text-green-800">
                ✅ Survey completed on{' '}
                {package_.satisfactionSurvey.completedAt
                  ? new Date(package_.satisfactionSurvey.completedAt).toLocaleDateString()
                  : 'N/A'}
              </p>
              {package_.satisfactionSurvey.overallRating ? (
                <div className="mt-2 flex items-center gap-1">
                  <span className="text-sm text-green-800">Rating:</span>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <svg
                      key={i}
                      className={`h-5 w-5 ${
                        i < package_.satisfactionSurvey!.overallRating!
                          ? 'text-yellow-400'
                          : 'text-neutral-300'
                      }`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="mt-4">
              <p className="text-sm text-green-800">
                Please take a moment to share your feedback about this project.
              </p>
              <Link
                href={`/projects/${params.id}/handoff/survey`}
                className="mt-3 inline-block rounded-lg bg-green-600 px-6 py-3 text-sm font-semibold text-white hover:bg-green-700"
              >
                Take Survey →
              </Link>
            </div>
          )}
        </div>
      ) : null}

      {/* Back Link */}
      <div className="mt-6">
        <Link
          href={`/projects/${params.id}`}
          className="text-sm text-blue-600 underline underline-offset-4 hover:text-blue-700"
        >
          ← Back to Project
        </Link>
      </div>
    </main>
  )
}
