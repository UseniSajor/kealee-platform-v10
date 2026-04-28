import type { Metadata } from 'next'
import Link from 'next/link'
import { CheckCircle2, ArrowRight, Phone, Mail, Clock } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Request Submitted — Kealee New Construction',
  description: 'Your new construction inquiry has been received. A Kealee project coordinator will reach out within one business day.',
}

const NEXT_STEPS = [
  {
    icon: Phone,
    title: 'Discovery Call',
    desc: 'A Kealee project coordinator will call within 1 business day to confirm your needs and answer questions.',
    timing: 'Within 1 business day',
  },
  {
    icon: Mail,
    title: 'Project Brief',
    desc: "We'll email a detailed project brief and preliminary scope based on your submission.",
    timing: 'Within 2 business days',
  },
  {
    icon: Clock,
    title: 'Proposal',
    desc: 'Receive a full design-build proposal with phased pricing, timeline, and team assignments.',
    timing: 'Within 5 business days',
  },
]

export default function NewConstructionConfirmationPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 py-16">
      <div className="max-w-xl w-full">

        {/* Success icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
        </div>

        {/* Heading */}
        <div className="text-center mb-10">
          <p className="text-xs font-bold uppercase tracking-widest text-[#E8724B] mb-3">Inquiry Received</p>
          <h1 className="text-3xl font-bold text-slate-900 mb-3">You're on your way to building something great.</h1>
          <p className="text-slate-500">
            Your new construction inquiry is in our queue. A member of our project team will reach out shortly to get things moving.
          </p>
        </div>

        {/* Next steps */}
        <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 mb-8">
          {NEXT_STEPS.map((step, i) => {
            const Icon = step.icon
            return (
              <div key={i} className="flex gap-4 p-5">
                <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-[#E8724B]" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-bold text-slate-900 text-sm">{step.title}</p>
                    <span className="text-[11px] font-semibold text-slate-400 whitespace-nowrap">{step.timing}</span>
                  </div>
                  <p className="text-sm text-slate-500 mt-0.5">{step.desc}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/"
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#1A2B4A] hover:bg-[#243d68] text-white font-semibold px-5 py-3 text-sm transition"
          >
            Back to Home <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/concept"
            className="flex-1 flex items-center justify-center gap-2 rounded-xl border-2 border-[#E8724B] text-[#E8724B] hover:bg-orange-50 font-semibold px-5 py-3 text-sm transition"
          >
            Start a Design Concept
          </Link>
        </div>
      </div>
    </div>
  )
}
