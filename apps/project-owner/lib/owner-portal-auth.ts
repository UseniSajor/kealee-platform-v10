/** Owner portal auth URLs — keep redirectTo aligned with web-main lib/owner-portal-magic-link.ts */

export function getOwnerPortalBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_OWNER_PORTAL_URL?.trim() ?? ''
  return (raw || 'https://owner.kealee.com').replace(/\/$/, '')
}

export function buildOwnerPortalAuthCallbackUrl(nextPath: string): string {
  const safeNext = nextPath.startsWith('/') ? nextPath : `/${nextPath}`
  return `${getOwnerPortalBaseUrl()}/auth/callback?next=${encodeURIComponent(safeNext)}`
}
