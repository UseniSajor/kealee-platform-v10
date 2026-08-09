'use client'

import { usePathname } from 'next/navigation'
import { Phone, MessageCircle } from 'lucide-react'
import { KEALEE_PHONE_DISPLAY, KEALEE_PHONE_E164 } from '@/lib/site/contact'
import { isAgencyPartnerShellPath } from '@/lib/agency-partner-shell'

/** Mobile-only: click-to-call + jump to Kealee Ask chat (above GlobalChatBar). */
export function MobileConversionRail() {
  const pathname = usePathname()
  if (isAgencyPartnerShellPath(pathname)) return null

  function scrollToChat() {
    const el = document.getElementById('kealee-global-chat')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'end' })
      const input = el.querySelector<HTMLInputElement>('input[type="text"], input:not([type])')
      input?.focus()
    }
  }

  return (
    <div
      className="fixed bottom-[5.5rem] right-3 z-50 flex flex-col gap-2 md:hidden"
      aria-label="Quick contact"
    >
      <a
        href={`tel:${KEALEE_PHONE_E164}`}
        className="flex h-11 w-11 items-center justify-center rounded-full text-white shadow-lg transition-opacity hover:opacity-90"
        style={{ backgroundColor: '#1A2B4A' }}
        aria-label={`Call ${KEALEE_PHONE_DISPLAY}`}
      >
        <Phone className="h-5 w-5" aria-hidden />
      </a>
      <button
        type="button"
        onClick={scrollToChat}
        className="flex h-11 w-11 items-center justify-center rounded-full text-white shadow-lg transition-opacity hover:opacity-90"
        style={{ backgroundColor: '#E8793A' }}
        aria-label="Open Kealee assistant"
      >
        <MessageCircle className="h-5 w-5" aria-hidden />
      </button>
    </div>
  )
}
