'use client'

import { useState } from 'react'
import { AlertTriangle, CheckCircle2, Info, ChevronDown, ChevronUp } from 'lucide-react'

interface Observation {
  id: string
  zone: string
  label: string
  description?: string | null
  severity?: string | null
  confidence?: number | null
  spatial_node_key?: string | null
  system_node_key?: string | null
}

interface TwinObservationListProps {
  observations: Observation[]
}

const SEVERITY_META: Record<string, { icon: React.ReactNode; color: string; bg: string; border: string }> = {
  critical: {
    icon: <AlertTriangle className="h-4 w-4" />,
    color: '#9F1239',
    bg: '#FFF1F2',
    border: '#FECDD3',
  },
  major: {
    icon: <AlertTriangle className="h-4 w-4" />,
    color: '#C2410C',
    bg: '#FFF7ED',
    border: '#FED7AA',
  },
  minor: {
    icon: <Info className="h-4 w-4" />,
    color: '#92400E',
    bg: '#FFFBEB',
    border: '#FDE68A',
  },
  informational: {
    icon: <CheckCircle2 className="h-4 w-4" />,
    color: '#166534',
    bg: '#F0FDF4',
    border: '#BBF7D0',
  },
}

const ZONE_LABEL = (zone: string) =>
  zone.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

export function TwinObservationList({ observations }: TwinObservationListProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [filter, setFilter] = useState<string | null>(null)

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const severities = ['critical', 'major', 'minor', 'informational']
  const filtered = filter ? observations.filter((o) => o.severity === filter) : observations

  // Sort: critical first, then major, minor, informational
  const SEVERITY_ORDER: Record<string, number> = {
    critical: 0,
    major: 1,
    minor: 2,
    informational: 3,
  }
  const sorted = [...filtered].sort(
    (a, b) =>
      (SEVERITY_ORDER[a.severity ?? 'informational'] ?? 3) -
      (SEVERITY_ORDER[b.severity ?? 'informational'] ?? 3),
  )

  // Count by severity
  const counts: Record<string, number> = {}
  for (const obs of observations) {
    const sev = obs.severity ?? 'informational'
    counts[sev] = (counts[sev] ?? 0) + 1
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold" style={{ color: '#1A2B4A' }}>
          Observations
        </h3>
        <span className="text-sm text-gray-400">{observations.length} total</span>
      </div>

      {/* Severity filter */}
      {observations.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            onClick={() => setFilter(null)}
            className="rounded-full px-3 py-1 text-xs font-medium transition-colors"
            style={
              filter === null
                ? { backgroundColor: '#1A2B4A', color: '#fff' }
                : { backgroundColor: '#F3F4F6', color: '#6B7280' }
            }
          >
            All
          </button>
          {severities.map((sev) => {
            if (!counts[sev]) return null
            const meta = SEVERITY_META[sev]
            return (
              <button
                key={sev}
                onClick={() => setFilter(sev === filter ? null : sev)}
                className="rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors"
                style={
                  filter === sev
                    ? { backgroundColor: meta.color, color: '#fff' }
                    : { backgroundColor: meta.bg, color: meta.color }
                }
              >
                {sev} ({counts[sev]})
              </button>
            )
          })}
        </div>
      )}

      {/* List */}
      {sorted.length === 0 ? (
        <div className="py-8 text-center text-sm text-gray-400">
          {observations.length === 0
            ? 'No observations yet. Complete a capture to generate AI observations.'
            : 'No observations match this filter.'}
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((obs) => {
            const sev = obs.severity ?? 'informational'
            const meta = SEVERITY_META[sev] ?? SEVERITY_META.informational
            const isExpanded = expandedIds.has(obs.id)
            return (
              <div
                key={obs.id}
                className="rounded-xl border p-4 transition-colors"
                style={{ backgroundColor: meta.bg, borderColor: meta.border }}
              >
                <button
                  onClick={() => toggleExpand(obs.id)}
                  className="flex w-full items-start gap-2.5 text-left"
                >
                  <span style={{ color: meta.color }} className="mt-0.5 flex-shrink-0">
                    {meta.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold" style={{ color: meta.color }}>
                      {obs.label}
                    </p>
                    <p className="mt-0.5 text-xs" style={{ color: meta.color, opacity: 0.7 }}>
                      {ZONE_LABEL(obs.zone)}
                      {obs.confidence != null && (
                        <> · {Math.round(obs.confidence * 100)}% confidence</>
                      )}
                    </p>
                  </div>
                  {obs.description && (
                    <span style={{ color: meta.color }} className="flex-shrink-0 opacity-60">
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </span>
                  )}
                </button>
                {isExpanded && obs.description && (
                  <p className="mt-2 pl-6 text-sm leading-relaxed" style={{ color: meta.color, opacity: 0.85 }}>
                    {obs.description}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
