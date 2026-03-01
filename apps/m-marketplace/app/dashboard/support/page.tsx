'use client'

import Link from 'next/link'
import {
  Phone,
  Mail,
  MessageCircle,
  FileText,
  ArrowRight,
  Clock,
  HelpCircle,
} from 'lucide-react'

const faqs = [
  {
    q: 'How long does concept package delivery take?',
    a: 'Most concept packages are generated within 2-4 hours. Complex projects may take up to 24 hours.',
  },
  {
    q: 'Can I upgrade my package after purchase?',
    a: 'Yes! Contact us to upgrade your concept package. We\'ll credit your original purchase toward the upgrade.',
  },
  {
    q: 'What\'s included in a concept package?',
    a: 'Each package includes AI-generated design concepts, cost estimates, material selections, and a project timeline tailored to your specifications.',
  },
  {
    q: 'How do I get a refund?',
    a: 'We offer a 100% satisfaction guarantee. Contact support within 30 days for a full refund if you\'re not satisfied.',
  },
]

export default function SupportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-gray-900">Support</h1>
        <p className="mt-1 text-gray-500">We&apos;re here to help with any questions.</p>
      </div>

      {/* Contact options */}
      <div className="grid sm:grid-cols-3 gap-4">
        <a
          href="tel:+13015758777"
          className="bg-white rounded-2xl border border-gray-200 hover:border-sky-300 hover:shadow-md transition p-6 text-center"
        >
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Phone className="text-green-600" size={22} />
          </div>
          <h3 className="font-bold text-gray-900 mb-1">Call Us</h3>
          <p className="text-sm text-sky-600 font-semibold">(301) 575-8777</p>
          <div className="flex items-center justify-center gap-1 mt-2 text-xs text-gray-400">
            <Clock size={12} />
            Mon-Fri 9am-6pm ET
          </div>
        </a>

        <a
          href="mailto:support@kealee.com"
          className="bg-white rounded-2xl border border-gray-200 hover:border-sky-300 hover:shadow-md transition p-6 text-center"
        >
          <div className="w-12 h-12 bg-sky-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Mail className="text-sky-600" size={22} />
          </div>
          <h3 className="font-bold text-gray-900 mb-1">Email</h3>
          <p className="text-sm text-sky-600 font-semibold">support@kealee.com</p>
          <div className="flex items-center justify-center gap-1 mt-2 text-xs text-gray-400">
            <Clock size={12} />
            Response within 4 hours
          </div>
        </a>

        <Link
          href="/get-started"
          className="bg-white rounded-2xl border border-gray-200 hover:border-sky-300 hover:shadow-md transition p-6 text-center"
        >
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <MessageCircle className="text-purple-600" size={22} />
          </div>
          <h3 className="font-bold text-gray-900 mb-1">Live Chat</h3>
          <p className="text-sm text-sky-600 font-semibold">Start a conversation</p>
          <div className="flex items-center justify-center gap-1 mt-2 text-xs text-gray-400">
            <Clock size={12} />
            Available now
          </div>
        </Link>
      </div>

      {/* FAQ */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
          <HelpCircle size={20} className="text-gray-400" />
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <details key={i} className="group border border-gray-200 rounded-xl">
              <summary className="flex items-center justify-between px-5 py-4 cursor-pointer font-semibold text-gray-900 text-sm">
                {faq.q}
                <ArrowRight
                  size={16}
                  className="text-gray-400 transition-transform group-open:rotate-90"
                />
              </summary>
              <div className="px-5 pb-4 text-sm text-gray-600">{faq.a}</div>
            </details>
          ))}
        </div>
      </div>

      {/* Help articles */}
      <div className="bg-gray-50 rounded-2xl border border-gray-200 p-6 text-center">
        <FileText className="mx-auto text-gray-400 mb-3" size={28} />
        <h3 className="font-bold text-gray-900 mb-1">Need more help?</h3>
        <p className="text-sm text-gray-500">
          Browse our{' '}
          <Link href="/faq" className="text-sky-600 font-semibold hover:underline">
            full FAQ
          </Link>{' '}
          or call us anytime at{' '}
          <a href="tel:+13015758777" className="text-sky-600 font-semibold hover:underline">
            (301) 575-8777
          </a>
        </p>
      </div>
    </div>
  )
}
