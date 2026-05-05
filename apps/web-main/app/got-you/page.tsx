'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, Mail, Phone, ArrowRight, Clock, Shield } from 'lucide-react'

const SERVICE_LABELS: Record<string, string> = {
  concept:              'Design Concept',
  kitchen:              'Kitchen Remodel Concept',
  bathroom:             'Bathroom Remodel Concept',
  addition:             'Home Addition Concept',
  exterior_concept:     'Exterior Design Concept',
  whole_home_concept:   'Whole-Home Concept',
  permits:              'Permit Filing',
  permit_path_only:     'Permit Package',
  document_assembly:    'Document Assembly',
  simple_permit:        'Simple Permit Filing',
  complex_permit:       'Complex Permit Filing',
  expedited:            'Expedited Permit Filing',
  cost_estimate:        'Detailed Cost Estimate',
  certified_estimate:   'Certified Cost Estimate',
  estimate:             'Cost Estimate',
  contractor_match:     'Contractor Match',
  marketplace:          'Marketplace Order',
}

function GotYouInner() {
  const searchParams = useSearchParams()
  const name    = searchParams.get('name')    ?? ''
  const email   = searchParams.get('email')   ?? ''
  const service = searchParams.get('service') ?? ''
  const source  = searchParams.get('source')  ?? ''

  const serviceLabel = SERVICE_LABELS[service] || SERVICE_LABELS[source] || 'your request'
  const firstName    = name.trim().split(' ')[0] || ''

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50 flex flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg">

        {/* Icon + heading */}
        <div className="text-center mb-8">
          <div className="mx-auto w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6 shadow-sm ring-8 ring-green-50">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3 leading-tight">
            {firstName ? `${firstName}, we've got you.` : "We've got your request."}
          </h1>
          <p className="text-slate-500 text-base leading-relaxed">
            Your{' '}
            <span className="font-semibold text-slate-700">{serviceLabel}</span>{' '}
            request has been received by our team.
          </p>
          {email && (
            <p className="text-slate-400 text-sm mt-2">
              We'll follow up at{' '}
              <span className="font-semibold text-slate-600">{email}</span>{' '}
              within 24 hours.
            </p>
          )}
          {!email && (
            <p className="text-slate-400 text-sm mt-2">
              Our team will reach out within 24 hours to continue your project.
            </p>
          )}
        </div>

        {/* What happens next */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">What happens next</p>
          <div className="space-y-4">
            {[
              { icon: Clock,         text: 'A Kealee specialist reviews your details' },
              { icon: Mail,          text: 'You receive a confirmation within 24 hours' },
              { icon: Shield,        text: 'Your project gets assigned and work begins' },
              { icon: CheckCircle2,  text: 'Deliverables sent directly to your inbox' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-50 border border-green-100 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-green-600" />
                </div>
                <p className="text-sm text-slate-700">{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Direct contact */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 mb-6 text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Need help right now?</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="mailto:hello@kealee.com"
              className="flex items-center gap-1.5 text-sm font-semibold text-[#E8724B] hover:underline"
            >
              <Mail className="w-4 h-4" /> hello@kealee.com
            </a>
            <span className="hidden sm:block text-slate-200">|</span>
            <a
              href="tel:+12405550100"
              className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:underline"
            >
              <Phone className="w-4 h-4" /> (240) 555-0100
            </a>
          </div>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/"
            className="flex-1 flex items-center justify-center gap-2 bg-[#E8724B] hover:bg-[#D45C33] text-white font-bold px-6 py-3.5 rounded-xl transition-all duration-200 shadow-sm"
          >
            Back to Kealee <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/gallery"
            className="flex-1 flex items-center justify-center gap-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold px-6 py-3.5 rounded-xl transition"
          >
            Browse All Services
          </Link>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          Reference: {service || source || 'general'} · {new Date().toLocaleDateString()}
        </p>
      </div>
    </div>
  )
}

export default function GotYouPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-[#E8724B] border-t-transparent animate-spin" />
      </div>
    }>
      <GotYouInner />
    </Suspense>
  )
}
