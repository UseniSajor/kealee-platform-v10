'use client'

import { usePathname } from 'next/navigation'
import { SiteFooter } from '@/components/footer'

// Hide the full site footer inside the intake / concept funnel so it doesn't
// distract from the form flow.
const HIDDEN_PREFIXES = ['/concept/', '/intake/', '/pre-design/']
const HIDDEN_EXACT    = ['/concept', '/']

export function ConditionalSiteFooter() {
  const pathname = usePathname()
  if (HIDDEN_PREFIXES.some(p => pathname.startsWith(p))) return null
  if (HIDDEN_EXACT.includes(pathname)) return null
  return <SiteFooter />
}
