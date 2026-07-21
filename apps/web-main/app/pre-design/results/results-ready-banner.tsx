'use client'

import Link from 'next/link'
import { CheckCircle2, AlertCircle, CheckCircle } from 'lucide-react'

interface DeliverableStatus {
  concept: boolean
  budget: boolean
  feasibility: boolean
  permit: boolean
}

interface ResultsReadyBannerProps {
  projectId: string
  status: 'pending' | 'generating' | 'completed' | 'failed'
  deliverables: DeliverableStatus
  confidence?: number
  /** When true, primary CTA routes to permit-ready design; when false, routes to contractor match. */
  requiresPermit?: boolean
}

// ─── Inline mini journey bar (no cross-app import) ────────────────────────────
function BuildJourneyBar({ currentStage }: { currentStage: number }) {
  const stages = ['Concept Package', 'Permit / Pricing', 'Contractor Match', 'Break Ground']
  return (
    <div className="flex items-center gap-0 mt-4 mb-1">
      {stages.map((label, i) => {
        const completed = i < currentStage
        const active    = i === currentStage
        const isLast    = i === stages.length - 1
        return (
          <div key={i} className="flex flex-1 items-center min-w-0">
            <div className="flex flex-col items-center flex-shrink-0">
              <div className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                completed ? 'border-green-500 bg-green-500'
                : active   ? 'border-[#E8793A] bg-[#E8793A]'
                : 'border-gray-300 bg-white'
              }`}>
                {completed
                  ? <CheckCircle className="h-3 w-3 text-white" />
                  : <span className={`text-[9px] font-bold ${active ? 'text-white' : 'text-gray-300'}`}>{i + 1}</span>}
              </div>
              <p className={`text-[9px] font-semibold mt-0.5 text-center leading-tight max-w-[56px] ${
                completed ? 'text-green-600' : active ? 'text-gray-800' : 'text-gray-300'
              }`}>{label}</p>
            </div>
            {!isLast && (
              <div className={`flex-1 h-0.5 mb-3.5 mx-0.5 ${completed ? 'bg-green-400' : 'bg-gray-200'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

export function ResultsReadyBanner({
  projectId,
  status,
  deliverables,
  confidence,
  requiresPermit,
}: ResultsReadyBannerProps) {
  const allReady = Object.values(deliverables).every(Boolean)
  const readyCount = Object.values(deliverables).filter(Boolean).length

  if (status === 'pending' || status === 'generating') {
    return null
  }

  if (status === 'failed') {
    return (
      <div className="rounded-2xl border-l-4 border-red-500 bg-red-50 p-5 mb-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 mt-0.5 text-red-600 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-sm font-bold text-red-900">Processing Failed</h3>
            <p className="text-xs text-red-700 mt-1">
              We encountered an issue while generating your results. Please try again or contact support.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Determine primary and secondary CTAs based on permit requirement
  const primaryCta = requiresPermit === false
    ? {
        href: `/intake/contractor_match?projectId=${projectId}&from=concept`,
        label: 'Match with Contractors + Get Firm Pricing',
      }
    : {
        href: `/intake/permit_path_only?projectId=${projectId}&from=concept`,
        label: 'Get Permit-Ready Design',
      }

  const secondaryCta = requiresPermit === false
    ? {
        href: `/intake/certified_estimate?projectId=${projectId}`,
        label: 'Get Full Cost Estimate',
      }
    : {
        href: `#permit`,
        label: 'Review Permit Requirements',
        isAnchor: true,
      }

  return (
    <div className="rounded-2xl border-l-4 border-green-500 bg-gradient-to-r from-green-50 to-emerald-50 p-6 mb-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <CheckCircle2 className="h-6 w-6 mt-0.5 text-green-600 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-lg font-bold text-green-900 mb-1">Results Ready</h3>
            <p className="text-sm text-green-800 mb-3">
              Your pre-design package is complete with{' '}
              <span className="font-bold">
                {readyCount} of {Object.keys(deliverables).length} deliverables
              </span>
              {confidence && confidence >= 0.8 && (
                <span className="ml-1">and high confidence ({Math.round(confidence * 100)}%)</span>
              )}
            </p>

            {/* Deliverables Checklist */}
            <div className="grid gap-2 mt-3 mb-2">
              {[
                { key: 'concept',     label: 'Concept Images & Design Direction' },
                { key: 'budget',      label: 'Budget Range & Cost Estimate' },
                { key: 'feasibility', label: 'Feasibility Analysis & Zoning' },
                { key: 'permit',      label: 'Permit Pathway & Requirements' },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center gap-2 text-sm">
                  <div className={`h-4 w-4 rounded flex items-center justify-center flex-shrink-0 ${
                    deliverables[key as keyof DeliverableStatus] ? 'bg-green-600' : 'bg-gray-200'
                  }`}>
                    {deliverables[key as keyof DeliverableStatus] && <CheckCircle2 className="h-3 w-3 text-white" />}
                  </div>
                  <span className={deliverables[key as keyof DeliverableStatus] ? 'font-bold text-green-900' : 'text-gray-600'}>
                    {label}
                  </span>
                </div>
              ))}
            </div>

            {/* Build journey progress bar */}
            <BuildJourneyBar currentStage={0} />

            {/* Status text */}
            <p className="text-xs text-green-700 font-medium mt-2">
              {allReady
                ? "Concept complete. Choose your next step below."
                : `${Object.keys(deliverables).length - readyCount} deliverable(s) still processing.`}
            </p>
          </div>
        </div>

        {/* Dynamic CTA Buttons */}
        <div className="flex flex-col gap-2 flex-shrink-0 min-w-[160px]">
          <Link
            href={primaryCta.href}
            className="inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-xs font-bold text-white whitespace-nowrap transition text-center"
            style={{ backgroundColor: '#E8793A' }}
          >
            {primaryCta.label}
          </Link>
          {secondaryCta.isAnchor ? (
            <a
              href={secondaryCta.href}
              className="inline-flex items-center justify-center rounded-lg border border-green-600 px-4 py-2.5 text-xs font-bold text-green-700 whitespace-nowrap transition hover:bg-green-100 text-center"
            >
              {secondaryCta.label}
            </a>
          ) : (
            <Link
              href={secondaryCta.href}
              className="inline-flex items-center justify-center rounded-lg border border-green-600 px-4 py-2.5 text-xs font-bold text-green-700 whitespace-nowrap transition hover:bg-green-100 text-center"
            >
              {secondaryCta.label}
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
