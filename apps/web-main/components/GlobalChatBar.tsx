'use client'

import { usePathname } from 'next/navigation'
import { AskChatBar } from '@/components/ui/AskChatBar'
import { isAgencyPartnerShellPath } from '@/lib/agency-partner-shell'

// Pages where the floating bar would compete with forms or checkout
const EXCLUDED_PREFIXES = ['/intake/', '/pre-design/', '/concept/']
const EXCLUDED_EXACT: string[] = []

export function GlobalChatBar() {
  const pathname = usePathname()

  if (isAgencyPartnerShellPath(pathname)) return null

  if (EXCLUDED_PREFIXES.some(p => pathname.startsWith(p))) return null
  if (EXCLUDED_EXACT.includes(pathname)) return null

  return (
    <>
      {/* Keep the end of the page scrollable above the fixed chat control. */}
      <div className="h-24 sm:h-28" aria-hidden="true" />
      <div
        id="kealee-global-chat"
        className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-4 pt-3"
        style={{
          background: 'linear-gradient(to top, rgba(248,246,242,0.98) 70%, transparent)',
        }}
      >
        <AskChatBar
          key={pathname}
          context="default"
          variant="light"
          suggestionsUp
          className="max-w-2xl"
        />
      </div>
    </>
  )
}
