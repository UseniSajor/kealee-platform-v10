import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export const COMMAND_CENTER_API_ROLES = new Set([
  'admin',
  'super_admin',
  'ops',
  'marketing_admin',
])

export const INTELLIGENCE_UI_ROLES = new Set([
  'admin',
  'super_admin',
  'ops',
  'marketing_admin',
  'owner',
  'project_manager',
])

export function isProductionEnv(): boolean {
  return (
    process.env.NODE_ENV === 'production' ||
    process.env.VERCEL_ENV === 'production'
  )
}

export function getOpsSecret(): string | undefined {
  return process.env.KEALEE_OPS_SECRET || process.env.CRON_SECRET || undefined
}

function extractBearer(req: NextRequest): string | null {
  const auth = req.headers.get('authorization') ?? ''
  if (auth.startsWith('Bearer ')) return auth.slice(7)
  return null
}

export function verifyOpsBearer(req: NextRequest): boolean {
  const secret = getOpsSecret()
  if (!secret) return false
  const bearer = extractBearer(req)
  const xOps = req.headers.get('x-kealee-ops')
  return bearer === secret || xOps === secret
}

/**
 * Cron routes: require CRON_SECRET (or KEALEE_OPS_SECRET) in production.
 * In development, allow unauthenticated calls when no secret is configured.
 */
export function verifyCronRequest(req: NextRequest): NextResponse | null {
  const secret = getOpsSecret()

  if (!secret) {
    if (isProductionEnv()) {
      return NextResponse.json(
        { error: 'CRON_SECRET or KEALEE_OPS_SECRET must be set in production' },
        { status: 500 },
      )
    }
    return null
  }

  if (!verifyOpsBearer(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return null
}

export function hasCommandCenterApiRole(appRole: string | undefined | null): boolean {
  if (!appRole) return false
  return COMMAND_CENTER_API_ROLES.has(appRole.toLowerCase())
}

export function hasIntelligenceUiRole(appRole: string | undefined | null): boolean {
  if (!appRole) return false
  return INTELLIGENCE_UI_ROLES.has(appRole.toLowerCase())
}

export function hasOsAdminRole(appRole: string | undefined | null): boolean {
  if (!appRole) return false
  return ['admin', 'super_admin'].includes(appRole.toLowerCase())
}
