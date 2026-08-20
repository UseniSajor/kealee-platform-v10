/**
 * Owner portal base URL — same as middleware (`NEXT_PUBLIC_OWNER_PORTAL_URL`).
 *
 * The owner portal is the richer deliverable viewer, but it is a separately
 * deployed app on its own hostname. When that hostname is not configured we
 * MUST NOT hard-redirect customers to it: an unresolvable host turns every
 * paid deliverable link into a dead end. `isOwnerPortalConfigured()` lets
 * callers fall back to the on-site order view served by web-main instead.
 *
 * Configure in web-main `.env.local` / Railway — see `.env.example` section
 * "OWNER PORTAL — DELIVERABLES & REDIRECTS".
 */

function rawOwnerPortalUrl(): string {
  return typeof process.env.NEXT_PUBLIC_OWNER_PORTAL_URL === 'string'
    ? process.env.NEXT_PUBLIC_OWNER_PORTAL_URL.trim().replace(/\/$/, '')
    : ''
}

/** True only when an operator has explicitly pointed us at a live portal host. */
export function isOwnerPortalConfigured(): boolean {
  return rawOwnerPortalUrl().length > 0
}

export function getOwnerPortalBaseUrl(): string {
  return rawOwnerPortalUrl() || 'https://owner.kealee.com'
}

/** Deep link to a single intake's deliverable view in the owner portal. */
export function getOwnerPortalDeliverableUrl(intakeId: string, projectPath?: string): string {
  const base = getOwnerPortalBaseUrl()
  const q = projectPath ? `?projectPath=${encodeURIComponent(projectPath)}` : ''
  return `${base}/deliverables/${encodeURIComponent(intakeId)}${q}`
}

/** On-site order tracking + deliverable view served by web-main itself. */
export function getOnSiteOrderUrl(intakeId: string, projectPath?: string): string {
  const q = projectPath ? `?projectPath=${encodeURIComponent(projectPath)}` : ''
  return `/orders/${encodeURIComponent(intakeId)}${q}`
}

/**
 * Where a customer should be sent to see the status and deliverables of one
 * order. Prefers the owner portal when it is configured, otherwise keeps the
 * customer on the domain that is definitely live.
 */
export function getCustomerOrderUrl(intakeId: string, projectPath?: string): string {
  return isOwnerPortalConfigured()
    ? getOwnerPortalDeliverableUrl(intakeId, projectPath)
    : getOnSiteOrderUrl(intakeId, projectPath)
}
