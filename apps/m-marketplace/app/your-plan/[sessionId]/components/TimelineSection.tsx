'use client'

import { CheckCircle2 } from 'lucide-react'

interface TimelinePhase {
  name: string
  durationWeeks: number
  description: string
  order: number
}

interface TimelineData {
  title: string
  totalWeeks: number
  phases: TimelinePhase[]
}

export function TimelineSection({ data }: { data: TimelineData }) {
  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-neutral-900">{data.title}</h2>
        <span className="text-sm font-medium text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
          ~{data.totalWeeks} weeks total
        </span>
      </div>

      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-neutral-200" />

        <div className="space-y-6">
          {data.phases.map((phase, idx) => (
            <div key={phase.name} className="relative flex gap-4">
              <div className="relative z-10 w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                <span className="text-sm font-bold text-indigo-600">{idx + 1}</span>
              </div>
              <div className="bg-white rounded-2xl border border-neutral-100 p-5 flex-1 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-neutral-900">{phase.name}</h3>
                  <span className="text-xs font-medium text-neutral-500 bg-neutral-100 px-2 py-1 rounded-full">
                    {phase.durationWeeks} {phase.durationWeeks === 1 ? 'week' : 'weeks'}
                  </span>
                </div>
                <p className="text-sm text-neutral-600">{phase.description}</p>
              </div>
            </div>
          ))}

          {/* Completion marker */}
          <div className="relative flex gap-4">
            <div className="relative z-10 w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex items-center">
              <p className="font-bold text-green-700">Project Complete</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
