/**
 * What is actually running.
 *
 * Every healthcheck in this platform answered `{"ok":true}` and nothing else,
 * so there was no way to tell which commit a service was serving. That is not
 * a cosmetic gap: it made "is this deployed?" unanswerable from outside, and a
 * feature that exists in the repo is indistinguishable from one that is live.
 *
 * Railway injects `RAILWAY_GIT_COMMIT_SHA` and friends at build time. Vercel
 * injects its own. Both are read here so one helper answers for either host,
 * and a local run says so rather than pretending to be a deployment.
 */

export interface BuildIdentity {
  /** Short commit SHA, or 'unknown' when the host injected nothing. */
  commit: string
  /** Full SHA when available. */
  commitFull: string | null
  branch: string | null
  /** Where this is running: the host's name, or 'local'. */
  host: 'railway' | 'vercel' | 'local'
  /** Service name as the host knows it. */
  service: string | null
  /** ISO timestamp the process started — not the build time. */
  startedAt: string
  /** Seconds since the process started. */
  uptimeSeconds: number
  /** Node major version, which has bitten this repo before. */
  node: string
}

const STARTED_AT = new Date().toISOString()

function firstDefined(...keys: string[]): string | null {
  for (const k of keys) {
    const v = process.env[k]
    if (v && v.trim()) return v.trim()
  }
  return null
}

export function buildIdentity(serviceName?: string): BuildIdentity {
  const full = firstDefined(
    'RAILWAY_GIT_COMMIT_SHA',
    'VERCEL_GIT_COMMIT_SHA',
    'GIT_COMMIT_SHA',
    'SOURCE_COMMIT',
  )
  const host: BuildIdentity['host'] =
    process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_SERVICE_NAME ? 'railway'
    : process.env.VERCEL ? 'vercel'
    : 'local'

  return {
    commit: full ? full.slice(0, 8) : 'unknown',
    commitFull: full,
    branch: firstDefined('RAILWAY_GIT_BRANCH', 'VERCEL_GIT_COMMIT_REF', 'GIT_BRANCH'),
    host,
    service: serviceName ?? firstDefined('RAILWAY_SERVICE_NAME', 'VERCEL_URL'),
    startedAt: STARTED_AT,
    uptimeSeconds: Math.round(process.uptime()),
    node: process.version,
  }
}

/**
 * Whether a named capability is present in THIS build.
 *
 * The point is to distinguish "the repo has it" from "the running service has
 * it". A caller passes what it can actually see — a registered processor, an
 * importable module — and the healthcheck reports it. Guessing from the repo
 * is what made the question unanswerable in the first place.
 */
export function capabilityReport(present: Record<string, boolean>): {
  capabilities: Record<string, boolean>
  missing: string[]
} {
  return {
    capabilities: present,
    missing: Object.entries(present).filter(([, v]) => !v).map(([k]) => k),
  }
}
