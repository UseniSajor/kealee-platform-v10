'use client'

import { CheckCircle2 } from 'lucide-react'

interface Stage {
  label: string
  sublabel?: string
}

const STAGES: Stage[] = [
  { label: 'Concept Package', sublabel: 'powered by AI tools design' },
  { label: 'Permit / Pricing',  sublabel: 'Permit-ready or firm estimate' },
  { label: 'Contractor Match',  sublabel: 'Licensed professionals' },
  { label: 'Break Ground',      sublabel: 'Build it' },
]

interface BuildJourneyProgressProps {
  /** 0-based index of the current stage (0 = Concept, 1 = Permit/Pricing, etc.) */
  currentStage?: number
  className?: string
}

/**
 * Linear 4-stage build journey progress bar.
 * Placed at the top of deliverables pages and in the results-ready banner
 * to show customers where they are in the path from Concept → Build.
 */
export function BuildJourneyProgress({
  currentStage = 0,
  className = '',
}: BuildJourneyProgressProps) {
  return (
    <div className={`rounded-2xl bg-white border border-gray-100 px-5 py-4 ${className}`}
      style={{ boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.06)' }}>
      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Your Build Journey</p>
      <div className="flex items-start gap-0">
        {STAGES.map((stage, i) => {
          const completed = i < currentStage
          const active    = i === currentStage
          const upcoming  = i > currentStage
          const isLast    = i === STAGES.length - 1

          return (
            <div key={i} className="flex flex-1 items-start min-w-0">
              {/* Stage node */}
              <div className="flex flex-col items-center flex-shrink-0">
                <div className={`flex h-7 w-7 items-center justify-center rounded-full border-2 transition-all ${
                  completed ? 'border-green-500 bg-green-500'
                  : active   ? 'border-[#E8724B] bg-[#E8724B]'
                  : 'border-gray-200 bg-white'
                }`}>
                  {completed ? (
                    <CheckCircle2 className="h-4 w-4 text-white" />
                  ) : (
                    <span className={`text-[11px] font-bold ${active ? 'text-white' : 'text-gray-300'}`}>
                      {i + 1}
                    </span>
                  )}
                </div>
                <div className="mt-1.5 text-center px-1">
                  <p className={`text-[11px] font-bold leading-tight ${
                    completed ? 'text-green-600'
                    : active   ? 'text-[#1A2B4A]'
                    : 'text-gray-300'
                  }`}>{stage.label}</p>
                  {stage.sublabel && (
                    <p className={`text-[10px] leading-tight mt-0.5 ${
                      active ? 'text-gray-400' : 'text-gray-200'
                    }`}>{stage.sublabel}</p>
                  )}
                  {active && (
                    <span className="mt-1 inline-block rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white"
                      style={{ backgroundColor: '#E8724B' }}>
                      You are here
                    </span>
                  )}
                </div>
              </div>
              {/* Connector line */}
              {!isLast && (
                <div className={`flex-1 h-0.5 mt-3.5 mx-1 transition-all ${
                  completed ? 'bg-green-400' : 'bg-gray-100'
                }`} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
