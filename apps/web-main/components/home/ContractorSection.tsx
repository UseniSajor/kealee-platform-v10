import Link from 'next/link'
import { ArrowRight, CheckCircle } from 'lucide-react'
import { Container } from '@/components/ui/Container'

const BENEFITS = [
  'Get matched to projects that fit your license and capacity',
  'AI-powered bid assistant reduces quote time by 60%',
  'Construction OS: schedule, daily logs, RFIs, punch list',
  'Escrow-protected payment — get paid on milestone completion',
  'Build your reputation score with every verified project',
]

export function ContractorSection() {
  return (
    <section className="py-20" style={{ backgroundColor: '#F7FAFC' }}>
      <Container>
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          {/* Visual */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:order-first">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-semibold" style={{ color: '#1A2B4A' }}>Your Lead Pipeline</span>
              <span className="rounded-full px-2.5 py-0.5 text-xs font-bold text-white" style={{ backgroundColor: '#2ABFBF' }}>3 New</span>
            </div>
            {[
              { project: 'Kitchen Remodel — Bethesda MD',  budget: '$45K–$60K', match: '98%', accent: '#2ABFBF' },
              { project: 'Home Addition — Silver Spring',   budget: '$120K+',     match: '94%', accent: '#38A169' },
              { project: 'Commercial Fit-Out — DC',         budget: '$200K+',     match: '91%', accent: '#E8793A' },
            ].map(lead => (
              <div key={lead.project} className="flex items-center justify-between border-b border-gray-100 py-3 last:border-0">
                <div>
                  <p className="text-sm font-medium" style={{ color: '#1A2B4A' }}>{lead.project}</p>
                  <p className="text-xs text-gray-400">{lead.budget}</p>
                </div>
                <span className="rounded-full px-2.5 py-0.5 text-xs font-bold" style={{ backgroundColor: `${lead.accent}15`, color: lead.accent }}>
                  {lead.match} match
                </span>
              </div>
            ))}
          </div>

          {/* Copy */}
          <div>
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#E8793A' }}>For Contractors</span>
            <h2 className="mt-3 text-3xl font-bold font-display" style={{ color: '#1A2B4A' }}>
              Win More Projects. Build More Efficiently.
            </h2>
            <p className="mt-4 text-gray-600">
              Kealee's smart lead matching connects you with projects that fit your trade, license, capacity, and geography. The Construction OS handles the rest.
            </p>
            <ul className="mt-6 space-y-3">
              {BENEFITS.map(b => (
                <li key={b} className="flex items-start gap-3 text-sm text-gray-700">
                  <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0" style={{ color: '#E8793A' }} />
                  {b}
                </li>
              ))}
            </ul>
            <Link href="/contractors" className="mt-8 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white hover:opacity-90" style={{ backgroundColor: '#E8793A' }}>
              Contractor Overview <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </Container>
    </section>
  )
}
