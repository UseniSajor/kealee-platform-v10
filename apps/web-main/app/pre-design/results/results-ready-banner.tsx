'use client'

import Link from 'next/link'
import { CheckCircle2, AlertCircle, DollarSign, Zap, FileText } from 'lucide-react'

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
}

export function ResultsReadyBanner({
  projectId,
  status,
  deliverables,
  confidence,
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

  return (
    <div className="rounded-2xl border-l-4 border-green-500 bg-gradient-to-r from-green-50 to-emerald-50 p-6 mb-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <CheckCircle2 className="h-6 w-6 mt-0.5 text-green-600 flex-shrink-0" />
          <div>
            <h3 className="text-lg font-bold text-green-900 mb-1">✨ Results Ready</h3>
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
            <div className="grid gap-2 mt-3 mb-4">
              <div className="flex items-center gap-2 text-sm">
                <div
                  className={`h-4 w-4 rounded flex items-center justify-center flex-shrink-0 ${
                    deliverables.concept ? 'bg-green-600' : 'bg-gray-200'
                  }`}
                >
                  {deliverables.concept && <CheckCircle2 className="h-3 w-3 text-white" />}
                </div>
                <span className={deliverables.concept ? 'font-bold text-green-900' : 'text-gray-600'}>
                  Concept Images & Design Direction
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <div
                  className={`h-4 w-4 rounded flex items-center justify-center flex-shrink-0 ${
                    deliverables.budget ? 'bg-green-600' : 'bg-gray-200'
                  }`}
                >
                  {deliverables.budget && <CheckCircle2 className="h-3 w-3 text-white" />}
                </div>
                <span className={deliverables.budget ? 'font-bold text-green-900' : 'text-gray-600'}>
                  Budget Range & Cost Estimate
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <div
                  className={`h-4 w-4 rounded flex items-center justify-center flex-shrink-0 ${
                    deliverables.feasibility ? 'bg-green-600' : 'bg-gray-200'
                  }`}
                >
                  {deliverables.feasibility && <CheckCircle2 className="h-3 w-3 text-white" />}
                </div>
                <span className={deliverables.feasibility ? 'font-bold text-green-900' : 'text-gray-600'}>
                  Feasibility Analysis & Zoning
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <div
                  className={`h-4 w-4 rounded flex items-center justify-center flex-shrink-0 ${
                    deliverables.permit ? 'bg-green-600' : 'bg-gray-200'
                  }`}
                >
                  {deliverables.permit && <CheckCircle2 className="h-3 w-3 text-white" />}
                </div>
                <span className={deliverables.permit ? 'font-bold text-green-900' : 'text-gray-600'}>
                  Permit Pathway & Requirements
                </span>
              </div>
            </div>

            {/* Next Steps Text */}
            <p className="text-xs text-green-700 font-medium">
              {allReady
                ? "You're all set! Choose your next step below to get started."
                : `${Object.keys(deliverables).length - readyCount} deliverable(s) still processing. Check back in a moment.`}
            </p>
          </div>
        </div>

        {/* Side CTA Buttons */}
        <div className="flex flex-col gap-2 flex-shrink-0">
          <Link
            href={`/intake/permit_path_only/payment?amount=29900${projectId ? `&projectId=${projectId}` : ''}`}
            className="inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-xs font-bold text-white whitespace-nowrap transition"
            style={{ backgroundColor: '#E8793A' }}
          >
            Get Permits
          </Link>
          <Link
            href={`/contractors`}
            className="inline-flex items-center justify-center rounded-lg border border-green-600 px-4 py-2.5 text-xs font-bold text-green-700 whitespace-nowrap transition hover:bg-green-100"
          >
            Find Contractor
          </Link>
        </div>
      </div>
    </div>
  )
}
