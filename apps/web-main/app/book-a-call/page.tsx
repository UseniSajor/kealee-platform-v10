/**
 * /book-a-call
 *
 * 15-min expert consultation booking page (Premium+ package only).
 * Embeds a Calendly inline widget — set NEXT_PUBLIC_CALENDLY_URL in Vercel.
 * Fallback: mailto link + contact card when Calendly is not configured.
 */

import type { Metadata } from 'next'
import CalendarEmbed from './CalendarEmbed'
import { Phone, Clock, Shield, MessageCircle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Book Your 15-Min Call — Kealee',
  description: 'Schedule your 15-minute expert consultation with the Kealee team. Available to Premium+ package holders.',
}

const TRUST_POINTS = [
  { icon: Clock,          label: '15 minutes', sub: 'Focused, no-fluff session' },
  { icon: Phone,          label: 'Live call',   sub: 'Video or phone — your choice' },
  { icon: Shield,         label: 'Real experts', sub: 'DMV construction specialists' },
  { icon: MessageCircle,  label: 'Ask bar',      sub: 'Ongoing support after the call' },
]

export default function BookACallPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="py-16 px-4 border-b border-slate-100 bg-gradient-to-br from-[#1A2B4A] to-[#2d4a72]">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-block rounded-full bg-white/10 text-white text-xs font-bold uppercase tracking-widest px-4 py-1.5 mb-5">
            Premium+ Consultation
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4 leading-tight">
            Book Your 15-Min Expert Call
          </h1>
          <p className="text-slate-300 text-base max-w-xl mx-auto">
            Talk directly with a Kealee construction specialist about your project — design direction, cost questions, permit scope, or next steps. Real humans, real answers.
          </p>
        </div>
      </section>

      {/* Trust bar */}
      <section className="py-8 px-4 bg-slate-50 border-b border-slate-100">
        <div className="mx-auto max-w-4xl grid grid-cols-2 md:grid-cols-4 gap-6">
          {TRUST_POINTS.map(({ icon: Icon, label, sub }) => (
            <div key={label} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-[#1A2B4A]" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">{label}</p>
                <p className="text-xs text-slate-500">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Calendar embed */}
      <section className="py-12 px-4">
        <div className="mx-auto max-w-3xl">
          <CalendarEmbed />
        </div>
      </section>

      {/* Ask bar note */}
      <section className="py-10 px-4 bg-slate-50 border-t border-slate-100">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold text-slate-700 mb-1">Already have your package?</p>
          <p className="text-sm text-slate-500">
            Use the <span className="font-semibold text-[#1A2B4A]">ask bar</span> in your portal for ongoing questions — our team responds within 1 business day without needing to book a call.
          </p>
        </div>
      </section>
    </div>
  )
}
