/**
 * Universal Kealee auth hub URL helpers.
 * Hub lives at kealee.com/auth (web-main) — all apps redirect here for login/signup.
 */

export type AuthHubIntent = 'login' | 'signup' | 'complete' | 'claim'

export interface AuthHubUrlOptions {
  /** Post-auth destination (path or full URL on *.kealee.com). */
  next?: string
  email?: string
  /** Pre-fill welcome / account completion after first purchase. */
  welcome?: boolean
  intent?: AuthHubIntent
  error?: string
  info?: string
}

function getAuthHubBase(): string {
  const raw =
    typeof process.env.NEXT_PUBLIC_AUTH_HUB_URL === 'string'
      ? process.env.NEXT_PUBLIC_AUTH_HUB_URL.trim()
      : ''
  if (raw) return raw.replace(/\/$/, '')
  const site =
    typeof process.env.NEXT_PUBLIC_SITE_URL === 'string'
      ? process.env.NEXT_PUBLIC_SITE_URL.trim()
      : 'https://kealee.com'
  return `${site.replace(/\/$/, '')}/auth`
}

export function getAuthHubBaseUrl(): string {
  return getAuthHubBase()
}

export function buildAuthHubUrl(path: 'login' | 'signup' | 'complete' | 'callback', opts?: AuthHubUrlOptions): string {
  const base = getAuthHubBase()
  const url = new URL(`${base}/${path}`)
  if (opts?.next) url.searchParams.set('next', opts.next)
  if (opts?.email) url.searchParams.set('email', opts.email)
  if (opts?.welcome) url.searchParams.set('welcome', '1')
  if (opts?.intent) url.searchParams.set('intent', opts.intent)
  if (opts?.error) url.searchParams.set('error', opts.error)
  if (opts?.info) url.searchParams.set('info', opts.info)
  return url.toString()
}

/** Cookie domain for SSO across Kealee subdomains (production). */
export function getKealeeCookieDomain(): string | undefined {
  const raw = process.env.KEALEE_AUTH_COOKIE_DOMAIN?.trim()
  if (raw) return raw
  if (process.env.NODE_ENV === 'production') return '.kealee.com'
  return undefined
}

/** Default post-login destination for intake / homeowner buyers. */
export function defaultHomeownerPortalNext(): string {
  const owner =
    process.env.NEXT_PUBLIC_OWNER_PORTAL_URL?.trim() || 'https://owner.kealee.com'
  return `${owner.replace(/\/$/, '')}/deliverables`
}
