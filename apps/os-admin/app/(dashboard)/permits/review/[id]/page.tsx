'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { AppLayout } from '@/components/layout/app-layout'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.kealee.com'

interface PermitDetail {
  id: string
  scope: string
  address: string
  permitType: string
  kealeeStatus: string
  readyToSubmit: boolean
  valuation: number
  aiReviewScore: number | null
  createdAt: string
  jurisdiction: { name: string; portalUrl?: string } | null
  aiReviews: Array<{
    id: string
    overallScore: number
    readyToSubmit: boolean
    suggestedFixes: Array<{ roadmap: RoadmapOutput }>
    reviewedAt: string
  }>
}

interface RoadmapOutput {
  permitsRequired: Array<{ type: string; estimatedCost: number; timeline: string; inspectorContact?: string }>
  zoningAnalysis: { district: string; setbacks: string; heightLimit: string; farCompliant: boolean; notes: string }
  codeCompliance: { ibcSections: string[]; ircSections: string[]; necSections: string[]; specialRequirements: string[] }
  inspectionsRequired: Array<{ name: string; timing: string; whatToCheck: string[]; passCriteria: string[] }>
  estimatedTimeline: { approvalDays: number; totalTimelineWeeks: number; phases: Record<string, number> }
  totalPermitCost: number
  jurisdictionNotes: string
  confidenceScore: number
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 mb-4">
      <h2 className="text-base font-semibold text-gray-900 mb-4">{title}</h2>
      {children}
    </div>
  )
}

function Badge({ ok }: { ok: boolean }) {
  return ok
    ? <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">✓ Compliant</span>
    : <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 px-2 py-0.5 rounded-full">✗ Issue</span>
}

