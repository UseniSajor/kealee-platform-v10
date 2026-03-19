'use client'

import { useState } from 'react'
import { BarChart3, TrendingUp, Layers, Building2, ArrowRight, X, CheckCircle } from 'lucide-react'

const SERVICES = [
  {
    key:         'FEASIBILITY_STUDY' as const,
    icon:        BarChart3,
    title:       'Feasibility Study',
    priceRange:  '$4,500–$12,000',
    description: 'Market analysis, site constraints, development potential, and go/no-go recommendation.',
    deliverables: ['Market comparable analysis', 'Site constraint review', 'Development potential assessment', 'Go/no-go recommendation', 'Preliminary cost model'],
    turnaround:  '5–7 business days',
    color:       '#2ABFBF',
  },
  {
    key:         'PRO_FORMA' as const,
    icon:        TrendingUp,
    title:       'Pro Forma Analysis',
    priceRange:  '$2,500–$6,000',
    description: 'Revenue projections, cost modeling, and return on investment analysis for your development.',
    deliverables: ['Revenue projections', 'Cost modeling', 'ROI analysis', 'Sensitivity analysis', 'Investor summary'],
    turnaround:  '3–5 business days',
    color:       '#E8793A',
  },
  {
    key:         'CAPITAL_STACK' as const,
    icon:        Layers,
    title:       'Capital Stack Modeling',
    priceRange:  '$3,500–$8,000',
    description: 'Debt/equity structure, lender packaging, and investor return modeling.',
    deliverables: ['Debt/equity structure', 'Lender term modeling', 'Investor return waterfall', 'Lender package ready', 'Term sheet support'],
    turnaround:  '5–7 business days',
    color:       '#7C3AED',
  },
  {
    key:         'ENTITLEMENTS' as const,
    icon:        Building2,
    title:       'Entitlement Support',
    priceRange:  '$7,500–$20,000',
    description: 'Zoning analysis, variance support, hearing prep, and entitlement strategy.',
    deliverables: ['Zoning analysis', 'Variance strategy', 'Hearing preparation', 'Agency coordination', 'Entitlement roadmap'],
    turnaround:  '10–14 business days',
    color:       '#1A2B4A',
  },
]

type ServiceKey = typeof SERVICES[number]['key']

interface IntakeFormData {
  propertyAddress: string
  description: string
  timeline: 'ASAP' | '30_DAYS' | '60_DAYS' | 'FLEXIBLE'
}

export default function DeveloperServicesPage() {
  const [activeService, setActiveService] = useState<ServiceKey | null>(null)
  const [form, setForm] = useState<IntakeFormData>({ propertyAddress: '', description: '', timeline: 'FLEXIBLE' })
  const [submitting, setSubmitting] = useState(false)

  const selectedService = SERVICES.find(s => s.key === activeService)

  const handleRequest = async () => {
    if (!activeService) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/v1/developer/services/request', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          serviceType:     activeService,
          propertyAddress: form.propertyAddress,
          projectDetails:  { description: form.description },
          timeline:        form.timeline,
          successUrl:      `${window.location.origin}/services?success=1`,
          cancelUrl:       window.location.href,
        }),
      })
      const data = await res.json()
      if (res.ok && data.checkoutUrl) {
        window.location.href = data.checkoutUrl
      } else {
        alert(data.error ?? 'Failed to start checkout')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: '#1A2B4A' }}>Developer Services</h1>
        <p className="mt-1 text-sm text-gray-500">
          Expert analysis and advisory services for real estate developers. All deliverables by licensed professionals.
        </p>
      </div>

      {/* 2x2 service cards */}
      <div className="grid gap-6 sm:grid-cols-2">
        {SERVICES.map(service => {
          const Icon = service.icon
          return (
            <div
              key={service.key}
              className="rounded-2xl border border-gray-200 bg-white p-6 transition-all hover:shadow-md"
            >
              <div className="mb-4 flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${service.color}15` }}>
                  <Icon className="h-6 w-6" style={{ color: service.color }} />
                </div>
                <span className="text-sm font-semibold" style={{ color: service.color }}>
                  {service.priceRange}
                </span>
              </div>
              <h2 className="mb-2 text-lg font-bold" style={{ color: '#1A2B4A' }}>{service.title}</h2>
              <p className="mb-4 text-sm text-gray-500">{service.description}</p>
              <ul className="mb-4 space-y-1.5">
                {service.deliverables.map(d => (
                  <li key={d} className="flex items-center gap-2 text-xs text-gray-600">
                    <CheckCircle className="h-3.5 w-3.5 flex-shrink-0" style={{ color: service.color }} />
                    {d}
                  </li>
                ))}
              </ul>
              <div className="mb-4 text-xs text-gray-400">Turnaround: {service.turnaround}</div>
              <button
                onClick={() => setActiveService(service.key)}
                className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition-all hover:opacity-90"
                style={{ backgroundColor: service.color }}
              >
                Request this service
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )
        })}
      </div>

      {/* Slide-out intake drawer */}
      {activeService && selectedService && (
        <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <div className="relative flex h-full w-full max-w-md flex-col overflow-y-auto bg-white p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-bold" style={{ color: '#1A2B4A' }}>
                Request: {selectedService.title}
              </h2>
              <button
                onClick={() => setActiveService(null)}
                className="rounded-lg p-2 hover:bg-gray-100"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="flex-1 space-y-5">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Property Address</label>
                <input
                  type="text"
                  value={form.propertyAddress}
                  onChange={e => setForm({ ...form, propertyAddress: e.target.value })}
                  placeholder="123 Main St, City, State"
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Project Description</label>
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe your development project, target use, and any known constraints..."
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Desired Timeline</label>
                <select
                  value={form.timeline}
                  onChange={e => setForm({ ...form, timeline: e.target.value as IntakeFormData['timeline'] })}
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm"
                >
                  <option value="ASAP">ASAP</option>
                  <option value="30_DAYS">Within 30 days</option>
                  <option value="60_DAYS">Within 60 days</option>
                  <option value="FLEXIBLE">Flexible</option>
                </select>
              </div>

              <div className="rounded-xl p-4" style={{ backgroundColor: `${selectedService.color}08` }}>
                <p className="text-sm font-medium" style={{ color: selectedService.color }}>
                  Price range: {selectedService.priceRange}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Final price confirmed after intake review. Turnaround: {selectedService.turnaround}.
                </p>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={handleRequest}
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl py-4 text-sm font-bold text-white disabled:opacity-50"
                style={{ backgroundColor: selectedService.color }}
              >
                {submitting ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <>Continue to Payment <ArrowRight className="h-4 w-4" /></>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
