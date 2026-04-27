'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react'
import InsightCard from '@/components/InsightCard'
import LoadingState from '@/components/LoadingState'

const AGENT_MAP: Record<string, string> = {
  exterior_concept: 'design', garden_concept: 'design', whole_home_concept: 'design',
  interior_reno_concept: 'design', developer_concept: 'land', kitchen_remodel: 'design',
  bathroom_remodel: 'design', whole_home_remodel: 'design', addition_expansion: 'design',
  permit_path_only: 'permit', cost_estimate: 'design', contractor_match: 'contractor',
  multi_unit_residential: 'land', mixed_use: 'land', commercial_office: 'land',
  development_feasibility: 'land', design_build: 'design', capture_site_concept: 'design',
  townhome_subdivision: 'land', single_family_subdivision: 'land', single_lot_development: 'land',
  interior_renovation: 'design',
}

const PRICE_MAP: Record<string, { label: string; amount: number; delivery: string }> = {
  exterior_concept: { label: 'Exterior Concept Package', amount: 39500, delivery: '3-5 days' },
  garden_concept: { label: 'Garden Concept', amount: 29500, delivery: '2-4 days' },
  whole_home_concept: { label: 'Whole Home Concept', amount: 59500, delivery: '4-6 days' },
  interior_reno_concept: { label: 'Interior Reno Concept', amount: 34500, delivery: '3-5 days' },
  kitchen_remodel: { label: 'Kitchen Design Package', amount: 39500, delivery: '3-5 days' },
  bathroom_remodel: { label: 'Bathroom Design Package', amount: 29500, delivery: '2-4 days' },
  permit_path_only: { label: 'Permit Package', amount: 49900, delivery: '3-5 days' },
  cost_estimate: { label: 'Cost Estimate Package', amount: 59500, delivery: '2-3 days' },
  contractor_match: { label: 'Contractor Match', amount: 19900, delivery: '1 day' },
  development_feasibility: { label: 'Feasibility Study', amount: 149900, delivery: '5-7 days' },
  design_build: { label: 'Design + Build Package', amount: 79500, delivery: '5-7 days' },
  capture_site_concept: { label: 'Site Capture + Concept', amount: 12500, delivery: '1-2 days' },
  multi_unit_residential: { label: 'Multi-Unit Residential', amount: 99900, delivery: '5-7 days' },
  mixed_use: { label: 'Mixed-Use Concept', amount: 129900, delivery: '6-8 days' },
  commercial_office: { label: 'Commercial Office', amount: 119900, delivery: '5-7 days' },
  townhome_subdivision: { label: 'Townhome Subdivision', amount: 169900, delivery: '7-10 days' },
  single_family_subdivision: { label: 'Single-Family Subdivision', amount: 149900, delivery: '6-8 days' },
  single_lot_development: { label: 'Single-Lot Development', amount: 89900, delivery: '4-6 days' },
  interior_renovation: { label: 'Interior Renovation', amount: 34500, delivery: '3-5 days' },
  whole_home_remodel: { label: 'Whole-Home Remodel', amount: 69500, delivery: '4-6 days' },
  addition_expansion: { label: 'Addition / Expansion', amount: 49500, delivery: '3-5 days' },
  developer_concept: { label: 'Developer Concept', amount: 79500, delivery: '5-7 days' },
}

interface AgentInsight {
  success?: boolean
  summary?: string
  confidence?: number
  nextStep?: string
  risks?: string[]
  recommendation?: string
}

