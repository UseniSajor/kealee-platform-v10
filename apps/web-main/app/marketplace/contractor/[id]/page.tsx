'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { ArrowRight, Users, CheckCircle } from 'lucide-react'

const BUDGET_RANGES = [
  'Under $10,000',
  '$10,000 – $25,000',
  '$25,000 – $50,000',
  '$50,000 – $100,000',
  '$100,000 – $250,000',
  '$250,000+',
]

const TIMELINES = [
  'ASAP',
  '1–3 months',
  '3–6 months',
  '6–12 months',
  'Flexible',
]

export default function ContractorInquiryPage() {
  const params = useParams()
  const contractorId = params?.id as string

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    description: '',
    budget: '',
    timeline: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/intake/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, contractorId }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error ?? 'Submission failed')
      }

      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center bg-white rounded-2xl shadow-sm border border-gray-100 p-10">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Inquiry Submitted!</h2>
          <p className="text-gray-500 mb-6">
            Our network of vetted contractors has been notified. You'll hear back within 1 business day.
          </p>
          <a
            href="/marketplace"
            className="inline-flex items-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-700 px-6 py-3 text-sm font-bold text-white transition"
          >
            Back to Marketplace <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section
        className="py-16 px-4 text-center"
        style={{ background: 'linear-gradient(135deg, #1A2B4A 0%, #0F1D34 100%)' }}
      >
        <div className="mx-auto max-w-2xl">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/10">
            <Users className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">
            Connecting You with Vetted Contractors
          </h1>
          <p className="text-white/60 max-w-xl mx-auto">
            Our network of vetted contractors will be notified of your project. Fill out the form below and a qualified pro will reach out within 1 business day.
          </p>
        </div>
      </section>

      {/* Form */}
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Project Inquiry</h2>
          <p className="text-sm text-gray-500 mb-8">
            Tell us about your project. Our contractors are licensed, insured, and background-checked.
          </p>

          {error && (
            <div className="mb-6 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name *</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Jane Smith"
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm placeholder-gray-400 focus:border-[#2ABFBF] focus:outline-none focus:ring-2 focus:ring-[#2ABFBF]/20"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email *</label>
                <input
                  type="email"
                  name="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  placeholder="jane@example.com"
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm placeholder-gray-400 focus:border-[#2ABFBF] focus:outline-none focus:ring-2 focus:ring-[#2ABFBF]/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone</label>
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="(555) 000-0000"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm placeholder-gray-400 focus:border-[#2ABFBF] focus:outline-none focus:ring-2 focus:ring-[#2ABFBF]/20"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Project Description *</label>
              <textarea
                name="description"
                required
                value={form.description}
                onChange={handleChange}
                rows={4}
                placeholder="Describe your project (e.g. kitchen remodel, 200 sq ft, open concept layout, new appliances...)"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm placeholder-gray-400 focus:border-[#2ABFBF] focus:outline-none focus:ring-2 focus:ring-[#2ABFBF]/20 resize-none"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Budget Range</label>
                <select
                  name="budget"
                  value={form.budget}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 focus:border-[#2ABFBF] focus:outline-none focus:ring-2 focus:ring-[#2ABFBF]/20"
                >
                  <option value="">Select a range</option>
                  {BUDGET_RANGES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Timeline</label>
                <select
                  name="timeline"
                  value={form.timeline}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 focus:border-[#2ABFBF] focus:outline-none focus:ring-2 focus:ring-[#2ABFBF]/20"
                >
                  <option value="">Select timeline</option>
                  {TIMELINES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-700 disabled:opacity-60 px-6 py-3.5 text-sm font-bold text-white transition"
            >
              {submitting ? 'Submitting...' : (
                <>Submit Inquiry <ArrowRight className="h-4 w-4" /></>
              )}
            </button>
          </form>
        </div>

        {/* Trust badges */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          {[
            { icon: '🔒', label: 'Licensed & Insured' },
            { icon: '✅', label: 'Background Checked' },
            { icon: '⚡', label: '1-Day Response' },
          ].map((badge) => (
            <div key={badge.label} className="rounded-xl bg-white border border-gray-100 p-4">
              <div className="text-2xl mb-1">{badge.icon}</div>
              <p className="text-xs font-semibold text-gray-600">{badge.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
