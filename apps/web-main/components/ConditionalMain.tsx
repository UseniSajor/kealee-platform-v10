'use client'

import { usePathname } from 'next/navigation'
import { isAgencyPartnerShellPath } from '@/lib/agency-partner-shell'

export function ConditionalMain({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const bare = isAgencyPartnerShellPath(pathname)
  return <main className={bare ? 'min-h-0' : 'pb-28 md:pb-24'}>{children}</main>
}
