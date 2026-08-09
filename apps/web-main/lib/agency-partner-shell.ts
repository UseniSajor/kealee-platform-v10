/** Routes that use the agency partner shell (no consumer nav, footer, or chat). */
export const AGENCY_PARTNER_SHELL_PREFIXES = ['/marketing/login', '/marketing/workspace'] as const

export function isAgencyPartnerShellPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false
  return AGENCY_PARTNER_SHELL_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )
}
