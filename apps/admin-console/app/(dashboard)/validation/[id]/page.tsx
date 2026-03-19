'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AlertTriangle, CheckCircle, Clock, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

interface ValidationDetail {
  id: string
  projectId: string
  status: string
  dcsScore: number | null
  designRoute: 'AI_ONLY' | 'ARCHITECT_REQUIRED' | null
  aiConceptJson: Record<string, unknown> | null
  floorPlanUrl: string | null
  structuralRisk: RiskLevel | null
  costBandLow: number | null
  costBandHigh: number | null
  permitRisk: RiskLevel | null
  contractorScopeNotes: string | null
  project?: {
    name: string | null
    type: string | null
    city: string | null
    state: string | null
    sqft: number | null
    budgetEstimated: number | null
    description: string | null
    owner?: { name: string | null; email: string }
  }
}

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

const RISK_COLORS: Record<RiskLevel, { bg: string; text: string }> = {
  LOW:      { bg: 'rgba(52,211,153,0.1)',  text: '#059669' },
  MEDIUM:   { bg: 'rgba(251,191,36,0.1)',  text: '#D97706' },
  HIGH:     { bg: 'rgba(248,113,113,0.1)', text: '#DC2626' },
  CRITICAL: { bg: 'rgba(220,38,38,0.15)',  text: '#991B1B' },
}

