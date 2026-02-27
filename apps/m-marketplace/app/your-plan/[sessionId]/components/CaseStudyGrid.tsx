'use client'

import Image from 'next/image'
import { MapPin, Calendar, DollarSign } from 'lucide-react'

interface CaseStudyCardData {
  id: string
  title: string
  description: string
  city: string
  state: string
  budget: number
  durationWeeks: number
  beforeImageUrl: string | null
  afterImageUrl: string | null
  highlights: string[]
}

interface CaseStudyGridData {
  title: string
  caseStudies: CaseStudyCardData[]
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
}

export function CaseStudyGrid({ data }: { data: CaseStudyGridData }) {
  if (data.caseStudies.length === 0) {
    return (
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-neutral-900">{data.title}</h2>
        <div className="bg-neutral-50 rounded-2xl p-8 text-center border border-neutral-100">
          <p className="text-neutral-500">Case studies for your project type coming soon.</p>
        </div>
      </section>
    )
  }

  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-bold text-neutral-900">{data.title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.caseStudies.map((cs) => (
          <div
            key={cs.id}
            className="bg-white rounded-2xl border border-neutral-100 overflow-hidden hover:shadow-lg transition-shadow"
          >
            {/* Before/After images */}
            {(cs.beforeImageUrl || cs.afterImageUrl) && (
              <div className="grid grid-cols-2 h-40">
                <div className="bg-neutral-200 relative">
                  {cs.beforeImageUrl ? (
                    <Image src={cs.beforeImageUrl} alt="Before" fill className="object-cover" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-xs text-neutral-400">Before</div>
                  )}
                  <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">Before</span>
                </div>
                <div className="bg-neutral-200 relative">
                  {cs.afterImageUrl ? (
                    <Image src={cs.afterImageUrl} alt="After" fill className="object-cover" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-xs text-neutral-400">After</div>
                  )}
                  <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">After</span>
                </div>
              </div>
            )}

            <div className="p-5">
              <h3 className="font-bold text-neutral-900 mb-2">{cs.title}</h3>
              <p className="text-sm text-neutral-600 line-clamp-2 mb-3">{cs.description}</p>

              <div className="flex flex-wrap gap-3 text-xs text-neutral-500">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {cs.city}, {cs.state}
                </span>
                <span className="flex items-center gap-1">
                  <DollarSign className="w-3 h-3" />
                  {formatCurrency(cs.budget)}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {cs.durationWeeks} weeks
                </span>
              </div>

              {cs.highlights.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {cs.highlights.slice(0, 3).map((h) => (
                    <span key={h} className="bg-indigo-50 text-indigo-700 text-[10px] font-medium px-2 py-0.5 rounded-full">
                      {h}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
