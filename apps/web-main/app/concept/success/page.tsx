'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, Mail, Clock, ArrowRight } from 'lucide-react'

function SuccessInner() {
  const searchParams = useSearchParams()
  const email   = searchParams.get('email')   ?? ''
  const name    = searchParams.get('name')    ?? ''
  const service = searchParams.get('service') ?? 'Concept Package'
  const amount  = searchParams.get('amount')  ?? ''
  const promo   = searchParams.get('promo')   === '1'

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-16">
      <div className="max-w-lg w-full space-y-6">

        {/* Header */}
        <div className="text-center">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-green-100 mb-6">
            <CheckCircle2 className="h-10 w-10 text-green-600" strokeWidth={2} />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2">
            {promo ? 'Access Unlocked' : 'Payment Confirmed'}
          </h1>
          <p className="text-slate-500">
            {name ? `Thanks, ${name.split(' ')[0]}. ` : ''}Your concept package is being prepared now.
          </p>
        </div>

        {/* Order card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

          {/* Summary row */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-0.5">Service</p>
              <p className="text-sm font-bold text-slate-900">{service}</p>
            </div>
            {amount && !promo && (
              <div className="text-right">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-0.5">Paid</p>
                <p className="text-2xl font-black text-slate-900">${Number(amount).toLocaleString()}</p>
              </div>
            )}
            {promo && (
              <span className="rounded-full bg-green-100 text-green-700 text-xs font-bold px-3 py-1">Free Access</span>
            )}
          </div>

          {/* Email notice */}
          <div className="px-6 py-5 bg-blue-50 border-b border-blue-100">
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-slate-800 mb-1">Portal login details on the way</p>
                <p className="text-sm text-slate-600 leading-relaxed">
                  An email with your Owner Portal login details will be sent to{' '}
                  <strong>{email || 'your email address'}</strong> within a few minutes.
                </p>
                <p className="text-xs text-slate-400 mt-1.5">Check your spam folder if you don&apos;t see it in 5 minutes.</p>
              </div>
            </div>
          </div>

          {/* What happens next */}
          <div className="px-6 py-5">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-slate-800 mb-2">What happens next</p>
                <ul className="space-y-2">
                  {[
                    'Your AI concept is generating now',
                    'You\'ll receive an email with Owner Portal access',
                    'Full package delivered in 3–5 business days',
                  ].map((step, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#E8724B]/10 text-[#E8724B] text-xs font-bold">
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer links */}
        <div className="text-center space-y-3">
          <p className="text-sm text-slate-500">
            Questions?{' '}
            <a href="mailto:hello@kealee.com" className="font-semibold text-[#E8724B] hover:underline">
              hello@kealee.com
            </a>
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800 transition"
          >
            Return to Kealee <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

      </div>
    </div>
  )
}

export default function ConceptSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-[#E8724B] border-t-transparent animate-spin" />
      </div>
    }>
      <SuccessInner />
    </Suspense>
  )
}
