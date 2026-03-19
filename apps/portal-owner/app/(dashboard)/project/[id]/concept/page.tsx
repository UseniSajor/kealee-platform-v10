'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  CheckCircle, Clock, AlertTriangle, Download, ArrowRight,
  FileText, Shield, DollarSign, Wrench
} from 'lucide-react'

interface ConceptRecord {
  exists: boolean
  status?: 'PENDING' | 'PAID' | 'IN_REVIEW' | 'DELIVERED'
  designRoute?: 'AI_ONLY' | 'ARCHITECT_REQUIRED'
  dcsScore?: number
  aiConceptJson?: Record<string, unknown>
  floorPlanUrl?: string
  costBandLow?: number
  costBandHigh?: number
  structuralRisk?: string
  permitRisk?: string
  zoningConfirmed?: boolean
  feasibilityConfirmed?: boolean
  contractorScopeNotes?: string
  deliveredAt?: string
}

const API_BASE = '/api/v1'

const RISK_BADGE: Record<string, { bg: string; text: string }> = {
  LOW:      { bg: 'rgba(52,211,153,0.1)',  text: '#059669' },
  MEDIUM:   { bg: 'rgba(251,191,36,0.1)',  text: '#D97706' },
  HIGH:     { bg: 'rgba(248,113,113,0.1)', text: '#DC2626' },
  CRITICAL: { bg: 'rgba(220,38,38,0.15)',  text: '#991B1B' },
}

