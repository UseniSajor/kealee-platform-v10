import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'PM Marketplace | Kealee Opportunities',
  description: 'Find and hire on-demand project managers, embedded PMs, and owner\'s representatives for construction projects.',
}

export default function PMMarketplacePage() {
  return (
    <main className="max-w-4xl mx-auto px-6 lg:px-10 py-20">
      <div className="text-xs font-bold tracking-[2.5px] uppercase mb-3" style={{ color: '#5B2D8E' }}>
        PM Marketplace
      </div>
      <h1
        className="text-5xl font-bold mb-3"
        style={{ fontFamily: "'Cormorant Garamond', serif", color: '#0D1F3C' }}
      >
        Find a PM. Or <em>become</em> one.
      </h1>
      <p className="text-lg font-light leading-relaxed mb-10" style={{ color: '#7A6E60' }}>
        On-demand project managers, embedded PMs, and owner&apos;s representatives — for every
        project size. All vetted, all construction-experienced.
      </p>

      <div className="rounded-2xl p-10 text-center" style={{ background: 'rgba(91,45,142,.04)', border: '1.5px solid rgba(91,45,142,.12)' }}>
        <div className="text-5xl mb-4">&#128203;</div>
        <h2 className="text-2xl font-bold mb-3" style={{ color: '#0D1F3C' }}>Coming in 2026</h2>
        <p className="text-base font-light leading-relaxed mb-6 max-w-md mx-auto" style={{ color: '#7A6E60' }}>
          The PM Marketplace is currently in development. Join the interest list to get early
          access when we launch.
        </p>
        <Link
          href="/opportunities/interest"
          className="inline-flex items-center px-8 py-3.5 rounded-lg font-semibold text-[15px] text-white"
          style={{ background: '#5B2D8E' }}
        >
          Join Interest List &rarr;
        </Link>
      </div>
    </main>
  )
}