export default function ValidationDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [record, setRecord] = useState<ValidationDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [elapsed, setElapsed] = useState(0) // seconds
  const startRef = useRef(Date.now())

  // Form state
  const [form, setForm] = useState({
    feasibilityConfirmed:    false,
    zoningConfirmed:         false,
    structuralRisk:          'LOW' as RiskLevel,
    costBandLow:             0,
    costBandHigh:            0,
    permitRisk:              'LOW' as RiskLevel,
    contractorScopeNotes:    '',
    staffReviewedBy:         '',
    architectRequired:       false,
  })

  // Elapsed timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!id) return
    fetch(`${API}/design/concept-validation/admin/${id}`, { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        setRecord(data)
        // Pre-fill form with AI-generated values if present
        setForm(prev => ({
          ...prev,
          structuralRisk:       data.structuralRisk ?? 'LOW',
          permitRisk:           data.permitRisk ?? 'LOW',
          costBandLow:          data.costBandLow ?? 0,
          costBandHigh:         data.costBandHigh ?? 0,
          contractorScopeNotes: data.contractorScopeNotes ?? '',
          architectRequired:    data.designRoute === 'ARCHITECT_REQUIRED',
        }))
      })
      .catch(() => setRecord(null))
      .finally(() => setLoading(false))
  }, [id])

  const timerColor = elapsed < 600 ? '#38A169' : elapsed < 600 * 1.5 ? '#D97706' : '#E53E3E'
  const timerLabel = `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, '0')}`

  const handleDeliver = async () => {
    if (!form.staffReviewedBy) {
      alert('Please enter your name in the "Reviewed by" field')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch(`${API}/design/concept-validation/${id}/staff-complete`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          feasibilityConfirmed: form.feasibilityConfirmed,
          zoningConfirmed:      form.zoningConfirmed,
          structuralRisk:       form.structuralRisk,
          costBandLow:          Number(form.costBandLow),
          costBandHigh:         Number(form.costBandHigh),
          permitRisk:           form.permitRisk,
          contractorScopeNotes: form.contractorScopeNotes,
          staffReviewedBy:      form.staffReviewedBy,
        }),
      })
      if (res.ok) {
        router.push('/validation')
      } else {
        const err = await res.json()
        alert(err.error ?? 'Delivery failed')
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
      </div>
    )
  }

  if (!record) {
    return (
      <div className="p-6">
        <p className="text-gray-500">Record not found.</p>
        <Link href="/validation" className="mt-4 text-sm text-teal-600">← Back to queue</Link>
      </div>
    )
  }

  const ai = record.aiConceptJson as Record<string, unknown> ?? {}
  const concept = (ai.conceptLayout ?? {}) as Record<string, unknown>
  const floorPlan = (ai.floorPlanSketch ?? {}) as Record<string, unknown>
  const rooms = Array.isArray(floorPlan.rooms) ? floorPlan.rooms : []

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Link href="/validation" className="rounded-lg border border-gray-200 p-2 hover:bg-gray-50">
            <ArrowLeft className="h-4 w-4 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#1A2B4A' }}>
              {record.project?.name || 'Unnamed Project'}
            </h1>
            <p className="text-sm text-gray-500">
              {record.project?.owner?.name} · {record.project?.city}, {record.project?.state}
            </p>
          </div>
        </div>

        {/* Elapsed timer */}
        <div className="flex items-center gap-2 rounded-xl px-4 py-2 font-mono text-lg font-bold"
          style={{ backgroundColor: `${timerColor}15`, color: timerColor }}>
          <Clock className="h-5 w-5" />
          {timerLabel}
          <span className="text-xs font-normal">/ 10:00</span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* LEFT — AI output + project info */}
        <div className="space-y-4">

          {/* Section 1 — Project overview */}
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">1 — Project Overview</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-gray-400">Type</p>
                <p className="font-medium" style={{ color: '#1A2B4A' }}>{record.project?.type || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Sqft</p>
                <p className="font-medium" style={{ color: '#1A2B4A' }}>{record.project?.sqft?.toLocaleString() || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Budget</p>
                <p className="font-medium" style={{ color: '#1A2B4A' }}>
                  {record.project?.budgetEstimated
                    ? `$${record.project.budgetEstimated.toLocaleString()}`
                    : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400">DCS Score</p>
                <p className="font-bold text-lg" style={{ color: record.dcsScore != null && record.dcsScore >= 41 ? '#E8793A' : '#2ABFBF' }}>
                  {record.dcsScore ?? '—'}
                </p>
              </div>
            </div>
            {record.designRoute && (
              <div className="mt-3 rounded-lg px-3 py-2"
                style={{
                  backgroundColor: record.designRoute === 'AI_ONLY'
                    ? 'rgba(42,191,191,0.08)' : 'rgba(232,121,58,0.08)',
                }}>
                <p className="text-xs font-semibold"
                  style={{ color: record.designRoute === 'AI_ONLY' ? '#2ABFBF' : '#E8793A' }}>
                  Design Route: {record.designRoute === 'AI_ONLY' ? 'AI Only' : 'Architect Required'}
                </p>
              </div>
            )}
          </div>

          {/* Section 2 — Floor plan image */}
          {record.floorPlanUrl && (
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">2 — Floor Plan</h2>
              <img src={record.floorPlanUrl} alt="Floor plan" className="w-full rounded-lg border border-gray-100" />
            </div>
          )}

          {rooms.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">2 — Room Schedule</h2>
              <div className="space-y-1">
                {rooms.map((room: any, i: number) => (
                  <div key={i} className="flex items-center justify-between rounded-lg px-3 py-1.5"
                    style={{ backgroundColor: room.sqft < 70 ? 'rgba(248,113,113,0.06)' : 'transparent' }}>
                    <span className="text-sm text-gray-700">{room.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono text-gray-500">{room.sqft} sf</span>
                      {room.sqft < 70 && (
                        <AlertTriangle className="h-3.5 w-3.5 text-orange-400" title="Below minimum size" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 3 — Zoning + scope from AI */}
          {concept && (
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">3 — Zoning Notes (AI)</h2>
              <p className="text-sm text-gray-700">{(concept as any).zoningSummary || 'No zoning data in AI output.'}</p>
              {Array.isArray((concept as any).constraints) && (concept as any).constraints.length > 0 && (
                <ul className="mt-3 space-y-1">
                  {(concept as any).constraints.map((c: string, i: number) => (
                    <li key={i} className="flex items-center gap-2 text-xs text-gray-600">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                      {c}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* RIGHT — QA form */}
        <div className="space-y-4">

          {/* Section 4 — Cost band */}
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">4 — Cost Band Validator</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Low ($)</label>
                <input
                  type="number"
                  value={form.costBandLow}
                  onChange={e => setForm({ ...form, costBandLow: Number(e.target.value) })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">High ($)</label>
                <input
                  type="number"
                  value={form.costBandHigh}
                  onChange={e => setForm({ ...form, costBandHigh: Number(e.target.value) })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Section 5 — Risk flags */}
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">5 — Risk Flags</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Structural Risk</label>
                <select
                  value={form.structuralRisk}
                  onChange={e => setForm({ ...form, structuralRisk: e.target.value as RiskLevel })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                >
                  {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as RiskLevel[]).map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Permit Risk</label>
                <select
                  value={form.permitRisk}
                  onChange={e => setForm({ ...form, permitRisk: e.target.value as RiskLevel })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                >
                  {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as RiskLevel[]).map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 6 — Delivery form */}
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">6 — Delivery</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Contractor Scope Notes</label>
                <textarea
                  rows={3}
                  value={form.contractorScopeNotes}
                  onChange={e => setForm({ ...form, contractorScopeNotes: e.target.value })}
                  placeholder="Summary for contractors — scope, access requirements, special conditions..."
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
              </div>
              <div className="flex gap-6">
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.zoningConfirmed}
                    onChange={e => setForm({ ...form, zoningConfirmed: e.target.checked })}
                    className="rounded"
                  />
                  Zoning confirmed
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.feasibilityConfirmed}
                    onChange={e => setForm({ ...form, feasibilityConfirmed: e.target.checked })}
                    className="rounded"
                  />
                  Feasibility confirmed
                </label>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Reviewed by *</label>
                <input
                  type="text"
                  value={form.staffReviewedBy}
                  onChange={e => setForm({ ...form, staffReviewedBy: e.target.value })}
                  placeholder="Your name"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
              </div>
              <button
                onClick={handleDeliver}
                disabled={submitting || !form.staffReviewedBy}
                className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: '#38A169' }}
              >
                {submitting ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <CheckCircle className="h-5 w-5" />
                )}
                {submitting ? 'Delivering…' : 'Mark Delivered & Notify Owner'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
