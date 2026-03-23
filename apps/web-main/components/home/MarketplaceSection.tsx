import Link from 'next/link'
import { ArrowRight, Shield, Sparkles } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { Heading } from '@/components/ui/Heading'

const CATEGORIES = [
  { emoji: '🏠', title: 'Residential',      desc: 'New homes, additions & ADUs' },
  { emoji: '🔧', title: 'Renovations',       desc: 'Kitchen, bath & whole-home' },
  { emoji: '🏢', title: 'Multifamily',       desc: 'Duplexes to apartments' },
  { emoji: '🏪', title: 'Commercial',        desc: 'Office, retail & restaurants' },
  { emoji: '🏛️', title: 'Government',        desc: 'Public & institutional' },
  { emoji: '🛣️', title: 'Infrastructure',    desc: 'Site work & utilities' },
]

const TRUST = ['Licensed & Insured Verified', 'Background Checked', 'Reference Verified', 'Reputation Scored']

export function MarketplaceSection() {
  return (
    <section className="py-20 bg-white">
      <Container>
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          {/* Left: copy */}
          <div>
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#E8793A' }}>
              Contractor Marketplace
            </span>
            <Heading className="mt-3">Vetted Contractors, Every Trade</Heading>
            <p className="mt-4 text-lg text-gray-600">
              Every contractor in the Kealee network is licensed, insured, background-checked, and reputation-scored. No random directories — just verified professionals ready to build.
            </p>

            <ul className="mt-6 space-y-2.5">
              {TRUST.map(t => (
                <li key={t} className="flex items-center gap-3 text-sm text-gray-700">
                  <Shield className="h-4 w-4 flex-shrink-0" style={{ color: '#2ABFBF' }} />
                  {t}
                </li>
              ))}
            </ul>

            {/* AI Concept Engine callout */}
            <div
              className="mt-8 flex items-start gap-3 rounded-xl p-4"
              style={{ backgroundColor: 'rgba(232,121,58,0.06)', border: '1px solid rgba(232,121,58,0.2)' }}
            >
              <Sparkles className="mt-0.5 h-5 w-5 shrink-0" style={{ color: '#E8793A' }} />
              <div>
                <p className="text-sm font-semibold" style={{ color: '#1A2B4A' }}>Start with an AI Concept Design</p>
                <p className="mt-0.5 text-xs text-gray-500">Get a property-specific design concept, then match to a vetted contractor — all in one platform.</p>
                <Link
                  href="/concept-engine"
                  className="mt-2 inline-flex items-center gap-1 text-xs font-semibold hover:underline"
                  style={{ color: '#E8793A' }}
                >
                  Start AI Concept — From $395 <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/marketplace" className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90" style={{ backgroundColor: '#E8793A' }}>
                Browse Contractors <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/contractor/register" className="inline-flex items-center gap-2 rounded-xl border-2 px-5 py-2.5 text-sm font-semibold hover:bg-teal-50" style={{ borderColor: '#2ABFBF', color: '#2ABFBF' }}>
                Join as GC / Contractor
              </Link>
            </div>
          </div>

          {/* Right: categories grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {CATEGORIES.map(cat => (
              <Link
                key={cat.title}
                href={`/marketplace?category=${cat.title.toLowerCase()}`}
                className="group flex flex-col items-center rounded-xl border border-gray-200 p-5 text-center transition-all hover:border-teal hover:shadow-sm hover:-translate-y-0.5"
              >
                <span className="mb-3 text-2xl">{cat.emoji}</span>
                <p className="text-sm font-semibold group-hover:text-teal-700" style={{ color: '#1A2B4A' }}>{cat.title}</p>
                <p className="mt-0.5 text-xs text-gray-400">{cat.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </Container>
    </section>
  )
}
