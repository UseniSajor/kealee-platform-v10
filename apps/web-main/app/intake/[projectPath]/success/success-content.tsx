'use client'

import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, MapPin, Calendar, ArrowRight, Home, Clock } from 'lucide-react'

export function IntakeSuccessContent() {
  const params = useParams()
  const searchParams = useSearchParams()
  const projectPath = params.projectPath as string
  const intakeId = searchParams.get('intakeId') ?? 'unknown'
  const isSiteVisit = searchParams.get('siteVisit') === '1'

  if (isSiteVisit) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        {/* Site Visit Confirmation */}
        <div className="text-center mb-8">
          <div
            className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl"
            style={{ backgroundColor: '#E0E7FF' }}
          >
            <MapPin className="h-10 w-10" style={{ color: '#4F46E5' }} />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: '#1A2B4A' }}>
            Your Site Visit Request Has Been Submitted
          </h1>
          <p className="mt-3 text-gray-500">
            Payment confirmed. Our team will contact you within 24 hours to schedule your Kealee Site Visit Scan.
          </p>
        </div>

        {/* What happens next */}
        <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5 space-y-4 mb-6">
          <h2 className="text-sm font-semibold text-indigo-900">What happens next</h2>
          <div className="space-y-3">
            {[
              {
                icon: <Clock className="h-5 w-5 text-indigo-500" />,
                title: 'Within 24 hours',
                desc: 'Our team reviews your project and reaches out to confirm a visit date.',
              },
              {
                icon: <Calendar className="h-5 w-5 text-indigo-500" />,
                title: 'Visit scheduled',
                desc: 'A Kealee professional arrives at your property with scanning equipment.',
              },
              {
                icon: <CheckCircle2 className="h-5 w-5 text-indigo-500" />,
                title: 'AI Concept delivered',
                desc: 'Your AI concept package is generated from the scan data and delivered digitally.',
              },
            ].map((step) => (
              <div key={step.title} className="flex gap-3">
                <div className="mt-0.5 flex-shrink-0">{step.icon}</div>
                <div>
                  <p className="text-sm font-semibold text-indigo-800">{step.title}</p>
                  <p className="text-xs text-indigo-600">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Confirmation */}
        <div className="rounded-xl bg-gray-50 border border-gray-100 p-4 text-center space-y-1 mb-8">
          <p className="text-xs text-gray-500">Intake reference</p>
          <p className="font-mono text-sm text-gray-700">{intakeId}</p>
          <p className="text-xs text-gray-400">A confirmation email has been sent with your order details.</p>
        </div>

        <Link
          href="/"
          className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-medium text-white"
          style={{ backgroundColor: '#4F46E5' }}
        >
          <Home className="h-4 w-4" /> Back to Kealee
        </Link>
      </div>
    )
  }

  // Standard success
  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <div
        className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl"
        style={{ backgroundColor: '#FFF7F2' }}
      >
        <CheckCircle2 className="h-10 w-10" style={{ color: '#16A34A' }} />
      </div>

      <h1 className="text-2xl font-bold" style={{ color: '#1A2B4A' }}>
        You&apos;re All Set!
      </h1>
      <p className="mt-3 text-gray-500">
        Payment confirmed. Your AI concept package is being prepared. We&apos;ll be in touch soon.
      </p>

      <div className="mt-8 rounded-2xl border border-gray-100 bg-gray-50 p-5 text-left space-y-3">
        <h2 className="text-sm font-semibold text-gray-800">What&apos;s next</h2>
        <ul className="space-y-2">
          {[
            'Our team reviews your intake and capture data',
            'AI generates your exterior concept and design direction',
            'Your concept package is delivered via email (typically 24–48 hours)',
          ].map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-gray-600">
              <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" style={{ color: '#16A34A' }} />
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4 rounded-xl bg-gray-50 border border-gray-100 p-3 text-center">
        <p className="text-xs text-gray-400">Reference: <span className="font-mono text-gray-600">{intakeId}</span></p>
      </div>

      <div className="mt-8 flex gap-3">
        <Link
          href="/"
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-gray-200 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <Home className="h-4 w-4" /> Home
        </Link>
        <Link
          href="/portal"
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl py-3 text-sm font-medium text-white"
          style={{ backgroundColor: '#E8793A' }}
        >
          View Portal <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  )
}
