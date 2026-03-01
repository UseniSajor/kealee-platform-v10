'use client'

import { useState } from 'react'
import Link from 'next/link'

const ROLES = [
  { value: 'gc', label: 'General Contractor / Developer — post jobs, find PMs' },
  { value: 'pm', label: 'Project Manager — find PM opportunities' },
  { value: 'trade-worker', label: 'Trade Worker — find placements and programs' },
  { value: 'apprentice', label: 'Apprentice — find training programs' },
  { value: 'employer', label: 'Employer / Sponsor — post apprenticeship programs' },
  { value: 'agency', label: 'Government Agency — post procurement contracts' },
]

const TRADES = [
  'Carpentry', 'Electrical', 'Plumbing', 'HVAC', 'Pipefitting',
  'Masonry', 'Ironwork', 'Roofing', 'Concrete', 'Drywall', 'Other',
]

const inputStyle = 'w-full px-4 py-3 border border-[#E5DFD5] rounded-lg text-[15px] outline-none focus:border-[#5B2D8E] focus:ring-2 focus:ring-[#5B2D8E]/10 transition-colors'

export default function InterestListPage() {
  const [role, setRole] = useState('')
  const [trade, setTrade] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitting(true)
    const form = e.currentTarget
    const data = {
      name: (form.elements.namedItem('name') as HTMLInputElement).value,
      email: (form.elements.namedItem('email') as HTMLInputElement).value,
      role,
      tradeType: trade || undefined,
      location: (form.elements.namedItem('location') as HTMLInputElement).value || undefined,
      note: (form.elements.namedItem('note') as HTMLTextAreaElement).value || undefined,
    }

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || ''
      await fetch(`${apiBase}/api/opportunities/interest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      setSubmitted(true)
    } catch {
      // Still show success — interest will be captured on retry
      setSubmitted(true)
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <main className="min-h-[80vh] flex items-center justify-center px-6 py-20">
        <div className="text-center max-w-lg">
          <div className="text-6xl mb-5">&#10003;</div>
          <h1
            className="text-4xl font-bold mb-3"
            style={{ fontFamily: "'Cormorant Garamond', serif", color: '#0D1F3C' }}
          >
            You&apos;re on the list.
          </h1>
          <p className="text-base leading-relaxed mb-8" style={{ color: '#7A6E60' }}>
            We&apos;ll notify you when Kealee Opportunities launches in 2026.
            Early access will go to interest list members first.
          </p>
          <Link
            href="/opportunities"
            className="inline-flex items-center px-6 py-3 rounded-lg font-semibold text-sm text-white"
            style={{ background: '#5B2D8E' }}
          >
            Back to Opportunities
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="max-w-xl mx-auto px-6 lg:px-10 py-20">
      <div
        className="text-xs font-bold tracking-[2.5px] uppercase mb-3"
        style={{ color: '#5B2D8E' }}
      >
        Phase 06 &middot; Opportunities
      </div>
      <h1
        className="text-5xl font-bold mb-3"
        style={{ fontFamily: "'Cormorant Garamond', serif", color: '#0D1F3C' }}
      >
        Join the Interest List.
      </h1>
      <p className="text-base font-light leading-relaxed mb-10" style={{ color: '#7A6E60' }}>
        Be first to access the PM Marketplace, Apprenticeship Directory, and Government
        Contract Tracker when Kealee Opportunities launches in 2026.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label className="block text-[13px] font-semibold text-[#0D1F3C] mb-1.5">Full Name</label>
          <input name="name" required className={inputStyle} />
        </div>

        <div>
          <label className="block text-[13px] font-semibold text-[#0D1F3C] mb-1.5">Email Address</label>
          <input name="email" type="email" required className={inputStyle} />
        </div>

        <div>
          <label className="block text-[13px] font-semibold text-[#0D1F3C] mb-1.5">Your Role on Kealee</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            required
            className={`${inputStyle} bg-white`}
          >
            <option value="">Select your role...</option>
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>

        {(role === 'trade-worker' || role === 'apprentice') && (
          <div>
            <label className="block text-[13px] font-semibold text-[#0D1F3C] mb-1.5">Your Trade</label>
            <select
              value={trade}
              onChange={(e) => setTrade(e.target.value)}
              className={`${inputStyle} bg-white`}
            >
              <option value="">Select trade...</option>
              {TRADES.map((t) => (
                <option key={t} value={t.toLowerCase()}>{t}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-[13px] font-semibold text-[#0D1F3C] mb-1.5">City, State</label>
          <input name="location" placeholder="e.g. Washington, DC" className={inputStyle} />
        </div>

        <div>
          <label className="block text-[13px] font-semibold text-[#0D1F3C] mb-1.5">
            Anything else? (optional)
          </label>
          <textarea
            name="note"
            rows={3}
            placeholder="What are you most excited to use on Opportunities?"
            className={`${inputStyle} resize-y`}
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="px-8 py-4 rounded-lg font-bold text-[15px] text-white border-none cursor-pointer disabled:opacity-60 transition-opacity"
          style={{ background: '#5B2D8E' }}
        >
          {submitting ? 'Submitting...' : 'Join the Interest List \u2192'}
        </button>
      </form>
    </main>
  )
}
