'use client'

/**
 * /permits/[id] — Permit application detail
 *
 * Backed by GET /api/permits/:id (services/api/src/routes/permit.routes.ts),
 * scoped to the authenticated applicant.
 */

import { useEffect, useState } from 'react'
import { getPermit, type Permit, type PermitStatus } from '@/lib/api/permits'

interface Props { params: { id: string } }

const STATUS_STYLES: Record<PermitStatus, { label: string; bg: string; color: string }> = {
  DRAFT:                  { label: 'Draft',               bg: '#F3F4F6', color: '#6B7280' },
  AI_PRE_REVIEW:          { label: 'AI Review',            bg: '#F3E8FF', color: '#7C3AED' },
  READY_TO_SUBMIT:        { label: 'Ready to Submit',      bg: '#EFF6FF', color: '#2563EB' },
  SUBMITTED:              { label: 'Submitted',            bg: '#EFF6FF', color: '#2563EB' },
  UNDER_REVIEW:           { label: 'Under Review',         bg: '#FEF9C3', color: '#CA8A04' },
  CORRECTIONS_REQUESTED:  { label: 'Corrections Needed',   bg: '#FEF2F2', color: '#DC2626' },
  RESUBMITTED:            { label: 'Resubmitted',          bg: '#FEF9C3', color: '#CA8A04' },
  APPROVED:               { label: 'Approved',             bg: '#F0FFF4', color: '#16A34A' },
  ISSUED:                 { label: 'Issued',               bg: '#F0FFF4', color: '#16A34A' },
  ACTIVE:                 { label: 'Active',               bg: '#F0FFF4', color: '#16A34A' },
  INSPECTION_HOLD:        { label: 'Inspection Hold',      bg: '#FFF7ED', color: '#C2410C' },
  EXPIRED:                { label: 'Expired',              bg: '#F3F4F6', color: '#6B7280' },
  COMPLETED:              { label: 'Completed',            bg: '#F0FFF4', color: '#16A34A' },
  CANCELLED:              { label: 'Cancelled',            bg: '#F3F4F6', color: '#6B7280' },
  REJECTED:               { label: 'Rejected',             bg: '#FEF2F2', color: '#DC2626' },
}

function StatusBadge({ status }: { status: PermitStatus }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.DRAFT
  return (
    <span className="inline-block rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: s.bg, color: s.color }}>
      {s.label}
    </span>
  )
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatMoney(v: number | string | null) {
  if (v === null || v === undefined) return '—'
  const n = typeof v === 'string' ? parseFloat(v) : v
  if (!Number.isFinite(n) || n <= 0) return '—'
  return `$${n.toLocaleString()}`
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-gray-50 py-2.5 last:border-0">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-sm font-medium" style={{ color: '#1A2B4A' }}>{value}</span>
    </div>
  )
}

function DocList({ title, urls }: { title: string; urls: string[] }) {
  if (!urls || urls.length === 0) return null
  return (
    <div className="mb-4">
      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">{title}</p>
      <div className="space-y-1.5">
        {urls.map((url, i) => (
          <a
            key={i}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="block truncate rounded-lg border border-gray-100 px-3 py-2 text-xs font-medium hover:bg-gray-50"
            style={{ color: '#2ABFBF' }}
          >
            {title} {i + 1}
          </a>
        ))}
      </div>
    </div>
  )
}

export default function PermitDetailPage({ params }: Props) {
  const { id } = params
  const [permit, setPermit] = useState<Permit | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getPermit(id)
      .then((data) => {
        setPermit(data.permit)
        setLoading(false)
      })
      .catch((err: any) => {
        setError(err?.status === 404 ? 'Permit application not found' : 'Could not load this permit application')
        setLoading(false)
      })
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: '#2ABFBF', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  if (error || !permit) {
    return (
      <div className="p-6 max-w-2xl">
        <a href="/permits" className="text-xs font-medium text-gray-400 hover:text-gray-600">← Permit Applications</a>
        <div className="mt-4 rounded-xl p-4 text-sm" style={{ backgroundColor: '#FEF2F2', color: '#DC2626' }}>
          {error ?? 'Permit application not found'}
        </div>
      </div>
    )
  }

  const hasDocuments =
    permit.plans.length > 0 || permit.calculations.length > 0 ||
    permit.reports.length > 0 || permit.otherDocuments.length > 0

  return (
    <div className="p-6 max-w-3xl">
      <a href="/permits" className="text-xs font-medium text-gray-400 hover:text-gray-600">← Permit Applications</a>

      <div className="mt-3 mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#1A2B4A' }}>{permit.address}</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {permit.permitType}{permit.permitNumber ? ` · ${permit.permitNumber}` : ''}
          </p>
        </div>
        <StatusBadge status={permit.status} />
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <div className="sm:col-span-2 space-y-5">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h2 className="mb-2 text-sm font-semibold" style={{ color: '#1A2B4A' }}>Scope of Work</h2>
            <p className="text-sm text-gray-600">{permit.scope || 'No scope provided'}</p>
          </div>

          {hasDocuments && (
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold" style={{ color: '#1A2B4A' }}>Documents</h2>
              <DocList title="Plans" urls={permit.plans} />
              <DocList title="Calculations" urls={permit.calculations} />
              <DocList title="Reports" urls={permit.reports} />
              <DocList title="Other Documents" urls={permit.otherDocuments} />
            </div>
          )}

          {permit.aiReviews && permit.aiReviews.length > 0 && (
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold" style={{ color: '#1A2B4A' }}>AI Reviews</h2>
              <div className="space-y-2">
                {permit.aiReviews.map((r) => (
                  <div key={r.id} className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2 text-sm">
                    <span className="text-gray-500">{formatDate(r.reviewedAt)}</span>
                    <span className="font-semibold" style={{ color: '#1A2B4A' }}>
                      Score: {r.overallScore ?? r.score ?? '—'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h2 className="mb-1 text-sm font-semibold" style={{ color: '#1A2B4A' }}>Jurisdiction</h2>
            {permit.jurisdiction ? (
              <>
                <p className="text-sm font-medium" style={{ color: '#1A2B4A' }}>{permit.jurisdiction.name}</p>
                <p className="text-xs text-gray-500">
                  {[permit.jurisdiction.city, permit.jurisdiction.county, permit.jurisdiction.state].filter(Boolean).join(', ')}
                </p>
                {permit.jurisdictionRefNumber && (
                  <p className="mt-1 text-xs text-gray-400">Ref #{permit.jurisdictionRefNumber}</p>
                )}
              </>
            ) : (
              <p className="text-sm text-gray-400">—</p>
            )}
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h2 className="mb-1 text-sm font-semibold" style={{ color: '#1A2B4A' }}>Key Dates</h2>
            <Row label="Created" value={formatDate(permit.createdAt)} />
            <Row label="Submitted" value={formatDate(permit.submittedAt)} />
            <Row label="Approved" value={formatDate(permit.approvedAt)} />
            <Row label="Issued" value={formatDate(permit.issuedAt)} />
            <Row label="Expires" value={formatDate(permit.expiresAt)} />
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h2 className="mb-1 text-sm font-semibold" style={{ color: '#1A2B4A' }}>Applicant</h2>
            <Row label="Name" value={permit.applicantName || '—'} />
            <Row label="Email" value={permit.applicantEmail || '—'} />
            <Row label="Phone" value={permit.applicantPhone || '—'} />
            <Row label="Est. Valuation" value={formatMoney(permit.valuation)} />
          </div>
        </div>
      </div>
    </div>
  )
}
