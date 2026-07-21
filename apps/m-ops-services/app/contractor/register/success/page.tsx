'use client'

/**
 * /contractor/register/success
 *
 * Pending verification confirmation page.
 * Shown after successful contractor registration.
 * Contractor is not lead-eligible until admin approves via P2 admin panel.
 */

import { CheckCircle2, Clock, Mail, Shield, ArrowRight } from 'lucide-react'
import Link from 'next/link'

const NEXT_STEPS = [
  {
    icon: Mail,
    title: 'Check your email',
    description: 'We sent a confirmation to your work email. Click the link to verify your address.',
  },
  {
    icon: Shield,
    title: 'License & insurance review',
    description: 'Our team will verify your contractor license and insurance certificate within 1–2 business days.',
  },
  {
    icon: CheckCircle2,
    title: 'Approval notification',
    description: "You'll receive an email when your account is approved and you can start receiving leads.",
  },
]

export default function ContractorRegisterSuccessPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="max-w-lg w-full">

        {/* Logo */}
        <div className="text-center mb-8">
          <img
            src="/kealee-logo-600w.png"
            alt="Kealee"
            className="h-14 w-auto mx-auto mb-4"
          />
        </div>

        {/* Success card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
          {/* Icon */}
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} className="text-green-600" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Registration Submitted!
          </h1>

          <p className="text-gray-600 text-sm leading-relaxed mb-6">
            Your contractor profile has been created. Your account is currently
            <span className="font-semibold text-amber-700"> pending verification</span> and
            you will begin receiving leads once approved.
          </p>

          {/* Status badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-full text-sm font-medium text-amber-700 mb-8">
            <Clock size={14} />
            Pending Admin Verification
          </div>

          {/* Next steps */}
          <div className="text-left space-y-4 mb-8">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">What happens next</h2>
            {NEXT_STEPS.map((step, i) => {
              const Icon = step.icon
              return (
                <div key={i} className="flex gap-3">
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon size={16} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{step.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{step.description}</p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Link
              href="/login"
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-all"
            >
              Sign in to your account
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/"
              className="flex items-center justify-center gap-2 w-full py-2.5 border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium rounded-xl text-sm transition-all"
            >
              Back to home
            </Link>
          </div>
        </div>

        {/* Support note */}
        <p className="mt-5 text-center text-xs text-gray-500">
          Questions? Email{' '}
          <a href="mailto:contractors@kealee.com" className="text-blue-600 hover:underline">
            contractors@kealee.com
          </a>
        </p>
      </div>
    </div>
  )
}
