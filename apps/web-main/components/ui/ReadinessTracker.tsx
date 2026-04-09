'use client'

import { CheckCircle2, Circle, Lock } from 'lucide-react'

export interface ReadinessStep {
  key: string
  label: string
  description: string
  ready: boolean
  blocked?: boolean
}

interface ReadinessTrackerProps {
  steps?: ReadinessStep[]
  compact?: boolean
  className?: string
}

const DEFAULT_STEPS: ReadinessStep[] = [
  {
    key: 'landReady',
    label: 'Land checked',
    description: 'Zoning and buildability reviewed',
    ready: false,
  },
  {
    key: 'conceptReady',
    label: 'Concept ready',
    description: 'AI design concept delivered',
    ready: false,
  },
  {
    key: 'permitReady',
    label: 'Permit path confirmed',
    description: 'Active permit case opened',
    ready: false,
  },
  {
    key: 'contractorReady',
    label: 'Contractor match ready',
    description: 'Project qualified for matching',
    ready: false,
  },
  {
    key: 'constructionReady',
    label: 'Build oversight (optional)',
    description: 'PM and escrow protection active',
    ready: false,
  },
]

export function ReadinessTracker({ steps = DEFAULT_STEPS, compact = false, className = '' }: ReadinessTrackerProps) {
  const completedCount = steps.filter((s) => s.ready).length

  if (compact) {
    return (
      <div className={`flex flex-wrap gap-2 ${className}`}>
        {steps.map((step) => (
          <span
            key={step.key}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
              step.ready
                ? 'bg-[#2ABFBF]/10 text-[#2ABFBF]'
                : step.blocked
                ? 'bg-red-50 text-red-500'
                : 'bg-gray-100 text-gray-500'
            }`}
          >
            {step.ready ? (
              <CheckCircle2 className="h-3 w-3" />
            ) : step.blocked ? (
              <Lock className="h-3 w-3" />
            ) : (
              <Circle className="h-3 w-3" />
            )}
            {step.label}
          </span>
        ))}
      </div>
    )
  }

  return (
    <div className={`rounded-xl border border-gray-200 bg-white p-6 ${className}`}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display font-semibold text-[#1A2B4A]">Project Readiness</h3>
        <span className="text-sm font-medium text-gray-500">
          {completedCount} / {steps.length} complete
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-6 h-2 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-[#2ABFBF] transition-all duration-500"
          style={{ width: `${(completedCount / steps.length) * 100}%` }}
        />
      </div>

      <div className="space-y-3">
        {steps.map((step, i) => {
          const isReady = step.ready
          const isBlocked = step.blocked
          const isPending = !isReady && !isBlocked

          return (
            <div
              key={step.key}
              className={`flex items-start gap-3 rounded-lg p-3 ${
                isReady
                  ? 'bg-[#2ABFBF]/5'
                  : isBlocked
                  ? 'bg-red-50'
                  : 'bg-gray-50'
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {isReady ? (
                  <CheckCircle2 className="h-5 w-5 text-[#2ABFBF]" />
                ) : isBlocked ? (
                  <Lock className="h-5 w-5 text-red-400" />
                ) : (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-gray-300">
                    <span className="text-xs font-bold text-gray-400">{i + 1}</span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-medium ${
                    isReady ? 'text-[#2ABFBF]' : isBlocked ? 'text-red-500' : 'text-gray-700'
                  }`}
                >
                  {step.label}
                </p>
                <p className="mt-0.5 text-xs text-gray-500">{step.description}</p>
              </div>
              {isReady && (
                <span className="shrink-0 rounded-full bg-[#2ABFBF]/10 px-2 py-0.5 text-xs font-medium text-[#2ABFBF]">
                  Done
                </span>
              )}
              {isBlocked && (
                <span className="shrink-0 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-500">
                  Blocked
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default ReadinessTracker