export default function PermitReviewDetailPage() {
  const { id } = useParams() as { id: string }
  const router = useRouter()

  const [permit, setPermit] = useState<PermitDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [issues, setIssues] = useState<string[]>([])

  const roadmap: RoadmapOutput | null = permit?.aiReviews?.[0]?.suggestedFixes?.[0]?.roadmap ?? null

  useEffect(() => {
    fetch(`${API}/api/permits/${id}`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => setPermit(d.permit))
      .finally(() => setLoading(false))
  }, [id])

  function validate(): string[] {
    const found: string[] = []
    if (!roadmap) { found.push('No AI roadmap found for this permit'); return found }
    if (!roadmap.permitsRequired?.length) found.push('No permits listed in roadmap')
    if (roadmap.permitsRequired?.some(p => !p.estimatedCost)) found.push('One or more permits missing cost estimate')
    if (!roadmap.zoningAnalysis?.farCompliant) found.push('Zoning: FAR compliance issue flagged')
    if (!roadmap.codeCompliance?.ibcSections?.length) found.push('No IBC sections referenced')
    if (!roadmap.inspectionsRequired?.length) found.push('No inspection schedule defined')
    return found
  }

  async function handleApprove() {
    const found = validate()
    setIssues(found)
    if (found.length) return

    setBusy(true)
    try {
      const res = await fetch(`${API}/api/permits/${id}/approve`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      router.push('/permits/review')
    } catch (e: any) {
      alert('Approval failed: ' + e.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleReject() {
    const reason = window.prompt('Reason for rejection (required):')
    if (!reason) return
    setBusy(true)
    try {
      const res = await fetch(`${API}/api/permits/${id}/reject`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      router.push('/permits/review')
    } catch (e: any) {
      alert('Rejection failed: ' + e.message)
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <ProtectedRoute><AppLayout><div className="p-6 text-sm text-gray-500">Loading…</div></AppLayout></ProtectedRoute>
  if (!permit) return <ProtectedRoute><AppLayout><div className="p-6 text-sm text-red-500">Permit not found.</div></AppLayout></ProtectedRoute>

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="p-6 max-w-4xl mx-auto">

          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">Permit Review</p>
              <h1 className="text-2xl font-bold text-gray-900">{permit.scope || 'Unnamed project'}</h1>
              <p className="text-sm text-gray-500 mt-1">
                {permit.address || '—'} · {permit.jurisdiction?.name ?? 'Unknown jurisdiction'}
              </p>
            </div>
            {permit.readyToSubmit && (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                ✓ Approved for submission
              </span>
            )}
          </div>

          {/* Validation errors */}
          {issues.length > 0 && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <p className="font-semibold mb-1">Issues found — resolve before approving:</p>
              <ul className="list-disc list-inside space-y-0.5">{issues.map(i => <li key={i}>{i}</li>)}</ul>
            </div>
          )}

          {!roadmap && (
            <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
              No AI roadmap found. Generate one via the intake form before reviewing.
            </div>
          )}

          {/* AI Score */}
          {roadmap && (
            <div className="flex gap-4 mb-4">
              <div className="flex-1 bg-white border border-gray-200 rounded-xl p-4 text-center">
                <div className={`text-4xl font-bold ${roadmap.confidenceScore >= 80 ? 'text-green-600' : roadmap.confidenceScore >= 60 ? 'text-amber-500' : 'text-red-500'}`}>
                  {roadmap.confidenceScore}
                </div>
                <div className="text-xs text-gray-400 mt-1">AI Confidence Score</div>
              </div>
              <div className="flex-1 bg-white border border-gray-200 rounded-xl p-4 text-center">
                <div className="text-4xl font-bold text-gray-800">
                  ${roadmap.totalPermitCost?.toLocaleString() ?? '—'}
                </div>
                <div className="text-xs text-gray-400 mt-1">Total Permit Cost</div>
              </div>
              <div className="flex-1 bg-white border border-gray-200 rounded-xl p-4 text-center">
                <div className="text-4xl font-bold text-gray-800">{roadmap.estimatedTimeline?.approvalDays ?? '—'}</div>
                <div className="text-xs text-gray-400 mt-1">Est. Approval Days</div>
              </div>
            </div>
          )}

          {/* Permits Required */}
          {roadmap?.permitsRequired?.length > 0 && (
            <Section title="Permits Required">
              <div className="space-y-3">
                {roadmap.permitsRequired.map((p, i) => (
                  <div key={i} className="flex items-start justify-between border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{p.type}</p>
                      <p className="text-xs text-gray-500">{p.timeline}{p.inspectorContact ? ` · ${p.inspectorContact}` : ''}</p>
                    </div>
                    <span className="text-sm font-bold text-gray-800">${p.estimatedCost?.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Zoning */}
          {roadmap?.zoningAnalysis && (
            <Section title="Zoning Analysis">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-gray-500">District</span><p className="font-medium">{roadmap.zoningAnalysis.district || '—'}</p></div>
                <div><span className="text-gray-500">Setbacks</span><p className="font-medium">{roadmap.zoningAnalysis.setbacks || '—'}</p></div>
                <div><span className="text-gray-500">Height Limit</span><p className="font-medium">{roadmap.zoningAnalysis.heightLimit || '—'}</p></div>
                <div><span className="text-gray-500">FAR Compliance</span><p className="mt-0.5"><Badge ok={roadmap.zoningAnalysis.farCompliant} /></p></div>
              </div>
              {roadmap.zoningAnalysis.notes && (
                <p className="mt-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{roadmap.zoningAnalysis.notes}</p>
              )}
            </Section>
          )}

          {/* Code Compliance */}
          {roadmap?.codeCompliance && (
            <Section title="Code Compliance">
              <div className="space-y-2 text-sm">
                {roadmap.codeCompliance.ibcSections?.length > 0 && (
                  <p><span className="text-gray-500 mr-2">IBC:</span>{roadmap.codeCompliance.ibcSections.join(', ')}</p>
                )}
                {roadmap.codeCompliance.ircSections?.length > 0 && (
                  <p><span className="text-gray-500 mr-2">IRC:</span>{roadmap.codeCompliance.ircSections.join(', ')}</p>
                )}
                {roadmap.codeCompliance.necSections?.length > 0 && (
                  <p><span className="text-gray-500 mr-2">NEC:</span>{roadmap.codeCompliance.necSections.join(', ')}</p>
                )}
                {roadmap.codeCompliance.specialRequirements?.length > 0 && (
                  <div>
                    <span className="text-gray-500">Special:</span>
                    <ul className="list-disc list-inside mt-1 text-gray-700">
                      {roadmap.codeCompliance.specialRequirements.map((r, i) => <li key={i}>{r}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            </Section>
          )}

          {/* Inspections */}
          {roadmap?.inspectionsRequired?.length > 0 && (
            <Section title="Inspection Schedule">
              <div className="space-y-3">
                {roadmap.inspectionsRequired.map((insp, i) => (
                  <div key={i} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                    <p className="text-sm font-semibold text-gray-900">{insp.name}</p>
                    <p className="text-xs text-gray-500">{insp.timing}</p>
                    {insp.whatToCheck?.length > 0 && (
                      <p className="text-xs text-gray-400 mt-1">Check: {insp.whatToCheck.join(', ')}</p>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Jurisdiction notes */}
          {roadmap?.jurisdictionNotes && (
            <Section title="Jurisdiction Notes">
              <p className="text-sm text-gray-700">{roadmap.jurisdictionNotes}</p>
            </Section>
          )}

          {/* Review notes */}
          <Section title="Your Review Notes">
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              placeholder="Add notes from your review (optional)…"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
            />
          </Section>

          {/* Action buttons */}
          {!permit.readyToSubmit && (
            <div className="flex gap-3 mt-2">
              <button
                onClick={handleReject}
                disabled={busy}
                className="px-5 py-2.5 text-sm font-medium border border-red-300 text-red-700 rounded-lg hover:bg-red-50 disabled:opacity-50"
              >
                Reject & Send Back
              </button>
              <button
                onClick={() => { const found = validate(); setIssues(found) }}
                className="px-5 py-2.5 text-sm font-medium border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Validate
              </button>
              <button
                onClick={handleApprove}
                disabled={busy || issues.length > 0}
                className="ml-auto px-6 py-2.5 text-sm font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {busy ? 'Approving…' : 'Approve for Submission'}
              </button>
            </div>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}
