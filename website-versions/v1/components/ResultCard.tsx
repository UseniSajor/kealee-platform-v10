'use client'

import Link from 'next/link'
import { CheckCircle2, AlertCircle, ArrowRight, Calendar, DollarSign } from 'lucide-react'

interface Result {
  success?: boolean
  summary: string
  risks?: string[]
  recommendations?: string
  nextStep?: string
  cta?: string
  cost?: { min: number; max: number }
  timeline?: string
}

interface ResultCardProps {
  result: Result
  projectPath?: string
}

export default function ResultCard({ result, projectPath }: ResultCardProps) {
  const getCtaLink = (cta?: string, projectPath?: string): string => {
    if (!cta) return '/intake/exterior_concept'

    const lower = cta.toLowerCase()
    if (lower.includes('permit')) return '/intake/permit_path_only'
    if (lower.includes('design') || lower.includes('upgrade')) return '/intake/whole_home_concept'
    if (lower.includes('contractor')) return '/intake/contractor_match'
    if (projectPath) return `/intake/${projectPath}`

    return '/intake/exterior_concept'
  }

  const ctaLink = getCtaLink(result.cta, projectPath)
  const ctaLabel = result.cta || 'Continue'

  return (
    <div className="space-y-8">
      {/* Success Header */}
      <div className="rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 p-8">
        <div className="flex items-start gap-4">
          <CheckCircle2 className="w-8 h-8 text-green-600 flex-shrink-0 mt-1" />
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Project Analysis Complete</h2>
            <p className="text-slate-600 mt-2">Here's what we found and what comes next.</p>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="rounded-xl bg-white border border-slate-200 p-8">
        <h3 className="text-sm font-semibold text-slate-500 uppercase mb-3">Summary</h3>
        <p className="text-lg text-slate-700 leading-relaxed">{result.summary}</p>
      </div>

      {/* Key Details Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {result.timeline && (
          <div className="rounded-xl bg-blue-50 border border-blue-200 p-6">
            <div className="flex items-center gap-3 mb-3">
              <Calendar className="w-5 h-5 text-blue-600" />
              <h4 className="font-semibold text-blue-900">Timeline</h4>
            </div>
            <p className="text-lg font-bold text-blue-950">{result.timeline}</p>
          </div>
        )}
        {result.cost && (
          <div className="rounded-xl bg-orange-50 border border-orange-200 p-6">
            <div className="flex items-center gap-3 mb-3">
              <DollarSign className="w-5 h-5 text-orange-600" />
              <h4 className="font-semibold text-orange-900">Estimated Cost</h4>
            </div>
            <p className="text-lg font-bold text-orange-950">
              ${(result.cost.min / 1000).toFixed(0)}K – ${(result.cost.max / 1000).toFixed(0)}K
            </p>
          </div>
        )}
      </div>

      {/* Risks / Considerations */}
      {result.risks && result.risks.length > 0 && (
        <div className="rounded-xl bg-white border border-slate-200 p-8">
          <h3 className="text-sm font-semibold text-slate-500 uppercase mb-4">Key Considerations</h3>
          <ul className="space-y-3">
            {result.risks.map((risk, i) => (
              <li key={i} className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                <span className="text-slate-700">{risk}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommendations */}
      {result.recommendations && (
        <div className="rounded-xl bg-slate-50 border border-slate-200 p-8">
          <h3 className="text-sm font-semibold text-slate-500 uppercase mb-3">Recommendations</h3>
          <p className="text-slate-700 leading-relaxed">{result.recommendations}</p>
        </div>
      )}

      {/* Next Steps */}
      {result.nextStep && (
        <div className="rounded-xl bg-white border-2 border-orange-200 p-8">
          <h3 className="text-lg font-bold text-slate-900 mb-3">What's Next?</h3>
          <p className="text-slate-600 mb-6">{result.nextStep}</p>
          <Link href={ctaLink}>
            <button className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 px-8 rounded-xl flex items-center justify-center gap-2 transition">
              {ctaLabel}
              <ArrowRight className="w-5 h-5" />
            </button>
          </Link>
        </div>
      )}

      {/* Fallback CTA */}
      {!result.nextStep && (
        <div className="rounded-xl bg-white border-2 border-orange-200 p-8 text-center">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Ready for the Next Step?</h3>
          <p className="text-slate-600 mb-6">Explore additional services to move your project forward.</p>
          <Link href={ctaLink}>
            <button className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 px-8 rounded-xl flex items-center justify-center gap-2 transition">
              Continue
              <ArrowRight className="w-5 h-5" />
            </button>
          </Link>
        </div>
      )}
    </div>
  )
}
