'use client'

import { Star, CheckCircle2, MapPin, Briefcase } from 'lucide-react'

interface ContractorCardData {
  id: string
  companyName: string
  contactName: string
  city: string | null
  state: string | null
  trades: string[]
  rating: number
  reviewCount: number
  isVerified: boolean
  yearsInBusiness: number | null
}

interface ContractorGridData {
  title: string
  contractors: ContractorCardData[]
}

export function ContractorGrid({ data }: { data: ContractorGridData }) {
  if (data.contractors.length === 0) {
    return (
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-neutral-900">{data.title}</h2>
        <div className="bg-neutral-50 rounded-2xl p-8 text-center border border-neutral-100">
          <p className="text-neutral-500">We&apos;re building our contractor network in your area. Check back soon!</p>
        </div>
      </section>
    )
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-neutral-900">{data.title}</h2>
        <span className="text-sm text-neutral-500">{data.contractors.length} matched</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.contractors.map((contractor) => (
          <div
            key={contractor.id}
            className="bg-white rounded-2xl border border-neutral-100 p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-bold text-neutral-900">{contractor.companyName}</h3>
                <p className="text-sm text-neutral-500">{contractor.contactName}</p>
              </div>
              {contractor.isVerified && (
                <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-xs font-bold px-2 py-1 rounded-full">
                  <CheckCircle2 className="w-3 h-3" />
                  Verified
                </span>
              )}
            </div>

            <div className="flex items-center gap-1 mb-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < Math.round(contractor.rating) ? 'text-amber-400 fill-amber-400' : 'text-neutral-200'
                  }`}
                />
              ))}
              <span className="text-sm text-neutral-500 ml-1">
                ({contractor.reviewCount})
              </span>
            </div>

            <div className="space-y-2 text-sm text-neutral-600">
              {(contractor.city || contractor.state) && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-neutral-400" />
                  {[contractor.city, contractor.state].filter(Boolean).join(', ')}
                </div>
              )}
              {contractor.trades.length > 0 && (
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-neutral-400" />
                  {contractor.trades.slice(0, 3).join(', ')}
                </div>
              )}
              {contractor.yearsInBusiness && (
                <p className="text-xs text-neutral-400">{contractor.yearsInBusiness} years in business</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
