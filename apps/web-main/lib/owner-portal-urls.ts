/**
 * Owner portal base URL — same as middleware (`NEXT_PUBLIC_OWNER_PORTAL_URL`).
 * Deliverables (concept packages, video, BOM) are viewed only in the portal, not on web-main.
 *
 * Configure in web-main `.env.local` / Vercel — see `.env.example` section
 * "OWNER PORTAL — DELIVERABLES & REDIRECTS".
 */

export function getOwnerPortalBaseUrl(): string {
  const raw =
    typeof process.env.NEXT_PUBLIC_OWNER_PORTAL_URL === 'string'
      ? process.env.NEXT_PUBLIC_OWNER_PORTAL_URL.trim()
      : ''
  return (raw || 'https://owner.kealee.com').replace(/\/$/, '')
}

/** Deep link to a single intake’s deliverable view in the owner portal. */
export function getOwnerPortalDeliverableUrl(intakeId: string, projectPath?: string): string {
  const base = getOwnerPortalBaseUrl()
  const q = projectPath ? `?projectPath=${encodeURIComponent(projectPath)}` : ''
  return `${base}/deliverables/${encodeURIComponent(intakeId)}${q}`
}
