import type { Metadata } from 'next'
import { PreDesignCards } from './PreDesignCards'

export const metadata: Metadata = {
  title: 'AI Pre-Design — Kealee',
  description: 'Property-specific pre-design packages powered by AI. Exterior facade, interior addition, or landscape — delivered in 2–5 business days.',
}

export default function PreDesignEntryPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F7FAFC' }}>
      <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <span
            className="inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest mb-4"
            style={{ backgroundColor: 'rgba(232,121,58,0.1)', color: '#E8793A' }}
          >
            AI Pre-Design
          </span>
          <h1 className="text-4xl font-bold font-display" style={{ color: '#1A2B4A' }}>
            What are you designing?
          </h1>
          <p className="mt-4 text-lg text-gray-500 max-w-xl mx-auto">
            Property-specific AI concept packages. Delivered in 2–5 business days.
          </p>
        </div>

        {/* Type cards */}
        <PreDesignCards />

        {/* Trust bar */}
        <div className="mt-12 flex flex-wrap justify-center gap-6 text-sm text-gray-400">
          <span>AI-powered analysis</span>
          <span>·</span>
          <span>Property-specific outputs</span>
          <span>·</span>
          <span>Architect-ready packages</span>
          <span>·</span>
          <span>2–5 business day delivery</span>
        </div>
      </div>
    </div>
  )
}
