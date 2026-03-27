'use client'

import { useEffect, useState } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

type PermitStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'CORRECTIONS_REQUIRED'
  | 'APPROVED'
  | 'REJECTED'
  | 'EXPIRED'

interface PermitApplication {
  id: string
  permitType: string
  status: PermitStatus
  projectData: {
    address?: string
    scope?: string
    valuation?: number
  }
  createdAt: string
  updatedAt: string
}

const STATUS_STYLES: Record<PermitStatus, { label: string; bg: string; color: string }> = {
  DRAFT:                { label: 'Draft',              bg: '#F3F4F6', color: '#6B7280' },
  SUBMITTED:            { label: 'Submitted',          bg: '#EFF6FF', color: '#2563EB' },
  UNDER_REVIEW:         { label: 'Under Review',       bg: '#FEF9C3', color: '#CA8A04' },
  CORRECTIONS_REQUIRED: { label: 'Corrections Needed', bg: '#FEF2F2', color: '#DC2626' },
  APPROVED:             { label: 'Approved',           bg: '#F0FFF4', color: '#16A34A' },
  REJECTED:             { label: 'Rejected',           bg: '#FEF2F2', color: '#DC2626' },
  EXPIRED:              { label: 'Expired',            bg: '#F3F4F6', color: '#6B7280' },
}

function StatusBadge({ status }: { status: PermitStatus }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.DRAFT
  return (
    <span
      className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full"
      style={{ backgroundColor: s.bg, color: s.color }}
    >
      {s.label}
    </span>
  )
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function ContractorPermitsPage() {
  const [applications, setApplications] = useState<PermitApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const token = typeof window !== 'undefined'
      ? document.cookie.match(/supabase-auth-token=([^;]+)/)?.[1]
      : null

    fetch(`${API}/api/v1/permits/applications`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: 'include',
    })
      .then((r) => r.json())
      .then((data) => {
        setApplications(data.applications ?? [])
        setLoading(false)
      })
      .catch(() => {
        setError('Could not load permit applications')
        setLoading(false)
      })
  }, [])

  const statusGroups = {
    active: applications.filter((a) =>
      ['SUBMITTED', 'UNDER_REVIEW', 'CORRECTIONS_REQUIRED'].includes(a.status)
    ),
    approved: applications.filter((a) => a.status === 'APPROVED'),
    other: applications.filter((a) => ['DRAFT', 'REJECTED', 'EXPIRED'].includes(a.status)),
  }

  return (
    <div className="p-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#1A2B4A' }}>
            Permit Applications
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Track permit status across all your active projects
          </p>
        </div>
        <a
          href="/permits/new"
          className="px-5 py-2.5 rounded-xl font-semibold text-white text-sm transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#E8793A' }}
        >
          + New Application
        </a>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <div
            className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: '#2ABFBF', borderTopColor: 'transparent' }}
          />
        </div>
      )}

      {error && (
        <div className="rounded-xl p-4 text-sm" style={{ backgroundColor: '#FEF2F2', color: '#DC2626' }}>
          {error}
        </div>
      )}

      {!loading && !error && applications.length === 0 && (
        <div
          className="rounded-2xl border-2 border-dashed p-12 text-center"
          style={{ borderColor: '#E5E7EB' }}
        >
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-4"
            style={{ backgroundColor: '#F0FAFA' }}
          >
            <svg className="w-7 h-7" style={{ color: '#2ABFBF' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="font-bold mb-1" style={{ color: '#1A2B4A' }}>No permit applications yet</h3>
          <p className="text-sm text-gray-500 mb-5">
            Start a new application for one of your projects
          </p>
          <a
            href="/permits/new"
            className="inline-block px-6 py-2.5 rounded-xl font-semibold text-white text-sm transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#1A2B4A' }}
          >
            Start Application
          </a>
        </div>
      )}

      {!loading && applications.length > 0 && (
        <div className="space-y-8">
          {/* Active */}
          {statusGroups.active.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-3">
                Active ({statusGroups.active.length})
              </h2>
              <div className="space-y-3">
                {statusGroups.active.map((app) => (
                  <ApplicationCard key={app.id} app={app} />
                ))}
              </div>
            </section>
          )}

          {/* Approved */}
          {statusGroups.approved.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-3">
                Approved ({statusGroups.approved.length})
              </h2>
              <div className="space-y-3">
                {statusGroups.approved.map((app) => (
                  <ApplicationCard key={app.id} app={app} />
                ))}
              </div>
            </section>
          )}

          {/* Other */}
          {statusGroups.other.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-3">
                Other ({statusGroups.other.length})
              </h2>
              <div className="space-y-3">
                {statusGroups.other.map((app) => (
                  <ApplicationCard key={app.id} app={app} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}

function ApplicationCard({ app }: { app: PermitApplication }) {
  return (
    <a
      href={`/permits/${app.id}`}
      className="flex items-center justify-between bg-white rounded-xl border border-gray-100 p-4 hover:shadow-sm hover:border-gray-200 transition-all block"
    >
      <div className="flex items-start gap-4 min-w-0">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: '#F0FAFA' }}
        >
          <svg className="w-5 h-5" style={{ color: '#2ABFBF' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-sm truncate" style={{ color: '#1A2B4A' }}>
            {app.projectData?.address ?? 'No address'}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {app.permitType} · Submitted {formatDate(app.createdAt)}
          </p>
          {app.projectData?.scope && (
            <p className="text-xs text-gray-500 mt-1 truncate">{app.projectData.scope}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0 ml-4">
        <StatusBadge status={app.status as PermitStatus} />
        <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </a>
  )
}
