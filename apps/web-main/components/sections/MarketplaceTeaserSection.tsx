import Link from 'next/link'
import { ArrowRight, Star, CheckCircle } from 'lucide-react'

const MOCK_CONTRACTORS = [
  { name: 'Marcus T.',        trade: 'General Contractor', area: 'Fairfax, VA',        rating: 4.9, jobs: 47 },
  { name: 'Rivera HVAC',      trade: 'HVAC Specialist',    area: 'Montgomery, MD',     rating: 4.8, jobs: 31 },
  { name: 'Blue Ridge Deck',  trade: 'Exterior & Decking', area: 'Northern Virginia',  rating: 4.7, jobs: 62 },
]

export function MarketplaceTeaserSection() {
  return (
    <section id="marketplace" className="py-20 bg-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div>
            <span className="section-label">Contractor Marketplace</span>
            <h2 className="mt-3 text-3xl font-bold font-display sm:text-4xl" style={{ color: '#1A2B4A' }}>
              Find the Right Pro for Your Project
            </h2>
            <p className="mt-4 max-w-lg text-gray-500">
              Browse AI-vetted, background-checked contractors. Every profile shows verified licenses, real reviews, and work history.
            </p>
          </div>
          <Link
            href="/marketplace"
            className="inline-flex flex-shrink-0 items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: '#C8521A' }}
          >
            Browse All Contractors <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          {MOCK_CONTRACTORS.map(c => (
            <div
              key={c.name}
              className="rounded-2xl border border-gray-100 bg-white p-6 transition-shadow hover:shadow-md"
            >
              {/* Avatar placeholder */}
              <div
                className="mb-4 flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold text-white"
                style={{ background: '#1A2B4A' }}
              >
                {c.name[0]}
              </div>

              <div className="flex items-start justify-between">
                <div>
                  <p className="font-bold" style={{ color: '#1A1C1B' }}>{c.name}</p>
                  <p className="text-sm text-gray-500">{c.trade}</p>
                  <p className="text-xs text-gray-400">{c.area}</p>
                </div>
                <div className="flex items-center gap-1 rounded-full px-2.5 py-1" style={{ background: '#F5F4F0' }}>
                  <Star className="h-3 w-3" style={{ color: '#C8521A' }} fill="#C8521A" />
                  <span className="text-xs font-bold" style={{ color: '#1A1C1B' }}>{c.rating}</span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-gray-400">{c.jobs} jobs completed</span>
                <div className="flex items-center gap-1 text-xs font-semibold" style={{ color: '#3A7D52' }}>
                  <CheckCircle className="h-3 w-3" />
                  Verified
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
