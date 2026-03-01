import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Skilled Trades Marketplace | Kealee Opportunities',
  description: 'Find verified trade workers — journeymen, licensed subcontractors, and specialty trade professionals for project-based placements.',
}

export default function TradesPage() {
  return (
    <main className="max-w-4xl mx-auto px-6 lg:px-10 py-20">
      <div className="text-xs font-bold tracking-[2.5px] uppercase mb-3" style={{ color: '#A84E10' }}>
        Skilled Trades Marketplace
      </div>
      <h1
        className="text-5xl font-bold mb-3"
        style={{ fontFamily: "'Cormorant Garamond', serif", color: '#0D1F3C' }}
      >
        Find <em>verified</em> trade workers.
      </h1>
      <p className="text-lg font-light leading-relaxed mb-10" style={{ color: '#7A6E60' }}>
        Journeymen, licensed subcontractors, and specialty trade professionals — available for
        project-based placements. Credential-verified before their profile goes live.
      </p>

      <div className="rounded-2xl p-10 text-center" style={{ background: 'rgba(168,78,16,.04)', border: '1.5px solid rgba(168,78,16,.12)' }}>
        <div className="text-5xl mb-4">&#128295;</div>
        <h2 className="text-2xl font-bold mb-3" style={{ color: '#0D1F3C' }}>Coming in 2026</h2>
        <p className="text-base font-light leading-relaxed mb-6 max-w-md mx-auto" style={{ color: '#7A6E60' }}>
          The Skilled Trades Marketplace is currently in development. Join the interest list
          to get early access when we launch.
        </p>
        <Link
          href="/opportunities/interest"
          className="inline-flex items-center px-8 py-3.5 rounded-lg font-semibold text-[15px] text-white"
          style={{ background: '#A84E10' }}
        >
          Join Interest List &rarr;
        </Link>
      </div>
    </main>
  )
}
