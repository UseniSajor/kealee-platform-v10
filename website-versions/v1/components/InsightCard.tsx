'use client'

import { AlertCircle, TrendingUp, CheckCircle2 } from 'lucide-react'

interface InsightCardProps {
  summary: string
  risks: string[]
  timeline?: string
  confidence?: number
  nextStep?: string
  loading?: boolean
}

export default function InsightCard({
  summary,
  risks,
  timeline,
  confidence,
  nextStep,
  loading = false,
}: InsightCardProps) {
  if (loading) {
    return (
      <div className="rounded-xl bg-white border border-slate-200 p-8 animate-pulse">
        <div className="h-6 bg-slate-200 rounded w-3/4 mb-4" />
        <div className="space-y-2">
          <div className="h-4 bg-slate-200 rounded w-full" />
          <div className="h-4 bg-slate-200 rounded w-5/6" />
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl bg-white border border-slate-200 p-8 space-y-6">
      {/* Header with confidence */}
      <div className="flex items-start justify-between">
        <h2 className="text-2xl font-bold text-slate-900">Project Analysis</h2>
        {confidence !== undefined && (
          <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-lg">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <span className="font-semibold text-blue-900">{confidence}% Confidence</span>
          </div>
        )}
      </div>

      {/* Summary */}
      <div>
        <h3 className="text-sm font-semibold text-slate-500 uppercase mb-2">Summary</h3>
        <p className="text-lg text-slate-700 leading-relaxed">{summary}</p>
      </div>

      {/* Risks */}
      {risks && risks.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-500 uppercase mb-3">Key Considerations</h3>
          <ul className="space-y-2">
            {risks.map((risk, i) => (
              <li key={i} className="flex gap-3 text-slate-700">
                <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                <span>{risk}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Timeline & Next Step */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200">
        {timeline && (
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Timeline</p>
            <p className="text-lg font-bold text-slate-900">{timeline}</p>
          </div>
        )}
        {nextStep && (
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Next Step</p>
            <p className="text-sm font-medium text-slate-900">{nextStep}</p>
          </div>
        )}
      </div>
    </div>
  )
}
