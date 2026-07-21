'use client'

import { usePathname } from 'next/navigation'
import { SiteFooter } from '@/components/footer'
import { isAgencyPartnerShellPath } from '@/lib/agency-partner-shell'

// Hide the full site footer inside the intake / concept funnel and on
// checkout pages so it doesn't distract from the form/payment flow.
const HIDDEN_PREFIXES = ['/concept/', '/intake/', '/pre-design/']
const HIDDEN_EXACT    = ['/concept']

export function ConditionalSiteFooter() {
  const pathname = usePathname()
  if (isAgencyPartnerShellPath(pathname)) return null
  if (HIDDEN_PREFIXES.some(p => pathname.startsWith(p))) return null
  if (HIDDEN_EXACT.includes(pathname)) return null
  if (pathname.endsWith('/checkout')) return null
  return <SiteFooter />
}
