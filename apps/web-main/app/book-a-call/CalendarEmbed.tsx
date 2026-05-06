'use client'

/**
 * CalendarEmbed
 * Renders a Calendly inline widget when NEXT_PUBLIC_CALENDLY_URL is set.
 * Falls back to a mailto/contact card otherwise.
 *
 * To enable: add NEXT_PUBLIC_CALENDLY_URL=https://calendly.com/YOUR-LINK
 * to Vercel environment variables.
 */

import { useEffect } from 'react'
import { Mail, Phone } from 'lucide-react'

const CALENDLY_URL = process.env.NEXT_PUBLIC_CALENDLY_URL

export default function CalendarEmbed() {
  useEffect(() => {
    if (!CALENDLY_URL) return
    // Load Calendly widget script
    const script = document.createElement('script')
    script.src = 'https://assets.calendly.com/assets/external/widget.js'
    script.async = true
    document.head.appendChild(script)
    return () => {
      document.head.removeChild(script)
    }
  }, [])

  if (CALENDLY_URL) {
    return (
      <div
        className="calendly-inline-widget rounded-2xl overflow-hidden border border-slate-200 shadow-sm"
        data-url={`${CALENDLY_URL}?hide_gdpr_banner=1&primary_color=e8724b`}
        style={{ minWidth: '320px', height: '700px' }}
      />
    )
  }

  // Fallback when Calendly URL not configured
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-8 text-center">
      <div className="w-16 h-16 rounded-full bg-[#E8724B]/10 flex items-center justify-center mx-auto mb-5">
        <Phone className="w-7 h-7 text-[#E8724B]" />
      </div>
      <h2 className="text-xl font-bold text-slate-900 mb-2">Ready to Talk?</h2>
      <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto">
        Online booking is being set up. Reach out directly and we&apos;ll schedule your 15-min call within 1 business day.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <a
          href="mailto:hello@kealee.com?subject=15-Min Consultation Request"
          className="inline-flex items-center justify-center gap-2 bg-[#E8724B] hover:bg-[#D45C33] text-white font-bold px-6 py-3 rounded-xl transition-all text-sm"
        >
          <Mail className="w-4 h-4" /> Email Us to Schedule
        </a>
        <a
          href="tel:+12025550100"
          className="inline-flex items-center justify-center gap-2 border border-slate-200 hover:border-slate-300 text-slate-700 font-semibold px-6 py-3 rounded-xl transition-all text-sm bg-white"
        >
          <Phone className="w-4 h-4" /> Call Us Directly
        </a>
      </div>
      <p className="mt-5 text-xs text-slate-400">
        Mon–Fri · 9am–6pm EST · DMV area specialists
      </p>
    </div>
  )
}