export default function ConceptPage() {
  const { id: projectId } = useParams()
  const router = useRouter()
  const [record, setRecord] = useState<ConceptRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [initiating, setInitiating] = useState(false)

  useEffect(() => {
    if (!projectId) return
    fetch(`${API_BASE}/design/concept-validation/${projectId}`, { credentials: 'include' })
      .then(r => r.json())
      .then(setRecord)
      .catch(() => setRecord({ exists: false }))
      .finally(() => setLoading(false))
  }, [projectId])

  const handleGetStarted = async () => {
    setInitiating(true)
    try {
      const res = await fetch(`${API_BASE}/design/concept-validation/initiate`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          projectId,
          successUrl: `${window.location.origin}/project/${projectId}/concept?success=1`,
          cancelUrl:  `${window.location.origin}/project/${projectId}/concept`,
        }),
      })
      const data = await res.json()
      if (res.ok && data.url) {
        window.location.href = data.url
      } else if (data.code === 'PHOTOS_REQUIRED') {
        alert('Please add at least one project photo before getting your concept. Go to Project Details → Photos.')
      } else {
        alert(data.error ?? 'Failed to start checkout')
      }
    } catch {
      alert('Network error — please try again')
    } finally {
      setInitiating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
      </div>
    )
  }

  // STATE 1 — Not purchased
  if (!record?.exists || record.status === 'PENDING') {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{ backgroundColor: 'rgba(42,191,191,0.1)' }}>
            <FileText className="h-8 w-8" style={{ color: '#2ABFBF' }} />
          </div>
          <h1 className="mb-2 text-2xl font-bold" style={{ color: '#1A2B4A' }}>
            Project Concept + Validation
          </h1>
          <p className="mb-2 text-3xl font-bold" style={{ color: '#E8793A' }}>$395</p>
          <p className="mb-6 text-gray-500">
            AI-generated concept + zoning check + structural risk + cost band + permit risk — all delivered in 24 hours.
          </p>
          <div className="mb-8 grid gap-3 sm:grid-cols-2">
            {[
              { icon: FileText, label: 'AI floor plan sketch' },
              { icon: Shield, label: 'Zoning confirmed' },
              { icon: AlertTriangle, label: 'Structural risk rating' },
              { icon: DollarSign, label: 'Cost band ($X–$Y)' },
              { icon: Wrench, label: 'Permit risk assessment' },
              { icon: CheckCircle, label: 'Contractor scope notes' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3 rounded-lg p-3"
                style={{ backgroundColor: '#F7FAFC' }}>
                <Icon className="h-4 w-4 flex-shrink-0" style={{ color: '#2ABFBF' }} />
                <span className="text-sm text-gray-700">{label}</span>
              </div>
            ))}
          </div>
          <p className="mb-6 text-xs text-gray-400">
            Projects with structural complexity or budgets ≥ $65,000 are connected with a licensed architect.
          </p>
          <button
            onClick={handleGetStarted}
            disabled={initiating}
            className="flex w-full items-center justify-center gap-2 rounded-xl py-4 text-base font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: '#E8793A' }}
          >
            {initiating ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <>
                Get Started — $395
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </button>
        </div>
      </div>
    )
  }

  // STATE 2 — Paid / In Review
  if (['PAID', 'IN_REVIEW'].includes(record.status!)) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="rounded-2xl border-2 border-teal-200 bg-white p-8 shadow-sm">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ backgroundColor: 'rgba(42,191,191,0.1)' }}>
            <Clock className="h-7 w-7" style={{ color: '#2ABFBF' }} />
          </div>
          <h1 className="mb-2 text-xl font-bold" style={{ color: '#1A2B4A' }}>
            Your concept is being prepared
          </h1>
          <p className="mb-6 text-gray-500">
            Our team is reviewing your project. Typically delivered within 24 hours.
          </p>
          <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(42,191,191,0.06)' }}>
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 animate-pulse rounded-full bg-teal-500" />
              <p className="text-sm font-medium" style={{ color: '#2ABFBF' }}>
                {record.status === 'IN_REVIEW' ? 'Staff review in progress' : 'AI generation in progress'}
              </p>
            </div>
            {record.dcsScore != null && (
              <p className="mt-2 text-xs text-gray-500">
                DCS Score: <strong>{record.dcsScore}</strong>
                {' · '}
                Route: <strong>{record.designRoute === 'AI_ONLY' ? 'AI Design' : 'Architect Required'}</strong>
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  // DELIVERED — split by design route
  if (record.status === 'DELIVERED') {
    const floorPlan = (record.aiConceptJson?.floorPlanSketch ?? {}) as Record<string, unknown>
    const rooms = Array.isArray(floorPlan.rooms) ? floorPlan.rooms : []
    const isAiOnly = record.designRoute === 'AI_ONLY'

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#1A2B4A' }}>
              Project Concept + Validation
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Delivered {record.deliveredAt ? new Date(record.deliveredAt).toLocaleDateString() : ''}
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold"
            style={{
              backgroundColor: isAiOnly ? 'rgba(42,191,191,0.1)' : 'rgba(232,121,58,0.1)',
              color:            isAiOnly ? '#2ABFBF' : '#E8793A',
            }}>
            <CheckCircle className="h-3.5 w-3.5" />
            {isAiOnly ? 'AI Design Qualifies' : 'Architect Required'}
          </div>
        </div>

        {/* Architect required notice */}
        {!isAiOnly && (
          <div className="rounded-2xl border-2 border-orange-200 p-6"
            style={{ backgroundColor: 'rgba(232,121,58,0.04)' }}>
            <div className="flex items-start gap-4">
              <AlertTriangle className="mt-0.5 h-6 w-6 flex-shrink-0 text-orange-500" />
              <div>
                <p className="font-semibold" style={{ color: '#1A2B4A' }}>This project requires a licensed architect</p>
                <p className="mt-1 text-sm text-gray-600">
                  Based on your project scope (DCS: {record.dcsScore}
                  {record.dcsScore != null && record.dcsScore < 71 && (record.aiConceptJson as any)?.budgetEstimated >= 65000
                    ? ' / budget ≥ $65K' : ''}),
                  this project requires a licensed architect for permit-ready drawings.
                  Your concept sketch is provided as a reference only.
                  Our team will be in touch to connect you with an architect.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* DCS + badges row */}
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-xs text-gray-400">DCS Score</p>
            <p className="mt-1 text-2xl font-bold" style={{ color: '#1A2B4A' }}>{record.dcsScore ?? '—'}</p>
            <p className="text-xs text-gray-500">
              {isAiOnly ? 'AI design qualifies' : 'Architect required'}
            </p>
          </div>
          {record.costBandLow != null && (
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-xs text-gray-400">Cost Band</p>
              <p className="mt-1 text-sm font-bold" style={{ color: '#1A2B4A' }}>
                ${record.costBandLow.toLocaleString()} – ${record.costBandHigh?.toLocaleString()}
              </p>
            </div>
          )}
          {record.structuralRisk && (
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-xs text-gray-400">Structural Risk</p>
              <span className="mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-semibold"
                style={RISK_BADGE[record.structuralRisk] ?? {}}>
                {record.structuralRisk}
              </span>
            </div>
          )}
          {record.permitRisk && (
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-xs text-gray-400">Permit Risk</p>
              <span className="mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-semibold"
                style={RISK_BADGE[record.permitRisk] ?? {}}>
                {record.permitRisk}
              </span>
            </div>
          )}
        </div>

        {/* Floor plan */}
        {record.floorPlanUrl && (
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <p className="mb-3 text-sm font-semibold" style={{ color: '#1A2B4A' }}>
              Floor Plan Sketch
              {!isAiOnly && <span className="ml-2 text-xs font-normal text-orange-500">(Reference only — architect will create permit-ready drawings)</span>}
            </p>
            <img src={record.floorPlanUrl} alt="Floor plan" className="w-full rounded-lg" />
          </div>
        )}

        {/* Room schedule */}
        {rooms.length > 0 && isAiOnly && (
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <p className="mb-3 text-sm font-semibold" style={{ color: '#1A2B4A' }}>Room-by-Room Scope</p>
            <div className="divide-y divide-gray-50">
              {rooms.map((room: any, i: number) => (
                <div key={i} className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-700">{room.name}</span>
                  <span className="text-sm text-gray-500">{room.sqft} sqft · Floor {room.level}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contractor scope notes */}
        {record.contractorScopeNotes && (
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <p className="mb-2 text-sm font-semibold" style={{ color: '#1A2B4A' }}>Contractor Scope Notes</p>
            <p className="text-sm text-gray-600">{record.contractorScopeNotes}</p>
          </div>
        )}

        {/* CTA — only for AI_ONLY */}
        {isAiOnly && (
          <div className="rounded-2xl p-6" style={{ backgroundColor: 'rgba(42,191,191,0.06)' }}>
            <p className="mb-3 text-sm font-semibold" style={{ color: '#1A2B4A' }}>Next step</p>
            <button
              onClick={() => router.push(`/project/${projectId}/estimate`)}
              className="flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white"
              style={{ backgroundColor: '#2ABFBF' }}
            >
              Get your estimate
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    )
  }

  return null
}
