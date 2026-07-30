'use client'

import { usePathname } from 'next/navigation'
import { SiteFooter } from '@/components/footer'
import { SiteBottomBar } from '@/components/footer/SiteBottomBar'
import { isAgencyPartnerShellPath } from '@/lib/agency-partner-shell'

// Hide the full nav footer (services/company/social columns) inside the
// intake / concept funnel and on checkout pages so it doesn't distract from
// the form/payment flow — but always keep the copyright + legal links bar,
// on every page including these.
const HIDDEN_PREFIXES = ['/concept/', '/intake/', '/pre-design/']
const HIDDEN_EXACT    = ['/concept']

export function ConditionalSiteFooter() {
  const pathname = usePathname()
  if (isAgencyPartnerShellPath(pathname)) return <SiteBottomBar variant="light" />
  const isFunnelPage =
    HIDDEN_PREFIXES.some(p => pathname.startsWith(p)) ||
    HIDDEN_EXACT.includes(pathname) ||
    pathname.endsWith('/checkout')
  if (isFunnelPage) return <SiteBottomBar variant="light" />
  return <SiteFooter />
}
