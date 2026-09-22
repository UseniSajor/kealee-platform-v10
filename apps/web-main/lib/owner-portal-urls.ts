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

let portalLiveCache: { checkedAt: number; live: boolean } | null = null
const PORTAL_LIVE_TTL_MS = 60_000

/**
 * Server-side counterpart of `isOwnerPortalReachable` — same question, asked
 * once a minute per instance so redirect handling stays cheap. A host that is
 * configured but not answering must not receive customers: they arrive at a
 * dead link (or a stale cached page) holding a paid order.
 */
export async function isOwnerPortalLive(timeoutMs = 2500): Promise<boolean> {
  if (!isOwnerPortalConfigured()) return false
  const now = Date.now()
  if (portalLiveCache && now - portalLiveCache.checkedAt < PORTAL_LIVE_TTL_MS) {
    return portalLiveCache.live
  }
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(`${getOwnerPortalBaseUrl()}/api/health`, {
      cache: 'no-store',
      signal: controller.signal,
    })
    portalLiveCache = { checkedAt: now, live: response.ok }
    return response.ok
  } catch {
    portalLiveCache = { checkedAt: now, live: false }
    return false
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Is the configured portal host actually answering right now?
 *
 * Configured is not the same as reachable: owner.kealee.com stayed in the
 * environment after its DNS record was removed, so every paid order was sent
 * to a host that no longer resolved — and a stale service worker answered with
 * an offline page, which reads to the customer as a lost order. Browser-side
 * only; an opaque `no-cors` response is enough to prove the host answered.
 */
export async function isOwnerPortalReachable(timeoutMs = 4000): Promise<boolean> {
  if (typeof window === 'undefined' || !isOwnerPortalConfigured()) return false
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    await fetch(`${getOwnerPortalBaseUrl()}/api/health`, {
      mode: 'no-cors',
      cache: 'no-store',
      credentials: 'omit',
      signal: controller.signal,
    })
    return true
  } catch {
    return false
  } finally {
    clearTimeout(timer)
  }
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
