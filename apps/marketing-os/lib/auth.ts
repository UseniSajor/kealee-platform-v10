import { auth } from '@clerk/nextjs/server'

export const MARKETING_OS_ROLES = new Set(['admin', 'super_admin', 'marketing_admin'])

export async function requireMarketingAdmin() {
  const { userId, sessionClaims } = await auth()
  if (!userId) return null
  const claims = sessionClaims as Record<string, unknown> | null
  const metadata = (claims?.metadata ?? claims?.publicMetadata ?? {}) as Record<string, unknown>
  const role = String(metadata.role ?? claims?.org_role ?? '').toLowerCase()
  if (!MARKETING_OS_ROLES.has(role)) return null
  return { user: { id: userId }, role }
}