export default function IntakePage() {
  const params = useParams()
  const router = useRouter()
  const projectPath = Array.isArray(params.projectPath) ? params.projectPath[0] : params.projectPath

  const [step, setStep] = useState<'ai' | 'details' | 'review'>('ai')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [agentData, setAgentData] = useState<AgentInsight | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    description: '',
    squareFootage: '',
    timeline: 'flexible',
  })

  const agentType = AGENT_MAP[projectPath] || 'design'
  const priceInfo = PRICE_MAP[projectPath] || { label: 'Project Intake Package', amount: 59500, delivery: '3-5 days' }

  useEffect(() => {
    const fetchAgentInsight = async () => {
      try {
        const response = await fetch(`/api/agents/${agentType}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectType: projectPath, context: 'intake_funnel' }),
        })

        if (!response.ok) throw new Error('Failed')
        const data = await response.json()
        setAgentData(data)
      } catch {
        setAgentData(null)
      } finally {
        setLoading(false)
      }
    }

    fetchAgentInsight()
  }, [agentType, projectPath])

  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.firstName || !formData.email || !formData.address) {
      setError('Please fill in all required fields')
      return
    }
    setStep('review')
  }

  const handlePayment = async () => {
    setSubmitting(true)
    try {
      const intakeRes = await fetch('/api/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectPath,
          clientName: `${formData.firstName} ${formData.lastName}`.trim(),
          contactEmail: formData.email,
          contactPhone: formData.phone || null,
          projectAddress: formData.address,
          formData: { description: formData.description, squareFootage: formData.squareFootage, timeline: formData.timeline },
        }),
      })

      if (!intakeRes.ok) throw new Error('Intake failed')
      const { intakeId } = await intakeRes.json()

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '')
      const checkoutRes = await fetch('/api/intake/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intakeId,
          projectPath,
          amount: priceInfo.amount,
          successUrl: `${appUrl}/intake/${projectPath}/success?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${appUrl}/intake/${projectPath}?canceled=true`,
        }),
      })

      if (!checkoutRes.ok) throw new Error('Checkout failed')
      const { url } = await checkoutRes.json()
      if (url) window.location.href = url
      else throw new Error('No checkout URL')
    } catch (err) {
      setError((err as Error).message || 'Payment failed')
      setSubmitting(false)
    }
  }

  const formatPrice = (cents: number) => (cents / 100).toFixed(2)

  if (!projectPath || !AGENT_MAP[projectPath]) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="rounded-xl bg-white shadow-lg p-8 max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-red-600 mb-2">Project Not Found</h1>
          <p className="text-slate-600 mb-6">This project path is not recognized.</p>
          <Link href="/">
            <button className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 rounded-xl transition">
              Return Home
            </button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* PROGRESS BAR */}
      <div className="bg-white border-b border-slate-200">
        <div className="mx-auto max-w-3xl px-4 py-6">
          <div className="flex items-center justify-between">
            {(['ai', 'details', 'review'] as const).map((s, i) => (
              <div key={s} className="flex items-center flex-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition ${
                  step === s ? 'bg-orange-600 text-white' : ['ai', 'details', 'review'].indexOf(step) >= i ? 'bg-orange-200 text-orange-700' : 'bg-slate-200 text-slate-500'
                }`}>
                  {i + 1}
                </div>
                {i < 2 && <div className={`flex-1 h-1 mx-3 transition ${['ai', 'details', 'review'].indexOf(step) >= i + 1 ? 'bg-orange-600' : 'bg-slate-200'}`} />}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-4 text-xs font-medium">
            <span className={step === 'ai' ? 'text-orange-600' : 'text-slate-600'}>Insight</span>
            <span className={step === 'details' ? 'text-orange-600' : 'text-slate-600'}>Details</span>
            <span className={step === 'review' ? 'text-orange-600' : 'text-slate-600'}>Review</span>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="mx-auto max-w-3xl px-4 py-12">
        {/* STEP 1: AI INSIGHT */}
        {step === 'ai' && (
          <div className="space-y-6">
            {loading ? (
              <LoadingState message="Analyzing your project..." estimatedTime={30} />
            ) : agentData ? (
              <>
                <InsightCard
                  summary={agentData.summary || ''}
                  risks={agentData.risks || []}
                  timeline={priceInfo.delivery}
                  confidence={agentData.confidence}
                  nextStep="Provide your details to proceed"
                />
                <button
                  onClick={() => setStep('details')}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 rounded-xl transition flex items-center justify-center gap-2"
                >
                  Continue to Details
                  <ArrowRight className="w-5 h-5" />
                </button>
              </>
            ) : (
              <div className="space-y-6">
                <div className="rounded-xl bg-white border border-slate-200 p-8 text-center">
                  <CheckCircle2 className="w-12 h-12 text-orange-500 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">{priceInfo.label}</h2>
                  <p className="text-slate-600 mb-2">Delivered in {priceInfo.delivery}</p>
                  <p className="text-slate-500 text-sm">Our team will review your project details and get started right away.</p>
                </div>
                <button
                  onClick={() => setStep('details')}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 rounded-xl transition flex items-center justify-center gap-2"
                >
                  Continue to Details
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: DETAILS */}
        {step === 'details' && (
          <form onSubmit={handleDetailsSubmit} className="space-y-6">
            <h2 className="text-3xl font-bold text-slate-900">Tell Us About Your Project</h2>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 flex gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">First Name *</label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                  placeholder="First name"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Last Name *</label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                  placeholder="Last name"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">Email *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">Address *</label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                placeholder="Street address, City, State ZIP"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">Project Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none resize-none"
                rows={4}
                placeholder="Describe your project goals, current property conditions, and any specific requirements..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Square Footage (optional)</label>
                <input
                  type="number"
                  value={formData.squareFootage}
                  onChange={(e) => setFormData({ ...formData, squareFootage: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                  placeholder="e.g. 2500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Timeline</label>
                <select
                  value={formData.timeline}
                  onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                >
                  <option value="asap">ASAP (1-2 weeks)</option>
                  <option value="month">Within 1 month</option>
                  <option value="flexible">Flexible</option>
                </select>
              </div>
            </div>

            <div className="flex gap-4 pt-6">
              <button
                type="button"
                onClick={() => setStep('ai')}
                className="flex-1 border-2 border-slate-300 hover:bg-slate-50 text-slate-700 font-bold py-3 rounded-xl transition"
              >
                Back
              </button>
              <button
                type="submit"
                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2"
              >
                Review & Pay
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: REVIEW */}
        {step === 'review' && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-slate-900">Review Your Order</h2>

            <div className="rounded-xl bg-blue-50 border border-blue-200 p-8 space-y-4">
              <div className="flex justify-between">
                <span className="text-slate-600">Service:</span>
                <span className="font-semibold text-slate-900">{priceInfo.label}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Client:</span>
                <span className="font-semibold text-slate-900">{formData.firstName} {formData.lastName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Delivery:</span>
                <span className="font-semibold text-slate-900">{priceInfo.delivery}</span>
              </div>
              <div className="border-t border-blue-300 pt-4 flex justify-between text-lg">
                <span className="font-bold text-slate-900">Total:</span>
                <span className="text-3xl font-bold text-blue-600">${formatPrice(priceInfo.amount)}</span>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 flex gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setStep('details')}
                disabled={submitting}
                className="flex-1 border-2 border-slate-300 hover:bg-slate-50 text-slate-700 font-bold py-3 rounded-xl transition disabled:opacity-50"
              >
                Edit
              </button>
              <button
                onClick={handlePayment}
                disabled={submitting}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-slate-400 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Complete Order
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>

            <div className="text-center text-sm text-slate-500">
              <p>🔒 Secure payment powered by Stripe</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
