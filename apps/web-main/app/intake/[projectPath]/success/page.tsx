'use client'

import Link from 'next/link'
import { CheckCircle2, Clock, Zap, ArrowRight } from 'lucide-react'

export default function IntakeSuccessPage() {
  const timeline = [
    { icon: '✓', label: 'Payment Confirmed', timing: 'Now' },
    { icon: '⚡', label: 'AI Analysis Begins', timing: '< 1 min' },
    { icon: '📊', label: 'Deliverables Generated', timing: '1-5 days' },
    { icon: '💬', label: 'Support Available', timing: 'Anytime' },
  ]

  const nextSteps = [
    {
      icon: '📧',
      title: 'Check Your Email',
      description: 'Confirmation and tracking details sent to your inbox.',
      cta: null,
    },
    {
      icon: '⏱️',
      title: 'Track Progress',
      description: 'Monitor your project status in real-time.',
      cta: { label: 'View Dashboard', href: '/projects' },
    },
    {
      icon: '📈',
      title: 'Explore More',
      description: 'Upgrade your design or add complementary services.',
      cta: { label: 'View Services', href: '/homeowners' },
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-green-50">
      {/* SUCCESS HEADER */}
      <section className="bg-white border-b border-slate-200 px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-green-200 rounded-full animate-pulse" />
              <CheckCircle2 className="relative w-20 h-20 text-green-600" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-3">Your Project is in Motion</h1>
          <p className="text-xl text-slate-600">
            We've received your order and started the analysis process.
          </p>
        </div>
      </section>

      {/* TIMELINE */}
      <section className="px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-bold text-slate-900 mb-12 text-center">What Happens Next</h2>

          <div className="space-y-6">
            {timeline.map((item, i) => (
              <div key={i} className="flex gap-6 items-start">
                <div className="flex-shrink-0">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                    <span className="text-2xl font-bold text-green-600">{item.icon}</span>
                  </div>
                </div>
                <div className="pt-1">
                  <h3 className="font-bold text-slate-900 text-lg mb-1">{item.label}</h3>
                  <p className="text-slate-600">Expected: {item.timing}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* NEXT STEPS */}
      <section className="bg-slate-50 px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-bold text-slate-900 mb-12 text-center">Take Action Now</h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {nextSteps.map((step, i) => (
              <div key={i} className="bg-white rounded-xl p-8 border border-slate-200 flex flex-col h-full">
                <div className="text-4xl mb-4">{step.icon}</div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-slate-600 mb-6 flex-grow">{step.description}</p>
                {step.cta ? (
                  <Link href={step.cta.href}>
                    <button className="w-full text-left text-orange-600 hover:text-orange-700 font-semibold flex items-center gap-2 text-sm">
                      {step.cta.label}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </Link>
                ) : (
                  <div className="text-sm text-slate-500">Check your email</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ MINI */}
      <section className="px-4 py-16 sm:py-20 border-t border-slate-200">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-bold text-slate-900 mb-12 text-center">Common Questions</h2>

          <div className="space-y-6">
            <div>
              <h3 className="font-bold text-slate-900 mb-2">How long until I get my deliverables?</h3>
              <p className="text-slate-600">Most projects are completed within 1-5 business days. Complex projects may take up to 2 weeks. You'll receive updates via email.</p>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 mb-2">Can I make changes to my order?</h3>
              <p className="text-slate-600">Yes! Contact us within 24 hours with any updates to your project details, and we'll adjust accordingly at no extra cost.</p>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 mb-2">What if I need additional services?</h3>
              <p className="text-slate-600">We offer complementary services like permits, contractors, and advanced designs. You can add them anytime during or after your project.</p>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 mb-2">What's your support availability?</h3>
              <p className="text-slate-600">Our team is available Monday–Friday, 9am–6pm EST. Email us anytime, and we'll respond within 24 hours.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="bg-gradient-to-r from-orange-600 to-orange-700 px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-2xl text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Need Help?</h2>
          <p className="text-lg opacity-90 mb-8">Our team is here to support you every step of the way.</p>
          <a href="mailto:support@kealee.com">
            <button className="bg-white hover:bg-slate-100 text-orange-600 font-bold py-3 px-8 rounded-xl transition inline-flex items-center gap-2">
              Contact Support
              <ArrowRight className="w-5 h-5" />
            </button>
          </a>
        </div>
      </section>
    </div>
  )
}
