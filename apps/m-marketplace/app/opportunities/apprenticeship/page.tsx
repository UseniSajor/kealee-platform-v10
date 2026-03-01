import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Trade Apprenticeship Programs | Kealee Opportunities',
  description: 'Find registered apprenticeship programs across all construction trades — carpentry, electrical, plumbing, HVAC, pipefitting, masonry, and more.',
}

export default function ApprenticeshipPage() {
  return (
    <main className="max-w-4xl mx-auto px-6 lg:px-10 py-20">
      <div className="text-xs font-bold tracking-[2.5px] uppercase mb-3" style={{ color: '#196B5E' }}>
        Trade Apprenticeship
      </div>
      <h1
        className="text-5xl font-bold mb-3"
        style={{ fontFamily: "'Cormorant Garamond', serif", color: '#0D1F3C' }}
      >
        Train. Earn. <em>Build a career.</em>
      </h1>
      <p className="text-lg font-light leading-relaxed mb-10" style={{ color: '#7A6E60' }}>
        Registered apprenticeship programs across all construction trades — carpentry, electrical,
        plumbing, HVAC, pipefitting, masonry, and more. Find your program or sponsor one.
      </p>

      <div className="rounded-2xl p-10 text-center" style={{ background: 'rgba(25,107,94,.04)', border: '1.5px solid rgba(25,107,94,.12)' }}>
        <div className="text-5xl mb-4">&#127891;</div>
        <h2 className="text-2xl font-bold mb-3" style={{ color: '#0D1F3C' }}>Coming in 2026</h2>
        <p className="text-base font-light leading-relaxed mb-6 max-w-md mx-auto" style={{ color: '#7A6E60' }}>
          The Apprenticeship Directory is currently in development. Join the interest list to get
          early access when we launch.
        </p>
        <Link
          href="/opportunities/interest"
          className="inline-flex items-center px-8 py-3.5 rounded-lg font-semibold text-[15px] text-white"
          style={{ background: '#196B5E' }}
        >
          Join Interest List &rarr;
        </Link>
      </div>
    </main>
  )
}
