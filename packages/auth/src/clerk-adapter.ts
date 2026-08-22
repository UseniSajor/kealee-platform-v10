/** Clerk is Kealee's sole identity and session authority. */
import { auth, clerkClient } from '@clerk/nextjs/server'

export interface UnifiedUser {
  id: string
  email: string | null
  role?: string
  appMetadata?: Record<string, unknown>
  source: 'clerk'
}

/** Resolve identity from Clerk's verified request context, never client headers. */
export async function getClerkUser(): Promise<UnifiedUser | null> {
  const { userId, sessionClaims } = await auth()
  if (!userId) return null

  const claims = sessionClaims as Record<string, unknown> | null
  const metadata = (claims?.metadata ?? claims?.publicMetadata ?? {}) as Record<string, unknown>
  let email = typeof claims?.email === 'string' ? claims.email : null

  if (!email) {
    const client = await clerkClient()
    const user = await client.users.getUser(userId)
    email = user.primaryEmailAddress?.emailAddress ?? null
  }

  const role = typeof metadata.role === 'string' ? metadata.role : undefined
  return { id: userId, email, role, appMetadata: metadata, source: 'clerk' }
}

export const getUnifiedUser = getClerkUser

export async function isAuthenticated(): Promise<boolean> {
  return Boolean((await auth()).userId)
}

export async function hasRole(allowedRoles: string[] | Set<string>): Promise<boolean> {
  const user = await getClerkUser()
  if (!user?.role) return false
  const roles = Array.isArray(allowedRoles) ? new Set(allowedRoles) : allowedRoles
  return roles.has(user.role.toLowerCase())
}
