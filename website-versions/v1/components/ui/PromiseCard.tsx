'use client'

/**
 * components/ui/PromiseCard.tsx
 *
 * Displays service availability decision with promised delivery date.
 * Used on permit pages, estimate pages, and concept engine pages.
 */

import { useEffect, useState } from 'react'

export type AvailabilityDecision = 'GUARANTEED' | 'TARGET' | 'CONDITIONAL' | 'UNAVAILABLE'

export interface AvailabilityData {
  decision: AvailabilityDecision
  promisedCompleteAt: string | null
  sameDayEligible: boolean
  confidenceScore: number
  explanation: string
  missingRequirements: string[]
  turnaroundDays: number | null
}

interface PromiseCardProps {
  serviceType: string
  projectAddress?: string
  hasPlans?: boolean
  projectDescription?: string
  jurisdiction?: string
  className?: string
}

const DECISION_CONFIG: Record<AvailabilityDecision, { color: string; bg: string; icon: string; label: string }> = {
  GUARANTEED: { color: 'text-green-700', bg: 'bg-green-50 border-green-200', icon: '✓', label: 'Guaranteed Delivery' },
  TARGET:     { color: 'text-blue-700',  bg: 'bg-blue-50 border-blue-200',   icon: '◎', label: 'Target Delivery'    },
  CONDITIONAL:{ color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', icon: '⚠', label: 'Conditional Start'  },
  UNAVAILABLE:{ color: 'text-red-700',   bg: 'bg-red-50 border-red-200',     icon: '✕', label: 'Currently Unavailable' },
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export function PromiseCard({ serviceType, projectAddress, hasPlans, projectDescription, jurisdiction, className = '' }: PromiseCardProps) {
  const [data, setData] = useState<AvailabilityData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL ?? ''
    fetch(`${apiBase}/api/v1/availability/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ serviceType, projectAddress, hasPlans, projectDescription, jurisdiction }),
    })
      .then(r => r.ok ? r.json() : null)
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [serviceType, projectAddress, hasPlans, projectDescription, jurisdiction])

  if (loading) {
    return (
      <div className={`border rounded-lg p-4 animate-pulse bg-gray-50 ${className}`}>
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
      </div>
    )
  }

  if (!data) return null

  const config = DECISION_CONFIG[data.decision]

  return (
    <div className={`border rounded-lg p-4 ${config.bg} ${className}`}>
      <div className="flex items-start gap-3">
        <span className={`text-lg font-bold ${config.color}`}>{config.icon}</span>
        <div className="flex-1 min-w-0">
          <div className={`font-semibold text-sm ${config.color}`}>{config.label}</div>
          <p className="text-sm text-gray-700 mt-1">{data.explanation}</p>

          {data.promisedCompleteAt && data.decision !== 'UNAVAILABLE' && (
            <div className="mt-2 text-sm">
              <span className="text-gray-500">Est. completion: </span>
              <span className={`font-medium ${config.color}`}>{formatDate(data.promisedCompleteAt)}</span>
              {data.sameDayEligible && (
                <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Same-day eligible</span>
              )}
            </div>
          )}

          {data.missingRequirements.length > 0 && (
            <ul className="mt-2 space-y-1">
              {data.missingRequirements.map((req, i) => (
                <li key={i} className="text-xs text-amber-700 flex items-center gap-1">
                  <span>•</span> {req}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
