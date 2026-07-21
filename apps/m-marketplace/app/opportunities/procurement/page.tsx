import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Government Procurement | Kealee Opportunities',
  description: 'Access federal, state, and municipal construction contracts — GSA, SHA, MDOT, DC Public Works, and 250+ jurisdictions. Filtered for set-aside eligibility.',
}

const AGENCIES = [
  'Federal GSA', 'Maryland SHA', 'DC Public Works', 'MDOT',
  'Municipal RFPs', 'SBSA Set-Asides', '8(a) Contracts', 'DBE Programs',
  'HUBZone', 'WOSB', 'SDVOSB', 'SDB',
]

export default function ProcurementPage() {
  return (
    <main className="max-w-4xl mx-auto px-6 lg:px-10 py-20">
      <div className="text-xs font-bold tracking-[2.5px] uppercase mb-3" style={{ color: '#1A3A6B' }}>
        Government Procurement
      </div>
      <h1
        className="text-5xl font-bold mb-3"
        style={{ fontFamily: "'Cormorant Garamond', serif", color: '#0D1F3C' }}
      >
        Win <em>public sector</em> contracts.
      </h1>
      <p className="text-lg font-light leading-relaxed mb-6" style={{ color: '#7A6E60' }}>
        Federal, state, and municipal construction contracts — tracked in real time. GSA, SHA, MDOT,
        DC Public Works, and 250+ other jurisdictions. Filtered for set-aside eligibility.
      </p>

      <div className="flex flex-wrap gap-2 mb-10">
        {AGENCIES.map((a) => (
          <span
            key={a}
            className="px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{ background: 'rgba(26,58,107,.06)', color: '#1A3A6B', border: '1px solid rgba(26,58,107,.15)' }}
          >
            {a}
          </span>
        ))}
      </div>

      <div className="rounded-2xl p-10 text-center" style={{ background: 'rgba(26,58,107,.04)', border: '1.5px solid rgba(26,58,107,.12)' }}>
        <div className="text-5xl mb-4">&#127963;</div>
        <h2 className="text-2xl font-bold mb-3" style={{ color: '#0D1F3C' }}>Coming in 2026</h2>
        <p className="text-base font-light leading-relaxed mb-6 max-w-md mx-auto" style={{ color: '#7A6E60' }}>
          Government procurement tracking is currently in development. Join the interest list
          to get early access to SAM.gov integration and contract alerts.
        </p>
        <Link
          href="/opportunities/interest"
          className="inline-flex items-center px-8 py-3.5 rounded-lg font-semibold text-[15px] text-white"
          style={{ background: '#1A3A6B' }}
        >
          Join Interest List &rarr;
        </Link>
      </div>
    </main>
  )
}
