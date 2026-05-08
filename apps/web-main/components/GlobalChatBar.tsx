'use client'

import { usePathname } from 'next/navigation'
import { AskChatBar } from '@/components/ui/AskChatBar'

// Pages where the floating bar would compete with forms or checkout
const EXCLUDED_PREFIXES = ['/intake/', '/pre-design/']
const EXCLUDED_EXACT   = ['/concept/confirm', '/concept/success']

export function GlobalChatBar() {
  const pathname = usePathname()

  if (EXCLUDED_PREFIXES.some(p => pathname.startsWith(p))) return null
  if (EXCLUDED_EXACT.includes(pathname)) return null

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-4 pt-3"
      style={{
        background: 'linear-gradient(to top, rgba(248,246,242,0.98) 70%, transparent)',
      }}
    >
      <AskChatBar
        context="default"
        variant="light"
        suggestionsUp
        className="max-w-2xl"
      />
    </div>
  )
}
